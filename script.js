// ⚡ Infinite Resonance Lightning Engine v4 — Fluid Fade Version
// by Elisha Blue Parker & Lennard

const canvas = document.getElementById('fractalCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

ctx.globalCompositeOperation = 'lighter';
ctx.fillStyle = 'rgba(0,0,0,0.08)';

let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let masterGain = audioCtx.createGain();
masterGain.connect(audioCtx.destination);

let lfoOsc = audioCtx.createOscillator();
let lfoGain = audioCtx.createGain();
lfoOsc.connect(lfoGain);
lfoGain.connect(masterGain.gain);
lfoGain.gain.value = 0.25;
lfoOsc.frequency.value = 0.2;
lfoOsc.start();

const bursts = [];

function playTone(freq) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const pan = audioCtx.createStereoPanner();

  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);

  osc.connect(pan).connect(gain).connect(masterGain);
  osc.start();
  osc.stop(audioCtx.currentTime + 1.5);
}

function dynamicColor(hueShift, baseHue, freq, alpha = 1) {
  const hue = (baseHue + hueShift + Math.sin(freq * 0.03) * 60) % 360;
  const saturation = 80 + 20 * Math.sin(freq * 0.01);
  const lightness = 50 + 25 * Math.sin(Date.now() * 0.002);
  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
}

function createBurst(x, y, freq) {
  const baseHue = (freq / 880.0) * 360;
  const tendrils = [];
  const branches = 6 + Math.floor(Math.random() * 10);
  for (let i = 0; i < branches; i++) {
    tendrils.push({
      angle: (i / branches) * Math.PI * 2 + Math.random() * 0.2,
      path: [{ x, y }],
    });
  }
  bursts.push({
    x, y,
    freq,
    baseHue,
    radius: 0,
    alpha: 0,             // start invisible
    time: Date.now(),
    lifespan: 5000,       // milliseconds
    hueShift: Math.random() * 360,
    tendrils
  });
}

canvas.addEventListener('click', (e) => {
  const freqs = [220, 261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25];
  const freq = freqs[Math.floor(Math.random() * freqs.length)];
  playTone(freq);
  createBurst(e.clientX, e.clientY, freq);
});

function drawTendril(t, color, intensity) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2 + intensity * 3;
  ctx.beginPath();
  ctx.moveTo(t.path[0].x, t.path[0].y);
  for (let i = 1; i < t.path.length; i++) ctx.lineTo(t.path[i].x, t.path[i].y);
  ctx.stroke();
}

function update() {
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const now = Date.now();

  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i];
    const elapsed = now - b.time;

    // fade in first second, fade out last second
    const fadeIn = Math.min(elapsed / 1000, 1);
    const fadeOut = Math.max(0, 1 - (elapsed - 4000) / 1000);
    b.alpha = Math.min(fadeIn, fadeOut);

    b.radius += 4 + Math.random() * 3;
    b.hueShift += 1.5;

    if (elapsed > b.lifespan) {
      bursts.splice(i, 1);
      continue;
    }

    const color = dynamicColor(b.hueShift, b.baseHue, b.freq, b.alpha);

    // pulse ring
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.globalAlpha = b.alpha * 0.8;
    ctx.lineWidth = 2 + Math.sin(now * 0.008) * 2;
    ctx.stroke();

    // tendrils
    for (let t of b.tendrils) {
      const last = t.path[t.path.length - 1];
      const step = 5 + Math.random() * 5;
      const nx = last.x + Math.cos(t.angle) * step;
      const ny = last.y + Math.sin(t.angle) * step;
      t.path.push({ x: nx, y: ny });
      if (Math.random() < 0.25) t.angle += (Math.random() - 0.5) * 0.5;
      drawTendril(t, color, b.alpha);
    }
  }

  ctx.globalAlpha = 1.0;
  requestAnimationFrame(update);
}
update();
