import type { Color, Difficulty, DifficultyConfig, GameState, Tube } from './types'

export const SEGMENTS = 4

const ALL_COLORS: Color[] = [
  'red', 'blue', 'green', 'yellow',
  'purple', 'orange', 'pink', 'teal',
  'lime', 'coral',
]

export const DIFFICULTY_CONFIGS: DifficultyConfig[] = [
  { id: 'puppy', label: 'Puppy',      icon: '🐶', desc: '3 colors · 5 tubes',   colorCount: 3  },
  { id: 'woof',  label: 'Woof',       icon: '🐕', desc: '4 colors · 6 tubes',   colorCount: 4  },
  { id: 'fetch', label: 'Fetch',      icon: '🦮', desc: '6 colors · 8 tubes',   colorCount: 6  },
  { id: 'bark',  label: 'Bark',       icon: '🐩', desc: '8 colors · 10 tubes',  colorCount: 8  },
  { id: 'beast', label: 'Beast Mode', icon: '🐺', desc: '10 colors · 12 tubes', colorCount: 10 },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function createGame(difficulty: Difficulty): GameState {
  const { colorCount } = DIFFICULTY_CONFIGS.find(d => d.id === difficulty)!
  const colors = ALL_COLORS.slice(0, colorCount)
  const pool = shuffle(colors.flatMap(c => Array<Color>(SEGMENTS).fill(c)))

  const filledTubes: Tube[] = colors.map((_, i) => ({
    id: i,
    segments: pool.slice(i * SEGMENTS, (i + 1) * SEGMENTS),
  }))

  return {
    tubes: [
      ...filledTubes,
      { id: colorCount,     segments: [] },
      { id: colorCount + 1, segments: [] },
    ],
    selected: null,
    moves: 0,
    won: false,
    difficulty,
  }
}

export function topOf(tube: Tube): Color | null {
  return tube.segments.length > 0 ? tube.segments[tube.segments.length - 1] : null
}

function topRunLength(tube: Tube): number {
  if (tube.segments.length === 0) return 0
  const top = topOf(tube)!
  let n = 0
  for (let i = tube.segments.length - 1; i >= 0; i--) {
    if (tube.segments[i] === top) n++
    else break
  }
  return n
}

export function canPour(from: Tube, to: Tube): boolean {
  if (from.segments.length === 0) return false
  if (from.id === to.id) return false
  if (to.segments.length >= SEGMENTS) return false

  const fromTop = topOf(from)!
  const toTop   = topOf(to)

  if (toTop !== null && toTop !== fromTop) return false

  // Prevent pointless move: full single-color tube → empty tube
  if (
    toTop === null &&
    from.segments.length === SEGMENTS &&
    from.segments.every(s => s === fromTop)
  ) return false

  return true
}

export function pour(state: GameState, fromId: number, toId: number): GameState {
  const tubes = state.tubes.map(t => ({ ...t, segments: [...t.segments] }))
  const from  = tubes.find(t => t.id === fromId)!
  const to    = tubes.find(t => t.id === toId)!

  if (!canPour(from, to)) return state

  const color  = topOf(from)!
  const amount = Math.min(topRunLength(from), SEGMENTS - to.segments.length)
  for (let i = 0; i < amount; i++) { from.segments.pop(); to.segments.push(color) }

  return { ...state, tubes, selected: null, moves: state.moves + 1, won: checkWin(tubes) }
}

function checkWin(tubes: Tube[]): boolean {
  return tubes.every(
    t => t.segments.length === 0 ||
      (t.segments.length === SEGMENTS && t.segments.every(s => s === t.segments[0]))
  )
}

export function isTubeComplete(tube: Tube): boolean {
  return (
    tube.segments.length === SEGMENTS &&
    tube.segments.every(s => s === tube.segments[0])
  )
}

export function starsForMoves(moves: number, colorCount: number): number {
  const par = colorCount * 4
  if (moves <= Math.floor(par * 0.55)) return 3
  if (moves <= par)                    return 2
  return 1
}
