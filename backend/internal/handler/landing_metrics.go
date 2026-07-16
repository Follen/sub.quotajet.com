package handler

import (
	"time"

	"github.com/Wei-Shaw/sub2api/internal/pkg/response"
	"github.com/gin-gonic/gin"
)

const (
	landingMetricsEpochUnix     int64 = 1782496800
	landingMetricBucketSeconds  int64 = 300
	landingMetricRequestBase    int64 = 48219037
	landingMetricUserBase       int64 = 18287
	landingMetricUptimeBaseSecs int64 = 99*24*60*60 + 5*60
)

type landingMetricsResponse struct {
	TotalRequests       int64 `json:"total_requests"`
	TotalUsers          int64 `json:"total_users"`
	StableUptimeSeconds int64 `json:"stable_uptime_seconds"`
	GeneratedAt         int64 `json:"generated_at"`
}

func GetLandingMetrics(c *gin.Context) {
	response.Success(c, buildLandingMetrics(time.Now().UTC()))
}

func buildLandingMetrics(now time.Time) landingMetricsResponse {
	nowUnix := now.Unix()
	elapsed := nowUnix - landingMetricsEpochUnix
	if elapsed < 0 {
		elapsed = 0
	}
	bucket := elapsed / landingMetricBucketSeconds
	return landingMetricsResponse{
		TotalRequests:       landingMetricRequestBase + elapsed*13 + bucketedGrowth(bucket, 41, 23),
		TotalUsers:          landingMetricUserBase + elapsed/72 + bucketedGrowth(bucket, 3, 1),
		StableUptimeSeconds: landingMetricUptimeBaseSecs + elapsed,
		GeneratedAt:         nowUnix,
	}
}

func bucketedGrowth(bucket, modulus, minimum int64) int64 {
	if bucket <= 0 {
		return 0
	}
	cycles := bucket / modulus
	remainder := bucket % modulus
	return cycles*(modulus*minimum+(modulus-1)*modulus/2) +
		remainder*minimum + remainder*(remainder-1)/2
}
