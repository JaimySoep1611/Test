export type Color =
  | 'red' | 'blue' | 'green' | 'yellow'
  | 'purple' | 'orange' | 'pink' | 'teal'
  | 'lime' | 'coral'

export interface Tube {
  id: number
  /** bottom → top, max 4 segments */
  segments: Color[]
}

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Level {
  label: string
  colorCount: number
  tubeCount: number   // colorCount + 2 empty
  segmentsPerTube: 4
}

export interface GameState {
  tubes: Tube[]
  selected: number | null  // tube id
  moves: number
  won: boolean
  difficulty: Difficulty
}
