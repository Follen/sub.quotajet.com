package service

import (
	"context"
	"reflect"
	"testing"

	"github.com/stretchr/testify/require"
)

type stubAvailableChannelLister struct {
	channels []AvailableChannel
	err      error
}

func (s stubAvailableChannelLister) ListAvailable(context.Context) ([]AvailableChannel, error) {
	return s.channels, s.err
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
