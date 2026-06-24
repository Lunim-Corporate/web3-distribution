import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getEthPriceUSD } from '@/app/lib/ethPrice';
import { requireAuth, auditLog } from '@/app/lib/apiSecurity';
import { checkRateLimit } from '@/app/lib/rateLimit';
import { validateBody, stripeCheckoutSchema } from '@/app/lib/validation';

/**
 * Stripe instance — uses test-mode keys.
 * STRIPE_SECRET_KEY should be a test key (starts with sk_test_).
 * Production keys should NEVER be used in demo mode.
 */
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

function getStripe(): Stripe {
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }

  // Security: Warn if a live key is detected in non-production
  if (stripeSecretKey.startsWith('sk_live_') && process.env.NODE_ENV !== 'production') {
    console.error('[SECURITY] Live Stripe key detected in non-production environment!');
  }

  return new Stripe(stripeSecretKey, {
    apiVersion: '2025-04-30.basil' as any,
  });
}

export async function POST(req: Request) {
  try {
    // Rate limit: sensitive tier
    const blocked = await checkRateLimit('sensitive');
    if (blocked) return blocked;

    // Auth required
    const user = await requireAuth();

    // Validate input
    const result = await validateBody(req, stripeCheckoutSchema);
    if (result.error) return result.response;

    const { amount_eth, project_id, project_name } = result.data;

    const stripe = getStripe();
    const ethPrice = await getEthPriceUSD();
    const amount_usd = Math.round(amount_eth * ethPrice * 100); // In cents

    if (amount_usd < 50) {
      return NextResponse.json(
        { error: 'Minimum payment is $0.50 USD' },
        { status: 400 }
      );
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Revenue Distribution: ${project_name}`,
              description: `Distributing ${amount_eth} ETH to rights holders`,
            },
            unit_amount: amount_usd,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/dashboard?stripe_success=true&project_id=${project_id}&amount_eth=${amount_eth}`,
      cancel_url: `${origin}/dashboard?stripe_cancel=true`,
      metadata: {
        project_id,
        amount_eth: amount_eth.toString(),
        user_id: user.id,
      },
    });

    await auditLog('stripe:checkout', user.id, true, `session=${session.id} amount=$${(amount_usd / 100).toFixed(2)}`);

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : 'Payment processing error';
    console.error('Stripe error:', msg);

    // Don't expose Stripe internals to the client
    if (msg.includes('STRIPE_SECRET_KEY')) {
      return NextResponse.json({ error: 'Payment processing not configured' }, { status: 503 });
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
