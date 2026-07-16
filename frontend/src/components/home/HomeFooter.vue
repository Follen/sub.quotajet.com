<template>
  <footer
    data-home-footer
    class="relative z-10 border-t border-[var(--landing-border-faint)]"
  >
    <div class="mx-auto max-w-6xl px-6 py-12 md:py-16">
      <div class="flex flex-col justify-between gap-10 md:flex-row md:gap-16">
        <div class="shrink-0">
          <RouterLink to="/home" class="group flex items-center gap-2.5">
            <img
              data-home-logo
              src="/logo.png"
              alt="QuotaJet"
              class="size-7 rounded-lg object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <span data-home-brand class="text-sm font-semibold">QuotaJet</span>
          </RouterLink>
          <p class="mt-3 max-w-[200px] text-xs leading-relaxed text-[var(--landing-fg-muted)]">
            QuotaJet Model Relay
          </p>
        </div>
      </div>

      <div
        class="mt-12 flex flex-col items-center justify-between gap-x-3 gap-y-2 border-t border-[var(--landing-border-faint)] pt-6 sm:flex-row"
      >
        <p class="text-center text-xs text-[var(--landing-fg-muted)] sm:text-left">
          &copy; {{ currentYear }} QuotaJet. {{ t('landing.footer.copyright') }}
        </p>
        <div
          class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-[var(--landing-fg-soft)] sm:justify-end"
        >
          <RouterLink
            to="/legal/terms"
            class="transition-colors duration-200 hover:text-[var(--landing-fg)]"
          >
            {{ t('landing.footer.agreement') }}
          </RouterLink>
          <span v-if="hasPrivacyDocument" aria-hidden="true" class="opacity-40">&middot;</span>
          <RouterLink
            v-if="hasPrivacyDocument"
            to="/legal/privacy"
            class="transition-colors duration-200 hover:text-[var(--landing-fg)]"
          >
            {{ t('landing.footer.privacy') }}
          </RouterLink>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  hasPrivacyDocument: boolean
}>()

const { t } = useI18n()
const currentYear = new Date().getFullYear()
</script>
