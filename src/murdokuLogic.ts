import type { MurdokuPuzzle, Cage } from './murdokuData'

export type { MurdokuPuzzle, Cage }
export type { CageOp } from './murdokuData'

export interface MurdokuState {
  puzzle: MurdokuPuzzle
  grid: (number | null)[][]
  givenCells: Set<string>
  selected: [number, number] | null
  moves: number
  won: boolean
}

export function createMurdokuGame(puzzle: MurdokuPuzzle): MurdokuState {
  const givenCells = new Set<string>()
  const grid: (number | null)[][] = Array.from({ length: puzzle.size }, () =>
    Array(puzzle.size).fill(null)
  )

  for (const cage of puzzle.cages) {
    if (cage.op === 'given') {
      const [r, c] = cage.cells[0]
      grid[r][c] = cage.target
      givenCells.add(`${r},${c}`)
    }
  }

  return { puzzle, grid, givenCells, selected: null, moves: 0, won: false }
}

export function selectCell(state: MurdokuState, r: number, c: number): MurdokuState {
  if (state.givenCells.has(`${r},${c}`)) return state
  return { ...state, selected: [r, c] }
}

export function enterNumber(state: MurdokuState, value: number | null): MurdokuState {
  if (!state.selected) return state
  const [r, c] = state.selected
  if (state.givenCells.has(`${r},${c}`)) return state

  const grid = state.grid.map(row => [...row])
  grid[r][c] = value
  const won = checkWin(state.puzzle, grid)
  return { ...state, grid, won, moves: state.moves + 1 }
}

export function getConflicts(state: MurdokuState): Set<string> {
  return computeConflicts(state.puzzle, state.grid)
}

function computeConflicts(puzzle: MurdokuPuzzle, grid: (number | null)[][]): Set<string> {
  const conflicts = new Set<string>()
  const n = puzzle.size

  for (let r = 0; r < n; r++) {
    const seen = new Map<number, number>()
    for (let c = 0; c < n; c++) {
      const v = grid[r][c]
      if (v === null) continue
      if (seen.has(v)) {
        conflicts.add(`${r},${seen.get(v)}`)
        conflicts.add(`${r},${c}`)
      } else {
        seen.set(v, c)
      }
    }
  }

  for (let c = 0; c < n; c++) {
    const seen = new Map<number, number>()
    for (let r = 0; r < n; r++) {
      const v = grid[r][c]
      if (v === null) continue
      if (seen.has(v)) {
        conflicts.add(`${seen.get(v)},${c}`)
        conflicts.add(`${r},${c}`)
      } else {
        seen.set(v, r)
      }
    }
  }

  return conflicts
}

function cageSatisfied(cage: Cage, grid: (number | null)[][]): boolean {
  if (cage.op === 'given') return true
  const vals = cage.cells.map(([r, c]) => grid[r][c])
  if (vals.some(v => v === null)) return false
  const nums = vals as number[]

  switch (cage.op) {
    case '+': return nums.reduce((a, b) => a + b, 0) === cage.target
    case '*': return nums.reduce((a, b) => a * b, 1) === cage.target
    case '-': {
      const [a, b] = nums
      return Math.abs(a - b) === cage.target
    }
    case '/': {
      const [a, b] = nums
      return (b !== 0 && a / b === cage.target) || (a !== 0 && b / a === cage.target)
    }
    default: return false
  }
}

function checkWin(puzzle: MurdokuPuzzle, grid: (number | null)[][]): boolean {
  const n = puzzle.size
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (grid[r][c] === null) return false

  if (computeConflicts(puzzle, grid).size > 0) return false

  for (const cage of puzzle.cages)
    if (!cageSatisfied(cage, grid)) return false

  return true
}

export function buildCageIndex(puzzle: MurdokuPuzzle): number[][] {
  const idx = Array.from({ length: puzzle.size }, () => Array(puzzle.size).fill(-1))
  for (let i = 0; i < puzzle.cages.length; i++)
    for (const [r, c] of puzzle.cages[i].cells)
      idx[r][c] = i
  return idx
}

export function cageLabel(cage: Cage): string {
  if (cage.op === 'given') return ''
  const sym = cage.op === '*' ? '×' : cage.op === '/' ? '÷' : cage.op
  return `${cage.target}${sym}`
}

export function isFirstCell(cage: Cage, r: number, c: number): boolean {
  const [fr, fc] = cage.cells.reduce(([ar, ac], [br, bc]) =>
    br < ar || (br === ar && bc < ac) ? [br, bc] : [ar, ac]
  )
  return fr === r && fc === c
}
