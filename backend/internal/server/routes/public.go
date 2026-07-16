package routes

import (
	"github.com/Wei-Shaw/sub2api/internal/handler"
	"github.com/gin-gonic/gin"
)

func RegisterPublicRoutes(v1 *gin.RouterGroup) {
	v1.GET("/landing/metrics", handler.GetLandingMetrics)
}
