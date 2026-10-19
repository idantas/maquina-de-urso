import './style.css';
import { CHAR_COLORS, CHAR_IDS, CHAR_NAMES, SPRITE_BOX, makeSprite, type CharId } from './characters';
import { Sfx } from './audio';

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
  const bag = [...shuffle([...CHAR_IDS]), ...shuffle([...CHAR_IDS])].slice(0, n);
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
  if (won.length && !started) {
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
  // chances generosas — é pra criança se divertir
  const q = bestD / best.r;
  const pity = missStreak >= 2;
  const chance = pity ? 1 : q < 0.35 ? 0.92 : q < 0.6 ? 0.72 : 0.42;
  claw.target = best;
  if (Math.random() > chance) {
    claw.dropAt = Math.max(MIN_LEN + 1, claw.len - rand(25, 65)); // escorrega logo
  } else if (!pity && Math.random() < 0.1) {
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
        const nx = clamp(claw.x + input.dir * 160 * dt, CLAW_MIN_X, CLAW_MAX_X);
        vx = (nx - claw.x) / dt;
        claw.x = nx;
        if (vx) hum = 85;
      }
      break;
    case 'down': {
      claw.len += 210 * dt;
      hum = 140;
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

  grabBtn.classList.toggle('off', claw.state !== 'idle');
}

function grab() {
  if (claw.state !== 'idle') return;
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
let refillPending = false;
const winEl = $('win');
let winTimer: number | undefined;

function onWin(p: Plush) {
  score++;
  $('score').textContent = String(score);
  missStreak = 0;
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

  if (plushes.length < 5 && !refillPending) {
    refillPending = true;
    window.setTimeout(() => {
      spawn(8, true);
      sfx.refill();
      refillPending = false;
    }, 2500);
  }
}

function hideWin() {
  winEl.classList.add('hidden');
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
  life: number;
}
let parts: Part[] = [];
const CONFETTI = ['#ff3b6b', '#ffd23a', '#3ab4ff', '#7cff6b', '#b44dff', '#ffffff', '#ff8a1e'];

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
      fctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
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

// estado da placa de neon (falha às vezes, com zumbido)
let signFlicker = 0;
let nextFlicker = rand(4, 9);

function neonHue(t: number) {
  return winT > 0 ? (t * 540) % 360 : 268 + Math.sin(t * 1.2) * 24;
}

function drawCabinet() {
  rr(ctx, 12, 4, 376, 632, 34);
  ctx.fillStyle = '#100c18';
  ctx.fill();
}

function drawSign(t: number) {
  const flick = signFlicker > 0 && Math.floor(t * 30) % 2 === 0;
  ctx.save();
  ctx.globalAlpha = flick ? 0.25 : 1;
  ctx.font = '26px Bungee, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = winT > 0 ? `hsl(${neonHue(t)},100%,60%)` : '#3ab4ff';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#eaf6ff';
  ctx.fillText('MÁQUINA DE URSO', 200, 54);
  ctx.restore();
}

function drawInterior(t: number) {
  ctx.save();
  rr(ctx, GL, GT, GR - GL, GB - GT, 10);
  ctx.clip();

  ctx.fillStyle = '#0d1430';
  ctx.fillRect(GL, GT, GR - GL, GB - GT);

  // trilho
  ctx.fillStyle = '#3a4258';
  ctx.fillRect(GL, RAIL_Y - 3, GR - GL, 4);

  // buraco do prêmio
  ctx.fillStyle = '#05030a';
  ctx.fillRect(GL, FLOOR_Y, BARRIER_X - GL, GB - FLOOR_Y);
  ctx.fillStyle = `hsla(${neonHue(t)},100%,65%,${0.35 + 0.2 * Math.sin(t * 6)})`;
  ctx.fillRect(GL, FLOOR_Y, BARRIER_X - GL, 2);

  // chão
  ctx.fillStyle = '#1a1230';
  ctx.fillRect(BARRIER_X, FLOOR_Y, GR - BARRIER_X, GB - FLOOR_Y);

  for (const p of plushes) if (!p.held) drawPlush(p);
  if (claw.held) drawPlush(claw.held);

  drawClaw(t);

  // acrílico
  ctx.fillStyle = 'rgba(180,220,255,0.14)';
  ctx.fillRect(BARRIER_X - 3, BARRIER_TOP, 6, FLOOR_Y - BARRIER_TOP);
  ctx.restore();
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

function drawClaw(t: number) {
  const hx = hubX();
  const hy = hubY();

  // carrinho no trilho
  rr(ctx, claw.x - 20, RAIL_Y - 12, 40, 20, 5);
  ctx.fillStyle = '#3a3f4f';
  ctx.fill();
  ctx.strokeStyle = '#8d96aa';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  const busy = claw.state !== 'idle';
  ctx.beginPath();
  ctx.arc(claw.x, RAIL_Y - 2, 3, 0, TAU);
  ctx.fillStyle = busy ? (Math.floor(t * 8) % 2 ? '#ff3b47' : '#5a1218') : '#5dff8a';
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = 8;
  ctx.fill();
  ctx.shadowBlur = 0;

  // cabo
  ctx.strokeStyle = '#9aa3b5';
  ctx.lineWidth = 1.4;
  for (const o of [-2, 2]) {
    ctx.beginPath();
    ctx.moveTo(claw.x + o, RAIL_Y + 8);
    ctx.lineTo(hx + o, hy - 12);
    ctx.stroke();
  }

  // garras
  const th = 0.25 + 0.6 * claw.open;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const arm = (pts: number[][], dark: string, light: string) => {
    for (const [lw, col] of [
      [7, dark],
      [3.5, light],
    ] as const) {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (const q of pts.slice(1)) ctx.lineTo(q[0], q[1]);
      ctx.lineWidth = lw;
      ctx.strokeStyle = col;
      ctx.stroke();
    }
  };
  // dente do meio (atrás)
  arm(
    [
      [hx, hy + 2],
      [hx, hy + 24 + (1 - claw.open) * 4],
      [hx + 4, hy + 40],
    ],
    '#22262f',
    '#7c8597',
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
      '#2a2f3a',
      '#cdd5e2',
    );
  }

  // cubo central
  const hg = ctx.createLinearGradient(hx - 11, 0, hx + 11, 0);
  hg.addColorStop(0, '#6c7588');
  hg.addColorStop(0.45, '#eef2f8');
  hg.addColorStop(1, '#5a6274');
  rr(ctx, hx - 11, hy - 14, 22, 18, 5);
  ctx.fillStyle = hg;
  ctx.fill();
  ctx.strokeStyle = '#2a2f3a';
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

function drawFrontPanel(t: number) {
  // porta do prêmio: só um contorno que acende na vitória
  const flash = winT > 0 && Math.floor(t * 10) % 2 === 0;
  rr(ctx, GL, GB + 18, 82, 36, 8);
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = flash ? '#ffd23a' : 'rgba(234,246,255,0.35)';
  ctx.shadowColor = '#ffd23a';
  ctx.shadowBlur = flash ? 18 : 0;
  ctx.stroke();
  ctx.font = '11px Bungee, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = flash ? '#ffd23a' : 'rgba(234,246,255,0.55)';
  ctx.fillText('PRÊMIO', GL + 41, GB + 37);
  ctx.restore();
}

// neon só nas laterais, com uma luz correndo pelo tubo
function drawNeon(t: number) {
  const hue = neonHue(t);
  const blink = winT > 0 ? (Math.floor(t * 12) % 2 ? 1 : 0.45) : 0.85 + 0.15 * Math.sin(t * 3);
  const top = 24;
  const bottom = 616;
  ctx.save();
  ctx.lineCap = 'round';
  for (const x of [20, 380]) {
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.shadowColor = `hsl(${hue},100%,60%)`;
    ctx.shadowBlur = 24;
    ctx.lineWidth = 7;
    ctx.strokeStyle = `hsla(${hue},100%,58%,${blink})`;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = `hsla(${hue},100%,90%,${blink})`;
    ctx.stroke();
    ctx.setLineDash([16, 60]);
    ctx.lineDashOffset = (x < 200 ? -1 : 1) * t * (winT > 0 ? 420 : 120);
    ctx.lineWidth = 3.5;
    ctx.shadowColor = `hsl(${hue},100%,75%)`;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function render(t: number) {
  const k = scale * dpr;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.clearRect(0, 0, W, H);
  drawCabinet();
  drawInterior(t);
  drawFrontPanel(t);
  drawNeon(t);
  drawSign(t);
}

// ---------- loop ----------
let time = 0;
let last = performance.now();

function frame(now: number) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  time += dt;

  if (started) updateClaw(dt);
  const sub = 4;
  for (let i = 0; i < sub; i++) physicsStep(dt / sub);

  if (winT > 0) winT -= dt;
  if (signFlicker > 0) signFlicker -= dt;
  nextFlicker -= dt;
  if (nextFlicker <= 0) {
    signFlicker = 0.35;
    nextFlicker = rand(6, 12);
    if (started) sfx.buzz();
  }

  render(time);
  updateFx(dt);
  requestAnimationFrame(frame);
}

// pilha inicial já assentada
spawn(10, false);
for (let i = 0; i < 600; i++) physicsStep(1 / 120);

// tela inicial
const startEl = $('start');
const startChars = $('startChars');
for (const id of CHAR_IDS) {
  const c = makeSprite(id, 72 * Math.min(window.devicePixelRatio || 1, 3));
  c.style.animationDelay = `${Math.random() * -1}s`;
  startChars.append(c);
}
$('play').addEventListener('click', () => {
  sfx.unlock();
  sfx.startMusic();
  sfx.zap();
  winT = 0.8;
  started = true;
  startEl.classList.add('hidden');
});

requestAnimationFrame(frame);
