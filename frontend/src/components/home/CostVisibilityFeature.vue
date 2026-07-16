<template>
  <section
    id="pricing"
    data-home-section="pricing"
    data-landing-reveal
    class="landing-feature-section relative z-10 overflow-hidden px-4 sm:px-6"
  >
    <article class="relative mx-auto max-w-7xl overflow-hidden">
      <div
        class="relative grid items-center gap-8 md:min-h-[560px] md:gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)] lg:gap-20"
      >
        <div class="flex flex-col justify-center py-4 md:py-14">
          <h2 :class="titleClasses">
            {{ t('landing.sections.pricing.title') }}
          </h2>
          <p :class="copyClasses">
            {{ t('landing.sections.pricing.description') }}
          </p>
        </div>

        <div class="relative flex h-full min-h-[320px] flex-col overflow-hidden p-0 font-mono md:min-h-[500px]">
          <div class="relative z-10 flex flex-1 items-center justify-center overflow-hidden">
            <div class="w-full max-w-lg">
              <div class="flex items-end justify-between gap-6">
                <div>
                  <div class="landing-muted-label text-[10px] uppercase opacity-65">
                    {{ t('landing.visual.pricing.quotajet') }}
                  </div>
                  <div class="landing-section-title mt-2 text-[clamp(3.2rem,8vw,6rem)] font-semibold leading-none">
                    3%<span class="mx-4 opacity-25">/</span>15%
                  </div>
                </div>
                <div class="landing-section-copy hidden max-w-40 pb-2 text-right text-xs leading-5 opacity-70 sm:block">
                  {{ t('landing.visual.pricing.caption') }}
                </div>
              </div>

              <div class="mt-10 grid gap-5">
                <div
                  v-for="rail in priceRails"
                  :key="rail.label"
                  class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 text-sm sm:grid-cols-[112px_1fr_auto]"
                >
                  <span class="landing-section-copy">{{ rail.label }}</span>
                  <div class="landing-surface-soft order-3 col-span-2 h-2 overflow-hidden sm:order-none sm:col-span-1">
                    <div
                      class="landing-price-fill h-full"
                      :class="{ 'opacity-35': rail.full }"
                      :style="{ '--landing-price-target': rail.fill }"
                    ></div>
                  </div>
                  <span class="landing-section-title">{{ rail.amount }}</span>
                </div>

                <div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 text-sm sm:grid-cols-[112px_1fr_auto]">
                  <span class="landing-section-copy">{{ t('landing.visual.pricing.visibility') }}</span>
                  <div
                    class="landing-usage-events order-3 col-span-2 sm:order-none sm:col-span-1"
                    aria-hidden="true"
                  >
                    <i
                      v-for="index in 12"
                      :key="index"
                      :style="{ '--landing-pulse-index': index - 1 }"
                    ></i>
                  </div>
                  <span class="landing-section-title">{{ t('landing.visual.pricing.clear') }}</span>
                </div>
              </div>
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

const { locale, t } = useI18n()
const priceRails = computed(() => [
  { label: t('landing.visual.pricing.official'), amount: '100%', fill: '100%', full: true },
  { label: t('landing.visual.pricing.quotajet'), amount: '3% - 15%', fill: '15%', full: false },
])
const isZh = computed(() => locale.value.toLowerCase().startsWith('zh'))
const titleClasses = computed(() => [
  'landing-section-title max-w-3xl text-balance font-semibold',
  isZh.value
    ? 'text-[clamp(2.65rem,4.7vw,5.15rem)] leading-[1.04]'
    : 'text-[clamp(3rem,5.2vw,5.8rem)] leading-[0.98]',
])
const copyClasses = computed(() => [
  'landing-section-copy mt-7 max-w-2xl text-lg md:text-xl',
  isZh.value ? 'leading-9 md:leading-10' : 'leading-8 md:leading-9',
])
</script>
