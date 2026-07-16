<template>
  <section
    id="reliability"
    data-home-section="reliability"
    data-landing-reveal
    class="landing-feature-section relative z-10 overflow-hidden px-4 sm:px-6"
  >
    <article class="relative mx-auto max-w-7xl overflow-hidden">
      <div
        class="relative grid items-center gap-8 md:min-h-[560px] md:gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)] lg:gap-20 lg:[&>*:first-child]:order-2"
      >
        <div class="flex flex-col justify-center py-4 md:py-14">
          <h2 :class="titleClasses">
            {{ t('landing.sections.stability.title') }}
          </h2>
          <p :class="copyClasses">
            {{ t('landing.sections.stability.description') }}
          </p>
        </div>

        <div class="relative flex h-full min-h-[320px] flex-col overflow-hidden p-0 font-mono md:min-h-[500px]">
          <div class="relative z-10 flex flex-1 items-center justify-center overflow-hidden">
            <div class="grid w-full max-w-lg gap-5">
              <div
                v-for="(item, index) in items"
                :key="item"
                class="landing-stability-row grid gap-3"
                :style="{ '--landing-stability-index': index }"
              >
                <div class="flex items-center justify-between gap-5">
                  <span class="landing-stability-label flex items-center gap-2.5">
                    <i></i>
                    {{ t(`landing.visual.stability.${item}.label`) }}
                  </span>
                  <span class="landing-stability-value">
                    {{ t(`landing.visual.stability.${item}.value`) }}
                  </span>
                </div>
                <div class="landing-stability-track">
                  <div class="landing-stability-grid"></div>
                  <div class="landing-stability-fill"></div>
                  <span class="landing-stability-packet"></span>
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

defineProps<{ isAuthenticated: boolean }>()

const { locale, t } = useI18n()
const items = ['route', 'response', 'daily'] as const
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
