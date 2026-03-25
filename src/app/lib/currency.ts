/**
 * Format pence (cents) as Great Britain Pounds (GBP)
 * Example: 5000 pence → £50.00
 */
export function formatCurrencyFromCentsGB(
  pence: number | null | undefined
): string {
  const cents = Number(pence ?? 0);
  const pounds = cents / 100;
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(pounds);
}

export function centsToGBP(cents: number): number {
  return cents / 100;
}

// Alias used by payment/revenue UI for readability.
export function formatPaymentAmountFromCentsGB(
  amountCents: number | null | undefined
): string {
  return formatCurrencyFromCentsGB(amountCents);
}

export function gbpToCents(pounds: number): number {
  return Math.round(pounds * 100);
}