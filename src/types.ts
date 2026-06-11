export type Color =
  | 'red' | 'blue' | 'green' | 'yellow'
  | 'purple' | 'orange' | 'pink' | 'teal'
  | 'lime' | 'coral'

export interface Tube {
  id: number
  /** bottom → top, max 4 segments */
  segments: Color[]
}

export type Difficulty = 'puppy' | 'woof' | 'fetch' | 'bark' | 'beast'

export interface DifficultyConfig {
  id: Difficulty
  label: string
  icon: string
  desc: string
  colorCount: number
}

export interface GameState {
  tubes: Tube[]
  selected: number | null
  moves: number
  won: boolean
  difficulty: Difficulty
}
