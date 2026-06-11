import type { CSSProperties } from 'react'
import type { Tube as TubeType } from '../types'
import { isTubeComplete, SEGMENTS } from '../gameLogic'

interface ColorDef {
  fill: string       // 3-stop vertical gradient
  side: string       // semi-transparent lateral lighting overlay
  glow: string       // outer glow / shadow color
  meniscus: string   // bright surface highlight
}

const COLOR_MAP: Record<string, ColorDef> = {
  red:    { fill: 'linear-gradient(180deg,#FF9191 0%,#E8003A 42%,#5A0000 100%)', side: 'linear-gradient(90deg,rgba(255,160,160,0.22) 0%,transparent 38%,rgba(0,0,0,0.2) 100%)', glow: '#FF2D55', meniscus: '#FFBDBD' },
  blue:   { fill: 'linear-gradient(180deg,#80C8FF 0%,#0A84FF 42%,#002870 100%)', side: 'linear-gradient(90deg,rgba(140,195,255,0.22) 0%,transparent 38%,rgba(0,0,0,0.2) 100%)', glow: '#0A84FF', meniscus: '#B0DEFF' },
  green:  { fill: 'linear-gradient(180deg,#72E896 0%,#25C050 42%,#083A14 100%)', side: 'linear-gradient(90deg,rgba(130,230,160,0.22) 0%,transparent 38%,rgba(0,0,0,0.2) 100%)', glow: '#30D158', meniscus: '#AAEFBF' },
  yellow: { fill: 'linear-gradient(180deg,#FFF3A0 0%,#FFD60A 42%,#6B5000 100%)', side: 'linear-gradient(90deg,rgba(255,238,140,0.22) 0%,transparent 38%,rgba(0,0,0,0.2) 100%)', glow: '#FFD60A', meniscus: '#FFF4B8' },
  purple: { fill: 'linear-gradient(180deg,#DCB0FF 0%,#BF5AF2 42%,#420070 100%)', side: 'linear-gradient(90deg,rgba(215,165,255,0.22) 0%,transparent 38%,rgba(0,0,0,0.2) 100%)', glow: '#BF5AF2', meniscus: '#EDD5FF' },
  orange: { fill: 'linear-gradient(180deg,#FFD080 0%,#FF9500 42%,#703200 100%)', side: 'linear-gradient(90deg,rgba(255,205,140,0.22) 0%,transparent 38%,rgba(0,0,0,0.2) 100%)', glow: '#FF9500', meniscus: '#FFE3A0' },
  pink:   { fill: 'linear-gradient(180deg,#FF90C0 0%,#FF2D96 42%,#720040 100%)', side: 'linear-gradient(90deg,rgba(255,155,200,0.22) 0%,transparent 38%,rgba(0,0,0,0.2) 100%)', glow: '#FF2D96', meniscus: '#FFB8D8' },
  teal:   { fill: 'linear-gradient(180deg,#74D8FF 0%,#32ADE6 42%,#003858 100%)', side: 'linear-gradient(90deg,rgba(130,215,255,0.22) 0%,transparent 38%,rgba(0,0,0,0.2) 100%)', glow: '#32ADE6', meniscus: '#A8E8FF' },
  lime:   { fill: 'linear-gradient(180deg,#C8FF90 0%,#76D700 42%,#2B4800 100%)', side: 'linear-gradient(90deg,rgba(200,255,140,0.22) 0%,transparent 38%,rgba(0,0,0,0.2) 100%)', glow: '#76D700', meniscus: '#DAFFB0' },
  coral:  { fill: 'linear-gradient(180deg,#FFBB98 0%,#FF6240 42%,#6A1A00 100%)', side: 'linear-gradient(90deg,rgba(255,185,150,0.22) 0%,transparent 38%,rgba(0,0,0,0.2) 100%)', glow: '#FF6240', meniscus: '#FFD0B8' },
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
  const complete      = isTubeComplete(tube)
  const segH          = Math.floor((tubeHeight - 6) / SEGMENTS)
  const bottomRadius  = Math.floor(tubeWidth / 2) + 2

  const topSegColor = tube.segments.length > 0
    ? COLOR_MAP[tube.segments[tube.segments.length - 1]]
    : null
  const glowColor = topSegColor?.glow

  const borderColor = selected
    ? 'rgba(255,255,255,0.88)'
    : canReceive
    ? `${glowColor ?? 'rgba(130,200,255,1)'}AA`
    : complete
    ? `${glowColor}88`
    : 'rgba(255,255,255,0.12)'

  const shadow = selected
    ? `0 20px 56px rgba(0,0,0,0.7), 0 0 0 2.5px ${glowColor ?? '#fff'}CC, 0 0 40px ${glowColor ?? '#fff'}55`
    : canReceive
    ? `0 8px 28px rgba(0,0,0,0.45), 0 0 0 2px ${glowColor ?? 'rgba(130,200,255,1)'}55, 0 0 22px ${glowColor ?? 'rgba(130,200,255,1)'}40`
    : complete
    ? `0 0 36px ${glowColor}80, 0 0 0 1.5px ${glowColor}55, inset 0 1px 0 rgba(255,255,255,0.08)`
    : `0 4px 18px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)`

  const emptyCount = SEGMENTS - tube.segments.length
  const reversed   = [...tube.segments].reverse()

  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    cursor: 'pointer',
    transform: selected
      ? 'translateY(-22px) scale(1.08)'
      : canReceive
      ? 'translateY(-6px) scale(1.03)'
      : 'translateY(0) scale(1)',
    transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1)',
    willChange: 'transform',
  }

  return (
    <div style={containerStyle} onClick={onClick} role="button" aria-label={`Tube ${tube.id + 1}`}>

      {/* Glass neck */}
      <div style={{
        width: tubeWidth * 0.48,
        height: 8,
        borderRadius: '5px 5px 0 0',
        background: selected
          ? `linear-gradient(180deg, ${glowColor ?? 'rgba(255,255,255,0.5)'} 0%, rgba(255,255,255,0.15) 100%)`
          : 'linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 100%)',
        border: `1.5px solid ${borderColor}`,
        borderBottom: 'none',
        transition: 'background 0.2s, border-color 0.2s',
        flexShrink: 0,
        position: 'relative',
      }}>
        {/* Neck inner shine */}
        <div style={{
          position: 'absolute',
          left: '20%', top: 2, width: '18%', bottom: 0,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%)',
          borderRadius: 2,
          pointerEvents: 'none',
        }} />
      </div>

      {/* Glass tube body */}
      <div
        className={complete ? 'tube-complete' : undefined}
        style={{
          width: tubeWidth,
          height: tubeHeight,
          borderRadius: `5px 5px ${bottomRadius}px ${bottomRadius}px`,
          border: `2px solid ${borderColor}`,
          background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 55%, rgba(0,0,0,0.1) 100%)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          position: 'relative',
          boxShadow: shadow,
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          flexShrink: 0,
        }}
      >
        {/* Left glass shine — primary */}
        <div style={{
          position: 'absolute', top: 4, left: '12%',
          width: '14%', height: '70%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%)',
          borderRadius: '0 0 4px 4px',
          pointerEvents: 'none', zIndex: 10,
        }} />
        {/* Left glass shine — thin secondary */}
        <div style={{
          position: 'absolute', top: 4, left: '7%',
          width: '4%', height: '42%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 100%)',
          borderRadius: '0 0 2px 2px',
          pointerEvents: 'none', zIndex: 10,
        }} />
        {/* Top rim highlight */}
        <div style={{
          position: 'absolute', top: 0, left: '8%', right: '8%', height: 2,
          background: 'rgba(255,255,255,0.45)',
          pointerEvents: 'none', zIndex: 10,
        }} />

        {/* Empty air segments */}
        {Array.from({ length: emptyCount }).map((_, i) => (
          <div key={`e${i}`} style={{ height: segH, flexShrink: 0 }} />
        ))}

        {/* Liquid segments */}
        {reversed.map((color, i) => {
          const c                = COLOR_MAP[color]
          const hasSepAbove      = i > 0 && reversed[i - 1] !== color
          const isGroupTop       = i === 0 || hasSepAbove

          return (
            <div
              key={i}
              style={{
                height: segH,
                flexShrink: 0,
                background: `${c.side}, ${c.fill}`,
                position: 'relative',
                borderTop: hasSepAbove ? '2px solid rgba(0,0,0,0.5)' : 'none',
                boxSizing: 'border-box',
              }}
            >
              {/* Liquid surface / meniscus highlight */}
              {isGroupTop && (
                <div style={{
                  position: 'absolute',
                  top: hasSepAbove ? 4 : 2,
                  left: '10%', right: '10%', height: 3,
                  background: `linear-gradient(90deg, transparent 0%, ${c.meniscus}BB 25%, ${c.meniscus}EE 50%, ${c.meniscus}BB 75%, transparent 100%)`,
                  borderRadius: 2,
                  pointerEvents: 'none', zIndex: 1,
                }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Completion badge */}
      <div style={{
        height: Math.max(tubeWidth * 0.45, 20),
        display: 'flex', alignItems: 'center', flexShrink: 0,
      }}>
        {complete && <span style={{ fontSize: Math.max(tubeWidth * 0.42, 18) }}>🐾</span>}
      </div>
    </div>
  )
}
