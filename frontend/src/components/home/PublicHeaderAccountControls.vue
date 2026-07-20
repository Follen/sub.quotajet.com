<template>
  <template v-if="isAuthenticated">
    <AnnouncementBell v-if="!mobile" />

    <template v-if="user">
      <SubscriptionProgressMini v-if="!mobile" />
      <div
        v-if="!mobile"
        class="group relative hidden items-center gap-2 rounded-lg bg-[var(--landing-surface)] px-2.5 py-1.5 sm:flex"
      >
        <Icon name="dollar" size="sm" class="text-[var(--landing-fg-soft)]" />
        <span class="text-[13px] font-semibold text-[var(--landing-fg)]">
          {{ formatMoney(availableBalance) }}
        </span>
        <div
          class="pointer-events-none absolute right-0 top-full mt-2 hidden w-52 rounded-lg border border-[var(--landing-border)] bg-[var(--landing-bg)] p-3 text-xs shadow-lg group-hover:block"
        >
          <div class="flex items-center justify-between gap-4">
            <span class="text-[var(--landing-fg-soft)]">{{ t('common.availableBalance') }}</span>
            <strong>{{ formatMoney(availableBalance) }}</strong>
          </div>
          <div class="mt-2 flex items-center justify-between gap-4">
            <span class="text-[var(--landing-fg-soft)]">{{ t('common.frozenBalance') }}</span>
            <strong>{{ formatMoney(frozenBalance) }}</strong>
          </div>
        </div>
      </div>

      <div ref="dropdownRef" class="relative">
        <button
          type="button"
          class="flex size-8 items-center justify-center overflow-hidden rounded-lg bg-[var(--landing-fg)] text-xs font-semibold text-[var(--landing-bg)] transition-opacity hover:opacity-85"
          aria-label="User Menu"
          :aria-expanded="dropdownOpen"
          @click.stop="dropdownOpen = !dropdownOpen"
        >
          <img
            v-if="avatarUrl"
            :src="avatarUrl"
            :alt="displayName"
            class="size-full object-cover"
          />
          <span v-else>{{ userInitials }}</span>
        </button>

        <transition name="public-account-menu">
          <div
            v-if="dropdownOpen"
            class="absolute right-0 top-full z-[70] mt-2 w-56 overflow-hidden rounded-lg border border-[var(--landing-border)] bg-[var(--landing-bg)] py-1 text-sm shadow-xl"
          >
            <div class="border-b border-[var(--landing-border)] px-3 py-2.5">
              <div class="truncate font-medium text-[var(--landing-fg)]">{{ displayName }}</div>
              <div class="mt-0.5 truncate text-xs text-[var(--landing-fg-soft)]">{{ user.email }}</div>
              <div class="mt-2 flex items-center justify-between text-xs sm:hidden">
                <span class="text-[var(--landing-fg-soft)]">{{ t('common.balance') }}</span>
                <strong>{{ formatMoney(availableBalance) }}</strong>
              </div>
            </div>
            <RouterLink to="/profile" class="public-account-link" @click="closeDropdown">
              <Icon name="user" size="sm" />
              {{ t('nav.profile') }}
            </RouterLink>
            <RouterLink to="/keys" class="public-account-link" @click="closeDropdown">
              <Icon name="key" size="sm" />
              {{ t('nav.apiKeys') }}
            </RouterLink>
            <button type="button" class="public-account-link w-full text-red-500" @click="handleLogout">
              <Icon name="login" size="sm" />
              {{ t('nav.logout') }}
            </button>
          </div>
        </transition>
      </div>
    </template>

    <RouterLink
      v-else
      to="/dashboard"
      class="inline-flex h-8 items-center justify-center rounded-lg bg-[var(--landing-accent)] px-3 text-[13px] font-medium text-[var(--landing-accent-contrast)] transition-opacity hover:opacity-85"
    >
      {{ t('landing.nav.dashboard') }}
    </RouterLink>
  </template>

  <RouterLink
    v-else-if="!mobile"
    to="/login"
    class="inline-flex h-8 items-center justify-center rounded-lg bg-[var(--landing-accent)] px-3 text-[13px] font-medium text-[var(--landing-accent-contrast)] transition-opacity hover:opacity-85"
  >
    {{ t('landing.nav.login') }}
  </RouterLink>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AnnouncementBell from '@/components/common/AnnouncementBell.vue'
import SubscriptionProgressMini from '@/components/common/SubscriptionProgressMini.vue'
import Icon from '@/components/icons/Icon.vue'
import { useAuthStore } from '@/stores'

withDefaults(defineProps<{
  isAuthenticated: boolean
  mobile?: boolean
}>(), { mobile: false })

const { t } = useI18n()
const authStore = useAuthStore()
const dropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const user = computed(() => authStore.user)
const avatarUrl = computed(() => user.value?.avatar_url?.trim() || '')
const displayName = computed(() => user.value?.username || user.value?.email?.split('@')[0] || '')
const userInitials = computed(() => displayName.value.slice(0, 2).toUpperCase())
const availableBalance = computed(() => Number(user.value?.balance || 0))
const frozenBalance = computed(() => Number(user.value?.frozen_balance || 0))

function formatMoney(value: number) {
  return Number.isFinite(value) ? `$${value.toFixed(2)}` : '$0.00'
}

function closeDropdown() {
  dropdownOpen.value = false
}

async function handleLogout() {
  closeDropdown()
  await authStore.logout()
  window.location.assign('/login')
}

function handleOutsideClick(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) closeDropdown()
}

onMounted(() => document.addEventListener('click', handleOutsideClick))
onBeforeUnmount(() => document.removeEventListener('click', handleOutsideClick))
</script>

<style scoped>
.public-account-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  color: var(--landing-fg-soft);
  transition: color 150ms ease, background 150ms ease;
}

.public-account-link:hover {
  color: var(--landing-fg);
  background: var(--landing-surface);
}

.public-account-menu-enter-active,
.public-account-menu-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}

.public-account-menu-enter-from,
.public-account-menu-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
</style>
