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
lfoOsc.start();

document.getElementById('volumeSlider').addEventListener('input', e => {
  masterGain.gain.value = e.target.value;
});
document.getElementById('lfoSlider').addEventListener('input', e => {
  lfoOsc.frequency.value = e.target.value;
  lfoGain.gain.value = 0.2;
});

let zoom = 1, cx = -0.7, cy = 0, hue = 0;

function drawMandelbrot() {
  const img = ctx.createImageData(canvas.width, canvas.height);
  const data = img.data;
  const maxIter = 50;
  const zoomFactor = 1 / zoom;
  for (let x = 0; x < canvas.width; x++) {
    for (let y = 0; y < canvas.height; y++) {
      let a = (x - canvas.width / 2) * 4 / canvas.width * zoomFactor + cx;
      let b = (y - canvas.height / 2) * 4 / canvas.width * zoomFactor + cy;
      const ca = a, cb = b;
      let n = 0;
      while (n < maxIter) {
        const aa = a * a - b * b;
        const bb = 2 * a * b;
        a = aa + ca;
        b = bb + cb;
        if (Math.abs(a + b) > 16) break;
        n++;
      }
      const pix = (x + y * canvas.width) * 4;
      const brightness = n === maxIter ? 0 : (n / maxIter) * 100;
      const color = `hsl(${hue + n * 10},100%,${brightness}%)`;
      const tmpCtx = document.createElement('canvas').getContext('2d');
      tmpCtx.fillStyle = color;
      tmpCtx.fillRect(0, 0, 1, 1);
      const cdata = tmpCtx.getImageData(0, 0, 1, 1).data;
      data[pix] = cdata[0];
      data[pix + 1] = cdata[1];
      data[pix + 2] = cdata[2];
      data[pix + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  hue += 0.5;
  requestAnimationFrame(drawMandelbrot);
}
drawMandelbrot();

canvas.addEventListener('click', e => {
  const noteFrequencies = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88];
  const colors = [0, 30, 60, 120, 180, 240, 300];
  const noteIndex = Math.floor(Math.random() * noteFrequencies.length);
  const freq = noteFrequencies[noteIndex];
  hue = colors[noteIndex];

  const osc = audioCtx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = freq;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
  osc.connect(gain).connect(masterGain);
  osc.start();
  osc.stop(audioCtx.currentTime + 1.5);

  cx += (Math.random() - 0.5) * 0.2 / zoom;
  cy += (Math.random() - 0.5) * 0.2 / zoom;
  zoom *= 1.5;
});