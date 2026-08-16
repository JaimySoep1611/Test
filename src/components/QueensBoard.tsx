import { useCallback, useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { createQueensGame, getConflicts, tapQueensCell, DOG_DIFFICULTIES } from '../queensLogic'
import type { QueensGameState } from '../queensLogic'

const REGION_PALETTE = [
  { bg: 'rgba(255,69,58,0.30)',   border: '#FF453A' },
  { bg: 'rgba(10,132,255,0.30)',  border: '#0A84FF' },
  { bg: 'rgba(50,215,75,0.30)',   border: '#32D74B' },
  { bg: 'rgba(255,214,10,0.30)',  border: '#FFD60A' },
  { bg: 'rgba(191,90,242,0.30)',  border: '#BF5AF2' },
  { bg: 'rgba(255,159,10,0.30)',  border: '#FF9F0A' },
  { bg: 'rgba(90,200,250,0.30)',  border: '#5AC8FA' },
  { bg: 'rgba(255,55,95,0.30)',   border: '#FF375F' },
  { bg: 'rgba(48,209,88,0.30)',   border: '#30D158' },
  { bg: 'rgba(255,107,53,0.30)',  border: '#FF6B35' },
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

interface Props {
  onBack: () => void
}

export default function QueensBoard({ onBack }: Props) {
  const [diffIdx, setDiffIdx]   = useState(0)
  const [game, setGame]         = useState<QueensGameState>(() => createQueensGame(DOG_DIFFICULTIES[0].n))
  const { w, h } = useDimensions()

  const diff = DOG_DIFFICULTIES[diffIdx]
  const n    = diff.n

  const switchDiff = useCallback((idx: number) => {
    setDiffIdx(idx)
    setGame(createQueensGame(DOG_DIFFICULTIES[idx].n))
  }, [])

  const restart = useCallback(() => {
    setGame(createQueensGame(n))
  }, [n])

  const handleTap = useCallback((r: number, c: number) => {
    setGame(prev => tapQueensCell(prev, r, c))
  }, [])

  const conflicts = getConflicts(game)

  const HEADER  = 60
  const TABS    = 44
  const FOOTER  = 36
  const PAD     = 14
  const availW  = w - PAD * 2
  const availH  = h - HEADER - TABS - PAD * 2 - FOOTER
  const cellSize = Math.max(Math.min(Math.floor(Math.min(availW, availH) / n), 86), 28)
  const gridSize = cellSize * n

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
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 800 }}>
            🐾 Dog Park
          </div>
          <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 11, marginTop: 1, letterSpacing: 1.4 }}>
            {game.moves} MOVES
          </div>
        </div>
        <button onClick={restart} style={hdrBtn}>↺ New</button>
      </div>

      {/* Difficulty tabs */}
      <div style={{
        display: 'flex', gap: 8, height: TABS,
        alignItems: 'center', flexShrink: 0, marginBottom: 4,
      }}>
        {DOG_DIFFICULTIES.map((d, i) => (
          <button
            key={d.id}
            onClick={() => switchDiff(i)}
            style={{
              background: i === diffIdx
                ? 'linear-gradient(135deg,rgba(255,214,10,0.22),rgba(191,90,242,0.22))'
                : 'rgba(255,255,255,0.05)',
              border: `1.5px solid ${i === diffIdx ? 'rgba(255,214,10,0.5)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 20,
              padding: '6px 14px',
              color: i === diffIdx ? '#fff' : 'rgba(255,255,255,0.45)',
              fontSize: 13,
              fontWeight: i === diffIdx ? 700 : 500,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              transition: 'all 0.15s',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ fontSize: 16 }}>{d.icon}</span>
            <span>{d.label}</span>
          </button>
        ))}
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
            gridTemplateColumns: `repeat(${n}, ${cellSize}px)`,
            width: gridSize, height: gridSize,
          }}>
            {Array.from({ length: n * n }, (_, idx) => {
              const r = Math.floor(idx / n)
              const c = idx % n
              const { regions } = game.puzzle
              const region  = regions[r][c]
              const palette = REGION_PALETTE[region]
              const val     = game.cells[r][c]
              const conflict = val === 1 && conflicts.has(`${r},${c}`)

              const regBorder = (side: boolean) =>
                side ? `2.5px solid ${palette.border}` : '0.5px solid rgba(255,255,255,0.06)'

              return (
                <div
                  key={idx}
                  onClick={() => handleTap(r, c)}
                  style={{
                    width: cellSize, height: cellSize,
                    boxSizing: 'border-box',
                    background: conflict ? 'rgba(255,50,50,0.40)' : palette.bg,
                    borderTop:    regBorder(r === 0   || regions[r-1]?.[c] !== region),
                    borderBottom: regBorder(r === n-1 || regions[r+1]?.[c] !== region),
                    borderLeft:   regBorder(c === 0   || regions[r][c-1]  !== region),
                    borderRight:  regBorder(c === n-1 || regions[r][c+1]  !== region),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'background 0.12s',
                    userSelect: 'none',
                    WebkitUserSelect: 'none' as CSSProperties['WebkitUserSelect'],
                  }}
                >
                  {val === 1 && (
                    <span style={{
                      fontSize: cellSize * 0.55, lineHeight: 1,
                      filter: conflict
                        ? 'brightness(0.6) saturate(0.3)'
                        : 'drop-shadow(0 2px 5px rgba(0,0,0,0.55))',
                    }}>
                      🐕
                    </span>
                  )}
                  {val === 2 && (
                    <span style={{ fontSize: cellSize * 0.44, lineHeight: 1, opacity: 0.45 }}>
                      🦴
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
              gap: 18, zIndex: 100,
            }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {['🐕','🎉','🐾'].map((e, i) => (
                  <span key={i} className="celebrate"
                    style={{ fontSize: 42, lineHeight: 1, animationDelay: `${i * 0.1}s` }}
                  >{e}</span>
                ))}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>
                  Paw-some! {diff.icon}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 5 }}>
                  {diff.label} · {game.moves} moves
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={restart} style={winBtn('primary')}>New Puzzle</button>
                <button onClick={onBack}  style={winBtn('ghost')}>Menu</button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        {!game.won && (
          <div style={{
            height: FOOTER, display: 'flex', alignItems: 'center',
            color: 'rgba(255,255,255,0.25)', fontSize: 11.5,
            letterSpacing: 0.2, textAlign: 'center',
          }}>
            Tap: place 🐕 · tap again: mark 🦴 · one dog per row, column &amp; zone
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
  padding: '8px 14px',
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
    padding: '12px 22px',
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.3,
  }
}
