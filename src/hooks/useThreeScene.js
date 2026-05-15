import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import {
  LANE_COLORS_HEX, LANE_COUNT, HIGHWAY_WIDTH, LANE_WIDTH,
  HIT_Z, SPAWN_Z, NOTE_SPEED,
  HIT_WINDOW, PERFECT_WINDOW, GREAT_WINDOW,
  SCORE_PERFECT, SCORE_GREAT, SCORE_GOOD,
  MAX_MULTIPLIER, MULTIPLIER_STEP, SCHED_LOOKAHEAD,
} from '../lib/constants'
import { hitTone, missTone } from '../lib/audio'

const NOTE_GEO = new THREE.CylinderGeometry(0.23, 0.23, 0.22, 18)

function makeMat(col) {
  return new THREE.MeshStandardMaterial({
    color: col, emissive: col, emissiveIntensity: 0.75,
    metalness: 0.2, roughness: 0.2,
  })
}

export function useThreeScene(canvasRef, onStateChange) {
  const stateRef = useRef({
    running: false,
    notes: [],
    spawnIdx: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    misses: 0,
    elapsed: 0,
    noteObjects: new Map(),
    particles: [],
    hitFlash: new Array(LANE_COUNT).fill(0),
    scene: null,
    camera: null,
    renderer: null,
    buttons: [],
    glows: [],
    btnLights: [],
    gridLines: [],
    rafId: null,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const s = stateRef.current

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    s.renderer = renderer

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x060610)
    scene.fog = new THREE.FogExp2(0x060610, 0.038)
    s.scene = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 80)
    camera.position.set(0, 4, 5.5)
    camera.lookAt(0, 0, -3)
    s.camera = camera

    // Lights
    scene.add(new THREE.AmbientLight(0x223355, 2))
    const sun = new THREE.DirectionalLight(0xffffff, 1)
    sun.position.set(2, 8, 4)
    scene.add(sun)
    LANE_COLORS_HEX.forEach((c, i) => {
      const pl = new THREE.PointLight(c, 1.4, 10)
      pl.position.set((i - 2) * LANE_WIDTH, 1.5, HIT_Z)
      scene.add(pl)
    })

    // Highway floor
    const hw = new THREE.Mesh(
      new THREE.PlaneGeometry(HIGHWAY_WIDTH, 28),
      new THREE.MeshStandardMaterial({ color: 0x0d0d22, metalness: 0.5, roughness: 0.6 })
    )
    hw.rotation.x = -Math.PI / 2
    hw.position.set(0, 0, -6)
    scene.add(hw)

    // Lane dividers
    for (let i = 1; i < LANE_COUNT; i++) {
      const div = new THREE.Mesh(
        new THREE.PlaneGeometry(0.03, 28),
        new THREE.MeshBasicMaterial({ color: 0x223344, transparent: true, opacity: 0.4 })
      )
      div.rotation.x = -Math.PI / 2
      div.position.set(-HIGHWAY_WIDTH / 2 + i * LANE_WIDTH, 0.001, -6)
      scene.add(div)
    }

    // Scrolling grid lines
    const gridLines = []
    for (let g = 0; g < 14; g++) {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(HIGHWAY_WIDTH, 0.05),
        new THREE.MeshBasicMaterial({ color: 0x1a2a55, transparent: true, opacity: 0.5 })
      )
      m.rotation.x = -Math.PI / 2
      m.position.set(0, 0.002, SPAWN_Z + g * 2)
      scene.add(m)
      gridLines.push(m)
    }
    s.gridLines = gridLines

    // Hit zone bar
    const hitBar = new THREE.Mesh(
      new THREE.BoxGeometry(HIGHWAY_WIDTH, 0.1, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x2244aa, emissive: 0x112266, emissiveIntensity: 0.8, metalness: 0.9 })
    )
    hitBar.position.set(0, 0.05, HIT_Z)
    scene.add(hitBar)

    // Lane buttons + glow rings + point lights
    const buttons = [], glows = [], btnLights = []
    LANE_COLORS_HEX.forEach((col, i) => {
      const x = (i - 2) * LANE_WIDTH
      const btn = new THREE.Mesh(
        new THREE.CylinderGeometry(0.27, 0.27, 0.14, 24),
        new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.4, metalness: 0.4, roughness: 0.3 })
      )
      btn.position.set(x, 0.07, HIT_Z)
      scene.add(btn); buttons.push(btn)

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.33, 0.05, 8, 28),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0 })
      )
      ring.rotation.x = Math.PI / 2
      ring.position.set(x, 0.07, HIT_Z)
      scene.add(ring); glows.push(ring)

      const pl = new THREE.PointLight(col, 0, 3)
      pl.position.set(x, 0.5, HIT_Z)
      scene.add(pl); btnLights.push(pl)
    })
    s.buttons = buttons; s.glows = glows; s.btnLights = btnLights

    // Resize handler
    const onResize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)

    // Helpers
    function spawnNote(nd) {
      const mesh = new THREE.Mesh(NOTE_GEO, makeMat(LANE_COLORS_HEX[nd.lane]))
      mesh.position.set((nd.lane - 2) * LANE_WIDTH, 0.2, SPAWN_Z)
      mesh.rotation.x = Math.PI / 2
      mesh.userData = { lane: nd.lane, id: nd.id, hit: false }
      scene.add(mesh)
      s.noteObjects.set(nd.id, mesh)
    }

    function spawnParticles(lane) {
      const col = new THREE.Color(LANE_COLORS_HEX[lane])
      const x = (lane - 2) * LANE_WIDTH
      for (let i = 0; i < 14; i++) {
        const m = new THREE.Mesh(
          new THREE.SphereGeometry(0.07, 6, 6),
          new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 1 })
        )
        m.position.set(x + (Math.random() - 0.5) * 0.5, 0.3, HIT_Z)
        scene.add(m)
        s.particles.push({
          mesh: m,
          vx: (Math.random() - 0.5) * 5,
          vy: Math.random() * 5 + 2,
          vz: (Math.random() - 0.5) * 2,
          life: 0.6 + Math.random() * 0.3,
          ml: 0.9,
        })
      }
    }

    // Render loop
    let lastT = performance.now() / 1000

    function animate() {
      s.rafId = requestAnimationFrame(animate)
      const now = performance.now() / 1000
      const dt = Math.min(now - lastT, 0.05)
      lastT = now

      if (s.running) {
        s.elapsed += dt

        // Spawn notes
        while (s.spawnIdx < s.notes.length && s.notes[s.spawnIdx].time <= s.elapsed + SCHED_LOOKAHEAD) {
          spawnNote(s.notes[s.spawnIdx++])
        }

        // Move notes + miss detection
        const toRemove = []
        s.noteObjects.forEach((mesh, id) => {
          mesh.position.z += NOTE_SPEED * dt
          if (!mesh.userData.hit && mesh.position.z > HIT_Z + 0.9) {
            toRemove.push(id)
            s.combo = 0
            s.misses++
            missTone()
            onStateChange({ type: 'miss', score: s.score, combo: 0, misses: s.misses })
          } else if (mesh.position.z > HIT_Z + 2.5) {
            toRemove.push(id)
          }
        })
        toRemove.forEach(id => {
          const m = s.noteObjects.get(id)
          if (m) scene.remove(m)
          s.noteObjects.delete(id)
        })

        // Scroll grid lines
        s.gridLines.forEach(gl => {
          gl.position.z += NOTE_SPEED * dt * 0.12
          if (gl.position.z > HIT_Z + 2) gl.position.z -= 28
        })

        // Particles
        for (let pi = s.particles.length - 1; pi >= 0; pi--) {
          const p = s.particles[pi]
          p.life -= dt
          if (p.life <= 0) { scene.remove(p.mesh); s.particles.splice(pi, 1); continue }
          p.mesh.position.x += p.vx * dt
          p.mesh.position.y += p.vy * dt
          p.mesh.position.z += p.vz * dt
          p.vy -= 7 * dt
          p.mesh.material.opacity = p.life / p.ml
          const sc = p.life / p.ml
          p.mesh.scale.set(sc, sc, sc)
        }

        // Camera subtle movement
        camera.position.y = 4 + Math.sin(now * 0.5) * 0.04
        camera.position.x = Math.sin(now * 0.3) * 0.05

        // End check
        if (s.spawnIdx >= s.notes.length && s.noteObjects.size === 0) {
          s.running = false
          onStateChange({ type: 'end', score: s.score, maxCombo: s.maxCombo, misses: s.misses, total: s.notes.length })
        }
      }

      // Button flash + glow rings
      s.buttons.forEach((btn, i) => {
        const intensity = Math.max(0, (s.hitFlash[i] - now) / 0.18)
        btn.material.emissiveIntensity = 0.4 + intensity * 1.5
        s.glows[i].material.opacity = intensity * 0.9
        s.glows[i].scale.setScalar(1 + intensity * 0.18)
        s.btnLights[i].intensity = intensity * 2.5
      })

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(s.rafId)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
    }
  }, [])

  function handleKey(lane) {
    const s = stateRef.current
    if (!s.running) return
    const now = performance.now() / 1000
    s.hitFlash[lane] = now + 0.18

    let bestId = null, bestDist = Infinity
    s.noteObjects.forEach((mesh, id) => {
      if (mesh.userData.lane === lane && !mesh.userData.hit) {
        const d = Math.abs(mesh.position.z - HIT_Z)
        if (d < bestDist) { bestDist = d; bestId = id }
      }
    })

    if (bestId !== null && bestDist < HIT_WINDOW) {
      const mesh = s.noteObjects.get(bestId)
      mesh.userData.hit = true
      s.scene.remove(mesh)
      s.noteObjects.delete(bestId)

      s.combo++
      if (s.combo > s.maxCombo) s.maxCombo = s.combo
      const pts = bestDist < PERFECT_WINDOW ? SCORE_PERFECT : bestDist < GREAT_WINDOW ? SCORE_GREAT : SCORE_GOOD
      s.score += pts * Math.min(MAX_MULTIPLIER, 1 + Math.floor(s.combo / MULTIPLIER_STEP))

      const quality = bestDist < PERFECT_WINDOW ? 'perfect' : bestDist < GREAT_WINDOW ? 'great' : 'good'
      hitTone(lane, quality === 'perfect')

      // Particles
      const col = new THREE.Color(LANE_COLORS_HEX[lane])
      const x = (lane - 2) * LANE_WIDTH
      for (let i = 0; i < 14; i++) {
        const m = new THREE.Mesh(
          new THREE.SphereGeometry(0.07, 6, 6),
          new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 1 })
        )
        m.position.set(x + (Math.random() - 0.5) * 0.5, 0.3, HIT_Z)
        s.scene.add(m)
        s.particles.push({
          mesh: m,
          vx: (Math.random() - 0.5) * 5, vy: Math.random() * 5 + 2,
          vz: (Math.random() - 0.5) * 2,
          life: 0.6 + Math.random() * 0.3, ml: 0.9,
        })
      }

      onStateChange({ type: 'hit', quality, score: s.score, combo: s.combo, misses: s.misses })
    } else {
      missTone()
    }
  }

  function startGame(notes) {
    const s = stateRef.current
    s.notes = notes; s.spawnIdx = 0
    s.score = 0; s.combo = 0; s.maxCombo = 0; s.misses = 0; s.elapsed = 0
    s.noteObjects.forEach(m => s.scene.remove(m)); s.noteObjects.clear()
    s.particles.forEach(p => s.scene.remove(p.mesh)); s.particles.length = 0
    s.hitFlash.fill(0)
    s.running = true
  }

  function stopGame() {
    stateRef.current.running = false
  }

  return { handleKey, startGame, stopGame }
}
