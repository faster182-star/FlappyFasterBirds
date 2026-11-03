import { useEffect, useRef, useState, useCallback } from 'react'

// ===== Game Constants =====
const CANVAS_WIDTH = 400
const CANVAS_HEIGHT = 600
const BIRD_SIZE = 30
const BIRD_X = 80
const GRAVITY = 0.45
const JUMP_FORCE = -7.5
const PIPE_WIDTH = 60
const PIPE_GAP = 155
const PIPE_SPEED = 2.5
const PIPE_SPAWN_INTERVAL = 1800
const GROUND_HEIGHT = 60

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

  const [displayState, setDisplayState] = useState<GameState>('menu')
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem('flappy-best')
    return saved ? parseInt(saved) : 0
  })

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

  // ===== Jump =====
  const jump = useCallback(() => {
    if (gameStateRef.current === 'menu') {
      gameStateRef.current = 'playing'
      setDisplayState('playing')
      resetGame()
      birdRef.current.velocity = JUMP_FORCE
      spawnParticles(BIRD_X, birdRef.current.y, 5, '#fbbf24')
    } else if (gameStateRef.current === 'playing') {
      birdRef.current.velocity = JUMP_FORCE
      spawnParticles(BIRD_X, birdRef.current.y + BIRD_SIZE / 2, 5, '#fbbf24')
    } else if (gameStateRef.current === 'gameover') {
      if (frameRef.current > 30) {
        gameStateRef.current = 'menu'
        setDisplayState('menu')
        resetGame()
      }
    }
  }, [resetGame, spawnParticles])

  // ===== Collision Detection =====
  const checkCollision = useCallback(() => {
    const bird = birdRef.current
    const birdTop = bird.y - BIRD_SIZE / 2
    const birdBottom = bird.y + BIRD_SIZE / 2
    const birdLeft = BIRD_X - BIRD_SIZE / 2
    const birdRight = BIRD_X + BIRD_SIZE / 2

    // Ground / ceiling
    if (birdBottom >= CANVAS_HEIGHT - GROUND_HEIGHT || birdTop <= 0) {
      return true
    }

    // Pipes
    for (const pipe of pipesRef.current) {
      const pipeLeft = pipe.x
      const pipeRight = pipe.x + PIPE_WIDTH
      const gapTop = pipe.topHeight
      const gapBottom = pipe.topHeight + PIPE_GAP

      if (birdRight > pipeLeft + 5 && birdLeft < pipeRight - 5) {
        if (birdTop > gapTop + 5 || birdBottom < gapBottom - 5) {
          if (birdTop < gapTop || birdBottom > gapBottom) {
            return true
          }
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

    // Body
    const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
    bodyGrad.addColorStop(0, '#fde68a')
    bodyGrad.addColorStop(0.6, '#fbbf24')
    bodyGrad.addColorStop(1, '#f59e0b')
    ctx.fillStyle = bodyGrad
    ctx.beginPath()
    ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.3, 0, 0, Math.PI * 2)
    ctx.fill()

    // Wing
    const wingFlap = Math.sin(frameRef.current * 0.3) * 5
    ctx.fillStyle = '#f59e0b'
    ctx.beginPath()
    ctx.ellipse(-3, 2 + wingFlap, 10, 6, -0.3, 0, Math.PI * 2)
    ctx.fill()

    // Eye (white)
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(8, -5, 6, 0, Math.PI * 2)
    ctx.fill()

    // Eye (pupil)
    ctx.fillStyle = '#1e1e1e'
    ctx.beginPath()
    ctx.arc(10, -5, 3, 0, Math.PI * 2)
    ctx.fill()

    // Eye (highlight)
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(11, -6, 1.2, 0, Math.PI * 2)
    ctx.fill()

    // Beak
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
    const gapTop = pipe.topHeight
    const gapBottom = pipe.topHeight + PIPE_GAP

    // Top pipe
    const topGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0)
    topGrad.addColorStop(0, '#16a34a')
    topGrad.addColorStop(0.3, '#22c55e')
    topGrad.addColorStop(0.7, '#22c55e')
    topGrad.addColorStop(1, '#15803d')
    ctx.fillStyle = topGrad
    drawRoundedRect(ctx, pipe.x, 0, PIPE_WIDTH, gapTop, 4)
    ctx.fill()

    // Top pipe cap
    const capGrad = ctx.createLinearGradient(pipe.x - 4, 0, pipe.x + PIPE_WIDTH + 4, 0)
    capGrad.addColorStop(0, '#15803d')
    capGrad.addColorStop(0.3, '#22c55e')
    capGrad.addColorStop(0.7, '#22c55e')
    capGrad.addColorStop(1, '#166534')
    ctx.fillStyle = capGrad
    drawRoundedRect(ctx, pipe.x - 4, gapTop - 26, PIPE_WIDTH + 8, 26, 6)
    ctx.fill()

    // Bottom pipe
    ctx.fillStyle = topGrad
    drawRoundedRect(ctx, pipe.x, gapBottom, PIPE_WIDTH, CANVAS_HEIGHT - gapBottom - GROUND_HEIGHT, 4)
    ctx.fill()

    // Bottom pipe cap
    ctx.fillStyle = capGrad
    drawRoundedRect(ctx, pipe.x - 4, gapBottom, PIPE_WIDTH + 8, 26, 6)
    ctx.fill()

    // Pipe highlights
    ctx.fillStyle = 'rgba(255,255,255,0.1)'
    ctx.fillRect(pipe.x + 8, 0, 6, gapTop - 26)
    ctx.fillRect(pipe.x + 8, gapBottom + 26, 6, CANVAS_HEIGHT - gapBottom - GROUND_HEIGHT - 26)
  }, [])

  // ===== Draw Background =====
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT)
    skyGrad.addColorStop(0, '#0ea5e9')
    skyGrad.addColorStop(0.5, '#38bdf8')
    skyGrad.addColorStop(1, '#7dd3fc')
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT)

    // Clouds
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

    // Distant hills
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

    // Ground body
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, CANVAS_HEIGHT)
    groundGrad.addColorStop(0, '#92400e')
    groundGrad.addColorStop(0.1, '#a16207')
    groundGrad.addColorStop(1, '#78350f')
    ctx.fillStyle = groundGrad
    ctx.fillRect(0, groundY, CANVAS_WIDTH, GROUND_HEIGHT)

    // Grass on top
    const grassGrad = ctx.createLinearGradient(0, groundY, 0, groundY + 15)
    grassGrad.addColorStop(0, '#22c55e')
    grassGrad.addColorStop(1, '#16a34a')
    ctx.fillStyle = grassGrad
    ctx.fillRect(0, groundY, CANVAS_WIDTH, 15)

    // Ground pattern
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

  // ===== Game Loop =====
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const gameLoop = () => {
      frameRef.current++
      const state = gameStateRef.current

      // ===== Update =====
      if (state === 'playing') {
        // Bird physics
        const bird = birdRef.current
        bird.velocity += GRAVITY
        bird.y += bird.velocity
        bird.rotation = lerp(bird.rotation, Math.min(bird.velocity * 4, 70), 0.1)

        // Ground scroll
        groundOffsetRef.current -= PIPE_SPEED

        // Pipe spawning
        const now = Date.now()
        if (now - lastPipeTimeRef.current > PIPE_SPAWN_INTERVAL) {
          const minTop = 60
          const maxTop = CANVAS_HEIGHT - GROUND_HEIGHT - PIPE_GAP - 60
          const topHeight = minTop + Math.random() * (maxTop - minTop)
          pipesRef.current.push({ x: CANVAS_WIDTH, topHeight, passed: false })
          lastPipeTimeRef.current = now
        }

        // Move pipes
        pipesRef.current.forEach((pipe) => {
          pipe.x -= PIPE_SPEED
          if (!pipe.passed && pipe.x + PIPE_WIDTH < BIRD_X) {
            pipe.passed = true
            scoreRef.current++
            setScore(scoreRef.current)
            spawnParticles(BIRD_X, bird.y, 8, '#a78bfa')
          }
        })

        // Remove off-screen pipes
        pipesRef.current = pipesRef.current.filter((p) => p.x > -PIPE_WIDTH - 10)

        // Collision
        if (checkCollision()) {
          gameStateRef.current = 'gameover'
          setDisplayState('gameover')
          flashRef.current = 1
          shakeRef.current.intensity = 10
          spawnParticles(BIRD_X, bird.y, 20, '#ef4444')
          spawnParticles(BIRD_X, bird.y, 10, '#fbbf24')
          frameRef.current = 0

          if (scoreRef.current > bestScore) {
            setBestScore(scoreRef.current)
            localStorage.setItem('flappy-best', String(scoreRef.current))
          }
        }
      } else if (state === 'menu') {
        // Idle bird animation
        const bird = birdRef.current
        bird.y = CANVAS_HEIGHT / 2 + Math.sin(frameRef.current * 0.05) * 15
        bird.rotation = 0
        groundOffsetRef.current -= 1
      } else if (state === 'gameover') {
        // Bird falls
        const bird = birdRef.current
        if (bird.y < CANVAS_HEIGHT - GROUND_HEIGHT - BIRD_SIZE / 2) {
          bird.velocity += GRAVITY
          bird.y += bird.velocity
          bird.rotation = lerp(bird.rotation, 90, 0.1)
        }
      }

      // Update particles
      particlesRef.current.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.05
        p.life -= 1 / p.maxLife
      })
      particlesRef.current = particlesRef.current.filter((p) => p.life > 0)

      // Update shake
      if (shakeRef.current.intensity > 0) {
        shakeRef.current.x = (Math.random() - 0.5) * shakeRef.current.intensity
        shakeRef.current.y = (Math.random() - 0.5) * shakeRef.current.intensity
        shakeRef.current.intensity *= 0.9
        if (shakeRef.current.intensity < 0.5) {
          shakeRef.current = { x: 0, y: 0, intensity: 0 }
        }
      }

      // Update flash
      if (flashRef.current > 0) {
        flashRef.current -= 0.05
      }

      // ===== Render =====
      ctx.save()
      ctx.translate(shakeRef.current.x, shakeRef.current.y)

      drawBackground(ctx)

      // Pipes
      pipesRef.current.forEach((pipe) => drawPipe(ctx, pipe))

      // Ground
      drawGround(ctx)

      // Bird
      drawBird(ctx, birdRef.current)

      // Particles
      drawParticles(ctx)

      // Score
      if (state === 'playing') {
        drawScore(ctx, scoreRef.current)
      }

      // Flash effect
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
  }, [bestScore, checkCollision, drawBackground, drawBird, drawGround, drawParticles, drawPipe, drawScore, spawnParticles])

  // ===== Input Handlers =====
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        jump()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [jump])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900 flex flex-col items-center justify-center p-4 select-none">
      {/* Title */}
      <div className="mb-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 drop-shadow-lg">
          🐦 Flappy Bird
        </h1>
        <p className="text-gray-400 mt-2 text-sm">Нажмите пробел, стрелку вверх или кликните для прыжка</p>
      </div>

      {/* Game Canvas */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-indigo-500/20 border-2 border-indigo-500/30">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="block cursor-pointer"
          onClick={jump}
          onTouchStart={(e) => {
            e.preventDefault()
            jump()
          }}
        />

        {/* Menu Overlay */}
        {displayState === 'menu' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-[2px]">
            <div className="text-center animate-bounce">
              <div className="text-6xl mb-4">🐦</div>
              <h2 className="text-3xl font-bold text-white mb-2">Готовы?</h2>
              <p className="text-gray-200 text-lg mb-6">Нажмите чтобы начать</p>
            </div>
            {bestScore > 0 && (
              <div className="mt-4 px-6 py-3 bg-black/40 rounded-xl border border-yellow-500/30">
                <span className="text-yellow-400 font-bold">🏆 Лучший: {bestScore}</span>
              </div>
            )}
          </div>
        )}

        {/* Game Over Overlay */}
        {displayState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <div className="text-center">
              <div className="text-5xl mb-3">💥</div>
              <h2 className="text-3xl font-bold text-red-400 mb-4">Игра окончена!</h2>
              
              <div className="flex gap-6 mb-6">
                <div className="bg-black/50 rounded-xl px-6 py-4 border border-white/10">
                  <div className="text-gray-400 text-sm">Счёт</div>
                  <div className="text-3xl font-bold text-white">{score}</div>
                </div>
                <div className="bg-black/50 rounded-xl px-6 py-4 border border-yellow-500/30">
                  <div className="text-yellow-400 text-sm">🏆 Лучший</div>
                  <div className="text-3xl font-bold text-yellow-300">{bestScore}</div>
                </div>
              </div>

              {score === bestScore && score > 0 && (
                <div className="text-yellow-400 font-bold mb-4 animate-pulse">
                  🎉 Новый рекорд!
                </div>
              )}

              <p className="text-gray-300 animate-pulse">Нажмите чтобы начать заново</p>
            </div>
          </div>
        )}
      </div>

      {/* Score Display (below canvas) */}
      <div className="mt-6 flex gap-8">
        <div className="text-center">
          <div className="text-gray-500 text-xs uppercase tracking-wider">Счёт</div>
          <div className="text-2xl font-bold text-white">{score}</div>
        </div>
        <div className="text-center">
          <div className="text-gray-500 text-xs uppercase tracking-wider">Рекорд</div>
          <div className="text-2xl font-bold text-yellow-400">{bestScore}</div>
        </div>
      </div>

      {/* Controls hint */}
      <div className="mt-6 flex gap-3">
        <kbd className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 text-xs">
          Space
        </kbd>
        <kbd className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 text-xs">
          ↑
        </kbd>
        <kbd className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 text-xs">
          Click
        </kbd>
      </div>
    </div>
  )
}
