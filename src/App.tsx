import { useEffect, useRef, useState, useCallback } from 'react'

// ===== Game Constants =====
const CANVAS_WIDTH = 400
const CANVAS_HEIGHT = 600
const BIRD_SIZE = 30
const BIRD_X = 100
const PIPE_WIDTH = 60
const GROUND_HEIGHT = 60

// ===== Difficulty Levels =====
interface DifficultyConfig {
  name: string
  nameRu: string
  icon: string
  color: string
  bgColor: string
  borderColor: string
  gravity: number
  jumpForce: number
  pipeGap: number
  pipeSpeed: number
  pipeSpawnInterval: number
  description: string
}

const DIFFICULTIES: Record<string, DifficultyConfig> = {
  easy: {
    name: 'Easy',
    nameRu: 'Легко',
    icon: '😊',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/40',
    gravity: 0.15,
    jumpForce: -5,
    pipeGap: 280,
    pipeSpeed: 1,
    pipeSpawnInterval: 3500,
    description: 'Максимально просто',
  },
  normal: {
    name: 'Normal',
    nameRu: 'Нормально',
    icon: '😎',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/40',
    gravity: 0.22,
    jumpForce: -5.5,
    pipeGap: 240,
    pipeSpeed: 1.4,
    pipeSpawnInterval: 3000,
    description: 'Очень легко',
  },
  hard: {
    name: 'Hard',
    nameRu: 'Сложно',
    icon: '😤',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/40',
    gravity: 0.3,
    jumpForce: -6,
    pipeGap: 200,
    pipeSpeed: 1.8,
    pipeSpawnInterval: 2500,
    description: 'Комфортная игра',
  },
  extreme: {
    name: 'Extreme',
    nameRu: 'Экстрим',
    icon: '💀',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/40',
    gravity: 0.38,
    jumpForce: -6.5,
    pipeGap: 180,
    pipeSpeed: 2.2,
    pipeSpawnInterval: 2000,
    description: 'Для опытных игроков',
  },
}

// ===== Types =====
interface Bird {
  y: number
  velocity: number
  rotation: number
}

interface Pipe {
  x: number
  topHeight: number
  passed: boolean
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

type GameState = 'menu' | 'playing' | 'gameover'

// ===== Helper Functions =====
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameStateRef = useRef<GameState>('menu')
  const birdRef = useRef<Bird>({ y: CANVAS_HEIGHT / 2, velocity: 0, rotation: 0 })
  const pipesRef = useRef<Pipe[]>([])
  const particlesRef = useRef<Particle[]>([])
  const scoreRef = useRef(0)
  const frameRef = useRef(0)
  const lastPipeTimeRef = useRef(0)
  const animFrameRef = useRef<number>(0)
  const groundOffsetRef = useRef(0)
  const flashRef = useRef(0)
  const shakeRef = useRef({ x: 0, y: 0, intensity: 0 })
  const difficultyRef = useRef<string>('normal')

  const [displayState, setDisplayState] = useState<GameState>('menu')
  const [score, setScore] = useState(0)
  const [selectedDifficulty, setSelectedDifficulty] = useState('normal')
  const [showDifficultyPicker, setShowDifficultyPicker] = useState(false)
  const [bestScores, setBestScores] = useState<Record<string, number>>(() => {
    const saved: Record<string, number> = {}
    Object.keys(DIFFICULTIES).forEach((key) => {
      const val = localStorage.getItem(`flappy-best-${key}`)
      saved[key] = val ? parseInt(val) : 0
    })
    return saved
  })

  const currentDifficulty = DIFFICULTIES[selectedDifficulty]

  // ===== Particle System =====
  const spawnParticles = useCallback((x: number, y: number, count: number, color: string) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 3
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 30 + Math.random() * 20,
        color,
        size: 2 + Math.random() * 4,
      })
    }
  }, [])

  // ===== Reset Game =====
  const resetGame = useCallback(() => {
    birdRef.current = { y: CANVAS_HEIGHT / 2, velocity: 0, rotation: 0 }
    pipesRef.current = []
    particlesRef.current = []
    scoreRef.current = 0
    frameRef.current = 0
    lastPipeTimeRef.current = 0
    flashRef.current = 0
    shakeRef.current = { x: 0, y: 0, intensity: 0 }
    setScore(0)
  }, [])

  // ===== Start Game =====
  const startGame = useCallback(() => {
    difficultyRef.current = selectedDifficulty
    gameStateRef.current = 'playing'
    setDisplayState('playing')
    setShowDifficultyPicker(false)
    resetGame()
    birdRef.current.velocity = DIFFICULTIES[selectedDifficulty].jumpForce
    spawnParticles(BIRD_X, birdRef.current.y, 5, '#fbbf24')
  }, [selectedDifficulty, resetGame, spawnParticles])

  // ===== Jump =====
  const jump = useCallback(() => {
    const diff = DIFFICULTIES[difficultyRef.current]
    if (gameStateRef.current === 'playing') {
      birdRef.current.velocity = diff.jumpForce
      spawnParticles(BIRD_X, birdRef.current.y + BIRD_SIZE / 2, 5, '#fbbf24')
    }
  }, [spawnParticles])

  // ===== Collision Detection =====
  const checkCollision = useCallback(() => {
    const bird = birdRef.current
    const birdTop = bird.y - BIRD_SIZE / 2
    const birdBottom = bird.y + BIRD_SIZE / 2
    const birdLeft = BIRD_X - BIRD_SIZE / 2
    const birdRight = BIRD_X + BIRD_SIZE / 2
    const diff = DIFFICULTIES[difficultyRef.current]

    if (birdBottom >= CANVAS_HEIGHT - GROUND_HEIGHT || birdTop <= 0) {
      return true
    }

    for (const pipe of pipesRef.current) {
      const pipeLeft = pipe.x
      const pipeRight = pipe.x + PIPE_WIDTH
      const gapTop = pipe.topHeight
      const gapBottom = pipe.topHeight + diff.pipeGap

      // Super forgiving collision (20px margin)
      if (birdRight > pipeLeft + 20 && birdLeft < pipeRight - 20) {
        if (birdTop < gapTop + 15 || birdBottom > gapBottom - 15) {
          return true
        }
      }
    }

    return false
  }, [])

  // ===== Draw Bird =====
  const drawBird = useCallback((ctx: CanvasRenderingContext2D, bird: Bird) => {
    ctx.save()
    ctx.translate(BIRD_X, bird.y)
    ctx.rotate((bird.rotation * Math.PI) / 180)

    const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
    bodyGrad.addColorStop(0, '#fde68a')
    bodyGrad.addColorStop(0.6, '#fbbf24')
    bodyGrad.addColorStop(1, '#f59e0b')
    ctx.fillStyle = bodyGrad
    ctx.beginPath()
    ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.3, 0, 0, Math.PI * 2)
    ctx.fill()

    const wingFlap = Math.sin(frameRef.current * 0.3) * 5
    ctx.fillStyle = '#f59e0b'
    ctx.beginPath()
    ctx.ellipse(-3, 2 + wingFlap, 10, 6, -0.3, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(8, -5, 6, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#1e1e1e'
    ctx.beginPath()
    ctx.arc(10, -5, 3, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(11, -6, 1.2, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.moveTo(12, 0)
    ctx.lineTo(20, 2)
    ctx.lineTo(12, 5)
    ctx.closePath()
    ctx.fill()

    ctx.restore()
  }, [])

  // ===== Draw Pipe =====
  const drawPipe = useCallback((ctx: CanvasRenderingContext2D, pipe: Pipe) => {
    const diff = DIFFICULTIES[difficultyRef.current]
    const gapTop = pipe.topHeight
    const gapBottom = pipe.topHeight + diff.pipeGap

    const topGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0)
    topGrad.addColorStop(0, '#16a34a')
    topGrad.addColorStop(0.3, '#22c55e')
    topGrad.addColorStop(0.7, '#22c55e')
    topGrad.addColorStop(1, '#15803d')
    ctx.fillStyle = topGrad
    drawRoundedRect(ctx, pipe.x, 0, PIPE_WIDTH, gapTop, 4)
    ctx.fill()

    const capGrad = ctx.createLinearGradient(pipe.x - 4, 0, pipe.x + PIPE_WIDTH + 4, 0)
    capGrad.addColorStop(0, '#15803d')
    capGrad.addColorStop(0.3, '#22c55e')
    capGrad.addColorStop(0.7, '#22c55e')
    capGrad.addColorStop(1, '#166534')
    ctx.fillStyle = capGrad
    drawRoundedRect(ctx, pipe.x - 4, gapTop - 26, PIPE_WIDTH + 8, 26, 6)
    ctx.fill()

    ctx.fillStyle = topGrad
    drawRoundedRect(ctx, pipe.x, gapBottom, PIPE_WIDTH, CANVAS_HEIGHT - gapBottom - GROUND_HEIGHT, 4)
    ctx.fill()

    ctx.fillStyle = capGrad
    drawRoundedRect(ctx, pipe.x - 4, gapBottom, PIPE_WIDTH + 8, 26, 6)
    ctx.fill()

    ctx.fillStyle = 'rgba(255,255,255,0.1)'
    ctx.fillRect(pipe.x + 8, 0, 6, gapTop - 26)
    ctx.fillRect(pipe.x + 8, gapBottom + 26, 6, CANVAS_HEIGHT - gapBottom - GROUND_HEIGHT - 26)
  }, [])

  // ===== Draw Background =====
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT)
    skyGrad.addColorStop(0, '#0ea5e9')
    skyGrad.addColorStop(0.5, '#38bdf8')
    skyGrad.addColorStop(1, '#7dd3fc')
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    const cloudOffset = (frameRef.current * 0.3) % (CANVAS_WIDTH + 200)
    const drawCloud = (cx: number, cy: number, size: number) => {
      const x = ((cx - cloudOffset + CANVAS_WIDTH + 200) % (CANVAS_WIDTH + 200)) - 100
      ctx.beginPath()
      ctx.arc(x, cy, size, 0, Math.PI * 2)
      ctx.arc(x + size * 0.8, cy - size * 0.2, size * 0.7, 0, Math.PI * 2)
      ctx.arc(x + size * 1.4, cy, size * 0.8, 0, Math.PI * 2)
      ctx.arc(x - size * 0.5, cy + size * 0.1, size * 0.6, 0, Math.PI * 2)
      ctx.fill()
    }
    drawCloud(100, 80, 25)
    drawCloud(300, 120, 20)
    drawCloud(200, 180, 15)
    drawCloud(50, 250, 18)
    drawCloud(350, 60, 22)

    ctx.fillStyle = 'rgba(34, 197, 94, 0.2)'
    ctx.beginPath()
    ctx.moveTo(0, CANVAS_HEIGHT - GROUND_HEIGHT)
    for (let x = 0; x <= CANVAS_WIDTH; x += 40) {
      const h = Math.sin(x * 0.015 + 1) * 30 + Math.sin(x * 0.008) * 20
      ctx.lineTo(x, CANVAS_HEIGHT - GROUND_HEIGHT - 40 - h)
    }
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT)
    ctx.closePath()
    ctx.fill()
  }, [])

  // ===== Draw Ground =====
  const drawGround = useCallback((ctx: CanvasRenderingContext2D) => {
    const groundY = CANVAS_HEIGHT - GROUND_HEIGHT

    const groundGrad = ctx.createLinearGradient(0, groundY, 0, CANVAS_HEIGHT)
    groundGrad.addColorStop(0, '#92400e')
    groundGrad.addColorStop(0.1, '#a16207')
    groundGrad.addColorStop(1, '#78350f')
    ctx.fillStyle = groundGrad
    ctx.fillRect(0, groundY, CANVAS_WIDTH, GROUND_HEIGHT)

    const grassGrad = ctx.createLinearGradient(0, groundY, 0, groundY + 15)
    grassGrad.addColorStop(0, '#22c55e')
    grassGrad.addColorStop(1, '#16a34a')
    ctx.fillStyle = grassGrad
    ctx.fillRect(0, groundY, CANVAS_WIDTH, 15)

    ctx.fillStyle = 'rgba(0,0,0,0.1)'
    const offset = groundOffsetRef.current % 40
    for (let x = -40 + offset; x < CANVAS_WIDTH + 40; x += 40) {
      ctx.fillRect(x, groundY + 15, 20, 2)
      ctx.fillRect(x + 20, groundY + 25, 20, 2)
    }
  }, [])

  // ===== Draw Particles =====
  const drawParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    particlesRef.current.forEach((p) => {
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.globalAlpha = 1
  }, [])

  // ===== Draw Score =====
  const drawScore = useCallback((ctx: CanvasRenderingContext2D, s: number) => {
    ctx.save()
    ctx.font = 'bold 48px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.fillText(String(s), CANVAS_WIDTH / 2 + 2, 72)
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'
    ctx.lineWidth = 3
    ctx.strokeText(String(s), CANVAS_WIDTH / 2, 70)
    ctx.fillText(String(s), CANVAS_WIDTH / 2, 70)
    ctx.restore()
  }, [])

  // ===== Draw Difficulty Badge =====
  const drawDifficultyBadge = useCallback((ctx: CanvasRenderingContext2D) => {
    const diff = DIFFICULTIES[difficultyRef.current]
    ctx.save()
    ctx.font = 'bold 14px Arial, sans-serif'
    const text = `${diff.icon} ${diff.nameRu}`
    const metrics = ctx.measureText(text)
    const padding = 10
    const badgeWidth = metrics.width + padding * 2
    const badgeHeight = 28
    const badgeX = CANVAS_WIDTH / 2 - badgeWidth / 2
    const badgeY = 8

    ctx.fillStyle = 'rgba(0,0,0,0.4)'
    drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 14)
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, CANVAS_WIDTH / 2, badgeY + badgeHeight / 2)
    ctx.restore()
  }, [])

  // ===== Game Loop =====
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const gameLoop = () => {
      frameRef.current++
      const state = gameStateRef.current
      const diff = DIFFICULTIES[difficultyRef.current]

      if (state === 'playing') {
        const bird = birdRef.current
        bird.velocity += diff.gravity
        bird.y += bird.velocity
        bird.rotation = lerp(bird.rotation, Math.min(bird.velocity * 4, 70), 0.1)

        groundOffsetRef.current -= diff.pipeSpeed

        const now = Date.now()
        if (now - lastPipeTimeRef.current > diff.pipeSpawnInterval) {
          const minTop = 120
          const maxTop = CANVAS_HEIGHT - GROUND_HEIGHT - diff.pipeGap - 120
          const topHeight = minTop + Math.random() * (maxTop - minTop)
          pipesRef.current.push({ x: CANVAS_WIDTH, topHeight, passed: false })
          lastPipeTimeRef.current = now
        }

        pipesRef.current.forEach((pipe) => {
          pipe.x -= diff.pipeSpeed
          if (!pipe.passed && pipe.x + PIPE_WIDTH < BIRD_X) {
            pipe.passed = true
            scoreRef.current++
            setScore(scoreRef.current)
            spawnParticles(BIRD_X, bird.y, 8, '#a78bfa')
          }
        })

        pipesRef.current = pipesRef.current.filter((p) => p.x > -PIPE_WIDTH - 10)

        if (checkCollision()) {
          gameStateRef.current = 'gameover'
          setDisplayState('gameover')
          flashRef.current = 1
          shakeRef.current.intensity = 10
          spawnParticles(BIRD_X, bird.y, 20, '#ef4444')
          spawnParticles(BIRD_X, bird.y, 10, '#fbbf24')
          frameRef.current = 0

          const currentBest = bestScores[difficultyRef.current] || 0
          if (scoreRef.current > currentBest) {
            setBestScores((prev) => ({
              ...prev,
              [difficultyRef.current]: scoreRef.current,
            }))
            localStorage.setItem(`flappy-best-${difficultyRef.current}`, String(scoreRef.current))
          }
        }
      } else if (state === 'menu') {
        const bird = birdRef.current
        bird.y = CANVAS_HEIGHT / 2 + Math.sin(frameRef.current * 0.05) * 15
        bird.rotation = 0
        groundOffsetRef.current -= 1
      } else if (state === 'gameover') {
        const bird = birdRef.current
        if (bird.y < CANVAS_HEIGHT - GROUND_HEIGHT - BIRD_SIZE / 2) {
          bird.velocity += diff.gravity * 0.5 // Slower fall after death
          bird.y += bird.velocity
          bird.rotation = lerp(bird.rotation, 90, 0.08)
        }
      }

      particlesRef.current.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.05
        p.life -= 1 / p.maxLife
      })
      particlesRef.current = particlesRef.current.filter((p) => p.life > 0)

      if (shakeRef.current.intensity > 0) {
        shakeRef.current.x = (Math.random() - 0.5) * shakeRef.current.intensity
        shakeRef.current.y = (Math.random() - 0.5) * shakeRef.current.intensity
        shakeRef.current.intensity *= 0.9
        if (shakeRef.current.intensity < 0.5) {
          shakeRef.current = { x: 0, y: 0, intensity: 0 }
        }
      }

      if (flashRef.current > 0) {
        flashRef.current -= 0.05
      }

      ctx.save()
      ctx.translate(shakeRef.current.x, shakeRef.current.y)

      drawBackground(ctx)
      pipesRef.current.forEach((pipe) => drawPipe(ctx, pipe))
      drawGround(ctx)
      drawBird(ctx, birdRef.current)
      drawParticles(ctx)

      if (state === 'playing') {
        drawScore(ctx, scoreRef.current)
        drawDifficultyBadge(ctx)
      }

      if (flashRef.current > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${flashRef.current})`
        ctx.fillRect(-10, -10, CANVAS_WIDTH + 20, CANVAS_HEIGHT + 20)
      }

      ctx.restore()

      animFrameRef.current = requestAnimationFrame(gameLoop)
    }

    animFrameRef.current = requestAnimationFrame(gameLoop)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [bestScores, checkCollision, drawBackground, drawBird, drawDifficultyBadge, drawGround, drawParticles, drawPipe, drawScore, spawnParticles])

  // ===== Keyboard Handler =====
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = gameStateRef.current

      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        if (state === 'playing') {
          jump()
        } else if (state === 'menu') {
          // Space in menu starts the game
          startGame()
        } else if (state === 'gameover' && frameRef.current > 30) {
          gameStateRef.current = 'menu'
          setDisplayState('menu')
          resetGame()
        }
      }

      // Number keys 1-4 for quick difficulty selection in menu
      if (state === 'menu') {
        const keys = Object.keys(DIFFICULTIES)
        if (e.key === '1') setSelectedDifficulty(keys[0])
        if (e.key === '2') setSelectedDifficulty(keys[1])
        if (e.key === '3') setSelectedDifficulty(keys[2])
        if (e.key === '4') setSelectedDifficulty(keys[3])
      }
    }

    // Use capture phase to ensure we get the event first
    document.addEventListener('keydown', handleKeyDown, true)
    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [jump, resetGame, startGame])

  // ===== Focus management =====
  useEffect(() => {
    // Focus the canvas when game starts
    if (displayState === 'playing' && canvasRef.current) {
      canvasRef.current.focus()
    }
  }, [displayState])

  // Ensure page gets focus on load (important for iframes)
  useEffect(() => {
    const handleFocus = () => {
      if (canvasRef.current) {
        canvasRef.current.focus()
      }
    }
    window.addEventListener('focus', handleFocus)
    document.addEventListener('click', handleFocus)
    // Initial focus
    handleFocus()
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('click', handleFocus)
    }
  }, [])

  // ===== Canvas Click (only for playing) =====
  const handleCanvasClick = () => {
    if (gameStateRef.current === 'playing') {
      jump()
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    if (gameStateRef.current === 'playing') {
      jump()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900 flex flex-col items-center justify-center p-4 select-none">
      {/* Title */}
      <div className="mb-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500">
          🐦 Flappy Bird
        </h1>
      </div>

      {/* Game Canvas Container */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-indigo-500/20 border-2 border-indigo-500/30">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="block outline-none"
          tabIndex={0}
          style={{ cursor: displayState === 'playing' ? 'pointer' : 'default' }}
          onClick={handleCanvasClick}
          onTouchStart={handleTouchStart}
        />

        {/* Menu Overlay */}
        {displayState === 'menu' && !showDifficultyPicker && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-bounce">🐦</div>
              <h2 className="text-3xl font-bold text-white mb-6">Готовы?</h2>
              
              {/* Difficulty selector */}
              <div className="mb-6">
                <p className="text-gray-400 text-sm mb-3">Выберите сложность:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {Object.entries(DIFFICULTIES).map(([key, diff]) => (
                    <button
                      key={key}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedDifficulty(key)
                      }}
                      className={`px-3 py-2 rounded-lg border transition-all duration-200 text-sm font-medium ${
                        selectedDifficulty === key
                          ? `${diff.bgColor} ${diff.borderColor} ${diff.color} scale-105 shadow-lg`
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {diff.icon} {diff.nameRu}
                    </button>
                  ))}
                </div>
                <p className={`text-xs mt-2 ${currentDifficulty.color}`}>
                  {currentDifficulty.description}
                </p>
              </div>

              {/* Best scores */}
              {Object.values(bestScores).some((s) => s > 0) && (
                <div className="bg-black/40 rounded-xl p-3 border border-white/10 mb-4 max-w-xs">
                  <div className="text-xs text-gray-400 mb-2">🏆 Рекорды</div>
                  <div className="flex justify-center gap-3 text-xs">
                    {Object.entries(DIFFICULTIES).map(([key, diff]) => (
                      bestScores[key] > 0 && (
                        <div key={key} className="flex items-center gap-1">
                          <span>{diff.icon}</span>
                          <span className="text-yellow-400 font-bold">{bestScores[key]}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Start button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  startGame()
                }}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-bold text-white hover:from-indigo-500 hover:to-purple-500 transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/25 text-lg"
              >
                ▶ Играть
              </button>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {displayState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px]">
            <div className="text-center px-4">
              <div className="text-5xl mb-3">💥</div>
              <h2 className="text-3xl font-bold text-red-400 mb-2">Игра окончена!</h2>
              <div className={`inline-block px-3 py-1 rounded-full ${currentDifficulty.bgColor} ${currentDifficulty.borderColor} border ${currentDifficulty.color} text-sm font-bold mb-4`}>
                {currentDifficulty.icon} {currentDifficulty.nameRu}
              </div>
              
              <div className="flex gap-4 mb-6 justify-center">
                <div className="bg-black/50 rounded-xl px-5 py-3 border border-white/10">
                  <div className="text-gray-400 text-xs">Счёт</div>
                  <div className="text-2xl font-bold text-white">{score}</div>
                </div>
                <div className="bg-black/50 rounded-xl px-5 py-3 border border-yellow-500/30">
                  <div className="text-yellow-400 text-xs">🏆 Рекорд</div>
                  <div className="text-2xl font-bold text-yellow-300">
                    {bestScores[selectedDifficulty] || 0}
                  </div>
                </div>
              </div>

              {score > 0 && score >= (bestScores[selectedDifficulty] || 0) && (
                <div className="text-yellow-400 font-bold mb-4 animate-pulse">
                  🎉 Новый рекорд!
                </div>
              )}

              <div className="flex flex-col gap-2 items-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    startGame()
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-bold text-white hover:from-indigo-500 hover:to-purple-500 transition-all transform hover:scale-105 shadow-lg"
                >
                  🔄 Играть снова
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    gameStateRef.current = 'menu'
                    setDisplayState('menu')
                    resetGame()
                  }}
                  className="px-6 py-2 bg-white/10 border border-white/20 rounded-xl text-gray-300 hover:bg-white/20 transition-all text-sm"
                >
                  ⚙ Сменить сложность
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Score Display */}
      <div className="mt-4 flex gap-6">
        <div className="text-center">
          <div className="text-gray-500 text-xs uppercase tracking-wider">Счёт</div>
          <div className="text-xl font-bold text-white">{score}</div>
        </div>
        <div className="text-center">
          <div className="text-gray-500 text-xs uppercase tracking-wider">Уровень</div>
          <div className={`text-xl font-bold ${currentDifficulty.color}`}>
            {currentDifficulty.icon} {currentDifficulty.nameRu}
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-500 text-xs uppercase tracking-wider">Рекорд</div>
          <div className="text-xl font-bold text-yellow-400">{bestScores[selectedDifficulty] || 0}</div>
        </div>
      </div>

      {/* Controls hint */}
      <div className="mt-4 flex gap-3">
        <kbd className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 text-xs">
          Space
        </kbd>
        <kbd className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 text-xs">
          ↑
        </kbd>
        <kbd className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 text-xs">
          Click / Tap
        </kbd>
      </div>
    </div>
  )
}
