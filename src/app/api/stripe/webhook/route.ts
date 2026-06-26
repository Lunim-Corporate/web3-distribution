import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/app/lib/supabaseServer';
import { auditLog } from '@/app/lib/apiSecurity';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

function getStripe(): Stripe {
  if (!stripeSecretKey) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(stripeSecretKey, { apiVersion: '2025-04-30' as any });
}

export async function POST(req: Request) {
  if (!webhookSecret) {
    console.error('[STRIPE WEBHOOK] STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`[STRIPE WEBHOOK] Signature verification failed: ${err.message}`);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { project_id, amount_eth, user_id } = session.metadata || {};

        if (!project_id || !amount_eth || !user_id) {
          console.warn('[STRIPE WEBHOOK] Missing metadata in session:', session.id);
          break;
        }

        // Idempotency check: skip if this session was already processed
        const eventId = event.id;
        const { data: existing } = await supabaseAdmin
          .from('activities')
          .select('id')
          .eq('description', `Stripe payment confirmed: session ${session.id}`)
          .maybeSingle();

        if (existing) {
          console.log('[STRIPE WEBHOOK] Duplicate event skipped:', eventId);
          return NextResponse.json({ received: true, duplicate: true });
        }

        // Record the confirmed payment in Supabase
        await supabaseAdmin.from('activities').insert({
          project_id,
          action: 'payment_confirmed',
          description: `Stripe payment confirmed: session ${session.id}`,
          timestamp: new Date().toISOString(),
        });

        await auditLog('stripe:payment_confirmed', user_id, true, `session=${session.id} project=${project_id}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error('[STRIPE WEBHOOK] Payment failed:', paymentIntent.id);
        await auditLog('stripe:payment_failed', null, false, `paymentIntent=${paymentIntent.id}`);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        console.log('[STRIPE WEBHOOK] Refund processed:', charge.id);
        await auditLog('stripe:refund', null, true, `charge=${charge.id}`);
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('[STRIPE WEBHOOK] Processing error:', err.message);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
