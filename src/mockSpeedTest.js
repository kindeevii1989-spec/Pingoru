const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const random = (min, max) => Math.random() * (max - min) + min;

async function runPing(onProgress) {
  const steps = 24;
  let ping = 0;

  for (let step = 1; step <= steps; step += 1) {
    const peak = random(22, 33);
    const drift = random(-3, 3);
    ping = clamp(peak + drift, 11, 45);

    onProgress({
      phase: 'ping',
      progress: step / steps,
      value: ping,
      unit: 'ms',
    });

    await wait(55);
  }

  return Math.round(ping);
}

async function runBandwidth(phase, min, max, onProgress) {
  const steps = 42;
  let speed = 0;

  for (let step = 1; step <= steps; step += 1) {
    const ramp = step / steps;
    const base = min + (max - min) * (1 - Math.exp(-4 * ramp));
    speed = clamp(base + random(-4, 4), min * 0.8, max + 6);

    onProgress({
      phase,
      progress: step / steps,
      value: speed,
      unit: 'Mbps',
    });

    await wait(70);
  }

  return Math.round(speed);
}

export async function runMockSpeedTest(onProgress) {
  const ping = await runPing(onProgress);
  const download = await runBandwidth('download', 35, 96, onProgress);
  const upload = await runBandwidth('upload', 14, 42, onProgress);

  return { ping, download, upload };
}
