import React, { useRef, useState, useCallback, useEffect } from 'react'
import { useThreeScene } from './hooks/useThreeScene'
import { initAudio, resumeAudio } from './lib/audio'
import { generateChart, LANE_KEYS } from './lib/constants'
import HUD from './components/HUD'
import MenuScreen from './components/MenuScreen'
import ResultsScreen from './components/ResultsScreen'
import './styles/App.scss'

const PHASE = { MENU: 'menu', PLAYING: 'playing', RESULTS: 'results' }

export default function App() {
  const canvasRef = useRef(null)

  const [phase, setPhase] = useState(PHASE.MENU)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [misses, setMisses] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [results, setResults] = useState(null)

  const feedbackTimerRef = useRef(null)

  const showFeedback = useCallback((type) => {
    setFeedback(type)
    clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 520)
  }, [])

  const onStateChange = useCallback((event) => {
    switch (event.type) {
      case 'hit':
        setScore(event.score)
        setCombo(event.combo)
        setMisses(event.misses)
        showFeedback(event.quality)
        break
      case 'miss':
        setScore(event.score)
        setCombo(event.combo)
        setMisses(event.misses)
        showFeedback('miss')
        break
      case 'end':
        setResults({
          score: event.score,
          maxCombo: event.maxCombo,
          misses: event.misses,
          total: event.total,
        })
        setPhase(PHASE.RESULTS)
        break
    }
  }, [showFeedback])

  const { handleKey, startGame } = useThreeScene(canvasRef, onStateChange)

  const handlePlay = useCallback(() => {
    initAudio()
    resumeAudio()
    const chart = generateChart()
    startGame(chart)
    setScore(0); setCombo(0); setMisses(0); setFeedback(null); setResults(null)
    setPhase(PHASE.PLAYING)
  }, [startGame])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (phase !== PHASE.PLAYING) return
      const i = LANE_KEYS.indexOf(e.key.toLowerCase())
      if (i !== -1) { e.preventDefault(); handleKey(i) }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [phase, handleKey])

  return (
    <div className="app">
      <canvas ref={canvasRef} className="app_canvas" />

      {phase === PHASE.PLAYING && (
        <HUD
          score={score}
          combo={combo}
          misses={misses}
          feedback={feedback}
          onKeyPress={handleKey}
        />
      )}

      {phase === PHASE.MENU && <MenuScreen onPlay={handlePlay} />}

      {phase === PHASE.RESULTS && results && (
        <ResultsScreen
          score={results.score}
          maxCombo={results.maxCombo}
          misses={results.misses}
          total={results.total}
          onPlayAgain={handlePlay}
        />
      )}
    </div>
  )
}
