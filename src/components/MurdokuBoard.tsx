import { useCallback, useEffect, useMemo, useReducer } from 'react'
import type { CSSProperties } from 'react'
import { MURDOKU_PUZZLES } from '../murdokuData'
import {
  createMurdokuGame,
  selectCell,
  enterNumber,
  getConflicts,
  buildCageIndex,
  cageLabel,
  isFirstCell,
} from '../murdokuLogic'
import type { MurdokuState } from '../murdokuLogic'

// ─── Suspects — the "people" shown in cells ───────────────────────────────────
const SUSPECTS = [
  { emoji: '👩‍🦰', name: 'Lady Scarlet',  short: 'Scarlet',  color: '#b03030', bg: '#f5e0e0' },
  { emoji: '👴',   name: 'Col. Mustard',  short: 'Mustard',  color: '#a07010', bg: '#f5f0d8' },
  { emoji: '🧔',   name: 'Dr. Green',    short: 'Green',    color: '#276e3a', bg: '#dff0e4' },
  { emoji: '👩‍🦱', name: 'Mrs. Plum',    short: 'Plum',     color: '#7040a0', bg: '#ede0f5' },
  { emoji: '🕵️',  name: 'Mr. Black',    short: 'Black',    color: '#303040', bg: '#e0e0e8' },
  { emoji: '👩‍🦳', name: 'Miss Blue',    short: 'Blue',     color: '#1a5080', bg: '#d8eaf5' },
]

// ─── Room names assigned to cages by index ────────────────────────────────────
const ROOMS = [
  'Library', 'Kitchen', 'Parlor', 'Study',
  'Garden', 'Dining Room', 'Ballroom', 'Cellar',
  'Trophy Room', 'Attic', 'Conservatory', 'Lounge',
  'Garage', 'Lobby', 'Drawing Room', 'Hall', 'Vault', 'Lab',
]

const WALL  = '3px solid #2a1205'
const GROUT = '0.5px solid rgba(42,18,5,0.2)'

interface Props { onBack: () => void }

type Action =
  | { type: 'select'; r: number; c: number }
  | { type: 'enter'; value: number | null }
  | { type: 'level'; idx: number }

function reducer(
  state: { game: MurdokuState; levelIdx: number },
  action: Action,
) {
  switch (action.type) {
    case 'select': return { ...state, game: selectCell(state.game, action.r, action.c) }
    case 'enter':  return { ...state, game: enterNumber(state.game, action.value) }
    case 'level':  return { game: createMurdokuGame(MURDOKU_PUZZLES[action.idx]), levelIdx: action.idx }
    default:       return state
  }
}

export default function MurdokuBoard({ onBack }: Props) {
  const [{ game, levelIdx }, dispatch] = useReducer(reducer, undefined, () => ({
    game: createMurdokuGame(MURDOKU_PUZZLES[0]),
    levelIdx: 0,
  }))

  const puzzle    = game.puzzle
  const n         = puzzle.size
  const cageIdx   = useMemo(() => buildCageIndex(puzzle), [puzzle])
  const conflicts = useMemo(() => getConflicts(game), [game])
  const suspects  = SUSPECTS.slice(0, n)

  const cellSize = useMemo(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth  : 400
    const vh = typeof window !== 'undefined' ? window.innerHeight : 700
    const avail = Math.min(vw - 28, vh - 310)
    return Math.max(Math.min(Math.floor(avail / n), 76), 36)
  }, [n])

  const handleKey = useCallback((e: KeyboardEvent) => {
    const v = parseInt(e.key)
    if (!isNaN(v) && v >= 1 && v <= n) dispatch({ type: 'enter', value: v })
    if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0')
      dispatch({ type: 'enter', value: null })
  }, [n])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  const gridPx = cellSize * n

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(160deg,#183518 0%,#0d200c 55%,#1a3018 100%)',
      padding: '10px 10px 12px',
      gap: 8,
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 520, gap: 8 }}>
        <button onClick={onBack} style={backBtn}>‹ Back</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: 5,
            textTransform: 'uppercase',
            color: '#fff',
            textShadow: '3px 3px 0 #7a0000, 0 0 24px rgba(180,0,0,0.55)',
            lineHeight: 1,
          }}>
            🔍 MURDOKU
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.42)', marginTop: 3, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            {puzzle.name} · {puzzle.subtitle}
          </div>
        </div>
        <div style={{ width: 56 }} />
      </div>

      {/* ── Case-file level tabs ── */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 380 }}>
        {MURDOKU_PUZZLES.map((_, i) => (
          <button key={i} onClick={() => dispatch({ type: 'level', idx: i })} style={{
            width: 30, height: 26, borderRadius: 5,
            border: i === levelIdx ? '2px solid #cc1111' : '1.5px solid rgba(255,255,255,0.15)',
            background: i === levelIdx ? 'rgba(160,0,0,0.4)' : 'rgba(255,255,255,0.055)',
            color: i === levelIdx ? '#ffaaaa' : 'rgba(255,255,255,0.38)',
            fontSize: 11, fontWeight: 700, cursor: 'pointer',
          }}>
            {i + 1}
          </button>
        ))}
      </div>

      {/* ── Floor-plan grid ── */}
      <div style={{
        position: 'relative',
        width: gridPx,
        height: gridPx,
        border: '4px solid #2a1205',
        borderRadius: 5,
        overflow: 'hidden',
        flexShrink: 0,
        boxShadow: '0 16px 48px rgba(0,0,0,0.75), 0 0 0 1px rgba(0,0,0,0.6)',
      }}>
        {Array.from({ length: n }, (_, r) =>
          Array.from({ length: n }, (_, c) => {
            const key     = `${r},${c}`
            const val     = game.grid[r][c]
            const ci      = cageIdx[r][c]
            const cage    = puzzle.cages[ci]
            const given   = game.givenCells.has(key)
            const sel     = game.selected?.[0] === r && game.selected?.[1] === c
            const conf    = conflicts.has(key)
            const showLbl = isFirstCell(cage, r, c)
            const arith   = showLbl ? cageLabel(cage) : ''
            const room    = showLbl ? ROOMS[ci % ROOMS.length] : ''

            const suspect = val !== null ? suspects[val - 1] : null

            const bTop   = r === 0   || cageIdx[r-1][c] !== ci ? WALL  : GROUT
            const bRight = c === n-1 || cageIdx[r][c+1] !== ci ? WALL  : GROUT
            const bBot   = r === n-1 || cageIdx[r+1][c] !== ci ? WALL  : GROUT
            const bLeft  = c === 0   || cageIdx[r][c-1] !== ci ? WALL  : GROUT

            // Cell background: suspect tint if filled, else warm tile
            let bg = given ? '#c8a870' : '#f0dfc0'
            if (suspect && !sel && !conf) bg = suspect.bg
            if (given && suspect)         bg = suspect.bg
            if (sel)  bg = '#ffe566'
            if (conf) bg = '#f09898'

            return (
              <div
                key={key}
                onClick={() => dispatch({ type: 'select', r, c })}
                style={{
                  position: 'absolute',
                  top: r * cellSize, left: c * cellSize,
                  width: cellSize, height: cellSize,
                  background: bg,
                  borderTop: bTop, borderRight: bRight, borderBottom: bBot, borderLeft: bLeft,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  cursor: given ? 'default' : 'pointer',
                  userSelect: 'none',
                  transition: 'background 0.1s',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                }}
              >
                {/* Room name + arithmetic label */}
                {(room || arith) && (
                  <div style={{
                    position: 'absolute',
                    top: 2, left: 3,
                    lineHeight: 1.15,
                    pointerEvents: 'none',
                  }}>
                    {room && (
                      <div style={{
                        fontSize: Math.max(cellSize * 0.16, 7),
                        fontWeight: 800,
                        color: '#2a1205',
                        whiteSpace: 'nowrap',
                      }}>
                        {room}
                      </div>
                    )}
                    {arith && (
                      <div style={{
                        fontSize: Math.max(cellSize * 0.17, 7),
                        fontWeight: 800,
                        color: '#7a0000',
                      }}>
                        {arith}
                      </div>
                    )}
                  </div>
                )}

                {/* Suspect portrait */}
                {suspect && (
                  <div style={{ textAlign: 'center', lineHeight: 1 }}>
                    <div style={{ fontSize: Math.max(cellSize * 0.44, 15), lineHeight: 1 }}>
                      {suspect.emoji}
                    </div>
                    {cellSize >= 52 && (
                      <div style={{
                        fontSize: Math.max(cellSize * 0.14, 7),
                        fontWeight: 700,
                        color: conf ? '#7a0000' : suspect.color,
                        marginTop: 1,
                        letterSpacing: -0.3,
                      }}>
                        {suspect.short}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* ── Instruction ── */}
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', textAlign: 'center', letterSpacing: 0.3 }}>
        Each row, column &amp; room must contain each suspect once · Match the room's total
      </div>

      {/* ── Suspect pad ── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        {suspects.map((s, i) => (
          <button
            key={i}
            onClick={() => dispatch({ type: 'enter', value: i + 1 })}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              width: 54,
              paddingBlock: 5,
              borderRadius: 9,
              border: `2.5px solid ${s.color}`,
              background: s.bg,
              cursor: 'pointer',
              boxShadow: '0 3px 0 rgba(0,0,0,0.45)',
            }}
          >
            <span style={{ fontSize: 26, lineHeight: 1 }}>{s.emoji}</span>
            <span style={{ fontSize: 9, fontWeight: 800, color: s.color, lineHeight: 1, textAlign: 'center' }}>
              {s.short}
            </span>
          </button>
        ))}
        <button
          onClick={() => dispatch({ type: 'enter', value: null })}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            width: 54, paddingBlock: 5, borderRadius: 9,
            border: '2.5px solid #7a0000',
            background: '#f09898',
            cursor: 'pointer',
            boxShadow: '0 3px 0 rgba(0,0,0,0.45)',
          }}
        >
          <span style={{ fontSize: 26, lineHeight: 1 }}>✕</span>
          <span style={{ fontSize: 9, fontWeight: 800, color: '#7a0000', lineHeight: 1 }}>Clear</span>
        </button>
      </div>

      {/* ── Win overlay ── */}
      {game.won && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(6,14,6,0.92)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 18, zIndex: 10,
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {suspects.map(s => (
              <span key={s.name} className="celebrate" style={{ fontSize: 36, display: 'inline-block' }}>
                {s.emoji}
              </span>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{
              fontSize: 36, fontWeight: 900, color: '#f5c800', margin: 0,
              letterSpacing: 3, textTransform: 'uppercase',
              textShadow: '3px 3px 0 #8b0000',
            }}>
              Case Solved!
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 6 }}>
              {puzzle.name} · {game.moves} moves
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {levelIdx < MURDOKU_PUZZLES.length - 1 && (
              <button onClick={() => dispatch({ type: 'level', idx: levelIdx + 1 })} style={winBtn('primary')}>
                Next Case →
              </button>
            )}
            <button onClick={() => dispatch({ type: 'level', idx: levelIdx })} style={winBtn('ghost')}>Replay</button>
            <button onClick={onBack} style={winBtn('ghost')}>Menu</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const backBtn: CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.13)',
  borderRadius: 8, padding: '6px 13px',
  color: 'rgba(255,255,255,0.65)', fontSize: 13,
  cursor: 'pointer', flexShrink: 0,
}

function winBtn(v: 'primary' | 'ghost'): CSSProperties {
  return {
    background: v === 'primary' ? 'linear-gradient(135deg,#8b0000,#c82000)' : 'rgba(255,255,255,0.09)',
    border: `1px solid ${v === 'primary' ? '#c82000' : 'rgba(255,255,255,0.18)'}`,
    borderRadius: 12, padding: '12px 26px',
    color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
  }
}
