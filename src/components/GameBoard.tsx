import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { Difficulty, GameState } from '../types'
import { canPour, createGame, DIFFICULTY_CONFIGS, pour } from '../gameLogic'
import TubeComponent from './Tube'

const TUBE_ASPECT = 3.6

function useDimensions() {
  const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const handler = () => setDims({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', handler)
    window.addEventListener('orientationchange', handler)
    return () => {
      window.removeEventListener('resize', handler)
      window.removeEventListener('orientationchange', handler)
    }
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
  const config  = DIFFICULTY_CONFIGS.find(d => d.id === difficulty)!

  useEffect(() => {
    if (game.won && !prevWon.current) {
      prevWon.current = true
      setTimeout(() => onWin(game.moves), 700)
    }
  }, [game.won, game.moves, onWin])

  const handleTubeClick = useCallback((id: number) => {
    setGame(prev => {
      if (prev.won) return prev
      const tube = prev.tubes.find(t => t.id === id)!

      if (prev.selected === null) {
        return tube.segments.length === 0 ? prev : { ...prev, selected: id }
      }
      if (prev.selected === id) return { ...prev, selected: null }

      const from = prev.tubes.find(t => t.id === prev.selected)!
      if (canPour(from, tube)) return pour(prev, prev.selected, id)
      if (tube.segments.length > 0) return { ...prev, selected: id }
      return { ...prev, selected: null }
    })
  }, [])

  const restart = useCallback(() => {
    prevWon.current = false
    setGame(createGame(difficulty))
  }, [difficulty])

  // Layout
  const HEADER  = 70
  const HINT    = 38
  const PAD     = 20
  const GAP     = 10
  const ROW_GAP = 24

  const tubeCount = game.tubes.length
  const half  = Math.ceil(tubeCount / 2)
  const row1  = game.tubes.slice(0, half)
  const row2  = game.tubes.slice(half)
  const cols  = half

  const availW   = w - PAD * 2
  const availH   = h - HEADER - HINT - PAD * 2 - ROW_GAP - 48 // 48 for paw badges
  const byWidth  = Math.floor((availW - GAP * (cols - 1)) / cols)
  const byHeight = Math.floor(availH / 2 / TUBE_ASPECT)
  const tubeWidth  = Math.min(byWidth, byHeight, 80)
  const tubeHeight = Math.floor(tubeWidth * TUBE_ASPECT)

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: `${PAD}px`,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        width: '100%',
        maxWidth: 960,
        alignItems: 'center',
        justifyContent: 'space-between',
        height: HEADER,
        flexShrink: 0,
      }}>
        <button onClick={onBack} style={hdrBtn}>← Menu</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#fff', fontSize: 19, fontWeight: 800 }}>
            {config.icon} {config.label}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12, marginTop: 2, letterSpacing: 1.5 }}>
            {game.moves} MOVES
          </div>
        </div>
        <button onClick={restart} style={hdrBtn}>↺ New</button>
      </div>

      {/* Tube area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: ROW_GAP,
        width: '100%',
      }}>
        {[row1, row2].map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: GAP, alignItems: 'flex-end', justifyContent: 'center' }}>
            {row.map(tube => {
              const isSelected = game.selected === tube.id
              const fromTube   = game.selected !== null
                ? game.tubes.find(t => t.id === game.selected)
                : undefined
              const canReceive = !!fromTube && game.selected !== tube.id && canPour(fromTube, tube)
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
        height: HINT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255,255,255,0.28)',
        fontSize: 13,
        gap: 6,
        flexShrink: 0,
        letterSpacing: 0.3,
      }}>
        {game.selected !== null
          ? <><span>🐾</span><span>Tap another tube to pour</span></>
          : <><span>🐕</span><span>Tap a tube to pick it up</span></>
        }
      </div>
    </div>
  )
}

const hdrBtn: CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: 'rgba(255,255,255,0.75)',
  padding: '8px 16px',
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  letterSpacing: 0.3,
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
}
