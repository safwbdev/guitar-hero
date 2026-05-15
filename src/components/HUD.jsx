import React, { useEffect, useRef, useState } from 'react'
import { LANE_COLORS_CSS, LANE_LABELS } from '../lib/constants'
import '../styles/HUD.scss'

const FEEDBACK_TEXT = {
  perfect: 'PERFECT!',
  great: 'GREAT!',
  good: 'GOOD',
  miss: 'MISS',
}

function StreakPips({ combo }) {
  const lit = Math.min(combo % 11, 10)
  return (
    <div className="streak">
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className={`streak_pip${i < lit ? ' streak_pip--lit' : ''}`} />
      ))}
    </div>
  )
}

function FeedbackText({ feedback }) {
  const [visible, setVisible] = useState(false)
  const [current, setCurrent] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!feedback) return
    setCurrent(feedback)
    setVisible(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setVisible(false), 500)
    return () => clearTimeout(timerRef.current)
  }, [feedback])

  if (!current) return null

  return (
    <div className={`feedback feedback--${current} ${visible ? 'feedback--visible' : 'feedback--hidden'}`}>
      {FEEDBACK_TEXT[current] ?? current}
    </div>
  )
}

export default function HUD({ score, combo, misses, feedback, onKeyPress }) {
  const comboMod = combo > 20 ? 'high' : combo > 10 ? 'mid' : 'low'

  return (
    <>
      <div className="panel score-panel">
        <div className="panel_label">Score</div>
        <div className="panel_value score-panel_value">{score.toLocaleString()}</div>
      </div>

      <div className="panel combo-panel">
        <div className="panel_label">Combo</div>
        <div className={`panel_value combo-panel_value combo-panel_value--${comboMod}`}>x{combo}</div>
      </div>

      <div className="panel misses-panel">Misses: {misses}</div>

      <FeedbackText feedback={feedback} />

      <StreakPips combo={combo} />

      <div className="lane-buttons">
        {LANE_LABELS.map((label, i) => (
          <button
            key={i}
            className="lane-btn"
            style={{ borderColor: LANE_COLORS_CSS[i], color: LANE_COLORS_CSS[i] }}
            onPointerDown={e => { e.preventDefault(); onKeyPress(i) }}
          >
            {label}
          </button>
        ))}
      </div>
    </>
  )
}
