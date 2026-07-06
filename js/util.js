// STARFOLD util.js: namespace, version, palette, RNG, math helpers, audio
'use strict';
window.SF = {};

SF.VERSION = '1.0.1';

// ---- EGA palette -----------------------------------------------------------
SF.P = {
  black:'#000000', blue:'#0000AA', green:'#00AA00', cyan:'#00AAAA',
  red:'#AA0000', magenta:'#AA00AA', brown:'#AA5500', lgray:'#AAAAAA',
  dgray:'#555555', lblue:'#5555FF', lgreen:'#55FF55', lcyan:'#55FFFF',
  lred:'#FF5555', lmagenta:'#FF55FF', yellow:'#FFFF55', white:'#FFFFFF'
};

// ---- deterministic RNG -----------------------------------------------------
SF.mulberry32 = function (seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
SF.hash = function (...ns) {           // integer hash of several numbers
  let h = 2166136261 >>> 0;
  for (const n of ns) {
    h ^= (n | 0) + 0x9e3779b9; h = Math.imul(h, 16777619);
    h ^= h >>> 13;
  }
  return h >>> 0;
};
SF.ri = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));   // int in [a,b]
SF.rf = (rng, a, b) => a + rng() * (b - a);
SF.choice = (rng, arr) => arr[Math.floor(rng() * arr.length)];
SF.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
SF.dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
// sum the values of a free-form map (cargo/tv holds), optionally transformed
SF.sumMap = (obj, fn) => { let s = 0; for (const k in obj) s += fn ? fn(k, obj[k]) : obj[k]; return s; };
// the 8-point compass label from (fx,fy) toward (tx,ty)
SF.COMPASS = ['EAST', 'SOUTHEAST', 'SOUTH', 'SOUTHWEST', 'WEST', 'NORTHWEST', 'NORTH', 'NORTHEAST'];
SF.compassDir = (fx, fy, tx, ty) => {
  const a = Math.atan2(ty - fy, tx - fx);
  return SF.COMPASS[Math.round(((a + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4)) % 8];
};

// word wrap by character count (monospace rendering)
SF.wrap = function (text, cols) {
  const out = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const w of para.split(' ')) {
      if (line.length === 0) line = w;
      else if (line.length + 1 + w.length <= cols) line += ' ' + w;
      else { out.push(line); line = w; }
    }
    out.push(line);
  }
  return out;
};

SF.roman = n => ['I','II','III','IV','V','VI','VII','VIII'][n] || String(n + 1);
SF.fmt = n => Math.round(n).toLocaleString('en-US');

// ---- audio (WebAudio bleeps, created on first user gesture) ----------------
SF.sfx = (function () {
  let ac = null;
  function ctx() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } }
    if (ac && ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(freq, dur, type, vol, when, slide) {
    const a = ctx(); if (!a) return;
    const t0 = a.currentTime + (when || 0);
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t0 + dur);
    g.gain.setValueAtTime(vol || 0.06, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(a.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  return {
    unlock() { ctx(); },
    blip()    { tone(880, 0.04, 'square', 0.04); },
    move()    { tone(440, 0.03, 'square', 0.03); },
    confirm() { tone(660, 0.06, 'square', 0.05); tone(990, 0.08, 'square', 0.05, 0.06); },
    deny()    { tone(180, 0.12, 'sawtooth', 0.06); },
    alert()   { for (let i = 0; i < 3; i++) tone(920, 0.16, 'square', 0.07, i * 0.22, 500); },
    laser()   { tone(1400, 0.18, 'sawtooth', 0.06, 0, 200); },
    boom()    { tone(120, 0.5, 'sawtooth', 0.10, 0, 40); tone(80, 0.6, 'square', 0.08, 0.05, 30); },
    hit()     { tone(220, 0.15, 'sawtooth', 0.07, 0, 90); },
    mine()    { tone(300, 0.05, 'square', 0.05); tone(500, 0.05, 'square', 0.05, 0.06); },
    warp()    { for (let i = 0; i < 10; i++) tone(200 + i * 140, 0.09, 'sine', 0.05, i * 0.05); },
    comm()    { tone(700, 0.05, 'sine', 0.05); tone(900, 0.05, 'sine', 0.05, 0.07); tone(1100, 0.07, 'sine', 0.05, 0.14); },
    jingle()  { const m = [523, 659, 784, 1047, 784, 1047]; m.forEach((f, i) => tone(f, 0.18, 'triangle', 0.06, i * 0.15)); },
    somber()  { const m = [392, 311, 262, 196]; m.forEach((f, i) => tone(f, 0.35, 'triangle', 0.06, i * 0.3)); }
  };
})();
