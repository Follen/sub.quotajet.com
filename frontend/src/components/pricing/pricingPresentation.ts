import type { PublicMarketplaceModel, PublicPricingCatalogue } from '@/api/pricing'

export interface PricingVendorOption { name: string; count: number }

export function allModels(catalogue: PublicPricingCatalogue | null | undefined): PublicMarketplaceModel[] {
  return catalogue?.platforms.flatMap((platform) => platform.models) ?? []
}

export function vendorOptions(models: PublicMarketplaceModel[]): PricingVendorOption[] {
  const counts = new Map<string, number>()
  for (const model of models) {
    for (const provider of model.providers) counts.set(provider.name, (counts.get(provider.name) ?? 0) + 1)
  }
  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, count]) => ({ name, count }))
}

export function modelGroups(model: PublicMarketplaceModel): string[] {
  return [...new Set(model.providers.flatMap((provider) => provider.group_prices.map((group) => group.name)))].sort()
}

export function modelEndpoints(model: PublicMarketplaceModel): string[] {
  return model.platform_default_inbound_endpoints ?? []
}

export function modelPrice(model: PublicMarketplaceModel, key: 'input_price' | 'output_price', unit: 'M' | 'K'): string {
  const raw = model.providers.flatMap((provider) => provider.group_prices).map((group) => group.price?.[key]).find((value): value is number => typeof value === 'number' && Number.isFinite(value))
  if (raw == null) return '—'
  const scaled = raw * (unit === 'M' ? 1_000_000 : 1_000)
  return scaled < 0.01 ? scaled.toFixed(4) : scaled.toFixed(2)
}

export function modelBillingMode(model: PublicMarketplaceModel): 'token' | 'per_request' {
  return model.providers.some((provider) => provider.group_prices.some((group) => group.price?.billing_mode === 'per_request')) ? 'per_request' : 'token'
}
