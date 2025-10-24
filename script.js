// === Lightning Overlay System ===
const overlay = document.createElement('canvas');
overlay.width = canvas.width;
overlay.height = canvas.height;
overlay.style.position = 'absolute';
overlay.style.top = 0;
overlay.style.left = 0;
overlay.style.pointerEvents = 'none';
document.body.appendChild(overlay);

const ctx2 = overlay.getContext('2d');
ctx2.globalCompositeOperation = 'lighter';
ctx2.fillStyle = 'rgba(0,0,0,0.1)';

let bursts = [];

function playTone(freq) {
  const osc = audioCtx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = freq;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 1.5);
}

function colorFromFreq(f) {
  const hue = (f / 880.0) * 360;
  return `hsl(${hue},100%,60%)`;
}

function createBurst(x, y, freq) {
  const color = colorFromFreq(freq);
  const tendrils = [];
  const branches = 5 + Math.floor(Math.random() * 8);
  for (let i = 0; i < branches; i++) {
    tendrils.push({
      angle: (i / branches) * Math.PI * 2,
      path: [{ x, y }],
    });
  }
  bursts.push({ x, y, color, radius: 0, alpha: 1, tendrils });
}

overlay.addEventListener('click', (e) => {
  const freqs = [261.63,293.66,329.63,349.23,392,440,493.88];
  const freq = freqs[Math.floor(Math.random() * freqs.length)];
  playTone(freq);
  createBurst(e.clientX, e.clientY, freq);
});

function drawBurst(b) {
  ctx2.globalAlpha = b.alpha;
  ctx2.strokeStyle = b.color;
  ctx2.beginPath();
  ctx2.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
  ctx2.stroke();
  for (let t of b.tendrils) {
    const last = t.path[t.path.length - 1];
    const nx = last.x + Math.cos(t.angle) * (6 + Math.random() * 4);
    const ny = last.y + Math.sin(t.angle) * (6 + Math.random() * 4);
    t.path.push({ x: nx, y: ny });
    if (Math.random() < 0.2) t.angle += (Math.random() - 0.5) * 0.5;
    ctx2.beginPath();
    ctx2.moveTo(t.path[0].x, t.path[0].y);
    for (let i = 1; i < t.path.length; i++) ctx2.lineTo(t.path[i].x, t.path[i].y);
    ctx2.stroke();
  }
}

function animateOverlay() {
  ctx2.fillRect(0, 0, overlay.width, overlay.height);
  for (let i = bursts.length - 1; i >= 0; i--) {
    let b = bursts[i];
    b.radius += 4;
    b.alpha -= 0.015;
    drawBurst(b);
    if (b.alpha <= 0) bursts.splice(i, 1);
  }
  ctx2.globalAlpha = 1.0;
  requestAnimationFrame(animateOverlay);
}
animateOverlay();
