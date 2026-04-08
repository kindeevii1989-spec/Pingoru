import { useState } from 'react'

const API_BASE = 'http://localhost:8080'

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

  const average = values.reduce((sum, v) => sum + v, 0) / values.length
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

function ResultCard({ label, value, unit }) {
  return (
    <div className="card">
      <div className="card-label">{label}</div>
      <div className="card-value">{value}</div>
      <div className="card-unit">{unit}</div>
    </div>
  )
}

export default function App() {
  const [ping, setPing] = useState('—')
  const [download, setDownload] = useState('—')
  const [upload, setUpload] = useState('—')
  const [status, setStatus] = useState('Готов к тесту')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleStart = async () => {
    setLoading(true)
    setError('')
    setPing('—')
    setDownload('—')
    setUpload('—')

    try {
      setStatus('Измеряем ping...')
      const pingValue = await runPingTest()
      setPing(String(pingValue))

      setStatus('Измеряем download...')
      const downloadValue = await runDownloadTest()
      setDownload(String(downloadValue))

      setStatus('Измеряем upload...')
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
    <main className="app">
      <div className="panel">
        <div className="brand">Pingoru</div>
        <h1>Тест скорости интернета</h1>
        <p className="subtitle">Пинг. Приём. Отдача. Без лишнего цифрового хлама.</p>

        <button className="start-button" onClick={handleStart} disabled={loading}>
          {loading ? 'Идёт тест...' : 'Начать тест'}
        </button>

        <div className="status">{status}</div>
        {error ? <div className="error">{error}</div> : null}

        <div className="results">
          <ResultCard label="Ping" value={ping} unit="ms" />
          <ResultCard label="Download" value={download} unit="Mbps" />
          <ResultCard label="Upload" value={upload} unit="Mbps" />
        </div>
      </div>
    </main>
  )
}
