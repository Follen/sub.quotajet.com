//go:build unit

package service

import (
	"context"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/config"
	"github.com/stretchr/testify/require"
)

type settingBrandRepoStub struct {
	written map[string]string
	value   string
	err     error
}

func (s *settingBrandRepoStub) Get(context.Context, string) (*Setting, error) {
	return nil, ErrSettingNotFound
}

func (s *settingBrandRepoStub) GetValue(context.Context, string) (string, error) {
	if s.err != nil {
		return "", s.err
	}
	return s.value, nil
}

func (s *settingBrandRepoStub) Set(context.Context, string, string) error {
	panic("unexpected Set call")
}

func (s *settingBrandRepoStub) GetMultiple(context.Context, []string) (map[string]string, error) {
	panic("unexpected GetMultiple call")
}

func (s *settingBrandRepoStub) SetMultiple(_ context.Context, values map[string]string) error {
	s.written = values
	return nil
}

func (s *settingBrandRepoStub) GetAll(context.Context) (map[string]string, error) {
	panic("unexpected GetAll call")
}

func (s *settingBrandRepoStub) Delete(context.Context, string) error {
	panic("unexpected Delete call")
}

func TestSettingService_InitializeDefaultSettings_UsesQuotaJetBrand(t *testing.T) {
	repo := &settingBrandRepoStub{}
	svc := NewSettingService(repo, &config.Config{})

	err := svc.InitializeDefaultSettings(context.Background())

	require.NoError(t, err)
	require.Equal(t, "QuotaJet", repo.written[SettingKeySiteName])
	require.Equal(t, "/logo.png", repo.written[SettingKeySiteLogo])
	require.Equal(t, "true", repo.written[SettingKeyRegistrationEnabled])
}

func TestSettingService_GetSiteName_FallsBackToQuotaJetForMissingOrWhitespaceSettings(t *testing.T) {
	for _, testCase := range []struct {
		name string
		repo *settingBrandRepoStub
	}{
		{name: "missing", repo: &settingBrandRepoStub{err: ErrSettingNotFound}},
		{name: "whitespace", repo: &settingBrandRepoStub{value: " \t\n "}},
	} {
		t.Run(testCase.name, func(t *testing.T) {
			svc := NewSettingService(testCase.repo, &config.Config{})

			require.Equal(t, "QuotaJet", svc.GetSiteName(context.Background()))
		})
	}
}
