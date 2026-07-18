package service

import (
	"context"
	"fmt"
	"sort"
	"strings"
)

// availableChannelLister is the small read contract the public marketplace needs from ChannelService.
type availableChannelLister interface {
	ListAvailable(context.Context) ([]AvailableChannel, error)
}

// PublicModelMarketplaceService builds the public, display-only model catalogue.
type PublicModelMarketplaceService struct {
	channels availableChannelLister
}

// NewPublicModelMarketplaceService constructs the public marketplace aggregation service.
func NewPublicModelMarketplaceService(channels availableChannelLister) *PublicModelMarketplaceService {
	return &PublicModelMarketplaceService{channels: channels}
}

// PublicModelMarketplace is the public catalogue returned to marketplace clients.
type PublicModelMarketplace struct {
	Platforms []PublicMarketplacePlatform `json:"platforms"`
}

// PublicMarketplacePlatform groups public models by inbound platform.
type PublicMarketplacePlatform struct {
	Name   string                   `json:"name"`
	Models []PublicMarketplaceModel `json:"models"`
}

// PublicMarketplaceModel merges all public provider variants for one platform/model pair.
type PublicMarketplaceModel struct {
	Name      string                      `json:"name"`
	Providers []PublicMarketplaceProvider `json:"providers"`
}

// PublicMarketplaceProvider is a public channel association without routing identifiers or health state.
type PublicMarketplaceProvider struct {
	Name        string                        `json:"name"`
	Description string                        `json:"description,omitempty"`
	GroupPrices []PublicMarketplaceGroupPrice `json:"group_prices"`
}

// PublicMarketplaceGroupPrice describes the price visible to one public group.
type PublicMarketplaceGroupPrice struct {
	Name           string                  `json:"name"`
	RateMultiplier float64                 `json:"rate_multiplier"`
	Price          *PublicMarketplacePrice `json:"price"`
}

// PublicMarketplacePrice preserves configured price presence and billing mode for display.
type PublicMarketplacePrice struct {
	BillingMode      string                          `json:"billing_mode"`
	InputPrice       *float64                        `json:"input_price"`
	OutputPrice      *float64                        `json:"output_price"`
	CacheWritePrice  *float64                        `json:"cache_write_price"`
	CacheReadPrice   *float64                        `json:"cache_read_price"`
	ImageOutputPrice *float64                        `json:"image_output_price"`
	PerRequestPrice  *float64                        `json:"per_request_price"`
	Intervals        []PublicMarketplaceTierInterval `json:"intervals"`
	Fallback         bool                            `json:"fallback"`
	DisplayOnly      bool                            `json:"display_only"`
}

// PublicMarketplaceTierInterval is a public copy of a configured pricing tier.
type PublicMarketplaceTierInterval struct {
	MinTokens       int      `json:"min_tokens"`
	MaxTokens       *int     `json:"max_tokens"`
	TierLabel       string   `json:"tier_label,omitempty"`
	InputPrice      *float64 `json:"input_price"`
	OutputPrice     *float64 `json:"output_price"`
	CacheWritePrice *float64 `json:"cache_write_price"`
	CacheReadPrice  *float64 `json:"cache_read_price"`
	PerRequestPrice *float64 `json:"per_request_price"`
}

// Build aggregates active channels and their non-exclusive groups into a stable public catalogue.
func (s *PublicModelMarketplaceService) Build(ctx context.Context) (*PublicModelMarketplace, error) {
	channels, err := s.channels.ListAvailable(ctx)
	if err != nil {
		return nil, fmt.Errorf("list available channels: %w", err)
	}

	modelsByPlatform := make(map[string]map[string]*PublicMarketplaceModel)
	for _, channel := range channels {
		if channel.Status != StatusActive {
			continue
		}

		publicGroupsByPlatform := make(map[string][]AvailableGroupRef)
		for _, group := range channel.Groups {
			if group.IsExclusive || group.Platform == "" {
				continue
			}
			publicGroupsByPlatform[group.Platform] = append(publicGroupsByPlatform[group.Platform], group)
		}
		if len(publicGroupsByPlatform) == 0 {
			continue
		}

		for _, supported := range channel.SupportedModels {
			groups := publicGroupsByPlatform[supported.Platform]
			if supported.Name == "" || len(groups) == 0 {
				continue
			}

			models, ok := modelsByPlatform[supported.Platform]
			if !ok {
				modelsByPlatform[supported.Platform] = make(map[string]*PublicMarketplaceModel)
				models = modelsByPlatform[supported.Platform]
			}

			modelKey := strings.ToLower(supported.Name)
			model, ok := models[modelKey]
			if !ok {
				model = &PublicMarketplaceModel{Name: supported.Name}
				models[modelKey] = model
			}

			provider := PublicMarketplaceProvider{Name: channel.Name, Description: channel.Description}
			for _, group := range groups {
				provider.GroupPrices = append(provider.GroupPrices, PublicMarketplaceGroupPrice{
					Name:           group.Name,
					RateMultiplier: group.RateMultiplier,
					Price:          publicMarketplacePrice(supported),
				})
			}
			sortPublicMarketplaceGroupPrices(provider.GroupPrices)
			model.Providers = append(model.Providers, provider)
		}
	}

	result := &PublicModelMarketplace{Platforms: make([]PublicMarketplacePlatform, 0, len(modelsByPlatform))}
	for platformName, models := range modelsByPlatform {
		platform := PublicMarketplacePlatform{Name: platformName, Models: make([]PublicMarketplaceModel, 0, len(models))}
		for _, model := range models {
			sortPublicMarketplaceProviders(model.Providers)
			platform.Models = append(platform.Models, *model)
		}
		sort.SliceStable(platform.Models, func(i, j int) bool {
			return comparePublicMarketplaceNames(platform.Models[i].Name, platform.Models[j].Name)
		})
		result.Platforms = append(result.Platforms, platform)
	}
	sort.SliceStable(result.Platforms, func(i, j int) bool {
		return comparePublicMarketplaceNames(result.Platforms[i].Name, result.Platforms[j].Name)
	})
	return result, nil
}

func publicMarketplacePrice(model SupportedModel) *PublicMarketplacePrice {
	if model.Pricing == nil {
		return nil
	}
	pricing := model.Pricing
	price := &PublicMarketplacePrice{
		BillingMode:      string(pricing.BillingMode),
		InputPrice:       pricing.InputPrice,
		OutputPrice:      pricing.OutputPrice,
		CacheWritePrice:  pricing.CacheWritePrice,
		CacheReadPrice:   pricing.CacheReadPrice,
		ImageOutputPrice: pricing.ImageOutputPrice,
		PerRequestPrice:  pricing.PerRequestPrice,
		Intervals:        make([]PublicMarketplaceTierInterval, 0, len(pricing.Intervals)),
		Fallback:         model.PricingSource == SupportedModelPricingSourceLiteLLMFallback,
		DisplayOnly:      model.PricingSource == SupportedModelPricingSourceLiteLLMFallback,
	}
	if price.BillingMode == "" {
		price.BillingMode = string(BillingModeToken)
	}
	for _, interval := range pricing.Intervals {
		price.Intervals = append(price.Intervals, PublicMarketplaceTierInterval{
			MinTokens:       interval.MinTokens,
			MaxTokens:       interval.MaxTokens,
			TierLabel:       interval.TierLabel,
			InputPrice:      interval.InputPrice,
			OutputPrice:     interval.OutputPrice,
			CacheWritePrice: interval.CacheWritePrice,
			CacheReadPrice:  interval.CacheReadPrice,
			PerRequestPrice: interval.PerRequestPrice,
		})
	}
	sort.SliceStable(price.Intervals, func(i, j int) bool {
		if price.Intervals[i].MinTokens != price.Intervals[j].MinTokens {
			return price.Intervals[i].MinTokens < price.Intervals[j].MinTokens
		}
		return comparePublicMarketplaceNames(price.Intervals[i].TierLabel, price.Intervals[j].TierLabel)
	})
	return price
}

func sortPublicMarketplaceProviders(providers []PublicMarketplaceProvider) {
	sort.SliceStable(providers, func(i, j int) bool {
		return comparePublicMarketplaceNames(providers[i].Name, providers[j].Name)
	})
}

func sortPublicMarketplaceGroupPrices(groups []PublicMarketplaceGroupPrice) {
	sort.SliceStable(groups, func(i, j int) bool {
		if strings.EqualFold(groups[i].Name, groups[j].Name) {
			return groups[i].RateMultiplier < groups[j].RateMultiplier
		}
		return comparePublicMarketplaceNames(groups[i].Name, groups[j].Name)
	})
}

func comparePublicMarketplaceNames(a, b string) bool {
	aLower, bLower := strings.ToLower(a), strings.ToLower(b)
	if aLower == bLower {
		return a < b
	}
	return aLower < bLower
}
