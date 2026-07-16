export function liquidNoise(x: number, y: number, z: number, time: number): number {
  return Math.sin(x * 2 + time) * Math.cos(y * 3 + time * 0.5) * Math.sin(z * 1.5 + time * 0.8)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function getRestCenter(rect: DOMRect, viewportWidth = window.innerWidth) {
  if (viewportWidth < 1024) return { x: rect.width * 0.5, y: rect.height * 0.48 }
  return { x: viewportWidth * 0.75 - rect.left, y: rect.height * 0.42 }
}
