import { useCallback, useState } from 'react'
import type { CSSProperties } from 'react'
import type { Difficulty } from './types'
import { DIFFICULTY_CONFIGS, starsForMoves } from './gameLogic'
import GameBoard from './components/GameBoard'
import MurdokuBoard from './components/MurdokuBoard'

type Screen = 'menu' | 'game' | 'win' | 'murdoku'

const BG_DOGS = ['🐶', '🐕', '🦮', '🐩', '🐾', '🦴', '🐕‍🦺', '🐶', '🐾', '🦴']

export default function App() {
  const [screen, setScreen]     = useState<Screen>('menu')
  const [diff, setDiff]         = useState<Difficulty>('woof')
  const [winMoves, setWinMoves] = useState(0)

  const handleWin = useCallback((moves: number) => {
    setWinMoves(moves)
    setScreen('win')
  }, [])

  const startGame = useCallback((d: Difficulty) => {
    setDiff(d)
    setScreen('game')
  }, [])

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(160deg,#0d1b2a 0%,#1a1f3a 50%,#0f1e35 100%)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient orbs */}
      <Orb left="8%"  top="12%" color="#7c3aed" size={360} />
      <Orb left="80%" top="75%" color="#1d4ed8" size={300} />
      <Orb left="88%" top="8%"  color="#0891b2" size={240} />
      <Orb left="5%"  top="82%" color="#9333ea" size={220} />

      {/* Floating background dogs (menu only) */}
      {screen === 'menu' && BG_DOGS.map((dog, i) => (
        <div
          key={i}
          className="float-dog"
          style={{
            position: 'absolute',
            fontSize: 28 + (i % 4) * 10,
            left: `${(i * 97 + 7) % 88 + 4}%`,
            top:  `${(i * 71 + 11) % 82 + 4}%`,
            opacity: 0.05 + (i % 3) * 0.025,
            animationDelay: `${i * 0.35}s`,
            animationDuration: `${2.8 + (i % 3) * 0.6}s`,
            pointerEvents: 'none',
          }}
        >
          {dog}
        </div>
      ))}

      {screen === 'menu' && <Menu onStart={startGame} onMurdoku={() => setScreen('murdoku')} />}

      {screen === 'murdoku' && <MurdokuBoard onBack={() => setScreen('menu')} />}

      {screen === 'game' && (
        <GameBoard difficulty={diff} onWin={handleWin} onBack={() => setScreen('menu')} />
      )}

      {screen === 'win' && (
        <WinScreen
          moves={winMoves}
          difficulty={diff}
          onReplay={() => startGame(diff)}
          onMenu={() => setScreen('menu')}
          onNext={() => {
            const idx  = DIFFICULTY_CONFIGS.findIndex(d => d.id === diff)
            const next = DIFFICULTY_CONFIGS[Math.min(idx + 1, DIFFICULTY_CONFIGS.length - 1)]
            startGame(next.id)
          }}
          isLast={DIFFICULTY_CONFIGS[DIFFICULTY_CONFIGS.length - 1].id === diff}
        />
      )}
    </div>
  )
}

// ─── Menu ────────────────────────────────────────────────────────────────────

function Menu({ onStart, onMurdoku }: { onStart: (d: Difficulty) => void; onMurdoku: () => void }) {
  return (
    <div className="slide-up" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 28,
      zIndex: 1,
      width: '100%',
      maxWidth: 420,
      padding: '0 24px',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center' }}>
        <div className="glow-pulse" style={{ fontSize: 76, lineHeight: 1, marginBottom: 10 }}>
          🐕
        </div>
        <h1 style={{
          fontSize: 50,
          fontWeight: 900,
          background: 'linear-gradient(135deg,#e0c3fc 0%,#8ec5fc 50%,#a1c4fd 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: -2,
          lineHeight: 1,
          margin: 0,
        }}>
          Magic Sort
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 6, letterSpacing: 3, textTransform: 'uppercase' }}>
          Sort · Pour · Solve
        </p>
      </div>

      {/* Difficulty cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, width: '100%' }}>
        {DIFFICULTY_CONFIGS.map((d, i) => (
          <button
            key={d.id}
            onClick={() => onStart(d.id)}
            style={{
              background: 'rgba(255,255,255,0.055)',
              border: '1px solid rgba(255,255,255,0.11)',
              borderRadius: 16,
              padding: '13px 18px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              fontSize: 16,
              fontWeight: 600,
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              textAlign: 'left',
              width: '100%',
              animationDelay: `${i * 0.06}s`,
            }}
          >
            <span style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>{d.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ lineHeight: 1.2 }}>{d.label}</div>
              <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12, fontWeight: 400, marginTop: 3 }}>
                {d.desc}
              </div>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 20, fontWeight: 300 }}>›</span>
          </button>
        ))}
      </div>

      {/* Murdoku button */}
      <button
        onClick={onMurdoku}
        style={{
          background: 'rgba(30,15,5,0.7)',
          border: '1px solid rgba(212,160,23,0.45)',
          borderRadius: 16,
          padding: '13px 18px',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          fontSize: 16,
          fontWeight: 600,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          textAlign: 'left',
          width: '100%',
        }}
      >
        <span style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>🔍</span>
        <div style={{ flex: 1 }}>
          <div style={{ lineHeight: 1.2, color: '#f0c840' }}>Murdoku</div>
          <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12, fontWeight: 400, marginTop: 3 }}>
            10 cases · arithmetic mystery
          </div>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 20, fontWeight: 300 }}>›</span>
      </button>

      <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: 12, letterSpacing: 0.5 }}>
        Sort all tubes by color to win 🐾
      </p>
    </div>
  )
}

// ─── Win screen ───────────────────────────────────────────────────────────────

const WIN_DOGS = ['🐶', '🎉', '🐕', '🎊', '🦮', '🎈', '🐾']

function WinScreen({ moves, difficulty, onReplay, onMenu, onNext, isLast }: {
  moves: number
  difficulty: Difficulty
  onReplay: () => void
  onMenu: () => void
  onNext: () => void
  isLast: boolean
}) {
  const config = DIFFICULTY_CONFIGS.find(d => d.id === difficulty)!
  const stars  = starsForMoves(moves, config.colorCount)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 24,
      zIndex: 1,
      textAlign: 'center',
      padding: '0 28px',
    }}>
      {/* Celebration row */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        {WIN_DOGS.map((e, i) => (
          <span
            key={i}
            className="celebrate"
            style={{ display: 'inline-block', fontSize: 40, animationDelay: `${i * 0.08}s` }}
          >
            {e}
          </span>
        ))}
      </div>

      <div>
        <h2 style={{ fontSize: 42, fontWeight: 900, letterSpacing: -1.5, margin: 0 }}>
          Paw-some! {config.icon}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, marginTop: 6 }}>
          {config.label} · {moves} moves
        </p>
      </div>

      {/* Stars */}
      <div style={{ display: 'flex', gap: 10 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <span
            key={i}
            className={i < stars ? 'star-pop' : ''}
            style={{
              display: 'inline-block',
              fontSize: 40,
              opacity: i < stars ? 1 : 0.18,
              animationDelay: `${0.4 + i * 0.12}s`,
            }}
          >
            ⭐
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {!isLast && (
          <button onClick={onNext} style={actionBtn('primary')}>Next Level →</button>
        )}
        <button onClick={onReplay} style={actionBtn('ghost')}>Replay</button>
        <button onClick={onMenu}   style={actionBtn('ghost')}>Menu</button>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Orb({ left, top, color, size }: { left: string; top: string; color: string; size: number }) {
  const style: CSSProperties = {
    position: 'absolute',
    left,
    top,
    width: size,
    height: size,
    borderRadius: '50%',
    background: color,
    opacity: 0.13,
    filter: `blur(${Math.floor(size * 0.65)}px)`,
    pointerEvents: 'none',
    transform: 'translate(-50%,-50%)',
  }
  return <div style={style} />
}

function actionBtn(variant: 'primary' | 'ghost'): CSSProperties {
  return {
    background: variant === 'primary'
      ? 'linear-gradient(135deg,#7c3aed,#2563eb)'
      : 'rgba(255,255,255,0.08)',
    border: `1px solid ${variant === 'primary' ? 'transparent' : 'rgba(255,255,255,0.18)'}`,
    borderRadius: 14,
    padding: '14px 28px',
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.3,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  }
}
