import { type CSSProperties } from 'react'
import type { Tube as TubeType } from '../types'
import { isTubeComplete, topOf } from '../gameLogic'

const COLOR_MAP: Record<string, { fill: string; glow: string }> = {
  red:    { fill: 'linear-gradient(180deg,#ff6b6b,#ee0979)', glow: '#ee0979' },
  blue:   { fill: 'linear-gradient(180deg,#74b9ff,#0984e3)', glow: '#0984e3' },
  green:  { fill: 'linear-gradient(180deg,#55efc4,#00b894)', glow: '#00b894' },
  yellow: { fill: 'linear-gradient(180deg,#ffeaa7,#fdcb6e)', glow: '#fdcb6e' },
  purple: { fill: 'linear-gradient(180deg,#d98af7,#9b59b6)', glow: '#9b59b6' },
  orange: { fill: 'linear-gradient(180deg,#ffbe76,#e67e22)', glow: '#e67e22' },
  pink:   { fill: 'linear-gradient(180deg,#fd79a8,#e84393)', glow: '#e84393' },
  teal:   { fill: 'linear-gradient(180deg,#81ecec,#00cec9)', glow: '#00cec9' },
  lime:   { fill: 'linear-gradient(180deg,#b8e994,#78e08f)', glow: '#78e08f' },
  coral:  { fill: 'linear-gradient(180deg,#ffa07a,#ff6348)', glow: '#ff6348' },
}

const SEGMENTS = 4

interface Props {
  tube: TubeType
  selected: boolean
  canReceive: boolean
  onClick: () => void
  tubeWidth: number
  tubeHeight: number
}

export default function Tube({ tube, selected, canReceive, onClick, tubeWidth, tubeHeight }: Props) {
  const complete = isTubeComplete(tube)
  const segH = (tubeHeight - 16) / SEGMENTS   // 8px padding top+bottom

  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    padding: '4px',
    transition: 'transform 0.15s ease',
    transform: selected ? 'translateY(-20px) scale(1.05)' : canReceive ? 'scale(1.02)' : 'scale(1)',
    filter: complete ? 'drop-shadow(0 0 12px rgba(255,255,255,0.4))' : 'none',
  }

  const tubeStyle: CSSProperties = {
    width: tubeWidth,
    height: tubeHeight,
    borderRadius: `${tubeWidth / 2}px ${tubeWidth / 2}px ${tubeWidth / 2}px ${tubeWidth / 2}px`,
    border: selected
      ? '3px solid #fff'
      : canReceive
      ? '3px solid rgba(255,255,255,0.5)'
      : complete
      ? '3px solid rgba(255,255,255,0.25)'
      : '3px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    position: 'relative',
    boxShadow: selected
      ? '0 0 20px rgba(255,255,255,0.4), inset 0 0 20px rgba(0,0,0,0.3)'
      : canReceive
      ? '0 0 12px rgba(255,255,255,0.2)'
      : 'inset 0 0 20px rgba(0,0,0,0.3)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
  }

  // Build segment list from bottom to top
  const filledSegments = tube.segments
  const emptyCount = SEGMENTS - filledSegments.length

  return (
    <div style={containerStyle} onClick={onClick} role="button" aria-label={`Tube ${tube.id + 1}`}>
      <div style={tubeStyle}>
        {/* empty segments */}
        {Array.from({ length: emptyCount }).map((_, i) => (
          <div key={`empty-${i}`} style={{ height: segH, opacity: 0 }} />
        ))}
        {/* filled segments bottom-to-top = render top-to-bottom reversed */}
        {[...filledSegments].reverse().map((color, i) => {
          const { fill, glow } = COLOR_MAP[color]
          const isTop = i === 0
          const isBottom = i === filledSegments.length - 1
          return (
            <div
              key={`seg-${i}`}
              style={{
                height: segH,
                background: fill,
                boxShadow: isTop ? `0 -2px 8px ${glow}88` : undefined,
                borderRadius: isTop
                  ? '4px 4px 0 0'
                  : isBottom && emptyCount === 0
                  ? '0 0 4px 4px'
                  : 0,
                transition: 'height 0.2s ease',
              }}
            />
          )
        })}
      </div>
      {complete && (
        <div style={{ marginTop: 6, fontSize: 20 }}>✓</div>
      )}
    </div>
  )
}
