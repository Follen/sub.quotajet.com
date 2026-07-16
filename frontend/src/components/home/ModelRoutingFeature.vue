<template>
  <section
    id="models"
    data-home-section="models"
    data-landing-reveal
    class="landing-feature-section relative z-10 overflow-hidden px-4 sm:px-6"
  >
    <article class="relative mx-auto max-w-7xl overflow-hidden">
      <div
        class="relative grid items-center gap-8 md:min-h-[560px] md:gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)] lg:gap-20 lg:[&>*:first-child]:order-2"
      >
        <div class="flex flex-col justify-center py-4 md:py-14">
          <h2 :class="titleClasses">
            {{ t('landing.sections.models.title') }}
          </h2>
          <p :class="copyClasses">
            {{ t('landing.sections.models.description') }}
          </p>
        </div>

        <div class="relative flex h-full min-h-[320px] flex-col overflow-hidden p-0 font-mono md:min-h-[500px]">
          <div class="relative z-10 flex flex-1 items-center justify-center overflow-hidden">
            <div class="relative w-full max-w-xl">
              <div class="landing-logo-orbit relative mx-auto h-[360px] w-full md:max-h-[72vw] md:min-h-[420px] md:h-[500px]">
                <div class="landing-model-core absolute left-1/2 top-1/2 flex size-36 items-center justify-center">
                  <img
                    src="/logo.png"
                    alt="QuotaJet"
                    class="landing-model-core-logo object-contain"
                  />
                </div>
                <div
                  v-for="model in positionedModels"
                  :key="model.label"
                  class="landing-model-node absolute flex items-center gap-2.5"
                  :style="model.style"
                >
                  <span class="landing-model-icon flex size-9 items-center justify-center">
                    <HomeBrandIcon :name="model.icon" :size="30" />
                  </span>
                  <span class="landing-model-label text-sm font-medium">
                    {{ model.label }}
                  </span>
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
import { computed, type CSSProperties } from 'vue'
import { useI18n } from 'vue-i18n'
import HomeBrandIcon from './HomeBrandIcon.vue'
import { modelNodes } from './homeContent'

defineProps<{ isAuthenticated: boolean }>()

const { locale, t } = useI18n()
const modelDrifts = [
  ['2px', '-4px', '-3px', '2px'],
  ['-3px', '-2px', '2px', '4px'],
  ['4px', '1px', '-2px', '-3px'],
  ['-2px', '4px', '3px', '-2px'],
  ['3px', '3px', '-4px', '-1px'],
  ['-4px', '2px', '2px', '-4px'],
  ['2px', '-3px', '-2px', '4px'],
  ['-2px', '-4px', '4px', '1px'],
  ['3px', '1px', '-3px', '-3px'],
  ['-3px', '3px', '2px', '-2px'],
] as const

const positionedModels = modelNodes.map((model, index) => {
  const angle = (Math.PI * 2 * index) / modelNodes.length - Math.PI / 2
  const radius = index % 2 === 0 ? 41 : 32
  const drift = modelDrifts[index % modelDrifts.length]
  const style = {
    left: `${50 + Math.cos(angle) * radius}%`,
    top: `${50 + Math.sin(angle) * radius}%`,
    transform: 'translate(-50%, -50%)',
    animationDelay: `${index * 110}ms`,
    animationDuration: `${6.4 + (index % 4) * 0.7}s`,
    '--landing-drift-x': drift[0],
    '--landing-drift-y': drift[1],
    '--landing-drift-x-alt': drift[2],
    '--landing-drift-y-alt': drift[3],
  } as CSSProperties
  return { ...model, style }
})

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
