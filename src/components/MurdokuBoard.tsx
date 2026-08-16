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

// ─── Cage palette — alternating warm floor tones so adjacent cages read apart ─
const CAGE_BG = ['#f0dfc0', '#e4d0a8', '#f5e8d0', '#dfd0b0', '#eee0c4', '#e8d6b0']

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
    case 'level': {
      return { game: createMurdokuGame(MURDOKU_PUZZLES[action.idx]), levelIdx: action.idx }
    }
    default: return state
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

  const cellSize = useMemo(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth  : 400
    const vh = typeof window !== 'undefined' ? window.innerHeight : 700
    const avail = Math.min(vw - 28, vh - 270)
    return Math.max(Math.min(Math.floor(avail / n), 74), 34)
  }, [n])

  const handleKey = useCallback((e: KeyboardEvent) => {
    const v = parseInt(e.key)
    if (!isNaN(v) && v >= 1 && v <= n) dispatch({ type: 'enter', value: v })
    if (e.key === 'Backspace' || e.key === '0' || e.key === 'Delete')
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
      padding: '10px 10px 14px',
      gap: 9,
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 520, gap: 8 }}>
        <button onClick={onBack} style={backBtn}>‹ Back</button>

        <div style={{ flex: 1, textAlign: 'center' }}>
          {/* Blood-drip title */}
          <div style={{
            fontSize: 24,
            fontWeight: 900,
            letterSpacing: 5,
            textTransform: 'uppercase',
            color: '#fff',
            textShadow: '3px 3px 0 #7a0000, 0 0 24px rgba(180,0,0,0.55)',
            lineHeight: 1,
          }}>
            🔍 MURDOKU
          </div>
          <div style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.42)',
            marginTop: 3,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
          }}>
            {puzzle.name} · {puzzle.subtitle}
          </div>
        </div>

        <div style={{ width: 56 }} />
      </div>

      {/* ── Case-file level selector ── */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 380 }}>
        {MURDOKU_PUZZLES.map((_, i) => {
          const active = i === levelIdx
          return (
            <button
              key={i}
              onClick={() => dispatch({ type: 'level', idx: i })}
              style={{
                width: 30,
                height: 26,
                borderRadius: 5,
                border: active ? '2px solid #cc1111' : '1.5px solid rgba(255,255,255,0.15)',
                background: active ? 'rgba(160,0,0,0.4)' : 'rgba(255,255,255,0.055)',
                color: active ? '#ffaaaa' : 'rgba(255,255,255,0.38)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.12s',
              }}
            >
              {i + 1}
            </button>
          )
        })}
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
        boxShadow:
          '0 16px 48px rgba(0,0,0,0.75), ' +
          '0 0 0 1px rgba(0,0,0,0.6), ' +
          'inset 0 0 0 1px rgba(255,220,160,0.08)',
      }}>
        {Array.from({ length: n }, (_, r) =>
          Array.from({ length: n }, (_, c) => {
            const key   = `${r},${c}`
            const val   = game.grid[r][c]
            const ci    = cageIdx[r][c]
            const cage  = puzzle.cages[ci]
            const given = game.givenCells.has(key)
            const sel   = game.selected?.[0] === r && game.selected?.[1] === c
            const conf  = conflicts.has(key)
            const lbl   = isFirstCell(cage, r, c) ? cageLabel(cage) : ''

            const bTop   = r === 0   || cageIdx[r-1][c] !== ci ? WALL  : GROUT
            const bRight = c === n-1 || cageIdx[r][c+1] !== ci ? WALL  : GROUT
            const bBot   = r === n-1 || cageIdx[r+1][c] !== ci ? WALL  : GROUT
            const bLeft  = c === 0   || cageIdx[r][c-1] !== ci ? WALL  : GROUT

            // Base tile color per cage index (floor-plan room feel)
            let bg = given
              ? '#c8a870'                    // darker tan for givens
              : CAGE_BG[ci % CAGE_BG.length] // rotating warm tones

            if (sel)  bg = '#ffe566'         // spotlight yellow
            if (conf) bg = '#f09898'         // blood blush

            return (
              <div
                key={key}
                onClick={() => dispatch({ type: 'select', r, c })}
                style={{
                  position: 'absolute',
                  top:  r * cellSize,
                  left: c * cellSize,
                  width: cellSize,
                  height: cellSize,
                  background: bg,
                  borderTop: bTop,
                  borderRight: bRight,
                  borderBottom: bBot,
                  borderLeft: bLeft,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: given ? 'default' : 'pointer',
                  userSelect: 'none',
                  transition: 'background 0.1s',
                  boxSizing: 'border-box',
                }}
              >
                {/* Cage arithmetic label */}
                {lbl && (
                  <span style={{
                    position: 'absolute',
                    top: 2,
                    left: 3,
                    fontSize: Math.max(cellSize * 0.23, 9),
                    fontWeight: 800,
                    color: '#7a0000',
                    lineHeight: 1,
                    pointerEvents: 'none',
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: -0.5,
                  }}>
                    {lbl}
                  </span>
                )}

                {/* Cell number */}
                {val !== null && (
                  <span style={{
                    fontSize: Math.max(cellSize * 0.48, 16),
                    fontWeight: 900,
                    color: conf ? '#7a0000' : given ? '#1e0900' : '#2a1000',
                    lineHeight: 1,
                    letterSpacing: -1,
                  }}>
                    {val}
                  </span>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* ── How-to-play hint ── */}
      <div style={{
        fontSize: 11,
        color: 'rgba(255,255,255,0.32)',
        textAlign: 'center',
        letterSpacing: 0.3,
        lineHeight: 1.5,
      }}>
        Each row &amp; column must contain 1–{n} once · Cage label = its required total
      </div>

      {/* ── Number pad ── */}
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'center' }}>
        {Array.from({ length: n }, (_, i) => i + 1).map(v => (
          <button
            key={v}
            onClick={() => dispatch({ type: 'enter', value: v })}
            style={padBtn}
          >
            {v}
          </button>
        ))}
        <button
          onClick={() => dispatch({ type: 'enter', value: null })}
          style={{ ...padBtn, background: '#f09898', color: '#7a0000', borderColor: '#7a0000' }}
        >
          ✕
        </button>
      </div>

      {/* ── Win overlay ── */}
      {game.won && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(6,14,6,0.92)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          zIndex: 10,
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ fontSize: 70, lineHeight: 1 }}>🕵️</div>

          <div style={{ textAlign: 'center' }}>
            <h2 style={{
              fontSize: 38,
              fontWeight: 900,
              color: '#f5c800',
              margin: 0,
              letterSpacing: 3,
              textTransform: 'uppercase',
              textShadow: '3px 3px 0 #8b0000, 0 0 30px rgba(220,100,0,0.5)',
            }}>
              Case Solved!
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginTop: 8 }}>
              {puzzle.name} · {game.moves} moves
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {levelIdx < MURDOKU_PUZZLES.length - 1 && (
              <button
                onClick={() => dispatch({ type: 'level', idx: levelIdx + 1 })}
                style={winBtn('primary')}
              >
                Next Case →
              </button>
            )}
            <button onClick={() => dispatch({ type: 'level', idx: levelIdx })} style={winBtn('ghost')}>
              Replay
            </button>
            <button onClick={onBack} style={winBtn('ghost')}>Menu</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const backBtn: CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.13)',
  borderRadius: 8,
  padding: '6px 13px',
  color: 'rgba(255,255,255,0.65)',
  fontSize: 13,
  cursor: 'pointer',
  flexShrink: 0,
}

const padBtn: CSSProperties = {
  width: 50,
  height: 50,
  borderRadius: 8,
  border: '2.5px solid #2a1205',
  background: '#f0dfc0',
  color: '#1e0900',
  fontSize: 21,
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: '0 4px 0 rgba(0,0,0,0.5)',
  transition: 'transform 0.07s',
  letterSpacing: -1,
}

function winBtn(v: 'primary' | 'ghost'): CSSProperties {
  return {
    background: v === 'primary'
      ? 'linear-gradient(135deg,#8b0000,#c82000)'
      : 'rgba(255,255,255,0.09)',
    border: `1px solid ${v === 'primary' ? '#c82000' : 'rgba(255,255,255,0.18)'}`,
    borderRadius: 12,
    padding: '12px 26px',
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.3,
  }
}
