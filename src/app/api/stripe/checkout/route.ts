import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { ETH_PRICE_USD } from '@/app/lib/constants';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia' as any,
});

export async function POST(req: Request) {
  try {
    const { amount_eth, project_id, project_name } = await req.json();
    const eth_price = ETH_PRICE_USD; // Mock price
    const amount_usd = Math.round(amount_eth * eth_price * 100); // In cents

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
      success_url: `${req.headers.get('origin')}/dashboard?stripe_success=true&project_id=${project_id}&amount_eth=${amount_eth}`,
      cancel_url: `${req.headers.get('origin')}/dashboard?stripe_cancel=true`,
      metadata: {
        project_id,
        amount_eth: amount_eth.toString(),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
