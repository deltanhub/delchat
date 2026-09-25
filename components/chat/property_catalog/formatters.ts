export function formatPrice(amount?: number, curr?: string): string {
  if (!amount) return 'Price on Application';
  const sym = curr === 'NGN' ? '₦' : curr === 'USD' ? '$' : curr === 'GBP' ? '£' : '₦';
  return `${sym}${Number(amount).toLocaleString()}`;
}

export function formatLocation(city?: string, state?: string): string {
  return [city, state].filter(Boolean).join(', ') || 'Nigeria';
}
