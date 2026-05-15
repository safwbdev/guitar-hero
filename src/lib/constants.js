export const LANE_COLORS_HEX = [0x22d3ee, 0xff4d6d, 0xfacc15, 0x4ade80, 0xc084fc]
export const LANE_COLORS_CSS = ['#22d3ee', '#ff4d6d', '#facc15', '#4ade80', '#c084fc']
export const LANE_KEYS = ['a', 's', 'd', 'f', 'g']
export const LANE_LABELS = ['A', 'S', 'D', 'F', 'G']
export const LANE_COUNT = 5

export const HIT_Z = 2.0
export const SPAWN_Z = -20
export const NOTE_SPEED = 12
export const HIGHWAY_WIDTH = 5.2
export const LANE_WIDTH = HIGHWAY_WIDTH / LANE_COUNT

export const HIT_WINDOW = 1.4
export const PERFECT_WINDOW = 0.3
export const GREAT_WINDOW = 0.65

export const SCORE_PERFECT = 300
export const SCORE_GREAT = 200
export const SCORE_GOOD = 100
export const MAX_MULTIPLIER = 4
export const MULTIPLIER_STEP = 10

export const SCHED_LOOKAHEAD = (HIT_Z - SPAWN_Z) / NOTE_SPEED

const BEAT = 60 / 128

export function generateChart() {
  const out = []
  let t = BEAT * 1.5
  const seqs = [
    [[0], [2], [4], [2], [0]],
    [[1], [3], [1], [3]],
    [[0, 2], [2, 4], [1, 3]],
    [[0], [1], [2], [3], [4]],
    [[4], [3], [2], [1], [0]],
    [[0], [0], [2], [2], [4], [4]],
    [[1, 3], [0, 4], [2], [1, 3]],
    [[0], [2], [4], [2], [0], [1], [3]],
    [[0, 1], [2, 3], [4], [2, 3], [0, 1]],
    [[0], [4], [1], [3], [2]],
    [[0, 2, 4], [1, 3], [2]],
    [[3], [1], [4], [0], [2]],
  ]
  for (let rep = 0; rep < 14; rep++) {
    const seq = seqs[rep % seqs.length]
    seq.forEach(pat => {
      pat.forEach(lane => out.push({ lane, time: t, id: `${out.length}` }))
      t += BEAT * (Math.random() < 0.28 ? 0.5 : 1.0)
    })
    t += BEAT * 0.5
  }
  return out.sort((a, b) => a.time - b.time)
}
