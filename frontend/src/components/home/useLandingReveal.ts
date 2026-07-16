import { onBeforeUnmount, onMounted, type Ref } from 'vue'

export function useLandingReveal(root: Ref<HTMLElement | null>) {
  let observer: IntersectionObserver | undefined

  onMounted(() => {
    const nodes = root.value?.querySelectorAll<HTMLElement>('[data-landing-reveal]') ?? []
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      nodes.forEach((node) => { node.dataset.visible = 'true' })
      return
    }

    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement
          target.dataset.visible = 'true'
          observer?.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12 })

    nodes.forEach((node) => observer?.observe(node))
  })

  onBeforeUnmount(() => observer?.disconnect())
}
