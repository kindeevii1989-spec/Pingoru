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
