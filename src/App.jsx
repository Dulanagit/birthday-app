import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const BIRTHDAY_TARGET = new Date('2026-07-19T02:07:00')
const LOVE_QUOTES = [
  'Happy Birthday, Savii. You make ordinary days feel like magic.',
  'Every smile of yours is my favorite celebration.',
  'You are my calm, my courage, and my happiest place.',
  'May this year hold all the joy you bring to everyone else.',
]

function addMonths(date, amount) {
  const next = new Date(date)
  const currentDay = next.getDate()

  next.setDate(1)
  next.setMonth(next.getMonth() + amount)

  const lastDayOfMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
  next.setDate(Math.min(currentDay, lastDayOfMonth))

  return next
}

function getCountdownParts(targetDate, currentDate) {
  if (currentDate >= targetDate) {
    return {
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isBirthdayReached: true,
    }
  }

  let months = (targetDate.getFullYear() - currentDate.getFullYear()) * 12
    + targetDate.getMonth()
    - currentDate.getMonth()

  let anchorDate = addMonths(currentDate, months)

  if (anchorDate > targetDate) {
    months -= 1
    anchorDate = addMonths(currentDate, months)
  }

  const remainingMs = Math.max(targetDate.getTime() - anchorDate.getTime(), 0)
  let remainingSeconds = Math.floor(remainingMs / 1000)

  const days = Math.floor(remainingSeconds / 86400)
  remainingSeconds %= 86400

  const hours = Math.floor(remainingSeconds / 3600)
  remainingSeconds %= 3600

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60

  return {
    months,
    days,
    hours,
    minutes,
    seconds,
    isBirthdayReached: false,
  }
}

function formatCount(value) {
  return String(value).padStart(2, '0')
}

function App() {
  const [scene, setScene] = useState('countdown')
  const [insideStage, setInsideStage] = useState('intro')
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const [toast, setToast] = useState('')
  const [isDoorShaking, setIsDoorShaking] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [doorOpen, setDoorOpen] = useState(false)
  const [keyPosition, setKeyPosition] = useState({ x: 18, y: 72 })

  const sceneRef = useRef(null)
  const keyRef = useRef(null)
  const doorRef = useRef(null)
  const dragStateRef = useRef(null)
  const toastTimeoutRef = useRef(null)

  const countdown = useMemo(
    () => getCountdownParts(BIRTHDAY_TARGET, currentTime),
    [currentTime],
  )

  const birthdayReached = countdown.isBirthdayReached

  const resetApp = () => {
    // Clear any pending timeouts so they don't fire after the reset
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    
    // Reset all state variables to their exact initial values
    setScene('countdown');
    setInsideStage('intro');
    setQuoteIndex(0);
    setToast('');
    setIsDoorShaking(false);
    setIsDragging(false);
    setDoorOpen(false);
    setKeyPosition({ x: 18, y: 72 });
    
    // Note: We don't need to reset currentTime since it naturally ticks forward
  };

  const showToast = (message) => {
    window.clearTimeout(toastTimeoutRef.current)
    setToast(message)
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast('')
    }, 3500)
  }

  const openDoor = () => {
    if (scene !== 'countdown' || doorOpen) {
      return
    }

    setDoorOpen(true)
    setScene('opening')
    showToast('The door opened!')
  }

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    if (scene !== 'opening') {
      return undefined
    }

    const timer = window.setTimeout(() => {
      setInsideStage('intro')
      setQuoteIndex(0)
      setScene('inside')
    }, 1100)

    return () => {
      window.clearTimeout(timer)
    }
  }, [scene])

  useEffect(() => {
    if (scene !== 'inside' || insideStage !== 'celebration') {
      return undefined
    }

    const timer = window.setTimeout(() => {
      setScene('final')
      setQuoteIndex(0)
    }, 4300)

    return () => {
      window.clearTimeout(timer)
    }
  }, [scene, insideStage])

  useEffect(() => {
    if (scene !== 'final') {
      return undefined
    }

    const interval = window.setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % LOVE_QUOTES.length)
    }, 3400)

    return () => {
      window.clearInterval(interval)
    }
  }, [scene])

  useEffect(() => () => window.clearTimeout(toastTimeoutRef.current), [])

  const openGiftBox = () => {
    if (scene !== 'inside' || insideStage !== 'intro') {
      return
    }

    setInsideStage('celebration')
  }

  const startDrag = (event) => {
    if (!birthdayReached || scene !== 'countdown') {
      return
    }

    const sceneElement = sceneRef.current
    const keyElement = keyRef.current

    if (!sceneElement || !keyElement) {
      return
    }

    const sceneRect = sceneElement.getBoundingClientRect()
    const keyRect = keyElement.getBoundingClientRect()

    dragStateRef.current = {
      offsetX: event.clientX - keyRect.left,
      offsetY: event.clientY - keyRect.top,
      width: keyRect.width,
      height: keyRect.height,
      sceneWidth: sceneRect.width,
      sceneHeight: sceneRect.height,
    }

    setIsDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const dragKey = (event) => {
    if (!isDragging || !dragStateRef.current || scene !== 'countdown') {
      return
    }

    const sceneElement = sceneRef.current

    if (!sceneElement) {
      return
    }

    const sceneRect = sceneElement.getBoundingClientRect()
    const { offsetX, offsetY, width, height } = dragStateRef.current

    const nextX = event.clientX - sceneRect.left - offsetX
    const nextY = event.clientY - sceneRect.top - offsetY

    const clampedX = Math.min(Math.max(nextX, 0), sceneRect.width - width)
    const clampedY = Math.min(Math.max(nextY, 0), sceneRect.height - height)

    setKeyPosition({
      x: (clampedX / sceneRect.width) * 100,
      y: (clampedY / sceneRect.height) * 100,
    })
  }

  const finishDrag = (event) => {
    if (!isDragging) {
      return
    }

    const keyElement = keyRef.current
    const doorElement = doorRef.current

    setIsDragging(false)
    dragStateRef.current = null

    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // Ignore capture release errors.
    }

    if (!keyElement || !doorElement) {
      return
    }

    const keyRect = keyElement.getBoundingClientRect()
    const doorRect = doorElement.getBoundingClientRect()
    const overlapsDoor =
      keyRect.left < doorRect.right
      && keyRect.right > doorRect.left
      && keyRect.top < doorRect.bottom
      && keyRect.bottom > doorRect.top

    if (overlapsDoor) {
      openDoor()
    }
  }

  if (scene === 'inside') {
    const confettiStrips = Array.from({ length: 18 }, (_, index) => ({
      id: index,
      left: `${(index * 11) % 100}%`,
      delay: `${(index % 6) * 0.18}s`,
      duration: `${2.8 + (index % 4) * 0.5}s`,
      rotation: `${(index % 2 === 0 ? -1 : 1) * (8 + (index % 5) * 6)}deg`,
      color: ['#ff5da2', '#ffd94d', '#6ec2ff', '#7ee081', '#ff8a66'][index % 5],
    }))

    return (
      <div className="app-shell inside-shell">
        <div className="inside-scene">
          {insideStage === 'intro' && (
            <>
              <h1 className="inside-title">Surprisee!!</h1>
              <p className="inside-copy inside-copy-compact">please open the box.</p>

              <button
                type="button"
                className="gift-box"
                onClick={openGiftBox}
                aria-label="Open the gift box"
              >
                <span className="gift-box-lid" />
                <span className="gift-box-body" />
                <span className="gift-pattern gift-pattern-one" />
                <span className="gift-pattern gift-pattern-two" />
                <span className="gift-ribbon gift-ribbon-vertical" />
                <span className="gift-ribbon gift-ribbon-horizontal" />
              </button>
            </>
          )}

          {insideStage === 'celebration' && (
            <>
              <div className="box-burst" aria-hidden="true" />
              <div className="banner-wrap" aria-hidden="true">
                <div className="banner-ribbon">Happy Birthday Savii</div>
              </div>
              <div className="cake-wrap" aria-hidden="true">
                <div className="cake">
                  <span className="cake-plate" />
                  <span className="cake-layer cake-layer-top" />
                  <span className="cake-layer cake-layer-bottom" />
                  <span className="cake-frosting" />
                  <span className="cake-drip cake-drip-one" />
                  <span className="cake-drip cake-drip-two" />
                  <span className="cake-drip cake-drip-three" />
                  
                  {/* Notice how the candles now wrap around the fire */}
                  <span className="cake-candle cake-candle-one">
                    <div className="cake-fire cake-fire-left" />
                  </span>
                  
                  <span className="cake-candle cake-candle-two">
                    <div className="cake-fire cake-fire-right" />
                  </span>
                </div>
              </div>
              <div className="confetti-layer" aria-hidden="true">
                {confettiStrips.map((strip) => (
                  <span
                    key={strip.id}
                    className="confetti-strip"
                    style={{
                      left: strip.left,
                      animationDelay: strip.delay,
                      animationDuration: strip.duration,
                      '--rotation': strip.rotation,
                      backgroundColor: strip.color,
                    }}
                  />
                ))}
              </div>
          
            </>
          )}
        </div>
      </div>
    )
  }

  if (scene === 'final') {
    return (
      <div className="app-shell final-shell">
        <main className="final-scene">
          <h1 className="final-title">It's Your Day!!</h1>
          <p className="final-subtitle">A little carousel of love, just for you.</p>

          <section className="quote-carousel" aria-label="Love quote carousel">
            <div className="quote-track" style={{ transform: `translateX(-${quoteIndex * 100}%)` }}>
              {LOVE_QUOTES.map((quote) => (
                <article key={quote} className="quote-card">
                  <p>{quote}</p>
                </article>
              ))}
            </div>
          </section>

          <div className="quote-dots" aria-hidden="true">
            {LOVE_QUOTES.map((_, index) => (
              <span key={index} className={`quote-dot ${quoteIndex === index ? 'is-active' : ''}`} />
            ))}
          </div>
          <div className="final-home">
            <button 
              className="reset-scene-btn" 
              onClick={resetApp} 
              aria-label="Refresh the page"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
            </button>
          </div>
        </main>
      </div>
    )
  }

  return(
    <div className="app-shell countdown-shell">
      <main className="scene" ref={sceneRef}>
        <section className="hero-copy">
          <h1>Welcome to the Birthday Gate</h1>
          <p className="lead">
            The door stays closed until your birthday arrives. When the time comes, the key appears and you can drag it open.
          </p>
        </section>

        <div className="scene-stage">
          <button
            type="button"
            className={`door-wrap ${isDoorShaking ? 'is-shaking' : ''}`}
            ref={doorRef}
            onClick={() => {
              if (!birthdayReached) {
                setIsDoorShaking(true)
                showToast('Wait until your birthday to get the key.')

                window.setTimeout(() => {
                  setIsDoorShaking(false)
                }, 600)
                return
              }

              if (scene === 'countdown') {
                showToast('Drag the yellow key onto the blue door.')
              }
            }}
          >
            <span className={`door ${doorOpen ? 'is-open' : ''}`}>
              <span className="door-panel" />
              <span className="door-plank door-plank-left" />
              <span className="door-plank door-plank-mid" />
              <span className="door-plank door-plank-right" />
              <span className="door-plank door-plank-extra" />
              <span className="door-plank door-plank-extra2" />
              <span className="door-knob" />
              <span className="door-handle" />
              <span className="door-frame" />
            </span>
          </button>

          {birthdayReached && scene === 'countdown' && (
            <button
              type="button"
              className={`key ${isDragging ? 'is-dragging' : ''}`}
              ref={keyRef}
              style={{
                left: `${keyPosition.x}%`,
                top: `${keyPosition.y}%`,
              }}
              onPointerDown={startDrag}
              onPointerMove={dragKey}
              onPointerUp={finishDrag}
              onPointerCancel={finishDrag}
              aria-label="Drag the key to the door"
            >
              <span className="key-ring" />
              <span className="key-shaft" />
              <span className="key-teeth" />
            </button>
          )}
        </div>

        <section className="countdown-panel" aria-label="Birthday countdown">
          <div className="countdown-grid">
            <div className="countdown-card">
              <span>{formatCount(countdown.months)}</span>
              <label>Months</label>
            </div>
            <div className="countdown-card">
              <span>{formatCount(countdown.days)}</span>
              <label>Days</label>
            </div>
            <div className="countdown-card">
              <span>{formatCount(countdown.hours)}</span>
              <label>Hours</label>
            </div>
            <div className="countdown-card">
              <span>{formatCount(countdown.minutes)}</span>
              <label>Mins</label>
            </div>
            <div className="countdown-card countdown-card-wide">
              <span>{formatCount(countdown.seconds)}</span>
              <label>Secs</label>
            </div>
          </div>
          <div className="progress-note">
            {birthdayReached ? 'Birthday reached. The key is ready.' : 'The door is locked until your birthday arrives.'}
          </div>
        </section>

        <div className="toast" aria-live="polite">
          {toast || (birthdayReached ? 'Drag the key to the door to open it.' : 'Click the door to hear the rule.')}
        </div>
      </main>
    </div>
  )
}

export default App