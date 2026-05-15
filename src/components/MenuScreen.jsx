import React from 'react'
import { LANE_COLORS_CSS, LANE_LABELS } from '../lib/constants'
import '../styles/MenuScreen.scss'

const SCORING = [
  { label: 'PERFECT', color: '#facc15', pts: 300 },
  { label: 'GREAT', color: '#4ade80', pts: 200 },
  { label: 'GOOD', color: '#22d3ee', pts: 100 },
]

export default function MenuScreen({ onPlay }) {
  return (
    <div className="menu">
      <div className="menu_eyebrow">React | JavaScript | Three.js</div>

      <h1 className="menu_title">Web Riff</h1>

      <p className="menu_tagline">
        Hit notes as they reach the buttons &bull; A S D F G
      </p>

      <div className="menu_keys">
        {LANE_LABELS.map((label, i) => (
          <div
            key={i}
            className="menu_key"
            style={{ borderColor: LANE_COLORS_CSS[i], color: LANE_COLORS_CSS[i] }}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="menu_scoring">
        {SCORING.map(({ label, color, pts }) => (
          <div key={label} className="menu_score-item">
            <div className="menu_score-item-label" style={{ color }}>{label}</div>
            <div className="menu_score-item-pts">{pts} pts</div>
          </div>
        ))}
      </div>

      <button className="menu_play-btn" onClick={onPlay}>
        PLAY
      </button>
    </div>
  )
}
