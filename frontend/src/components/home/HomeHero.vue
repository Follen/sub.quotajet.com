<template>
  <section
    data-home-section="hero"
    class="relative z-10 overflow-hidden px-4 pb-12 pt-24 sm:px-6 md:pb-16 md:pt-28"
  >
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10">
      <div class="absolute inset-0 bg-[var(--landing-bg)]"></div>
      <div
        class="absolute inset-0 bg-[linear-gradient(to_right,var(--landing-grid)_1px,transparent_1px),linear-gradient(to_bottom,var(--landing-grid)_1px,transparent_1px)] bg-[size:44px_44px] opacity-80 [mask-image:radial-gradient(ellipse_80%_62%_at_50%_22%,black_0%,transparent_76%)]"
      ></div>
      <div class="absolute left-0 right-0 top-0 h-px bg-[var(--landing-fg)] opacity-45"></div>
    </div>

    <div
      class="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.88fr)_minmax(440px,1.12fr)] lg:gap-14"
    >
      <div class="flex min-h-[520px] flex-col justify-between sm:min-h-[580px]">
        <div>
          <div
            class="landing-animate-fade-up landing-border-subtle mb-8 inline-flex px-3 py-1.5 font-mono text-[11px] uppercase opacity-0"
            style="animation-delay: 0ms"
          >
            {{ t('landing.hero.badge') }}
          </div>

          <h1
            class="landing-animate-fade-up max-w-4xl text-balance text-[clamp(2.7rem,5.8vw,5.8rem)] font-semibold leading-[0.98] opacity-0"
            style="animation-delay: 60ms"
          >
            {{ t('landing.hero.titleLead') }}
            <span class="landing-muted-label mt-3 block md:mt-4">
              {{ t('landing.hero.titleHighlight') }}
            </span>
          </h1>

          <p
            class="landing-animate-fade-up landing-section-copy mt-7 max-w-xl text-lg leading-8 opacity-0 md:text-xl"
            style="animation-delay: 120ms"
          >
            {{ t('landing.hero.description') }}
          </p>

          <div
            class="landing-animate-fade-up mt-9 flex flex-wrap items-center gap-3 opacity-0"
            style="animation-delay: 180ms"
          >
            <RouterLink
              :to="isAuthenticated ? '/dashboard' : '/register'"
              data-primary-cta
              class="landing-primary-action group inline-flex h-11 items-center bg-[var(--landing-accent)] px-5 font-mono text-xs font-semibold uppercase text-[var(--landing-accent-contrast)] hover:opacity-90"
            >
              {{ isAuthenticated ? t('Go to Dashboard') : t('landing.hero.primaryAction') }}
              <Icon
                name="arrowRight"
                size="sm"
                class="ml-2 transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </RouterLink>
            <a
              href="#models"
              data-secondary-cta
              class="landing-border-subtle group inline-flex h-11 items-center bg-transparent px-5 font-mono text-xs font-semibold uppercase text-[var(--landing-fg)] hover:bg-[var(--landing-surface-soft)]"
            >
              <Icon
                name="dollar"
                size="sm"
                class="mr-2 opacity-60 transition-opacity duration-200 group-hover:opacity-100"
              />
              <span>{{ t('landing.hero.secondaryAction') }}</span>
            </a>
          </div>
        </div>

        <div
          class="landing-animate-fade-up mt-12 grid gap-2 opacity-0 sm:grid-cols-3 lg:max-w-3xl"
          style="animation-delay: 260ms"
        >
          <HomeMetrics :metrics="metrics" />
        </div>
      </div>

      <div
        class="landing-animate-fade-up opacity-0 lg:pt-14"
        style="animation-delay: 300ms"
      >
        <RelayMachineVisual />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import type { LandingMetricDisplay } from '@/types/landing'
import HomeMetrics from './HomeMetrics.vue'
import RelayMachineVisual from './RelayMachineVisual.vue'

defineProps<{
  isAuthenticated: boolean
  metrics: LandingMetricDisplay
}>()

const { t } = useI18n()
</script>
