import type { CSSProperties } from 'react'
import type { Tube as TubeType } from '../types'
import { isTubeComplete, SEGMENTS } from '../gameLogic'

const COLOR_MAP: Record<string, { fill: string; glow: string; shine: string }> = {
  red:    { fill: 'linear-gradient(180deg,#ff8a80,#e53935)', glow: '#e53935', shine: '#ffcdd2' },
  blue:   { fill: 'linear-gradient(180deg,#82b1ff,#1e88e5)', glow: '#1e88e5', shine: '#bbdefb' },
  green:  { fill: 'linear-gradient(180deg,#69f0ae,#43a047)', glow: '#43a047', shine: '#c8e6c9' },
  yellow: { fill: 'linear-gradient(180deg,#fff176,#f9a825)', glow: '#f9a825', shine: '#fff9c4' },
  purple: { fill: 'linear-gradient(180deg,#ce93d8,#8e24aa)', glow: '#8e24aa', shine: '#f3e5f5' },
  orange: { fill: 'linear-gradient(180deg,#ffcc80,#ef6c00)', glow: '#ef6c00', shine: '#ffe0b2' },
  pink:   { fill: 'linear-gradient(180deg,#f48fb1,#d81b60)', glow: '#d81b60', shine: '#fce4ec' },
  teal:   { fill: 'linear-gradient(180deg,#80cbc4,#00897b)', glow: '#00897b', shine: '#e0f2f1' },
  lime:   { fill: 'linear-gradient(180deg,#e6ee9c,#c0ca33)', glow: '#c0ca33', shine: '#f9fbe7' },
  coral:  { fill: 'linear-gradient(180deg,#ffab91,#e64a19)', glow: '#e64a19', shine: '#fbe9e7' },
}

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
  const segH = (tubeHeight - 6) / SEGMENTS

  const borderColor = selected
    ? 'rgba(255,255,255,0.95)'
    : canReceive
    ? 'rgba(130,200,255,0.7)'
    : complete
    ? 'rgba(255,255,255,0.35)'
    : 'rgba(255,255,255,0.14)'

  const shadow = selected
    ? `0 12px 40px rgba(0,0,0,0.5), 0 0 0 3px rgba(255,255,255,0.25), inset 0 1px 0 rgba(255,255,255,0.15)`
    : canReceive
    ? `0 6px 24px rgba(100,180,255,0.25), inset 0 1px 0 rgba(255,255,255,0.1)`
    : complete
    ? `0 0 24px rgba(255,255,255,0.12), inset 0 1px 0 rgba(255,255,255,0.1)`
    : `inset 0 1px 0 rgba(255,255,255,0.06)`

  const emptyCount = SEGMENTS - tube.segments.length
  const reversed   = [...tube.segments].reverse()
  const radius     = tubeWidth * 0.38

  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 5,
    cursor: 'pointer',
    transform: selected
      ? 'translateY(-20px) scale(1.07)'
      : canReceive
      ? 'translateY(-5px) scale(1.03)'
      : 'translateY(0) scale(1)',
    transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
    willChange: 'transform',
  }

  return (
    <div style={containerStyle} onClick={onClick} role="button" aria-label={`Tube ${tube.id + 1}`}>
      {/* Neck cap */}
      <div style={{
        width: tubeWidth * 0.44,
        height: 5,
        borderRadius: '3px 3px 0 0',
        background: borderColor,
        opacity: 0.6,
        transition: 'background 0.2s',
        flexShrink: 0,
      }} />

      {/* Glass body */}
      <div style={{
        width: tubeWidth,
        height: tubeHeight,
        borderRadius: `${radius * 0.5}px ${radius * 0.5}px ${radius}px ${radius}px`,
        border: `2.5px solid ${borderColor}`,
        background: 'rgba(255,255,255,0.04)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        position: 'relative',
        boxShadow: shadow,
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        flexShrink: 0,
      }}>
        {/* Glass shine */}
        <div style={{
          position: 'absolute',
          top: 4,
          left: '14%',
          width: '18%',
          height: '65%',
          background: 'linear-gradient(180deg,rgba(255,255,255,0.18) 0%,rgba(255,255,255,0) 100%)',
          borderRadius: '0 0 3px 3px',
          pointerEvents: 'none',
          zIndex: 2,
        }} />

        {/* Empty air */}
        {Array.from({ length: emptyCount }).map((_, i) => (
          <div key={`e${i}`} style={{ height: segH, flexShrink: 0 }} />
        ))}

        {/* Liquid segments — rendered top→bottom */}
        {reversed.map((color, i) => {
          const { fill, glow, shine } = COLOR_MAP[color]
          const isTopSeg    = i === 0
          const isBottomSeg = i === reversed.length - 1

          return (
            <div key={i} style={{
              height: segH,
              flexShrink: 0,
              background: fill,
              position: 'relative',
              borderRadius: isTopSeg
                ? '3px 3px 0 0'
                : isBottomSeg && emptyCount === 0
                ? '0 0 3px 3px'
                : 0,
              boxShadow: isTopSeg
                ? `inset 0 3px 0 ${shine}55, 0 -2px 8px ${glow}55`
                : undefined,
              transition: 'height 0.15s ease',
            }} />
          )
        })}
      </div>

      {/* Badge */}
      <div style={{ height: Math.max(tubeWidth * 0.45, 20), display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {complete && <span style={{ fontSize: Math.max(tubeWidth * 0.42, 18) }}>🐾</span>}
      </div>
    </div>
  )
}
