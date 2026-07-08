export function formatCurrencyFromCentsUSD(cents: number | null | undefined): string {
  const amountCents = Number(cents ?? 0);
  const dollars = amountCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars);
}

export function formatPaymentAmountFromCentsUSD(amountCents: number | null | undefined): string {
  return formatCurrencyFromCentsUSD(amountCents);
}

export function centsToUSD(cents: number): number {
  return cents / 100;
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}
