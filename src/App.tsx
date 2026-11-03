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

// ===== Character Types =====
interface Character {
  id: string
  name: string
  emoji: string
  draw: (ctx: CanvasRenderingContext2D, bird: Bird, frame: number) => void
}

// ===== Background Types =====
interface Background {
  id: string
  name: string
  emoji: string
  draw: (ctx: CanvasRenderingContext2D, frame: number) => void
}

// ===== Trail Types =====
interface Trail {
  id: string
  name: string
  emoji: string
  colors: string[]
  type: 'particles' | 'nyan'
}

// ===== 20 Animals =====
const CHARACTERS: Character[] = [
  {
    id: 'owl',
    name: 'Сова',
    emoji: '🦉',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#a16207')
      bodyGrad.addColorStop(0.5, '#92400e')
      bodyGrad.addColorStop(1, '#78350f')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fef3c7'
      ctx.beginPath()
      ctx.ellipse(0, 3, BIRD_SIZE / 3, BIRD_SIZE / 3, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#78350f'
      ctx.beginPath()
      ctx.moveTo(-8, -10)
      ctx.lineTo(-12, -18)
      ctx.lineTo(-5, -12)
      ctx.closePath()
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(8, -10)
      ctx.lineTo(12, -18)
      ctx.lineTo(5, -12)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(-5, -3, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(5, -3, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.arc(-5, -3, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(5, -3, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-5, -3, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(5, -3, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(-4, -4, 1, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(6, -4, 1, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#f59e0b'
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(-2, 3)
      ctx.lineTo(2, 3)
      ctx.closePath()
      ctx.fill()
      const wingFlap = Math.sin(frame * 0.3) * 4
      ctx.fillStyle = '#92400e'
      ctx.beginPath()
      ctx.ellipse(-BIRD_SIZE / 2 + 2, 2 + wingFlap, 5, 8, -0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(BIRD_SIZE / 2 - 2, 2 + wingFlap, 5, 8, 0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'cat',
    name: 'Кот',
    emoji: '🐱',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#fdba74')
      bodyGrad.addColorStop(1, '#ea580c')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ea580c'
      ctx.beginPath()
      ctx.moveTo(-10, -8)
      ctx.lineTo(-14, -16)
      ctx.lineTo(-6, -10)
      ctx.closePath()
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(10, -8)
      ctx.lineTo(14, -16)
      ctx.lineTo(6, -10)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.arc(-5, -3, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(5, -3, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.ellipse(-5, -3, 1.5, 3, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(5, -3, 1.5, 3, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#f472b6'
      ctx.beginPath()
      ctx.moveTo(0, 2)
      ctx.lineTo(-2, 4)
      ctx.lineTo(2, 4)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = '#78350f'
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(-12, 2)
      ctx.lineTo(-6, 3)
      ctx.moveTo(-12, 4)
      ctx.lineTo(-6, 4)
      ctx.moveTo(12, 2)
      ctx.lineTo(6, 3)
      ctx.moveTo(12, 4)
      ctx.lineTo(6, 4)
      ctx.stroke()
      ctx.restore()
    },
  },
  {
    id: 'dog',
    name: 'Собака',
    emoji: '🐶',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#fde68a')
      bodyGrad.addColorStop(1, '#d97706')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#92400e'
      ctx.beginPath()
      ctx.ellipse(-10, -5, 4, 8, -0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(10, -5, 4, 8, 0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(-5, -3, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(5, -3, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-5, -3, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(5, -3, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.ellipse(0, 3, 3, 2.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.ellipse(0, 7, 2, 3, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'rabbit',
    name: 'Кролик',
    emoji: '🐰',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#ffffff')
      bodyGrad.addColorStop(1, '#e5e5e5')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.ellipse(-6, -18, 3, 8, -0.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(6, -18, 3, 8, 0.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fbcfe8'
      ctx.beginPath()
      ctx.ellipse(-6, -18, 1.5, 6, -0.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(6, -18, 1.5, 6, 0.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#f472b6'
      ctx.beginPath()
      ctx.arc(-5, -3, 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(5, -3, 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-5, -3, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(5, -3, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#f472b6'
      ctx.beginPath()
      ctx.ellipse(0, 3, 2, 1.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'fox',
    name: 'Лиса',
    emoji: '🦊',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#fb923c')
      bodyGrad.addColorStop(1, '#ea580c')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ea580c'
      ctx.beginPath()
      ctx.moveTo(-10, -8)
      ctx.lineTo(-14, -16)
      ctx.lineTo(-6, -10)
      ctx.closePath()
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(10, -8)
      ctx.lineTo(14, -16)
      ctx.lineTo(6, -10)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.ellipse(0, 4, 6, 5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.arc(-5, -3, 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(5, -3, 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.ellipse(-5, -3, 1.5, 3, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(5, -3, 1.5, 3, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.ellipse(0, 3, 2, 1.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'bear',
    name: 'Медведь',
    emoji: '🐻',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#a16207')
      bodyGrad.addColorStop(1, '#78350f')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#78350f'
      ctx.beginPath()
      ctx.arc(-10, -10, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(10, -10, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fef3c7'
      ctx.beginPath()
      ctx.ellipse(0, 4, 6, 5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-5, -3, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(5, -3, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(-4, -4, 1, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(6, -4, 1, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.ellipse(0, 4, 2.5, 2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'panda',
    name: 'Панда',
    emoji: '🐼',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#ffffff')
      bodyGrad.addColorStop(1, '#e5e5e5')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.1, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1a1a1a'
      ctx.beginPath()
      ctx.arc(-10, -11, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(10, -11, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1a1a1a'
      ctx.beginPath()
      ctx.ellipse(-6, -3, 6, 7, -0.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(6, -3, 6, 7, 0.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(-6, -3, 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(6, -3, 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-5, -3, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(7, -3, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1a1a1a'
      ctx.beginPath()
      ctx.ellipse(0, 3, 3, 2.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'pig',
    name: 'Свинка',
    emoji: '🐷',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#fbcfe8')
      bodyGrad.addColorStop(1, '#ec4899')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ec4899'
      ctx.beginPath()
      ctx.ellipse(-6, -12, 5, 7, -0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(4, -12, 5, 7, 0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#f472b6'
      ctx.beginPath()
      ctx.ellipse(10, 2, 8, 6, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#be185d'
      ctx.beginPath()
      ctx.ellipse(8, 2, 2, 2.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(13, 2, 2, 2.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(-2, -4, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(6, -4, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1e1e1e'
      ctx.beginPath()
      ctx.arc(-1, -4, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(7, -4, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'bird',
    name: 'Птичка',
    emoji: '🐦',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#fde68a')
      bodyGrad.addColorStop(1, '#f59e0b')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.3, 0, 0, Math.PI * 2)
      ctx.fill()
      const wingFlap = Math.sin(frame * 0.3) * 5
      ctx.fillStyle = '#f59e0b'
      ctx.beginPath()
      ctx.ellipse(-3, 2 + wingFlap, 10, 6, -0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(8, -5, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1e1e1e'
      ctx.beginPath()
      ctx.arc(10, -5, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.moveTo(12, 0)
      ctx.lineTo(20, 2)
      ctx.lineTo(12, 5)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'penguin',
    name: 'Пингвин',
    emoji: '🐧',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      ctx.fillStyle = '#1a1a1a'
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.ellipse(0, 2, BIRD_SIZE / 3, BIRD_SIZE / 2.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(-5, -4, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(5, -4, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-5, -4, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(5, -4, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#f59e0b'
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(-3, 3)
      ctx.lineTo(3, 3)
      ctx.closePath()
      ctx.fill()
      const wingFlap = Math.sin(frame * 0.3) * 3
      ctx.fillStyle = '#1a1a1a'
      ctx.beginPath()
      ctx.ellipse(-BIRD_SIZE / 2 + 3, 0 + wingFlap, 4, 7, -0.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(BIRD_SIZE / 2 - 3, 0 + wingFlap, 4, 7, 0.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'lion',
    name: 'Лев',
    emoji: '🦁',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      ctx.fillStyle = '#d97706'
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2
        const x = Math.cos(angle) * (BIRD_SIZE / 2 + 3)
        const y = Math.sin(angle) * (BIRD_SIZE / 2 + 3)
        ctx.beginPath()
        ctx.ellipse(x, y, 4, 6, angle, 0, Math.PI * 2)
        ctx.fill()
      }
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#fbbf24')
      bodyGrad.addColorStop(1, '#d97706')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-5, -3, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(5, -3, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(-4, -4, 1, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(6, -4, 1, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#78350f'
      ctx.beginPath()
      ctx.ellipse(0, 3, 3, 2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'tiger',
    name: 'Тигр',
    emoji: '🐯',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#fb923c')
      bodyGrad.addColorStop(1, '#ea580c')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ea580c'
      ctx.beginPath()
      ctx.moveTo(-10, -8)
      ctx.lineTo(-14, -16)
      ctx.lineTo(-6, -10)
      ctx.closePath()
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(10, -8)
      ctx.lineTo(14, -16)
      ctx.lineTo(6, -10)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = '#78350f'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(-8, -6)
      ctx.lineTo(-4, -2)
      ctx.moveTo(-10, 0)
      ctx.lineTo(-6, 2)
      ctx.moveTo(8, -6)
      ctx.lineTo(4, -2)
      ctx.moveTo(10, 0)
      ctx.lineTo(6, 2)
      ctx.stroke()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(-5, -3, 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(5, -3, 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-5, -3, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(5, -3, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#78350f'
      ctx.beginPath()
      ctx.ellipse(0, 3, 2.5, 2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'monkey',
    name: 'Обезьяна',
    emoji: '🐵',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#a16207')
      bodyGrad.addColorStop(1, '#78350f')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#78350f'
      ctx.beginPath()
      ctx.arc(-12, -2, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(12, -2, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fef3c7'
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 3, BIRD_SIZE / 3, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-4, -3, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(4, -3, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(-3.5, -3.5, 0.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(4.5, -3.5, 0.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#78350f'
      ctx.beginPath()
      ctx.ellipse(0, 3, 2, 1.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'elephant',
    name: 'Слон',
    emoji: '🐘',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#9ca3af')
      bodyGrad.addColorStop(1, '#6b7280')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#6b7280'
      ctx.beginPath()
      ctx.ellipse(-12, -2, 6, 8, -0.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(12, -2, 6, 8, 0.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#6b7280'
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(0, 2)
      ctx.quadraticCurveTo(2, 8, 0, 12)
      ctx.stroke()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-5, -3, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(5, -3, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(-4.5, -3.5, 0.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(5.5, -3.5, 0.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'giraffe',
    name: 'Жираф',
    emoji: '🦒',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#fbbf24')
      bodyGrad.addColorStop(1, '#d97706')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#92400e'
      for (let i = 0; i < 5; i++) {
        const x = (Math.random() - 0.5) * BIRD_SIZE * 0.6
        const y = (Math.random() - 0.5) * BIRD_SIZE * 0.6
        ctx.beginPath()
        ctx.arc(x, y, 2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.fillStyle = '#d97706'
      ctx.beginPath()
      ctx.moveTo(-4, -12)
      ctx.lineTo(-5, -16)
      ctx.lineTo(-3, -16)
      ctx.closePath()
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(4, -12)
      ctx.lineTo(5, -16)
      ctx.lineTo(3, -16)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-4, -3, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(4, -3, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(-3.5, -3.5, 0.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(4.5, -3.5, 0.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'zebra',
    name: 'Зебра',
    emoji: '🦓',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#1a1a1a'
      ctx.lineWidth = 2
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath()
        ctx.moveTo(i * 4, -BIRD_SIZE / 2)
        ctx.lineTo(i * 4, BIRD_SIZE / 2)
        ctx.stroke()
      }
      ctx.fillStyle = '#1a1a1a'
      ctx.beginPath()
      ctx.moveTo(-8, -10)
      ctx.lineTo(-10, -16)
      ctx.lineTo(-6, -12)
      ctx.closePath()
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(8, -10)
      ctx.lineTo(10, -16)
      ctx.lineTo(6, -12)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-5, -3, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(5, -3, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(-4.5, -3.5, 0.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(5.5, -3.5, 0.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'kangaroo',
    name: 'Кенгуру',
    emoji: '🦘',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#d97706')
      bodyGrad.addColorStop(1, '#92400e')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fef3c7'
      ctx.beginPath()
      ctx.ellipse(0, 4, BIRD_SIZE / 3, BIRD_SIZE / 3, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#92400e'
      ctx.beginPath()
      ctx.ellipse(-6, -12, 3, 6, -0.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(6, -12, 3, 6, 0.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-4, -3, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(4, -3, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(-3.5, -3.5, 0.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(4.5, -3.5, 0.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#78350f'
      ctx.beginPath()
      ctx.ellipse(0, 3, 2, 1.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'koala',
    name: 'Коала',
    emoji: '🐨',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#9ca3af')
      bodyGrad.addColorStop(1, '#6b7280')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#6b7280'
      ctx.beginPath()
      ctx.arc(-11, -8, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(11, -8, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#d1d5db'
      ctx.beginPath()
      ctx.arc(-11, -8, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(11, -8, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1a1a1a'
      ctx.beginPath()
      ctx.ellipse(0, 2, 4, 3, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-5, -3, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(5, -3, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(-4.5, -3.5, 0.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(5.5, -3.5, 0.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'hedgehog',
    name: 'Ёжик',
    emoji: '🦔',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      ctx.fillStyle = '#78350f'
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2
        const x = Math.cos(angle) * (BIRD_SIZE / 2 + 2)
        const y = Math.sin(angle) * (BIRD_SIZE / 2 + 2)
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + Math.cos(angle) * 4, y + Math.sin(angle) * 4)
        ctx.lineTo(x + Math.cos(angle + 0.3) * 2, y + Math.sin(angle + 0.3) * 2)
        ctx.closePath()
        ctx.fill()
      }
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#d97706')
      bodyGrad.addColorStop(1, '#92400e')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fef3c7'
      ctx.beginPath()
      ctx.ellipse(0, 4, BIRD_SIZE / 3, BIRD_SIZE / 3, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-4, -3, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(4, -3, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(-3.5, -3.5, 0.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(4.5, -3.5, 0.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1a1a1a'
      ctx.beginPath()
      ctx.ellipse(0, 3, 2, 1.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'mouse',
    name: 'Мышка',
    emoji: '🐭',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#d1d5db')
      bodyGrad.addColorStop(1, '#9ca3af')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#9ca3af'
      ctx.beginPath()
      ctx.arc(-10, -10, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(10, -10, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fbcfe8'
      ctx.beginPath()
      ctx.arc(-10, -10, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(10, -10, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-4, -3, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(4, -3, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(-3.5, -3.5, 0.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(4.5, -3.5, 0.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#f472b6'
      ctx.beginPath()
      ctx.ellipse(0, 3, 2, 1.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#6b7280'
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(-10, 2)
      ctx.lineTo(-5, 3)
      ctx.moveTo(-10, 4)
      ctx.lineTo(-5, 4)
      ctx.moveTo(10, 2)
      ctx.lineTo(5, 3)
      ctx.moveTo(10, 4)
      ctx.lineTo(5, 4)
      ctx.stroke()
      ctx.restore()
    },
  },
  // ===== 30 New Animals with Realistic Graphics =====
  {
    id: 'dragon',
    name: 'Дракон',
    emoji: '🐉',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#dc2626')
      bodyGrad.addColorStop(0.5, '#b91c1c')
      bodyGrad.addColorStop(1, '#7f1d1d')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.ellipse(0, 4, BIRD_SIZE / 3, BIRD_SIZE / 3, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#7f1d1d'
      ctx.beginPath()
      ctx.moveTo(-8, -10)
      ctx.lineTo(-14, -18)
      ctx.lineTo(-5, -12)
      ctx.closePath()
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(8, -10)
      ctx.lineTo(14, -18)
      ctx.lineTo(5, -12)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.arc(-5, -3, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(5, -3, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.ellipse(-5, -3, 1.5, 3, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(5, -3, 1.5, 3, 0, 0, Math.PI * 2)
      ctx.fill()
      const wingFlap = Math.sin(frame * 0.3) * 5
      ctx.fillStyle = '#991b1b'
      ctx.beginPath()
      ctx.ellipse(-BIRD_SIZE / 2 + 2, 0 + wingFlap, 6, 10, -0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(BIRD_SIZE / 2 - 2, 0 + wingFlap, 6, 10, 0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'unicorn',
    name: 'Единорог',
    emoji: '🦄',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#ffffff')
      bodyGrad.addColorStop(1, '#e0e7ff')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.moveTo(0, -12)
      ctx.lineTo(-2, -20)
      ctx.lineTo(2, -20)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#c084fc'
      ctx.beginPath()
      ctx.ellipse(-8, -8, 4, 6, -0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(8, -8, 4, 6, 0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-5, -3, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(5, -3, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(-4.5, -3.5, 0.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(5.5, -3.5, 0.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'phoenix',
    name: 'Феникс',
    emoji: '🔥',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#fbbf24')
      bodyGrad.addColorStop(0.5, '#f97316')
      bodyGrad.addColorStop(1, '#dc2626')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.moveTo(-6, -10)
      ctx.lineTo(-10, -18)
      ctx.lineTo(-3, -12)
      ctx.closePath()
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(6, -10)
      ctx.lineTo(10, -18)
      ctx.lineTo(3, -12)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-5, -3, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(5, -3, 2.5, 0, Math.PI * 2)
      ctx.fill()
      const wingFlap = Math.sin(frame * 0.4) * 6
      ctx.fillStyle = '#dc2626'
      ctx.beginPath()
      ctx.ellipse(-BIRD_SIZE / 2 + 2, 0 + wingFlap, 7, 11, -0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(BIRD_SIZE / 2 - 2, 0 + wingFlap, 7, 11, 0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'whale',
    name: 'Кит',
    emoji: '🐋',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#3b82f6')
      bodyGrad.addColorStop(1, '#1e40af')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 1.8, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#bfdbfe'
      ctx.beginPath()
      ctx.ellipse(0, 4, BIRD_SIZE / 3, BIRD_SIZE / 4, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-8, -2, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(8, -2, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(-7.5, -2.5, 0.6, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(8.5, -2.5, 0.6, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'dolphin',
    name: 'Дельфин',
    emoji: '🐬',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#60a5fa')
      bodyGrad.addColorStop(1, '#2563eb')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 1.8, BIRD_SIZE / 2.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#bfdbfe'
      ctx.beginPath()
      ctx.ellipse(0, 3, BIRD_SIZE / 3, BIRD_SIZE / 4, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1e40af'
      ctx.beginPath()
      ctx.moveTo(0, -10)
      ctx.lineTo(-3, -16)
      ctx.lineTo(3, -16)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-6, -2, 1.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(6, -2, 1.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'shark',
    name: 'Акула',
    emoji: '🦈',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#6b7280')
      bodyGrad.addColorStop(1, '#374151')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 1.8, BIRD_SIZE / 2.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#d1d5db'
      ctx.beginPath()
      ctx.ellipse(0, 4, BIRD_SIZE / 3, BIRD_SIZE / 4, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#374151'
      ctx.beginPath()
      ctx.moveTo(0, -10)
      ctx.lineTo(-4, -18)
      ctx.lineTo(4, -18)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-6, -2, 1.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(6, -2, 1.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'octopus',
    name: 'Осьминог',
    emoji: '🐙',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#c084fc')
      bodyGrad.addColorStop(1, '#7c3aed')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#7c3aed'
      ctx.lineWidth = 2
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI + Math.PI / 2
        const x = Math.cos(angle) * (BIRD_SIZE / 2 - 2)
        const y = Math.sin(angle) * (BIRD_SIZE / 2 - 2)
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.quadraticCurveTo(x + Math.cos(angle) * 5, y + Math.sin(angle) * 8, x + Math.cos(angle) * 3, y + Math.sin(angle) * 12)
        ctx.stroke()
      }
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(-5, -3, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(5, -3, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-5, -3, 1.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(5, -3, 1.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'turtle',
    name: 'Черепаха',
    emoji: '🐢',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#22c55e')
      bodyGrad.addColorStop(1, '#15803d')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#166534'
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2
        const x = Math.cos(angle) * (BIRD_SIZE / 3)
        const y = Math.sin(angle) * (BIRD_SIZE / 3)
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.fillStyle = '#86efac'
      ctx.beginPath()
      ctx.ellipse(8, 0, 4, 3, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(9, -1, 1, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'frog',
    name: 'Лягушка',
    emoji: '🐸',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#4ade80')
      bodyGrad.addColorStop(1, '#16a34a')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(-6, -6, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(6, -6, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-6, -6, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(6, -6, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#15803d'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(0, 4, 4, 0, Math.PI)
      ctx.stroke()
      ctx.restore()
    },
  },
  {
    id: 'snake',
    name: 'Змея',
    emoji: '🐍',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#84cc16')
      bodyGrad.addColorStop(1, '#4d7c0f')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#365314'
      for (let i = 0; i < 5; i++) {
        const x = (i - 2) * 4
        ctx.beginPath()
        ctx.arc(x, 0, 2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.arc(-4, -3, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(4, -3, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.ellipse(-4, -3, 1, 2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(4, -3, 1, 2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'crab',
    name: 'Краб',
    emoji: '🦀',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#ef4444')
      bodyGrad.addColorStop(1, '#b91c1c')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#b91c1c'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(-BIRD_SIZE / 2, 0)
      ctx.lineTo(-BIRD_SIZE / 2 - 6, -4)
      ctx.lineTo(-BIRD_SIZE / 2 - 4, -8)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(BIRD_SIZE / 2, 0)
      ctx.lineTo(BIRD_SIZE / 2 + 6, -4)
      ctx.lineTo(BIRD_SIZE / 2 + 4, -8)
      ctx.stroke()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-4, -2, 1.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(4, -2, 1.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'butterfly',
    name: 'Бабочка',
    emoji: '🦋',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#1e293b')
      bodyGrad.addColorStop(1, '#0f172a')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, 2, BIRD_SIZE / 2.5, 0, 0, Math.PI * 2)
      ctx.fill()
      const wingFlap = Math.sin(frame * 0.4) * 0.3
      ctx.fillStyle = '#8b5cf6'
      ctx.save()
      ctx.rotate(wingFlap)
      ctx.beginPath()
      ctx.ellipse(-8, -2, 8, 10, -0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      ctx.save()
      ctx.rotate(-wingFlap)
      ctx.beginPath()
      ctx.ellipse(8, -2, 8, 10, 0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      ctx.fillStyle = '#c084fc'
      ctx.beginPath()
      ctx.arc(-8, -2, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(8, -2, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'bee',
    name: 'Пчела',
    emoji: '🐝',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#fbbf24')
      bodyGrad.addColorStop(1, '#d97706')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1e293b'
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(-BIRD_SIZE / 2, -2 + i * 4, BIRD_SIZE, 2)
      }
      const wingFlap = Math.sin(frame * 0.5) * 4
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
      ctx.beginPath()
      ctx.ellipse(-4, -6 + wingFlap, 5, 8, -0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(4, -6 + wingFlap, 5, 8, 0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-4, -2, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(4, -2, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'ladybug',
    name: 'Божья коровка',
    emoji: '🐞',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#ef4444')
      bodyGrad.addColorStop(1, '#b91c1c')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1e293b'
      ctx.beginPath()
      ctx.ellipse(0, -BIRD_SIZE / 2.5, BIRD_SIZE / 4, BIRD_SIZE / 5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillRect(-1, -BIRD_SIZE / 2.2, 2, BIRD_SIZE)
      ctx.beginPath()
      ctx.arc(-5, 2, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(5, 2, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(-4, 6, 1.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(4, 6, 1.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(-3, -BIRD_SIZE / 2.5, 1.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(3, -BIRD_SIZE / 2.5, 1.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'snail',
    name: 'Улитка',
    emoji: '🐌',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#a78bfa')
      bodyGrad.addColorStop(1, '#6d28d9')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 2, BIRD_SIZE / 2, BIRD_SIZE / 3, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#4c1d95'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(2, 0, 6, 0, Math.PI * 1.5)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(2, 0, 4, 0, Math.PI * 1.5)
      ctx.stroke()
      ctx.fillStyle = '#c4b5fd'
      ctx.beginPath()
      ctx.ellipse(6, -4, 3, 4, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(7, -5, 1, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'ant',
    name: 'Муравей',
    emoji: '🐜',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      ctx.fillStyle = '#78350f'
      ctx.beginPath()
      ctx.ellipse(0, -4, 4, 5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(0, 2, 5, 6, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(0, 8, 4, 5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#78350f'
      ctx.lineWidth = 1
      for (let i = 0; i < 3; i++) {
        ctx.beginPath()
        ctx.moveTo(-4, 0 + i * 4)
        ctx.lineTo(-10, 2 + i * 4)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(4, 0 + i * 4)
        ctx.lineTo(10, 2 + i * 4)
        ctx.stroke()
      }
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-2, -5, 1, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(2, -5, 1, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'spider',
    name: 'Паук',
    emoji: '🕷️',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      ctx.fillStyle = '#1e293b'
      ctx.beginPath()
      ctx.ellipse(0, 0, 6, 8, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(0, -6, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#1e293b'
      ctx.lineWidth = 1.5
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI - Math.PI / 2
        ctx.beginPath()
        ctx.moveTo(Math.cos(angle) * 6, Math.sin(angle) * 8)
        ctx.lineTo(Math.cos(angle) * 14, Math.sin(angle) * 16)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(-Math.cos(angle) * 6, Math.sin(angle) * 8)
        ctx.lineTo(-Math.cos(angle) * 14, Math.sin(angle) * 16)
        ctx.stroke()
      }
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.arc(-2, -7, 1, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(2, -7, 1, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'scorpion',
    name: 'Скорпион',
    emoji: '🦂',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      ctx.fillStyle = '#92400e'
      ctx.beginPath()
      ctx.ellipse(0, 0, 8, 5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(0, -4, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#92400e'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, 5)
      ctx.quadraticCurveTo(8, 10, 6, 15)
      ctx.quadraticCurveTo(4, 18, 0, 16)
      ctx.stroke()
      ctx.fillStyle = '#78350f'
      for (let i = 0; i < 4; i++) {
        ctx.beginPath()
        ctx.moveTo(-6, -2 + i * 2)
        ctx.lineTo(-12, 0 + i * 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(6, -2 + i * 2)
        ctx.lineTo(12, 0 + i * 2)
        ctx.stroke()
      }
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-2, -5, 1, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(2, -5, 1, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'bat',
    name: 'Летучая мышь',
    emoji: '🦇',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      ctx.fillStyle = '#1e293b'
      ctx.beginPath()
      ctx.ellipse(0, 0, 5, 7, 0, 0, Math.PI * 2)
      ctx.fill()
      const wingFlap = Math.sin(frame * 0.4) * 5
      ctx.beginPath()
      ctx.moveTo(-5, 0)
      ctx.quadraticCurveTo(-12, -5 + wingFlap, -15, 0 + wingFlap)
      ctx.quadraticCurveTo(-12, 5 + wingFlap, -5, 3)
      ctx.closePath()
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(5, 0)
      ctx.quadraticCurveTo(12, -5 + wingFlap, 15, 0 + wingFlap)
      ctx.quadraticCurveTo(12, 5 + wingFlap, 5, 3)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.arc(-2, -2, 1.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(2, -2, 1.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'hamster',
    name: 'Хомяк',
    emoji: '🐹',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#fbbf24')
      bodyGrad.addColorStop(1, '#d97706')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fef3c7'
      ctx.beginPath()
      ctx.ellipse(0, 4, BIRD_SIZE / 3, BIRD_SIZE / 3, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#d97706'
      ctx.beginPath()
      ctx.arc(-10, -8, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(10, -8, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#f472b6'
      ctx.beginPath()
      ctx.arc(-10, -8, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(10, -8, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-5, -3, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(5, -3, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#f472b6'
      ctx.beginPath()
      ctx.ellipse(0, 3, 2, 1.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'chipmunk',
    name: 'Бурундук',
    emoji: '🐿️',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#d97706')
      bodyGrad.addColorStop(1, '#92400e')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fef3c7'
      ctx.fillRect(-1, -BIRD_SIZE / 2, 2, BIRD_SIZE)
      ctx.fillStyle = '#78350f'
      ctx.beginPath()
      ctx.arc(-10, -8, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(10, -8, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-5, -3, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(5, -3, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#78350f'
      ctx.beginPath()
      ctx.ellipse(0, 3, 2, 1.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'raccoon',
    name: 'Енот',
    emoji: '🦝',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#9ca3af')
      bodyGrad.addColorStop(1, '#6b7280')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1e293b'
      ctx.beginPath()
      ctx.ellipse(-6, -3, 5, 4, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(6, -3, 5, 4, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#6b7280'
      ctx.beginPath()
      ctx.arc(-10, -10, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(10, -10, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(-6, -3, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(6, -3, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-6, -3, 1, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(6, -3, 1, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'sloth',
    name: 'Ленивец',
    emoji: '🦥',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#a16207')
      bodyGrad.addColorStop(1, '#78350f')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fef3c7'
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 3, BIRD_SIZE / 3, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#78350f'
      ctx.beginPath()
      ctx.ellipse(-6, -3, 4, 3, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(6, -3, 4, 3, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-6, -3, 1.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(6, -3, 1.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'armadillo',
    name: 'Броненосец',
    emoji: '🦔',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#9ca3af')
      bodyGrad.addColorStop(1, '#6b7280')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#4b5563'
      ctx.lineWidth = 1
      for (let i = 0; i < 5; i++) {
        ctx.beginPath()
        ctx.arc(0, 0, BIRD_SIZE / 2 - i * 2, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.fillStyle = '#fef3c7'
      ctx.beginPath()
      ctx.ellipse(8, 0, 4, 3, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(9, -1, 1, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'hedgehog2',
    name: 'Ёжик 2',
    emoji: '🦔',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      ctx.fillStyle = '#78350f'
      for (let i = 0; i < 15; i++) {
        const angle = (i / 15) * Math.PI * 2
        const x = Math.cos(angle) * (BIRD_SIZE / 2 + 3)
        const y = Math.sin(angle) * (BIRD_SIZE / 2 + 3)
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + Math.cos(angle) * 5, y + Math.sin(angle) * 5)
        ctx.lineTo(x + Math.cos(angle + 0.2) * 3, y + Math.sin(angle + 0.2) * 3)
        ctx.closePath()
        ctx.fill()
      }
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#d97706')
      bodyGrad.addColorStop(1, '#92400e')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fef3c7'
      ctx.beginPath()
      ctx.ellipse(0, 4, BIRD_SIZE / 3, BIRD_SIZE / 3, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-4, -3, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(4, -3, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'platypus',
    name: 'Утконос',
    emoji: '🦆',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#92400e')
      bodyGrad.addColorStop(1, '#78350f')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#d97706'
      ctx.beginPath()
      ctx.ellipse(10, 2, 6, 3, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-4, -3, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(4, -3, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'flamingo',
    name: 'Фламинго',
    emoji: '🦩',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#f9a8d4')
      bodyGrad.addColorStop(1, '#ec4899')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ec4899'
      ctx.beginPath()
      ctx.ellipse(8, -2, 5, 3, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1e293b'
      ctx.beginPath()
      ctx.moveTo(12, -2)
      ctx.lineTo(14, -1)
      ctx.lineTo(12, 0)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-4, -3, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'peacock',
    name: 'Павлин',
    emoji: '🦚',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#06b6d4')
      bodyGrad.addColorStop(1, '#0891b2')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#10b981'
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI - Math.PI / 2
        const x = Math.cos(angle) * (BIRD_SIZE / 2 - 2)
        const y = Math.sin(angle) * (BIRD_SIZE / 2 - 2)
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-4, -3, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(4, -3, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'swan',
    name: 'Лебедь',
    emoji: '🦢',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#ffffff')
      bodyGrad.addColorStop(1, '#e5e5e5')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#f97316'
      ctx.beginPath()
      ctx.ellipse(10, 0, 5, 2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-4, -3, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'eagle',
    name: 'Орёл',
    emoji: '🦅',
    draw: (ctx, bird, frame) => {
      ctx.save()
      ctx.translate(BIRD_X, bird.y)
      ctx.rotate((bird.rotation * Math.PI) / 180)
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2)
      bodyGrad.addColorStop(0, '#78350f')
      bodyGrad.addColorStop(1, '#451a03')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.moveTo(10, 0)
      ctx.lineTo(15, 2)
      ctx.lineTo(10, 4)
      ctx.closePath()
      ctx.fill()
      const wingFlap = Math.sin(frame * 0.3) * 5
      ctx.fillStyle = '#451a03'
      ctx.beginPath()
      ctx.ellipse(-BIRD_SIZE / 2 + 2, 0 + wingFlap, 6, 10, -0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(BIRD_SIZE / 2 - 2, 0 + wingFlap, 6, 10, 0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-4, -3, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(4, -3, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
  },
]

// ===== 20 Backgrounds =====
const BACKGROUNDS: Background[] = [
  {
    id: 'sky',
    name: 'Небо',
    emoji: '☀️',
    draw: (ctx, frame) => {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT)
      skyGrad.addColorStop(0, '#0ea5e9')
      skyGrad.addColorStop(0.5, '#38bdf8')
      skyGrad.addColorStop(1, '#7dd3fc')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
      const cloudOffset = (frame * 0.3) % (CANVAS_WIDTH + 200)
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
    },
  },
  {
    id: 'sunset',
    name: 'Закат',
    emoji: '🌅',
    draw: (ctx, frame) => {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT)
      skyGrad.addColorStop(0, '#7c2d12')
      skyGrad.addColorStop(0.3, '#ea580c')
      skyGrad.addColorStop(0.6, '#f97316')
      skyGrad.addColorStop(1, '#fbbf24')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT)
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.arc(CANVAS_WIDTH / 2, CANVAS_HEIGHT - GROUND_HEIGHT - 50, 40, 0, Math.PI * 2)
      ctx.fill()
    },
  },
  {
    id: 'night',
    name: 'Ночь',
    emoji: '🌙',
    draw: (ctx, frame) => {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT)
      skyGrad.addColorStop(0, '#0f172a')
      skyGrad.addColorStop(1, '#1e293b')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT)
      ctx.fillStyle = '#ffffff'
      for (let i = 0; i < 50; i++) {
        const x = (i * 37) % CANVAS_WIDTH
        const y = (i * 23) % (CANVAS_HEIGHT - GROUND_HEIGHT - 50)
        const size = (i % 3) + 1
        ctx.globalAlpha = 0.5 + Math.sin(frame * 0.02 + i) * 0.3
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      ctx.fillStyle = '#fef3c7'
      ctx.beginPath()
      ctx.arc(320, 80, 30, 0, Math.PI * 2)
      ctx.fill()
    },
  },
  {
    id: 'forest',
    name: 'Лес',
    emoji: '🌲',
    draw: (ctx, frame) => {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT)
      skyGrad.addColorStop(0, '#064e3b')
      skyGrad.addColorStop(1, '#065f46')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT)
      ctx.fillStyle = '#047857'
      for (let i = 0; i < 8; i++) {
        const x = i * 60
        ctx.beginPath()
        ctx.moveTo(x, CANVAS_HEIGHT - GROUND_HEIGHT)
        ctx.lineTo(x + 30, CANVAS_HEIGHT - GROUND_HEIGHT - 100)
        ctx.lineTo(x + 60, CANVAS_HEIGHT - GROUND_HEIGHT)
        ctx.closePath()
        ctx.fill()
      }
    },
  },
  {
    id: 'ocean',
    name: 'Океан',
    emoji: '🌊',
    draw: (ctx, frame) => {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT)
      skyGrad.addColorStop(0, '#0c4a6e')
      skyGrad.addColorStop(1, '#0369a1')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 2
      for (let i = 0; i < 5; i++) {
        const y = 100 + i * 80
        ctx.beginPath()
        for (let x = 0; x < CANVAS_WIDTH; x += 10) {
          const wave = Math.sin((x + frame * 2) * 0.02 + i) * 10
          if (x === 0) ctx.moveTo(x, y + wave)
          else ctx.lineTo(x, y + wave)
        }
        ctx.stroke()
      }
    },
  },
  {
    id: 'space',
    name: 'Космос',
    emoji: '🚀',
    draw: (ctx, frame) => {
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT)
      ctx.fillStyle = '#ffffff'
      for (let i = 0; i < 100; i++) {
        const x = (i * 41) % CANVAS_WIDTH
        const y = (i * 29) % (CANVAS_HEIGHT - GROUND_HEIGHT)
        const size = (i % 2) + 0.5
        ctx.globalAlpha = 0.5 + Math.sin(frame * 0.05 + i) * 0.5
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    },
  },
  {
    id: 'desert',
    name: 'Пустыня',
    emoji: '🏜️',
    draw: (ctx, frame) => {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT)
      skyGrad.addColorStop(0, '#fef3c7')
      skyGrad.addColorStop(1, '#fbbf24')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT)
      ctx.fillStyle = '#f59e0b'
      ctx.beginPath()
      ctx.arc(CANVAS_WIDTH - 80, 100, 50, 0, Math.PI * 2)
      ctx.fill()
    },
  },
  {
    id: 'snow',
    name: 'Снег',
    emoji: '❄️',
    draw: (ctx, frame) => {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT)
      skyGrad.addColorStop(0, '#e0f2fe')
      skyGrad.addColorStop(1, '#bae6fd')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT)
      ctx.fillStyle = '#ffffff'
      for (let i = 0; i < 30; i++) {
        const x = (i * 31 + frame) % CANVAS_WIDTH
        const y = (i * 23 + frame * 2) % (CANVAS_HEIGHT - GROUND_HEIGHT)
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    },
  },
  {
    id: 'candy',
    name: 'Конфеты',
    emoji: '🍭',
    draw: (ctx, frame) => {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT)
      skyGrad.addColorStop(0, '#fbcfe8')
      skyGrad.addColorStop(0.5, '#f9a8d4')
      skyGrad.addColorStop(1, '#f472b6')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT)
    },
  },
  {
    id: 'rainbow',
    name: 'Радуга',
    emoji: '🌈',
    draw: (ctx, frame) => {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT)
      skyGrad.addColorStop(0, '#ef4444')
      skyGrad.addColorStop(0.17, '#f97316')
      skyGrad.addColorStop(0.33, '#eab308')
      skyGrad.addColorStop(0.5, '#22c55e')
      skyGrad.addColorStop(0.67, '#3b82f6')
      skyGrad.addColorStop(0.83, '#8b5cf6')
      skyGrad.addColorStop(1, '#ec4899')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT)
    },
  },
  {
    id: 'volcano',
    name: 'Вулкан',
    emoji: '🌋',
    draw: (ctx, frame) => {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT)
      skyGrad.addColorStop(0, '#1c1917')
      skyGrad.addColorStop(0.5, '#7c2d12')
      skyGrad.addColorStop(1, '#dc2626')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT)
      ctx.fillStyle = '#f97316'
      ctx.beginPath()
      ctx.arc(CANVAS_WIDTH / 2, 50, 30 + Math.sin(frame * 0.1) * 5, 0, Math.PI * 2)
      ctx.fill()
    },
  },
  {
    id: 'underwater',
    name: 'Под водой',
    emoji: '🐠',
    draw: (ctx, frame) => {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT)
      skyGrad.addColorStop(0, '#0e7490')
      skyGrad.addColorStop(1, '#155e75')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
      for (let i = 0; i < 15; i++) {
        const x = (i * 47) % CANVAS_WIDTH
        const y = ((i * 31 + frame) % (CANVAS_HEIGHT - GROUND_HEIGHT))
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fill()
      }
    },
  },
  {
    id: 'autumn',
    name: 'Осень',
    emoji: '🍂',
    draw: (ctx, frame) => {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT)
      skyGrad.addColorStop(0, '#92400e')
      skyGrad.addColorStop(0.5, '#b45309')
      skyGrad.addColorStop(1, '#d97706')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT)
      ctx.fillStyle = '#dc2626'
      for (let i = 0; i < 10; i++) {
        const x = (i * 43 + frame) % CANVAS_WIDTH
        const y = (i * 29 + frame * 1.5) % (CANVAS_HEIGHT - GROUND_HEIGHT)
        ctx.beginPath()
        ctx.ellipse(x, y, 5, 8, Math.PI / 4, 0, Math.PI * 2)
        ctx.fill()
      }
    },
  },
  {
    id: 'spring',
    name: 'Весна',
    emoji: '🌸',
    draw: (ctx, frame) => {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT)
      skyGrad.addColorStop(0, '#fce7f3')
      skyGrad.addColorStop(1, '#fbcfe8')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT)
      ctx.fillStyle = '#f9a8d4'
      for (let i = 0; i < 20; i++) {
        const x = (i * 37 + frame * 0.5) % CANVAS_WIDTH
        const y = (i * 23 + frame) % (CANVAS_HEIGHT - GROUND_HEIGHT)
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fill()
      }
    },
  },
  {
    id: 'summer',
    name: 'Лето',
    emoji: '☀️',
    draw: (ctx, frame) => {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT)
      skyGrad.addColorStop(0, '#06b6d4')
      skyGrad.addColorStop(1, '#0891b2')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT)
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.arc(80, 80, 40, 0, Math.PI * 2)
      ctx.fill()
    },
  },
  {
    id: 'winter',
    name: 'Зима',
    emoji: '⛄',
    draw: (ctx, frame) => {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT)
      skyGrad.addColorStop(0, '#cbd5e1')
      skyGrad.addColorStop(1, '#94a3b8')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT)
      ctx.fillStyle = '#ffffff'
      for (let i = 0; i < 40; i++) {
        const x = (i * 29 + frame * 0.8) % CANVAS_WIDTH
        const y = (i * 19 + frame * 1.2) % (CANVAS_HEIGHT - GROUND_HEIGHT)
        ctx.beginPath()
        ctx.arc(x, y, 2, 0, Math.PI * 2)
        ctx.fill()
      }
    },
  },
  {
    id: 'galaxy',
    name: 'Галактика',
    emoji: '🌌',
    draw: (ctx, frame) => {
      const skyGrad = ctx.createRadialGradient(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 50, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 400)
      skyGrad.addColorStop(0, '#7c3aed')
      skyGrad.addColorStop(0.5, '#4c1d95')
      skyGrad.addColorStop(1, '#1e1b4b')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT)
      ctx.fillStyle = '#ffffff'
      for (let i = 0; i < 80; i++) {
        const x = (i * 43) % CANVAS_WIDTH
        const y = (i * 31) % (CANVAS_HEIGHT - GROUND_HEIGHT)
        ctx.globalAlpha = 0.3 + Math.sin(frame * 0.03 + i) * 0.3
        ctx.beginPath()
        ctx.arc(x, y, 1, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    },
  },
  {
    id: 'city',
    name: 'Город',
    emoji: '🏙️',
    draw: (ctx, frame) => {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT)
      skyGrad.addColorStop(0, '#334155')
      skyGrad.addColorStop(1, '#475569')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT)
      ctx.fillStyle = '#1e293b'
      for (let i = 0; i < 10; i++) {
        const x = i * 45
        const height = 100 + (i % 3) * 50
        ctx.fillRect(x, CANVAS_HEIGHT - GROUND_HEIGHT - height, 40, height)
      }
    },
  },
  {
    id: 'jungle',
    name: 'Джунгли',
    emoji: '🌴',
    draw: (ctx, frame) => {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT)
      skyGrad.addColorStop(0, '#14532d')
      skyGrad.addColorStop(1, '#166534')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT)
      ctx.fillStyle = '#15803d'
      for (let i = 0; i < 12; i++) {
        const x = i * 40
        ctx.beginPath()
        ctx.ellipse(x, CANVAS_HEIGHT - GROUND_HEIGHT - 50, 30, 80, 0, 0, Math.PI * 2)
        ctx.fill()
      }
    },
  },
  {
    id: 'aurora',
    name: 'Северное сияние',
    emoji: '✨',
    draw: (ctx, frame) => {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT)
      skyGrad.addColorStop(0, '#0f172a')
      skyGrad.addColorStop(0.5, '#064e3b')
      skyGrad.addColorStop(1, '#0f172a')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT)
      ctx.fillStyle = '#10b981'
      ctx.globalAlpha = 0.3 + Math.sin(frame * 0.02) * 0.2
      ctx.fillRect(0, 100, CANVAS_WIDTH, 150)
      ctx.globalAlpha = 1
    },
  },
]

// ===== 11 Trail Types =====
const TRAILS: Trail[] = [
  {
    id: 'nyan',
    name: 'Nyan Cat',
    emoji: '🌈',
    colors: ['#ff0000', '#ff9900', '#ffff00', '#33ff00', '#0099ff', '#6633ff'],
    type: 'nyan',
  },
  {
    id: 'rainbow',
    name: 'Радуга',
    emoji: '🌈',
    colors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7'],
    type: 'particles',
  },
  {
    id: 'fire',
    name: 'Огонь',
    emoji: '🔥',
    colors: ['#fbbf24', '#f97316', '#ef4444', '#dc2626', '#991b1b'],
    type: 'particles',
  },
  {
    id: 'ice',
    name: 'Лёд',
    emoji: '❄️',
    colors: ['#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9'],
    type: 'particles',
  },
  {
    id: 'gold',
    name: 'Золото',
    emoji: '✨',
    colors: ['#fef3c7', '#fde68a', '#fbbf24', '#f59e0b', '#d97706'],
    type: 'particles',
  },
  {
    id: 'neon',
    name: 'Неон',
    emoji: '💫',
    colors: ['#f0abfc', '#e879f9', '#d946ef', '#c026d3', '#a21caf'],
    type: 'particles',
  },
  {
    id: 'forest',
    name: 'Лес',
    emoji: '🌿',
    colors: ['#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e'],
    type: 'particles',
  },
  {
    id: 'ocean',
    name: 'Океан',
    emoji: '🌊',
    colors: ['#cffafe', '#a5f3fc', '#67e8f9', '#22d3ee', '#06b6d4'],
    type: 'particles',
  },
  {
    id: 'sunset',
    name: 'Закат',
    emoji: '🌅',
    colors: ['#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c'],
    type: 'particles',
  },
  {
    id: 'galaxy',
    name: 'Галактика',
    emoji: '🌌',
    colors: ['#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9'],
    type: 'particles',
  },
  {
    id: 'candy',
    name: 'Конфеты',
    emoji: '🍭',
    colors: ['#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899', '#db2777'],
    type: 'particles',
  },
]

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
  const trailHistoryRef = useRef<{x: number, y: number}[]>([])

  const [displayState, setDisplayState] = useState<GameState>('menu')
  const [score, setScore] = useState(0)
  const [selectedDifficulty, setSelectedDifficulty] = useState('normal')
  const [showDifficultyPicker, setShowDifficultyPicker] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState<Character>(() => {
    const saved = localStorage.getItem('flappy-character')
    return CHARACTERS.find(c => c.id === saved) || CHARACTERS[0]
  })
  const [selectedBackground, setSelectedBackground] = useState<Background>(() => {
    const saved = localStorage.getItem('flappy-background')
    return BACKGROUNDS.find(b => b.id === saved) || BACKGROUNDS[0]
  })
  const [customGravity, setCustomGravity] = useState(() => {
    const saved = localStorage.getItem('flappy-gravity')
    return saved ? parseFloat(saved) : 0.35
  })
  const [customSpeed, setCustomSpeed] = useState(() => {
    const saved = localStorage.getItem('flappy-speed')
    return saved ? parseFloat(saved) : 2.5
  })
  const [selectedTrail, setSelectedTrail] = useState<Trail>(() => {
    const saved = localStorage.getItem('flappy-trail')
    return TRAILS.find(t => t.id === saved) || TRAILS[0]
  })
  const [trailLength, setTrailLength] = useState(() => {
    const saved = localStorage.getItem('flappy-trail-length')
    return saved ? parseInt(saved) : 25
  })
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
    trailHistoryRef.current = []
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
    localStorage.setItem('flappy-character', selectedCharacter.id)
    localStorage.setItem('flappy-background', selectedBackground.id)
    localStorage.setItem('flappy-gravity', customGravity.toString())
    localStorage.setItem('flappy-speed', customSpeed.toString())
    localStorage.setItem('flappy-trail', selectedTrail.id)
    localStorage.setItem('flappy-trail-length', trailLength.toString())
    resetGame()
    birdRef.current.velocity = DIFFICULTIES[selectedDifficulty].jumpForce
    spawnParticles(BIRD_X, birdRef.current.y, 5, '#fbbf24')
  }, [selectedDifficulty, selectedCharacter, selectedBackground, customGravity, customSpeed, selectedTrail, trailLength, resetGame, spawnParticles])

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

  // ===== Draw Trail =====
  const drawTrail = useCallback((ctx: CanvasRenderingContext2D, bird: Bird) => {
    if (gameStateRef.current !== 'playing') return

    if (selectedTrail.type === 'nyan') {
      // Nyan Cat style - solid rainbow stripes
      const stripeHeight = 6
      const totalHeight = selectedTrail.colors.length * stripeHeight
      const startY = bird.y - totalHeight / 2

      // Add current position to history
      trailHistoryRef.current.push({ x: BIRD_X - 15, y: bird.y })
      
      // Keep only last N positions based on trail length
      const maxHistory = trailLength * 2
      if (trailHistoryRef.current.length > maxHistory) {
        trailHistoryRef.current = trailHistoryRef.current.slice(-maxHistory)
      }

      // Draw stripes
      selectedTrail.colors.forEach((color, colorIndex) => {
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.moveTo(BIRD_X - 15, startY + colorIndex * stripeHeight)
        
        // Draw stripe following the history
        for (let i = trailHistoryRef.current.length - 1; i >= 0; i--) {
          const pos = trailHistoryRef.current[i]
          const yOffset = pos.y - bird.y
          ctx.lineTo(pos.x, startY + colorIndex * stripeHeight + yOffset)
        }
        
        // Close the stripe
        const lastPos = trailHistoryRef.current[0]
        if (lastPos) {
          const yOffset = lastPos.y - bird.y
          ctx.lineTo(0, startY + colorIndex * stripeHeight + yOffset)
          ctx.lineTo(0, startY + (colorIndex + 1) * stripeHeight + yOffset)
        }
        
        for (let i = 0; i < trailHistoryRef.current.length; i++) {
          const pos = trailHistoryRef.current[i]
          const yOffset = pos.y - bird.y
          ctx.lineTo(pos.x, startY + (colorIndex + 1) * stripeHeight + yOffset)
        }
        
        ctx.closePath()
        ctx.fill()
      })
    } else {
      // Particle-based trails
      if (frameRef.current % 2 === 0) {
        const colorIndex = Math.floor(frameRef.current / 2) % selectedTrail.colors.length
        particlesRef.current.push({
          x: BIRD_X - 10,
          y: bird.y,
          vx: -1 - Math.random() * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          life: 1,
          maxLife: trailLength,
          color: selectedTrail.colors[colorIndex],
          size: 4 + Math.random() * 2,
        })
      }
    }
  }, [selectedTrail, trailLength])

  // ===== Draw Character =====
  const drawCharacter = useCallback((ctx: CanvasRenderingContext2D, bird: Bird) => {
    selectedCharacter.draw(ctx, bird, frameRef.current)
  }, [selectedCharacter])

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
    selectedBackground.draw(ctx, frameRef.current)
  }, [selectedBackground])

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
      ctx.globalAlpha = p.life * 0.8
      ctx.fillStyle = p.color
      
      // Glow effect
      ctx.shadowBlur = 8
      ctx.shadowColor = p.color
      
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.shadowBlur = 0
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
        bird.velocity += customGravity
        bird.y += bird.velocity
        bird.rotation = lerp(bird.rotation, Math.min(bird.velocity * 4, 70), 0.1)

        groundOffsetRef.current -= customSpeed

        const now = Date.now()
        if (now - lastPipeTimeRef.current > diff.pipeSpawnInterval) {
          const minTop = 120
          const maxTop = CANVAS_HEIGHT - GROUND_HEIGHT - diff.pipeGap - 120
          const topHeight = minTop + Math.random() * (maxTop - minTop)
          pipesRef.current.push({ x: CANVAS_WIDTH, topHeight, passed: false })
          lastPipeTimeRef.current = now
        }

        pipesRef.current.forEach((pipe) => {
          pipe.x -= customSpeed
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
          bird.velocity += customGravity * 0.5 // Slower fall after death
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
      drawTrail(ctx, birdRef.current)
      drawCharacter(ctx, birdRef.current)
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
  }, [bestScores, checkCollision, customGravity, customSpeed, drawBackground, drawCharacter, drawDifficultyBadge, drawGround, drawParticles, drawPipe, drawTrail, drawScore, spawnParticles])

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
          {selectedCharacter.emoji} Flappy Game
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
              <div className="text-6xl mb-4 animate-bounce">{selectedCharacter.emoji}</div>
              <h2 className="text-3xl font-bold text-white mb-6">Готовы?</h2>
              <p className="text-gray-300 mb-6">Выбрано: {selectedCharacter.emoji} {selectedCharacter.name}</p>

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

      {/* Character Selection Panel */}
      <div className="mt-6 w-full max-w-3xl">
        <div className="text-center mb-3">
          <span className="text-gray-400 text-sm">Выберите персонажа:</span>
          <span className="ml-2 text-white font-bold">{selectedCharacter.emoji} {selectedCharacter.name}</span>
        </div>
        <div className="flex flex-wrap gap-2 justify-center px-2">
          {CHARACTERS.map((char) => (
            <button
              key={char.id}
              onClick={() => setSelectedCharacter(char)}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border-2 transition-all duration-200 hover:scale-110 ${
                selectedCharacter.id === char.id
                  ? 'bg-indigo-500/30 border-indigo-400 scale-110 shadow-lg shadow-indigo-500/50'
                  : 'bg-gray-800/50 border-gray-700 hover:border-gray-500 hover:bg-gray-700/50'
              }`}
              title={char.name}
            >
              <span className="text-xl mb-0.5">{char.emoji}</span>
              <span className="text-[8px] text-gray-300 font-medium truncate w-full text-center px-0.5">{char.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Background Selection Panel */}
      <div className="mt-4 w-full max-w-3xl">
        <div className="text-center mb-3">
          <span className="text-gray-400 text-sm">Выберите фон:</span>
          <span className="ml-2 text-white font-bold">{selectedBackground.emoji} {selectedBackground.name}</span>
        </div>
        <div className="flex flex-wrap gap-2 justify-center px-2">
          {BACKGROUNDS.map((bg) => (
            <button
              key={bg.id}
              onClick={() => setSelectedBackground(bg)}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border-2 transition-all duration-200 hover:scale-110 ${
                selectedBackground.id === bg.id
                  ? 'bg-purple-500/30 border-purple-400 scale-110 shadow-lg shadow-purple-500/50'
                  : 'bg-gray-800/50 border-gray-700 hover:border-gray-500 hover:bg-gray-700/50'
              }`}
              title={bg.name}
            >
              <span className="text-xl mb-0.5">{bg.emoji}</span>
              <span className="text-[8px] text-gray-300 font-medium truncate w-full text-center px-0.5">{bg.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty Selection Panel */}
      <div className="mt-4 w-full max-w-3xl">
        <div className="text-center mb-3">
          <span className="text-gray-400 text-sm">Выберите сложность:</span>
          <span className={`ml-2 font-bold ${currentDifficulty.color}`}>
            {currentDifficulty.icon} {currentDifficulty.nameRu}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 justify-center px-2">
          {Object.entries(DIFFICULTIES).map(([key, diff]) => (
            <button
              key={key}
              onClick={() => setSelectedDifficulty(key)}
              className={`flex flex-col items-center justify-center w-32 h-20 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                selectedDifficulty === key
                  ? `${diff.bgColor} ${diff.borderColor} scale-105 shadow-lg`
                  : 'bg-gray-800/50 border-gray-700 hover:border-gray-500 hover:bg-gray-700/50'
              }`}
              title={diff.description}
            >
              <span className="text-2xl mb-1">{diff.icon}</span>
              <span className={`text-sm font-bold ${selectedDifficulty === key ? diff.color : 'text-gray-300'}`}>
                {diff.nameRu}
              </span>
              <span className="text-[9px] text-gray-500 mt-0.5">{diff.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Settings Panel */}
      <div className="mt-4 w-full max-w-3xl">
        <div className="text-center mb-3">
          <span className="text-gray-400 text-sm">Настройки физики:</span>
        </div>
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Gravity Slider */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-gray-300 font-medium">
                  🌍 Гравитация
                </label>
                <span className="text-sm text-indigo-400 font-bold">
                  {customGravity.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={customGravity}
                onChange={(e) => setCustomGravity(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Легко</span>
                <span>Сложно</span>
              </div>
            </div>

            {/* Speed Slider */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-gray-300 font-medium">
                  ⚡ Скорость
                </label>
                <span className="text-sm text-purple-400 font-bold">
                  {customSpeed.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.1"
                value={customSpeed}
                onChange={(e) => setCustomSpeed(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Медленно</span>
                <span>Быстро</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trail Selection Panel */}
      <div className="mt-4 w-full max-w-3xl">
        <div className="text-center mb-3">
          <span className="text-gray-400 text-sm">Выберите шлейф:</span>
          <span className="ml-2 text-white font-bold">{selectedTrail.emoji} {selectedTrail.name}</span>
        </div>
        <div className="flex flex-wrap gap-2 justify-center px-2">
          {TRAILS.map((trail) => (
            <button
              key={trail.id}
              onClick={() => setSelectedTrail(trail)}
              className={`flex flex-col items-center justify-center w-20 h-20 rounded-xl border-2 transition-all duration-200 hover:scale-110 ${
                selectedTrail.id === trail.id
                  ? 'bg-pink-500/30 border-pink-400 scale-110 shadow-lg shadow-pink-500/50'
                  : 'bg-gray-800/50 border-gray-700 hover:border-gray-500 hover:bg-gray-700/50'
              }`}
              title={trail.name}
            >
              <span className="text-2xl mb-1">{trail.emoji}</span>
              <span className="text-[9px] text-gray-300 font-medium">{trail.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Trail Length Slider */}
      <div className="mt-4 w-full max-w-3xl">
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-gray-300 font-medium">
              🌟 Длина шлейфа
            </label>
            <span className="text-sm text-pink-400 font-bold">
              {trailLength}
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="60"
            step="5"
            value={trailLength}
            onChange={(e) => setTrailLength(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Короткий</span>
            <span>Длинный</span>
          </div>
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
