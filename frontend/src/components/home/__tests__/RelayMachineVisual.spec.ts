import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import RelayMachineVisual from '../RelayMachineVisual.vue'
import { clamp, getRestCenter, liquidNoise } from '../relayMachineMath'

const three = vi.hoisted(() => {
  const position = {
    array: new Float32Array([1, 0, 0]),
    count: 1,
    needsUpdate: false,
    setXYZ: vi.fn(),
  }
  const rawGeometry = {
    deleteAttribute: vi.fn(),
    dispose: vi.fn(),
  }
  const geometry = {
    computeVertexNormals: vi.fn(),
    dispose: vi.fn(),
    getAttribute: vi.fn(() => position),
  }
  const material = { dispose: vi.fn() }
  const mesh = {
    position: { x: 0, y: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { setScalar: vi.fn() },
  }
  const scene = { add: vi.fn(), environment: undefined as unknown }
  const camera = {
    aspect: 1,
    position: { set: vi.fn() },
    updateProjectionMatrix: vi.fn(),
  }
  const renderer = {
    dispose: vi.fn(),
    outputColorSpace: undefined as unknown,
    render: vi.fn(),
    setClearColor: vi.fn(),
    setPixelRatio: vi.fn(),
    setSize: vi.fn(),
    toneMapping: undefined as unknown,
    toneMappingExposure: 0,
  }
  const environment = { dispose: vi.fn() }
  const sourceTexture = { dispose: vi.fn() }
  const pmrem = {
    dispose: vi.fn(),
    fromEquirectangular: vi.fn(() => ({ texture: environment })),
  }
  const loader = { load: vi.fn() }
  const ambientLight = {}
  const keyLight = { position: { set: vi.fn() } }
  const rimLight = { position: { set: vi.fn() } }

  return {
    AmbientLight: vi.fn(() => ambientLight),
    Color: vi.fn((value: string) => ({ value })),
    DirectionalLight: vi.fn((_color: number, intensity: number) =>
      intensity === 0.9 ? keyLight : rimLight,
    ),
    Mesh: vi.fn(() => mesh),
    MeshPhysicalMaterial: vi.fn(() => material),
    PMREMGenerator: vi.fn(() => pmrem),
    PerspectiveCamera: vi.fn(() => camera),
    RGBELoader: vi.fn(() => loader),
    Scene: vi.fn(() => scene),
    SphereGeometry: vi.fn(() => rawGeometry),
    WebGLRenderer: vi.fn(() => renderer),
    ambientLight,
    camera,
    environment,
    geometry,
    keyLight,
    loader,
    material,
    mergeVertices: vi.fn(() => geometry),
    mesh,
    pmrem,
    position,
    rawGeometry,
    renderer,
    rimLight,
    scene,
    sourceTexture,
  }
})

vi.mock('three', () => ({
  ACESFilmicToneMapping: 'aces-filmic',
  AmbientLight: three.AmbientLight,
  Color: three.Color,
  DirectionalLight: three.DirectionalLight,
  Mesh: three.Mesh,
  MeshPhysicalMaterial: three.MeshPhysicalMaterial,
  PMREMGenerator: three.PMREMGenerator,
  PerspectiveCamera: three.PerspectiveCamera,
  SRGBColorSpace: 'srgb',
  Scene: three.Scene,
  SphereGeometry: three.SphereGeometry,
  WebGLRenderer: three.WebGLRenderer,
}))

vi.mock('three/examples/jsm/loaders/RGBELoader.js', () => ({
  RGBELoader: three.RGBELoader,
}))

vi.mock('three/examples/jsm/utils/BufferGeometryUtils.js', () => ({
  mergeVertices: three.mergeVertices,
}))

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    bottom: top + height,
    height,
    left,
    right: left + width,
    toJSON: () => ({}),
    top,
    width,
    x: left,
    y: top,
  }
}

describe('relay machine math', () => {
  it('preserves the main-site liquid noise formula', () => {
    expect(liquidNoise(0.5, 1.25, -0.75, 2)).toBeCloseTo(
      Math.sin(0.5 * 2 + 2) * Math.cos(1.25 * 3 + 1) * Math.sin(-0.75 * 1.5 + 1.6),
      12,
    )
  })

  it('clamps values to the source bounds', () => {
    expect(clamp(-0.05, -0.035, 0.035)).toBe(-0.035)
    expect(clamp(0.02, -0.035, 0.035)).toBe(0.02)
    expect(clamp(0.05, -0.035, 0.035)).toBe(0.035)
  })

  it('preserves desktop and mobile rest centers', () => {
    expect(getRestCenter({ left: 10, width: 500, height: 400 } as DOMRect, 900)).toEqual({
      x: 250,
      y: 192,
    })
    expect(getRestCenter({ left: 100, width: 600, height: 500 } as DOMRect, 1440)).toEqual({
      x: 980,
      y: 210,
    })
  })
})

describe('RelayMachineVisual', () => {
  const observer = {
    disconnect: vi.fn(),
    observe: vi.fn(),
  }
  let scheduledFrame: FrameRequestCallback | undefined

  beforeEach(() => {
    vi.clearAllMocks()
    scheduledFrame = undefined
    three.position.needsUpdate = false
    three.mesh.position.x = 0
    three.mesh.position.y = 0
    three.mesh.rotation.x = 0
    three.mesh.rotation.y = 0
    three.mesh.rotation.z = 0
    three.renderer.outputColorSpace = undefined
    three.renderer.toneMapping = undefined
    three.renderer.toneMappingExposure = 0
    three.scene.environment = undefined
    three.loader.load.mockImplementation((_path, onLoad) => onLoad(three.sourceTexture))

    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 3 })
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1440 })
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({ matches: false })),
    })
    Object.defineProperty(globalThis, 'ResizeObserver', {
      configurable: true,
      value: vi.fn(() => observer),
    })

    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
      return this instanceof HTMLCanvasElement ? rect(0, 0, 600, 600) : rect(100, 50, 600, 500)
    })
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      scheduledFrame = callback
      return 17
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined)
    vi.spyOn(window, 'addEventListener')
    vi.spyOn(window, 'removeEventListener')
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('includes the canonical radial, canvas sizing, and shadow utility classes', async () => {
    const wrapper = mount(RelayMachineVisual)
    await flushPromises()

    expect(wrapper.get('.landing-metal-radial').classes()).toEqual(
      expect.arrayContaining([
        'absolute',
        'inset-0',
        'bg-[radial-gradient(circle_at_56%_40%,var(--landing-glow-soft),transparent_36%)]',
      ]),
    )
    expect(wrapper.get('.landing-metal-canvas').classes()).toEqual(
      expect.arrayContaining([
        'absolute',
        'top-0',
        'left-0',
        'h-[min(92vw,420px)]',
        'w-[min(92vw,420px)]',
        'sm:h-[520px]',
        'sm:w-[520px]',
        'lg:h-[600px]',
        'lg:w-[600px]',
      ]),
    )
    expect(wrapper.get('.landing-metal-shadow').classes()).toEqual(
      expect.arrayContaining([
        'absolute',
        'right-[12%]',
        'bottom-8',
        'left-[12%]',
        'h-10',
        'bg-[var(--landing-shadow)]',
        'blur-3xl',
        'sm:right-[4%]',
        'sm:bottom-12',
        'sm:left-[28%]',
        'sm:h-12',
        'lg:right-[-8%]',
        'lg:bottom-14',
        'lg:left-[44%]',
        'lg:h-14',
      ]),
    )

    wrapper.unmount()
  })

  it('constructs the exact normal-motion Three.js scene', async () => {
    const wrapper = mount(RelayMachineVisual)
    await flushPromises()

    const canvas = wrapper.get('canvas').element
    expect(three.PerspectiveCamera).toHaveBeenCalledWith(40, 1, 0.1, 100)
    expect(three.camera.position.set).toHaveBeenCalledWith(0, 0, 5.9)
    expect(three.WebGLRenderer).toHaveBeenCalledWith(
      expect.objectContaining({
        alpha: true,
        antialias: true,
        canvas,
        powerPreference: 'high-performance',
      }),
    )
    expect(three.renderer.setClearColor).toHaveBeenCalledWith(0x000000, 0)
    expect(three.renderer.setPixelRatio).toHaveBeenCalledWith(Math.min(window.devicePixelRatio || 1, 2))
    expect(three.renderer.outputColorSpace).toBe('srgb')
    expect(three.renderer.toneMapping).toBe('aces-filmic')
    expect(three.renderer.toneMappingExposure).toBe(1.05)
    expect(three.SphereGeometry).toHaveBeenCalledWith(1.4, 64, 64)
    expect(three.rawGeometry.deleteAttribute).toHaveBeenCalledWith('uv')
    expect(three.mergeVertices).toHaveBeenCalledWith(three.rawGeometry, 1e-4)
    expect(three.MeshPhysicalMaterial).toHaveBeenCalledWith(
      expect.objectContaining({
        clearcoat: 1,
        clearcoatRoughness: 0.01,
        envMapIntensity: 2.35,
        ior: 2.4,
        metalness: 0.98,
        reflectivity: 0.95,
        roughness: 0.01,
        specularIntensity: 1,
        thickness: 0.5,
        transmission: 0.1,
      }),
    )
    expect(three.loader.load).toHaveBeenCalledWith(
      '/assets/empty_warehouse_01_1k.hdr',
      expect.any(Function),
    )
    expect(three.scene.environment).toBe(three.environment)
    expect(three.sourceTexture.dispose).toHaveBeenCalledOnce()
    expect(three.mesh.scale.setScalar).toHaveBeenCalledWith(1.04)
    expect(three.AmbientLight).toHaveBeenCalledWith(0xffffff, 0.08)
    expect(three.DirectionalLight).toHaveBeenNthCalledWith(1, 0xffffff, 0.9)
    expect(three.keyLight.position.set).toHaveBeenCalledWith(4, 4, 5)
    expect(three.DirectionalLight).toHaveBeenNthCalledWith(2, 0xd8c99f, 0.55)
    expect(three.rimLight.position.set).toHaveBeenCalledWith(-5, -2, 3)
    expect(window.requestAnimationFrame).toHaveBeenCalledOnce()

    wrapper.unmount()
  })

  it('preserves the source per-frame deformation and transforms', async () => {
    vi.spyOn(performance, 'now').mockReturnValue(2000)
    const wrapper = mount(RelayMachineVisual)
    await flushPromises()

    const render = scheduledFrame
    expect(render).toBeTypeOf('function')
    render?.(0)

    const wave =
      liquidNoise(0.5, 0, 0, 1) * 0.3 +
      liquidNoise(1.2, 0, 0, 1.6) * 0.15 +
      liquidNoise(2, 0, 0, 2.4) * 0.08
    const [, nextX, nextY, nextZ] = three.position.setXYZ.mock.calls[0]
    expect(nextX).toBeCloseTo(1 + wave, 12)
    expect(nextY).toBe(0)
    expect(nextZ).toBe(0)
    expect(three.position.needsUpdate).toBe(true)
    expect(three.mesh.rotation.y).toBe(0.004)
    expect(three.mesh.rotation.x).toBe(0.0016)
    expect(three.mesh.scale.setScalar).toHaveBeenLastCalledWith(1.04)
    expect(three.mesh.position).toEqual({ x: 0, y: -0 })
    expect(wrapper.get('canvas').element.style.transform).toBe(
      'translate(980px, 210px) translate(-50%, -50%)',
    )
    expect(three.renderer.render).toHaveBeenCalledWith(three.scene, three.camera)

    wrapper.unmount()
  })

  it('wires pointer interaction with the exact source event behavior', async () => {
    const wrapper = mount(RelayMachineVisual)
    await flushPromises()

    expect(window.addEventListener).toHaveBeenCalledWith('pointermove', expect.any(Function), {
      passive: true,
    })
    expect(window.addEventListener).toHaveBeenCalledWith('pointerdown', expect.any(Function), {
      passive: true,
    })
    expect(window.addEventListener).toHaveBeenCalledWith('pointerup', expect.any(Function), {
      passive: true,
    })
    expect(window.addEventListener).toHaveBeenCalledWith('pointercancel', expect.any(Function), {
      passive: true,
    })

    const stage = wrapper.get('.landing-metal-stage').element as HTMLElement
    window.dispatchEvent(new MouseEvent('pointerdown', { clientX: 900, clientY: 250 }))
    expect(stage.dataset.dragging).toBe('true')
    expect(stage.style.getPropertyValue('--qj-metal-x')).toBe('0.833')
    expect(stage.style.getPropertyValue('--qj-metal-y')).toBe('-0.100')

    window.dispatchEvent(new MouseEvent('pointerup'))
    expect(stage.hasAttribute('data-dragging')).toBe(false)

    wrapper.unmount()
  })

  it('renders one visible frame without continuous RAF for reduced motion', async () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({ matches: true })),
    })

    const wrapper = mount(RelayMachineVisual)
    await flushPromises()

    expect(wrapper.get('canvas').isVisible()).toBe(true)
    expect(three.renderer.render).toHaveBeenCalledOnce()
    expect(window.requestAnimationFrame).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('disposes scene resources and removes all pointer listeners', async () => {
    const wrapper = mount(RelayMachineVisual)
    await flushPromises()
    wrapper.unmount()

    expect(observer.disconnect).toHaveBeenCalledOnce()
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(17)
    expect(three.geometry.dispose).toHaveBeenCalledOnce()
    expect(three.material.dispose).toHaveBeenCalledOnce()
    expect(three.environment.dispose).toHaveBeenCalledOnce()
    expect(three.pmrem.dispose).toHaveBeenCalledOnce()
    expect(three.renderer.dispose).toHaveBeenCalledOnce()
    expect(window.removeEventListener).toHaveBeenCalledWith('pointermove', expect.any(Function))
    expect(window.removeEventListener).toHaveBeenCalledWith('pointerdown', expect.any(Function))
    expect(window.removeEventListener).toHaveBeenCalledWith('pointerup', expect.any(Function))
    expect(window.removeEventListener).toHaveBeenCalledWith('pointercancel', expect.any(Function))
  })

  it('disposes a delayed HDR texture without using PMREM after unmount', async () => {
    let completeHDRLoad: ((texture: typeof three.sourceTexture) => void) | undefined
    three.loader.load.mockImplementation((_path, onLoad) => {
      completeHDRLoad = onLoad
    })

    const wrapper = mount(RelayMachineVisual)
    await flushPromises()
    wrapper.unmount()

    expect(completeHDRLoad).toBeTypeOf('function')
    completeHDRLoad?.(three.sourceTexture)

    expect(three.sourceTexture.dispose).toHaveBeenCalledOnce()
    expect(three.pmrem.fromEquirectangular).not.toHaveBeenCalled()
    expect(three.scene.environment).toBeUndefined()
    expect(three.environment.dispose).not.toHaveBeenCalled()
  })
})
