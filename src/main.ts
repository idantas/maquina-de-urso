import './style.css';
import './pwa';
import { CHAR_COLORS, CHAR_IDS, CHAR_NAMES, SPRITE_BOX, makeSilhouette, makeSprite, type CharId } from './characters';
import { STAGES, loadStage, loadUnlocked, saveStage, saveUnlocked } from './stages';
import { drawBg } from './backgrounds';
import { Sfx } from './audio';
import { LEVELS, LEVEL_IDS, addEntry, loadLevel, loadName, loadRank, saveLevel, saveName, type Level } from './rank';

// ---------- layout lógico da máquina (escalado pra tela) ----------
const W = 400;
const H = 640;
const GL = 34; // vidro: esquerda
const GR = 366; // vidro: direita
const GT = 100; // vidro: topo
const GB = 560; // vidro: base
const RAIL_Y = 116;
const FLOOR_Y = 548;
const BARRIER_X = 116; // parede de acrílico do buraco de prêmio
const BARRIER_TOP = 430;
const CHUTE_X = (GL + BARRIER_X) / 2;
const GRAVITY = 1500;
const HUB_BASE = RAIL_Y + 22;
const MIN_LEN = 6;
const MAX_HUB_Y = FLOOR_Y - 46;
const CLAW_MIN_X = GL + 34;
const CLAW_MAX_X = GR - 34;
const GRIP_OPEN = 0.58;
const TAU = Math.PI * 2;

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const sfx = new Sfx();
const canvas = $<HTMLCanvasElement>('game');
const ctx = canvas.getContext('2d')!;
const fx = $<HTMLCanvasElement>('fx');
const fctx = fx.getContext('2d')!;
const stage = $('stage');
const grabBtn = $<HTMLButtonElement>('grab');

let scale = 1;
let dpr = 1;
const sprites = new Map<CharId, HTMLCanvasElement>();

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 3);
  const r = stage.getBoundingClientRect();
  scale = Math.max(0.1, Math.min(r.width / W, r.height / H));
  canvas.style.width = `${W * scale}px`;
  canvas.style.height = `${H * scale}px`;
  canvas.width = Math.round(W * scale * dpr);
  canvas.height = Math.round(H * scale * dpr);
  fx.width = Math.round(innerWidth * dpr);
  fx.height = Math.round(innerHeight * dpr);
  const px = SPRITE_BOX * (34 / 40) * scale * dpr;
  for (const id of CHAR_IDS) sprites.set(id, makeSprite(id, px));
}
new ResizeObserver(resize).observe(stage);
window.addEventListener('resize', resize);

// ---------- pelúcias + física simples de círculos ----------
interface Plush {
  char: CharId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
  va: number;
  held: boolean;
}

let plushes: Plush[] = [];

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function spawn(n: number, fromTop: boolean) {
  // cada personagem aparece uma vez antes de repetir
  const ids = STAGES[stageIdx].chars;
  const bag = [...shuffle([...ids]), ...shuffle([...ids])].slice(0, n);
  bag.forEach((char, i) => {
    const r = rand(30, 33);
    plushes.push({
      char,
      r,
      // em fileiras de 3, pra pilha não tombar pro buraco
      x: BARRIER_X + 44 + (i % 3) * 82 + rand(-8, 8),
      y: (fromTop ? GT - 40 : FLOOR_Y - r) - Math.floor(i / 3) * 62,
      vx: 0,
      vy: 0,
      a: rand(-0.4, 0.4),
      va: 0,
      held: false,
    });
  });
}

function physicsStep(dt: number) {
  for (const p of plushes) {
    if (p.held) continue;
    p.vy += GRAVITY * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.999;
    p.va += -Math.sin(p.a) * 12 * dt; // pelúcia tende a ficar em pé
    p.va *= 0.97;
    p.a += p.va * dt;
  }

  for (let iter = 0; iter < 3; iter++) {
    // pelúcia x pelúcia
    for (let i = 0; i < plushes.length; i++) {
      const a = plushes[i];
      for (let j = i + 1; j < plushes.length; j++) {
        const b = plushes[j];
        const wa = a.held ? 0 : 1;
        const wb = b.held ? 0 : 1;
        if (wa + wb === 0) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const min = a.r + b.r;
        const d2 = dx * dx + dy * dy;
        if (d2 >= min * min || d2 < 1e-6) continue;
        const d = Math.sqrt(d2);
        const nx = dx / d;
        const ny = dy / d;
        const push = (min - d) / (wa + wb);
        a.x -= nx * push * wa;
        a.y -= ny * push * wa;
        b.x += nx * push * wb;
        b.y += ny * push * wb;
        const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (rv < 0) {
          const jn = (-1.1 * rv) / (wa + wb);
          a.vx -= jn * nx * wa;
          a.vy -= jn * ny * wa;
          b.vx += jn * nx * wb;
          b.vy += jn * ny * wb;
          const tv = (b.vx - a.vx) * -ny + (b.vy - a.vy) * nx;
          a.va += tv * 0.002 * wa;
          b.va -= tv * 0.002 * wb;
        }
      }
    }

    for (const p of plushes) {
      if (p.held) continue;
      // paredes
      if (p.x - p.r < GL) {
        p.x = GL + p.r;
        p.vx = Math.abs(p.vx) * 0.3;
      }
      if (p.x + p.r > GR) {
        p.x = GR - p.r;
        p.vx = -Math.abs(p.vx) * 0.3;
      }
      // chão (não existe em cima do buraco)
      if (p.x >= BARRIER_X && p.y + p.r > FLOOR_Y) {
        p.y = FLOOR_Y - p.r;
        if (p.vy > 0) p.vy = -p.vy * 0.15;
        p.vx *= 0.9;
        p.va = p.vx / p.r;
      }
      // parede de acrílico
      const cx = clamp(p.x, BARRIER_X - 4, BARRIER_X + 4);
      const cy = clamp(p.y, BARRIER_TOP, FLOOR_Y + 80);
      let dx = p.x - cx;
      let dy = p.y - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 < p.r * p.r) {
        let d = Math.sqrt(d2);
        if (d < 1e-3) {
          dx = p.x < BARRIER_X ? -1 : 1;
          dy = 0;
          d = 1;
        }
        const nx = dx / d;
        const ny = dy / d;
        const pen = d2 < 1e-6 ? p.r : p.r - d;
        p.x += nx * pen;
        p.y += ny * pen;
        const vn = p.vx * nx + p.vy * ny;
        if (vn < 0) {
          p.vx -= 1.2 * vn * nx;
          p.vy -= 1.2 * vn * ny;
        }
        // não deixa equilibrar em cima da parede
        if (Math.abs(p.x - BARRIER_X) < 6 && p.y < BARRIER_TOP) p.vx += p.x < BARRIER_X ? -8 : 8;
      }
    }
  }

  // caiu no buraco = prêmio!
  const won = plushes.filter((p) => !p.held && p.x < BARRIER_X && p.y - p.r > FLOOR_Y + 6);
  if (won.length && !playing) {
    // antes do jogo começar não vale: devolve pro alto da pilha
    for (const p of won) {
      p.x = GR - p.r - 10;
      p.y = GT;
      p.vx = p.vy = 0;
    }
  } else if (won.length) {
    plushes = plushes.filter((p) => !won.includes(p));
    won.forEach(onWin);
  }
}

// ---------- garra ----------
type ClawState = 'idle' | 'down' | 'closing' | 'up' | 'carry' | 'opening' | 'wait';

const claw = {
  x: CHUTE_X,
  len: MIN_LEN,
  open: 1,
  state: 'idle' as ClawState,
  timer: 0,
  held: null as Plush | null,
  target: null as Plush | null,
  dropAt: -1,
  carried: false,
  sway: 0,
  swayV: 0,
  lastVx: 0,
};
let missStreak = 0;

// barras de neon que vão e voltam (fases 2+)
let obsT = 0;
let bonkT = 0;

function obstacleRects() {
  const cfg = LEVELS[level].obs;
  return STAGES[stageIdx].obstacles.slice(0, cfg.max).map((o) => {
    const w = Math.round(o.w * cfg.width);
    const L = GR - GL - w;
    let p = (obsT * o.speed * cfg.speed + o.phase * 2 * L) % (2 * L);
    if (p > L) p = 2 * L - p;
    return { x: GL + p, y: o.y, w, h: 10 };
  });
}

function clawHitsObstacle() {
  const hx = hubX();
  const hy = hubY();
  const half = 10 + 26 * Math.sin(0.25 + 0.6 * claw.open);
  return obstacleRects().some((r) => hx + half > r.x && hx - half < r.x + r.w && hy + 46 > r.y && hy - 14 < r.y + r.h);
}

function plushHitsObstacle(p: Plush) {
  return obstacleRects().some((r) => {
    const dx = p.x - clamp(p.x, r.x, r.x + r.w);
    const dy = p.y - clamp(p.y, r.y, r.y + r.h);
    return dx * dx + dy * dy < p.r * p.r * 0.7;
  });
}

const hubY = () => HUB_BASE + claw.len;
const hubX = () => claw.x + claw.sway;

function prepareGrab() {
  claw.carried = false;
  claw.target = null;
  claw.dropAt = -1;
  const hx = hubX();
  const hy = hubY();
  let best: Plush | null = null;
  let bestD = Infinity;
  for (const p of plushes) {
    if (p.held) continue;
    const dx = Math.abs(p.x - hx);
    if (dx < p.r * 0.9 && Math.abs(p.y - p.r - (hy + 8)) < 28 && dx < bestD) {
      best = p;
      bestD = dx;
    }
  }
  if (!best) return;
  const cfg = LEVELS[level];
  const q = bestD / best.r;
  const pity = missStreak >= cfg.pity;
  const chance = pity ? 1 : q < 0.35 ? cfg.chance[0] : q < 0.6 ? cfg.chance[1] : cfg.chance[2];
  claw.target = best;
  if (Math.random() > chance) {
    claw.dropAt = Math.max(MIN_LEN + 1, claw.len - rand(25, 65)); // escorrega logo
  } else if (!pity && Math.random() < cfg.slip) {
    claw.dropAt = MIN_LEN + rand(20, 80); // suspense!
  }
}

function release(vx: number) {
  const p = claw.held;
  if (!p) return;
  p.held = false;
  p.vx = vx;
  p.vy = 0;
  claw.held = null;
}

function updateClaw(dt: number) {
  let vx = 0;
  let hum = 0;
  switch (claw.state) {
    case 'idle':
      if (input.dir) {
        const nx = clamp(claw.x + input.dir * LEVELS[level].speed * dt, CLAW_MIN_X, CLAW_MAX_X);
        vx = (nx - claw.x) / dt;
        claw.x = nx;
        if (vx) hum = 85;
      }
      break;
    case 'down': {
      claw.len += 210 * dt;
      hum = 140;
      if (clawHitsObstacle()) {
        // bateu na barra: volta vazia
        bonkT = 0.4;
        sfx.bonk();
        claw.target = null;
        claw.dropAt = -1;
        claw.carried = false;
        claw.state = 'up';
        claw.timer = 0.15;
        break;
      }
      let stop = hubY() >= MAX_HUB_Y;
      if (stop) claw.len = MAX_HUB_Y - HUB_BASE;
      const hx = hubX();
      for (const p of plushes) {
        if (!p.held && Math.abs(p.x - hx) < p.r * 0.8 && hubY() + 8 >= p.y - p.r) stop = true;
      }
      if (stop) {
        claw.state = 'closing';
        prepareGrab();
      }
      break;
    }
    case 'closing': {
      const min = claw.target ? GRIP_OPEN : 0;
      claw.open = Math.max(min, claw.open - dt / 0.35);
      if (claw.open <= min) {
        if (claw.target) {
          claw.held = claw.target;
          claw.held.held = true;
        }
        sfx.grab();
        claw.state = 'up';
        claw.timer = 0.3;
      }
      break;
    }
    case 'up':
      if (claw.timer > 0) {
        claw.timer -= dt;
        break;
      }
      claw.len -= 170 * dt;
      hum = 170;
      if (claw.held && LEVELS[level].obs.knock && plushHitsObstacle(claw.held)) {
        bonkT = 0.4;
        sfx.bonk();
        release(0);
        sfx.drop();
      }
      if (claw.held && claw.dropAt >= 0 && claw.len <= claw.dropAt) {
        release(0);
        sfx.drop();
      }
      if (claw.len <= MIN_LEN) {
        claw.len = MIN_LEN;
        claw.state = 'carry';
      }
      break;
    case 'carry': {
      const d = CHUTE_X - claw.x;
      const step = Math.sign(d) * Math.min(Math.abs(d), 150 * dt);
      claw.x += step;
      vx = step / dt;
      if (step) hum = 85;
      if (Math.abs(d) < 0.5) {
        claw.state = 'opening';
        sfx.open();
      }
      break;
    }
    case 'opening':
      claw.open = Math.min(1, claw.open + dt / 0.3);
      if (claw.held && claw.open > 0.75) {
        claw.carried = true;
        release(0);
      }
      if (claw.open >= 1) {
        claw.state = 'wait';
        claw.timer = 0.6;
      }
      break;
    case 'wait':
      claw.timer -= dt;
      if (claw.timer <= 0) {
        if (!claw.carried) missStreak++;
        claw.state = 'idle';
        claw.target = null;
      }
      break;
  }
  sfx.hum(hum);

  // balanço do cabo
  const acc = vx - claw.lastVx;
  claw.lastVx = vx;
  claw.swayV += -acc * 0.3 * (0.4 + claw.len / 300);
  claw.swayV += (-claw.sway * 60 - claw.swayV * 3) * dt;
  claw.sway += claw.swayV * dt;

  if (claw.held) {
    const p = claw.held;
    const k = Math.min(1, dt * 15);
    p.x += (hubX() - p.x) * k;
    p.y += (hubY() + 8 + p.r - p.y) * k;
    p.vx = vx;
    p.vy = 0;
    p.a *= 0.9;
    p.va = 0;
  }

  grabBtn.classList.toggle('off', claw.state !== 'idle' || coins <= 0);
}

function grab() {
  if (!playing || paused || claw.state !== 'idle' || coins <= 0) return;
  coins--;
  $('coins').textContent = String(coins);
  sfx.click();
  claw.state = 'down';
  claw.open = 1;
}

// ---------- entrada ----------
const input = { dir: 0 };
const held = { kl: false, kr: false };
let stickAxis = 0;
const syncDir = () => {
  const keys = (held.kr ? 1 : 0) - (held.kl ? 1 : 0);
  input.dir = keys || stickAxis;
};

// alavanca: o centro é o meio do elemento, então tocar de um lado já move
const stickEl = $('stick');
const shaft = stickEl.querySelector('.stick-shaft') as HTMLElement;
let stickPointer: number | null = null;

function setStick(clientX: number | null) {
  let v = 0;
  if (clientX !== null) {
    const r = stickEl.getBoundingClientRect();
    v = clamp((clientX - (r.left + r.width / 2)) / 40, -1, 1);
  }
  shaft.style.transform = `rotate(${v * 28}deg)`;
  const axis = Math.abs(v) < 0.2 ? 0 : v;
  if (Math.sign(axis) !== Math.sign(stickAxis) && axis !== 0) sfx.click();
  stickAxis = axis;
  syncDir();
}

stickEl.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  stickPointer = e.pointerId;
  try {
    stickEl.setPointerCapture(e.pointerId);
  } catch {
    // sem captura o arraste ainda funciona dentro da alavanca
  }
  stickEl.classList.add('dragging');
  setStick(e.clientX);
});
stickEl.addEventListener('pointermove', (e) => {
  if (e.pointerId === stickPointer) setStick(e.clientX);
});
for (const ev of ['pointerup', 'pointercancel'] as const)
  stickEl.addEventListener(ev, (e) => {
    if (e.pointerId !== stickPointer) return;
    stickPointer = null;
    stickEl.classList.remove('dragging');
    setStick(null);
  });

grabBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  grabBtn.classList.add('active');
  grab();
});
for (const ev of ['pointerup', 'pointercancel', 'pointerleave'] as const)
  grabBtn.addEventListener(ev, () => grabBtn.classList.remove('active'));

window.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement) {
    if (e.key === 'Enter') startGame();
    return;
  }
  if (e.key === 'Escape') {
    if (paused) resume();
    else openMenu();
    return;
  }
  if (e.key === 'ArrowLeft') held.kl = true;
  else if (e.key === 'ArrowRight') held.kr = true;
  else if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowDown') {
    e.preventDefault();
    if (!winEl.classList.contains('hidden')) hideWin();
    else grab();
  }
  syncDir();
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft') held.kl = false;
  if (e.key === 'ArrowRight') held.kr = false;
  syncDir();
});
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('contextmenu', (e) => e.preventDefault());

const muteBtn = $('mute');
muteBtn.addEventListener('click', () => {
  sfx.setMuted(!sfx.muted);
  muteBtn.textContent = sfx.muted ? '🔇' : '🔊';
});

let started = false;
document.addEventListener('visibilitychange', () => {
  if (!started) return;
  if (document.hidden) sfx.suspend();
  else sfx.unlock();
});

// ---------- vitória / comemoração ----------
let score = 0;
let winT = 0;
let refillTimer: number | undefined;
const winEl = $('win');
let winTimer: number | undefined;

function onWin(p: Plush) {
  score++;
  missStreak = 0;
  if (!cleared && score >= STAGES[stageIdx].goal) {
    cleared = true;
    pendingClear = true;
  }
  updateScoreHud();
  winT = 3.5;

  const mini = makeSprite(p.char, 40 * dpr);
  $('shelf').prepend(mini);

  const big = makeSprite(p.char, 220 * dpr);
  $('winChar').replaceChildren(big);
  const name = $('winName');
  name.textContent = CHAR_NAMES[p.char];
  name.style.setProperty('--c', CHAR_COLORS[p.char]);
  winEl.classList.remove('hidden');
  const card = winEl.querySelector('.card') as HTMLElement;
  card.classList.remove('pop');
  void card.offsetWidth;
  card.classList.add('pop');
  window.clearTimeout(winTimer);
  winTimer = window.setTimeout(hideWin, 3800);

  sfx.win();
  navigator.vibrate?.([80, 40, 80, 40, 160]);
  burst();

  if (plushes.length < 5 && !refillTimer) {
    refillTimer = window.setTimeout(() => {
      spawn(8, true);
      sfx.refill();
      refillTimer = undefined;
    }, 2500);
  }
}

function hideWin() {
  winEl.classList.add('hidden');
  if (pendingClear) {
    pendingClear = false;
    showClear();
  }
}
winEl.addEventListener('pointerdown', hideWin);

// confete + anéis dourados
interface Part {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  color: string;
  ring: boolean;
  /** confete Bauhaus: 0 quadrado, 1 círculo, 2 triângulo */
  shape: number;
  life: number;
}
let parts: Part[] = [];
const CONFETTI = ['#d7372b', '#f2c12e', '#1f5fa8', '#1e1e1c'];

function burst() {
  const rect = canvas.getBoundingClientRect();
  const ox = rect.left + 94 * scale;
  const oy = rect.top + (GB + 36) * scale;
  for (let i = 0; i < 150; i++) {
    parts.push({
      x: rand(0, innerWidth),
      y: rand(-260, -10),
      vx: rand(-60, 60),
      vy: rand(60, 220),
      rot: rand(0, TAU),
      vr: rand(-8, 8),
      size: rand(7, 13),
      color: CONFETTI[i % CONFETTI.length],
      ring: false,
      shape: i % 3,
      life: 6,
    });
  }
  for (let i = 0; i < 28; i++) {
    parts.push({
      x: ox,
      y: oy,
      vx: rand(-280, 280),
      vy: rand(-820, -420),
      rot: rand(0, TAU),
      vr: rand(6, 12),
      size: rand(9, 14),
      color: '#ffd23a',
      ring: true,
      shape: 0,
      life: 4,
    });
  }
}

let fxDirty = false;
function updateFx(dt: number) {
  if (!parts.length && !fxDirty) return;
  for (const p of parts) {
    p.vy += (p.ring ? 900 : 260) * dt;
    if (!p.ring) p.vx += Math.sin(p.rot * 2) * 30 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
    p.life -= dt;
  }
  parts = parts.filter((p) => p.life > 0 && p.y < innerHeight + 40);

  fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  fctx.clearRect(0, 0, innerWidth, innerHeight);
  for (const p of parts) {
    if (p.ring) {
      drawRing(fctx, p.x, p.y, p.size, p.rot);
    } else {
      fctx.save();
      fctx.translate(p.x, p.y);
      fctx.rotate(p.rot);
      fctx.scale(1, Math.cos(p.rot * 1.7));
      fctx.fillStyle = p.color;
      const h = p.size / 2;
      if (p.shape === 1) {
        fctx.beginPath();
        fctx.arc(0, 0, h, 0, TAU);
        fctx.fill();
      } else if (p.shape === 2) {
        fctx.beginPath();
        fctx.moveTo(0, -h);
        fctx.lineTo(h, h);
        fctx.lineTo(-h, h);
        fctx.fill();
      } else {
        fctx.fillRect(-h, -h, p.size, p.size);
      }
      fctx.restore();
    }
  }
  fxDirty = parts.length > 0;
}

// ---------- desenho ----------
function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function drawRing(c: CanvasRenderingContext2D, x: number, y: number, R: number, spin: number) {
  c.save();
  c.translate(x, y);
  c.scale(Math.max(0.15, Math.abs(Math.cos(spin))), 1);
  c.beginPath();
  c.arc(0, 0, R, 0, TAU);
  c.lineWidth = R * 0.38;
  c.strokeStyle = '#f2b51d';
  c.stroke();
  c.beginPath();
  c.arc(0, 0, R, -2.5, -1.2);
  c.lineWidth = R * 0.14;
  c.strokeStyle = '#fff6b0';
  c.stroke();
  c.restore();
}

// estado da luz-piloto da placa (pisca às vezes)
let signFlicker = 0;
let nextFlicker = rand(4, 9);

// ilustração: paleta Braun (Dieter Rams) + primárias Bauhaus
const RAMS = {
  body: '#efeee9',
  line: '#d3d1ca',
  ink: '#1e1e1c',
  alu: '#c4c6c8',
  aluDark: '#85898e',
  off: '#dcdad3',
  orange: '#ee6a1f',
  green: '#3e9c4b',
};
const BAUHAUS = ['#d7372b', '#f2c12e', '#1f5fa8', '#1e1e1c'];

/** Cor da fase, chapada (sem brilho). Na vitória, gira pelas primárias. */
function stageColor(t: number) {
  if (winT > 0) return BAUHAUS[Math.floor(t * 8) % 3];
  return `hsl(${STAGES[stageIdx].hue},72%,48%)`;
}

function drawCabinet() {
  // gabinete de chapa pintada: luz de cima, sombra no chão
  rr(ctx, 12, 4, 376, 632, 18);
  const g = ctx.createLinearGradient(0, 4, 0, 636);
  g.addColorStop(0, '#f8f7f3');
  g.addColorStop(1, '#e2e1db');
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = RAMS.line;
  ctx.stroke();
  // chanfro: brilho na borda de cima
  rr(ctx, 14, 6, 372, 628, 16);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.stroke();
}

function drawSign(t: number) {
  const text = STAGES[stageIdx].sign.toLowerCase();
  ctx.save();
  ctx.font = "600 26px 'Geist', system-ui, sans-serif";
  const fit = Math.min(1, 270 / ctx.measureText(text).width);
  ctx.font = `600 ${Math.floor(26 * fit)}px 'Geist', system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = RAMS.ink;
  ctx.fillText(text, GL + 2, 56);
  // número da fase e luz-piloto
  ctx.font = "500 11px 'Geist', system-ui, sans-serif";
  ctx.textAlign = 'right';
  ctx.fillStyle = RAMS.aluDark;
  ctx.fillText(`${stageIdx + 1}/${STAGES.length}`, GR - 20, 57);
  const flick = signFlicker > 0 && Math.floor(t * 20) % 2 === 0;
  ctx.beginPath();
  ctx.arc(GR - 6, 56, 5, 0, TAU);
  ctx.fillStyle = flick ? RAMS.off : stageColor(t);
  ctx.fill();
  // fio separador
  ctx.fillStyle = RAMS.line;
  ctx.fillRect(GL, 80, GR - GL, 1.5);
  ctx.restore();
}

function drawInterior(t: number) {
  ctx.save();
  rr(ctx, GL, GT, GR - GL, GB - GT, 6);
  ctx.clip();

  ctx.save();
  ctx.translate(GL, GT);
  drawBg(ctx, STAGES[stageIdx].bg, GR - GL, GB - GT, t);
  ctx.restore();

  // trilho
  const rg = ctx.createLinearGradient(0, RAIL_Y - 4, 0, RAIL_Y + 2);
  rg.addColorStop(0, '#6f7378');
  rg.addColorStop(0.4, '#eef0f1');
  rg.addColorStop(1, '#55595e');
  ctx.fillStyle = rg;
  ctx.fillRect(GL, RAIL_Y - 4, GR - GL, 6);

  // buraco do prêmio
  ctx.fillStyle = RAMS.ink;
  ctx.fillRect(GL, FLOOR_Y, BARRIER_X - GL, GB - FLOOR_Y);
  ctx.fillStyle = stageColor(t);
  ctx.fillRect(GL, FLOOR_Y, BARRIER_X - GL, 2);

  // chão
  ctx.fillStyle = '#3a3936';
  ctx.fillRect(BARRIER_X, FLOOR_Y, GR - BARRIER_X, GB - FLOOR_Y);

  for (const p of plushes) if (!p.held) drawPlush(p);
  if (claw.held) drawPlush(claw.held);

  drawClaw(t);
  drawObstacles();

  // acrílico
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(BARRIER_X - 3, BARRIER_TOP, 6, FLOOR_Y - BARRIER_TOP);
  ctx.restore();

  // moldura da janela
  rr(ctx, GL, GT, GR - GL, GB - GT, 6);
  ctx.lineWidth = 3;
  ctx.strokeStyle = RAMS.ink;
  ctx.stroke();
  // vidro: reflexo diagonal e moldura chanfrada
  ctx.save();
  rr(ctx, GL, GT, GR - GL, GB - GT, 6);
  ctx.clip();
  const gl = ctx.createLinearGradient(GL, GT, GL + 160, GT + 260);
  gl.addColorStop(0, 'rgba(255,255,255,0.16)');
  gl.addColorStop(0.5, 'rgba(255,255,255,0.04)');
  gl.addColorStop(0.51, 'rgba(255,255,255,0)');
  ctx.fillStyle = gl;
  ctx.fillRect(GL, GT, GR - GL, GB - GT);
  ctx.restore();
  rr(ctx, GL - 2.5, GT - 2.5, GR - GL + 5, GB - GT + 5, 8);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.stroke();
}

function drawObstacles() {
  obstacleRects().forEach((r, i) => {
    rr(ctx, r.x, r.y, r.w, r.h, 2);
    ctx.fillStyle = bonkT > 0 ? RAMS.ink : BAUHAUS[i % 2 ? 2 : 0];
    ctx.fill();
  });
}
function drawPlush(p: Plush) {
  const sp = sprites.get(p.char);
  if (!sp) return;
  const k = p.r / 40;
  const s = SPRITE_BOX * k;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.a);
  ctx.drawImage(sp, -s / 2, -s / 2 + 4 * k, s, s);
  ctx.restore();
}


/** Degradê de metal escovado na horizontal (cilindro visto de frente). */
function metalH(x0: number, x1: number, dark = '#6f7378', light = '#f4f5f6') {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, dark);
  g.addColorStop(0.38, light);
  g.addColorStop(0.62, '#c4c6c8');
  g.addColorStop(1, dark);
  return g;
}

/** Parafuso de cabeça redonda com fenda. */
function screw(x: number, y: number, r = 2.2) {
  const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, 0, x, y, r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.6, '#b9bcbf');
  g.addColorStop(1, '#6f7378');
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.6, y + r * 0.3);
  ctx.lineTo(x + r * 0.6, y - r * 0.3);
  ctx.stroke();
}

/** LED redondo com cúpula de acrílico. */
function led(x: number, y: number, r: number, on: string | null) {
  ctx.save();
  if (on) {
    ctx.shadowColor = on;
    ctx.shadowBlur = 7;
  }
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = on ?? '#d6d4cd';
  ctx.fill();
  ctx.restore();
  // sombra da cúpula embaixo, brilho em cima
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.45, 0, x, y, r);
  g.addColorStop(0, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.12)');
  g.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

function drawClaw(t: number) {
  const hx = hubX();
  const hy = hubY();

  // cabo de aço trançado
  for (const o of [-2.2, 2.2]) {
    ctx.beginPath();
    ctx.moveTo(claw.x + o, RAIL_Y + 8);
    ctx.lineTo(hx + o, hy - 14);
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = '#4f5257';
    ctx.stroke();
    ctx.setLineDash([1.6, 1.6]);
    ctx.lineDashOffset = hy * 0.5;
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#e4e6e8';
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // carrinho de alumínio no trilho
  const cy = RAIL_Y - 13;
  const cg = ctx.createLinearGradient(0, cy, 0, cy + 22);
  cg.addColorStop(0, '#f4f5f6');
  cg.addColorStop(0.5, '#c9cbce');
  cg.addColorStop(1, '#8d9196');
  rr(ctx, claw.x - 22, cy, 44, 22, 4);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = cg;
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#6f7378';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillRect(claw.x - 19, cy + 1.5, 38, 1);
  screw(claw.x - 15, cy + 11);
  screw(claw.x + 15, cy + 11);
  // luz-piloto: verde parado, laranja trabalhando
  const busy = claw.state !== 'idle';
  led(claw.x, cy + 11, 3.4, busy ? (Math.floor(t * 8) % 2 ? RAMS.orange : null) : RAMS.green);

  // garras: aço com articulação aparafusada e ponta de borracha
  const th = 0.25 + 0.6 * claw.open;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const arm = (pts: number[][], shade: number) => {
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (const q of pts.slice(1)) ctx.lineTo(q[0], q[1]);
    };
    path();
    ctx.lineWidth = 6.5;
    ctx.strokeStyle = '#3c3f44';
    ctx.stroke();
    path();
    ctx.lineWidth = 4;
    ctx.strokeStyle = shade ? '#a9adb2' : '#d3d6d9';
    ctx.stroke();
    ctx.save();
    ctx.translate(-0.9, -0.6);
    path();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.stroke();
    ctx.restore();
    const [jx, jy] = pts[1];
    screw(jx, jy, 2.6);
    const [tx, ty] = pts[pts.length - 1];
    ctx.beginPath();
    ctx.arc(tx, ty, 3.4, 0, TAU);
    ctx.fillStyle = '#232321';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(tx - 1, ty - 1, 1.1, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fill();
  };
  // dente do meio (atrás, mais escuro)
  arm(
    [
      [hx, hy + 2],
      [hx, hy + 24 + (1 - claw.open) * 4],
      [hx + 4, hy + 40],
    ],
    1,
  );
  for (const s of [-1, 1]) {
    const bx = hx + s * 8;
    const by = hy + 2;
    const x1 = bx + s * Math.sin(th) * 26;
    const y1 = by + Math.cos(th) * 26;
    const ph = th - 0.75;
    const x2 = x1 + s * Math.sin(ph) * 24;
    const y2 = y1 + Math.cos(ph) * 24;
    arm(
      [
        [bx, by],
        [x1, y1],
        [x2, y2],
      ],
      0,
    );
  }

  // cubo central: cilindro de metal com anel e rebites
  rr(ctx, hx - 12, hy - 16, 24, 20, 4);
  ctx.fillStyle = metalH(hx - 12, hx + 12);
  ctx.fill();
  ctx.strokeStyle = '#5c6065';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = metalH(hx - 13, hx + 13, '#4f5257', '#c9cbce');
  ctx.fillRect(hx - 13, hy - 1, 26, 4);
  screw(hx - 6, hy - 9, 1.6);
  screw(hx + 6, hy - 9, 1.6);
}

function drawFrontPanel(t: number) {
  // porta do prêmio: aba basculante embutida, acende laranja na vitória
  const flash = winT > 0 && Math.floor(t * 10) % 2 === 0;
  const x = GL;
  const y = GB + 18;
  rr(ctx, x, y, 82, 36, 5);
  const g = ctx.createLinearGradient(0, y, 0, y + 36);
  g.addColorStop(0, flash ? '#c4500f' : '#a9a7a0');
  g.addColorStop(0.18, flash ? RAMS.orange : '#d6d4cd');
  g.addColorStop(1, flash ? '#ff9a5c' : '#e9e8e3');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();
  // borda de baixo pega luz
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(x + 4, y + 35, 74, 1);
  ctx.save();
  ctx.font = "500 11px 'Geist', system-ui, sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // rótulo gravado: sombra clara embaixo
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText('prêmio', x + 41, y + 20);
  ctx.fillStyle = flash ? '#ffffff' : '#76746d';
  ctx.fillText('prêmio', x + 41, y + 19);
  ctx.restore();

  // grade de alto-falante: furos com sombra dentro e luz na borda de baixo
  for (let yy = GB + 22; yy <= GB + 50; yy += 7) {
    for (let xx = GR - 120; xx <= GR - 4; xx += 7) {
      ctx.beginPath();
      ctx.arc(xx, yy + 0.6, 1.8, 0, TAU);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(xx, yy, 1.8, 0, TAU);
      ctx.fillStyle = '#56544f';
      ctx.fill();
    }
  }
}

// luzes nas laterais: LEDs com uma luz correndo
function drawLights(t: number) {
  const top = 24;
  const bottom = 616;
  const step = 14;
  const n = Math.floor((bottom - top) / step) + 1;
  const speed = winT > 0 ? 40 : 9;
  for (const [x, dir] of [
    [20, -1],
    [380, 1],
  ]) {
    const head = (((dir * t * speed) % n) + n) % n;
    for (let i = 0; i < n; i++) {
      const d = (i - head + n) % n;
      let col: string | null = null;
      if (winT > 0) col = BAUHAUS[(i + Math.floor(t * 12)) % 3];
      else if (d < 4) col = stageColor(t);
      led(x, top + i * step, 3.4, col);
    }
  }
}

function render(t: number) {
  const k = scale * dpr;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.clearRect(0, 0, W, H);
  drawCabinet();
  drawInterior(t);
  drawFrontPanel(t);
  drawLights(t);
  drawSign(t);
}

// ---------- loop ----------
let time = 0;
let last = performance.now();

function frame(now: number) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  time += dt;

  if (!paused) {
    if (playing) updateClaw(dt);
    const sub = 4;
    for (let i = 0; i < sub; i++) physicsStep(dt / sub);
    checkGameOver(dt);
  }

  if (playing && !paused) obsT += dt;
  if (bonkT > 0) bonkT -= dt;
  if (winT > 0) winT -= dt;
  if (signFlicker > 0) signFlicker -= dt;
  nextFlicker -= dt;
  if (nextFlicker <= 0) {
    signFlicker = 0.35;
    nextFlicker = rand(6, 12);
  }

  render(time);
  updateFx(dt);
  requestAnimationFrame(frame);
}

// ---------- partida, menus e ranking ----------
let level: Level = loadLevel();
let coins = 0;
let playing = false;
let paused = false;
let overT = 0;
let lastEntryDate = 0;
let stageIdx = loadStage();
let unlocked = loadUnlocked();
let cleared = false;
let pendingClear = false;

function updateScoreHud() {
  $('score').textContent = cleared ? `${score} ✓` : `${score}/${STAGES[stageIdx].goal}`;
}

const show = (id: string) => $(id).classList.remove('hidden');
const hide = (id: string) => $(id).classList.add('hidden');

function settlePile() {
  plushes = [];
  spawn(10, false);
  for (let i = 0; i < 600; i++) physicsStep(1 / 120);
}

function resetClaw() {
  Object.assign(claw, {
    x: CHUTE_X,
    len: MIN_LEN,
    open: 1,
    state: 'idle',
    timer: 0,
    held: null,
    target: null,
    dropAt: -1,
    carried: false,
    sway: 0,
    swayV: 0,
    lastVx: 0,
  });
}

function newGame() {
  for (const id of ['menu', 'over', 'levelMenu', 'stageMenu', 'rank', 'win', 'clear', 'start']) hide(id);
  window.clearTimeout(refillTimer);
  refillTimer = undefined;
  playing = false;
  settlePile();
  resetClaw();
  score = 0;
  missStreak = 0;
  coins = LEVELS[level].fichas;
  overT = 0;
  obsT = 0;
  cleared = false;
  pendingClear = false;
  parts = [];
  updateScoreHud();
  $('coins').textContent = String(coins);
  $('shelf').replaceChildren();
  playing = true;
  paused = false;
  winT = 0.8;
  sfx.zap();
}

// acabou quando não tem ficha, a garra parou e nada está caindo no buraco
function checkGameOver(dt: number) {
  const done =
    playing &&
    coins <= 0 &&
    claw.state === 'idle' &&
    !plushes.some((p) => p.x < BARRIER_X) &&
    winEl.classList.contains('hidden');
  overT = done ? overT + dt : 0;
  if (overT > 1.2) endGame();
}

function endGame() {
  playing = false;
  overT = 0;
  sfx.hum(0);
  const name = loadName() || 'Jogador';
  const date = Date.now();
  const pos = addEntry(level, { name, score, date });
  lastEntryDate = date;
  const cfg = LEVELS[level];
  $('overText').textContent = `${name} pegou ${score} ${score === 1 ? 'pelúcia' : 'pelúcias'}`;
  $('overPlace').textContent =
    score === 0
      ? 'Tente de novo!'
      : pos === 1
        ? `🥇 RECORDE no ${cfg.label}!`
        : pos
          ? `${pos}º lugar no ${cfg.label}`
          : 'Quase entrou no ranking!';
  const missing = STAGES[stageIdx].goal - score;
  $('overGoal').textContent = cleared ? '' : `Faltou ${missing} pra passar de fase`;
  show('over');
  if (pos === 1 && score > 0) {
    burst();
    for (const a of [0, 0.2, 0.4]) sfx.ring(a);
  }
}

function openMenu() {
  if (!playing || paused) return;
  paused = true;
  sfx.hum(0);
  setStick(null);
  show('menu');
}

function resume() {
  paused = false;
  for (const id of ['menu', 'levelMenu', 'stageMenu', 'rank', 'clear']) hide(id);
}

function exitGame() {
  playing = false;
  paused = false;
  sfx.hum(0);
  setStick(null);
  for (const id of ['menu', 'over', 'levelMenu', 'stageMenu', 'rank', 'win', 'clear']) hide(id);
  renderLevels($('levelPick'), (l) => setLevel(l));
  renderStages($('stagePick'), (i) => setStage(i));
  renderAlbum();
  show('start');
}

function setLevel(l: Level) {
  level = l;
  saveLevel(l);
}

function renderLevels(box: HTMLElement, onPick: (l: Level) => void) {
  box.replaceChildren(
    ...LEVEL_IDS.map((l) => {
      const b = document.createElement('button');
      b.className = `lvl${l === level ? ' on' : ''}`;
      b.textContent = `${LEVELS[l].emoji} ${LEVELS[l].label}`;
      b.addEventListener('click', () => {
        sfx.click();
        onPick(l);
        for (const o of box.children) o.classList.toggle('on', o === b);
      });
      return b;
    }),
  );
}

function setStage(i: number) {
  stageIdx = i;
  saveStage(i);
}

function renderStages(box: HTMLElement, onPick: (i: number) => void) {
  box.replaceChildren(
    ...STAGES.map((st, i) => {
      const b = document.createElement('button');
      const locked = i > unlocked;
      b.className = `stage-card${i === stageIdx ? ' on' : ''}${locked ? ' locked' : ''}`;
      const thumb = document.createElement('canvas');
      const k = Math.min(window.devicePixelRatio || 1, 3);
      thumb.width = 84 * k;
      thumb.height = 56 * k;
      const c = thumb.getContext('2d')!;
      c.scale((84 * k) / (GR - GL), (84 * k) / (GR - GL));
      drawBg(c, st.bg, GR - GL, 220, 3);
      const label = document.createElement('span');
      label.textContent = locked ? '🔒' : st.name;
      b.append(thumb, label);
      b.addEventListener('click', () => {
        if (locked) {
          sfx.bonk();
          b.classList.remove('shake');
          void b.offsetWidth;
          b.classList.add('shake');
          return;
        }
        sfx.click();
        onPick(i);
        for (const o of box.children) o.classList.toggle('on', o === b);
      });
      return b;
    }),
  );
}

/** Álbum: personagens das fases liberadas aparecem, os outros ficam em silhueta. */
function renderAlbum() {
  const k = Math.min(window.devicePixelRatio || 1, 3);
  const open = new Set(STAGES.slice(0, unlocked + 1).flatMap((st) => st.chars));
  $('startChars').replaceChildren(
    ...CHAR_IDS.map((id) => {
      const c = open.has(id) ? makeSprite(id, 30 * k) : makeSilhouette(id, 30 * k);
      c.title = open.has(id) ? CHAR_NAMES[id] : '???';
      if (open.has(id)) c.style.animationDelay = `${Math.random() * -1}s`;
      else c.classList.add('locked');
      return c;
    }),
  );
}

function showClear() {
  const next = stageIdx + 1;
  const hasNext = next < STAGES.length;
  const isNew = hasNext && next > unlocked;
  if (isNew) {
    unlocked = next;
    saveUnlocked(next);
  }
  paused = true;
  sfx.hum(0);
  $('clearText').textContent = !hasNext
    ? 'Você completou todas as fases! 🏆'
    : isNew
      ? `Nova fase liberada: ${STAGES[next].emoji} ${STAGES[next].name}!`
      : `Próxima fase: ${STAGES[next].emoji} ${STAGES[next].name}`;
  const k = Math.min(window.devicePixelRatio || 1, 3);
  $('clearChars').replaceChildren(...(hasNext ? STAGES[next].chars.map((id) => makeSprite(id, 56 * k)) : []));
  $('nextStage').classList.toggle('hidden', !hasNext);
  show('clear');
  burst();
  sfx.levelUp();
}

function goNextStage() {
  // a partida até aqui entra no ranking antes de trocar de fase
  const date = Date.now();
  addEntry(level, { name: loadName() || 'Jogador', score, date });
  lastEntryDate = date;
  setStage(Math.min(stageIdx + 1, unlocked));
  newGame();
}

let rankLevel: Level = level;
function showRank(l: Level = level) {
  rankLevel = l;
  const tabs = $('rankTabs');
  tabs.replaceChildren(
    ...LEVEL_IDS.map((id) => {
      const b = document.createElement('button');
      b.className = `lvl${id === rankLevel ? ' on' : ''}`;
      b.textContent = `${LEVELS[id].emoji} ${LEVELS[id].label}`;
      b.addEventListener('click', () => showRank(id));
      return b;
    }),
  );
  const list = loadRank()[rankLevel];
  const medals = ['🥇', '🥈', '🥉'];
  const items = list.map((e, i) => {
    const li = document.createElement('li');
    if (e.date === lastEntryDate) li.classList.add('me');
    const pos = document.createElement('span');
    pos.className = 'pos';
    pos.textContent = medals[i] ?? `${i + 1}º`;
    const who = document.createElement('span');
    who.className = 'who';
    who.textContent = e.name;
    const pts = document.createElement('span');
    pts.textContent = `🧸 ${e.score}`;
    li.append(pos, who, pts);
    return li;
  });
  if (!items.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'Ninguém jogou esse nível ainda';
    items.push(li);
  }
  $('rankList').replaceChildren(...items);
  show('rank');
}

// botões dos menus (data-act)
const ACTIONS: Record<string, (el: HTMLElement) => void> = {
  resume,
  restart: () => newGame(),
  level: () => {
    renderLevels($('levelPick2'), (l) => {
      setLevel(l);
      window.setTimeout(newGame, 150);
    });
    show('levelMenu');
  },
  rank: () => showRank(),
  stage: () => {
    renderStages($('stagePick2'), (i) => {
      setStage(i);
      window.setTimeout(newGame, 150);
    });
    show('stageMenu');
  },
  nextStage: goNextStage,
  exit: exitGame,
  close: (el) => el.closest('.overlay')?.classList.add('hidden'),
};
document.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
  const act = el?.dataset.act;
  if (!el || !act || !ACTIONS[act]) return;
  sfx.click();
  ACTIONS[act](el);
});
$('menuBtn').addEventListener('click', openMenu);

// tela inicial
renderAlbum();
renderStages($('stagePick'), (i) => setStage(i));
const nameInput = $<HTMLInputElement>('nameInput');
nameInput.value = loadName();
renderLevels($('levelPick'), (l) => setLevel(l));

function startGame() {
  const name = nameInput.value.trim();
  if (!name) {
    nameInput.classList.remove('shake');
    void nameInput.offsetWidth;
    nameInput.classList.add('shake');
    nameInput.focus();
    return;
  }
  nameInput.blur();
  saveName(name);
  sfx.unlock();
  sfx.startMusic();
  started = true;
  newGame();
}
$('play').addEventListener('click', startGame);

settlePile();

requestAnimationFrame(frame);

// atalho de teste (só no `npm run dev`)
if (import.meta.env.DEV) {
  (window as unknown as { __debug: object }).__debug = {
    setCoins: (n: number) => {
      coins = n;
      $('coins').textContent = String(n);
    },
    setScore: (n: number) => {
      score = n;
      updateScoreHud();
    },
    stage: (i: number) => {
      unlocked = Math.max(unlocked, i);
      setStage(i);
      newGame();
    },
    clear: () => {
      cleared = true;
      updateScoreHud();
      showClear();
    },
  };
}
