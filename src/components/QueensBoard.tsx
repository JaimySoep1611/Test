import { useCallback, useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { createQueensGame, getConflicts, tapQueensCell } from '../queensLogic'
import type { QueensGameState } from '../queensLogic'

// Visually distinct Apple-system-color palette for regions
const REGION_PALETTE = [
  { bg: 'rgba(255,69,58,0.30)',   border: '#FF453A' },  // red
  { bg: 'rgba(10,132,255,0.30)',  border: '#0A84FF' },  // blue
  { bg: 'rgba(50,215,75,0.30)',   border: '#32D74B' },  // green
  { bg: 'rgba(255,214,10,0.30)',  border: '#FFD60A' },  // yellow
  { bg: 'rgba(191,90,242,0.30)',  border: '#BF5AF2' },  // purple
  { bg: 'rgba(255,159,10,0.30)',  border: '#FF9F0A' },  // orange
  { bg: 'rgba(90,200,250,0.30)',  border: '#5AC8FA' },  // teal
  { bg: 'rgba(255,55,95,0.30)',   border: '#FF375F' },  // pink
  { bg: 'rgba(48,209,88,0.30)',   border: '#30D158' },  // emerald
  { bg: 'rgba(255,107,53,0.30)',  border: '#FF6B35' },  // coral
]

function useDimensions() {
  const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const update = () => setDims({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])
  return dims
}

const N = 8

interface Props {
  onBack: () => void
}

export default function QueensBoard({ onBack }: Props) {
  const [game, setGame] = useState<QueensGameState>(() => createQueensGame(N))
  const { w, h } = useDimensions()

  const restart = useCallback(() => setGame(createQueensGame(N)), [])

  const handleTap = useCallback((r: number, c: number) => {
    setGame(prev => tapQueensCell(prev, r, c))
  }, [])

  const conflicts = getConflicts(game)

  const HEADER  = 70
  const PAD     = 16
  const FOOTER  = 32
  const availW  = w - PAD * 2
  const availH  = h - HEADER - PAD * 2 - FOOTER
  const cellSize = Math.max(Math.min(Math.floor(Math.min(availW, availH) / N), 84), 36)
  const gridSize = cellSize * N

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: `${PAD}px`, overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{
        display: 'flex', width: '100%', maxWidth: 960,
        alignItems: 'center', justifyContent: 'space-between',
        height: HEADER, flexShrink: 0,
      }}>
        <button onClick={onBack} style={hdrBtn}>← Menu</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#fff', fontSize: 19, fontWeight: 800 }}>👑 Queens</div>
          <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12, marginTop: 2, letterSpacing: 1.5 }}>
            {game.moves} MOVES · {N}×{N}
          </div>
        </div>
        <button onClick={restart} style={hdrBtn}>↺ New</button>
      </div>

      {/* Board area */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 10,
      }}>
        {/* Grid wrapper */}
        <div style={{
          position: 'relative',
          width: gridSize, height: gridSize,
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)',
        }}>
          {/* Cells */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${N}, ${cellSize}px)`,
            width: gridSize, height: gridSize,
          }}>
            {Array.from({ length: N * N }, (_, idx) => {
              const r = Math.floor(idx / N)
              const c = idx % N
              const { regions } = game.puzzle
              const region  = regions[r][c]
              const palette = REGION_PALETTE[region]
              const val     = game.cells[r][c]
              const conflict = val === 1 && conflicts.has(`${r},${c}`)

              const regionBorder = (side: boolean) =>
                side ? `2.5px solid ${palette.border}` : '0.5px solid rgba(255,255,255,0.06)'

              return (
                <div
                  key={idx}
                  onClick={() => handleTap(r, c)}
                  style={{
                    width: cellSize, height: cellSize,
                    boxSizing: 'border-box',
                    background: conflict ? 'rgba(255,50,50,0.42)' : palette.bg,
                    borderTop:    regionBorder(r === 0    || regions[r-1]?.[c] !== region),
                    borderBottom: regionBorder(r === N-1  || regions[r+1]?.[c] !== region),
                    borderLeft:   regionBorder(c === 0    || regions[r][c-1]  !== region),
                    borderRight:  regionBorder(c === N-1  || regions[r][c+1]  !== region),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'background 0.12s',
                    userSelect: 'none',
                    WebkitUserSelect: 'none' as CSSProperties['WebkitUserSelect'],
                    position: 'relative',
                  }}
                >
                  {val === 1 && (
                    <span style={{
                      fontSize: cellSize * 0.52, lineHeight: 1,
                      filter: conflict
                        ? 'brightness(0.7) saturate(0.4)'
                        : 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))',
                    }}>
                      👑
                    </span>
                  )}
                  {val === 2 && (
                    <span style={{
                      fontSize: cellSize * 0.36, lineHeight: 1,
                      color: 'rgba(255,255,255,0.38)',
                      fontWeight: 700,
                    }}>
                      ✕
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Win overlay */}
          {game.won && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(13,27,42,0.93)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 20, zIndex: 100,
            }}>
              <span className="celebrate" style={{ fontSize: 60, lineHeight: 1, animationDelay: '0s' }}>👑</span>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>
                  Puzzle Solved!
                </div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginTop: 6 }}>
                  {game.moves} moves
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={restart} style={winBtn('primary')}>New Puzzle</button>
                <button onClick={onBack}  style={winBtn('ghost')}>Menu</button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        {!game.won && (
          <div style={{
            height: FOOTER,
            color: 'rgba(255,255,255,0.25)', fontSize: 12,
            letterSpacing: 0.3, textAlign: 'center',
            display: 'flex', alignItems: 'center',
          }}>
            Tap: place 👑 · tap again: mark ✕ · one crown per row, column & color region
          </div>
        )}
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

function winBtn(v: 'primary' | 'ghost'): CSSProperties {
  return {
    background: v === 'primary'
      ? 'linear-gradient(135deg,#7c3aed,#2563eb)'
      : 'rgba(255,255,255,0.1)',
    border: `1px solid ${v === 'primary' ? 'transparent' : 'rgba(255,255,255,0.2)'}`,
    borderRadius: 12,
    padding: '13px 24px',
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.3,
  }
}
