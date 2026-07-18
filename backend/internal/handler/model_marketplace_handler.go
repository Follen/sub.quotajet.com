package handler

import (
	"context"

	"github.com/Wei-Shaw/sub2api/internal/pkg/response"
	"github.com/Wei-Shaw/sub2api/internal/service"

	"github.com/gin-gonic/gin"
)

type publicModelMarketplaceBuilder interface {
	Build(context.Context) (*service.PublicModelMarketplace, error)
}

// ModelMarketplaceHandler serves the public, display-only model catalogue.
type ModelMarketplaceHandler struct {
	marketplace publicModelMarketplaceBuilder
}

// NewModelMarketplaceHandler constructs the public marketplace handler.
func NewModelMarketplaceHandler(marketplace publicModelMarketplaceBuilder) *ModelMarketplaceHandler {
	return &ModelMarketplaceHandler{marketplace: marketplace}
}

// List returns the public marketplace catalogue.
// GET /api/v1/model-marketplace
func (h *ModelMarketplaceHandler) List(c *gin.Context) {
	marketplace, err := h.marketplace.Build(c.Request.Context())
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}
	response.Success(c, marketplace)
}
