<template>
  <section
    data-home-section="tools"
    data-landing-reveal
    class="landing-feature-section relative z-10 overflow-hidden px-4 sm:px-6"
  >
    <article class="relative mx-auto max-w-7xl overflow-hidden py-8 md:py-12">
      <div class="mx-auto max-w-5xl text-center">
        <h2 :class="titleClasses">
          {{ t('landing.agents.title') }}
        </h2>
        <p :class="copyClasses">
          {{ t('landing.agents.description') }}
        </p>
      </div>

      <div class="landing-logo-marquee mt-14 overflow-hidden py-4">
        <div class="landing-logo-marquee-track flex w-max">
          <div
            v-for="copy in copies"
            :key="copy"
            data-tools-copy
            class="flex gap-5 pr-5"
            :aria-hidden="copy === 'duplicate' ? 'true' : undefined"
          >
            <div
              v-for="tool in toolNodes"
              :key="`${copy}-${tool.label}`"
              class="landing-agent-pill flex h-[86px] min-w-[156px] items-center justify-center gap-3.5 px-6"
            >
              <span class="flex size-11 shrink-0 items-center justify-center">
                <HomeBrandIcon :name="tool.icon" :size="40" />
              </span>
              <span class="whitespace-nowrap text-[17px] font-medium leading-none">
                {{ tool.label }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import HomeBrandIcon from './HomeBrandIcon.vue'
import { toolNodes } from './homeContent'

const { locale, t } = useI18n()
const copies = ['original', 'duplicate'] as const
const isZh = computed(() => locale.value.toLowerCase().startsWith('zh'))
const titleClasses = computed(() => [
  'landing-section-title mx-auto max-w-4xl text-balance font-semibold',
  isZh.value
    ? 'text-[clamp(2.55rem,4.45vw,4.9rem)] leading-[1.04]'
    : 'text-[clamp(3rem,5vw,5.4rem)] leading-[0.98]',
])
const copyClasses = computed(() => [
  'landing-section-copy mx-auto mt-6 max-w-2xl text-lg md:text-xl',
  isZh.value ? 'leading-9 md:leading-10' : 'leading-8 md:leading-9',
])
</script>
