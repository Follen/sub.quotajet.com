import type {
  PublicMarketplaceGroupPrice,
  PublicMarketplaceModel,
  PublicMarketplacePrice,
  PublicPricingCatalogue,
} from '@/api/pricing'

export type TokenUnit = 'M' | 'K'
export type PriceField =
  | 'input_price'
  | 'output_price'
  | 'cache_read_price'
  | 'cache_write_price'

export interface PricingCatalogueModel extends PublicMarketplaceModel {
  platform: string
}

export interface PricingVendorOption {
  name: string
  count: number
}

export interface PublicGroupPriceEntry {
  providerName: string
  group: PublicMarketplaceGroupPrice
  price: PublicMarketplacePrice | null
}

export function catalogueModels(
  catalogue: PublicPricingCatalogue | null | undefined,
): PricingCatalogueModel[] {
  return (
    catalogue?.platforms.flatMap((platform) =>
      platform.models.map((model) => ({ ...model, platform: platform.name })),
    ) ?? []
  )
}

export const allModels = catalogueModels

export function platformOptions(models: PricingCatalogueModel[]): PricingVendorOption[] {
  const counts = new Map<string, number>()
  for (const model of models) {
    counts.set(model.platform, (counts.get(model.platform) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, count]) => ({ name, count }))
}

export const vendorOptions = platformOptions

export function formatPlatformName(platform: string): string {
  const normalized = platform.trim().toLowerCase()
  const labels: Record<string, string> = {
    antigravity: 'Antigravity',
    anthropic: 'Anthropic',
    gemini: 'Gemini',
    google: 'Google',
    grok: 'Grok',
    openai: 'OpenAI',
  }
  return labels[normalized] ?? platform
}

export function modelGroups(model: PublicMarketplaceModel): string[] {
  return [
    ...new Set(
      model.providers.flatMap((provider) =>
        provider.group_prices.map((group) => group.name).filter(Boolean),
      ),
    ),
  ].sort((left, right) => left.localeCompare(right))
}

export function modelEndpoints(model: PublicMarketplaceModel): string[] {
  return [...new Set(model.platform_default_inbound_endpoints ?? [])]
}

export function modelTags(model: PublicMarketplaceModel): string[] {
  const capabilities = model.capabilities
  if (!capabilities) return []
  const visibleCapabilities: Array<keyof typeof capabilities> = [
    'image_generation',
    'video_generation',
    'performance',
    'uptime',
    'benchmarks',
    'apps',
    'activity',
  ]
  return visibleCapabilities
    .filter((capability) => capabilities[capability])
    .map((capability) => capability.replace(/_/g, ' '))
}

export function groupPriceEntries(model: PublicMarketplaceModel): PublicGroupPriceEntry[] {
  return model.providers.flatMap((provider) =>
    provider.group_prices.map((group) => ({
      providerName: provider.name,
      group,
      price: group.price,
    })),
  )
}

export function modelBillingMode(model: PublicMarketplaceModel): string {
  return (
    groupPriceEntries(model)
      .map((entry) => entry.price?.billing_mode?.trim())
      .find(Boolean) ?? 'token'
  )
}

function candidatePriceValues(
  model: PublicMarketplaceModel,
  field: PriceField | 'per_request_price' | 'image_output_price',
  selectedGroup?: string,
): number[] {
  return groupPriceEntries(model)
    .filter((entry) => !selectedGroup || entry.group.name === selectedGroup)
    .map((entry) => {
      const value = entry.price?.[field]
      if (typeof value !== 'number' || !Number.isFinite(value)) return null
      return value * (Number.isFinite(entry.group.rate_multiplier) ? entry.group.rate_multiplier : 1)
    })
    .filter((value): value is number => value !== null)
}

export function modelPriceValue(
  model: PublicMarketplaceModel,
  field: PriceField,
  unit: TokenUnit,
  selectedGroup?: string,
): number | null {
  const values = candidatePriceValues(model, field, selectedGroup)
  if (values.length === 0) return null
  return Math.min(...values) * (unit === 'M' ? 1_000_000 : 1_000)
}

export function formatCurrency(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—'
  const maximumFractionDigits = Math.abs(value) < 0.01 ? 6 : 4
  return `$${value.toLocaleString('en-US', {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  })}`
}

export function formatModelPrice(
  model: PublicMarketplaceModel,
  field: PriceField,
  unit: TokenUnit,
  selectedGroup?: string,
): string {
  return formatCurrency(modelPriceValue(model, field, unit, selectedGroup))
}

export const modelPrice = formatModelPrice

export function formatModelFixedPrice(
  model: PublicMarketplaceModel,
  selectedGroup?: string,
): string {
  const fields: Array<'per_request_price' | 'image_output_price'> = [
    'per_request_price',
    'image_output_price',
  ]
  for (const field of fields) {
    const values = candidatePriceValues(model, field, selectedGroup)
    if (values.length > 0) return formatCurrency(Math.min(...values))
  }
  return '—'
}

export function modelSearchText(model: PricingCatalogueModel): string {
  return [
    model.name,
    model.platform,
    ...model.providers.map((provider) => provider.name),
    ...modelGroups(model),
    ...modelEndpoints(model),
    ...modelTags(model),
  ]
    .join(' ')
    .toLowerCase()
}
