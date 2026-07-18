export function formatMarketplacePrice(value: number, billingMode: string): string {
  if (billingMode === 'token') {
    return `$${(value * 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 12 })} / 1M tokens`
  }
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 12 })}`
}
