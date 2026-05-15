// Audio — hit/miss feedback sounds only. No background music.

let ac = null
let masterGain = null

export function initAudio() {
  if (ac) return
  ac = new (window.AudioContext || window.webkitAudioContext)()
  masterGain = ac.createGain()
  masterGain.gain.value = 0.75
  masterGain.connect(ac.destination)
}

export function resumeAudio() {
  if (ac && ac.state === 'suspended') ac.resume()
}

function env(vol) {
  const g = ac.createGain()
  g.gain.value = vol
  g.connect(masterGain)
  return g
}

export function hitTone(lane, perfect) {
  if (!ac) return
  const freqs = [330, 392, 440, 523, 622]
  const f = freqs[lane]
  const o = ac.createOscillator()
  o.type = 'sine'
  o.frequency.value = f
  const g = env(0.32)
  g.gain.setValueAtTime(0.32, ac.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.14)
  o.connect(g)
  o.start(ac.currentTime)
  o.stop(ac.currentTime + 0.16)

  if (perfect) {
    const o2 = ac.createOscillator()
    o2.type = 'sine'
    o2.frequency.value = f * 2
    const g2 = env(0.14)
    g2.gain.setValueAtTime(0.14, ac.currentTime)
    g2.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.22)
    o2.connect(g2)
    o2.start(ac.currentTime)
    o2.stop(ac.currentTime + 0.24)
  }
}

export function missTone() {
  if (!ac) return
  const o = ac.createOscillator()
  o.type = 'sawtooth'
  o.frequency.setValueAtTime(100, ac.currentTime)
  o.frequency.exponentialRampToValueAtTime(42, ac.currentTime + 0.12)
  const lp = ac.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 400
  const g = env(0.2)
  g.gain.setValueAtTime(0.2, ac.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.14)
  o.connect(lp)
  lp.connect(g)
  o.start(ac.currentTime)
  o.stop(ac.currentTime + 0.18)
}
