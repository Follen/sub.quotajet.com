//go:build unit

package service

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestSendPendingOAuthVerifyCode_UsesQuotaJetWithoutSettingService(t *testing.T) {
	ctx := context.Background()
	smtpServer := startNotificationEmailTestSMTPServer(t)
	settingRepo := newNotificationEmailMemorySettingRepo()
	require.NoError(t, settingRepo.SetMultiple(ctx, smtpServer.settings()))

	authService := &AuthService{
		emailService: NewEmailService(settingRepo, &emailCacheStub{}),
	}

	_, err := authService.SendPendingOAuthVerifyCode(ctx, "oauth@example.com")

	require.NoError(t, err)
	require.Contains(t, smtpServer.lastMessageBody(), "Subject: [QuotaJet] Email Verification Code")
}

func TestSendEmailIdentityBindCode_UsesQuotaJetWithoutSettingService(t *testing.T) {
	ctx := context.Background()
	smtpServer := startNotificationEmailTestSMTPServer(t)
	settingRepo := newNotificationEmailMemorySettingRepo()
	require.NoError(t, settingRepo.SetMultiple(ctx, smtpServer.settings()))

	authService := &AuthService{
		userRepo: &userRepoStub{
			user: &User{ID: 42, Email: "existing@example.com"},
		},
		emailService: NewEmailService(settingRepo, &emailCacheStub{}),
	}

	err := authService.SendEmailIdentityBindCode(ctx, 42, "binding@example.com")

	require.NoError(t, err)
	require.Contains(t, smtpServer.lastMessageBody(), "Subject: [QuotaJet] Email Verification Code")
}
