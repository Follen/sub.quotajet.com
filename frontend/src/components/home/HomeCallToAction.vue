<template>
  <section
    data-home-section="cta"
    data-landing-reveal
    class="relative z-10 overflow-hidden px-4 py-16 sm:px-6 md:py-24"
  >
    <div class="pointer-events-none absolute bottom-0 left-0 right-0 h-64 bg-[radial-gradient(ellipse_at_50%_100%,var(--landing-glow-soft),transparent_68%)]"></div>
    <div class="relative mx-auto max-w-7xl">
      <div class="grid gap-8 border-t border-[var(--landing-border)] pt-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:pt-14">
        <div>
          <div class="landing-muted-label mb-5 font-mono text-[11px] uppercase opacity-70">
            {{ t('landing.cta.eyebrow') }}
          </div>
          <h2 class="landing-section-title max-w-4xl text-balance text-[clamp(2.6rem,5vw,5.4rem)] font-semibold leading-[0.98]">
            {{ t('landing.cta.title') }}
          </h2>
          <p class="landing-section-copy mt-6 max-w-2xl text-base leading-7 md:text-xl md:leading-9">
            {{ t('landing.cta.description') }}
          </p>
        </div>

        <div class="flex flex-wrap gap-3 md:justify-end">
          <RouterLink
            :to="isAuthenticated ? '/dashboard' : '/register'"
            data-primary-cta
            class="group inline-flex h-11 items-center bg-[var(--landing-accent)] px-5 font-mono text-xs font-semibold uppercase text-[var(--landing-accent-contrast)] hover:opacity-90"
          >
            {{ isAuthenticated ? t('Go to Dashboard') : t('landing.cta.primaryAction') }}
            <Icon
              name="arrowRight"
              size="sm"
              class="ml-2 transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </RouterLink>
          <a
            v-if="safeDocUrl"
            :href="safeDocUrl"
            data-doc-link
            target="_blank"
            rel="noopener noreferrer"
            class="landing-border-subtle inline-flex h-11 items-center bg-transparent px-5 font-mono text-xs font-semibold uppercase text-[var(--landing-fg)] hover:bg-[var(--landing-surface-soft)]"
          >
            <Icon name="book" size="sm" class="mr-2 opacity-60" />
            {{ t('landing.cta.secondaryAction') }}
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import { sanitizeUrl } from '@/utils/url'

const props = defineProps<{
  isAuthenticated: boolean
  docUrl: string
}>()

const { t } = useI18n()
const safeDocUrl = computed(() => sanitizeUrl(props.docUrl))
</script>
