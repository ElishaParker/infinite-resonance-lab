const canvas = document.getElementById('fractalCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

ctx.globalCompositeOperation = 'lighter';
let fadeOpacity = 0.25; // stronger fade veil

function clearCanvas() {
  ctx.fillStyle = `rgba(0,0,0,${fadeOpacity})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// === Audio Setup ===
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const masterGain = audioCtx.createGain();
masterGain.connect(audioCtx.destination);

const lfoOsc = audioCtx.createOscillator();
const lfoGain = audioCtx.createGain();
lfoOsc.connect(lfoGain);
lfoGain.connect(masterGain.gain);
lfoGain.gain.value = 0.25;
lfoOsc.frequency.value = 0.2;
lfoOsc.start();

document.getElementById('volume').addEventListener('input', (e) => {
  masterGain.gain.value = e.target.value;
});
document.getElementById('lfo').addEventListener('input', (e) => {
  lfoGain.gain.value = e.target.value;
});

// === Burst Data ===
const bursts = [];
let clickCount = 0;

function playTone(freq) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
  osc.connect(gain).connect(masterGain);
  osc.start();
  osc.stop(audioCtx.currentTime + 1.3);
}

function createBurst(x, y, freq) {
  clickCount++;
  const hue = (freq / 880) * 360;
  const dimFactor = clickCount % 3 === 0 ? 0.5 : 1; // every 3rd note dimmer
  const tendrils = [];
  const branches = 5 + Math.floor(Math.random() * 7);
  for (let i = 0; i < branches; i++) {
    tendrils.push({
      angle: (i / branches) * Math.PI * 2 + Math.random() * 0.2,
      path: [{ x, y }],
    });
  }
  bursts.push({
    x,
    y,
    hue,
    freq,
    radius: 0,
    alpha: 0,
    born: performance.now(),
    life: 5000,
    brightness: dimFactor,
    saturation: 60 + Math.random() * 20,
    tendrils,
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
  ctx.lineWidth = 1 + intensity * 2;
  ctx.beginPath();
  ctx.moveTo(t.path[0].x, t.path[0].y);
  for (let i = 1; i < t.path.length; i++) ctx.lineTo(t.path[i].x, t.path[i].y);
  ctx.stroke();
}

function animate() {
  clearCanvas();
  const now = performance.now();

  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i];
    const age = now - b.born;
    const lifeRatio = age / b.life;

    if (lifeRatio >= 1) {
      bursts.splice(i, 1);
      continue;
    }

    const fadeIn = Math.min(lifeRatio * 2, 1);
    const fadeOut = 1 - Math.max(0, (lifeRatio - 0.6) / 0.4);
    const alpha = Math.min(fadeIn * fadeOut * b.brightness, 0.8); // clamp alpha

    b.radius += 2.5;
    const color = `hsla(${b.hue + now * 0.04}, ${b.saturation}%, ${55 * b.brightness}%, ${alpha})`;

    // Draw main pulse ring
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = alpha;
    ctx.stroke();

    // Animate tendrils
    for (const t of b.tendrils) {
      const last = t.path[t.path.length - 1];
      const nx = last.x + Math.cos(t.angle) * 5;
      const ny = last.y + Math.sin(t.angle) * 5;
      t.path.push({ x: nx, y: ny });
      if (Math.random() < 0.25) t.angle += (Math.random() - 0.5) * 0.3;
      drawTendril(t, color, alpha);
    }
  }

  ctx.globalAlpha = 1;
  requestAnimationFrame(animate);
}
animate();
