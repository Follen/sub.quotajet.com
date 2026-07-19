package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/Wei-Shaw/sub2api/internal/handler/dto"
	"github.com/Wei-Shaw/sub2api/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type publicStatusRepositoryStub struct {
	service.ChannelMonitorRepository
	monitors     []*service.ChannelMonitor
	latest       map[int64][]*service.ChannelMonitorLatest
	availability map[int64][]*service.ChannelMonitorAvailability
	timeline     map[int64][]*service.ChannelMonitorHistoryEntry
}

type publicStatusSettingRepositoryStub struct {
	service.SettingRepository
	values map[string]string
}

func (s *publicStatusSettingRepositoryStub) GetMultiple(context.Context, []string) (map[string]string, error) {
	return s.values, nil
}

func (s *publicStatusRepositoryStub) ListEnabled(context.Context) ([]*service.ChannelMonitor, error) {
	return s.monitors, nil
}

func (s *publicStatusRepositoryStub) ListLatestForMonitorIDs(context.Context, []int64) (map[int64][]*service.ChannelMonitorLatest, error) {
	return s.latest, nil
}

func (s *publicStatusRepositoryStub) ComputeAvailabilityForMonitors(context.Context, []int64, int) (map[int64][]*service.ChannelMonitorAvailability, error) {
	return s.availability, nil
}

func (s *publicStatusRepositoryStub) ListRecentHistoryForMonitors(context.Context, []int64, map[int64]string, int) (map[int64][]*service.ChannelMonitorHistoryEntry, error) {
	return s.timeline, nil
}

func TestPublicStatusUsesSanitizedPersistedSnapshot(t *testing.T) {
	gin.SetMode(gin.TestMode)
	repo := &publicStatusRepositoryStub{
		monitors: []*service.ChannelMonitor{
			{ID: 1, Name: "OpenAI", Provider: "openai", PrimaryModel: "gpt-5", Enabled: true},
			{ID: 2, Name: "Anthropic", Provider: "anthropic", PrimaryModel: "claude", Enabled: true},
		},
		latest: map[int64][]*service.ChannelMonitorLatest{
			1: {{Model: "gpt-5", Status: service.MonitorStatusOperational}},
			2: {{Model: "claude", Status: service.MonitorStatusFailed}},
		},
		availability: map[int64][]*service.ChannelMonitorAvailability{},
		timeline:     map[int64][]*service.ChannelMonitorHistoryEntry{},
	}
	h := NewChannelMonitorUserHandler(service.NewChannelMonitorService(repo, nil), nil)
	router := gin.New()
	router.GET("/api/v1/status", h.PublicStatus)

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/api/v1/status", nil)
	router.ServeHTTP(recorder, request)

	require.Equal(t, http.StatusOK, recorder.Code)
	require.Equal(t, "no-cache", recorder.Header().Get("Cache-Control"))
	var body struct {
		Code int                  `json:"code"`
		Data publicStatusSnapshot `json:"data"`
	}
	require.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &body))
	require.Equal(t, 0, body.Code)
	assert.NotEmpty(t, body.Data.GeneratedAt)
	assert.Equal(t, service.MonitorStatusDegraded, body.Data.Overall)
	require.Len(t, body.Data.Items, 2)
	assert.Equal(t, service.MonitorStatusOperational, body.Data.Items[0].PrimaryStatus)
	assert.Equal(t, service.MonitorStatusFailed, body.Data.Items[1].PrimaryStatus)
}

func TestPublicStatusReturnsEmptyUnknownSnapshotWhenMonitoringDisabled(t *testing.T) {
	gin.SetMode(gin.TestMode)
	settings := service.NewSettingService(&publicStatusSettingRepositoryStub{
		values: map[string]string{
			service.SettingKeyChannelMonitorEnabled: "false",
		},
	}, nil)
	h := NewChannelMonitorUserHandler(nil, settings)
	router := gin.New()
	router.GET("/api/v1/status", h.PublicStatus)

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/api/v1/status", nil)
	router.ServeHTTP(recorder, request)

	require.Equal(t, http.StatusOK, recorder.Code)
	require.Equal(t, "no-cache", recorder.Header().Get("Cache-Control"))
	var body struct {
		Code int                  `json:"code"`
		Data publicStatusSnapshot `json:"data"`
	}
	require.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &body))
	require.Equal(t, 0, body.Code)
	assert.Equal(t, "unknown", body.Data.Overall)
	assert.Empty(t, body.Data.Items)
}

func TestDerivePublicStatusOverall(t *testing.T) {
	tests := []struct {
		name  string
		items []channelMonitorUserListItem
		want  string
	}{
		{name: "no monitors", want: "unknown"},
		{
			name: "no completed checks",
			items: []channelMonitorUserListItem{{
				PrimaryStatus: "",
			}},
			want: "unknown",
		},
		{
			name: "all completed checks operational",
			items: []channelMonitorUserListItem{{
				PrimaryStatus: "operational",
				ExtraModels: []dto.ChannelMonitorExtraModelStatus{{
					Status: "operational",
				}},
			}},
			want: "operational",
		},
		{
			name: "degraded check",
			items: []channelMonitorUserListItem{{
				PrimaryStatus: "operational",
				ExtraModels: []dto.ChannelMonitorExtraModelStatus{{
					Status: "degraded",
				}},
			}},
			want: "degraded",
		},
		{
			name: "failed check",
			items: []channelMonitorUserListItem{{
				PrimaryStatus: "failed",
			}},
			want: "degraded",
		},
		{
			name: "error check",
			items: []channelMonitorUserListItem{{
				PrimaryStatus: "error",
			}},
			want: "degraded",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, derivePublicStatusOverall(tt.items))
		})
	}
}

func TestPublicStatusSnapshotDoesNotMarshalSensitiveMonitorFields(t *testing.T) {
	snapshot := publicStatusSnapshot{
		GeneratedAt: time.Date(2026, time.July, 20, 0, 0, 0, 0, time.UTC).Format(time.RFC3339),
		Overall:     "operational",
		Items: []channelMonitorUserListItem{{
			ID:            1,
			Name:          "Primary provider",
			PrimaryStatus: "operational",
		}},
	}

	body, err := json.Marshal(snapshot)
	require.NoError(t, err)

	encoded := string(body)
	for _, field := range []string{
		"api_key",
		"api_key_encrypted",
		"endpoint",
		"extra_headers",
		"body_override",
		"created_by",
		"interval_seconds",
		"jitter_seconds",
	} {
		assert.NotContains(t, encoded, field)
	}
}
