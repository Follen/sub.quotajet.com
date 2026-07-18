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
  billing_mode: 'token' | 'per_request' | 'image' | string
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
  price: PublicMarketplacePrice | null
}

export interface PublicMarketplaceProvider {
  name: string
  description?: string
  group_prices: PublicMarketplaceGroupPrice[]
}

export interface PublicMarketplaceModel {
  name: string
  providers: PublicMarketplaceProvider[]
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
  const { data } = await apiClient.get<PublicModelMarketplace>('/model-marketplace', {
    signal: options?.signal,
  })
  return data
}

export const modelMarketplaceAPI = { getModelMarketplace }

export default modelMarketplaceAPI
