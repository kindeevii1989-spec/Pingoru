import { useEffect, useState } from 'react'

const API_BASE = 'http://localhost:8080'
const BRAND_TEXT = 'Pinguru'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function runPingTest() {
  const attempts = 5
  const values = []

  for (let i = 0; i < attempts; i++) {
    const started = performance.now()
    const response = await fetch(`${API_BASE}/ping?ts=${Date.now()}-${i}`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error('Ping request failed')
    }

    await response.json()
    const ended = performance.now()
    values.push(ended - started)
    await sleep(150)
  }

  const average = values.reduce((sum, value) => sum + value, 0) / values.length
  return Math.round(average)
}

async function runDownloadTest() {
  const started = performance.now()

  const response = await fetch(`${API_BASE}/download?ts=${Date.now()}`, {
    cache: 'no-store'
  })

  if (!response.ok || !response.body) {
    throw new Error('Download request failed')
  }

  const reader = response.body.getReader()
  const durationMs = 5000
  let bytesReceived = 0

  while (true) {
    const now = performance.now()
    if (now - started >= durationMs) {
      reader.cancel()
      break
    }

    const { done, value } = await reader.read()
    if (done) break
    if (value) bytesReceived += value.byteLength
  }

  const elapsedSeconds = (performance.now() - started) / 1000
  const megabits = (bytesReceived * 8) / 1_000_000

  return Number((megabits / elapsedSeconds).toFixed(2))
}

async function runUploadTest() {
  const durationMs = 5000
  const chunkSize = 256 * 1024
  const chunk = new Uint8Array(chunkSize)
  crypto.getRandomValues(chunk)

  let bytesSent = 0
  const started = performance.now()

  while (performance.now() - started < durationMs) {
    const response = await fetch(`${API_BASE}/upload?ts=${Date.now()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Cache-Control': 'no-store'
      },
      body: chunk
    })

    if (!response.ok) {
      throw new Error('Upload request failed')
    }

    bytesSent += chunk.byteLength
  }

  const elapsedSeconds = (performance.now() - started) / 1000
  const megabits = (bytesSent * 8) / 1_000_000

  return Number((megabits / elapsedSeconds).toFixed(2))
}

function KangarooIcon() {
  return (
    <svg viewBox="0 0 220 120" role="img" aria-hidden="true" focusable="false">
      <path
        d="M28 86C44 78 58 65 73 55C92 42 114 36 136 40C149 42 160 48 169 56L187 52L172 64C166 70 163 76 161 82L147 80C138 88 126 93 112 96C89 101 67 97 51 89L33 92Z"
        className="kangaroo-line"
      />
    </svg>
  )
}

function MetricCircle({ className, label, value, unit }) {
  return (
    <article className={`metric-circle ${className}`}>
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
      <div className="metric-unit">{unit}</div>
    </article>
  )
}

export default function App() {
  const [typedText, setTypedText] = useState('')
  const [introDone, setIntroDone] = useState(false)
  const [ping, setPing] = useState('—')
  const [download, setDownload] = useState('—')
  const [upload, setUpload] = useState('—')
  const [status, setStatus] = useState('Готов к тесту')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let index = 1
    const interval = setInterval(() => {
      setTypedText(BRAND_TEXT.slice(0, index))
      index += 1

      if (index > BRAND_TEXT.length + 1) {
        clearInterval(interval)
        setTimeout(() => {
          setIntroDone(true)
        }, 140)
      }
    }, 120)

    return () => clearInterval(interval)
  }, [])

  const handleStart = async () => {
    setLoading(true)
    setError('')
    setPing('—')
    setDownload('—')
    setUpload('—')

    try {
      setStatus('Измеряем пинг...')
      const pingValue = await runPingTest()
      setPing(String(pingValue))

      setStatus('Измеряем приём...')
      const downloadValue = await runDownloadTest()
      setDownload(String(downloadValue))

      setStatus('Измеряем отдачу...')
      const uploadValue = await runUploadTest()
      setUpload(String(uploadValue))

      setStatus('Тест завершён')
    } catch (err) {
      console.error(err)
      setStatus('Ошибка')
      setError('Не удалось выполнить тест. Проверь, запущен ли backend.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={`app ${introDone ? 'intro-done' : ''}`}>
      <div className={`intro-layer ${introDone ? 'hidden' : ''}`}>
        <div className="intro-text">{typedText || 'P'}</div>
      </div>

      <section className={`main-orb ${introDone ? 'visible' : ''}`}>
        <header className="orb-header">
          <h1 className="brand">{BRAND_TEXT}</h1>
          <div className={`brand-kangaroo ${loading ? 'active' : ''}`}>
            <KangarooIcon />
          </div>
        </header>

        <button className="start-button" onClick={handleStart} disabled={loading}>
          {loading ? '...' : 'Старт'}
        </button>

        <div className="status">{status}</div>
        {error ? <div className="error">{error}</div> : null}

        <div className="stats-cluster">
          <MetricCircle className="download" label="Приём" value={download} unit="Mbps" />
          <MetricCircle className="upload" label="Отдача" value={upload} unit="Mbps" />
          <MetricCircle className="ping" label="Пинг" value={ping} unit="ms" />
        </div>
      </section>
    </main>
  )
}
