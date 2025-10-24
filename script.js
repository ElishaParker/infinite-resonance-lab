const canvas = document.getElementById('fractalCanvas');
const ctx = canvas.getContext('2d');
canvas.width = innerWidth;
canvas.height = innerHeight;

const bursts = [];
let clickCount = 0;

// ==== AUDIO ====
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const masterGain = audioCtx.createGain();
masterGain.connect(audioCtx.destination);

const lfoOsc = audioCtx.createOscillator();
const lfoGain = audioCtx.createGain();
lfoOsc.connect(lfoGain);
lfoGain.connect(masterGain.gain);
lfoGain.gain.value = 0.2;
lfoOsc.frequency.value = 1.3;
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

// ==== COLOR MAP ====
function frequencyToColor(freq) {
  // Map each piano frequency to a unique hue range
  const baseHue = (Math.log(freq) * 137.508) % 360; // quasi-random hue spread
  const sat = 70 + Math.random() * 333;
  const light = 50 + Math.random() * 111;
  return { hue: baseHue, sat, light };
}

// ==== VISUAL ====
canvas.addEventListener('click', e => {
  const freqs = [220, 261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25];
  const freq = freqs[Math.floor(Math.random() * freqs.length)];
  playTone(freq);
  const color = frequencyToColor(freq);
  createBurst(e.clientX, e.clientY, color);
});

function createBurst(x, y, color) {
  clickCount++;
  const burst = {
    x, y,
    hue: color.hue,
    sat: color.sat,
    light: color.light,
    born: performance.now(),
    life: 5000,
    radius: 0,
    maxRadius: 200 + Math.random() * 120,
    tendrils: []
  };
  for (let i = 0; i < 10 + Math.random() * 8; i++) {
    burst.tendrils.push({
      angle: (Math.PI * 2 * i) / 10,
      jitter: Math.random() * 0.5 - 0.25,
      length: 0
    });
  }
  bursts.push(burst);
}

function drawBurst(b, now) {
  const age = now - b.born;
  const t = age / b.life;
  if (t >= 1) return true;

  // Ease in/out + radius growth
  const fadeIn = Math.min(t / 0.2, 1);
  const fadeOut = Math.max(0, 1 - (t - 0.6) / 0.4);
  const alpha = Math.min(fadeIn * fadeOut, 1);
  const radius = t < 0.5 ? b.maxRadius * (t / 0.5) : b.maxRadius * (1 - (t - 0.5) / 0.5);

  // Multi-hue lightning gradient
  const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, radius);
  grad.addColorStop(0, `hsla(${b.hue}, ${b.sat}%, ${b.light + 15}%, ${alpha})`);
  grad.addColorStop(0.5, `hsla(${(b.hue + 90) % 360}, ${b.sat}%, ${b.light}%, ${alpha * 0.7})`);
  grad.addColorStop(1, `hsla(${(b.hue + 180) % 360}, ${b.sat}%, 10%, 0)`);

  ctx.strokeStyle = `hsla(${b.hue}, ${b.sat}%, ${b.light}%, ${alpha})`;
  ctx.lineWidth = 0.5;

  ctx.beginPath();
  ctx.arc(b.x, b.y, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Draw tendrils with electric-like pulse
  for (const tdr of b.tendrils) {
    const tx = b.x + Math.cos(tdr.angle) * radius;
    const ty = b.y + Math.sin(tdr.angle) * radius;
    ctx.strokeStyle = grad;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    tdr.angle += tdr.jitter * 0.33;
  }
  return true;
}

function animate() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const now = performance.now();
  for (let i = bursts.length - 1; i >= 0; i--) {
    const alive = drawBurst(bursts[i], now);
    if (!alive) bursts.splice(i, 1);
  }
  requestAnimationFrame(animate);
}
animate();
