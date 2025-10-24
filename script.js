const canvas = document.getElementById('fractalCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

ctx.globalCompositeOperation = 'lighter';
let fadeOpacity = 0.12;

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
  const brightness = clickCount % 3 === 0 ? 0.4 : 1; // every 3rd note dimmer
  const tendrils = [];
  const branches = 6 + Math.floor(Math.random() * 8);
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
    brightness,
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

    const fadeIn = Math.min(lifeRatio * 3, 1);
    const fadeOut = 1 - Math.max(0, (lifeRatio - 0.7) / 0.3);
    const alpha = fadeIn * fadeOut * b.brightness;

    b.radius += 3;
    const color = `hsla(${b.hue + now * 0.05}, 100%, ${60 * b.brightness}%, ${alpha})`;

    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = alpha;
    ctx.stroke();

    for (const t of b.tendrils) {
      const last = t.path[t.path.length - 1];
      const nx = last.x + Math.cos(t.angle) * 6;
      const ny = last.y + Math.sin(t.angle) * 6;
      t.path.push({ x: nx, y: ny });
      if (Math.random() < 0.3) t.angle += (Math.random() - 0.5) * 0.3;
      drawTendril(t, color, alpha);
    }
  }

  ctx.globalAlpha = 1;
  requestAnimationFrame(animate);
}
animate();
