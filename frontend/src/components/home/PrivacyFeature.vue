<template>
  <section
    id="privacy"
    data-home-section="privacy"
    data-landing-reveal
    class="landing-feature-section relative z-10 overflow-hidden px-4 sm:px-6"
  >
    <article class="relative mx-auto max-w-7xl overflow-hidden">
      <div
        class="relative grid items-center gap-8 md:min-h-[560px] md:gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)] lg:gap-20"
      >
        <div class="flex flex-col justify-center py-4 md:py-14">
          <h2 :class="titleClasses">
            {{ t('landing.sections.privacy.title') }}
          </h2>
          <p :class="copyClasses">
            {{ t('landing.sections.privacy.description') }}
          </p>
        </div>

        <div class="relative flex h-full min-h-[320px] flex-col overflow-hidden p-0 font-mono md:min-h-[500px]">
          <div class="relative z-10 flex flex-1 items-center justify-center overflow-hidden">
            <div class="w-full max-w-lg">
              <div class="landing-privacy-stage relative mx-auto h-[320px] w-full max-w-[560px] md:h-[430px]">
                <div
                  aria-hidden="true"
                  class="absolute inset-0 bg-[radial-gradient(circle,var(--landing-glow-strong),transparent_62%)]"
                ></div>
                <svg
                  class="landing-privacy-map absolute inset-0 h-full w-full"
                  viewBox="0 0 440 360"
                  aria-hidden="true"
                >
                  <path d="M58 178 C126 130 176 132 220 178 C264 224 314 226 382 178" />
                  <path d="M58 202 C132 234 178 228 220 202 C262 176 308 170 382 202" />
                </svg>
                <div class="landing-privacy-stream landing-privacy-stream-in absolute left-4 top-1/2 -translate-y-1/2">
                  <strong>{{ t('landing.visual.privacy.input') }}</strong>
                  <span
                    v-for="(width, index) in inputWidths"
                    :key="width"
                    :style="{ width: `${width}px`, animationDelay: `${index * 180}ms` }"
                  ></span>
                </div>
                <div class="landing-privacy-core absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
                  <span>{{ t('landing.visual.privacy.none') }}</span>
                  <i aria-hidden="true"></i>
                </div>
                <div class="landing-privacy-stream landing-privacy-stream-out absolute right-8 top-1/2 -translate-y-1/2">
                  <strong>{{ t('landing.visual.privacy.output') }}</strong>
                  <span
                    v-for="index in 5"
                    :key="index"
                    :style="{ animationDelay: `${(index - 1) * 140}ms` }"
                  ></span>
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
const inputWidths = [156, 122, 178, 92]
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
