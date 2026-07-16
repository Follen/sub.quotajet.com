<template>
  <header
    data-home-header
    :data-compact="scrolled"
    class="pointer-events-none fixed inset-x-0 top-0 z-50"
  >
    <div
      class="pointer-events-auto mx-auto transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
      :class="scrolled ? 'max-w-[52rem] px-3 pt-3' : 'max-w-7xl px-4 pt-0 md:px-6'"
    >
      <nav
        class="flex items-center justify-between transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        :class="
          scrolled
            ? 'h-12 rounded-2xl border border-[var(--landing-border-faint)] bg-[var(--landing-surface-strong)] pl-4 pr-1.5 shadow-[0_2px_16px_-6px_rgba(0,0,0,0.16)] backdrop-blur-2xl'
            : 'h-16 px-2'
        "
      >
        <RouterLink
          to="/home"
          class="group flex shrink-0 items-center gap-2.5"
          @click="closeMobileMenu"
        >
          <img
            data-home-logo
            src="/logo.png"
            alt="QuotaJet"
            class="size-7 rounded-lg object-contain transition-transform duration-300 group-hover:scale-105"
          />
          <span data-home-brand class="text-sm font-semibold">QuotaJet</span>
        </RouterLink>

        <div class="hidden items-center gap-0.5 lg:flex">
          <a
            v-for="link in navigation"
            :key="link.labelKey"
            :href="link.href"
            :target="link.external ? '_blank' : undefined"
            :rel="link.external ? 'noopener noreferrer' : undefined"
            class="rounded-lg px-3 py-1.5 text-[13px] font-medium text-[var(--landing-fg-soft)] transition-colors duration-200 hover:text-[var(--landing-fg)]"
          >
            {{ t(link.labelKey) }}
          </a>
          <a
            v-if="safeDocUrl"
            data-doc-link
            :href="safeDocUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="rounded-lg px-3 py-1.5 text-[13px] font-medium text-[var(--landing-fg-soft)] transition-colors duration-200 hover:text-[var(--landing-fg)]"
          >
            {{ t('landing.nav.docs') }}
          </a>

          <div class="mx-2 h-4 w-px bg-[var(--landing-border)]" />
          <LocaleSwitcher />
          <button
            data-theme-button
            type="button"
            class="flex size-9 items-center justify-center rounded-lg text-[var(--landing-fg-soft)] transition-colors hover:bg-[var(--landing-surface)] hover:text-[var(--landing-fg)]"
            :title="themeLabel"
            :aria-label="themeLabel"
            @click="toggleTheme"
          >
            <Icon :name="isDark ? 'sun' : 'moon'" size="sm" />
          </button>
          <AnnouncementBell v-if="isAuthenticated" />
          <div class="mx-1 h-4 w-px bg-[var(--landing-border)]" />
          <RouterLink
            :to="isAuthenticated ? '/dashboard' : '/login'"
            class="inline-flex h-8 items-center justify-center rounded-lg bg-[var(--landing-accent)] px-3 text-[13px] font-medium text-[var(--landing-accent-contrast)] transition-opacity hover:opacity-85"
          >
            {{ t(isAuthenticated ? 'landing.nav.dashboard' : 'landing.nav.login') }}
          </RouterLink>
        </div>

        <div class="flex items-center gap-1.5 lg:hidden">
          <LocaleSwitcher />
          <button
            data-theme-button
            type="button"
            class="flex size-9 items-center justify-center rounded-lg text-[var(--landing-fg-soft)] transition-colors hover:bg-[var(--landing-surface)] hover:text-[var(--landing-fg)]"
            :title="themeLabel"
            :aria-label="themeLabel"
            @click="toggleTheme"
          >
            <Icon :name="isDark ? 'sun' : 'moon'" size="sm" />
          </button>
          <RouterLink
            v-if="isAuthenticated"
            to="/dashboard"
            class="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium text-[var(--landing-fg)] transition-colors hover:bg-[var(--landing-surface)]"
            :title="t('landing.nav.dashboard')"
            @click="closeMobileMenu"
          >
            <Icon name="home" size="sm" />
            <span class="hidden sm:inline">{{ t('landing.nav.dashboard') }}</span>
          </RouterLink>
          <button
            data-mobile-menu-button
            type="button"
            class="flex size-9 items-center justify-center rounded-lg text-[var(--landing-fg)] transition-colors hover:bg-[var(--landing-surface)]"
            :aria-expanded="mobileOpen"
            :aria-label="mobileOpen ? t('common.close') : t('common.more')"
            @click="mobileOpen = !mobileOpen"
          >
            <span class="relative size-4" aria-hidden="true">
              <span
                class="absolute inset-x-0 block h-[1.5px] origin-center rounded-full bg-current transition-all duration-300"
                :class="mobileOpen ? 'top-[7px] rotate-45' : 'top-[3px]'"
              />
              <span
                class="absolute inset-x-0 top-[7px] block h-[1.5px] rounded-full bg-current transition-all duration-300"
                :class="mobileOpen ? 'scale-x-0 opacity-0' : 'opacity-100'"
              />
              <span
                class="absolute inset-x-0 block h-[1.5px] origin-center rounded-full bg-current transition-all duration-300"
                :class="mobileOpen ? 'top-[7px] -rotate-45' : 'top-[11px]'"
              />
            </span>
          </button>
        </div>
      </nav>
    </div>
  </header>

  <div
    data-mobile-navigation
    :data-open="mobileOpen"
    :aria-hidden="!mobileOpen"
    class="fixed inset-0 z-40 bg-[var(--landing-bg)] backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:pointer-events-none lg:hidden"
    :class="mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'"
  >
    <div class="flex h-full flex-col justify-between px-8 pb-10 pt-20">
      <nav class="flex flex-col gap-1">
        <a
          v-for="(link, index) in navigation"
          :key="link.labelKey"
          :href="link.href"
          :target="link.external ? '_blank' : undefined"
          :rel="link.external ? 'noopener noreferrer' : undefined"
          :tabindex="mobileOpen ? undefined : -1"
          class="flex items-center py-3 text-base font-medium text-[var(--landing-fg-soft)] transition-all duration-500 hover:text-[var(--landing-fg)]"
          :class="mobileOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'"
          :style="{ transitionDelay: mobileOpen ? `${100 + index * 50}ms` : '0ms' }"
          @click="closeMobileMenu"
        >
          {{ t(link.labelKey) }}
        </a>
        <a
          v-if="safeDocUrl"
          data-doc-link
          :href="safeDocUrl"
          target="_blank"
          rel="noopener noreferrer"
          :tabindex="mobileOpen ? undefined : -1"
          class="flex items-center py-3 text-base font-medium text-[var(--landing-fg-soft)] transition-colors hover:text-[var(--landing-fg)]"
          @click="closeMobileMenu"
        >
          {{ t('landing.nav.docs') }}
        </a>
      </nav>

      <RouterLink
        :to="isAuthenticated ? '/dashboard' : '/login'"
        :tabindex="mobileOpen ? undefined : -1"
        class="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--landing-accent)] text-sm font-medium text-[var(--landing-accent-contrast)] transition-opacity hover:opacity-85"
        @click="closeMobileMenu"
      >
        {{ t(isAuthenticated ? 'landing.nav.dashboard' : 'landing.nav.login') }}
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AnnouncementBell from '@/components/common/AnnouncementBell.vue'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import Icon from '@/components/icons/Icon.vue'
import { sanitizeUrl } from '@/utils/url'

const props = defineProps<{
  isAuthenticated: boolean
  docUrl: string
}>()

const { t } = useI18n()
const navigation = [
  { labelKey: 'landing.nav.models', href: '#models', external: false },
  { labelKey: 'landing.nav.about', href: '#privacy', external: false },
  { labelKey: 'landing.nav.status', href: 'https://status.quotajet.com/', external: true },
] as const

const safeDocUrl = computed(() => sanitizeUrl(props.docUrl))
const scrolled = ref(false)
const mobileOpen = ref(false)
const isDark = ref(document.documentElement.classList.contains('dark'))
const themeLabel = computed(() =>
  t(isDark.value ? 'home.switchToLight' : 'home.switchToDark'),
)
let previousBodyOverflow: string | null = null

function updateScrollState() {
  scrolled.value = window.scrollY > 20
}

function restoreBodyOverflow() {
  if (previousBodyOverflow === null) return
  document.body.style.overflow = previousBodyOverflow
  previousBodyOverflow = null
}

function closeMobileMenu() {
  mobileOpen.value = false
}

function toggleTheme() {
  const nextIsDark = !document.documentElement.classList.contains('dark')
  document.documentElement.classList.toggle('dark', nextIsDark)
  localStorage.setItem('theme', nextIsDark ? 'dark' : 'light')
  isDark.value = nextIsDark
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeMobileMenu()
}

watch(mobileOpen, (open) => {
  if (open) {
    if (previousBodyOverflow === null) previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return
  }
  restoreBodyOverflow()
})

onMounted(() => {
  updateScrollState()
  window.addEventListener('scroll', updateScrollState, { passive: true })
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateScrollState)
  window.removeEventListener('keydown', handleKeydown)
  restoreBodyOverflow()
})
</script>
