export interface LandingMetrics {
  total_requests: number
  total_users: number
  stable_uptime_seconds: number
  generated_at: number
}

export interface LandingMetricDisplay {
  requests: string
  users: string
  uptime: string
}
