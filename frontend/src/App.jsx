import { useState } from 'react'

const API_BASE = 'http://localhost:8080'

export default function App() {
  const [ping, setPing] = useState('—')

  const handleStart = async () => {
    setPing('...')

    try {
      const started = performance.now()
      const response = await fetch(`${API_BASE}/ping`, {
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error('Ping request failed')
      }

      await response.json()
      const ended = performance.now()
      setPing(String(Math.round(ended - started)))
    } catch (error) {
      console.error(error)
      setPing('Ошибка соединения')
    }
  }

  return (
    <main className="app">
      <button type="button" onClick={handleStart}>
        Начать тест
      </button>
      <p>Ping: {ping === 'Ошибка соединения' ? ping : `${ping} ms`}</p>
    </main>
  )
}
