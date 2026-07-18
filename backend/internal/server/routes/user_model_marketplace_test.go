package routes

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/handler"
	servermiddleware "github.com/Wei-Shaw/sub2api/internal/server/middleware"
	"github.com/Wei-Shaw/sub2api/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

type routePublicModelMarketplaceBuilder struct {
	calls int
}

func (s *routePublicModelMarketplaceBuilder) Build(context.Context) (*service.PublicModelMarketplace, error) {
	s.calls++
	return &service.PublicModelMarketplace{}, nil
}

func TestRegisterUserRoutesExposesModelMarketplaceWithoutJWT(t *testing.T) {
	gin.SetMode(gin.TestMode)
	builder := &routePublicModelMarketplaceBuilder{}
	router := gin.New()
	v1 := router.Group("/api/v1")
	RegisterUserRoutes(v1, &handler.Handlers{
		User:             &handler.UserHandler{},
		APIKey:           &handler.APIKeyHandler{},
		Usage:            &handler.UsageHandler{},
		Redeem:           &handler.RedeemHandler{},
		Subscription:     &handler.SubscriptionHandler{},
		Announcement:     &handler.AnnouncementHandler{},
		ChannelMonitor:   &handler.ChannelMonitorUserHandler{},
		Totp:             &handler.TotpHandler{},
		AvailableChannel: &handler.AvailableChannelHandler{},
		ModelMarketplace: handler.NewModelMarketplaceHandler(builder),
	}, servermiddleware.JWTAuthMiddleware(func(c *gin.Context) {
		c.AbortWithStatus(http.StatusUnauthorized)
	}), nil)

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/api/v1/pricing", nil)
	router.ServeHTTP(recorder, request)

	require.Equal(t, http.StatusOK, recorder.Code)
	require.Equal(t, 1, builder.calls)
}
