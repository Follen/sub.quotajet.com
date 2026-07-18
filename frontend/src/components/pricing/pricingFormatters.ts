export function formatMarketplacePrice(value: number, billingMode: string, perMillionTokensLabel: string): string {
  if (!billingMode || billingMode === 'token') {
    return `$${(value * 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 12 })} / ${perMillionTokensLabel}`
  }
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 12 })}`
}
