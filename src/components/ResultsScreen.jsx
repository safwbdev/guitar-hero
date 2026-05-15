import React from 'react'
import '../styles/ResultsScreen.scss'

function StatCard({ label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-card_label">{label}</div>
      <div className="stat-card_value" style={{ color }}>{value}</div>
    </div>
  )
}

function getRating(accuracy) {
  if (accuracy >= 98) return { text: 'S', color: '#facc15' }
  if (accuracy >= 90) return { text: 'A', color: '#4ade80' }
  if (accuracy >= 75) return { text: 'B', color: '#22d3ee' }
  if (accuracy >= 60) return { text: 'C', color: '#c084fc' }
  return { text: 'F', color: '#ff4d6d' }
}

export default function ResultsScreen({ score, maxCombo, misses, total, onPlayAgain }) {
  const accuracy = total > 0 ? Math.round(((total - misses) / total) * 100) : 100
  const rating = getRating(accuracy)

  return (
    <div className="results">
      <div className="results_eyebrow">Results</div>

      <h2 className="results_title">GAME OVER</h2>

      <div className="results_rating" style={{ color: rating.color, textShadow: `0 0 40px ${rating.color}88` }}>
        {rating.text}
      </div>

      <div className="results_grid">
        <StatCard label="Final Score" value={score.toLocaleString()} color="#22d3ee" />
        <StatCard label="Max Combo" value={`x${maxCombo}`} color="#facc15" />
        <StatCard label="Accuracy" value={`${accuracy}%`} color="#4ade80" />
        <StatCard label="Misses" value={misses} color="#ff4d6d" />
      </div>

      <button className="results_replay-btn" onClick={onPlayAgain}>
        PLAY AGAIN
      </button>
    </div>
  )
}
