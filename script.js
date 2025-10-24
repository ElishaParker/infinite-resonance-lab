// ⚡ Lightning Tone Bloom v1
// Infinite Resonance Lab — Eli Parker & Lennard

const canvas = document.getElementById('fractalCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

ctx.globalCompositeOperation = 'lighter';
ctx.fillStyle = 'rgba(0,0,0,0.1)';

let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let masterGain = audioCtx.createGain();
masterGain.connect(audioCtx.destination);

let lfoOsc = audioCtx.createOscillator();
let lfoGain = audioCtx.createGain();
lfoOsc.connect(lfoGain);
lfoGain.connect(masterGain.gain);
lfoGain.gain.value = 0.15;
lfoOsc.start();

const bursts = [];

function playTone(freq) {
  const osc = audioCtx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = freq;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
  osc.connect(gain).connect(masterGain);
  osc.start();
  osc.stop(audioCtx.currentTime + 1.5);
}

function hslToRgb(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h * 12) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

function createBurst(x, y, freq) {
  const hue = (freq / 880.0) * 360;
  const rgb = hslToRgb(hue / 360, 1, 0.5);
  const color = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
  const tendrils = [];
  const branches = 5 + Math.floor(Math.random() * 7);
  for (let i = 0; i < branches; i++) {
    const angle = (i / branches) * Math.PI * 2 + Math.random() * 0.2;
    tendrils.push({
      angle,
      length: 0,
      path: [{ x, y }]
    });
  }
  bursts.push({ x, y, color, radius: 0, alpha: 1, tendrils });
}

canvas.addEventListener('click', (e) => {
  const freqs = [261.63,293.66,329.63,349.23,392,440,493.88];
  const freq = freqs[Math.floor(Math.random() * freqs.length)];
  playTone(freq);
  createBurst(e.clientX, e.clientY, freq);
});

function drawTendril(t, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(t.path[0].x, t.path[0].y);
  for (let i = 1; i < t.path.length; i++) {
    ctx.lineTo(t.path[i].x, t.path[i].y);
  }
  ctx.stroke();
}

function update() {
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const now = Date.now();
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i];
    b.radius += 8;
    b.alpha -= 0.01;
    if (b.alpha <= 0) {
      bursts.splice(i, 1);
      continue;
    }
    // Draw central pulse
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.strokeStyle = b.color;
    ctx.globalAlpha = b.alpha;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Update and draw tendrils
    for (let t of b.tendrils) {
      const last = t.path[t.path.length - 1];
      const nx = last.x + Math.cos(t.angle) * (4 + Math.random() * 4);
      const ny = last.y + Math.sin(t.angle) * (4 + Math.random() * 4);
      t.path.push({ x: nx, y: ny });
      if (Math.random() < 0.2) t.angle += (Math.random() - 0.5) * 0.5;
      drawTendril(t, b.color);
    }
  }
  ctx.globalAlpha = 1.0;
  requestAnimationFrame(update);
}
update();
