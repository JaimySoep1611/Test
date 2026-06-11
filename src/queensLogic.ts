export type CellValue = 0 | 1 | 2  // empty · crown · x-marker

export interface QueensPuzzle {
  n: number
  regions: number[][]  // regions[row][col] = region index 0..n-1
}

export interface QueensGameState {
  puzzle: QueensPuzzle
  cells: CellValue[][]
  moves: number
  won: boolean
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function solveNQueens(n: number): number[] {
  // Returns arr[row] = col for a random valid N-queens solution.
  const result: number[] = []
  function bt(row: number, cols: Set<number>, d1: Set<number>, d2: Set<number>): boolean {
    if (row === n) return true
    for (const col of shuffle(Array.from({ length: n }, (_, i) => i))) {
      if (cols.has(col) || d1.has(row - col) || d2.has(row + col)) continue
      result.push(col)
      cols.add(col); d1.add(row - col); d2.add(row + col)
      if (bt(row + 1, cols, d1, d2)) return true
      result.pop()
      cols.delete(col); d1.delete(row - col); d2.delete(row + col)
    }
    return false
  }
  bt(0, new Set(), new Set(), new Set())
  // Fallback (shouldn't be needed for n≥4)
  if (result.length !== n) return [0, 4, 7, 5, 2, 6, 1, 3].slice(0, n)
  return result
}

const DIRS: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]]

function buildRegions(n: number, queenCols: number[]): number[][] {
  // Randomised multi-source BFS (Voronoi with jitter) — guarantees contiguous regions.
  const grid: number[][] = Array.from({ length: n }, () => new Array(n).fill(-1))
  queenCols.forEach((col, row) => { grid[row][col] = row })

  // Priority queue: [priority, row, col, region]
  const pq: [number, number, number, number][] = []

  for (let qr = 0; qr < n; qr++) {
    for (const [dr, dc] of DIRS) {
      const nr = qr + dr, nc = queenCols[qr] + dc
      if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] === -1)
        pq.push([Math.random(), nr, nc, qr])
    }
  }

  while (pq.length > 0) {
    pq.sort(([a], [b]) => a - b)
    const [, r, c, region] = pq.shift()!
    if (grid[r][c] !== -1) continue
    grid[r][c] = region
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc
      if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] === -1)
        pq.push([Math.random(), nr, nc, region])
    }
  }

  return grid
}

function isWon(state: QueensGameState): boolean {
  const { puzzle: { n, regions }, cells } = state
  let total = 0
  const rows = new Array(n).fill(0)
  const cols = new Array(n).fill(0)
  const regs = new Array(n).fill(0)

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (cells[r][c] !== 1) continue
      total++
      rows[r]++
      cols[c]++
      regs[regions[r][c]]++
      // Adjacent touching (including diagonal)
      for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
        const nr = r + dr, nc = c + dc
        if (nr >= 0 && nr < n && nc >= 0 && nc < n && cells[nr][nc] === 1) return false
      }
    }
  }

  return (
    total === n &&
    rows.every(x => x === 1) &&
    cols.every(x => x === 1) &&
    regs.every(x => x === 1)
  )
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function createQueensGame(n = 8): QueensGameState {
  const queenCols = solveNQueens(n)
  return {
    puzzle: { n, regions: buildRegions(n, queenCols) },
    cells:  Array.from({ length: n }, () => new Array<CellValue>(n).fill(0)),
    moves:  0,
    won:    false,
  }
}

export function tapQueensCell(state: QueensGameState, row: number, col: number): QueensGameState {
  if (state.won) return state
  const cells = state.cells.map(r => [...r] as CellValue[])
  cells[row][col] = ((cells[row][col] + 1) % 3) as CellValue
  const next = { ...state, cells, moves: state.moves + 1 }
  return { ...next, won: isWon(next) }
}

export function getConflicts(state: QueensGameState): Set<string> {
  const { puzzle: { n, regions }, cells } = state
  const conflicts = new Set<string>()
  const crowns: [number, number][] = []

  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (cells[r][c] === 1) crowns.push([r, c])

  const rowCnt = new Map<number, number>()
  const colCnt = new Map<number, number>()
  const regCnt = new Map<number, number>()

  for (const [r, c] of crowns) {
    rowCnt.set(r, (rowCnt.get(r) ?? 0) + 1)
    colCnt.set(c, (colCnt.get(c) ?? 0) + 1)
    regCnt.set(regions[r][c], (regCnt.get(regions[r][c]) ?? 0) + 1)
  }

  for (const [r, c] of crowns) {
    if ((rowCnt.get(r) ?? 0) > 1) conflicts.add(`${r},${c}`)
    if ((colCnt.get(c) ?? 0) > 1) conflicts.add(`${r},${c}`)
    if ((regCnt.get(regions[r][c]) ?? 0) > 1) conflicts.add(`${r},${c}`)
    for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
      const nr = r + dr, nc = c + dc
      if (nr >= 0 && nr < n && nc >= 0 && nc < n && cells[nr][nc] === 1) {
        conflicts.add(`${r},${c}`)
        conflicts.add(`${nr},${nc}`)
      }
    }
  }

  return conflicts
}
