import { useMemo, useState } from 'react';
import { runMockSpeedTest } from './mockSpeedTest';

const defaultMetrics = {
  ping: '—',
  download: '—',
  upload: '—',
};

const phaseLabels = {
  idle: 'Готов к запуску',
  ping: 'Проверка Ping',
  download: 'Тест Download',
  upload: 'Тест Upload',
  completed: 'Тест завершён',
};

function formatMetric(value, unit) {
  if (value == null) return '—';
  return `${value} ${unit}`;
}

function App() {
  const [status, setStatus] = useState('idle');
  const [phase, setPhase] = useState('idle');
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [displayValue, setDisplayValue] = useState('0');
  const [displayUnit, setDisplayUnit] = useState('Mbps');
  const [metrics, setMetrics] = useState(defaultMetrics);

  const isTesting = status === 'testing';

  const progressPercent = useMemo(() => {
    const phaseWeight = {
      ping: 0,
      download: 33,
      upload: 66,
    };

    if (!isTesting) {
      return status === 'completed' ? 100 : 0;
    }

    const base = phaseWeight[phase] ?? 0;
    return Math.min(100, base + phaseProgress * 33);
  }, [isTesting, phase, phaseProgress, status]);

  const startTest = async () => {
    if (isTesting) return;

    setStatus('testing');
    setPhase('ping');
    setPhaseProgress(0);
    setDisplayValue('0');
    setDisplayUnit('ms');
    setMetrics(defaultMetrics);

    const result = await runMockSpeedTest(({ phase: nextPhase, progress, value, unit }) => {
      setPhase(nextPhase);
      setPhaseProgress(progress);
      setDisplayValue(Math.round(value).toString());
      setDisplayUnit(unit);
    });

    setMetrics({
      ping: formatMetric(result.ping, 'ms'),
      download: formatMetric(result.download, 'Mbps'),
      upload: formatMetric(result.upload, 'Mbps'),
    });

    setDisplayValue(result.download.toString());
    setDisplayUnit('Mbps');
    setPhase('completed');
    setStatus('completed');
    setPhaseProgress(1);
  };

  return (
    <main className="app">
      <section className={`panel panel--${status}`} aria-busy={isTesting}>
        <header className="panel-header">
          <h1 className="title">Pingoru</h1>
          <p className="subtitle">{phaseLabels[phase]}</p>
        </header>

        <div className="speedometer-wrap">
          <div
            className={`speedometer ${isTesting ? 'is-testing' : ''}`}
            style={{ '--progress': `${progressPercent}%` }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progressPercent)}
            aria-label="Скорость теста"
          >
            <div className="speedometer-inner">
              <div className="speed-value">{displayValue}</div>
              <div className="speed-unit">{displayUnit}</div>
            </div>
          </div>
        </div>

        <div className={`kangaroo ${isTesting ? 'active' : ''}`} aria-hidden="true">
          <svg viewBox="0 0 220 120" role="img" focusable="false">
            <path d="M30 98h160" className="kangaroo-ground" />
            <path
              d="M53 77c8-15 23-22 39-21 11 1 20 6 28 13l15-4 16 7-18 6c0 12-8 21-22 24l-29 4c-14 2-27-2-33-13-4-8-3-12 4-16z"
              className="kangaroo-line"
            />
            <path d="M109 55l5-19 8 16" className="kangaroo-line" />
            <path d="M86 90l-15 11" className="kangaroo-line" />
            <path d="M124 92l17 9" className="kangaroo-line" />
            <circle cx="128" cy="67" r="1.8" className="kangaroo-line" />
          </svg>
        </div>

        <button className="start-button" type="button" onClick={startTest} disabled={isTesting}>
          {isTesting ? 'Тестирование…' : 'Начать тест'}
        </button>

        <div className="metrics" role="list" aria-live="polite">
          <article className="metric-card" role="listitem">
            <span className="metric-label">Ping</span>
            <strong className="metric-value">{metrics.ping}</strong>
          </article>

          <article className="metric-card" role="listitem">
            <span className="metric-label">Download</span>
            <strong className="metric-value">{metrics.download}</strong>
          </article>

          <article className="metric-card" role="listitem">
            <span className="metric-label">Upload</span>
            <strong className="metric-value">{metrics.upload}</strong>
          </article>
        </div>
      </section>
    </main>
  );
}

export default App;
