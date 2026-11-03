import { useState, useEffect } from 'react'

const capabilities = [
  {
    icon: '🎨',
    title: 'UI/UX Дизайн',
    description: 'Создаю красивые, адаптивные интерфейсы с Tailwind CSS, анимациями и современным дизайном',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: '⚛️',
    title: 'React & TypeScript',
    description: 'Разрабатываю компоненты, хуки, контексты и полноценные SPA приложения',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: '🗄️',
    title: 'Работа с данными',
    description: 'Интеграция с API, обработка данных, формы, валидация и управление состоянием',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: '🎮',
    title: 'Интерактивность',
    description: 'Анимации, переходы, игры, калькуляторы, дашборды и любые интерактивные элементы',
    color: 'from-purple-500 to-violet-500',
  },
  {
    icon: '📱',
    title: 'Адаптивность',
    description: 'Все проекты работают на любых устройствах — от мобильных до десктопов',
    color: 'from-orange-500 to-amber-500',
  },
  {
    icon: '🔧',
    title: 'Инструменты',
    description: 'npm-пакеты, генерация изображений, веб-поиск для актуальной информации',
    color: 'from-teal-500 to-cyan-500',
  },
]

const examples = [
  'Лендинг для бизнеса',
  'Дашборд с графиками',
  'Todo-приложение',
  'Портфолио сайт',
  'Интернет-магазин',
  'Блог с CMS',
  'Калькулятор',
  'Чат-интерфейс',
  'Игра на React',
  'Погодное приложение',
]

function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let start = 0
    const increment = target / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])

  return <span>{count}</span>
}

function TypewriterText({ texts }: { texts: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentText, setCurrentText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const text = texts[currentIndex]
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (currentText.length < text.length) {
          setCurrentText(text.slice(0, currentText.length + 1))
        } else {
          setTimeout(() => setIsDeleting(true), 1500)
        }
      } else {
        if (currentText.length > 0) {
          setCurrentText(text.slice(0, currentText.length - 1))
        } else {
          setIsDeleting(false)
          setCurrentIndex((prev) => (prev + 1) % texts.length)
        }
      }
    }, isDeleting ? 50 : 100)

    return () => clearTimeout(timeout)
  }, [currentText, isDeleting, currentIndex, texts])

  return (
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
      {currentText}
      <span className="animate-pulse">|</span>
    </span>
  )
}

export default function App() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden relative">
      {/* Animated background */}
      <div
        className="fixed inset-0 opacity-30 pointer-events-none transition-all duration-1000"
        style={{
          background: `radial-gradient(600px at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.15), transparent 80%)`,
        }}
      />
      
      {/* Floating particles */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-indigo-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Готов к работе
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Я создаю{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              веб-приложения
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-400 mb-4">
            Опишите что нужно — и я{' '}
            <TypewriterText texts={[
              'напишу код',
              'создам дизайн',
              'добавлю анимации',
              'интегрирую API',
              'сделаю адаптив',
              'сгенерирую изображения',
            ]} />
          </p>
          
          <p className="text-gray-500 text-lg mb-12">
            React • TypeScript • Tailwind CSS • Vite
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <a href="#capabilities" className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/25">
              Узнать больше ↓
            </a>
            <a href="#examples" className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-semibold hover:bg-white/10 transition-all">
              Примеры проектов
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl w-full">
          {[
            { value: 100, suffix: '%', label: 'Адаптивность' },
            { value: 50, suffix: '+', label: 'Шагов за сессию' },
            { value: 10, suffix: '', label: 'Изображений AI' },
            { value: 3, suffix: 's', label: 'Сборка проекта' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white">
                <AnimatedCounter target={stat.value} />
                <span className="text-indigo-400">{stat.suffix}</span>
              </div>
              <div className="text-gray-500 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities Section */}
      <section id="capabilities" className="relative z-10 px-4 py-20 max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
          Что я умею
        </h2>
        <p className="text-gray-400 text-center mb-16 text-lg">
          Полный стек для создания современных веб-приложений
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((cap, i) => (
            <div
              key={i}
              className={`relative group p-6 rounded-2xl bg-gray-900/50 border border-gray-800 hover:border-gray-700 transition-all duration-300 cursor-default ${
                hoveredCard === i ? 'scale-[1.02] shadow-2xl' : ''
              }`}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${cap.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              <div className="text-4xl mb-4">{cap.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{cap.title}</h3>
              <p className="text-gray-400 leading-relaxed">{cap.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Examples Section */}
      <section id="examples" className="relative z-10 px-4 py-20 max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
          Примеры проектов
        </h2>
        <p className="text-gray-400 text-center mb-12 text-lg">
          Просто попросите — и я создам
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          {examples.map((example, i) => (
            <span
              key={i}
              className="px-5 py-3 rounded-xl bg-gray-900/50 border border-gray-800 text-gray-300 hover:border-indigo-500/50 hover:text-indigo-300 hover:bg-indigo-500/5 transition-all duration-200 cursor-default"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {example}
            </span>
          ))}
        </div>

        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-indigo-950/50 to-purple-950/50 border border-indigo-500/20">
          <h3 className="text-2xl font-bold mb-4 text-center">💡 Как начать?</h3>
          <div className="space-y-4 text-gray-300">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">1</span>
              <p>Опишите, какое приложение или сайт вам нужно</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">2</span>
              <p>Я создам полноценный рабочий проект с кодом</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">3</span>
              <p>Вы получите готовый сайт, который можно сразу использовать</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="relative z-10 px-4 py-20 max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
          Технологии
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { name: 'React', icon: '⚛️' },
            { name: 'TypeScript', icon: '📘' },
            { name: 'Tailwind', icon: '🎨' },
            { name: 'Vite', icon: '⚡' },
            { name: 'npm', icon: '📦' },
            { name: 'HTML/CSS', icon: '🌐' },
            { name: 'AI Images', icon: '🖼️' },
            { name: 'Web Search', icon: '🔍' },
          ].map((tech, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-3 p-6 rounded-xl bg-gray-900/30 border border-gray-800/50 hover:border-gray-700 transition-all hover:scale-105"
            >
              <span className="text-3xl">{tech.icon}</span>
              <span className="text-sm text-gray-400">{tech.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-4 py-12 text-center border-t border-gray-800/50">
        <p className="text-gray-500">
          Просто напишите мне, что нужно создать — и я сделаю это ✨
        </p>
      </footer>
    </div>
  )
}
