/**
 * Format cents as US Dollars (USD)
 * Example: 5000 cents → $50.00
 */
export function formatCurrencyFromCentsUSD(
  cents: number | null | undefined
): string {
  const amountCents = Number(cents ?? 0);
  const dollars = amountCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars);
}

export function centsToUSD(cents: number): number {
  return cents / 100;
}

// Alias used by payment/revenue UI for readability.
export function formatPaymentAmountFromCentsUSD(
  amountCents: number | null | undefined
): string {
  return formatCurrencyFromCentsUSD(amountCents);
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

// Legacy aliases for backwards compatibility
export function formatCurrencyFromCentsGB(cents: number | null | undefined): string {
  return formatCurrencyFromCentsUSD(cents);
}

export function centsToGBP(cents: number): number {
  return centsToUSD(cents);
}

export function formatPaymentAmountFromCentsGB(amountCents: number | null | undefined): string {
  return formatPaymentAmountFromCentsUSD(amountCents);
}

export function gbpToCents(pounds: number): number {
  return dollarsToCents(pounds);
}