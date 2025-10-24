const canvas = document.getElementById('fractalCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

ctx.globalCompositeOperation = 'lighter';
const bursts = [];
let clickCount = 0;

// ==== SOUND ====
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const masterGain = audioCtx.createGain();
masterGain.connect(audioCtx.destination);

const lfoOsc = audioCtx.createOscillator();
const lfoGain = audioCtx.createGain();
lfoOsc.connect(lfoGain);
lfoGain.connect(masterGain.gain);
lfoGain.gain.value = 0.2;
lfoOsc.frequency.value = 0.25;
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

// ==== VISUAL ====
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
    radius: 0,
    maxRadius: 150 + Math.random() * 100,
    phase: 'expand',
    life: 5000,
    alpha: 1,
    tendrils: []
  };
  for (let i = 0; i < 8 + Math.random() * 5; i++) {
    burst.tendrils.push({
      angle: (Math.PI * 2 * i) / 8,
      length: 0
    });
  }
  bursts.push(burst);
}

function updateBurst(b, now) {
  const age = now - b.born;

  if (age > b.life) return false; // remove burst

  // Expand first 2.5s, contract next 2.5s
  const halfLife = b.life / 2;
  if (age < halfLife) {
    b.radius = (age / halfLife) * b.maxRadius;
    b.alpha = Math.min(1, age / 1000);
  } else {
    const t = (age - halfLife) / halfLife;
    b.radius = b.maxRadius * (1 - t);
    b.alpha = 1 - t;
  }

  // Draw ring
  const color = `hsla(${b.hue}, 80%, ${60 * b.brightness}%, ${b.alpha})`;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
  ctx.stroke();

  // Draw tendrils
  for (const t of b.tendrils) {
    const tx = b.x + Math.cos(t.angle) * b.radius;
    const ty = b.y + Math.sin(t.angle) * b.radius;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(tx, ty);
    ctx.stroke();
  }

  return true;
}

function animate() {
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const now = performance.now();
  for (let i = bursts.length - 1; i >= 0; i--) {
    if (!updateBurst(bursts[i], now)) bursts.splice(i, 1);
  }
  requestAnimationFrame(animate);
}
animate();
