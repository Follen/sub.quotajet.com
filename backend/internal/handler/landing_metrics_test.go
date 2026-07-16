package handler

import (
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestBuildLandingMetricsAtEpoch(t *testing.T) {
	metrics := buildLandingMetrics(time.Unix(landingMetricsEpochUnix, 0).UTC())
	require.Equal(t, int64(48219037), metrics.TotalRequests)
	require.Equal(t, int64(18287), metrics.TotalUsers)
	require.Equal(t, int64(8553900), metrics.StableUptimeSeconds)
	require.Equal(t, landingMetricsEpochUnix, metrics.GeneratedAt)
}

func TestBuildLandingMetricsUsesFiveMinuteBuckets(t *testing.T) {
	metrics := buildLandingMetrics(time.Unix(landingMetricsEpochUnix+600, 0).UTC())
	require.Equal(t, int64(48219037+600*13+23+24), metrics.TotalRequests)
	require.Equal(t, int64(18287+600/72+1+2), metrics.TotalUsers)
	require.Equal(t, int64(8553900+600), metrics.StableUptimeSeconds)
}

func TestBuildLandingMetricsClampsPreEpochTime(t *testing.T) {
	metrics := buildLandingMetrics(time.Unix(landingMetricsEpochUnix-60, 0).UTC())
	require.Equal(t, int64(48219037), metrics.TotalRequests)
	require.Equal(t, int64(18287), metrics.TotalUsers)
	require.Equal(t, int64(8553900), metrics.StableUptimeSeconds)
}
