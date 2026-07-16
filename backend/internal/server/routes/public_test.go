package routes

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestRegisterPublicRoutesExposesLandingMetricsWithoutAuth(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	v1 := router.Group("/api/v1")
	RegisterPublicRoutes(v1)

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/api/v1/landing/metrics", nil)
	router.ServeHTTP(recorder, request)

	require.Equal(t, http.StatusOK, recorder.Code)
	var body struct {
		Code int `json:"code"`
		Data struct {
			TotalRequests       int64 `json:"total_requests"`
			TotalUsers          int64 `json:"total_users"`
			StableUptimeSeconds int64 `json:"stable_uptime_seconds"`
			GeneratedAt         int64 `json:"generated_at"`
		} `json:"data"`
	}
	require.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &body))
	require.Equal(t, 0, body.Code)
	assert.GreaterOrEqual(t, body.Data.TotalRequests, int64(48219037))
	assert.GreaterOrEqual(t, body.Data.TotalUsers, int64(18287))
	assert.GreaterOrEqual(t, body.Data.StableUptimeSeconds, int64(8553900))
	assert.GreaterOrEqual(t, body.Data.GeneratedAt, int64(1782496800))
}
