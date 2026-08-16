import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
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

const CAGE_BORDER  = '2.5px solid #c8901a'
const INNER_BORDER = '0.5px solid rgba(180,120,60,0.22)'
const OUTER_BORDER = '2.5px solid #c8901a'

interface Props { onBack: () => void }

type Action =
  | { type: 'select'; r: number; c: number }
  | { type: 'enter'; value: number | null }
  | { type: 'level'; idx: number }

function reducer(state: { game: MurdokuState; levelIdx: number }, action: Action) {
  switch (action.type) {
    case 'select':
      return { ...state, game: selectCell(state.game, action.r, action.c) }
    case 'enter':
      return { ...state, game: enterNumber(state.game, action.value) }
    case 'level': {
      const puzzle = MURDOKU_PUZZLES[action.idx]
      return { game: createMurdokuGame(puzzle), levelIdx: action.idx }
    }
    default: return state
  }
}

export default function MurdokuBoard({ onBack }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  const [{ game, levelIdx }, dispatch] = useReducer(reducer, undefined, () => ({
    game: createMurdokuGame(MURDOKU_PUZZLES[0]),
    levelIdx: 0,
  }))

  const puzzle  = game.puzzle
  const n       = puzzle.size
  const cageIdx = useMemo(() => buildCageIndex(puzzle), [puzzle])
  const conflicts = useMemo(() => getConflicts(game), [game])

  const cellSize = useMemo(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth  : 400
    const vh = typeof window !== 'undefined' ? window.innerHeight : 700
    const available = Math.min(vw - 32, vh - 220)
    return Math.max(Math.min(Math.floor(available / n), 80), 30)
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

  const puzzle_name = puzzle.name
  const won = game.won

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      height: '100%',
      padding: '12px 8px 16px',
      gap: 10,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 540, gap: 10 }}>
        <button onClick={onBack} style={backBtnStyle}>‹ Back</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#d4a017', letterSpacing: 1 }}>
            🔍 {puzzle_name}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginLeft: 8 }}>
            {puzzle.subtitle}
          </span>
        </div>
        <div style={{ width: 56 }} />
      </div>

      {/* Level selector */}
      <div style={{
        display: 'flex',
        gap: 5,
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: 400,
      }}>
        {MURDOKU_PUZZLES.map((p, i) => (
          <button
            key={i}
            onClick={() => dispatch({ type: 'level', idx: i })}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: i === levelIdx ? '2px solid #d4a017' : '1.5px solid rgba(255,255,255,0.18)',
              background: i === levelIdx
                ? 'rgba(212,160,23,0.22)'
                : 'rgba(255,255,255,0.06)',
              color: i === levelIdx ? '#f0c840' : 'rgba(255,255,255,0.5)',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Grid */}
      <Grid
        game={game}
        n={n}
        cageIdx={cageIdx}
        conflicts={conflicts}
        cellSize={cellSize}
        dispatch={dispatch}
      />

      {/* Number pad */}
      <div style={{
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: 420,
      }}>
        {Array.from({ length: n }, (_, i) => i + 1).map(v => (
          <button
            key={v}
            onClick={() => dispatch({ type: 'enter', value: v })}
            style={numBtnStyle}
          >
            {v}
          </button>
        ))}
        <button
          onClick={() => dispatch({ type: 'enter', value: null })}
          style={{ ...numBtnStyle, color: '#ff6b6b', borderColor: 'rgba(255,100,100,0.3)' }}
        >
          ✕
        </button>
      </div>

      {/* Win overlay */}
      {won && (
        <WinOverlay
          puzzle={puzzle}
          moves={game.moves}
          onNext={levelIdx < MURDOKU_PUZZLES.length - 1
            ? () => dispatch({ type: 'level', idx: levelIdx + 1 })
            : undefined}
          onReplay={() => dispatch({ type: 'level', idx: levelIdx })}
          onBack={onBack}
        />
      )}
    </div>
  )
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

interface GridProps {
  game: MurdokuState
  n: number
  cageIdx: number[][]
  conflicts: Set<string>
  cellSize: number
  dispatch: (a: Action) => void
}

function Grid({ game, n, cageIdx, conflicts, cellSize, dispatch }: GridProps) {
  const { grid, selected, givenCells, puzzle } = game
  const gridSize = cellSize * n

  return (
    <div
      style={{
        width: gridSize,
        height: gridSize,
        position: 'relative',
        borderRadius: 6,
        overflow: 'hidden',
        flexShrink: 0,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 2px #c8901a',
      }}
    >
      {Array.from({ length: n }, (_, r) =>
        Array.from({ length: n }, (_, c) => {
          const key = `${r},${c}`
          const val = grid[r][c]
          const cageI = cageIdx[r][c]
          const cage  = puzzle.cages[cageI]
          const isGiven   = givenCells.has(key)
          const isSelected = selected?.[0] === r && selected?.[1] === c
          const isConflict = conflicts.has(key)
          const label = isFirstCell(cage, r, c) ? cageLabel(cage) : ''

          const borderTop    = r === 0 || cageIdx[r-1][c] !== cageI ? OUTER_BORDER : INNER_BORDER
          const borderRight  = c === n-1 || cageIdx[r][c+1] !== cageI ? CAGE_BORDER  : INNER_BORDER
          const borderBottom = r === n-1 || cageIdx[r+1][c] !== cageI ? CAGE_BORDER  : INNER_BORDER
          const borderLeft   = c === 0 || cageIdx[r][c-1] !== cageI ? OUTER_BORDER  : INNER_BORDER

          const bg = isSelected
            ? 'rgba(212,160,23,0.28)'
            : isConflict
            ? 'rgba(220,50,50,0.25)'
            : isGiven
            ? 'rgba(80,50,20,0.55)'
            : 'rgba(20,10,5,0.7)'

          return (
            <div
              key={key}
              onClick={() => dispatch({ type: 'select', r, c })}
              style={{
                position: 'absolute',
                top: r * cellSize,
                left: c * cellSize,
                width: cellSize,
                height: cellSize,
                background: bg,
                borderTop,
                borderRight,
                borderBottom,
                borderLeft,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isGiven ? 'default' : 'pointer',
                userSelect: 'none',
                transition: 'background 0.12s',
              }}
            >
              {label && (
                <span style={{
                  position: 'absolute',
                  top: 2,
                  left: 3,
                  fontSize: Math.max(cellSize * 0.22, 8),
                  fontWeight: 700,
                  color: '#d4a017',
                  lineHeight: 1,
                  pointerEvents: 'none',
                }}>
                  {label}
                </span>
              )}
              {val !== null && (
                <span style={{
                  fontSize: Math.max(cellSize * 0.48, 14),
                  fontWeight: isGiven ? 800 : 600,
                  color: isConflict
                    ? '#ff6b6b'
                    : isGiven
                    ? '#f5d06a'
                    : '#f0e8d0',
                  lineHeight: 1,
                }}>
                  {val}
                </span>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

// ─── Win Overlay ──────────────────────────────────────────────────────────────

import type { MurdokuPuzzle } from '../murdokuLogic'

interface WinProps {
  puzzle: MurdokuPuzzle
  moves: number
  onNext?: () => void
  onReplay: () => void
  onBack: () => void
}

function WinOverlay({ puzzle, moves, onNext, onReplay, onBack }: WinProps) {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(5,3,1,0.88)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
      zIndex: 10,
      backdropFilter: 'blur(6px)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 60, lineHeight: 1, marginBottom: 8 }}>🕵️</div>
        <h2 style={{
          fontSize: 34,
          fontWeight: 900,
          color: '#f0c840',
          margin: 0,
          letterSpacing: -1,
        }}>
          Case Solved!
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginTop: 6 }}>
          {puzzle.name} · {moves} moves
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {onNext && (
          <button onClick={onNext} style={overlayBtn('primary')}>Next Case →</button>
        )}
        <button onClick={onReplay} style={overlayBtn('ghost')}>Replay</button>
        <button onClick={onBack}   style={overlayBtn('ghost')}>Menu</button>
      </div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const backBtnStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10,
  padding: '6px 12px',
  color: 'rgba(255,255,255,0.7)',
  fontSize: 13,
  cursor: 'pointer',
  flexShrink: 0,
}

const numBtnStyle: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 10,
  border: '1.5px solid rgba(212,160,23,0.35)',
  background: 'rgba(30,18,6,0.8)',
  color: '#f0e8d0',
  fontSize: 18,
  fontWeight: 700,
  cursor: 'pointer',
  backdropFilter: 'blur(4px)',
}

function overlayBtn(variant: 'primary' | 'ghost'): CSSProperties {
  return {
    background: variant === 'primary'
      ? 'linear-gradient(135deg,#b8750e,#d4a017)'
      : 'rgba(255,255,255,0.08)',
    border: `1px solid ${variant === 'primary' ? '#d4a017' : 'rgba(255,255,255,0.18)'}`,
    borderRadius: 12,
    padding: '12px 24px',
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  }
}
