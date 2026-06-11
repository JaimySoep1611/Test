import { useCallback, useState } from 'react'
import type { Difficulty } from './types'
import GameBoard from './components/GameBoard'

type Screen = 'menu' | 'game' | 'win'

const DIFFICULTIES: { id: Difficulty; label: string; desc: string }[] = [
  { id: 'easy',   label: 'Easy',   desc: '4 colors · 6 tubes' },
  { id: 'medium', label: 'Medium', desc: '6 colors · 8 tubes' },
  { id: 'hard',   label: 'Hard',   desc: '9 colors · 11 tubes' },
]

export default function App() {
  const [screen, setScreen]     = useState<Screen>('menu')
  const [diff, setDiff]         = useState<Difficulty>('easy')
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
      width: '100vw',
      height: '100dvh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient orbs */}
      <div style={orb(20, 10, '#9b59b6', 300)} />
      <div style={orb(70, 80, '#0984e3', 250)} />
      <div style={orb(85, 15, '#00cec9', 200)} />

      {screen === 'menu' && (
        <Menu onStart={startGame} />
      )}

      {screen === 'game' && (
        <GameBoard
          difficulty={diff}
          onWin={handleWin}
          onBack={() => setScreen('menu')}
        />
      )}

      {screen === 'win' && (
        <WinScreen
          moves={winMoves}
          difficulty={diff}
          onReplay={() => setScreen('game')}
          onMenu={() => setScreen('menu')}
        />
      )}
    </div>
  )
}

function Menu({ onStart }: { onStart: (d: Difficulty) => void }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 32,
      zIndex: 1,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 56,
          fontWeight: 800,
          background: 'linear-gradient(135deg,#fff 0%,#74b9ff 50%,#a29bfe 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: -1,
          lineHeight: 1,
        }}>
          Magic Sort
        </div>
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 16, marginTop: 8, letterSpacing: 2 }}>
          SORT · POUR · SOLVE
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: 300 }}>
        {DIFFICULTIES.map(d => (
          <button
            key={d.id}
            onClick={() => onStart(d.id)}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 16,
              padding: '18px 24px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 17,
              fontWeight: 600,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              transition: 'all 0.2s ease',
            }}
          >
            <span>{d.label}</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 400 }}>
              {d.desc}
            </span>
          </button>
        ))}
      </div>

      <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, marginTop: 8 }}>
        Sort all tubes by color to win
      </div>
    </div>
  )
}

function WinScreen({
  moves, difficulty, onReplay, onMenu,
}: {
  moves: number
  difficulty: Difficulty
  onReplay: () => void
  onMenu: () => void
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 28,
      zIndex: 1,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 72, lineHeight: 1 }}>🎉</div>
      <div>
        <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: -1 }}>You Won!</div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, marginTop: 8 }}>
          {difficulty.toUpperCase()} · {moves} moves
        </div>
      </div>
      <div style={{ display: 'flex', gap: 14 }}>
        <button onClick={onReplay} style={actionBtn('primary')}>Play Again</button>
        <button onClick={onMenu}   style={actionBtn('ghost')}>Menu</button>
      </div>
    </div>
  )
}

function actionBtn(variant: 'primary' | 'ghost'): React.CSSProperties {
  return {
    background: variant === 'primary'
      ? 'linear-gradient(135deg,#74b9ff,#a29bfe)'
      : 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 14,
    padding: '14px 28px',
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.5,
  }
}

function orb(left: number, top: number, color: string, size: number): React.CSSProperties {
  return {
    position: 'absolute',
    left: `${left}%`,
    top: `${top}%`,
    width: size,
    height: size,
    borderRadius: '50%',
    background: color,
    opacity: 0.08,
    filter: `blur(${size / 2}px)`,
    pointerEvents: 'none',
  }
}
