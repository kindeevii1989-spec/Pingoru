import { useState } from 'react';

const initialMetrics = {
  ping: '—',
  download: '—',
  upload: '—',
};

function App() {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartTest = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setMetrics(initialMetrics);

    await new Promise((resolve) => {
      setTimeout(() => {
        setMetrics({
          ping: '18 мс',
          download: '94 Mbps',
          upload: '37 Mbps',
        });
        resolve();
      }, 1800);
    });

    setIsLoading(false);
  };

  return (
    <main className="app">
      <section className="panel" aria-busy={isLoading}>
        <h1 className="title">Pingoru</h1>

        <button
          className="start-button"
          type="button"
          onClick={handleStartTest}
          disabled={isLoading}
        >
          {isLoading ? 'Тест выполняется…' : 'Начать тест'}
        </button>

        <div className="metrics" role="list" aria-live="polite">
          <article className="metric-card" role="listitem">
            <span className="metric-label">Ping</span>
            <strong className="metric-value">{isLoading ? '…' : metrics.ping}</strong>
          </article>

          <article className="metric-card" role="listitem">
            <span className="metric-label">Download</span>
            <strong className="metric-value">{isLoading ? '…' : metrics.download}</strong>
          </article>

          <article className="metric-card" role="listitem">
            <span className="metric-label">Upload</span>
            <strong className="metric-value">{isLoading ? '…' : metrics.upload}</strong>
          </article>
        </div>
      </section>
    </main>
  );
}

export default App;
