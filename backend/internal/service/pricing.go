package service

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"time"
)

const PublicModelMarketplaceVersion = "v1"

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
	Version     string                      `json:"version"`
	GeneratedAt time.Time                   `json:"generated_at"`
	Platforms   []PublicMarketplacePlatform `json:"platforms"`
}

// PublicMarketplacePlatform groups public models by inbound platform.
type PublicMarketplacePlatform struct {
	Name   string                   `json:"name"`
	Models []PublicMarketplaceModel `json:"models"`
}

// PublicMarketplaceModel merges all public provider variants for one platform/model pair.
type PublicMarketplaceModel struct {
	Name                            string                         `json:"name"`
	Providers                       []PublicMarketplaceProvider    `json:"providers"`
	PlatformDefaultInboundEndpoints []string                       `json:"platform_default_inbound_endpoints,omitempty"`
	Capabilities                    *PublicMarketplaceCapabilities `json:"capabilities,omitempty"`
}

// PublicMarketplaceCapabilities describes which detail sections have real,
// public data. A false flag means the UI must keep the section honest and show
// an empty state rather than inventing metrics.
type PublicMarketplaceCapabilities struct {
	Providers       bool `json:"providers"`
	Pricing         bool `json:"pricing"`
	ImageGeneration bool `json:"image_generation"`
	VideoGeneration bool `json:"video_generation"`
	Performance     bool `json:"performance"`
	Uptime          bool `json:"uptime"`
	Benchmarks      bool `json:"benchmarks"`
	Apps            bool `json:"apps"`
	Activity        bool `json:"activity"`
}

// PublicMarketplaceProvider is a public channel association without routing identifiers or health state.
type PublicMarketplaceProvider struct {
	Name        string                        `json:"name"`
	Description string                        `json:"description,omitempty"`
	GroupPrices []PublicMarketplaceGroupPrice `json:"group_prices"`
}

// PublicMarketplaceGroupPrice describes public group-default pricing and the
// generation gates that make media capability claims meaningful. Generic,
// image, and video defaults are group configuration only; private user-specific
// overrides are intentionally absent.
type PublicMarketplaceGroupPrice struct {
	Name                 string                        `json:"name"`
	RateMultiplier       float64                       `json:"rate_multiplier"`
	AllowImageGeneration bool                          `json:"allow_image_generation"`
	AllowVideoGeneration bool                          `json:"allow_video_generation"`
	ImageRateMultiplier  *float64                      `json:"image_rate_multiplier,omitempty"`
	VideoRateMultiplier  *float64                      `json:"video_rate_multiplier,omitempty"`
	ImagePrices          *PublicMarketplaceImagePrices `json:"image_prices,omitempty"`
	VideoPrices          *PublicMarketplaceVideoPrices `json:"video_prices,omitempty"`
	Price                *PublicMarketplacePrice       `json:"price"`
}

// PublicMarketplaceImagePrices contains public group-default image prices by
// size. Pointer fields preserve an explicitly configured zero and omit tiers
// that have no group override.
type PublicMarketplaceImagePrices struct {
	Price1K *float64 `json:"price_1k,omitempty"`
	Price2K *float64 `json:"price_2k,omitempty"`
	Price4K *float64 `json:"price_4k,omitempty"`
}

// PublicMarketplaceVideoPrices contains public group-default video prices by
// resolution. Pointer fields preserve an explicitly configured zero and omit
// resolutions that have no group override.
type PublicMarketplaceVideoPrices struct {
	Price480P  *float64 `json:"price_480p,omitempty"`
	Price720P  *float64 `json:"price_720p,omitempty"`
	Price1080P *float64 `json:"price_1080p,omitempty"`
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

		for platform, groups := range publicGroupsByPlatform {
			for _, group := range groups {
				modelNames := group.Models
				if len(modelNames) == 0 {
					for _, supported := range channel.SupportedModels {
						if supported.Platform == platform && supported.Name != "" && !hasConfiguredGroupModels(groups) {
							modelNames = append(modelNames, supported.Name)
						}
					}
				}
				for _, modelName := range modelNames {
					supported := findSupportedModel(channel.SupportedModels, platform, modelName)
					if supported.Name == "" {
						supported = SupportedModel{Name: modelName, Platform: platform}
					}
					addPublicMarketplaceModel(modelsByPlatform, channel, supported, []AvailableGroupRef{group})
				}
			}
		}
	}

	result := &PublicModelMarketplace{
		Version:     PublicModelMarketplaceVersion,
		GeneratedAt: time.Now().UTC(),
		Platforms:   make([]PublicMarketplacePlatform, 0, len(modelsByPlatform)),
	}
	for platformName, models := range modelsByPlatform {
		platform := PublicMarketplacePlatform{Name: platformName, Models: make([]PublicMarketplaceModel, 0, len(models))}
		for _, model := range models {
			sortPublicMarketplaceProviders(model.Providers)
			model.Capabilities = publicMarketplaceCapabilities(*model)
			model.PlatformDefaultInboundEndpoints = publicMarketplacePlatformDefaultInboundEndpoints(platformName, *model)
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

func addPublicMarketplaceModel(modelsByPlatform map[string]map[string]*PublicMarketplaceModel, channel AvailableChannel, supported SupportedModel, groups []AvailableGroupRef) {
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

	providerIndex := -1
	for i := range model.Providers {
		if model.Providers[i].Name == channel.Name {
			providerIndex = i
			break
		}
	}
	if providerIndex < 0 {
		model.Providers = append(model.Providers, PublicMarketplaceProvider{Name: channel.Name, Description: channel.Description})
		providerIndex = len(model.Providers) - 1
	}
	provider := &model.Providers[providerIndex]
	for _, group := range groups {
		provider.GroupPrices = append(provider.GroupPrices, PublicMarketplaceGroupPrice{
			Name:                 group.Name,
			RateMultiplier:       group.RateMultiplier,
			AllowImageGeneration: group.AllowImageGeneration,
			AllowVideoGeneration: effectiveAvailableGroupVideoPermission(group),
			ImageRateMultiplier:  publicMarketplaceIndependentRate(group.ImageRateIndependent, group.ImageRateMultiplier),
			VideoRateMultiplier:  publicMarketplaceIndependentRate(group.VideoRateIndependent, group.VideoRateMultiplier),
			ImagePrices:          publicMarketplaceImagePrices(group),
			VideoPrices:          publicMarketplaceVideoPrices(group),
			Price:                publicMarketplacePrice(supported),
		})
	}
	sortPublicMarketplaceGroupPrices(provider.GroupPrices)
}

func hasConfiguredGroupModels(groups []AvailableGroupRef) bool {
	for _, group := range groups {
		if len(group.Models) > 0 {
			return true
		}
	}
	return false
}

func findSupportedModel(models []SupportedModel, platform, name string) SupportedModel {
	for _, model := range models {
		if model.Platform == platform && strings.EqualFold(model.Name, name) {
			return model
		}
	}
	return SupportedModel{}
}

func containsModel(models []string, name string) bool {
	for _, model := range models {
		if strings.EqualFold(strings.TrimSpace(model), name) {
			return true
		}
	}
	return false
}

func publicMarketplaceIndependentRate(independent bool, multiplier float64) *float64 {
	if !independent {
		return nil
	}
	// Keep zero as a meaningful configured public default while omitting the
	// field entirely when the independent mode is disabled.
	value := multiplier
	return &value
}

func publicMarketplaceCapabilities(model PublicMarketplaceModel) *PublicMarketplaceCapabilities {
	capabilities := &PublicMarketplaceCapabilities{
		Providers: len(model.Providers) > 0,
	}
	for _, provider := range model.Providers {
		for _, groupPrice := range provider.GroupPrices {
			if groupPrice.Price != nil {
				capabilities.Pricing = true
			}
			if publicMarketplaceImagePricesPublished(groupPrice.ImagePrices) {
				capabilities.Pricing = true
			}
			if publicMarketplaceVideoPricesPublished(groupPrice.VideoPrices) {
				capabilities.Pricing = true
			}
			if groupPrice.AllowImageGeneration && publicMarketplaceGroupHasImageCapability(groupPrice.Price, groupPrice) {
				capabilities.ImageGeneration = true
			}
			if groupPrice.AllowVideoGeneration && publicMarketplaceGroupHasVideoCapability(groupPrice.Price, groupPrice) {
				capabilities.VideoGeneration = true
			}
		}
	}
	return capabilities
}

func effectiveAvailableGroupVideoPermission(group AvailableGroupRef) bool {
	if group.AllowVideoGeneration {
		return true
	}
	return strings.EqualFold(strings.TrimSpace(group.Platform), PlatformGrok) && group.AllowImageGeneration
}

func publicMarketplaceGroupHasImageCapability(price *PublicMarketplacePrice, groupPrice PublicMarketplaceGroupPrice) bool {
	if publicMarketplaceImagePricesPublished(groupPrice.ImagePrices) {
		return true
	}
	return price != nil && (strings.EqualFold(price.BillingMode, string(BillingModeImage)) || price.ImageOutputPrice != nil)
}

func publicMarketplaceGroupHasVideoCapability(price *PublicMarketplacePrice, groupPrice PublicMarketplaceGroupPrice) bool {
	if publicMarketplaceVideoPricesPublished(groupPrice.VideoPrices) {
		return true
	}
	return price != nil && strings.EqualFold(price.BillingMode, string(BillingModeVideo))
}

func publicMarketplaceImagePricesPublished(prices *PublicMarketplaceImagePrices) bool {
	return prices != nil && (prices.Price1K != nil || prices.Price2K != nil || prices.Price4K != nil)
}

func publicMarketplaceVideoPricesPublished(prices *PublicMarketplaceVideoPrices) bool {
	return prices != nil && (prices.Price480P != nil || prices.Price720P != nil || prices.Price1080P != nil)
}

// publicMarketplacePlatformDefaultInboundEndpoints describes canonical inbound
// routes chosen by the account platform. It is a platform-routed default, not
// an upstream health/capability probe; private account metadata is never
// exposed.
func publicMarketplacePlatformDefaultInboundEndpoints(platform string, model PublicMarketplaceModel) []string {
	endpoints := make(map[string]struct{})
	switch strings.ToLower(strings.TrimSpace(platform)) {
	case PlatformOpenAI:
		endpoints["/v1/chat/completions"] = struct{}{}
		endpoints["/v1/responses"] = struct{}{}
		endpoints["/v1/embeddings"] = struct{}{}
	case PlatformGrok:
		endpoints["/v1/chat/completions"] = struct{}{}
		endpoints["/v1/responses"] = struct{}{}
	case PlatformAnthropic:
		endpoints["/v1/messages"] = struct{}{}
	case PlatformGemini:
		endpoints["/v1beta/models"] = struct{}{}
	case PlatformAntigravity:
		endpoints["/v1/messages"] = struct{}{}
		endpoints["/v1beta/models"] = struct{}{}
	}

	if model.Capabilities != nil {
		if model.Capabilities.ImageGeneration && (strings.EqualFold(platform, PlatformOpenAI) || strings.EqualFold(platform, PlatformGrok)) {
			endpoints["/v1/images/generations"] = struct{}{}
		}
		if model.Capabilities.VideoGeneration && strings.EqualFold(platform, PlatformGrok) {
			endpoints["/v1/videos/generations"] = struct{}{}
		}
	}

	order := []string{
		"/v1/messages",
		"/v1/chat/completions",
		"/v1/responses",
		"/v1/embeddings",
		"/v1/images/generations",
		"/v1/videos/generations",
		"/v1beta/models",
	}
	result := make([]string, 0, len(endpoints))
	for _, endpoint := range order {
		if _, ok := endpoints[endpoint]; ok {
			result = append(result, endpoint)
		}
	}
	return result
}

func publicMarketplaceImagePrices(group AvailableGroupRef) *PublicMarketplaceImagePrices {
	if group.ImagePrice1K == nil && group.ImagePrice2K == nil && group.ImagePrice4K == nil {
		return nil
	}
	return &PublicMarketplaceImagePrices{
		Price1K: cloneMarketplaceFloat64(group.ImagePrice1K),
		Price2K: cloneMarketplaceFloat64(group.ImagePrice2K),
		Price4K: cloneMarketplaceFloat64(group.ImagePrice4K),
	}
}

func publicMarketplaceVideoPrices(group AvailableGroupRef) *PublicMarketplaceVideoPrices {
	if group.VideoPrice480P == nil && group.VideoPrice720P == nil && group.VideoPrice1080P == nil {
		return nil
	}
	return &PublicMarketplaceVideoPrices{
		Price480P:  cloneMarketplaceFloat64(group.VideoPrice480P),
		Price720P:  cloneMarketplaceFloat64(group.VideoPrice720P),
		Price1080P: cloneMarketplaceFloat64(group.VideoPrice1080P),
	}
}

func cloneMarketplaceFloat64(value *float64) *float64 {
	if value == nil {
		return nil
	}
	cloned := *value
	return &cloned
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
