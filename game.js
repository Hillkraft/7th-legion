/* Exile Front — an original real-time strategy game for the browser.
 * Single file, no dependencies. Works with touch (iPhone/iPad) and mouse/keyboard. */
'use strict';
(function () {

// =====================================================================
// Constants & data
// =====================================================================
const TILE = 32;
const STEP = 1 / 30;
const MAX_UNITS = 50;
const CARD_INTERVAL = 40;
const KILLS_PER_CARD = 6;
const HAND_MAX = 5;

const TEAM = [
  { main: '#38b6d1', dark: '#175e70', light: '#a8eefc', name: 'Exile Corps' },
  { main: '#d9533b', dark: '#6e2115', light: '#ffb19d', name: 'Directorate' },
];
const NEUTRAL_COL = { main: '#9a9a8c', dark: '#4a4a42', light: '#d8d8cc' };

const ARMOR_MOD = {
  bullet: { light: 1.0, medium: 0.55, heavy: 0.25, structure: 0.25 },
  rocket: { light: 0.35, medium: 1.25, heavy: 1.3, structure: 0.9 },
  shell:  { light: 0.7, medium: 1.0, heavy: 1.0, structure: 1.1 },
  arty:   { light: 1.1, medium: 0.9, heavy: 0.7, structure: 1.5 },
  laser:  { light: 0.9, medium: 1.0, heavy: 0.9, structure: 0.8 },
  blast:  { light: 1.0, medium: 1.0, heavy: 0.8, structure: 0.8 },
};

const UNITS = {
  trooper:  { name: 'Trooper',  cost: 60,  hp: 70,  speed: 1.7, sight: 7, armor: 'light',  size: 7,  inf: true,
              weapon: { type: 'bullet', dmg: 7,  range: 4.2, rof: 0.7, proj: 'bullet' } },
  lancer:   { name: 'Lancer',   cost: 100, hp: 60,  speed: 1.5, sight: 7, armor: 'light',  size: 7,  inf: true,
              weapon: { type: 'rocket', dmg: 26, range: 5.2, rof: 2.0, proj: 'rocket' } },
  engineer: { name: 'Engineer', cost: 80,  hp: 55,  speed: 1.7, sight: 6, armor: 'light',  size: 7,  inf: true,
              weapon: null, repair: 16 },
  raider:   { name: 'Raider',   cost: 120, hp: 130, speed: 3.6, sight: 9, armor: 'medium', size: 10,
              weapon: { type: 'bullet', dmg: 6,  range: 4.2, rof: 0.33, proj: 'bullet' } },
  tank:     { name: 'Bulwark',  cost: 240, hp: 380, speed: 1.9, sight: 7, armor: 'heavy',  size: 13,
              weapon: { type: 'shell',  dmg: 38, range: 5.2, rof: 1.7, proj: 'shell' } },
  howler:   { name: 'Howler',   cost: 280, hp: 150, speed: 1.5, sight: 8, armor: 'medium', size: 12,
              weapon: { type: 'arty',   dmg: 52, range: 9.5, minRange: 2.5, rof: 3.6, proj: 'arty', splash: 1.4 } },
  colossus: { name: 'Colossus', cost: 480, hp: 850, speed: 1.15, sight: 8, armor: 'heavy', size: 17,
              weapon: { type: 'laser',  dmg: 30, range: 6.2, rof: 1.1, proj: 'laser', shots: 2 } },
};
const BUILD_ORDER = ['trooper', 'lancer', 'engineer', 'raider', 'tank', 'howler', 'colossus'];
const buildTime = (t) => 2 + UNITS[t].cost / 45;

const BUILDINGS = {
  hq:     { name: 'Command Base', hp: 3000, size: 3, sight: 9, armor: 'structure',
            weapon: { type: 'bullet', dmg: 9, range: 6, rof: 0.45, proj: 'bullet' } },
  relay:  { name: 'Relay Tower', hp: 1, size: 2, sight: 5, armor: 'structure' },
  turret: { name: 'Sentry', hp: 450, size: 1, sight: 8, armor: 'structure',
            weapon: { type: 'laser', dmg: 22, range: 6.5, rof: 1.0, proj: 'laser' } },
};

const CARDS = {
  orbital:   { name: 'Orbital Lance', icon: '☄', target: 'point', radius: 3.5, color: '#ff7043', w: 3,
               desc: 'Heavy strike on an area after 2s.' },
  mend:      { name: 'Nanite Mend',   icon: '✚', target: 'none', color: '#66bb6a', w: 3,
               desc: 'Heal all your units by 50%.' },
  overclock: { name: 'Overclock',     icon: '⚡', target: 'none', color: '#ffca28', w: 3,
               desc: 'Units move & fire 50% faster for 20s.' },
  emp:       { name: 'EMP Burst',     icon: '✺', target: 'point', radius: 4, color: '#42a5f5', w: 3,
               desc: 'Disable enemies in an area for 8s.' },
  droppod:   { name: 'Drop Pod',      icon: '⬇', target: 'point', radius: 1.5, visible: true, color: '#ab47bc', w: 3,
               desc: '4 Troopers and a Lancer land.' },
  sabotage:  { name: 'Sabotage',      icon: '☠', target: 'none', color: '#a1887f', w: 2,
               desc: 'Enemy loses 300 credits; production halts 12s.' },
  sentry:    { name: 'Sentry Drop',   icon: '⛨', target: 'point', radius: 0.7, visible: true, color: '#26a69a', w: 2,
               desc: 'Deploy a defensive turret.' },
  mines:     { name: 'Minefield',     icon: '✹', target: 'point', radius: 2.5, visible: true, color: '#cfd8dc', w: 2,
               desc: 'Scatter 7 hidden mines.' },
  bounty:    { name: 'War Bounty',    icon: '$', target: 'none', color: '#d4e157', w: 2,
               desc: 'Double kill bounties for 30s.' },
};
const CARD_KEYS = ['Z', 'X', 'C', 'V', 'B'];

const DIFFS = {
  easy:   { name: 'Recruit', income: 0.75, think: 3.0, wave: 6, waveGrow: 1, waveMax: 12, cardEvery: 10, firstWave: 150 },
  normal: { name: 'Veteran', income: 1.0,  think: 2.0, wave: 7, waveGrow: 2, waveMax: 16, cardEvery: 7,  firstWave: 100 },
  hard:   { name: 'Elite',   income: 1.3,  think: 1.5, wave: 8, waveGrow: 2, waveMax: 20, cardEvery: 5,  firstWave: 75 },
  brutal: { name: 'Legend',  income: 1.65, think: 1.0, wave: 9, waveGrow: 3, waveMax: 24, cardEvery: 4,  firstWave: 55 },
};

const CAMPAIGN = [
  { title: 'Landfall', seed: 1101, size: 56, relays: 4, diff: 'easy', credits: 800,
    player: { trooper: 5, lancer: 2, raider: 1, engineer: 1 }, enemy: { trooper: 3 }, turrets: 0,
    brief: 'Three generations ago the Directorate sealed themselves inside Earth\'s last clean cities and left the rest of us on the ice of Callisto to die.\n\nWe did not die.\n\nCommander, your dropships are down in the Ash Basin. A small Directorate outpost guards the valley. Capture the relay towers to fund your army, then level their Command Base.' },
  { title: 'The Relay Line', seed: 2207, size: 64, relays: 6, diff: 'normal', credits: 900,
    player: { trooper: 4, lancer: 2, engineer: 1 }, enemy: { trooper: 4, lancer: 2 }, turrets: 1,
    brief: 'The Directorate funds its patrols through a chain of relay towers across the Saltflats.\n\nWhoever holds the line holds the purse. Take the towers, hold them against counter-attacks, and push into their base.\n\nIntel: their commanders carry tactical cards too. Expect orbital fire.' },
  { title: 'Iron Curtain', seed: 3313, size: 64, relays: 6, diff: 'normal', credits: 1200,
    player: { trooper: 4, lancer: 3, tank: 1, engineer: 1 }, enemy: { trooper: 4, tank: 2, howler: 1 }, turrets: 4,
    brief: 'A fortified Directorate depot blocks the pass to the coast. Sentry guns ring the base.\n\nHowler artillery can shell the sentries from beyond their reach. Use it.' },
  { title: 'Scorched Valley', seed: 4421, size: 72, relays: 8, diff: 'hard', credits: 1000,
    player: { trooper: 4, lancer: 2, raider: 2, engineer: 1 }, enemy: { trooper: 6, lancer: 2, raider: 2, tank: 1 }, turrets: 2,
    brief: 'Their elite armored division has arrived. They are better equipped and better paid than any force we have faced.\n\nOut-think them. Seize the relays early, keep your veterans alive, and save your cards for the moment that matters.' },
  { title: 'The Citadel', seed: 5531, size: 80, relays: 9, diff: 'brutal', credits: 1500,
    player: { trooper: 6, lancer: 4, tank: 2, howler: 1, engineer: 2 }, enemy: { trooper: 6, lancer: 4, tank: 3, colossus: 2 }, turrets: 6,
    brief: 'This is it. Beyond this valley lies the Citadel, the seat of the Directorate.\n\nThey will throw everything they have at us, including Colossus walkers.\n\nFor everyone they left on the ice, Commander. Bring it down.' },
];

// =====================================================================
// Utilities
// =====================================================================
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const hypot = Math.hypot;
const dist = (a, b) => hypot(a.x - b.x, a.y - b.y);
function angDiff(a, b) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
function turnTo(a, b, step) {
  const d = angDiff(a, b);
  return Math.abs(d) <= step ? b : a + Math.sign(d) * step;
}
const rnd = (a, b) => a + Math.random() * (b - a);
const $ = (id) => document.getElementById(id);

function store(key, val) {
  try {
    if (val === undefined) return JSON.parse(localStorage.getItem(key));
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) { return null; }
  return null;
}

// =====================================================================
// Audio (all synthesized)
// =====================================================================
const Sound = {
  ctx: null, master: null, noiseBuf: null, last: {}, enabled: store('ef_sound') !== false,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.45;
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;
    } catch (e) { this.ctx = null; }
  },
  noise(out, t, dur, vol, type, f0, f1) {
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; f.type = type;
    f.frequency.setValueAtTime(f0, t);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(out);
    s.start(t, Math.random() * 0.4); s.stop(t + dur + 0.05);
  },
  tone(out, t, type, f0, f1, dur, vol) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
  },
  play(kind, wx, wy) {
    if (!this.ctx || !this.enabled || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const gap = { mg: 0.05, laser: 0.07, rocket: 0.08, shell: 0.09, arty: 0.15, boom: 0.07, big: 0.25, hit: 0.05 }[kind] || 0.04;
    if (this.last[kind] && now - this.last[kind] < gap) return;
    this.last[kind] = now;
    let vol = 1;
    if (wx !== undefined && G) {
      const c = viewCenter();
      const d = hypot(wx - c.x, wy - c.y) / TILE;
      vol = clamp(1.15 - d / 26, 0, 1);
      if (vol < 0.03) return;
    }
    const out = this.ctx.createGain(); out.gain.value = vol; out.connect(this.master);
    const t = now;
    switch (kind) {
      case 'mg': this.noise(out, t, 0.06, 0.25, 'highpass', 1800); break;
      case 'rocket': this.noise(out, t, 0.35, 0.3, 'bandpass', 600, 2400); break;
      case 'shell': this.tone(out, t, 'sine', 140, 40, 0.22, 0.5); this.noise(out, t, 0.15, 0.3, 'lowpass', 1200, 200); break;
      case 'arty': this.tone(out, t, 'triangle', 90, 35, 0.4, 0.6); this.noise(out, t, 0.3, 0.35, 'lowpass', 900, 120); break;
      case 'laser': this.tone(out, t, 'sawtooth', 1400, 260, 0.16, 0.12); break;
      case 'boom': this.noise(out, t, 0.55, 0.6, 'lowpass', 900, 60); this.tone(out, t, 'sine', 80, 30, 0.4, 0.4); break;
      case 'big': this.noise(out, t, 1.4, 0.9, 'lowpass', 1400, 40); this.tone(out, t, 'sine', 60, 20, 1.2, 0.7); break;
      case 'hit': this.noise(out, t, 0.04, 0.12, 'bandpass', 3000); break;
      case 'select': this.tone(out, t, 'square', 660, 880, 0.06, 0.06); break;
      case 'order': this.tone(out, t, 'square', 520, 0, 0.05, 0.05); this.tone(out, t + 0.06, 'square', 780, 0, 0.05, 0.05); break;
      case 'build': this.tone(out, t, 'sine', 300, 900, 0.18, 0.15); break;
      case 'ready': this.tone(out, t, 'triangle', 600, 0, 0.08, 0.15); this.tone(out, t + 0.09, 'triangle', 900, 0, 0.12, 0.15); break;
      case 'card': [523, 659, 784, 1046].forEach((f, i) => this.tone(out, t + i * 0.06, 'triangle', f, 0, 0.18, 0.12)); break;
      case 'draw': this.tone(out, t, 'triangle', 880, 1320, 0.15, 0.1); break;
      case 'alert': this.tone(out, t, 'square', 440, 0, 0.12, 0.1); this.tone(out, t + 0.18, 'square', 440, 0, 0.12, 0.1); break;
      case 'capture': [392, 523, 659].forEach((f, i) => this.tone(out, t + i * 0.08, 'sine', f, 0, 0.2, 0.15)); break;
      case 'deny': this.tone(out, t, 'square', 200, 150, 0.15, 0.1); break;
      case 'emp': this.tone(out, t, 'sawtooth', 2000, 80, 0.7, 0.2); break;
      case 'rank': this.tone(out, t, 'sine', 1046, 0, 0.1, 0.1); this.tone(out, t + 0.1, 'sine', 1568, 0, 0.15, 0.1); break;
    }
  },
};

// =====================================================================
// Map generation
// =====================================================================
function generateMap(seed, size, relayCount) {
  const R = mulberry32(seed * 7919 + 13);
  const W = size, H = size, N = W * H;
  const ter = new Uint8Array(N); // 0 ground, 1 rock, 2 water
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  // point-symmetric so both sides are fair
  const setT = (x, y, v) => {
    if (!inb(x, y)) return;
    ter[y * W + x] = v; ter[(H - 1 - y) * W + (W - 1 - x)] = v;
  };
  const blobs = Math.round(N / 170);
  for (let i = 0; i < blobs; i++) {
    let x = R() * W | 0, y = R() * H | 0;
    const kind = R() < 0.25 ? 2 : 1;
    const steps = 15 + (R() * 50 | 0);
    for (let s = 0; s < steps; s++) {
      setT(x, y, kind);
      if (R() < 0.6) setT(x + 1, y, kind);
      if (R() < 0.6) setT(x, y + 1, kind);
      if (R() < 0.3) setT(x + 1, y + 1, kind);
      x += (R() * 3 | 0) - 1; y += (R() * 3 | 0) - 1;
    }
  }
  for (let pass = 0; pass < 2; pass++) {
    const c = ter.slice();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let n = 0, kindSum = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const v = inb(x + dx, y + dy) ? c[(y + dy) * W + x + dx] : 1;
        if (v) { n++; kindSum += v; }
      }
      const i = y * W + x;
      if (c[i] && n < 2) ter[i] = 0;
      else if (!c[i] && n >= 6) ter[i] = kindSum / n > 1.5 ? 2 : 1;
    }
  }
  const clearCircle = (cx, cy, r) => {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
        if (hypot(x + 0.5 - cx, y + 0.5 - cy) <= r) setT(x, y, 0);
  };
  const carve = (x0, y0, x1, y1, r) => {
    const n = Math.ceil(hypot(x1 - x0, y1 - y0) * 2);
    for (let i = 0; i <= n; i++) clearCircle(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, r);
  };
  const pHQ = { tx: 4, ty: H - 7 }, eHQ = { tx: W - 7, ty: 4 };
  const pc = { x: 5.5, y: H - 5.5 }, ec = { x: W - 5.5, y: 5.5 };
  clearCircle(pc.x, pc.y, 7);

  const relays = [];
  if (relayCount % 2 === 1) relays.push({ tx: W / 2 - 1, ty: H / 2 - 1 });
  const pairs = Math.floor(relayCount / 2);
  let tries = 0;
  while (relays.length < relayCount && tries++ < 4000) {
    const tx = 3 + (R() * (W - 8) | 0), ty = 3 + (R() * (H - 8) | 0);
    const c = { x: tx + 1, y: ty + 1 }, m = { x: W - c.x, y: H - c.y };
    const minD = tries > 2000 ? 6 : 9;
    if (dist(c, pc) < 12 || dist(c, ec) < 12 || dist(c, m) < 8) continue;
    // keep pairs biased toward the player's half for the first of each pair so the split is fair
    let ok = true;
    for (const r of relays) {
      const rc = { x: r.tx + 1, y: r.ty + 1 };
      if (dist(rc, c) < minD || dist(rc, m) < minD) { ok = false; break; }
    }
    if (!ok) continue;
    relays.push({ tx, ty }, { tx: W - 2 - tx, ty: H - 2 - ty });
    if (relays.length >= pairs * 2 + (relayCount % 2)) break;
  }
  for (const r of relays) {
    clearCircle(r.tx + 1, r.ty + 1, 2.6);
    carve(pc.x, pc.y, r.tx + 1, r.ty + 1, 1.3);
  }
  carve(pc.x, pc.y, ec.x, ec.y, 1.4);
  // keep map edges passable-looking but not required
  const craters = [];
  for (let i = 0; i < N / 80; i++) craters.push({ x: R() * W * TILE, y: R() * H * TILE, r: 6 + R() * 22 });
  return { W, H, ter, pHQ, eHQ, relays, craters, seed };
}

// =====================================================================
// Terrain rendering
// =====================================================================
function renderTerrain(map) {
  const { W, H, ter } = map;
  const R = mulberry32(map.seed + 99);
  const c = document.createElement('canvas');
  c.width = W * TILE; c.height = H * TILE;
  const x = c.getContext('2d');
  // smooth value noise
  const gs = 5, gw = Math.ceil(W / gs) + 2, gh = Math.ceil(H / gs) + 2;
  const grid = new Float32Array(gw * gh).map(() => R());
  const noise = (tx, ty) => {
    const fx = tx / gs, fy = ty / gs, ix = Math.floor(fx), iy = Math.floor(fy), ax = fx - ix, ay = fy - iy;
    const s = (t) => t * t * (3 - 2 * t);
    const g = (i, j) => grid[j * gw + i];
    const a = g(ix, iy) + (g(ix + 1, iy) - g(ix, iy)) * s(ax);
    const b = g(ix, iy + 1) + (g(ix + 1, iy + 1) - g(ix, iy + 1)) * s(ax);
    return a + (b - a) * s(ay);
  };
  for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
    const v = noise(tx, ty);
    x.fillStyle = `hsl(${28 + v * 14},${16 + v * 10}%,${22 + v * 9}%)`;
    x.fillRect(tx * TILE, ty * TILE, TILE + 1, TILE + 1);
  }
  for (let i = 0; i < W * H * 7; i++) {
    x.fillStyle = R() < 0.5 ? 'rgba(0,0,0,0.13)' : 'rgba(255,240,210,0.05)';
    const s = 1 + R() * 3;
    x.fillRect(R() * c.width, R() * c.height, s, s);
  }
  // cracked tracks
  x.strokeStyle = 'rgba(0,0,0,0.12)'; x.lineWidth = 1;
  for (let i = 0; i < W * H / 40; i++) {
    let px = R() * c.width, py = R() * c.height;
    x.beginPath(); x.moveTo(px, py);
    for (let k = 0; k < 5; k++) { px += rnd(-14, 14); py += rnd(-14, 14); x.lineTo(px, py); }
    x.stroke();
  }
  for (const cr of map.craters) {
    x.fillStyle = 'rgba(0,0,0,0.22)';
    x.beginPath(); x.ellipse(cr.x, cr.y, cr.r, cr.r * 0.8, 0, 0, 7); x.fill();
    x.strokeStyle = 'rgba(255,230,190,0.08)'; x.lineWidth = 2;
    x.beginPath(); x.ellipse(cr.x - 1, cr.y - 1, cr.r, cr.r * 0.8, 0, 3.4, 5.6); x.stroke();
  }
  const each = (kind, fn) => {
    for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++)
      if (ter[ty * W + tx] === kind) fn(tx * TILE + TILE / 2, ty * TILE + TILE / 2, tx, ty);
  };
  const circ = (cx, cy, r) => { x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); };
  // water
  x.fillStyle = '#2b3a3a'; each(2, (cx, cy) => circ(cx, cy, TILE * 0.85));
  x.fillStyle = '#123544'; each(2, (cx, cy) => circ(cx, cy, TILE * 0.74));
  x.fillStyle = '#184559'; each(2, (cx, cy) => circ(cx, cy, TILE * 0.5));
  x.strokeStyle = 'rgba(160,220,240,0.12)'; x.lineWidth = 1.5;
  each(2, (cx, cy) => { if (R() < 0.4) { x.beginPath(); x.moveTo(cx - 8, cy); x.quadraticCurveTo(cx, cy - 4, cx + 8, cy); x.stroke(); } });
  // rock
  x.fillStyle = 'rgba(0,0,0,0.35)'; each(1, (cx, cy) => circ(cx + 5, cy + 6, TILE * 0.78));
  x.fillStyle = '#4a4640'; each(1, (cx, cy) => circ(cx, cy, TILE * 0.76));
  x.fillStyle = '#5d5850'; each(1, (cx, cy) => circ(cx - 3, cy - 3, TILE * 0.55));
  x.fillStyle = '#726c62'; each(1, (cx, cy) => circ(cx - 6 + R() * 4, cy - 7 + R() * 4, TILE * 0.25));
  x.strokeStyle = 'rgba(0,0,0,0.3)'; x.lineWidth = 1.2;
  each(1, (cx, cy) => {
    if (R() < 0.5) {
      x.beginPath(); x.moveTo(cx + rnd(-10, 10), cy + rnd(-10, 10));
      x.lineTo(cx + rnd(-10, 10), cy + rnd(-10, 10)); x.lineTo(cx + rnd(-10, 10), cy + rnd(-10, 10)); x.stroke();
    }
  });
  return c;
}

function renderMinimapBase(map) {
  const c = document.createElement('canvas');
  c.width = map.W; c.height = map.H;
  const x = c.getContext('2d'), img = x.createImageData(map.W, map.H);
  const cols = [[96, 82, 62], [70, 68, 64], [24, 62, 84]];
  for (let i = 0; i < map.W * map.H; i++) {
    const col = cols[map.ter[i]];
    img.data[i * 4] = col[0]; img.data[i * 4 + 1] = col[1]; img.data[i * 4 + 2] = col[2]; img.data[i * 4 + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return c;
}

// =====================================================================
// Game state
// =====================================================================
let G = null;
let nextId = 1;
let terrainCanvas = null, minimapBase = null, fogCanvas = null, fogCtx = null, fogImg = null;
let viewW = 0, viewH = 0, dpr = 1;
const canvas = $('game');
let ctx = canvas.getContext('2d');

function viewCenter() {
  return { x: G.cam.x + viewW / G.cam.zoom / 2, y: G.cam.y + viewH / G.cam.zoom / 2 };
}

function mkTeam(id, credits) {
  return { id, credits, income: 0, queue: [], prod: 0, hand: [], cardT: 25, killCount: 0, overclock: 0, bounty: 0,
           sabotage: 0, hq: null, rally: null, handVer: 0, built: 0, lost: 0, kills: 0, cardsPlayed: 0, lastAlert: -99 };
}

function startGame(cfg) {
  nextId = 1;
  const map = generateMap(cfg.seed, cfg.size, cfg.relays);
  const W = map.W, H = map.H;
  G = {
    cfg, map, W, H, ter: map.ter, block: new Uint8Array(W * H),
    units: [], buildings: [], projectiles: [], effects: [], strikes: [], pods: [], mines: [], texts: [],
    time: 0, teams: [mkTeam(0, cfg.credits), mkTeam(1, cfg.credits)],
    vis: [new Uint8Array(W * H), new Uint8Array(W * H)], explored: new Uint8Array(W * H), visT: 0,
    selection: [], cam: { x: 0, y: 0, zoom: 1 }, targeting: -1, amove: false, boxMode: false, rallyMode: false,
    over: false, paused: false, shake: 0, marker: null, diff: DIFFS[cfg.diff],
    ai: { t: 0, waveSize: DIFFS[cfg.diff].wave, cardT: 8, attacking: false, target: null },
  };
  for (let i = 0; i < W * H; i++) G.block[i] = map.ter[i] ? 1 : 0;
  allocPathArrays();
  terrainCanvas = renderTerrain(map);
  minimapBase = renderMinimapBase(map);
  fogCanvas = document.createElement('canvas'); fogCanvas.width = W; fogCanvas.height = H;
  fogCtx = fogCanvas.getContext('2d'); fogImg = fogCtx.createImageData(W, H);

  const phq = createBuilding('hq', 0, map.pHQ.tx, map.pHQ.ty);
  const ehq = createBuilding('hq', 1, map.eHQ.tx, map.eHQ.ty);
  G.teams[0].hq = phq; G.teams[1].hq = ehq;
  G.teams[0].rally = { x: phq.x + 3 * TILE, y: phq.y - 3 * TILE };
  G.teams[1].rally = { x: ehq.x - 3 * TILE, y: ehq.y + 3 * TILE };
  for (const r of map.relays) createBuilding('relay', -1, r.tx, r.ty);

  // enemy sentries
  for (let k = 0; k < (cfg.turrets || 0); k++) {
    const a = Math.PI * 0.75 + (k - (cfg.turrets - 1) / 2) * 0.45;
    const rr = 5 + (k % 2) * 2.5;
    const t = nearestWalkable(Math.round(map.eHQ.tx + 1 + Math.cos(a) * rr), Math.round(map.eHQ.ty + 1 + Math.sin(a) * rr));
    if (t) createBuilding('turret', 1, t.x, t.y);
  }
  spawnGroup(0, cfg.player, phq);
  spawnGroup(1, cfg.enemy, ehq);
  for (const tm of G.teams) { drawCard(tm, true); drawCard(tm, true); }

  const s = viewSize();
  G.cam.zoom = clamp(Math.min(s.w, s.h) / 520, 0.6, 1.3);
  centerCamera(phq.x + 4 * TILE, phq.y - 4 * TILE);
  updateVisibility();
  buildHud();
  showScreen(null);
  $('hud').classList.remove('hidden');
  setToggle('amove', false); setToggle('box', false);
  ticker(cfg.title ? `${cfg.title} — destroy the enemy Command Base` : 'Destroy the enemy Command Base', 'good');
}

function spawnGroup(team, comp, hq) {
  const dir = team === 0 ? { x: 1, y: -1 } : { x: -1, y: 1 };
  const types = [];
  for (const k in comp) for (let i = 0; i < comp[k]; i++) types.push(k);
  const tiles = freeTilesNear(Math.floor(hq.x / TILE + dir.x * 4), Math.floor(hq.y / TILE + dir.y * 4), types.length);
  types.forEach((t, i) => {
    const p = tiles[i % tiles.length];
    createUnit(t, team, (p.x + 0.5) * TILE + rnd(-4, 4), (p.y + 0.5) * TILE + rnd(-4, 4));
  });
}

function createUnit(type, team, x, y) {
  const d = UNITS[type];
  const face = team === 0 ? -Math.PI / 4 : Math.PI * 0.75;
  const u = {
    id: nextId++, kind: 'unit', type, d, team, x, y, hp: d.hp, maxHp: d.hp, r: d.size,
    angle: face, turret: face, cd: Math.random() * 0.5, state: 'idle', path: null, pi: 0,
    target: null, auto: null, destX: x, destY: y, guardX: x, guardY: y, kills: 0, rank: 0,
    stun: 0, scanT: Math.random() * 0.3, repathT: 0, stuckT: 0, lastX: x, lastY: y, role: null,
    flash: 0, walk: Math.random() * 6, dead: false, repairing: null,
  };
  G.units.push(u);
  return u;
}

function createBuilding(type, team, tx, ty) {
  const d = BUILDINGS[type];
  const b = {
    id: nextId++, kind: 'building', type, d, team, tx, ty, size: d.size,
    x: (tx + d.size / 2) * TILE, y: (ty + d.size / 2) * TILE, hp: d.hp, maxHp: d.hp,
    r: d.size * TILE / 2, cd: 0, turret: Math.PI * 0.75, capture: 0, captureTeam: -1, flash: 0, dead: false,
    spin: Math.random() * 6,
  };
  if (type !== 'relay') setBlock(b, 1);
  G.buildings.push(b);
  return b;
}
function setBlock(b, v) {
  for (let y = b.ty; y < b.ty + b.size; y++)
    for (let x = b.tx; x < b.tx + b.size; x++)
      if (x >= 0 && y >= 0 && x < G.W && y < G.H) G.block[y * G.W + x] = v ? 2 : (G.ter[y * G.W + x] ? 1 : 0);
}

const alive = (e) => e && !e.dead;
function rankMult(u) { return 1 + 0.15 * (u.rank || 0); }
function teamUnits(t) { return G.units.filter((u) => u.team === t && !u.dead); }

// =====================================================================
// Grid helpers & pathfinding
// =====================================================================
function walkable(tx, ty) { return tx >= 0 && ty >= 0 && tx < G.W && ty < G.H && !G.block[ty * G.W + tx]; }
function walkablePx(x, y) { return walkable(Math.floor(x / TILE), Math.floor(y / TILE)); }

function nearestWalkable(tx, ty) {
  if (walkable(tx, ty)) return { x: tx, y: ty };
  for (let r = 1; r < 20; r++) {
    let best = null, bd = 1e9;
    for (let y = ty - r; y <= ty + r; y++) for (let x = tx - r; x <= tx + r; x++) {
      if (Math.max(Math.abs(x - tx), Math.abs(y - ty)) !== r || !walkable(x, y)) continue;
      const d = hypot(x - tx, y - ty);
      if (d < bd) { bd = d; best = { x, y }; }
    }
    if (best) return best;
  }
  return null;
}

function freeTilesNear(tx, ty, n) {
  const s = nearestWalkable(tx, ty);
  if (!s) return [{ x: tx, y: ty }];
  const out = [], seen = new Set([s.y * G.W + s.x]), q = [s];
  while (q.length && out.length < n) {
    const c = q.shift(); out.push(c);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = c.x + dx, y = c.y + dy, k = y * G.W + x;
      if (walkable(x, y) && !seen.has(k)) { seen.add(k); q.push({ x, y }); }
    }
  }
  return out;
}

let pG, pF, pCame, pStamp, pClosed, pSearch = 0, pathBudget = 0;
function allocPathArrays() {
  const N = G.W * G.H;
  pG = new Float32Array(N); pF = new Float32Array(N); pCame = new Int32Array(N);
  pStamp = new Uint32Array(N); pClosed = new Uint32Array(N); pSearch = 0;
}
const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];

function findPath(sx, sy, gx, gy) {
  const W = G.W;
  const s = nearestWalkable(sx, sy), g = nearestWalkable(gx, gy);
  if (!s || !g) return [];
  if (s.x === g.x && s.y === g.y) return [];
  pSearch++;
  const start = s.y * W + s.x, goal = g.y * W + g.x;
  const h = (i) => { const dx = Math.abs(i % W - g.x), dy = Math.abs((i / W | 0) - g.y); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); };
  const heap = [start];
  pStamp[start] = pSearch; pG[start] = 0; pF[start] = h(start); pCame[start] = -1;
  let best = start, bestH = pF[start], iter = 0;
  const push = (i) => {
    heap.push(i); let k = heap.length - 1;
    while (k > 0) { const p = (k - 1) >> 1; if (pF[heap[p]] <= pF[heap[k]]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; }
  };
  const pop = () => {
    const top = heap[0], last = heap.pop();
    if (heap.length) {
      heap[0] = last; let k = 0;
      for (;;) {
        const l = 2 * k + 1, r = l + 1; let m = k;
        if (l < heap.length && pF[heap[l]] < pF[heap[m]]) m = l;
        if (r < heap.length && pF[heap[r]] < pF[heap[m]]) m = r;
        if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m;
      }
    }
    return top;
  };
  let found = false;
  while (heap.length && iter++ < 6000) {
    const cur = pop();
    if (pClosed[cur] === pSearch) continue;
    pClosed[cur] = pSearch;
    if (cur === goal) { found = true; break; }
    const cx = cur % W, cy = cur / W | 0;
    const hc = pF[cur] - pG[cur];
    if (hc < bestH) { bestH = hc; best = cur; }
    for (const [dx, dy, cost] of DIRS) {
      const nx = cx + dx, ny = cy + dy;
      if (!walkable(nx, ny)) continue;
      if (dx && dy && (!walkable(cx + dx, cy) || !walkable(cx, cy + dy))) continue;
      const ni = ny * W + nx;
      if (pClosed[ni] === pSearch) continue;
      const ng = pG[cur] + cost;
      if (pStamp[ni] !== pSearch || ng < pG[ni]) {
        pStamp[ni] = pSearch; pG[ni] = ng; pF[ni] = ng + h(ni); pCame[ni] = cur; push(ni);
      }
    }
  }
  let node = found ? goal : best;
  const tiles = [];
  while (node !== -1 && node !== start) { tiles.push(node); node = pCame[node]; }
  tiles.reverse();
  // string pulling
  const pts = tiles.map((i) => ({ x: (i % W + 0.5) * TILE, y: ((i / W | 0) + 0.5) * TILE }));
  const out = [];
  let from = { x: (s.x + 0.5) * TILE, y: (s.y + 0.5) * TILE }, i = 0;
  while (i < pts.length) {
    let j = pts.length - 1;
    while (j > i && !clearLine(from, pts[j])) j--;
    out.push(pts[j]); from = pts[j]; i = j + 1;
  }
  return out;
}
function clearLine(a, b) {
  const d = hypot(b.x - a.x, b.y - a.y), n = Math.ceil(d / (TILE / 4));
  for (let k = 1; k <= n; k++) {
    const x = a.x + (b.x - a.x) * k / n, y = a.y + (b.y - a.y) * k / n;
    // check a little to each side so units don't clip corners
    if (!walkablePx(x, y) || !walkablePx(x + 6, y + 6) || !walkablePx(x - 6, y - 6) || !walkablePx(x + 6, y - 6) || !walkablePx(x - 6, y + 6)) return false;
  }
  return true;
}

function setPath(u, wx, wy) {
  pathBudget--;
  const p = findPath(Math.floor(u.x / TILE), Math.floor(u.y / TILE), Math.floor(wx / TILE), Math.floor(wy / TILE));
  if (walkablePx(wx, wy) && p.length && hypot(p[p.length - 1].x - wx, p[p.length - 1].y - wy) < TILE) p[p.length - 1] = { x: wx, y: wy };
  else if (!p.length && walkablePx(wx, wy) && hypot(u.x - wx, u.y - wy) < TILE * 1.5) p.push({ x: wx, y: wy });
  u.path = p; u.pi = 0; u.stuckT = 0;
}

// =====================================================================
// Orders
// =====================================================================
function orderMove(units, wx, wy, attackMove) {
  if (!units.length) return;
  const tiles = freeTilesNear(Math.floor(wx / TILE), Math.floor(wy / TILE), units.length);
  const sorted = units.slice().sort((a, b) => hypot(a.x - wx, a.y - wy) - hypot(b.x - wx, b.y - wy));
  sorted.forEach((u, i) => {
    const t = tiles[i % tiles.length];
    const tx = (t.x + 0.5) * TILE + (i >= tiles.length ? rnd(-8, 8) : 0), ty = (t.y + 0.5) * TILE + (i >= tiles.length ? rnd(-8, 8) : 0);
    u.state = attackMove && u.d.weapon ? 'amove' : 'move';
    u.target = null; u.auto = null; u.repairing = null;
    u.destX = tx; u.destY = ty;
    setPath(u, tx, ty);
  });
}
function orderAttack(units, target) {
  for (const u of units) {
    if (!u.d.weapon) { orderMove([u], target.x, target.y, false); continue; }
    u.state = 'attack'; u.target = target; u.auto = null; u.path = null; u.repathT = 0;
  }
}
function orderStop(units) {
  for (const u of units) {
    u.state = 'idle'; u.target = null; u.auto = null; u.path = null;
    u.guardX = u.x; u.guardY = u.y;
  }
}

// =====================================================================
// Simulation
// =====================================================================
function update(dt) {
  if (G.over) { updateEffects(dt); return; }
  G.time += dt;
  pathBudget = 24;
  for (const t of G.teams) updateTeam(t, dt);
  for (const u of G.units) if (!u.dead) updateUnit(u, dt);
  separate();
  for (const b of G.buildings) if (!b.dead) updateBuilding(b, dt);
  updateProjectiles(dt);
  updateStrikes(dt);
  updateMines(dt);
  updateEffects(dt);
  updateAI(dt);
  G.visT -= dt;
  if (G.visT <= 0) { G.visT = 0.2; updateVisibility(); }
  if (G.units.some((u) => u.dead)) {
    G.units = G.units.filter((u) => !u.dead);
    G.selection = G.selection.filter((u) => !u.dead);
  }
  if (G.buildings.some((b) => b.dead)) G.buildings = G.buildings.filter((b) => !b.dead);
  checkEnd();
}

function updateTeam(t, dt) {
  const hqAlive = alive(t.hq);
  const relays = G.buildings.filter((b) => b.type === 'relay' && b.team === t.id).length;
  const mul = t.id === 1 ? G.diff.income : 1;
  t.income = ((hqAlive ? 3 : 0) + relays * 5) * mul;
  t.credits += t.income * dt;
  t.overclock = Math.max(0, t.overclock - dt);
  t.bounty = Math.max(0, t.bounty - dt);
  t.sabotage = Math.max(0, t.sabotage - dt);
  // cards
  t.cardT -= dt;
  if (t.cardT <= 0) { t.cardT = CARD_INTERVAL; drawCard(t); }
  // production
  if (t.queue.length && hqAlive && t.sabotage <= 0) {
    const type = t.queue[0];
    t.prod += dt;
    if (t.prod >= buildTime(type)) {
      if (teamUnits(t.id).length < MAX_UNITS) {
        t.queue.shift(); t.prod = 0;
        spawnFromHQ(t, type);
      } else t.prod = buildTime(type);
    }
  }
}

function spawnFromHQ(t, type) {
  const hq = t.hq;
  const dir = t.id === 0 ? 1 : -1;
  const s = nearestWalkable(hq.tx + 1 + dir * 2, hq.ty + 1 - dir * 2);
  if (!s) return;
  const u = createUnit(type, t.id, (s.x + 0.5) * TILE, (s.y + 0.5) * TILE);
  t.built++;
  if (t.rally) orderMove([u], t.rally.x + rnd(-20, 20), t.rally.y + rnd(-20, 20), true);
  if (t.id === 0) { Sound.play('ready'); }
  return u;
}

function queueUnit(t, type) {
  const d = UNITS[type];
  if (!alive(t.hq)) return false;
  if (t.credits < d.cost || t.queue.length >= 8) { if (t.id === 0) Sound.play('deny'); return false; }
  t.credits -= d.cost;
  t.queue.push(type);
  if (t.id === 0) Sound.play('build');
  return true;
}
function cancelUnit(t, type) {
  for (let i = t.queue.length - 1; i >= 0; i--) {
    if (t.queue[i] === type) {
      t.queue.splice(i, 1);
      if (i === 0) t.prod = 0;
      t.credits += UNITS[type].cost;
      return true;
    }
  }
  return false;
}

function visibleTo(team, e) {
  if (e.kind === 'building') {
    for (let y = e.ty; y < e.ty + e.size; y++) for (let x = e.tx; x < e.tx + e.size; x++)
      if (G.vis[team][y * G.W + x]) return true;
    return false;
  }
  const tx = Math.floor(e.x / TILE), ty = Math.floor(e.y / TILE);
  return tx >= 0 && ty >= 0 && tx < G.W && ty < G.H && G.vis[team][ty * G.W + tx] > 0;
}

function edgeDist(u, e) {
  const d = dist(u, e);
  return e.kind === 'building' ? Math.max(0, d - e.r * 0.85) : d;
}

function canTarget(team, e) {
  return !e.dead && e.team !== team && e.team !== -1 && !(e.kind === 'building' && e.type === 'relay');
}

function findTarget(u, rangeTiles, weapon) {
  const rng = rangeTiles * TILE;
  let best = null, bs = 1e9;
  const consider = (e) => {
    if (!canTarget(u.team, e) || !visibleTo(u.team, e)) return;
    const d = edgeDist(u, e);
    if (d > rng) return;
    if (weapon.minRange && d < weapon.minRange * TILE) return;
    let s = d;
    if (e.kind === 'building') s += 3 * TILE;
    else if (!e.d.weapon) s += TILE;
    const armor = e.d.armor;
    if (weapon.type === 'rocket' && armor === 'light') s += 2.5 * TILE;
    if (weapon.type === 'bullet' && armor === 'heavy') s += 2.5 * TILE;
    if (s < bs) { bs = s; best = e; }
  };
  for (const e of G.units) consider(e);
  for (const e of G.buildings) consider(e);
  return best;
}

function updateUnit(u, dt) {
  if (u.flash > 0) u.flash -= dt;
  if (u.stun > 0) { u.stun -= dt; return; }
  const team = G.teams[u.team];
  const sm = team.overclock > 0 ? 1.5 : 1;
  const d = u.d, w = d.weapon;
  u.cd -= dt * sm;

  if (!w) { engineerLogic(u, dt * sm); return; }

  let tgt = u.state === 'attack' ? u.target : u.auto;
  if (tgt && (!alive(tgt) || (!visibleTo(u.team, tgt) && edgeDist(u, tgt) > d.sight * TILE))) {
    if (u.state === 'attack') { u.state = 'idle'; u.target = null; u.guardX = u.x; u.guardY = u.y; u.path = null; }
    else if (u.state === 'amove') { u.auto = null; setPath(u, u.destX, u.destY); }
    else { if (u.auto && u.state === 'idle') u.path = null; u.auto = null; }
    tgt = null;
  }
  // scanning
  u.scanT -= dt;
  if (u.state !== 'attack' && u.scanT <= 0) {
    u.scanT = 0.25 + Math.random() * 0.15;
    const chase = u.state === 'idle' || u.state === 'amove';
    const nt = findTarget(u, chase ? Math.max(d.sight, w.range) : w.range, w);
    // switch to a closer target if current is out of range
    if (nt && (!tgt || edgeDist(u, tgt) > w.range * TILE)) { u.auto = nt; tgt = nt; }
    if (!nt && u.state === 'move') u.auto = null;
  }

  if (tgt) {
    const ed = edgeDist(u, tgt);
    const want = Math.atan2(tgt.y - u.y, tgt.x - u.x);
    u.turret = turnTo(u.turret, want, dt * (d.inf ? 14 : 5) * sm);
    if (d.inf) u.angle = u.turret;
    const inRange = ed <= w.range * TILE && (!w.minRange || ed >= w.minRange * TILE);
    if (inRange) {
      if (u.cd <= 0 && Math.abs(angDiff(u.turret, want)) < 0.25) { fire(u, tgt); u.cd = w.rof; }
      if (u.state !== 'move') { u.path = null; return; }
    } else if (u.state !== 'move') {
      if (u.state === 'idle' && hypot(u.x - u.guardX, u.y - u.guardY) > 10 * TILE) {
        u.auto = null; setPath(u, u.guardX, u.guardY);
      } else if (w.minRange && ed < w.minRange * TILE) {
        // artillery backs off
        const a = Math.atan2(u.y - tgt.y, u.x - tgt.x);
        moveToward(u, u.x + Math.cos(a) * TILE, u.y + Math.sin(a) * TILE, dt * sm);
        return;
      } else {
        u.repathT -= dt;
        if ((u.repathT <= 0 || !u.path || u.pi >= u.path.length) && pathBudget > 0) { setPath(u, tgt.x, tgt.y); u.repathT = 1 + Math.random() * 0.5; }
      }
    } else u.auto = null;
  } else if (!d.inf || u.path) {
    // nothing
  }
  followPath(u, dt * sm);
}

function engineerLogic(u, dt) {
  // repair adjacent friendly vehicles / buildings
  const t = u.repairing;
  if (t && (!alive(t) || t.hp >= t.maxHp)) u.repairing = null;
  if (!u.repairing && (u.state === 'idle' || (u.state === 'move' && !u.path))) {
    u.scanT -= dt;
    if (u.scanT <= 0) {
      u.scanT = 0.5;
      let best = null, bd = 6 * TILE;
      for (const e of [...G.units, ...G.buildings]) {
        if (e.team !== u.team || e.dead || e.hp >= e.maxHp || e === u) continue;
        if (e.kind === 'unit' && e.d.inf) continue;
        if (e.kind === 'building' && e.type === 'relay') continue;
        const dd = edgeDist(u, e);
        if (dd < bd) { bd = dd; best = e; }
      }
      if (best) u.repairing = best;
    }
  }
  if (u.repairing) {
    const e = u.repairing;
    if (edgeDist(u, e) <= 1.5 * TILE + (e.kind === 'unit' ? e.r : 0)) {
      u.path = null;
      u.angle = Math.atan2(e.y - u.y, e.x - u.x);
      e.hp = Math.min(e.maxHp, e.hp + u.d.repair * dt);
      if (Math.random() < dt * 8) spark(e.x + rnd(-e.r, e.r) * 0.6, e.y + rnd(-e.r, e.r) * 0.6, '#ffe066');
      return;
    }
    u.repathT -= dt;
    if (u.repathT <= 0 && pathBudget > 0) { setPath(u, e.x, e.y); u.repathT = 1; }
  }
  followPath(u, dt);
}

function followPath(u, dt) {
  if (!u.path || u.pi >= u.path.length) {
    if (u.path) {
      u.path = null;
      if (u.state === 'move' || u.state === 'amove') { u.state = 'idle'; u.guardX = u.x; u.guardY = u.y; }
    }
    return;
  }
  const p = u.path[u.pi];
  if (moveToward(u, p.x, p.y, dt)) u.pi++;
  // stuck detection
  u.stuckT += dt;
  if (u.stuckT > 1.2) {
    const moved = hypot(u.x - u.lastX, u.y - u.lastY);
    u.lastX = u.x; u.lastY = u.y; u.stuckT = 0;
    if (moved < 6) {
      u.stuckCount = (u.stuckCount || 0) + 1;
      const last = u.path[u.path.length - 1];
      if (u.stuckCount > 3 || hypot(u.x - last.x, u.y - last.y) < TILE * 1.2) {
        u.path = null; u.stuckCount = 0;
        if (u.state === 'move' || u.state === 'amove') { u.state = 'idle'; u.guardX = u.x; u.guardY = u.y; }
      } else if (pathBudget > 0) setPath(u, last.x, last.y);
    } else u.stuckCount = 0;
  }
}

function moveToward(u, tx, ty, dt) {
  const dx = tx - u.x, dy = ty - u.y, dd = hypot(dx, dy);
  const sp = u.d.speed * TILE * dt;
  const want = Math.atan2(dy, dx);
  if (!u.d.inf) {
    // vehicles turn before driving
    u.angle = turnTo(u.angle, want, dt * 4.5);
    if (Math.abs(angDiff(u.angle, want)) > 1.2 && dd > 4) return false;
    if (!u.auto && !u.target) u.turret = turnTo(u.turret, u.angle, dt * 4);
  } else {
    u.angle = want;
    if (!u.auto && !u.target) u.turret = want;
  }
  u.walk += dt * u.d.speed * 6;
  if (dd <= sp) { tryMove(u, dx, dy); return true; }
  tryMove(u, dx / dd * sp, dy / dd * sp);
  return false;
}
function tryMove(u, mx, my) {
  const nx = u.x + mx, ny = u.y + my;
  if (walkablePx(nx, ny)) { u.x = nx; u.y = ny; }
  else if (walkablePx(nx, u.y)) u.x = nx;
  else if (walkablePx(u.x, ny)) u.y = ny;
}

function separate() {
  const us = G.units, n = us.length;
  for (let i = 0; i < n; i++) {
    const a = us[i];
    for (let j = i + 1; j < n; j++) {
      const b = us[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const min = (a.r + b.r) * 0.85;
      if (Math.abs(dx) > min || Math.abs(dy) > min) continue;
      let d = hypot(dx, dy);
      if (d >= min) continue;
      if (d < 0.01) { d = 0.01; }
      const push = (min - d) / 2 * 0.5;
      const px = (d === 0.01 ? Math.random() - 0.5 : dx / d) * push, py = (d === 0.01 ? Math.random() - 0.5 : dy / d) * push;
      // stationary units yield less than moving ones
      const am = a.path ? 1 : 0.6, bm = b.path ? 1 : 0.6;
      if (walkablePx(a.x - px * am, a.y - py * am)) { a.x -= px * am; a.y -= py * am; }
      if (walkablePx(b.x + px * bm, b.y + py * bm)) { b.x += px * bm; b.y += py * bm; }
    }
  }
}

function updateBuilding(b, dt) {
  if (b.flash > 0) b.flash -= dt;
  b.spin += dt;
  if (b.type === 'relay') { updateRelay(b, dt); return; }
  const w = b.d.weapon;
  if (!w) return;
  b.cd -= dt;
  b.scanT = (b.scanT || 0) - dt;
  if (!alive(b.target) || edgeDist(b, b.target) > w.range * TILE || !visibleTo(b.team, b.target)) {
    b.target = null;
    if (b.scanT <= 0) { b.scanT = 0.3; b.target = findTarget(b, w.range, w); }
  }
  if (b.target) {
    const want = Math.atan2(b.target.y - b.y, b.target.x - b.x);
    b.turret = turnTo(b.turret, want, dt * 5);
    if (b.cd <= 0 && Math.abs(angDiff(b.turret, want)) < 0.2) { fire(b, b.target); b.cd = w.rof; }
  }
}

function updateRelay(b, dt) {
  const counts = [0, 0];
  for (const u of G.units) {
    if (u.dead || u.stun > 0) continue;
    if (Math.abs(u.x - b.x) < 2.3 * TILE && Math.abs(u.y - b.y) < 2.3 * TILE) counts[u.team] += u.type === 'engineer' ? 3 : 1;
  }
  let T = -1;
  if (counts[0] && !counts[1]) T = 0; else if (counts[1] && !counts[0]) T = 1;
  if (T === -1 || T === b.team) {
    if (!(counts[0] && counts[1])) b.capture = Math.max(0, b.capture - dt * 2);
    return;
  }
  if (b.captureTeam !== T) { b.captureTeam = T; b.capture = 0; }
  b.capture += dt * Math.min(counts[T], 6);
  if (b.capture >= 10) {
    b.capture = 0;
    if (b.team !== -1) {
      if (b.team === 0) ticker('A relay tower was neutralized!', 'warn');
      b.team = -1;
    } else {
      b.team = T;
      if (T === 0) { ticker('Relay tower captured', 'good'); Sound.play('capture'); }
      else if (G.vis[0][b.ty * G.W + b.tx]) ticker('The enemy captured a relay tower', 'warn');
    }
  }
}

// ---------------------------------------------------------------------
// Combat
// ---------------------------------------------------------------------
function muzzle(e, len) {
  return { x: e.x + Math.cos(e.turret) * len, y: e.y + Math.sin(e.turret) * len };
}

function fire(src, tgt) {
  const w = src.d.weapon;
  const mult = src.kind === 'unit' ? rankMult(src) : 1;
  const len = src.kind === 'building' ? (src.type === 'hq' ? 30 : 14) : src.r + 3;
  const shots = w.shots || 1;
  for (let s = 0; s < shots; s++) {
    let m = muzzle(src, len);
    if (shots > 1) {
      const side = (s === 0 ? -1 : 1) * src.r * 0.55;
      m = { x: m.x + Math.cos(src.turret + Math.PI / 2) * side, y: m.y + Math.sin(src.turret + Math.PI / 2) * side };
    }
    const aim = { x: tgt.x + rnd(-4, 4), y: tgt.y + rnd(-4, 4) };
    switch (w.proj) {
      case 'bullet':
        G.effects.push({ type: 'tracer', x: m.x, y: m.y, x2: aim.x, y2: aim.y, life: 0.07, max: 0.07, color: src.team === 0 ? '#c8fbff' : '#ffe0b0' });
        flashAt(m.x, m.y, 4);
        damage(tgt, w.dmg * mult, w.type, src);
        if (Math.random() < 0.5) spark(aim.x, aim.y, '#ffd28a');
        Sound.play('mg', src.x, src.y);
        break;
      case 'laser':
        G.effects.push({ type: 'beam', x: m.x, y: m.y, x2: aim.x, y2: aim.y, life: 0.16, max: 0.16, color: src.team === 0 ? '#5ff0ff' : '#ff5a4a' });
        damage(tgt, w.dmg * mult, w.type, src);
        spark(aim.x, aim.y, src.team === 0 ? '#aaf6ff' : '#ffb0a0');
        Sound.play('laser', src.x, src.y);
        break;
      case 'rocket':
        G.projectiles.push({ kind: 'rocket', x: m.x, y: m.y, tgt, tx: aim.x, ty: aim.y, speed: 11 * TILE, dmg: w.dmg * mult, type: w.type, src, team: src.team, ang: src.turret, life: 3 });
        Sound.play('rocket', src.x, src.y);
        break;
      case 'shell':
        G.projectiles.push({ kind: 'shell', x: m.x, y: m.y, tgt, tx: aim.x, ty: aim.y, speed: 17 * TILE, dmg: w.dmg * mult, type: w.type, src, team: src.team, life: 2 });
        flashAt(m.x, m.y, 9);
        Sound.play('shell', src.x, src.y);
        break;
      case 'arty': {
        const spread = TILE * 0.7;
        const tx = tgt.x + rnd(-spread, spread), ty = tgt.y + rnd(-spread, spread);
        const dd = hypot(tx - m.x, ty - m.y);
        G.projectiles.push({ kind: 'arty', x: m.x, y: m.y, sx: m.x, sy: m.y, tx, ty, t: 0, dur: 0.5 + dd / (9 * TILE), dmg: w.dmg * mult, type: w.type, splash: w.splash, src, team: src.team });
        flashAt(m.x, m.y, 12);
        Sound.play('arty', src.x, src.y);
        break;
      }
    }
  }
}

function updateProjectiles(dt) {
  for (const p of G.projectiles) {
    if (p.kind === 'arty') {
      p.t += dt;
      const k = Math.min(1, p.t / p.dur);
      p.x = p.sx + (p.tx - p.sx) * k; p.y = p.sy + (p.ty - p.sy) * k; p.h = Math.sin(k * Math.PI) * 60;
      if (Math.random() < 0.6) G.effects.push({ type: 'smoke', x: p.x, y: p.y - p.h, vx: 0, vy: 0, life: 0.5, max: 0.5, size: 3, color: '120,120,120' });
      if (k >= 1) {
        p.done = true;
        splash(p.tx, p.ty, p.splash * TILE, p.dmg, p.type, p.src, p.team);
        explosion(p.tx, p.ty, 1.2);
        scorch(p.tx, p.ty, 12);
      }
      continue;
    }
    p.life -= dt;
    if (alive(p.tgt)) { p.tx = p.tgt.x; p.ty = p.tgt.y; }
    const dx = p.tx - p.x, dy = p.ty - p.y, d = hypot(dx, dy), sp = p.speed * dt;
    p.ang = Math.atan2(dy, dx);
    if (p.kind === 'rocket' && Math.random() < 0.8) G.effects.push({ type: 'smoke', x: p.x, y: p.y, vx: rnd(-8, 8), vy: rnd(-8, 8), life: 0.6, max: 0.6, size: 3, color: '170,170,170' });
    if (d <= sp + (alive(p.tgt) ? p.tgt.r * 0.5 : 0) || p.life <= 0) {
      p.done = true;
      if (alive(p.tgt)) damage(p.tgt, p.dmg, p.type, p.src);
      explosion(p.tx, p.ty, p.kind === 'shell' ? 0.6 : 0.45);
    } else { p.x += dx / d * sp; p.y += dy / d * sp; }
  }
  G.projectiles = G.projectiles.filter((p) => !p.done);
}

function splash(x, y, radius, dmg, type, src, team) {
  const hit = (e) => {
    if (e.dead || e.team === team || e.team === -1 || (e.kind === 'building' && e.type === 'relay')) return;
    const d = e.kind === 'building' ? Math.max(0, hypot(e.x - x, e.y - y) - e.r * 0.8) : hypot(e.x - x, e.y - y);
    if (d > radius) return;
    damage(e, dmg * (1 - 0.5 * d / radius), type, src);
  };
  G.units.forEach(hit); G.buildings.forEach(hit);
}

function damage(e, amount, type, src) {
  if (!alive(e)) return;
  const mod = ARMOR_MOD[type][e.d.armor] || 1;
  const def = e.kind === 'unit' ? 1 + 0.1 * e.rank : 1;
  e.hp -= amount * mod / def;
  e.flash = 0.08;
  if (e.team === 0 && G.time - G.teams[0].lastAlert > 12) {
    if (e.kind === 'building' && e.type === 'hq') { G.teams[0].lastAlert = G.time; ticker('Our Command Base is under attack!', 'warn'); Sound.play('alert'); }
    else if (!visibleOnScreen(e)) { G.teams[0].lastAlert = G.time; ticker('Units under attack', 'warn'); Sound.play('alert'); G.ping = { x: e.x, y: e.y, t: 3 }; }
  }
  if (e.kind === 'unit' && e.state === 'idle' && !e.auto && src && alive(src) && src.kind === 'unit' && e.d.weapon) {
    // retaliate
    e.auto = src;
  }
  if (e.hp <= 0) kill(e, src);
}

function kill(e, src) {
  e.dead = true;
  const t = G.teams[e.team];
  if (e.kind === 'unit') {
    t.lost++;
    const big = !e.d.inf;
    explosion(e.x, e.y, big ? (e.type === 'colossus' ? 2.2 : 1.3) : 0.4);
    if (big) { scorch(e.x, e.y, e.r * 1.4); debris(e.x, e.y, TEAM[e.team].dark); }
    else bodyMark(e.x, e.y);
  } else {
    setBlock(e, 0);
    explosion(e.x, e.y, e.type === 'hq' ? 4 : 1.8);
    scorch(e.x, e.y, e.r * 1.3);
    debris(e.x, e.y, '#555');
    if (e.type === 'hq') { G.shake = 1.2; Sound.play('big', e.x, e.y); }
  }
  if (src && src.team !== e.team && src.team >= 0) {
    const st = G.teams[src.team];
    const value = e.kind === 'unit' ? e.d.cost : (e.type === 'hq' ? 1000 : 200);
    st.credits += value * 0.25 * (st.bounty > 0 ? 2 : 1);
    st.kills++;
    st.killCount++;
    if (st.killCount >= KILLS_PER_CARD) { st.killCount = 0; drawCard(st); }
    if (alive(src) && src.kind === 'unit') {
      src.kills++;
      const nr = src.kills >= 12 ? 3 : src.kills >= 7 ? 2 : src.kills >= 3 ? 1 : 0;
      if (nr > src.rank) {
        src.rank = nr;
        src.maxHp = src.d.hp * (1 + 0.15 * nr);
        src.hp = Math.min(src.maxHp, src.hp + src.d.hp * 0.25);
        floatText(src.x, src.y - 16, '▲ RANK ' + nr, '#ffd166');
        if (src.team === 0) Sound.play('rank');
      }
    }
  }
}

// ---------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------
function drawCard(t, silent) {
  if (t.hand.length >= HAND_MAX) return;
  const keys = Object.keys(CARDS);
  let total = 0;
  for (const k of keys) total += CARDS[k].w;
  let r = Math.random() * total, pick = keys[0];
  for (const k of keys) { r -= CARDS[k].w; if (r <= 0) { pick = k; break; } }
  t.hand.push(pick);
  t.handVer++;
  if (t.id === 0 && !silent) { Sound.play('draw'); ticker('New card: ' + CARDS[pick].name, 'good'); }
}

function canPlayAt(t, card, x, y) {
  const c = CARDS[card];
  if (c.target !== 'point') return true;
  const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
  if (tx < 0 || ty < 0 || tx >= G.W || ty >= G.H) return false;
  if (c.visible && !G.vis[t.id][ty * G.W + tx]) return false;
  if (t.id === 0 && !G.explored[ty * G.W + tx]) return false;
  if ((card === 'sentry' || card === 'droppod') && !nearestWalkable(tx, ty)) return false;
  return true;
}

function playCard(t, idx, x, y) {
  const card = t.hand[idx];
  if (!card) return false;
  if (!canPlayAt(t, card, x, y)) { if (t.id === 0) { Sound.play('deny'); ticker('Target must be in an area you can see', 'warn'); } return false; }
  t.hand.splice(idx, 1);
  t.handVer++;
  t.cardsPlayed++;
  const foe = G.teams[1 - t.id];
  const c = CARDS[card];
  Sound.play('card');
  if (t.id === 1) ticker('Enemy played ' + c.name + '!', 'warn');
  switch (card) {
    case 'orbital':
      G.strikes.push({ x, y, r: c.radius * TILE, t: 2, max: 2, team: t.id, kind: 'orbital' });
      break;
    case 'emp':
      G.effects.push({ type: 'ring', x, y, r0: 10, r1: c.radius * TILE, life: 0.6, max: 0.6, color: '#7fc8ff', w: 6 });
      Sound.play('emp', x, y);
      for (const u of G.units) if (u.team !== t.id && hypot(u.x - x, u.y - y) <= c.radius * TILE) u.stun = u.d.inf ? 5 : 8;
      for (const b of G.buildings) if (b.team === foe.id && b.type === 'turret' && hypot(b.x - x, b.y - y) <= c.radius * TILE) b.cd = 8;
      break;
    case 'mend':
      for (const u of G.units) if (u.team === t.id) {
        u.hp = Math.min(u.maxHp, u.hp + u.maxHp * 0.5);
        for (let i = 0; i < 4; i++) G.effects.push({ type: 'spark', x: u.x + rnd(-8, 8), y: u.y + rnd(-8, 8), vx: 0, vy: -30, life: 0.8, max: 0.8, size: 2.5, color: '#7dff9a' });
      }
      break;
    case 'overclock': t.overclock = 20; if (t.id === 0) ticker('Overclock engaged — 20s', 'good'); break;
    case 'bounty': t.bounty = 30; if (t.id === 0) ticker('War Bounty — double kill rewards for 30s', 'good'); break;
    case 'sabotage':
      foe.credits = Math.max(0, foe.credits - 300); foe.sabotage = 12;
      if (t.id === 0) ticker('Enemy production sabotaged', 'good'); else ticker('Our production has been sabotaged!', 'warn');
      break;
    case 'droppod':
      G.pods.push({ x, y, t: 1.2, team: t.id });
      break;
    case 'sentry': {
      const s = nearestWalkable(Math.floor(x / TILE), Math.floor(y / TILE));
      if (s) {
        const b = createBuilding('turret', t.id, s.x, s.y);
        b.turret = t.id === 0 ? -Math.PI / 4 : Math.PI * 0.75;
        // push units standing on it
        for (const u of G.units) if (Math.floor(u.x / TILE) === s.x && Math.floor(u.y / TILE) === s.y) {
          const n = nearestWalkable(s.x, s.y + 1); if (n) { u.x = (n.x + 0.5) * TILE; u.y = (n.y + 0.5) * TILE; }
        }
        G.effects.push({ type: 'ring', x: b.x, y: b.y, r0: 30, r1: 6, life: 0.4, max: 0.4, color: '#7fffe0', w: 3 });
      }
      break;
    }
    case 'mines':
      for (let i = 0; i < 7; i++) {
        const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * c.radius * TILE;
        const mx = x + Math.cos(a) * r, my = y + Math.sin(a) * r;
        if (walkablePx(mx, my)) G.mines.push({ x: mx, y: my, team: t.id, arm: 1.5 });
      }
      break;
  }
  return true;
}

function updateStrikes(dt) {
  for (const s of G.strikes) {
    s.t -= dt;
    if (s.t <= 0 && !s.done) {
      s.done = true;
      const hitAll = (e) => {
        if (e.dead || e.team === s.team || e.team === -1 || (e.kind === 'building' && e.type === 'relay')) return;
        const d = hypot(e.x - s.x, e.y - s.y);
        if (d <= s.r + (e.kind === 'building' ? e.r * 0.5 : 0)) damage(e, 200 * (1 - 0.45 * Math.min(1, d / s.r)), 'blast', null);
      };
      G.units.forEach(hitAll); G.buildings.forEach(hitAll);
      G.effects.push({ type: 'beam', x: s.x, y: s.y - 900, x2: s.x, y2: s.y, life: 0.5, max: 0.5, color: '#ffd0a0', wide: 22 });
      for (let i = 0; i < 9; i++) explosion(s.x + rnd(-s.r, s.r) * 0.6, s.y + rnd(-s.r, s.r) * 0.6, 1.4);
      G.effects.push({ type: 'ring', x: s.x, y: s.y, r0: 10, r1: s.r * 1.3, life: 0.7, max: 0.7, color: '#ffb070', w: 8 });
      scorch(s.x, s.y, s.r * 0.9);
      G.shake = Math.max(G.shake, 0.6);
      Sound.play('big', s.x, s.y);
    }
  }
  G.strikes = G.strikes.filter((s) => !s.done);
  for (const p of G.pods) {
    p.t -= dt;
    if (p.t <= 0 && !p.done) {
      p.done = true;
      explosion(p.x, p.y, 0.8); scorch(p.x, p.y, 14);
      const tiles = freeTilesNear(Math.floor(p.x / TILE), Math.floor(p.y / TILE), 5);
      ['trooper', 'trooper', 'trooper', 'trooper', 'lancer'].forEach((type, i) => {
        if (teamUnits(p.team).length >= MAX_UNITS + 5) return;
        const tt = tiles[i % tiles.length];
        const u = createUnit(type, p.team, (tt.x + 0.5) * TILE + rnd(-5, 5), (tt.y + 0.5) * TILE + rnd(-5, 5));
        u.guardX = u.x; u.guardY = u.y;
        if (p.team === 1) u.role = 'attack';
      });
    }
  }
  G.pods = G.pods.filter((p) => !p.done);
}

function updateMines(dt) {
  for (const m of G.mines) {
    if (m.arm > 0) { m.arm -= dt; continue; }
    for (const u of G.units) {
      if (u.dead || u.team === m.team) continue;
      if (hypot(u.x - m.x, u.y - m.y) < 12 + u.r * 0.5) {
        m.done = true;
        splash(m.x, m.y, TILE * 1.2, 110, 'blast', null, m.team);
        explosion(m.x, m.y, 0.9); scorch(m.x, m.y, 10);
        break;
      }
    }
  }
  G.mines = G.mines.filter((m) => !m.done);
}

// ---------------------------------------------------------------------
// Visibility
// ---------------------------------------------------------------------
function updateVisibility() {
  const W = G.W, H = G.H;
  for (let team = 0; team < 2; team++) {
    const vis = G.vis[team];
    vis.fill(0);
    const mark = (cx, cy, r) => {
      const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(W - 1, Math.ceil(cx + r));
      const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(H - 1, Math.ceil(cy + r));
      const r2 = r * r;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
        if (dx * dx + dy * dy <= r2) vis[y * W + x] = 1;
      }
    };
    for (const u of G.units) if (u.team === team && !u.dead) mark(u.x / TILE, u.y / TILE, u.d.sight);
    for (const b of G.buildings) if (b.team === team && !b.dead) mark(b.x / TILE, b.y / TILE, b.d.sight);
  }
  const vis = G.vis[0], ex = G.explored, data = fogImg.data;
  for (let i = 0; i < W * H; i++) {
    if (vis[i]) ex[i] = 1;
    data[i * 4 + 3] = vis[i] ? 0 : ex[i] ? 120 : 255;
  }
  fogCtx.putImageData(fogImg, 0, 0);
}

// ---------------------------------------------------------------------
// Effects
// ---------------------------------------------------------------------
function explosion(x, y, size) {
  const n = Math.min(40, Math.round(10 * size));
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 7, s = rnd(10, 70) * size;
    G.effects.push({ type: 'fire', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(0.25, 0.6), max: 0.6, size: rnd(3, 7) * Math.sqrt(size) });
  }
  for (let i = 0; i < n / 2; i++) {
    G.effects.push({ type: 'smoke', x: x + rnd(-6, 6) * size, y: y + rnd(-6, 6) * size, vx: rnd(-12, 12), vy: rnd(-20, -4), life: rnd(0.8, 1.6), max: 1.6, size: rnd(4, 9) * Math.sqrt(size), color: '60,55,50' });
  }
  G.effects.push({ type: 'flash', x, y, r: 18 * size, life: 0.12, max: 0.12 });
  if (size >= 0.8) Sound.play('boom', x, y); else Sound.play('hit', x, y);
  if (G.effects.length > 900) G.effects.splice(0, G.effects.length - 900);
}
function spark(x, y, color) {
  for (let i = 0; i < 3; i++) G.effects.push({ type: 'spark', x, y, vx: rnd(-60, 60), vy: rnd(-60, 60), life: 0.25, max: 0.25, size: 1.6, color });
}
function flashAt(x, y, r) { G.effects.push({ type: 'flash', x, y, r, life: 0.05, max: 0.05 }); }
function debris(x, y, color) {
  for (let i = 0; i < 8; i++) G.effects.push({ type: 'debris', x, y, vx: rnd(-90, 90), vy: rnd(-90, 90), life: rnd(0.4, 0.9), max: 0.9, size: rnd(2, 4), color, rot: Math.random() * 6 });
}
function floatText(x, y, text, color) { G.effects.push({ type: 'text', x, y, vx: 0, vy: -18, life: 1.4, max: 1.4, text, color }); }
function scorch(x, y, r) {
  const c = terrainCanvas.getContext('2d');
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, 'rgba(10,8,6,0.55)'); g.addColorStop(0.6, 'rgba(20,15,10,0.3)'); g.addColorStop(1, 'rgba(20,15,10,0)');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
}
function bodyMark(x, y) {
  const c = terrainCanvas.getContext('2d');
  c.fillStyle = 'rgba(40,20,15,0.35)';
  c.beginPath(); c.ellipse(x, y, 5, 3, Math.random() * 3, 0, 7); c.fill();
}
function updateEffects(dt) {
  for (const e of G.effects) {
    e.life -= dt;
    if (e.vx !== undefined) {
      e.x += e.vx * dt; e.y += e.vy * dt;
      if (e.type === 'fire' || e.type === 'debris') { e.vx *= 0.9; e.vy *= 0.9; }
    }
  }
  G.effects = G.effects.filter((e) => e.life > 0);
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt);
  if (G.marker) { G.marker.t -= dt; if (G.marker.t <= 0) G.marker = null; }
  if (G.ping) { G.ping.t -= dt; if (G.ping.t <= 0) G.ping = null; }
}

// =====================================================================
// Enemy AI
// =====================================================================
function updateAI(dt) {
  const ai = G.ai, me = G.teams[1], foe = G.teams[0], D = G.diff;
  ai.t -= dt;
  ai.cardT -= dt;
  if (ai.cardT <= 0) { ai.cardT = D.cardEvery; aiCards(me); }
  if (ai.t > 0) return;
  ai.t = D.think;
  if (!alive(me.hq)) return;
  const mine = teamUnits(1);
  const theirs = teamUnits(0);

  // --- production
  if (me.queue.length < 2 && mine.length < MAX_UNITS) {
    const heavy = theirs.filter((u) => u.d.armor !== 'light').length;
    const light = theirs.length - heavy;
    const engineers = mine.filter((u) => u.type === 'engineer').length;
    const weights = {
      trooper: 4 + light * 0.3, lancer: 2 + heavy * 0.8, raider: 2, tank: 2 + G.time / 200,
      howler: G.time > 240 ? 1.5 : 0, colossus: G.time > 420 ? 1 + G.time / 600 : 0, engineer: engineers < 2 ? 3 : 0,
    };
    let total = 0;
    for (const k in weights) if (UNITS[k].cost <= me.credits) total += weights[k];
    if (total > 0) {
      let r = Math.random() * total;
      for (const k in weights) {
        if (UNITS[k].cost > me.credits) continue;
        r -= weights[k];
        if (r <= 0) { queueUnit(me, k); break; }
      }
    }
  }

  // --- defense: respond to intruders near base or our relays
  const assets = G.buildings.filter((b) => b.team === 1);
  let threat = null;
  for (const u of theirs) {
    for (const b of assets) {
      if (hypot(u.x - b.x, u.y - b.y) < (b.type === 'hq' ? 12 : 6) * TILE) { threat = u; break; }
    }
    if (threat) break;
  }
  if (threat) {
    const defenders = mine.filter((u) => u.d.weapon && u.role !== 'attack' && hypot(u.x - threat.x, u.y - threat.y) < 20 * TILE)
      .filter((u) => u.state === 'idle' || u.role === 'capture');
    if (defenders.length) { orderMove(defenders, threat.x, threat.y, true); defenders.forEach((u) => (u.role = 'defend')); }
  }

  // --- capture relays
  const targets = G.buildings.filter((b) => b.type === 'relay' && b.team !== 1)
    .sort((a, b) => hypot(a.x - me.hq.x, a.y - me.hq.y) - hypot(b.x - me.hq.x, b.y - me.hq.y));
  for (const r of targets.slice(0, 3)) {
    const already = mine.some((u) => u.role === 'capture' && u.goal === r);
    if (already) continue;
    const pool = mine.filter((u) => (u.role === null || u.role === 'defend') && u.state === 'idle' && (u.type === 'engineer' || u.type === 'raider' || u.type === 'trooper'));
    pool.sort((a, b) => hypot(a.x - r.x, a.y - r.y) - hypot(b.x - r.x, b.y - r.y));
    const squad = pool.slice(0, r.team === 0 ? 4 : 2);
    if (r.team === 0 && squad.length < 3) continue;
    if (squad.length) {
      orderMove(squad, r.x, r.y, true);
      squad.forEach((u) => { u.role = 'capture'; u.goal = r; });
    }
  }
  for (const u of mine) if (u.role === 'capture' && (!u.goal || u.goal.team === 1) && u.state === 'idle') { u.role = null; u.goal = null; }
  for (const u of mine) if (u.role === 'defend' && u.state === 'idle') u.role = null;

  // --- attack waves
  const army = mine.filter((u) => u.d.weapon && u.role === null && u.state === 'idle');
  const attackers = mine.filter((u) => u.role === 'attack');
  if (G.time > D.firstWave && army.length >= ai.waveSize) {
    army.forEach((u) => (u.role = 'attack'));
    ai.waveSize = Math.min(D.waveMax, ai.waveSize + D.waveGrow);
    aiSendAttack(army);
  } else if (attackers.length) {
    const idle = attackers.filter((u) => u.state === 'idle');
    if (idle.length) aiSendAttack(idle);
  }
  // gather idle units at the rally point
  const loiter = mine.filter((u) => u.role === null && u.state === 'idle' && hypot(u.x - me.rally.x, u.y - me.rally.y) > 6 * TILE);
  if (loiter.length) orderMove(loiter, me.rally.x, me.rally.y, true);
}

function aiSendAttack(units) {
  const c = units.reduce((a, u) => ({ x: a.x + u.x / units.length, y: a.y + u.y / units.length }), { x: 0, y: 0 });
  const options = G.buildings.filter((b) => b.team === 0);
  if (!options.length) return;
  // prefer nearby player relays, else the base
  options.sort((a, b) => {
    const pa = a.type === 'hq' ? 10 * TILE : 0, pb = b.type === 'hq' ? 10 * TILE : 0;
    return hypot(a.x - c.x, a.y - c.y) + pa - (hypot(b.x - c.x, b.y - c.y) + pb);
  });
  const t = options[0];
  orderMove(units, t.x, t.y, true);
  G.ai.target = t;
}

function aiCards(me) {
  if (!me.hand.length) return;
  const theirs = teamUnits(0).filter((u) => visibleTo(1, u));
  const mine = teamUnits(1);
  const cluster = (radius, min) => {
    let best = null, bc = 0;
    for (const u of theirs) {
      let n = 0;
      for (const v of theirs) if (hypot(u.x - v.x, u.y - v.y) <= radius * TILE) n += v.d.inf ? 1 : 2;
      if (n > bc) { bc = n; best = u; }
    }
    return bc >= min ? best : null;
  };
  for (let i = 0; i < me.hand.length; i++) {
    const card = me.hand[i];
    let x = 0, y = 0, ok = false;
    switch (card) {
      case 'orbital': { const c = cluster(3, 5); if (c) { x = c.x; y = c.y; ok = true; } break; }
      case 'emp': {
        const c = cluster(4, 6);
        if (c && mine.some((u) => hypot(u.x - c.x, u.y - c.y) < 10 * TILE)) { x = c.x; y = c.y; ok = true; }
        break;
      }
      case 'mend': {
        const hurt = mine.filter((u) => u.hp < u.maxHp * 0.55).length;
        ok = hurt >= 4; break;
      }
      case 'overclock': case 'bounty': ok = mine.filter((u) => u.role === 'attack').length >= 5; break;
      case 'sabotage': ok = G.teams[0].credits > 250 || G.teams[0].queue.length >= 2; break;
      case 'droppod': {
        const atk = mine.filter((u) => u.role === 'attack');
        if (atk.length >= 3) { x = atk[0].x; y = atk[0].y; ok = true; }
        else if (theirs.length && alive(G.teams[1].hq) && theirs.some((u) => dist(u, G.teams[1].hq) < 12 * TILE)) { x = G.teams[1].hq.x - 2 * TILE; y = G.teams[1].hq.y + 2 * TILE; ok = true; }
        break;
      }
      case 'sentry': case 'mines': {
        const own = G.buildings.filter((b) => b.team === 1 && b.type === 'relay');
        const pick = own.length && Math.random() < 0.6 ? own[Math.random() * own.length | 0] : G.teams[1].hq;
        if (pick && alive(pick)) {
          x = pick.x + rnd(-2, 2) * TILE - 2 * TILE; y = pick.y + rnd(-2, 2) * TILE + 2 * TILE;
          ok = G.buildings.filter((b) => b.team === 1 && b.type === 'turret').length < 8 || card === 'mines';
        }
        break;
      }
    }
    if (ok && canPlayAt(me, card, x, y)) { playCard(me, i, x, y); return; }
  }
  // dump a card if hand is full
  if (me.hand.length >= HAND_MAX && (me.hand.includes('mend') || me.hand.includes('overclock'))) {
    playCard(me, me.hand.indexOf(me.hand.includes('mend') ? 'mend' : 'overclock'), 0, 0);
  }
}

// =====================================================================
// End of game
// =====================================================================
function checkEnd() {
  if (G.over) return;
  const pLost = !alive(G.teams[0].hq), eLost = !alive(G.teams[1].hq);
  if (!pLost && !eLost) return;
  G.over = true;
  const win = eLost && !pLost;
  setTimeout(() => showEnd(win), 2200);
}

function showEnd(win) {
  const cfg = G.cfg;
  $('hud').classList.add('hidden');
  $('end-title').textContent = win ? 'Victory' : 'Defeat';
  $('end-title').style.color = win ? '#8ff0a4' : '#ff8a70';
  let text = win ? 'The enemy Command Base lies in ruins.' : 'Our Command Base has fallen.';
  if (cfg.mission !== undefined && win) {
    const prog = store('ef_progress') || 0;
    if (cfg.mission + 1 > prog) store('ef_progress', cfg.mission + 1);
    if (cfg.mission === CAMPAIGN.length - 1) text = 'The Citadel has fallen. The Directorate is finished.\n\nAfter three generations on the ice, the exiles have come home.';
  }
  $('end-text').textContent = text;
  const t0 = G.teams[0], t1 = G.teams[1];
  const m = Math.floor(G.time / 60), s = Math.floor(G.time % 60);
  const rows = [['Time', `${m}:${String(s).padStart(2, '0')}`], ['Units built', t0.built], ['Units lost', t0.lost],
    ['Enemies destroyed', t0.kills], ['Cards played', t0.cardsPlayed], ['Enemy units built', t1.built]];
  $('end-stats').innerHTML = rows.map(([a, b]) => `<span>${a}</span><span>${b}</span>`).join('');
  const btns = $('end-buttons');
  btns.innerHTML = '';
  const mk = (label, fn, primary) => { const b = document.createElement('button'); b.textContent = label; if (primary) b.className = 'primary'; b.onclick = fn; btns.appendChild(b); };
  mk('Menu', () => { G = null; showScreen('menu'); });
  mk(win ? 'Replay' : 'Retry', () => startGame(cfg), !win || cfg.mission === undefined);
  if (win && cfg.mission !== undefined && cfg.mission < CAMPAIGN.length - 1) mk('Next Mission', () => openBriefing(cfg.mission + 1), true);
  showScreen('end');
}

// =====================================================================
// Rendering
// =====================================================================
function viewSize() { return { w: window.innerWidth, h: window.innerHeight }; }
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const s = viewSize();
  viewW = s.w; viewH = s.h;
  canvas.width = Math.round(s.w * dpr); canvas.height = Math.round(s.h * dpr);
  if (G) clampCamera();
}
function centerCamera(x, y) {
  G.cam.x = x - viewW / G.cam.zoom / 2; G.cam.y = y - viewH / G.cam.zoom / 2;
  clampCamera();
}
function clampCamera() {
  const z = G.cam.zoom, ww = G.W * TILE, wh = G.H * TILE;
  const vw = viewW / z, vh = viewH / z;
  const padTop = 40 / z, padBot = 70 / z, padSide = 80 / z;
  G.cam.x = vw > ww + padSide * 2 ? (ww - vw) / 2 : clamp(G.cam.x, -padSide, ww - vw + padSide);
  G.cam.y = vh > wh + padTop + padBot ? (wh - vh) / 2 : clamp(G.cam.y, -padTop, wh - vh + padBot);
}
function screenToWorld(sx, sy) { return { x: G.cam.x + sx / G.cam.zoom, y: G.cam.y + sy / G.cam.zoom }; }
function visibleOnScreen(e) {
  const z = G.cam.zoom;
  return e.x > G.cam.x && e.y > G.cam.y && e.x < G.cam.x + viewW / z && e.y < G.cam.y + viewH / z;
}

function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#07090a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!G) { renderMenuBackdrop(); return; }
  const z = G.cam.zoom * dpr;
  let sx = 0, sy = 0;
  if (G.shake > 0) { sx = rnd(-1, 1) * G.shake * 8; sy = rnd(-1, 1) * G.shake * 8; }
  ctx.setTransform(z, 0, 0, z, (-G.cam.x + sx) * z, (-G.cam.y + sy) * z);
  const vx0 = G.cam.x - 64, vy0 = G.cam.y - 64, vx1 = G.cam.x + viewW / G.cam.zoom + 64, vy1 = G.cam.y + viewH / G.cam.zoom + 64;
  const inView = (e) => e.x > vx0 && e.x < vx1 && e.y > vy0 && e.y < vy1;

  // terrain (only visible part)
  const sx0 = clamp(Math.floor(G.cam.x), 0, terrainCanvas.width), sy0 = clamp(Math.floor(G.cam.y), 0, terrainCanvas.height);
  const sw = clamp(Math.ceil(viewW / G.cam.zoom) + 2, 0, terrainCanvas.width - sx0), sh = clamp(Math.ceil(viewH / G.cam.zoom) + 2, 0, terrainCanvas.height - sy0);
  if (sw > 0 && sh > 0) ctx.drawImage(terrainCanvas, sx0, sy0, sw, sh, sx0, sy0, sw, sh);

  // mines (own only)
  for (const m of G.mines) if (m.team === 0 && inView(m)) {
    ctx.fillStyle = m.arm > 0 ? '#888' : '#cfd8dc';
    ctx.beginPath(); ctx.arc(m.x, m.y, 3.5, 0, 7); ctx.fill();
    ctx.fillStyle = '#ff5050'; ctx.fillRect(m.x - 1, m.y - 1, 2, 2);
  }

  // buildings
  for (const b of G.buildings) {
    if (!inView(b)) continue;
    const explored = G.explored[b.ty * G.W + b.tx];
    if (b.team === 1 && !explored) continue;
    drawBuilding(b);
  }
  // selection rings under units
  for (const u of G.selection) {
    ctx.strokeStyle = '#7dff9a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(u.x, u.y + 2, u.r + 4, (u.r + 4) * 0.75, 0, 0, 7); ctx.stroke();
  }
  // units
  for (const u of G.units) {
    if (!inView(u)) continue;
    if (u.team !== 0 && !visibleTo(0, u)) continue;
    drawUnit(u);
  }
  // projectiles
  for (const p of G.projectiles) {
    if (!inView(p)) continue;
    if (p.kind === 'rocket') {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.ang);
      ctx.fillStyle = '#ddd'; ctx.fillRect(-4, -1.5, 8, 3);
      ctx.fillStyle = '#ffb040'; ctx.fillRect(-7, -1.5, 3, 3);
      ctx.restore();
    } else if (p.kind === 'shell') {
      ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, 7); ctx.fill();
    } else if (p.kind === 'arty') {
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffd080'; ctx.beginPath(); ctx.arc(p.x, p.y - p.h, 3.2, 0, 7); ctx.fill();
    }
  }
  // strikes & pods (warning markers)
  for (const s of G.strikes) {
    const k = 1 - s.t / s.max;
    ctx.strokeStyle = `rgba(255,${120 - k * 80},60,${0.5 + 0.5 * Math.sin(G.time * 20)})`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r * (1 - k), 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s.x - 10, s.y); ctx.lineTo(s.x + 10, s.y); ctx.moveTo(s.x, s.y - 10); ctx.lineTo(s.x, s.y + 10); ctx.stroke();
  }
  for (const p of G.pods) {
    const h = p.t * 500;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 14, 9, 0, 0, 7); ctx.fill();
    ctx.fillStyle = TEAM[p.team].main; ctx.beginPath(); ctx.arc(p.x, p.y - h, 10, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffb040'; ctx.beginPath(); ctx.arc(p.x, p.y - h + 12, 5 + Math.random() * 3, 0, 7); ctx.fill();
  }

  drawEffects(inView);

  // fog
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(fogCanvas, 0, 0, G.W, G.H, 0, 0, G.W * TILE, G.H * TILE);

  // overlays above fog
  for (const u of G.units) {
    if (!inView(u) || (u.team !== 0 && !visibleTo(0, u))) continue;
    const sel = u.selected;
    if (sel || u.hp < u.maxHp) drawHealth(u.x, u.y - u.r - 7, u.r * 2 + 4, u.hp / u.maxHp, sel);
    if (u.rank) drawRank(u);
    if (u.stun > 0) {
      ctx.strokeStyle = 'rgba(120,200,255,0.8)'; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 3; i++) { const a = G.time * 10 + i * 2; ctx.moveTo(u.x + Math.cos(a) * u.r, u.y + Math.sin(a) * u.r); ctx.lineTo(u.x + Math.cos(a + 1) * (u.r + 4), u.y + Math.sin(a + 1) * (u.r + 4)); }
      ctx.stroke();
    }
  }
  for (const b of G.buildings) {
    if (!inView(b) || b.type === 'relay' || (b.team === 1 && !visibleTo(0, b))) continue;
    if (b.hp < b.maxHp) drawHealth(b.x, b.y - b.r - 6, b.r * 1.6, b.hp / b.maxHp, false);
  }
  if (G.marker) {
    const k = G.marker.t / 0.6;
    ctx.strokeStyle = G.marker.color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(G.marker.x, G.marker.y, 4 + (1 - k) * 12, 0, 7); ctx.stroke();
  }
  if (G.teams[0].rally && (G.rallyMode || G.hqSelected)) {
    const r = G.teams[0].rally;
    ctx.strokeStyle = '#7dff9a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x, r.y - 18); ctx.stroke();
    ctx.fillStyle = '#7dff9a'; ctx.beginPath(); ctx.moveTo(r.x, r.y - 18); ctx.lineTo(r.x + 10, r.y - 14); ctx.lineTo(r.x, r.y - 10); ctx.fill();
  }
  // card targeting preview
  if (G.targeting >= 0 && G.hover) {
    const c = CARDS[G.teams[0].hand[G.targeting]];
    if (c) {
      const ok = canPlayAt(G.teams[0], G.teams[0].hand[G.targeting], G.hover.x, G.hover.y);
      ctx.strokeStyle = ok ? c.color : '#ff3030'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.arc(G.hover.x, G.hover.y, c.radius * TILE, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    }
  }

  // box select rectangle (screen space)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (input.box) {
    const b = input.box;
    ctx.strokeStyle = '#7dff9a'; ctx.lineWidth = 1; ctx.fillStyle = 'rgba(125,255,154,0.08)';
    const x = Math.min(b.x0, b.x1), y = Math.min(b.y0, b.y1), w = Math.abs(b.x1 - b.x0), h = Math.abs(b.y1 - b.y0);
    ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
  }
  if (G.teams[0].overclock > 0) {
    ctx.fillStyle = 'rgba(255,202,40,0.06)'; ctx.fillRect(0, 0, viewW, viewH);
  }
}

function drawHealth(x, y, w, f, sel) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, 4);
  ctx.fillStyle = f > 0.6 ? '#5ee06e' : f > 0.3 ? '#f2c531' : '#ef4b3c';
  ctx.fillRect(x - w / 2, y, w * clamp(f, 0, 1), 2);
}
function drawRank(u) {
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.3;
  for (let i = 0; i < u.rank; i++) {
    const x = u.x + u.r + 3, y = u.y - u.r + i * 3.5;
    ctx.beginPath(); ctx.moveTo(x - 3, y + 2); ctx.lineTo(x, y); ctx.lineTo(x + 3, y + 2); ctx.stroke();
  }
}

function drawUnit(u) {
  const col = TEAM[u.team];
  ctx.save();
  ctx.translate(u.x, u.y);
  const f = u.flash > 0;
  switch (u.type) {
    case 'trooper': case 'lancer': case 'engineer': drawInfantry(u, col, f); break;
    case 'raider': drawRaider(u, col, f); break;
    case 'tank': drawTank(u, col, f); break;
    case 'howler': drawHowler(u, col, f); break;
    case 'colossus': drawColossus(u, col, f); break;
  }
  ctx.restore();
}
function shadow(rx, ry) {
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(3, 4, rx, ry, 0, 0, 7); ctx.fill();
}
function drawInfantry(u, col, f) {
  shadow(5, 4);
  ctx.rotate(u.angle);
  const moving = !!u.path;
  const step = moving ? Math.sin(u.walk) * 2.5 : 0;
  ctx.fillStyle = '#222';
  ctx.fillRect(-2 + step, -4, 4, 2.5); ctx.fillRect(-2 - step, 1.5, 4, 2.5);
  ctx.fillStyle = f ? '#fff' : col.dark;
  ctx.beginPath(); ctx.ellipse(0, 0, 4, 5.5, 0, 0, 7); ctx.fill();
  if (u.type === 'engineer') { ctx.fillStyle = '#e8b422'; ctx.fillRect(-6, -3, 3.5, 6); }
  if (u.type === 'lancer') { ctx.fillStyle = '#5a5a50'; ctx.fillRect(-3, 2.5, 13, 3); ctx.fillStyle = '#333'; ctx.fillRect(9, 2, 3, 4); }
  else if (u.type === 'trooper') { ctx.fillStyle = '#2a2a2a'; ctx.fillRect(1, 2, 9, 1.8); }
  else { ctx.fillStyle = '#ccc'; ctx.fillRect(2, 2.5, 6, 1.5); }
  ctx.fillStyle = f ? '#fff' : col.main;
  ctx.beginPath(); ctx.arc(0.5, 0, 3, 0, 7); ctx.fill();
  ctx.fillStyle = col.light; ctx.beginPath(); ctx.arc(1.3, -0.8, 1.1, 0, 7); ctx.fill();
}
function drawRaider(u, col, f) {
  shadow(11, 7);
  ctx.rotate(u.angle);
  ctx.fillStyle = '#1b1b1b';
  for (const [x, y] of [[-6, -7], [4, -7], [-6, 5], [4, 5]]) ctx.fillRect(x, y, 5, 2.5);
  ctx.fillStyle = f ? '#fff' : col.dark; ctx.fillRect(-9, -5.5, 18, 11);
  ctx.fillStyle = f ? '#fff' : col.main; ctx.fillRect(-6, -4.5, 13, 9);
  ctx.fillStyle = 'rgba(200,240,255,0.6)'; ctx.fillRect(3, -3.5, 3, 7);
  ctx.rotate(u.turret - u.angle);
  ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(-1, 0, 3, 0, 7); ctx.fill();
  ctx.fillRect(-1, -1, 10, 2);
}
function drawTank(u, col, f) {
  shadow(14, 10);
  ctx.rotate(u.angle);
  ctx.fillStyle = '#1d1d1b'; ctx.fillRect(-13, -11, 26, 5); ctx.fillRect(-13, 6, 26, 5);
  ctx.fillStyle = '#3a3a36';
  const off = (u.walk * 3) % 4;
  for (let x = -12 + off; x < 12; x += 4) { ctx.fillRect(x, -11, 1.5, 5); ctx.fillRect(x, 6, 1.5, 5); }
  ctx.fillStyle = f ? '#fff' : col.dark; ctx.fillRect(-12, -7, 24, 14);
  ctx.fillStyle = f ? '#fff' : col.main; ctx.fillRect(-10, -5.5, 20, 11);
  ctx.rotate(u.turret - u.angle);
  ctx.fillStyle = '#2b2b2b'; ctx.fillRect(4, -1.8, 15, 3.6);
  ctx.fillStyle = f ? '#fff' : col.dark; ctx.beginPath(); ctx.arc(0, 0, 7, 0, 7); ctx.fill();
  ctx.fillStyle = col.light; ctx.beginPath(); ctx.arc(-1.5, -1.5, 3, 0, 7); ctx.fill();
}
function drawHowler(u, col, f) {
  shadow(13, 9);
  ctx.rotate(u.angle);
  ctx.fillStyle = '#1d1d1b'; ctx.fillRect(-12, -10, 24, 4); ctx.fillRect(-12, 6, 24, 4);
  ctx.fillStyle = f ? '#fff' : col.dark; ctx.fillRect(-11, -7, 22, 14);
  ctx.fillStyle = f ? '#fff' : col.main; ctx.fillRect(-11, -5, 9, 10);
  ctx.rotate(u.turret - u.angle);
  ctx.fillStyle = '#444'; ctx.fillRect(-2, -6, 12, 12);
  ctx.fillStyle = '#222';
  ctx.fillRect(4, -5, 12, 4); ctx.fillRect(4, 1, 12, 4);
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(16, -3, 1.6, 0, 7); ctx.arc(16, 3, 1.6, 0, 7); ctx.fill();
}
function drawColossus(u, col, f) {
  shadow(18, 13);
  ctx.rotate(u.angle);
  const moving = !!u.path;
  const s = moving ? Math.sin(u.walk * 0.7) * 6 : 0;
  ctx.fillStyle = '#2a2a28';
  ctx.fillRect(-4 + s, -16, 10, 6); ctx.fillRect(-4 - s, 10, 10, 6);
  ctx.fillStyle = '#3d3d39'; ctx.fillRect(-2 + s, -13, 4, 6); ctx.fillRect(-2 - s, 7, 4, 6);
  ctx.rotate(u.turret - u.angle);
  ctx.fillStyle = f ? '#fff' : col.dark;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ctx.lineTo(Math.cos(a) * 13, Math.sin(a) * 11); }
  ctx.fill();
  ctx.fillStyle = f ? '#fff' : col.main;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ctx.lineTo(Math.cos(a) * 9, Math.sin(a) * 7.5); }
  ctx.fill();
  ctx.fillStyle = '#2b2b2b'; ctx.fillRect(2, -12, 16, 4); ctx.fillRect(2, 8, 16, 4);
  ctx.fillStyle = u.team === 0 ? '#7ff6ff' : '#ff7a6a'; ctx.fillRect(16, -11.5, 2, 3); ctx.fillRect(16, 8.5, 2, 3);
  ctx.fillStyle = col.light; ctx.beginPath(); ctx.arc(3, 0, 3, 0, 7); ctx.fill();
}

function drawBuilding(b) {
  const col = b.team === -1 ? NEUTRAL_COL : TEAM[b.team];
  const f = b.flash > 0;
  ctx.save(); ctx.translate(b.x, b.y);
  if (b.type === 'hq') {
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-44, -40, 92, 92);
    ctx.fillStyle = '#34373a'; ctx.fillRect(-47, -47, 94, 94);
    ctx.fillStyle = '#44484c'; ctx.fillRect(-42, -42, 84, 84);
    ctx.strokeStyle = '#2a2c2e'; ctx.lineWidth = 1;
    for (let i = -42; i <= 42; i += 21) { ctx.beginPath(); ctx.moveTo(i, -42); ctx.lineTo(i, 42); ctx.moveTo(-42, i); ctx.lineTo(42, i); ctx.stroke(); }
    // hazard corners
    ctx.fillStyle = '#c9a227';
    for (const [x, y] of [[-47, -47], [37, -47], [-47, 37], [37, 37]]) ctx.fillRect(x, y, 10, 10);
    ctx.fillStyle = '#222';
    for (const [x, y] of [[-47, -47], [37, -47], [-47, 37], [37, 37]]) { ctx.fillRect(x + 3, y, 2, 10); ctx.fillRect(x + 7, y, 2, 10); }
    // dome
    ctx.fillStyle = f ? '#fff' : col.dark; ctx.beginPath(); ctx.arc(0, 0, 27, 0, 7); ctx.fill();
    ctx.fillStyle = f ? '#fff' : col.main; ctx.beginPath(); ctx.arc(0, 0, 21, 0, 7); ctx.fill();
    ctx.fillStyle = col.light; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(-6, -6, 9, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    // defense gun
    ctx.save(); ctx.rotate(b.turret);
    ctx.fillStyle = '#2b2b2b'; ctx.fillRect(10, -2, 20, 4);
    ctx.fillStyle = '#555'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, 7); ctx.fill();
    ctx.restore();
    // antenna & blinking lights
    ctx.strokeStyle = '#999'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(30, -30); ctx.lineTo(40, -40); ctx.stroke();
    const blink = Math.sin(b.spin * 4) > 0;
    ctx.fillStyle = blink ? col.light : col.dark;
    for (const [x, y] of [[-38, 0], [38, 0], [0, -38], [0, 38]]) { ctx.beginPath(); ctx.arc(x, y, 2.5, 0, 7); ctx.fill(); }
    ctx.fillStyle = blink ? '#ff4040' : '#601010'; ctx.beginPath(); ctx.arc(40, -40, 2.5, 0, 7); ctx.fill();
  } else if (b.type === 'relay') {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-26, -24, 56, 56);
    ctx.fillStyle = '#3a3c3e'; ctx.fillRect(-28, -28, 56, 56);
    ctx.strokeStyle = col.main; ctx.lineWidth = 2; ctx.strokeRect(-24, -24, 48, 48);
    ctx.fillStyle = col.dark; ctx.beginPath(); ctx.arc(0, 0, 13, 0, 7); ctx.fill();
    ctx.fillStyle = col.main; ctx.beginPath(); ctx.arc(0, 0, 8, 0, 7); ctx.fill();
    ctx.save(); ctx.rotate(b.team === -1 ? 0.6 : b.spin * 1.5);
    ctx.strokeStyle = '#ccc'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 18, -0.5, 0.5); ctx.stroke();
    ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(18, 0); ctx.stroke();
    ctx.restore();
    if (b.capture > 0 && b.captureTeam >= 0) {
      ctx.strokeStyle = TEAM[b.captureTeam].light; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, 0, 32, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * b.capture / 10); ctx.stroke();
    }
  } else if (b.type === 'turret') {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(3, 4, 14, 0, 7); ctx.fill();
    ctx.fillStyle = '#4a4c4e';
    ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8; ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 14); } ctx.fill();
    ctx.rotate(b.turret);
    ctx.fillStyle = '#2b2b2b'; ctx.fillRect(4, -2, 13, 4);
    ctx.fillStyle = f ? '#fff' : col.main; ctx.beginPath(); ctx.arc(0, 0, 8, 0, 7); ctx.fill();
    ctx.fillStyle = col.dark; ctx.beginPath(); ctx.arc(0, 0, 4, 0, 7); ctx.fill();
  }
  ctx.restore();
}

function drawEffects(inView) {
  for (const e of G.effects) {
    if (!inView(e)) continue;
    const k = e.life / e.max;
    switch (e.type) {
      case 'fire':
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(255,${Math.floor(120 + 120 * k)},${Math.floor(40 * k)},${k})`;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.size * (0.5 + k * 0.5), 0, 7); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        break;
      case 'smoke':
        ctx.fillStyle = `rgba(${e.color},${0.45 * k})`;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.size * (1.6 - k * 0.6), 0, 7); ctx.fill();
        break;
      case 'spark':
        ctx.fillStyle = e.color; ctx.globalAlpha = k;
        ctx.fillRect(e.x - e.size / 2, e.y - e.size / 2, e.size, e.size); ctx.globalAlpha = 1;
        break;
      case 'debris':
        ctx.fillStyle = e.color; ctx.globalAlpha = Math.min(1, k * 2);
        ctx.fillRect(e.x - e.size / 2, e.y - e.size / 2, e.size, e.size); ctx.globalAlpha = 1;
        break;
      case 'flash':
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(255,230,170,${0.8 * k})`;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, 7); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        break;
      case 'tracer':
        ctx.strokeStyle = e.color; ctx.globalAlpha = k; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x2, e.y2); ctx.stroke(); ctx.globalAlpha = 1;
        break;
      case 'beam':
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = e.color; ctx.globalAlpha = k; ctx.lineWidth = (e.wide || 3) * k + 1;
        ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x2, e.y2); ctx.stroke();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = ((e.wide || 3) * k) / 3 + 0.5;
        ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x2, e.y2); ctx.stroke();
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        break;
      case 'ring':
        ctx.strokeStyle = e.color; ctx.globalAlpha = k; ctx.lineWidth = e.w * k + 1;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r0 + (e.r1 - e.r0) * (1 - k), 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
        break;
      case 'text':
        ctx.globalAlpha = Math.min(1, k * 2); ctx.fillStyle = e.color; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(e.text, e.x, e.y); ctx.globalAlpha = 1;
        break;
    }
  }
}

function renderMinimap() {
  const mm = $('minimap'), m = mm.getContext('2d');
  const sz = mm.width;
  m.imageSmoothingEnabled = false;
  m.drawImage(minimapBase, 0, 0, sz, sz);
  m.imageSmoothingEnabled = true;
  m.drawImage(fogCanvas, 0, 0, sz, sz);
  const s = sz / (G.W * TILE);
  for (const b of G.buildings) {
    if (b.team === 1 && !G.explored[b.ty * G.W + b.tx]) continue;
    m.fillStyle = b.team === -1 ? '#ddd' : TEAM[b.team].main;
    const w = Math.max(3, b.size * TILE * s);
    m.fillRect(b.x * s - w / 2, b.y * s - w / 2, w, w);
  }
  for (const u of G.units) {
    if (u.team === 1 && !visibleTo(0, u)) continue;
    m.fillStyle = u.team === 0 ? '#7fe9ff' : '#ff6a50';
    m.fillRect(u.x * s - 1, u.y * s - 1, 2.5, 2.5);
  }
  if (G.ping) {
    m.strokeStyle = '#ff5050'; m.lineWidth = 1.5;
    m.beginPath(); m.arc(G.ping.x * s, G.ping.y * s, 4 + (3 - G.ping.t) * 3 % 6, 0, 7); m.stroke();
  }
  m.strokeStyle = '#fff'; m.lineWidth = 1;
  m.strokeRect(G.cam.x * s, G.cam.y * s, viewW / G.cam.zoom * s, viewH / G.cam.zoom * s);
}

// Animated backdrop for menus
const backdrop = { t: 0, stars: Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), s: Math.random() })) };
function renderMenuBackdrop() {
  backdrop.t += 1 / 60;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const g = ctx.createLinearGradient(0, 0, 0, viewH);
  g.addColorStop(0, '#0d1418'); g.addColorStop(1, '#241a12');
  ctx.fillStyle = g; ctx.fillRect(0, 0, viewW, viewH);
  for (const s of backdrop.stars) {
    ctx.fillStyle = `rgba(200,230,255,${0.2 + 0.5 * s.s * (0.6 + 0.4 * Math.sin(backdrop.t * 2 + s.x * 20))})`;
    ctx.fillRect(s.x * viewW, s.y * viewH * 0.6, 1.5, 1.5);
  }
  ctx.fillStyle = '#1a130d';
  ctx.beginPath(); ctx.moveTo(0, viewH);
  for (let x = 0; x <= viewW; x += 20) ctx.lineTo(x, viewH * 0.72 + Math.sin(x * 0.013) * 30 + Math.sin(x * 0.041) * 12);
  ctx.lineTo(viewW, viewH); ctx.fill();
  // distant flashes
  if (Math.random() < 0.03) backdrop.flash = { x: Math.random() * viewW, y: viewH * 0.72, t: 0.4 };
  if (backdrop.flash) {
    const f = backdrop.flash; f.t -= 1 / 60;
    ctx.fillStyle = `rgba(255,170,90,${Math.max(0, f.t)})`;
    ctx.beginPath(); ctx.arc(f.x, f.y, 40 * (0.5 - f.t + 0.3), 0, 7); ctx.fill();
    if (f.t <= 0) backdrop.flash = null;
  }
}

// =====================================================================
// HUD
// =====================================================================
const hudCache = { handVer: -1, last: 0 };
function buildHud() {
  const bar = $('buildbar');
  bar.innerHTML = '';
  BUILD_ORDER.forEach((type, i) => {
    const d = UNITS[type];
    const b = document.createElement('button');
    b.className = 'bbtn'; b.dataset.type = type;
    const icon = document.createElement('canvas'); icon.width = 68; icon.height = 68;
    drawIcon(icon, type);
    b.appendChild(icon);
    b.insertAdjacentHTML('beforeend', `<span class="nm">${d.name}</span><span class="cost">◈${d.cost}</span><span class="q"></span><span class="prog"></span>`);
    b.title = `${d.name} (${i + 1}) — hold or right-click to cancel`;
    let pressT = null, longFired = false;
    b.addEventListener('pointerdown', (e) => {
      Sound.init(); longFired = false;
      pressT = setTimeout(() => { longFired = true; if (cancelUnit(G.teams[0], type)) Sound.play('deny'); }, 450);
      e.stopPropagation();
    });
    const clear = () => { if (pressT) clearTimeout(pressT); pressT = null; };
    b.addEventListener('pointerup', (e) => {
      clear();
      if (!longFired && e.button !== 2) queueUnit(G.teams[0], type);
    });
    b.addEventListener('pointerleave', clear);
    b.addEventListener('pointercancel', clear);
    b.addEventListener('contextmenu', (e) => { e.preventDefault(); clear(); if (!longFired) cancelUnit(G.teams[0], type); });
    bar.appendChild(b);
  });
  hudCache.handVer = -1;
}

function drawIcon(cv, type) {
  const c = cv.getContext('2d');
  c.translate(34, 34);
  const s = UNITS[type].inf ? 4 : type === 'colossus' ? 1.6 : 2.1;
  c.scale(s, s);
  const fake = { type, d: UNITS[type], team: 0, angle: -Math.PI / 2, turret: -Math.PI / 2, walk: 0, path: null, flash: 0, r: UNITS[type].size };
  // reuse the in-game drawing routines by temporarily swapping the context
  ctxSwap(c, () => {
    switch (type) {
      case 'trooper': case 'lancer': case 'engineer': drawInfantry(fake, TEAM[0], false); break;
      case 'raider': drawRaider(fake, TEAM[0], false); break;
      case 'tank': drawTank(fake, TEAM[0], false); break;
      case 'howler': drawHowler(fake, TEAM[0], false); break;
      case 'colossus': drawColossus(fake, TEAM[0], false); break;
    }
  });
}
function ctxSwap(c, fn) { const real = ctx; ctx = c; try { fn(); } finally { ctx = real; } }

function updateHud(force) {
  const now = performance.now();
  if (!force && now - hudCache.last < 150) return;
  hudCache.last = now;
  const t = G.teams[0];
  $('credits').textContent = '◈ ' + Math.floor(t.credits);
  $('income').textContent = '+' + t.income.toFixed(0) + '/s';
  $('unitcount').textContent = '⚑ ' + teamUnits(0).length + '/' + MAX_UNITS;
  $('relaycount').textContent = '⌖ ' + G.buildings.filter((b) => b.type === 'relay' && b.team === 0).length + '/' + G.buildings.filter((b) => b.type === 'relay').length;
  const m = Math.floor(G.time / 60), s = Math.floor(G.time % 60);
  $('clock').textContent = `${m}:${String(s).padStart(2, '0')}`;
  $('selinfo').textContent = G.selection.length ? `${G.selection.length} selected` : (t.sabotage > 0 ? 'Production sabotaged!' : '');
  // build bar
  for (const b of $('buildbar').children) {
    const type = b.dataset.type;
    const n = t.queue.filter((q) => q === type).length;
    b.querySelector('.q').textContent = n ? n : '';
    b.classList.toggle('poor', t.credits < UNITS[type].cost || !alive(t.hq));
    const prog = b.querySelector('.prog');
    prog.style.width = t.queue[0] === type ? (100 * t.prod / buildTime(type)).toFixed(0) + '%' : '0';
  }
  // cards
  if (hudCache.handVer !== t.handVer) {
    hudCache.handVer = t.handVer;
    const wrap = $('cards');
    wrap.innerHTML = '';
    t.hand.forEach((k, i) => {
      const c = CARDS[k];
      const el = document.createElement('div');
      el.className = 'card'; el.style.setProperty('--c', c.color);
      el.title = `${c.name}: ${c.desc} (${CARD_KEYS[i]})`;
      el.innerHTML = `<span class="key">${CARD_KEYS[i]}</span><span class="ic">${c.icon}</span><span>${c.name}</span>`;
      el.addEventListener('pointerdown', (e) => { e.stopPropagation(); Sound.init(); activateCard(i); });
      wrap.appendChild(el);
    });
    for (let i = t.hand.length; i < HAND_MAX; i++) {
      const el = document.createElement('div'); el.className = 'card empty'; wrap.appendChild(el);
    }
    const timer = document.createElement('div'); timer.className = 'card-timer'; timer.id = 'cardtimer'; wrap.prepend(timer);
  }
  const ct = $('cardtimer');
  if (ct) ct.textContent = t.hand.length >= HAND_MAX ? 'hand full' : `next ${Math.ceil(t.cardT)}s`;
  [...$('cards').querySelectorAll('.card')].forEach((el, i) => el.classList.toggle('armed', i === G.targeting));
}

function activateCard(i) {
  if (!G || G.over) return;
  const t = G.teams[0];
  const k = t.hand[i];
  if (!k) return;
  const c = CARDS[k];
  if (G.targeting === i) { cancelTargeting(); return; }
  if (c.target === 'none') { playCard(t, i, 0, 0); cancelTargeting(); return; }
  G.targeting = i;
  G.rallyMode = false;
  showBanner(`${c.name}: ${c.desc} Tap a target.`);
  hudCache.last = 0;
}
function cancelTargeting() { if (G) { G.targeting = -1; G.rallyMode = false; G.hqSelected = false; } hideBanner(); }
function showBanner(text) { $('bannertext').textContent = text; $('banner').classList.remove('hidden'); }
function hideBanner() { $('banner').classList.add('hidden'); }

function ticker(text, cls) {
  const el = document.createElement('div');
  el.textContent = text; if (cls) el.className = cls;
  const t = $('ticker');
  t.appendChild(el);
  while (t.children.length > 4) t.removeChild(t.firstChild);
  setTimeout(() => el.remove(), 4000);
}

function setToggle(act, on) {
  const b = document.querySelector(`#actions [data-act="${act}"]`);
  if (b) b.classList.toggle('on', on);
}

// =====================================================================
// Input
// =====================================================================
const input = { pointers: new Map(), box: null, pinch: null, lastTap: { t: 0, type: null }, panning: false };

function pickEntity(wx, wy, filter) {
  let best = null, bd = 1e9;
  const slack = 10 / G.cam.zoom;
  for (const u of G.units) {
    if (!filter(u)) continue;
    const d = hypot(u.x - wx, u.y - wy);
    if (d < u.r + slack && d < bd) { bd = d; best = u; }
  }
  if (best) return best;
  for (const b of G.buildings) {
    if (!filter(b)) continue;
    if (Math.abs(b.x - wx) < b.r && Math.abs(b.y - wy) < b.r) return b;
  }
  return null;
}

function setSelection(list) {
  for (const u of G.selection) u.selected = false;
  G.selection = list.filter((u) => !u.dead);
  for (const u of G.selection) u.selected = true;
  G.hqSelected = false;
  if (G.selection.length) Sound.play('select');
}

function handleTap(sx, sy, button, shift) {
  const w = screenToWorld(sx, sy);
  const t = G.teams[0];
  if (G.targeting >= 0) {
    if (playCard(t, G.targeting, w.x, w.y)) cancelTargeting();
    return;
  }
  if (G.rallyMode) {
    t.rally = { x: w.x, y: w.y };
    G.rallyMode = false; hideBanner();
    G.marker = { x: w.x, y: w.y, t: 0.6, color: '#7dff9a' };
    ticker('Rally point set', 'good');
    return;
  }
  const own = button !== 2 ? pickEntity(w.x, w.y, (e) => e.team === 0 && e.kind === 'unit') : null;
  if (own) {
    const now = performance.now();
    if (now - input.lastTap.t < 350 && input.lastTap.type === own.type) {
      setSelection(G.units.filter((u) => u.team === 0 && u.type === own.type && visibleOnScreen(u)));
    } else if (shift) {
      if (own.selected) setSelection(G.selection.filter((u) => u !== own)); else setSelection([...G.selection, own]);
    } else setSelection([own]);
    input.lastTap = { t: now, type: own.type };
    return;
  }
  const ownB = button !== 2 ? pickEntity(w.x, w.y, (e) => e.team === 0 && e.kind === 'building' && e.type === 'hq') : null;
  if (ownB && !G.selection.length) {
    G.rallyMode = true; G.hqSelected = true;
    showBanner('Command Base: tap the map to set a rally point.');
    Sound.play('select');
    return;
  }
  if (!G.selection.length) return;
  const enemy = pickEntity(w.x, w.y, (e) => canTarget(0, e) && visibleTo(0, e));
  if (enemy) {
    orderAttack(G.selection, enemy);
    G.marker = { x: enemy.x, y: enemy.y, t: 0.6, color: '#ff5050' };
  } else {
    orderMove(G.selection, w.x, w.y, G.amove);
    G.marker = { x: w.x, y: w.y, t: 0.6, color: G.amove ? '#ffb040' : '#7dff9a' };
    if (G.amove) { G.amove = false; setToggle('amove', false); }
  }
  Sound.play('order');
}

function boxSelect(b) {
  const a = screenToWorld(Math.min(b.x0, b.x1), Math.min(b.y0, b.y1));
  const c = screenToWorld(Math.max(b.x0, b.x1), Math.max(b.y0, b.y1));
  const list = G.units.filter((u) => u.team === 0 && u.x >= a.x && u.x <= c.x && u.y >= a.y && u.y <= c.y);
  setSelection(list);
}

function canvasPos(e) { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }

canvas.addEventListener('pointerdown', (e) => {
  Sound.init();
  if (!G || G.paused) return;
  canvas.setPointerCapture(e.pointerId);
  const p = canvasPos(e);
  input.pointers.set(e.pointerId, { x0: p.x, y0: p.y, x: p.x, y: p.y, button: e.button, type: e.pointerType, moved: false, shift: e.shiftKey });
  if (input.pointers.size === 2) {
    const [a, b] = [...input.pointers.values()];
    a.moved = b.moved = true;
    input.box = null;
    input.pinch = { d0: hypot(a.x - b.x, a.y - b.y), z0: G.cam.zoom, mid: screenToWorld((a.x + b.x) / 2, (a.y + b.y) / 2) };
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (!G) return;
  const p = canvasPos(e);
  G.hover = screenToWorld(p.x, p.y);
  const ptr = input.pointers.get(e.pointerId);
  if (!ptr) return;
  const dx = p.x - ptr.x, dy = p.y - ptr.y;
  ptr.x = p.x; ptr.y = p.y;
  if (!ptr.moved && hypot(p.x - ptr.x0, p.y - ptr.y0) > 9) ptr.moved = true;
  if (input.pinch && input.pointers.size >= 2) {
    const [a, b] = [...input.pointers.values()];
    const d = hypot(a.x - b.x, a.y - b.y);
    G.cam.zoom = clamp(input.pinch.z0 * d / input.pinch.d0, 0.45, 2.2);
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    G.cam.x = input.pinch.mid.x - mx / G.cam.zoom; G.cam.y = input.pinch.mid.y - my / G.cam.zoom;
    clampCamera();
    return;
  }
  if (!ptr.moved) return;
  const boxing = ptr.type === 'mouse' ? ptr.button === 0 : G.boxMode;
  if (boxing && G.targeting < 0) {
    input.box = { x0: ptr.x0, y0: ptr.y0, x1: p.x, y1: p.y };
  } else {
    G.cam.x -= dx / G.cam.zoom; G.cam.y -= dy / G.cam.zoom; clampCamera();
  }
});
const endPointer = (e) => {
  if (!G) return;
  const ptr = input.pointers.get(e.pointerId);
  input.pointers.delete(e.pointerId);
  if (!ptr) return;
  if (input.pinch) { if (input.pointers.size < 2) input.pinch = null; return; }
  if (input.box) { boxSelect(input.box); input.box = null; return; }
  if (!ptr.moved && e.type === 'pointerup') handleTap(ptr.x0, ptr.y0, ptr.button, ptr.shift);
};
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('wheel', (e) => {
  if (!G) return;
  e.preventDefault();
  const p = canvasPos(e);
  const before = screenToWorld(p.x, p.y);
  G.cam.zoom = clamp(G.cam.zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12), 0.45, 2.2);
  G.cam.x = before.x - p.x / G.cam.zoom; G.cam.y = before.y - p.y / G.cam.zoom;
  clampCamera();
}, { passive: false });
document.addEventListener('gesturestart', (e) => e.preventDefault());

// minimap navigation
const mm = $('minimap');
const mmNav = (e) => {
  if (!G) return;
  const r = mm.getBoundingClientRect();
  const fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
  centerCamera(fx * G.W * TILE, fy * G.H * TILE);
};
mm.addEventListener('pointerdown', (e) => { e.stopPropagation(); mm.setPointerCapture(e.pointerId); mmNav(e); mm.dragging = true; });
mm.addEventListener('pointermove', (e) => { if (mm.dragging) mmNav(e); });
mm.addEventListener('pointerup', () => { mm.dragging = false; });

// action buttons
$('actions').addEventListener('pointerdown', (e) => {
  const b = e.target.closest('button');
  if (!b || !G) return;
  e.stopPropagation(); Sound.init();
  doAction(b.dataset.act);
});
function doAction(act) {
  switch (act) {
    case 'all': setSelection(G.units.filter((u) => u.team === 0 && u.type !== 'engineer')); break;
    case 'box': G.boxMode = !G.boxMode; setToggle('box', G.boxMode); break;
    case 'amove': G.amove = !G.amove; setToggle('amove', G.amove); break;
    case 'stop': orderStop(G.selection); break;
    case 'clear': setSelection([]); cancelTargeting(); break;
  }
}
$('bannercancel').addEventListener('click', cancelTargeting);

const keys = new Set();
window.addEventListener('keydown', (e) => {
  if (!G || G.over) return;
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  keys.add(e.key);
  const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && k === 'a') { e.preventDefault(); doAction('all'); return; }
  if (k === 'escape') { if (G.targeting >= 0 || G.rallyMode) cancelTargeting(); else togglePause(); return; }
  if (k === 'a') doAction('amove');
  else if (k === 's') doAction('stop');
  else if (k === 'b' && !e.shiftKey) {
    // B doubles as 5th card key when a fifth card exists and shift held
    doAction('box');
  } else if (k === 'p') togglePause();
  if (/^[1-7]$/.test(k)) queueUnit(G.teams[0], BUILD_ORDER[+k - 1]);
  const ci = ['z', 'x', 'c', 'v'].indexOf(k);
  if (ci >= 0) activateCard(ci);
  if (k === 'b' && e.shiftKey) activateCard(4);
});
window.addEventListener('keyup', (e) => keys.delete(e.key));
function keyPan(dt) {
  const sp = 700 * dt / G.cam.zoom;
  if (keys.has('ArrowLeft')) G.cam.x -= sp;
  if (keys.has('ArrowRight')) G.cam.x += sp;
  if (keys.has('ArrowUp')) G.cam.y -= sp;
  if (keys.has('ArrowDown')) G.cam.y += sp;
  if (keys.size) clampCamera();
}

// =====================================================================
// Screens
// =====================================================================
const SCREENS = ['menu', 'campaign', 'briefing', 'skirmish', 'help', 'pause', 'end'];
function showScreen(name) {
  for (const s of SCREENS) $('scr-' + s).classList.toggle('hidden', s !== name);
  if (name === 'campaign') renderMissionList();
}
// main-menu option descriptions (hover or keyboard focus)
const menuDesc = $('menu-desc');
// touch screens can't hover, so give them a one-line overview instead
if (window.matchMedia && window.matchMedia('(hover: none)').matches) menuDesc.textContent = 'Campaign: story missions · Skirmish: one custom battle · How to Play: controls and rules.';
const menuDescDefault = menuDesc.textContent;
document.querySelectorAll('.title-panel [data-desc]').forEach((b) => {
  const show = () => { menuDesc.textContent = b.dataset.desc; menuDesc.classList.add('active'); };
  const hide = () => { menuDesc.textContent = menuDescDefault; menuDesc.classList.remove('active'); };
  b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') show(); });
  b.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hide(); });
  b.addEventListener('focus', show);
  b.addEventListener('blur', hide);
});
document.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => { Sound.init(); showScreen(b.dataset.go); }));

function renderMissionList() {
  const prog = store('ef_progress') || 0;
  const list = $('missionlist');
  list.innerHTML = '';
  CAMPAIGN.forEach((m, i) => {
    const b = document.createElement('button');
    b.className = 'mission' + (i > prog ? ' locked' : '') + (i < prog ? ' done' : '');
    b.innerHTML = `<b>${i + 1}. ${m.title}</b><small>${DIFFS[m.diff].name} · ${m.relays} relays${i > prog ? ' · locked' : ''}</small>`;
    b.onclick = () => { if (i <= prog) openBriefing(i); else Sound.play('deny'); };
    list.appendChild(b);
  });
}
let briefIndex = 0;
function openBriefing(i) {
  briefIndex = i;
  const m = CAMPAIGN[i];
  $('brief-title').textContent = `Mission ${i + 1}: ${m.title}`;
  $('brief-text').textContent = m.brief;
  G = null;
  $('hud').classList.add('hidden');
  showScreen('briefing');
}
$('brief-start').addEventListener('click', () => {
  const m = CAMPAIGN[briefIndex];
  startGame({ mission: briefIndex, title: m.title, seed: m.seed, size: m.size, relays: m.relays, diff: m.diff,
    credits: m.credits, player: m.player, enemy: m.enemy, turrets: m.turrets });
});
$('sk-start').addEventListener('click', () => {
  const seedIn = parseInt($('sk-seed').value, 10);
  startGame({
    seed: Number.isFinite(seedIn) ? seedIn : Math.floor(Math.random() * 1e6),
    size: +$('sk-size').value, relays: +$('sk-relays').value, diff: $('sk-diff').value, credits: +$('sk-credits').value,
    player: { trooper: 4, lancer: 2, engineer: 1 }, enemy: { trooper: 4, lancer: 2, engineer: 1 }, turrets: 0,
  });
});

function togglePause() {
  if (!G || G.over) return;
  G.paused = !G.paused;
  showScreen(G.paused ? 'pause' : null);
}
$('btnMenu').addEventListener('click', togglePause);
$('p-resume').addEventListener('click', togglePause);
$('p-restart').addEventListener('click', () => { const cfg = G.cfg; startGame(cfg); });
$('p-quit').addEventListener('click', () => { G = null; $('hud').classList.add('hidden'); showScreen('menu'); });
const soundBtn = $('p-sound');
const refreshSoundBtn = () => { soundBtn.textContent = 'Sound: ' + (Sound.enabled ? 'On' : 'Off'); };
refreshSoundBtn();
soundBtn.addEventListener('click', () => { Sound.enabled = !Sound.enabled; store('ef_sound', Sound.enabled); refreshSoundBtn(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && G && !G.paused && !G.over) togglePause(); });

// =====================================================================
// Main loop
// =====================================================================
let lastT = performance.now(), acc = 0, mmT = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.25, (now - lastT) / 1000);
  lastT = now;
  if (G && !G.paused) {
    acc += dt * (window.__speed || 1);
    let steps = 0;
    while (acc >= STEP && steps < 8) { update(STEP); acc -= STEP; steps++; }
    if (steps >= 8) acc = 0;
    keyPan(dt);
    mmT -= dt;
    if (mmT <= 0) { mmT = 0.2; renderMinimap(); }
    updateHud();
  }
  render();
}

window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 200));
resize();
showScreen('menu');
requestAnimationFrame(frame);

// debug hooks for automated testing
window.__ef = { get G() { return G; }, startGame, CAMPAIGN, queueUnit, playCard, orderMove };
})();
