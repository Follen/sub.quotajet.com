package routes

import (
	"github.com/Wei-Shaw/sub2api/internal/handler"
	"github.com/gin-gonic/gin"
)

func RegisterPublicRoutes(v1 *gin.RouterGroup, statusHandlers ...gin.HandlerFunc) {
	v1.GET("/landing/metrics", handler.GetLandingMetrics)
	if len(statusHandlers) > 0 && statusHandlers[0] != nil {
		v1.GET("/status", statusHandlers[0])
	}
}
