import type { Color, Difficulty, GameState, Tube } from './types'

const SEGMENTS = 4

const ALL_COLORS: Color[] = [
  'red', 'blue', 'green', 'yellow',
  'purple', 'orange', 'pink', 'teal',
  'lime', 'coral',
]

const DIFFICULTY_CONFIG: Record<Difficulty, { colorCount: number }> = {
  easy:   { colorCount: 4 },
  medium: { colorCount: 6 },
  hard:   { colorCount: 9 },
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function createGame(difficulty: Difficulty): GameState {
  const { colorCount } = DIFFICULTY_CONFIG[difficulty]
  const colors = ALL_COLORS.slice(0, colorCount)

  // Fill pool: each color appears exactly SEGMENTS times
  const pool: Color[] = shuffle(colors.flatMap(c => Array(SEGMENTS).fill(c)))

  const filledTubes: Tube[] = colors.map((_, i) => ({
    id: i,
    segments: pool.slice(i * SEGMENTS, (i + 1) * SEGMENTS),
  }))

  const emptyTubes: Tube[] = [
    { id: colorCount,     segments: [] },
    { id: colorCount + 1, segments: [] },
  ]

  return {
    tubes: [...filledTubes, ...emptyTubes],
    selected: null,
    moves: 0,
    won: false,
    difficulty,
  }
}

/** Top segment of a tube (last element) */
export function topOf(tube: Tube): Color | null {
  return tube.segments.length > 0 ? tube.segments[tube.segments.length - 1] : null
}

/** How many consecutive same-color segments are at the top */
function topRunLength(tube: Tube): number {
  if (tube.segments.length === 0) return 0
  const top = topOf(tube)!
  let count = 0
  for (let i = tube.segments.length - 1; i >= 0; i--) {
    if (tube.segments[i] === top) count++
    else break
  }
  return count
}

export function canPour(from: Tube, to: Tube): boolean {
  if (from.segments.length === 0) return false
  if (from.id === to.id) return false
  if (to.segments.length >= SEGMENTS) return false

  const fromTop = topOf(from)!
  const toTop = topOf(to)

  // Destination must be empty or have matching top color
  if (toTop !== null && toTop !== fromTop) return false

  // Don't allow pouring a single-color completed tube into an empty tube (pointless move)
  if (
    toTop === null &&
    from.segments.every(s => s === fromTop) &&
    from.segments.length === SEGMENTS
  ) return false

  return true
}

export function pour(state: GameState, fromId: number, toId: number): GameState {
  const tubes = state.tubes.map(t => ({ ...t, segments: [...t.segments] }))
  const from = tubes.find(t => t.id === fromId)!
  const to   = tubes.find(t => t.id === toId)!

  if (!canPour(from, to)) return state

  const color = topOf(from)!
  const runLen = topRunLength(from)
  const space = SEGMENTS - to.segments.length
  const amount = Math.min(runLen, space)

  for (let i = 0; i < amount; i++) {
    from.segments.pop()
    to.segments.push(color)
  }

  const won = checkWin(tubes)

  return { ...state, tubes, selected: null, moves: state.moves + 1, won }
}

function checkWin(tubes: Tube[]): boolean {
  return tubes.every(
    t =>
      t.segments.length === 0 ||
      (t.segments.length === SEGMENTS && t.segments.every(s => s === t.segments[0]))
  )
}

export function isTubeComplete(tube: Tube): boolean {
  return (
    tube.segments.length === SEGMENTS &&
    tube.segments.every(s => s === tube.segments[0])
  )
}
