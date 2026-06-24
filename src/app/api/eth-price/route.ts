import { NextResponse } from 'next/server';
import { getEthPriceUSD } from '@/app/lib/ethPrice';

/**
 * GET /api/eth-price
 * 
 * Returns the current live ETH/USD price.
 * Used by client-side components to display accurate pricing.
 * Response is cached for 60s via Cache-Control.
 */
export async function GET() {
  try {
    const price = await getEthPriceUSD();

    return NextResponse.json(
      {
        price,
        currency: 'USD',
        source: 'coingecko',
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (err: any) {
    console.error('[api/eth-price] Error:', err.message);
    return NextResponse.json(
      { error: 'Failed to fetch ETH price' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
