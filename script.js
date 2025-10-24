const canvas = document.getElementById('fractalCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let masterGain = audioCtx.createGain();
masterGain.connect(audioCtx.destination);

let lfoOsc = audioCtx.createOscillator();
let lfoGain = audioCtx.createGain();
lfoOsc.connect(lfoGain);
lfoGain.connect(masterGain.gain);
lfoGain.gain.value = 0.15;
lfoOsc.start();

document.getElementById('volumeSlider').addEventListener('input', e => {
  masterGain.gain.value = e.target.value;
});
document.getElementById('lfoSlider').addEventListener('input', e => {
  lfoOsc.frequency.value = e.target.value;
});

let zoom = 1, cx = -0.7, cy = 0, hue = 0;
let t = 0; // time for breathing zoom loop

function drawMandelbrotAsync() {
  const img = ctx.createImageData(canvas.width, canvas.height);
  const data = img.data;
  const maxIter = 70;
  const zoomFactor = 1 / zoom;
  let y = 0;

  function drawRow() {
    const start = performance.now();
    while (y < canvas.height && performance.now() - start < 16) {
      for (let x = 0; x < canvas.width; x++) {
        let a = (x - canvas.width / 2) * 4 / canvas.width * zoomFactor + cx;
        let b = (y - canvas.height / 2) * 4 / canvas.width * zoomFactor + cy;
        const ca = a, cb = b;
        let n = 0;
        while (n < maxIter) {
          const aa = a * a - b * b;
          const bb = 2 * a * b;
          a = aa + ca;
          b = bb + cb;
          if (a * a + b * b > 16) break;
          n++;
        }
        const pix = (x + y * canvas.width) * 4;
        const brightness = n === maxIter ? 0 : (n / maxIter) * 100;
        const color = `hsl(${hue + n * 6},100%,${brightness}%)`;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
      y++;
    }
    if (y < canvas.height) requestAnimationFrame(drawRow);
    else {
      hue += 0.8;
      // breathing zoom effect
      zoom = 1 + Math.sin(t) * 0.3 + 0.5;
      t += 0.02;
      requestAnimationFrame(drawMandelbrotAsync);
    }
  }
  drawRow();
}
drawMandelbrotAsync();

canvas.addEventListener('click', () => {
  const freqs = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88];
  const colors = [0, 30, 60, 120, 180, 240, 300];
  const i = Math.floor(Math.random() * freqs.length);
  hue = colors[i];

  const osc = audioCtx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = freqs[i];
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
  osc.connect(gain).connect(masterGain);
  osc.start();
  osc.stop(audioCtx.currentTime + 1.5);

  // random walk through fractal space
  cx += (Math.random() - 0.5) * 0.1 / zoom;
  cy += (Math.random() - 0.5) * 0.1 / zoom;
});
