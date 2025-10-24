// 🌸 Fractal Mandala Ripple – WebGL Hybrid v1
// Built for Infinite Resonance Lab
// Eli Parker + Lennard

const canvas = document.getElementById('fractalCanvas') || (() => {
  const c = document.createElement('canvas');
  c.id = 'fractalCanvas';
  document.body.style.margin = '0';
  document.body.style.background = 'black';
  document.body.appendChild(c);
  return c;
})();
const gl = canvas.getContext('webgl');
canvas.width = innerWidth;
canvas.height = innerHeight;

if (!gl) alert("WebGL not supported on this device.");

// Audio system
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let masterGain = audioCtx.createGain();
masterGain.connect(audioCtx.destination);

let lfoOsc = audioCtx.createOscillator();
let lfoGain = audioCtx.createGain();
lfoOsc.connect(lfoGain);
lfoGain.connect(masterGain.gain);
lfoGain.gain.value = 0.15;
lfoOsc.start();

// Shader sources
const vert = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;
const frag = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform int uCount;
uniform vec3 uColor[32];
uniform vec3 uPos[32];
uniform float uSym[32];
uniform float uAmp[32];

float ripple(vec2 uv, vec2 c, float t, float sym, float amp){
  vec2 d = uv - c;
  float r = length(d);
  float a = atan(d.y,d.x);
  float n = cos(a * sym) * sin(r * 15.0 - t * 3.0) * amp;
  return exp(-r * 3.0) * n;
}

void main() {
  vec2 uv = (gl_FragCoord.xy / uRes.xy) * 2.0 - 1.0;
  uv.x *= uRes.x / uRes.y;
  vec3 col = vec3(0.0);
  for(int i=0;i<32;i++){
    if(i>=uCount) break;
    float r = ripple(uv, uPos[i], uTime, uSym[i], uAmp[i]);
    col += uColor[i] * (r + 0.5);
  }
  gl_FragColor = vec4(pow(col, vec3(0.8)), 1.0);
}`;

// Shader util
function compile(type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
  return s;
}
const program = gl.createProgram();
gl.attachShader(program, compile(gl.VERTEX_SHADER, vert));
gl.attachShader(program, compile(gl.FRAGMENT_SHADER, frag));
gl.linkProgram(program);
gl.useProgram(program);

const verts = new Float32Array([-1,-1, 1,-1, -1,1, 1,1]);
const buf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buf);
gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
const posLoc = gl.getAttribLocation(program, 'aPos');
gl.enableVertexAttribArray(posLoc);
gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

// Uniforms
const uRes = gl.getUniformLocation(program, 'uRes');
const uTime = gl.getUniformLocation(program, 'uTime');
const uCount = gl.getUniformLocation(program, 'uCount');
const uColor = gl.getUniformLocation(program, 'uColor[0]');
const uPos = gl.getUniformLocation(program, 'uPos[0]');
const uSym = gl.getUniformLocation(program, 'uSym[0]');
const uAmp = gl.getUniformLocation(program, 'uAmp[0]');

let ripples = [];

function addRipple(x, y, freq) {
  const hue = (freq / 880.0) * 360.0;
  const c = hslToRgb(hue / 360, 1.0, 0.6);
  const nx = (x / canvas.width) * 2 - 1;
  const ny = ((canvas.height - y) / canvas.height) * 2 - 1;
  const sym = 3 + Math.floor(Math.random() * 10);
  ripples.push({
    pos: [nx, ny],
    color: c,
    sym,
    amp: 0.5 + Math.random() * 0.5,
    birth: performance.now()
  });
  if (ripples.length > 32) ripples.shift();
}

function hslToRgb(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h * 12) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return color;
  };
  return [f(0), f(8), f(4)];
}

// Tone trigger
canvas.addEventListener('click', (e) => {
  const freqs = [261.63,293.66,329.63,349.23,392,440,493.88];
  const freq = freqs[Math.floor(Math.random() * freqs.length)];
  const osc = audioCtx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = freq;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
  osc.connect(gain).connect(masterGain);
  osc.start();
  osc.stop(audioCtx.currentTime + 1.5);
  addRipple(e.clientX, e.clientY, freq);
});

// Animation
function render(t) {
  gl.uniform2f(uRes, canvas.width, canvas.height);
  gl.uniform1f(uTime, t * 0.001);

  const now = performance.now();
  const active = ripples.map(r => {
    const age = (now - r.birth) * 0.001;
    const fade = Math.max(0, 1 - age * 0.3);
    return { ...r, amp: r.amp * fade };
  }).filter(r => r.amp > 0.01);

  const cols = active.flatMap(r => r.color);
  const poses = active.flatMap(r => r.pos);
  const syms = active.map(r => r.sym);
  const amps = active.map(r => r.amp);

  while (cols.length < 96) cols.push(0);
  while (poses.length < 64) poses.push(0);
  while (syms.length < 32) syms.push(0);
  while (amps.length < 32) amps.push(0);

  gl.uniform1i(uCount, active.length);
  gl.uniform3fv(uColor, new Float32Array(cols));
  gl.uniform3fv(uPos, new Float32Array([...poses, 0,0,0]));
  gl.uniform1fv(uSym, new Float32Array(syms));
  gl.uniform1fv(uAmp, new Float32Array(amps));

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  requestAnimationFrame(render);
}
requestAnimationFrame(render);
