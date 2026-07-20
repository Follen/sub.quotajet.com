package service

import (
	"context"
	"encoding/json"
	"reflect"
	"testing"

	"github.com/stretchr/testify/require"
)

type stubAvailableChannelLister struct {
	channels []AvailableChannel
	err      error
}

type stubPricingGroupLister struct {
	groups []Group
	err    error
}

func (s stubPricingGroupLister) ListActive(context.Context) ([]Group, error) {
	return s.groups, s.err
}

func (s stubAvailableChannelLister) ListAvailable(context.Context) ([]AvailableChannel, error) {
	return s.channels, s.err
}

func TestBuildPublicModelMarketplaceIncludesRefreshMetadata(t *testing.T) {
	marketplace := NewPublicModelMarketplaceService(stubAvailableChannelLister{})

	result, err := marketplace.Build(context.Background())

	require.NoError(t, err)
	require.Equal(t, PublicModelMarketplaceVersion, result.Version)
	require.False(t, result.GeneratedAt.IsZero())
}

func TestBuildPublicModelMarketplaceFiltersExclusiveGroupsAndInactiveChannels(t *testing.T) {
	marketplace := NewPublicModelMarketplaceService(stubAvailableChannelLister{channels: []AvailableChannel{
		{
			Name:            "inactive-channel",
			Status:          "inactive",
			Groups:          []AvailableGroupRef{{Name: "public", Platform: "openai"}},
			SupportedModels: []SupportedModel{{Name: "gpt-inactive", Platform: "openai"}},
		},
		{
			Name:            "private-channel",
			Status:          StatusActive,
			Groups:          []AvailableGroupRef{{Name: "private", Platform: "openai", IsExclusive: true}},
			SupportedModels: []SupportedModel{{Name: "gpt-private", Platform: "openai"}},
		},
		{
			Name:            "public-channel",
			Status:          StatusActive,
			Groups:          []AvailableGroupRef{{Name: "public", Platform: "openai"}},
			SupportedModels: []SupportedModel{{Name: "gpt-public", Platform: "openai"}},
		},
	}})

	result, err := marketplace.Build(context.Background())
	require.NoError(t, err)
	require.Len(t, result.Platforms, 1)
	require.Equal(t, "openai", result.Platforms[0].Name)
	require.Equal(t, []string{"gpt-public"}, publicMarketplaceModelNames(result.Platforms[0].Models))
}

func TestBuildPublicModelMarketplaceUsesPublicGroupModelsAsTheMatchSource(t *testing.T) {
	marketplace := NewPublicModelMarketplaceService(stubAvailableChannelLister{channels: []AvailableChannel{{
		Name:   "provider",
		Status: StatusActive,
		Groups: []AvailableGroupRef{{Name: "public", Platform: "openai", Models: []string{"gpt-group"}}},
		SupportedModels: []SupportedModel{
			{Name: "gpt-group", Platform: "openai"},
			{Name: "gpt-channel-only", Platform: "openai"},
		},
	}}})

	result, err := marketplace.Build(context.Background())
	require.NoError(t, err)
	require.Len(t, result.Platforms, 1)
	require.Equal(t, []string{"gpt-group"}, publicMarketplaceModelNames(result.Platforms[0].Models))
}

func TestBuildPublicModelMarketplaceIncludesModelsFromUnboundPublicGroups(t *testing.T) {
	marketplace := NewPublicModelMarketplaceService(stubAvailableChannelLister{}, stubPricingGroupLister{groups: []Group{{
		ID: 11, Name: "OpenAI public", Platform: "openai", Status: StatusActive,
		ModelsListConfig: GroupModelsListConfig{Enabled: true, Models: []string{"gpt-4.1"}},
	}}})

	result, err := marketplace.Build(context.Background())
	require.NoError(t, err)
	require.Len(t, result.Platforms, 1)
	require.Equal(t, []string{"gpt-4.1"}, publicMarketplaceModelNames(result.Platforms[0].Models))
}

func TestBuildPublicModelMarketplaceMergesModelsAndPreservesAllPublicGroupPrices(t *testing.T) {
	marketplace := NewPublicModelMarketplaceService(stubAvailableChannelLister{channels: []AvailableChannel{
		{
			Name:   "provider-b",
			Status: StatusActive,
			Groups: []AvailableGroupRef{{Name: "standard", Platform: "openai", RateMultiplier: 1.2}},
			SupportedModels: []SupportedModel{{
				Name: "gpt-5", Platform: "openai",
				Pricing: &ChannelModelPricing{BillingMode: BillingModeToken, InputPrice: testMarketplaceFloat64(2e-6)},
			}},
		},
		{
			Name:   "provider-a",
			Status: StatusActive,
			Groups: []AvailableGroupRef{
				{Name: "enterprise", Platform: "openai", RateMultiplier: 0.8},
				{Name: "standard", Platform: "openai", RateMultiplier: 1.0},
			},
			SupportedModels: []SupportedModel{{
				Name: "gpt-5", Platform: "openai",
				Pricing: &ChannelModelPricing{BillingMode: BillingModeToken, OutputPrice: testMarketplaceFloat64(8e-6)},
			}},
		},
	}})

	result, err := marketplace.Build(context.Background())
	require.NoError(t, err)
	require.Len(t, result.Platforms, 1)
	require.Len(t, result.Platforms[0].Models, 1)
	model := result.Platforms[0].Models[0]
	require.Equal(t, "gpt-5", model.Name)
	require.Len(t, model.Providers, 2)
	require.Equal(t, []string{"provider-a", "provider-b"}, publicMarketplaceProviderNames(model.Providers))
	require.Equal(t, []string{"enterprise", "standard"}, publicMarketplaceGroupNames(model.Providers[0].GroupPrices))
	require.InDelta(t, 0.8, model.Providers[0].GroupPrices[0].RateMultiplier, 0)
	require.NotNil(t, model.Providers[0].GroupPrices[0].Price.OutputPrice)
	require.NotNil(t, model.Providers[1].GroupPrices[0].Price.InputPrice)
}

func TestBuildPublicModelMarketplacePreservesTierIntervalsAndFallbackMarker(t *testing.T) {
	marketplace := NewPublicModelMarketplaceService(stubAvailableChannelLister{channels: []AvailableChannel{{
		Name:   "fallback-provider",
		Status: StatusActive,
		Groups: []AvailableGroupRef{{Name: "public", Platform: "anthropic", RateMultiplier: 1}},
		SupportedModels: []SupportedModel{{
			Name: "claude-test", Platform: "anthropic", PricingSource: SupportedModelPricingSourceLiteLLMFallback,
			Pricing: &ChannelModelPricing{
				BillingMode: BillingModeToken,
				Intervals: []PricingInterval{
					{MinTokens: 0, MaxTokens: testMarketplaceInt(128000), TierLabel: "standard", InputPrice: testMarketplaceFloat64(3e-6)},
					{MinTokens: 128000, MaxTokens: nil, TierLabel: "long", OutputPrice: testMarketplaceFloat64(15e-6)},
				},
			},
		}},
	}}})

	result, err := marketplace.Build(context.Background())
	require.NoError(t, err)
	price := result.Platforms[0].Models[0].Providers[0].GroupPrices[0].Price
	require.True(t, price.DisplayOnly)
	require.True(t, price.Fallback)
	require.Len(t, price.Intervals, 2)
	require.Equal(t, 128000, *price.Intervals[0].MaxTokens)
	require.Nil(t, price.Intervals[1].MaxTokens)
	require.Equal(t, "long", price.Intervals[1].TierLabel)
}

func TestBuildPublicModelMarketplacePreservesEmptyBillingModeAndZeroPrice(t *testing.T) {
	marketplace := NewPublicModelMarketplaceService(stubAvailableChannelLister{channels: []AvailableChannel{{
		Name:   "provider",
		Status: StatusActive,
		Groups: []AvailableGroupRef{{Name: "public", Platform: "openai", RateMultiplier: 1}},
		SupportedModels: []SupportedModel{{
			Name: "unconfigured-mode", Platform: "openai",
			Pricing: &ChannelModelPricing{
				InputPrice: testMarketplaceFloat64(0),
			},
		}},
	}}})

	result, err := marketplace.Build(context.Background())
	require.NoError(t, err)
	price := result.Platforms[0].Models[0].Providers[0].GroupPrices[0].Price
	require.Empty(t, price.BillingMode)
	require.NotNil(t, price.InputPrice)
	require.Zero(t, *price.InputPrice)
	require.Nil(t, price.OutputPrice)

	encoded, err := json.Marshal(price)
	require.NoError(t, err)
	var payload map[string]any
	require.NoError(t, json.Unmarshal(encoded, &payload))
	value, ok := payload["image_input_price"]
	require.True(t, ok)
	require.Nil(t, value)
}

func TestBuildPublicModelMarketplacePublishesImageInputPrice(t *testing.T) {
	imageInputPrice := 2.5e-7
	marketplace := NewPublicModelMarketplaceService(stubAvailableChannelLister{channels: []AvailableChannel{{
		Name:   "image-provider",
		Status: StatusActive,
		Groups: []AvailableGroupRef{{Name: "public", Platform: PlatformOpenAI, RateMultiplier: 1, AllowImageGeneration: true}},
		SupportedModels: []SupportedModel{{
			Name:     "gpt-image-2",
			Platform: PlatformOpenAI,
			Pricing: &ChannelModelPricing{
				BillingMode:     BillingModeToken,
				ImageInputPrice: &imageInputPrice,
			},
		}},
	}}})

	result, err := marketplace.Build(context.Background())
	require.NoError(t, err)
	price := result.Platforms[0].Models[0].Providers[0].GroupPrices[0].Price
	require.NotNil(t, price)

	encoded, err := json.Marshal(price)
	require.NoError(t, err)
	var payload map[string]any
	require.NoError(t, json.Unmarshal(encoded, &payload))
	value, ok := payload["image_input_price"]
	require.True(t, ok)
	require.InDelta(t, imageInputPrice, value, 1e-12)
	require.False(t, result.Platforms[0].Models[0].Capabilities.ImageGeneration)
	require.NotContains(t, result.Platforms[0].Models[0].PlatformDefaultInboundEndpoints, "/v1/images/generations")
}

func TestBuildPublicModelMarketplaceExposesIndependentImageDefaultWithoutUserRate(t *testing.T) {
	marketplace := NewPublicModelMarketplaceService(stubAvailableChannelLister{channels: []AvailableChannel{{
		Name:   "image-provider",
		Status: StatusActive,
		Groups: []AvailableGroupRef{{
			Name:                 "public",
			Platform:             "openai",
			RateMultiplier:       1.5,
			ImageRateIndependent: true,
			ImageRateMultiplier:  0.5,
		}},
		SupportedModels: []SupportedModel{{
			Name:     "image-model",
			Platform: "openai",
			Pricing: &ChannelModelPricing{
				BillingMode:     BillingModeImage,
				PerRequestPrice: testMarketplaceFloat64(0.04),
			},
		}},
	}}})

	result, err := marketplace.Build(context.Background())
	require.NoError(t, err)
	groupPrice := result.Platforms[0].Models[0].Providers[0].GroupPrices[0]
	require.InDelta(t, 1.5, groupPrice.RateMultiplier, 0)
	require.NotNil(t, groupPrice.ImageRateMultiplier)
	require.InDelta(t, 0.5, *groupPrice.ImageRateMultiplier, 0)
	// User-specific group rates are deliberately not part of the public DTO.
	_, hasUserRate := reflect.TypeOf(groupPrice).FieldByName("UserRateMultiplier")
	require.False(t, hasUserRate)
}

func TestBuildPublicModelMarketplacePreservesIndependentMediaPriceOverrides(t *testing.T) {
	image1K, image2K, image4K := 0.11, 0.22, 0.33
	video480P, video720P, video1080P := 0.04, 0.07, 0.0
	marketplace := NewPublicModelMarketplaceService(stubAvailableChannelLister{channels: []AvailableChannel{
		{
			Name:   "image-provider",
			Status: StatusActive,
			Groups: []AvailableGroupRef{{
				Name: "public", Platform: "openai",
				ImagePrice1K: &image1K, ImagePrice2K: &image2K, ImagePrice4K: &image4K,
			}},
			SupportedModels: []SupportedModel{{
				Name: "image-model", Platform: "openai",
				Pricing: &ChannelModelPricing{BillingMode: BillingModeImage},
			}},
		},
		{
			Name:   "video-provider",
			Status: StatusActive,
			Groups: []AvailableGroupRef{{
				Name: "public", Platform: "grok",
				VideoPrice480P: &video480P, VideoPrice720P: &video720P, VideoPrice1080P: &video1080P,
			}},
			SupportedModels: []SupportedModel{{
				Name: "video-model", Platform: "grok",
				Pricing: &ChannelModelPricing{BillingMode: BillingModeVideo},
			}},
		},
	}})

	result, err := marketplace.Build(context.Background())
	require.NoError(t, err)

	imageGroup := result.Platforms[1].Models[0].Providers[0].GroupPrices[0]
	require.NotNil(t, imageGroup.ImagePrices)
	require.InDelta(t, image1K, *imageGroup.ImagePrices.Price1K, 0)
	require.InDelta(t, image2K, *imageGroup.ImagePrices.Price2K, 0)
	require.InDelta(t, image4K, *imageGroup.ImagePrices.Price4K, 0)

	videoGroup := result.Platforms[0].Models[0].Providers[0].GroupPrices[0]
	require.NotNil(t, videoGroup.VideoPrices)
	require.InDelta(t, video480P, *videoGroup.VideoPrices.Price480P, 0)
	require.InDelta(t, video720P, *videoGroup.VideoPrices.Price720P, 0)
	require.NotNil(t, videoGroup.VideoPrices.Price1080P)
	require.InDelta(t, video1080P, *videoGroup.VideoPrices.Price1080P, 0)
}

func TestBuildPublicModelMarketplacePublishesMediaOverrideCapabilityWithoutChannelPrice(t *testing.T) {
	image1K := 0.11
	marketplace := NewPublicModelMarketplaceService(stubAvailableChannelLister{channels: []AvailableChannel{{
		Name:            "image-provider",
		Status:          StatusActive,
		Groups:          []AvailableGroupRef{{Name: "public", Platform: PlatformOpenAI, AllowImageGeneration: true, ImagePrice1K: &image1K}},
		SupportedModels: []SupportedModel{{Name: "image-model", Platform: PlatformOpenAI}},
	}}})

	result, err := marketplace.Build(context.Background())
	require.NoError(t, err)
	model := result.Platforms[0].Models[0]
	group := model.Providers[0].GroupPrices[0]
	require.Nil(t, group.Price)
	require.NotNil(t, group.ImagePrices)
	require.NotNil(t, model.Capabilities)
	require.True(t, model.Capabilities.Pricing)
	require.True(t, model.Capabilities.ImageGeneration)
	require.Contains(t, model.PlatformDefaultInboundEndpoints, "/v1/images/generations")
}

func TestBuildPublicModelMarketplaceMediaCapabilitiesRequireGroupGenerationPermission(t *testing.T) {
	imagePrice := 0.11
	videoPrice := 0.04
	marketplace := NewPublicModelMarketplaceService(stubAvailableChannelLister{channels: []AvailableChannel{
		{
			Name:   "disabled-image-provider",
			Status: StatusActive,
			Groups: []AvailableGroupRef{{
				Name: "disabled-image", Platform: PlatformOpenAI,
				AllowImageGeneration: false, ImagePrice1K: &imagePrice,
			}},
			SupportedModels: []SupportedModel{{
				Name: "disabled-image-model", Platform: PlatformOpenAI,
				Pricing: &ChannelModelPricing{BillingMode: BillingModeImage},
			}},
		},
		{
			Name:   "enabled-image-provider",
			Status: StatusActive,
			Groups: []AvailableGroupRef{{
				Name: "enabled-image", Platform: PlatformOpenAI,
				AllowImageGeneration: true, ImagePrice1K: &imagePrice,
			}},
			SupportedModels: []SupportedModel{{
				Name: "enabled-image-model", Platform: PlatformOpenAI,
				Pricing: &ChannelModelPricing{BillingMode: BillingModeImage},
			}},
		},
		{
			Name:   "enabled-video-provider",
			Status: StatusActive,
			Groups: []AvailableGroupRef{{
				Name: "enabled-video", Platform: PlatformGrok,
				AllowImageGeneration: true, VideoPrice480P: &videoPrice,
			}},
			SupportedModels: []SupportedModel{{
				Name: "enabled-video-model", Platform: PlatformGrok,
				Pricing: &ChannelModelPricing{BillingMode: BillingModeVideo},
			}},
		},
		{
			Name:   "disabled-video-provider",
			Status: StatusActive,
			Groups: []AvailableGroupRef{{
				Name: "disabled-video", Platform: PlatformGrok,
				AllowImageGeneration: false, VideoPrice480P: &videoPrice,
			}},
			SupportedModels: []SupportedModel{{
				Name: "disabled-video-model", Platform: PlatformGrok,
				Pricing: &ChannelModelPricing{BillingMode: BillingModeVideo},
			}},
		},
	}})

	result, err := marketplace.Build(context.Background())
	require.NoError(t, err)

	capabilityByModel := make(map[string]*PublicMarketplaceCapabilities)
	for _, platform := range result.Platforms {
		for _, model := range platform.Models {
			capabilityByModel[model.Name] = model.Capabilities
		}
	}
	require.False(t, capabilityByModel["disabled-image-model"].ImageGeneration)
	require.True(t, capabilityByModel["enabled-image-model"].ImageGeneration)
	require.True(t, capabilityByModel["enabled-video-model"].VideoGeneration)
	require.False(t, capabilityByModel["disabled-video-model"].VideoGeneration)
}

func TestBuildPublicModelMarketplacePublishesEndpointAndCapabilityMetadata(t *testing.T) {
	marketplace := NewPublicModelMarketplaceService(stubAvailableChannelLister{channels: []AvailableChannel{{
		Name:   "provider",
		Status: StatusActive,
		Groups: []AvailableGroupRef{{Name: "public", Platform: "openai", RateMultiplier: 1}},
		SupportedModels: []SupportedModel{{
			Name:     "gpt-test",
			Platform: "openai",
			Pricing:  &ChannelModelPricing{BillingMode: BillingModeToken, InputPrice: testMarketplaceFloat64(1e-6)},
		}},
	}}})

	result, err := marketplace.Build(context.Background())
	require.NoError(t, err)
	model := result.Platforms[0].Models[0]
	require.Equal(t, []string{"/v1/chat/completions", "/v1/responses", "/v1/embeddings"}, model.PlatformDefaultInboundEndpoints)
	require.NotNil(t, model.Capabilities)
	require.True(t, model.Capabilities.Providers)
	require.True(t, model.Capabilities.Pricing)
	require.False(t, model.Capabilities.Benchmarks)
}

func TestBuildPublicModelMarketplaceSortsPlatformsModelsAndGroups(t *testing.T) {
	marketplace := NewPublicModelMarketplaceService(stubAvailableChannelLister{channels: []AvailableChannel{
		{
			Name:   "z-provider",
			Status: StatusActive,
			Groups: []AvailableGroupRef{
				{Name: "zeta", Platform: "z-platform", RateMultiplier: 1},
				{Name: "alpha", Platform: "z-platform", RateMultiplier: 1},
			},
			SupportedModels: []SupportedModel{
				{Name: "z-model", Platform: "z-platform"},
				{Name: "a-model", Platform: "z-platform"},
			},
		},
		{
			Name:            "a-provider",
			Status:          StatusActive,
			Groups:          []AvailableGroupRef{{Name: "public", Platform: "a-platform", RateMultiplier: 1}},
			SupportedModels: []SupportedModel{{Name: "a-model", Platform: "a-platform"}},
		},
	}})

	result, err := marketplace.Build(context.Background())
	require.NoError(t, err)
	require.Equal(t, []string{"a-platform", "z-platform"}, publicMarketplacePlatformNames(result.Platforms))
	require.Equal(t, []string{"a-model", "z-model"}, publicMarketplaceModelNames(result.Platforms[1].Models))
	require.Equal(t, []string{"alpha", "zeta"}, publicMarketplaceGroupNames(result.Platforms[1].Models[0].Providers[0].GroupPrices))

	// The contract is deliberately a public DTO: private routing/status identifiers must not leak.
	provider := result.Platforms[1].Models[0].Providers[0]
	providerType := reflect.TypeOf(provider)
	_, exposesChannelID := providerType.FieldByName("ChannelID")
	_, exposesStatus := providerType.FieldByName("Status")
	require.False(t, exposesChannelID)
	require.False(t, exposesStatus)
}

func publicMarketplacePlatformNames(platforms []PublicMarketplacePlatform) []string {
	names := make([]string, 0, len(platforms))
	for _, platform := range platforms {
		names = append(names, platform.Name)
	}
	return names
}

func publicMarketplaceModelNames(models []PublicMarketplaceModel) []string {
	names := make([]string, 0, len(models))
	for _, model := range models {
		names = append(names, model.Name)
	}
	return names
}

func publicMarketplaceProviderNames(providers []PublicMarketplaceProvider) []string {
	names := make([]string, 0, len(providers))
	for _, provider := range providers {
		names = append(names, provider.Name)
	}
	return names
}

func publicMarketplaceGroupNames(groups []PublicMarketplaceGroupPrice) []string {
	names := make([]string, 0, len(groups))
	for _, group := range groups {
		names = append(names, group.Name)
	}
	return names
}

func testMarketplaceFloat64(v float64) *float64 { return &v }

func testMarketplaceInt(v int) *int { return &v }
