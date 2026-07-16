<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import type * as Three from 'three'

import { clamp, getRestCenter, liquidNoise } from './relayMachineMath'

const stageRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const motion = reactive({
  targetX: 0,
  targetY: 0,
  targetCx: 0,
  targetCy: 0,
  cx: 0,
  cy: 0,
  rotateX: 0,
  rotateY: 0,
  targetRotateX: 0,
  targetRotateY: 0,
  x: 0,
  y: 0,
  dragX: 0,
  dragY: 0,
  down: false,
  lastX: 0,
  lastY: 0,
  vx: 0,
  vy: 0,
})

let disposed = false
let frame = 0
let observer: ResizeObserver | undefined
let geometry: Three.BufferGeometry | undefined
let material: Three.MeshPhysicalMaterial | undefined
let environment: Three.Texture | undefined
let pmrem: Three.PMREMGenerator | undefined
let renderer: Three.WebGLRenderer | undefined

const updatePointer = (event: globalThis.PointerEvent) => {
  const stage = stageRef.value
  if (!stage) return

  const rect = stage.getBoundingClientRect()
  const localX = event.clientX - rect.left
  const localY = event.clientY - rect.top
  const x = localX / rect.width - 0.5
  const y = localY / rect.height - 0.5
  stage.style.setProperty('--qj-metal-x', x.toFixed(3))
  stage.style.setProperty('--qj-metal-y', y.toFixed(3))
  motion.targetX = x
  motion.targetY = y

  if (motion.down) {
    const dragX = (event.clientX - motion.lastX) / rect.width
    const dragY = (event.clientY - motion.lastY) / rect.height

    motion.targetRotateY = clamp(dragX * 2.8, -0.035, 0.035)
    motion.targetRotateX = clamp(dragY * 2.2, -0.028, 0.028)
    motion.lastX = event.clientX
    motion.lastY = event.clientY
  }
}

const startDrag = (event: globalThis.PointerEvent) => {
  if (event.clientX < window.innerWidth * 0.48) return

  const stage = stageRef.value
  motion.down = true
  motion.lastX = event.clientX
  motion.lastY = event.clientY
  stage?.setAttribute('data-dragging', 'true')
  updatePointer(event)
}

const endDrag = () => {
  const stage = stageRef.value
  motion.down = false
  motion.targetRotateX = 0
  motion.targetRotateY = 0
  stage?.removeAttribute('data-dragging')
}

function initializeScene(
  THREE: typeof import('three'),
  RGBELoader: typeof import('three/examples/jsm/loaders/RGBELoader.js').RGBELoader,
  mergeVertices: typeof import('three/examples/jsm/utils/BufferGeometryUtils.js').mergeVertices,
) {
  const canvas = canvasRef.value
  if (!canvas) return

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100)
  camera.position.set(0, 0, 5.9)

  const sceneRenderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas,
    powerPreference: 'high-performance',
  })
  renderer = sceneRenderer
  sceneRenderer.setClearColor(0x000000, 0)
  sceneRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  sceneRenderer.outputColorSpace = THREE.SRGBColorSpace
  sceneRenderer.toneMapping = THREE.ACESFilmicToneMapping
  sceneRenderer.toneMappingExposure = 1.05

  const pmremGenerator = new THREE.PMREMGenerator(sceneRenderer)
  pmrem = pmremGenerator

  const rawGeometry = new THREE.SphereGeometry(1.4, 64, 64)
  rawGeometry.deleteAttribute('uv')
  const mergedGeometry = mergeVertices(rawGeometry, 1e-4)
  geometry = mergedGeometry
  rawGeometry.dispose()
  mergedGeometry.computeVertexNormals()
  const position = mergedGeometry.getAttribute('position')
  const basePositions = new Float32Array(position.array)
  const vertexCount = position.count

  const meshMaterial = new THREE.MeshPhysicalMaterial({
    clearcoat: 1,
    clearcoatRoughness: 0.01,
    color: new THREE.Color('#f8f9fa'),
    envMapIntensity: 2.35,
    ior: 2.4,
    metalness: 0.98,
    reflectivity: 0.95,
    roughness: 0.01,
    specularColor: new THREE.Color('#ffffff'),
    specularIntensity: 1,
    thickness: 0.5,
    transmission: 0.1,
  })
  material = meshMaterial

  const mesh = new THREE.Mesh(mergedGeometry, meshMaterial)
  mesh.scale.setScalar(1.04)
  mesh.rotation.y = 0
  scene.add(mesh)
  scene.add(new THREE.AmbientLight(0xffffff, 0.08))

  const key = new THREE.DirectionalLight(0xffffff, 0.9)
  key.position.set(4, 4, 5)
  scene.add(key)

  const rim = new THREE.DirectionalLight(0xd8c99f, 0.55)
  rim.position.set(-5, -2, 3)
  scene.add(rim)

  new RGBELoader().load('/assets/empty_warehouse_01_1k.hdr', (texture) => {
    environment = pmremGenerator.fromEquirectangular(texture).texture
    scene.environment = environment
    texture.dispose()
  })

  const resize = () => {
    const rect = canvas.getBoundingClientRect()
    const width = Math.max(1, rect.width)
    const height = Math.max(1, rect.height)
    sceneRenderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()

    const stageRect = stageRef.value?.getBoundingClientRect()
    if (stageRect && motion.targetCx === 0 && motion.targetCy === 0) {
      const rest = getRestCenter(stageRect)
      motion.targetCx = rest.x
      motion.targetCy = rest.y
      motion.cx = rest.x
      motion.cy = rest.y
    }
  }

  const deformAndRender = (time: number) => {
    for (let index = 0; index < vertexCount; index++) {
      const ix = index * 3
      const x = basePositions[ix]
      const y = basePositions[ix + 1]
      const z = basePositions[ix + 2]
      const length = Math.sqrt(x * x + y * y + z * z)
      if (length === 0) continue

      const nx = x / length
      const ny = y / length
      const nz = z / length
      const wave =
        liquidNoise(x * 0.5, y * 0.5, z * 0.5, time * 0.5) * 0.3 +
        liquidNoise(x * 1.2, y * 1.2, z * 1.2, time * 0.8) * 0.15 +
        liquidNoise(x * 2, y * 2, z * 2, time * 1.2) * 0.08
      const pointerFalloff = Math.max(0, 1 - Math.hypot(motion.x * 1.35, motion.y * 1.2))
      const pull =
        (x * motion.x * 0.06 - y * motion.y * 0.044) * (0.45 + pointerFalloff * 0.75)

      position.setXYZ(
        index,
        x + nx * (wave + pull),
        y + ny * (wave + pull),
        z + nz * (wave + pull),
      )
    }

    position.needsUpdate = true
    mergedGeometry.computeVertexNormals()

    mesh.rotation.y += 0.004
    mesh.rotation.x += 0.0016
    mesh.rotation.y += motion.rotateY
    mesh.rotation.x += motion.rotateX
    mesh.rotation.z = 0
    mesh.scale.setScalar(motion.down ? 1.065 : 1.04)
    mesh.position.x = motion.x * 0.08
    mesh.position.y = motion.y * -0.06

    canvas.style.transform = `translate(${motion.cx}px, ${motion.cy}px) translate(-50%, -50%)`
    sceneRenderer.render(scene, camera)
  }

  const render = () => {
    frame = window.requestAnimationFrame(render)
    const time = performance.now() * 0.001

    const stageRect = stageRef.value?.getBoundingClientRect()
    if (stageRect) {
      const rest = getRestCenter(stageRect)
      motion.targetCx = rest.x
      motion.targetCy = rest.y
    }
    motion.cx += (motion.targetCx - motion.cx) * 0.18
    motion.cy += (motion.targetCy - motion.cy) * 0.18
    motion.rotateX += (motion.targetRotateX - motion.rotateX) * 0.18
    motion.rotateY += (motion.targetRotateY - motion.rotateY) * 0.18
    motion.x += (motion.targetX - motion.x) * 0.12
    motion.y += (motion.targetY - motion.y) * 0.12
    if (!motion.down) {
      motion.vx *= 0.9
      motion.vy *= 0.9
    }

    deformAndRender(time)
  }

  resize()
  observer = new ResizeObserver(resize)
  observer.observe(canvas)

  if (reducedMotion) {
    deformAndRender(0)
    return
  }

  frame = window.requestAnimationFrame(render)
}

onMounted(async () => {
  window.addEventListener('pointermove', updatePointer, { passive: true })
  window.addEventListener('pointerdown', startDrag, { passive: true })
  window.addEventListener('pointerup', endDrag, { passive: true })
  window.addEventListener('pointercancel', endDrag, { passive: true })

  const [THREE, { RGBELoader }, { mergeVertices }] = await Promise.all([
    import('three'),
    import('three/examples/jsm/loaders/RGBELoader.js'),
    import('three/examples/jsm/utils/BufferGeometryUtils.js'),
  ])

  if (disposed) return
  initializeScene(THREE, RGBELoader, mergeVertices)
})

onBeforeUnmount(() => {
  disposed = true
  window.removeEventListener('pointermove', updatePointer)
  window.removeEventListener('pointerdown', startDrag)
  window.removeEventListener('pointerup', endDrag)
  window.removeEventListener('pointercancel', endDrag)
  observer?.disconnect()
  window.cancelAnimationFrame(frame)
  geometry?.dispose()
  material?.dispose()
  environment?.dispose()
  pmrem?.dispose()
  renderer?.dispose()
})
</script>

<template>
  <div
    ref="stageRef"
    class="landing-metal-stage relative min-h-[360px] overflow-visible sm:min-h-[440px] lg:min-h-[560px]"
  >
    <div class="absolute inset-0 landing-metal-radial" />
    <canvas
      ref="canvasRef"
      aria-hidden="true"
      class="landing-metal-canvas absolute left-0 top-0"
    />
    <div class="landing-metal-shadow absolute" />
  </div>
</template>
