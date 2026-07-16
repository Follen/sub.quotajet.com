import { apiClient } from './client'
import type { LandingMetrics } from '@/types/landing'

export async function getLandingMetrics(): Promise<LandingMetrics> {
  const { data } = await apiClient.get<LandingMetrics>('/landing/metrics')
  return data
}
