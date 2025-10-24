const canvas = document.getElementById('fractalCanvas');
const ctx = canvas.getContext('2d');
canvas.width = innerWidth;
canvas.height = innerHeight;

const bursts = [];
let clickCount = 0;

// === Audio setup ===
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const masterGain = audioCtx.createGain();
masterGain.connect(audioCtx.destination);

const lfoOsc = audioCtx.createOscillator();
const lfoGain = audioCtx.createGain();
lfoOsc.connect(lfoGain);
lfoGain.connect(masterGain.gain);
lfoGain.gain.value = 0.2;
lfoOsc.frequency.value = 0.3;
lfoOsc.start();

document.getElementById("volume").addEventListener("input", e => {
  masterGain.gain.value = e.target.value;
});
document.getElementById("lfo").addEventListener("input", e => {
  lfoGain.gain.value = e.target.value;
});

function playTone(freq) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = "sine";
  gain.gain.setValueAtTime(1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
  osc.connect(gain).connect(masterGain);
  osc.start();
  osc.stop(audioCtx.currentTime + 1.3);
}

canvas.addEventListener('click', e => {
  const freqs = [220, 261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25];
  const freq = freqs[Math.floor(Math.random() * freqs.length)];
  playTone(freq);
  createBurst(e.clientX, e.clientY, freq);
});

function createBurst(x, y, freq) {
  clickCount++;
  const hue = (freq / 880) * 360;
  const brightness = clickCount % 3 === 0 ? 0.6 : 1;
  const burst = {
    x, y,
    hue,
    brightness,
    born: performance.now(),
    life: 5000,
    radius: 0,
    maxRadius: 180 + Math.random() * 100,
    tendrils: [],
  };
  for (let i = 0; i < 8 + Math.random() * 5; i++) {
    burst.tendrils.push({
      angle: (Math.PI * 2 * i) / 8,
      jitter: Math.random() * 0.5 - 0.25
    });
  }
  bursts.push(burst);
}

function drawBurst(b, now) {
  const age = now - b.born;
  const t = age / b.life;
  if (t >= 1) return false;

  // Fade in/out timing
  const alpha = t < 0.2 ? t / 0.2 : t > 0.8 ? (1 - t) / 0.2 : 1;
  const radius = t < 0.5
    ? b.maxRadius * (t / 0.5)
    : b.maxRadius * (1 - (t - 0.5) / 0.5);

  const color = `hsla(${b.hue}, 80%, ${55 * b.brightness}%, ${alpha * 0.7})`;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(b.x, b.y, radius, 0, Math.PI * 2);
  ctx.stroke();

  for (const tdr of b.tendrils) {
    const tx = b.x + Math.cos(tdr.angle) * radius;
    const ty = b.y + Math.sin(tdr.angle) * radius;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    tdr.angle += tdr.jitter * 0.05;
  }
  return true;
}

function animate() {
  // Black fade ensures absolute clearing
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const now = performance.now();
  for (let i = bursts.length - 1; i >= 0; i--) {
    const alive = drawBurst(bursts[i], now);
    if (!alive) bursts.splice(i, 1);
  }
  requestAnimationFrame(animate);
}
animate();
