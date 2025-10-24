// ⚡ Infinite Resonance Lightning Engine v2
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
lfoGain.gain.value = 0.15;
lfoOsc.start();

const bursts = [];

// === AUDIO ENGINE ===
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

function freqToColor(f) {
  const hue = (f / 880.0) * 360;
  const lightness = 60 + Math.sin(f * 0.05) * 10;
  return `hsl(${hue}, 100%, ${lightness}%)`;
}

// === VISUAL ENGINE ===
function createBurst(x, y, freq) {
  const color = freqToColor(freq);
  const tendrils = [];
  const branches = 6 + Math.floor(Math.random() * 10);
  for (let i = 0; i < branches; i++) {
    tendrils.push({
      angle: (i / branches) * Math.PI * 2 + Math.random() * 0.2,
      path: [{ x, y }],
      length: 0,
    });
  }
  bursts.push({ x, y, color, radius: 0, alpha: 1, freq, tendrils });
}

canvas.addEventListener('click', (e) => {
  const freqs = [220, 261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25];
  const freq = freqs[Math.floor(Math.random() * freqs.length)];
  playTone(freq);
  createBurst(e.clientX, e.clientY, freq);
});

function drawTendril(t, color, intensity) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5 + intensity * 2;
  ctx.beginPath();
  ctx.moveTo(t.path[0].x, t.path[0].y);
  for (let i = 1; i < t.path.length; i++) ctx.lineTo(t.path[i].x, t.path[i].y);
  ctx.stroke();
}

function update() {
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i];
    b.radius += 5 + Math.random() * 3;
    b.alpha -= 0.012;
    if (b.alpha <= 0) {
      bursts.splice(i, 1);
      continue;
    }

    // draw expanding pulse
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.strokeStyle = b.color;
    ctx.globalAlpha = b.alpha * 0.8;
    ctx.lineWidth = 1.5 + Math.sin(b.freq * 0.01) * 0.5;
    ctx.stroke();

    // lightning tendrils
    for (let t of b.tendrils) {
      const last = t.path[t.path.length - 1];
      const step = 5 + Math.random() * 5;
      const nx = last.x + Math.cos(t.angle) * step;
      const ny = last.y + Math.sin(t.angle) * step;
      t.path.push({ x: nx, y: ny });
      if (Math.random() < 0.25) t.angle += (Math.random() - 0.5) * 0.5;
      drawTendril(t, b.color, b.alpha);
    }
  }
  ctx.globalAlpha = 1.0;
  requestAnimationFrame(update);
}
update();
