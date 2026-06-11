import { useCallback, useEffect, useRef, useState } from 'react'
import type { Difficulty, GameState } from '../types'
import { canPour, createGame, pour, topOf } from '../gameLogic'
import TubeComponent from './Tube'

const TUBE_ASPECT = 3.2   // height / width

function useDimensions() {
  const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const handler = () => setDims({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return dims
}

interface Props {
  difficulty: Difficulty
  onWin: (moves: number) => void
  onBack: () => void
}

export default function GameBoard({ difficulty, onWin, onBack }: Props) {
  const [game, setGame] = useState<GameState>(() => createGame(difficulty))
  const { w, h } = useDimensions()

  const prevWon = useRef(false)
  useEffect(() => {
    if (game.won && !prevWon.current) {
      prevWon.current = true
      setTimeout(() => onWin(game.moves), 600)
    }
  }, [game.won, game.moves, onWin])

  const handleTubeClick = useCallback((id: number) => {
    setGame(prev => {
      if (prev.won) return prev

      if (prev.selected === null) {
        // Select only non-empty tubes
        const tube = prev.tubes.find(t => t.id === id)!
        if (tube.segments.length === 0) return prev
        return { ...prev, selected: id }
      }

      if (prev.selected === id) {
        return { ...prev, selected: null }
      }

      // Try to pour
      const from = prev.tubes.find(t => t.id === prev.selected)!
      const to   = prev.tubes.find(t => t.id === id)!
      if (canPour(from, to)) {
        return pour(prev, prev.selected, id)
      }

      // Reselect if new tube is non-empty
      const tube = prev.tubes.find(t => t.id === id)!
      if (tube.segments.length > 0) {
        return { ...prev, selected: id }
      }
      return { ...prev, selected: null }
    })
  }, [])

  const restart = useCallback(() => {
    prevWon.current = false
    setGame(createGame(difficulty))
  }, [difficulty])

  // Layout: determine tube size based on available space
  const tubeCount = game.tubes.length
  const cols = tubeCount <= 6 ? Math.ceil(tubeCount / 2) : Math.ceil(tubeCount / 2)
  const rows = 2
  const padding = 48
  const gap = 14
  const headerH = 80

  const maxTubeW = Math.floor((w - padding * 2 - gap * (cols - 1)) / cols)
  const maxTubeH = Math.floor((h - padding * 2 - headerH - gap * (rows - 1) - 40) / rows)
  const tubeByWidth  = Math.min(maxTubeW, 80)
  const tubeByHeight = Math.floor(maxTubeH / TUBE_ASPECT)
  const tubeWidth  = Math.min(tubeByWidth, tubeByHeight, 72)
  const tubeHeight = Math.floor(tubeWidth * TUBE_ASPECT)

  // Split into two rows
  const half = Math.ceil(tubeCount / 2)
  const row1 = game.tubes.slice(0, half)
  const row2 = game.tubes.slice(half)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      height: '100%',
      width: '100%',
      padding: `${padding / 2}px ${padding}px`,
      gap: 0,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: headerH,
        flexShrink: 0,
      }}>
        <button onClick={onBack} style={btnStyle('ghost')}>← Menu</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>
            Magic Sort
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 2 }}>
            {difficulty.toUpperCase()} · {game.moves} moves
          </div>
        </div>
        <button onClick={restart} style={btnStyle('ghost')}>Restart</button>
      </div>

      {/* Tube rows */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: gap + 24,
      }}>
        {[row1, row2].map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap, alignItems: 'flex-end' }}>
            {row.map(tube => {
              const isSelected = game.selected === tube.id
              const canReceive = game.selected !== null &&
                game.selected !== tube.id &&
                (() => {
                  const from = game.tubes.find(t => t.id === game.selected)!
                  return canPour(from, tube)
                })()
              return (
                <TubeComponent
                  key={tube.id}
                  tube={tube}
                  selected={isSelected}
                  canReceive={canReceive}
                  onClick={() => handleTubeClick(tube.id)}
                  tubeWidth={tubeWidth}
                  tubeHeight={tubeHeight}
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Hint */}
      <div style={{
        height: 40,
        display: 'flex',
        alignItems: 'center',
        color: 'rgba(255,255,255,0.3)',
        fontSize: 13,
        flexShrink: 0,
      }}>
        {game.selected !== null
          ? 'Tap a tube to pour into it'
          : 'Tap a tube to select it'}
      </div>
    </div>
  )
}

function btnStyle(variant: 'ghost' | 'primary'): React.CSSProperties {
  return {
    background: variant === 'primary' ? 'rgba(255,255,255,0.2)' : 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: 0.5,
  }
}
