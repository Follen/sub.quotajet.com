package handler

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	infraerrors "github.com/Wei-Shaw/sub2api/internal/pkg/errors"
	"github.com/Wei-Shaw/sub2api/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

type stubPublicModelMarketplaceBuilder struct {
	marketplace *service.PublicModelMarketplace
	err         error
	calls       int
}

func (s *stubPublicModelMarketplaceBuilder) Build(context.Context) (*service.PublicModelMarketplace, error) {
	s.calls++
	return s.marketplace, s.err
}

func TestModelMarketplaceHandlerIsPublic(t *testing.T) {
	gin.SetMode(gin.TestMode)
	builder := &stubPublicModelMarketplaceBuilder{marketplace: &service.PublicModelMarketplace{}}
	h := &ModelMarketplaceHandler{marketplace: builder}
	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/model-marketplace?user_id=999&group=private", nil)
	h.List(c)

	require.Equal(t, http.StatusOK, recorder.Code)
	require.Equal(t, 1, builder.calls)
}

func TestModelMarketplaceHandlerReturnsPublicPayload(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &ModelMarketplaceHandler{marketplace: &stubPublicModelMarketplaceBuilder{
		marketplace: &service.PublicModelMarketplace{
			Version:     service.PublicModelMarketplaceVersion,
			GeneratedAt: time.Date(2026, time.July, 18, 12, 0, 0, 0, time.UTC),
			Platforms: []service.PublicMarketplacePlatform{{
				Name: "openai",
				Models: []service.PublicMarketplaceModel{{
					Name:                            "gpt-4o",
					PlatformDefaultInboundEndpoints: []string{"/v1/chat/completions", "/v1/responses"},
					Capabilities: &service.PublicMarketplaceCapabilities{
						Providers: true,
						Pricing:   true,
					},
					Providers: []service.PublicMarketplaceProvider{{
						Name: "public-provider",
						GroupPrices: []service.PublicMarketplaceGroupPrice{{
							Name:           "public",
							RateMultiplier: 1,
						}},
					}},
				}},
			}},
		},
	}}

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/model-marketplace", nil)
	h.List(c)

	require.Equal(t, http.StatusOK, w.Code)
	require.JSONEq(t, `{
		"code": 0,
		"message": "success",
		"data": {
			"version": "v1",
			"generated_at": "2026-07-18T12:00:00Z",
			"platforms": [{
				"name": "openai",
				"models": [{
					"name": "gpt-4o",
					"platform_default_inbound_endpoints": ["/v1/chat/completions", "/v1/responses"],
					"capabilities": {
						"providers": true,
						"pricing": true,
						"image_generation": false,
						"video_generation": false,
						"performance": false,
						"uptime": false,
						"benchmarks": false,
						"apps": false,
						"activity": false
					},
					"providers": [{
						"name": "public-provider",
						"group_prices": [{
							"name": "public",
							"rate_multiplier": 1,
							"price": null
						}]
					}]
				}]
			}]
		}
	}`, w.Body.String())
}

func TestModelMarketplaceHandlerMapsServiceErrors(t *testing.T) {
	gin.SetMode(gin.TestMode)
	tests := []struct {
		name       string
		err        error
		statusCode int
		body       string
	}{
		{
			name:       "application error",
			err:        infraerrors.New(http.StatusServiceUnavailable, "marketplace_unavailable", "marketplace unavailable"),
			statusCode: http.StatusServiceUnavailable,
			body:       `{"code":503,"message":"marketplace unavailable","reason":"marketplace_unavailable"}`,
		},
		{
			name:       "unexpected error",
			err:        errors.New("database unavailable"),
			statusCode: http.StatusInternalServerError,
			body:       `{"code":500,"message":"internal error"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := &ModelMarketplaceHandler{marketplace: &stubPublicModelMarketplaceBuilder{err: tt.err}}
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/model-marketplace", nil)

			h.List(c)

			require.Equal(t, tt.statusCode, w.Code)
			require.JSONEq(t, tt.body, w.Body.String())
		})
	}
}
