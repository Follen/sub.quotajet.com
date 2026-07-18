import { apiClient } from './client'

export interface PublicMarketplaceTierInterval {
  min_tokens: number
  max_tokens: number | null
  tier_label?: string
  input_price: number | null
  output_price: number | null
  cache_write_price: number | null
  cache_read_price: number | null
  per_request_price: number | null
}

export interface PublicMarketplacePrice {
  billing_mode: 'token' | 'per_request' | 'image' | 'video' | string
  input_price: number | null
  output_price: number | null
  cache_write_price: number | null
  cache_read_price: number | null
  image_output_price: number | null
  per_request_price: number | null
  intervals: PublicMarketplaceTierInterval[]
  fallback: boolean
  display_only: boolean
}

export interface PublicMarketplaceGroupPrice {
  name: string
  rate_multiplier: number
  /** Whether this public group permits image-generation requests. */
  allow_image_generation?: boolean
  /** Effective video gate; currently derived from Grok's shared image gate. */
  allow_video_generation?: boolean
  /** Present only when the group uses an independent image multiplier. */
  image_rate_multiplier?: number | null
  /** Present only when the group uses an independent video multiplier. */
  video_rate_multiplier?: number | null
  /** Present when the public group overrides image prices by size. */
  image_prices?: PublicMarketplaceImagePrices | null
  /** Present when the public group overrides video prices by resolution. */
  video_prices?: PublicMarketplaceVideoPrices | null
  price: PublicMarketplacePrice | null
}

export interface PublicMarketplaceImagePrices {
  price_1k?: number | null
  price_2k?: number | null
  price_4k?: number | null
}

export interface PublicMarketplaceVideoPrices {
  price_480p?: number | null
  price_720p?: number | null
  price_1080p?: number | null
}

export interface PublicMarketplaceProvider {
  name: string
  description?: string
  group_prices: PublicMarketplaceGroupPrice[]
}

export interface PublicMarketplaceModel {
  name: string
  providers: PublicMarketplaceProvider[]
  platform_default_inbound_endpoints?: string[]
  capabilities?: PublicMarketplaceCapabilities | null
}

export interface PublicMarketplaceCapabilities {
  providers: boolean
  pricing: boolean
  image_generation: boolean
  video_generation: boolean
  performance: boolean
  uptime: boolean
  benchmarks: boolean
  apps: boolean
  activity: boolean
}

export interface PublicMarketplacePlatform {
  name: string
  models: PublicMarketplaceModel[]
}

export interface PublicModelMarketplace {
  version: string
  generated_at: string
  platforms: PublicMarketplacePlatform[]
}

export async function getModelMarketplace(
  options?: { signal?: AbortSignal },
): Promise<PublicModelMarketplace> {
  const { data } = await apiClient.get<PublicModelMarketplace>('/pricing', {
    signal: options?.signal,
  })
  return data
}

export const modelMarketplaceAPI = { getModelMarketplace }

export default modelMarketplaceAPI
