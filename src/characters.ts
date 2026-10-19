// Pelúcias desenhadas à mão em canvas (fan art, sem assets oficiais).
// Espaço de desenho: a pelúcia cabe num círculo de raio 40 centrado na origem.

export type CharId =
  | 'sonic'
  | 'tails'
  | 'knuckles'
  | 'amy'
  | 'shadow'
  | 'silver'
  | 'cream'
  | 'leo'
  | 'raph'
  | 'donnie'
  | 'mikey'
  | 'spidey'
  | 'venom'
  | 'superman'
  | 'batman'
  | 'wonder'
  | 'flash'
  | 'lantern'
  | 'aquaman'
  | 'ironman'
  | 'captain'
  | 'hulk'
  | 'thor'
  | 'widow'
  | 'panther';

export const CHAR_IDS: CharId[] = [
  'sonic',
  'tails',
  'knuckles',
  'amy',
  'shadow',
  'silver',
  'cream',
  'leo',
  'raph',
  'donnie',
  'mikey',
  'spidey',
  'venom',
  'superman',
  'batman',
  'wonder',
  'flash',
  'lantern',
  'aquaman',
  'ironman',
  'captain',
  'hulk',
  'thor',
  'widow',
  'panther',
];

export const CHAR_NAMES: Record<CharId, string> = {
  sonic: 'Sonic',
  tails: 'Tails',
  knuckles: 'Knuckles',
  amy: 'Amy',
  shadow: 'Shadow',
  silver: 'Silver',
  cream: 'Cream',
  leo: 'Leonardo',
  raph: 'Rafael',
  donnie: 'Donatello',
  mikey: 'Michelangelo',
  spidey: 'Homem-Aranha',
  venom: 'Venom',
  superman: 'Super-Homem',
  batman: 'Batman',
  wonder: 'Mulher-Maravilha',
  flash: 'Flash',
  lantern: 'Lanterna Verde',
  aquaman: 'Aquaman',
  ironman: 'Homem de Ferro',
  captain: 'Capitão América',
  hulk: 'Hulk',
  thor: 'Thor',
  widow: 'Viúva Negra',
  panther: 'Pantera Negra',
};

export const CHAR_COLORS: Record<CharId, string> = {
  sonic: '#3d8bff',
  tails: '#ffb02e',
  knuckles: '#ff3b47',
  amy: '#ff6fb5',
  shadow: '#ff2a3a',
  silver: '#cfe3ff',
  cream: '#ffd27a',
  leo: '#3d8bff',
  raph: '#ff3b47',
  donnie: '#b06bff',
  mikey: '#ff9a2e',
  spidey: '#ff3b47',
  venom: '#8fa8ff',
  superman: '#3d8bff',
  batman: '#f2c230',
  wonder: '#ff3b47',
  flash: '#ff3b47',
  lantern: '#3ddc6a',
  aquaman: '#ff9a2e',
  ironman: '#ffd23a',
  captain: '#3d8bff',
  hulk: '#6cdf3d',
  thor: '#8fd0ff',
  widow: '#ff3b47',
  panther: '#b49cff',
};

type Ctx = CanvasRenderingContext2D;

const HY = -8; // centro da cabeça
const HR = 26; // raio da cabeça
const D = Math.PI / 180;
const OUTLINE = 'rgba(0,0,0,0.35)';

function ell(c: Ctx, x: number, y: number, rx: number, ry: number, rot = 0) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
}

function paint(c: Ctx, fill: string, stroke?: string, lw = 1.6) {
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.lineWidth = lw;
    c.strokeStyle = stroke;
    c.stroke();
  }
}

/** Espinho saindo da cabeça. deg em coordenadas de canvas (0 = direita, -90 = cima). */
function spike(c: Ctx, deg: number, len: number, w: number, fill: string, stroke?: string, from = HR * 0.5) {
  const a = deg * D;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const px = -sa;
  const py = ca;
  const bx = ca * from;
  const by = HY + sa * from;
  const tx = ca * (HR + len);
  const ty = HY + sa * (HR + len);
  const mx = ca * (HR + len * 0.45);
  const my = HY + sa * (HR + len * 0.45);
  c.beginPath();
  c.moveTo(bx + px * w, by + py * w);
  c.quadraticCurveTo(mx + px * w * 0.75, my + py * w * 0.75, tx, ty);
  c.quadraticCurveTo(mx - px * w * 0.55, my - py * w * 0.55, bx - px * w, by - py * w);
  c.closePath();
  paint(c, fill, stroke);
}

function ear(c: Ctx, s: number, x: number, y: number, w: number, h: number, tilt: number, outer: string, inner: string, stroke: string) {
  c.save();
  c.translate(s * x, y);
  c.rotate(s * tilt);
  c.beginPath();
  c.moveTo(-w, 0);
  c.quadraticCurveTo(-w * 0.4, -h * 0.7, 0, -h);
  c.quadraticCurveTo(w * 0.4, -h * 0.7, w, 0);
  c.closePath();
  paint(c, outer, stroke);
  c.beginPath();
  c.moveTo(-w * 0.5, -h * 0.1);
  c.quadraticCurveTo(-w * 0.2, -h * 0.6, 0, -h * 0.75);
  c.quadraticCurveTo(w * 0.2, -h * 0.6, w * 0.5, -h * 0.1);
  c.closePath();
  paint(c, inner);
  c.restore();
}

interface BodyOpts {
  fur: string;
  stroke: string;
  shoe: string;
  strap: string;
  belly?: string;
  dress?: string;
}

function body(c: Ctx, o: BodyOpts) {
  for (const s of [-1, 1]) {
    ell(c, s * 11, 37, 11, 6.5, s * 0.12);
    paint(c, o.shoe, OUTLINE);
    ell(c, s * 11, 33.5, 8.5, 2.6, s * 0.12);
    paint(c, o.strap);
  }
  ell(c, 0, 20, 17, 15);
  paint(c, o.fur, o.stroke);
  if (o.belly) {
    ell(c, 0, 23, 10.5, 10);
    paint(c, o.belly);
  }
  if (o.dress) {
    c.beginPath();
    c.moveTo(-11, 9);
    c.lineTo(11, 9);
    c.quadraticCurveTo(17, 20, 20, 32);
    c.quadraticCurveTo(0, 37, -20, 32);
    c.quadraticCurveTo(-17, 20, -11, 9);
    c.closePath();
    paint(c, o.dress, OUTLINE);
  }
}

function gloves(c: Ctx, color = '#ffffff', r = 7, extra?: (s: number) => void) {
  for (const s of [-1, 1]) {
    ell(c, s * 19, 22, r, r * 0.93);
    paint(c, color, OUTLINE);
    extra?.(s);
  }
}

function head(c: Ctx, fur: string, stroke: string) {
  ell(c, 0, HY, HR, HR * 0.94);
  paint(c, fur, stroke, 1.8);
}

function fluff(c: Ctx, color: string, big = false) {
  const k = big ? 1.3 : 1;
  c.fillStyle = color;
  for (const [x, y, r] of [
    [-5, 11, 5],
    [5, 11, 5],
    [0, 14, 5.5],
    [0, 18, 4],
  ]) {
    ell(c, x * k, y, r * k, r * k);
    c.fill();
  }
}

function face(c: Ctx, muzzle: string, iris: string) {
  // focinho
  ell(c, 0, 2, 15, 9.5);
  paint(c, muzzle);
  // olhos (contorno + branco unidos, estilo Sonic)
  const ey = -12;
  c.fillStyle = '#1b1b2a';
  for (const s of [-1, 1]) {
    ell(c, s * 7.5, ey, 8, 10.2);
    c.fill();
  }
  c.fillStyle = '#ffffff';
  for (const s of [-1, 1]) {
    ell(c, s * 7.5, ey, 6.8, 9);
    c.fill();
  }
  for (const s of [-1, 1]) {
    ell(c, s * 4.6, ey + 1, 4, 5.8);
    paint(c, iris);
    ell(c, s * 4.3, ey + 1.5, 2.2, 3.6);
    paint(c, '#111');
    ell(c, s * 3.2, ey - 1.6, 1.3, 1.7);
    paint(c, '#fff');
  }
  // nariz
  ell(c, 0, -2, 3.6, 2.6);
  paint(c, '#151515');
  ell(c, -1, -2.8, 1.1, 0.7);
  paint(c, 'rgba(255,255,255,0.7)');
  // sorriso
  c.beginPath();
  c.moveTo(-6, 4);
  c.quadraticCurveTo(0, 10.5, 6, 4);
  c.lineWidth = 1.6;
  c.lineCap = 'round';
  c.strokeStyle = '#3a1a10';
  c.stroke();
  // bochechas
  c.fillStyle = 'rgba(255,110,140,0.35)';
  for (const s of [-1, 1]) {
    ell(c, s * 13, 3, 3.5, 2);
    c.fill();
  }
}

const SKIN = '#f6cf9f';

function sonic(c: Ctx) {
  const fur = '#1f5fe0';
  const st = '#0d2c78';
  for (const d of [200, 175, 150, -20, 5, 30]) spike(c, d, 22, 9, fur, st);
  body(c, { fur, stroke: st, belly: SKIN, shoe: '#e0262c', strap: '#ffffff' });
  for (const s of [-1, 1]) ear(c, s, 15, -27, 7.5, 14, 0.45, fur, SKIN, st);
  head(c, fur, st);
  gloves(c);
  face(c, SKIN, '#22a447');
}

function tails(c: Ctx) {
  const fur = '#f6a21e';
  const st = '#8a4d07';
  for (const s of [-1, 1]) {
    c.save();
    c.translate(s * 13, 28);
    c.rotate(s * 0.85);
    ell(c, 0, -16, 9.5, 18);
    paint(c, fur, st);
    c.save();
    ell(c, 0, -16, 9.5, 18);
    c.clip();
    ell(c, 0, -32, 9, 9);
    paint(c, '#ffffff');
    c.restore();
    c.restore();
  }
  body(c, { fur, stroke: st, shoe: '#e0262c', strap: '#ffffff' });
  fluff(c, '#ffffff');
  for (const s of [-1, 1]) ear(c, s, 15, -25, 8, 19, 0.35, fur, '#ffffff', st);
  head(c, fur, st);
  for (const d of [-112, -90, -68]) spike(c, d, 7, 5, fur, st, HR * 0.8);
  gloves(c);
  face(c, '#ffffff', '#2f7fe6');
}

function knuckles(c: Ctx) {
  const fur = '#d8262e';
  const st = '#6e0d12';
  for (const d of [115, 145, 172, 65, 35, 8]) {
    spike(c, d, 22, 8, fur, st, HR * 0.4);
  }
  body(c, { fur, stroke: st, shoe: '#2c9a43', strap: '#f6d03a' });
  // meia-lua branca no peito
  c.beginPath();
  c.arc(0, 10, 9, 0.12 * Math.PI, 0.88 * Math.PI);
  c.arc(0, 6, 9, 0.82 * Math.PI, 0.18 * Math.PI, true);
  c.closePath();
  paint(c, '#ffffff');
  head(c, fur, st);
  for (const d of [-105, -75]) spike(c, d, 7, 5, fur, st, HR * 0.8);
  gloves(c, '#ffffff', 8.5, (s) => {
    for (const dy of [-3, 3]) {
      c.beginPath();
      c.moveTo(s * 24, 22 + dy - 1.8);
      c.lineTo(s * 30, 22 + dy);
      c.lineTo(s * 24, 22 + dy + 1.8);
      c.closePath();
      paint(c, '#e8e8e8', OUTLINE, 1);
    }
  });
  face(c, '#f3c79a', '#8e3fd6');
}

function amy(c: Ctx) {
  const fur = '#ff6fae';
  const st = '#a3245e';
  for (const d of [120, 150, 60, 30]) spike(c, d, 15, 8, fur, st);
  body(c, { fur, stroke: st, dress: '#e8263a', shoe: '#e8263a', strap: '#ffffff' });
  for (const s of [-1, 1]) ear(c, s, 15, -27, 7.5, 13, 0.4, fur, SKIN, st);
  head(c, fur, st);
  // tiara vermelha
  c.beginPath();
  c.arc(0, HY, HR - 3, Math.PI * 1.18, Math.PI * 1.82);
  c.lineWidth = 5;
  c.lineCap = 'round';
  c.strokeStyle = '#e8263a';
  c.stroke();
  for (const d of [-120, -95, -70]) spike(c, d, 6, 5, fur, st, HR * 0.85);
  gloves(c);
  face(c, SKIN, '#22a447');
}

function shadow(c: Ctx) {
  const fur = '#2b2b31';
  const st = '#0b0b0e';
  for (const d of [212, 188, -32, -8]) {
    spike(c, d, 22, 9, fur, st);
    spike(c, d, 18, 3, '#e0242f', undefined, HR * 0.9);
  }
  spike(c, -90, 10, 6, fur, st);
  body(c, { fur, stroke: st, shoe: '#f2f2f2', strap: '#e0242f' });
  fluff(c, '#ffffff');
  for (const s of [-1, 1]) ear(c, s, 15, -27, 7.5, 14, 0.4, fur, '#e8b9a0', st);
  head(c, fur, st);
  gloves(c, '#ffffff', 7, (s) => {
    ell(c, s * 19, 17, 5.5, 2.2, s * 0.4);
    paint(c, '#e0242f');
  });
  face(c, '#f2c39c', '#e0242f');
}

function silver(c: Ctx) {
  const fur = '#e2e6ee';
  const st = '#7d8899';
  for (const d of [185, -5]) spike(c, d, 14, 8, fur, st);
  for (const d of [-150, -120, -90, -60, -30]) spike(c, d, 16, 8, fur, st, HR * 0.6);
  body(c, { fur, stroke: st, shoe: '#f5f5f5', strap: '#25c7d9' });
  fluff(c, '#ffffff', true);
  for (const s of [-1, 1]) ear(c, s, 15, -26, 7.5, 13, 0.45, fur, '#c6ccd8', st);
  head(c, fur, st);
  gloves(c, '#ffffff', 7, (s) => {
    ell(c, s * 19, 22, 2.6, 2.6);
    paint(c, '#25c7d9');
  });
  face(c, '#f1d1ad', '#e2b11e');
}

function cream(c: Ctx) {
  const fur = '#f4dcae';
  const st = '#9a6b30';
  for (const s of [-1, 1]) {
    c.save();
    c.translate(s * 22, -16);
    c.rotate(-s * 0.35);
    ell(c, 0, 14, 7.5, 22);
    paint(c, fur);
    c.save();
    ell(c, 0, 14, 7.5, 22);
    c.clip();
    ell(c, 0, 34, 9, 10);
    paint(c, '#c46b2c');
    c.restore();
    ell(c, 0, 14, 7.5, 22);
    c.lineWidth = 1.6;
    c.strokeStyle = st;
    c.stroke();
    c.restore();
  }
  body(c, { fur, stroke: st, dress: '#f28a2b', shoe: '#f28a2b', strap: '#f8d24a' });
  // gravatinha azul
  c.beginPath();
  c.moveTo(0, 10);
  c.lineTo(-7, 6);
  c.lineTo(-7, 14);
  c.closePath();
  c.moveTo(0, 10);
  c.lineTo(7, 6);
  c.lineTo(7, 14);
  c.closePath();
  paint(c, '#2f63d1');
  ell(c, 0, 10, 2.4, 2.4);
  paint(c, '#2f63d1');
  head(c, fur, st);
  for (const d of [-105, -80]) spike(c, d, 6, 5, fur, st, HR * 0.85);
  gloves(c);
  face(c, '#fff4de', '#8a4a1c');
}

function clipHead(c: Ctx) {
  ell(c, 0, HY, HR, HR * 0.94);
  c.clip();
}

function turtle(c: Ctx, mask: string) {
  const skin = '#5fae3c';
  const st = '#2c5e1a';
  // pontas da faixa amarrada atrás da cabeça
  c.lineCap = 'round';
  c.strokeStyle = mask;
  c.lineWidth = 4.5;
  for (const [ex, ey] of [
    [38, -4],
    [34, 8],
  ]) {
    c.beginPath();
    c.moveTo(20, -14);
    c.quadraticCurveTo(30, -16, ex, ey);
    c.stroke();
  }
  // casco
  ell(c, 0, 20, 20, 17);
  paint(c, '#6b4a22', '#3d2810');
  body(c, { fur: skin, stroke: st, shoe: skin, strap: '#c9a04a' });
  // plastrão
  c.save();
  ell(c, 0, 22, 12, 12.5);
  paint(c, '#e8c35a', '#a8842c');
  c.clip();
  c.strokeStyle = '#a8842c';
  c.lineWidth = 1.2;
  for (const y of [17, 22, 27]) {
    c.beginPath();
    c.moveTo(-12, y);
    c.lineTo(12, y);
    c.stroke();
  }
  c.restore();
  // cinto
  ell(c, 0, 11, 14, 2.6);
  paint(c, '#8a5a2b');
  head(c, skin, st);
  // faixa dos olhos
  c.save();
  clipHead(c);
  c.fillStyle = mask;
  c.fillRect(-HR, -20, HR * 2, 13);
  c.restore();
  for (const s of [-1, 1]) {
    ell(c, s * 8, -13.5, 5.6, 4.6);
    paint(c, '#ffffff');
    ell(c, s * 7, -13, 2, 2.5);
    paint(c, '#111');
    ell(c, s * 6.4, -14, 0.8, 0.9);
    paint(c, '#fff');
  }
  c.beginPath();
  c.moveTo(-9, 2);
  c.quadraticCurveTo(0, 11, 9, 2);
  c.lineWidth = 1.8;
  c.lineCap = 'round';
  c.strokeStyle = '#1c3a10';
  c.stroke();
  c.fillStyle = 'rgba(255,110,140,0.3)';
  for (const s of [-1, 1]) {
    ell(c, s * 14, 1, 3.5, 2);
    c.fill();
  }
  gloves(c, skin);
}

function spidey(c: Ctx) {
  const red = '#d42a2a';
  const st = '#6e0e0e';
  body(c, { fur: '#1f4fbf', stroke: '#0f2a6b', shoe: red, strap: '#a81c1c' });
  ell(c, 0, 19, 10, 11);
  paint(c, red);
  // aranha no peito
  c.strokeStyle = '#111';
  c.lineWidth = 0.9;
  for (const s of [-1, 1]) {
    for (const dy of [-2, 0, 2]) {
      c.beginPath();
      c.moveTo(0, 18 + dy);
      c.lineTo(s * 4.5, 16 + dy * 1.8);
      c.stroke();
    }
  }
  ell(c, 0, 18, 1.6, 2.8);
  paint(c, '#111');
  head(c, red, st);
  // teia
  c.save();
  clipHead(c);
  c.strokeStyle = 'rgba(40,0,0,0.55)';
  c.lineWidth = 0.9;
  const cy = -5;
  const n = 12;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    c.beginPath();
    c.moveTo(0, cy);
    c.lineTo(Math.cos(a) * 40, cy + Math.sin(a) * 40);
    c.stroke();
  }
  for (const r of [7, 14, 21, 28]) {
    c.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const x = Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) c.moveTo(x, y);
      else {
        const m = a - Math.PI / n;
        c.quadraticCurveTo(Math.cos(m) * r * 0.8, cy + Math.sin(m) * r * 0.8, x, y);
      }
    }
    c.stroke();
  }
  c.restore();
  // olhos grandes
  for (const s of [-1, 1]) {
    c.save();
    c.translate(s * 9, -11);
    c.rotate(s * 0.45);
    ell(c, 0, 0, 7, 9);
    paint(c, '#111');
    ell(c, 0, 0.6, 5, 6.8);
    paint(c, '#ffffff');
    c.restore();
  }
  gloves(c, red);
}

function venom(c: Ctx) {
  const black = '#16161c';
  const sheen = '#3b4f8a';
  body(c, { fur: black, stroke: sheen, shoe: black, strap: sheen });
  // aranha branca no peito
  c.strokeStyle = '#ffffff';
  c.lineWidth = 2;
  c.lineCap = 'round';
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(0, 15);
    c.quadraticCurveTo(s * 9, 8, s * 13, 5);
    c.moveTo(0, 20);
    c.quadraticCurveTo(s * 8, 25, s * 12, 31);
    c.stroke();
  }
  ell(c, 0, 17, 2.8, 4.5);
  paint(c, '#ffffff');
  head(c, black, sheen);
  ell(c, -9, -22, 8, 3.5, -0.4);
  paint(c, 'rgba(120,150,255,0.28)');
  // olhos grandes
  for (const s of [-1, 1]) {
    c.save();
    c.translate(s * 10, -13);
    c.rotate(s * 0.5);
    c.beginPath();
    c.moveTo(0, -10);
    c.quadraticCurveTo(s * 9, -4, s * 5, 6);
    c.quadraticCurveTo(0, 10, -s * 6, 4);
    c.quadraticCurveTo(-s * 6, -6, 0, -10);
    c.closePath();
    paint(c, '#ffffff');
    c.restore();
  }
  // sorrisão com dentinhos (versão fofa)
  c.beginPath();
  c.moveTo(-14, 0);
  c.quadraticCurveTo(0, 18, 14, 0);
  c.quadraticCurveTo(0, 5, -14, 0);
  c.closePath();
  paint(c, '#ffffff');
  c.save();
  c.clip();
  ell(c, 3, 9, 4.5, 3);
  paint(c, '#ff6f9a');
  c.strokeStyle = black;
  c.lineWidth = 0.9;
  for (let x = -10; x <= 10; x += 4) {
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x, 14);
    c.stroke();
  }
  c.restore();
  gloves(c, black);
}

// ---------- heróis (rosto humano, estilo chibi) ----------

const PEACH = '#f6cba3';

function humanHead(c: Ctx, skin = PEACH) {
  ell(c, 0, HY, HR, HR * 0.94);
  paint(c, skin, OUTLINE, 1.6);
}

function humanFace(c: Ctx, o: { eyes?: boolean; lips?: string; angry?: boolean } = {}) {
  if (o.eyes !== false) {
    for (const s of [-1, 1]) {
      ell(c, s * 8, -9, 3.6, 4.8);
      paint(c, '#1b1b2a');
      ell(c, s * 7, -10.8, 1.3, 1.6);
      paint(c, '#fff');
    }
  }
  if (o.angry) {
    c.lineCap = 'round';
    c.lineWidth = 2.4;
    c.strokeStyle = '#1b1b2a';
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(s * 13, -18);
      c.lineTo(s * 4, -14.5);
      c.stroke();
    }
  }
  c.beginPath();
  c.moveTo(-5, 5);
  c.quadraticCurveTo(0, 10, 5, 5);
  c.lineWidth = 1.7;
  c.lineCap = 'round';
  c.strokeStyle = o.lips ?? '#7a2a1a';
  c.stroke();
  c.fillStyle = 'rgba(255,110,140,0.3)';
  for (const s of [-1, 1]) {
    ell(c, s * 14, 2, 3.5, 2);
    c.fill();
  }
}

function maskEyes(c: Ctx, color = '#ffffff', y = -9) {
  for (const s of [-1, 1]) {
    c.save();
    c.translate(s * 8.5, y);
    c.rotate(s * 0.28);
    ell(c, 0, 0, 5.6, 3.4);
    paint(c, color);
    c.restore();
  }
}

/** Cabelo/capacete cobrindo o topo da cabeça, com franja em `fringeY`. */
function hairCap(c: Ctx, color: string, fringeY = -14, stroke = OUTLINE) {
  const R = HR + 1.5;
  const a0 = Math.PI * 0.95;
  c.beginPath();
  c.arc(0, HY, R, a0, Math.PI * 2.05);
  c.quadraticCurveTo(R * 0.55, fringeY - 9, 0, fringeY);
  c.quadraticCurveTo(-R * 0.55, fringeY - 9, Math.cos(a0) * R, HY + Math.sin(a0) * R);
  c.closePath();
  paint(c, color, stroke);
}

/** Máscara que cobre a cabeça até `bottomY` (o queixo fica de fora). */
function cowl(c: Ctx, color: string, bottomY = 0) {
  c.save();
  clipHead(c);
  c.beginPath();
  c.moveTo(-HR - 2, -40);
  c.lineTo(HR + 2, -40);
  c.lineTo(HR + 2, bottomY);
  c.quadraticCurveTo(0, bottomY + 9, -HR - 2, bottomY);
  c.closePath();
  paint(c, color);
  c.restore();
  ell(c, 0, HY, HR, HR * 0.94);
  c.lineWidth = 1.6;
  c.strokeStyle = OUTLINE;
  c.stroke();
}

function longHair(c: Ctx, color: string) {
  ell(c, 0, 2, HR + 5, HR + 6);
  paint(c, color, OUTLINE);
}

function cape(c: Ctx, color: string) {
  c.beginPath();
  c.moveTo(-13, 6);
  c.lineTo(13, 6);
  c.quadraticCurveTo(22, 24, 25, 38);
  c.quadraticCurveTo(0, 43, -25, 38);
  c.quadraticCurveTo(-22, 24, -13, 6);
  c.closePath();
  paint(c, color, OUTLINE);
}

function belt(c: Ctx, color: string, y = 25) {
  ell(c, 0, y, 15.5, 2.4);
  paint(c, color);
}

function bolt(c: Ctx, x: number, y: number, k: number, color: string) {
  c.beginPath();
  c.moveTo(x + 2 * k, y - 6 * k);
  c.lineTo(x - 3 * k, y + 0.5 * k);
  c.lineTo(x + 0.5 * k, y + 0.5 * k);
  c.lineTo(x - 2 * k, y + 6 * k);
  c.lineTo(x + 3 * k, y - 1 * k);
  c.lineTo(x - 0.5 * k, y - 1 * k);
  c.closePath();
  paint(c, color);
}

function batShape(c: Ctx, x: number, y: number, k: number, color: string) {
  c.beginPath();
  c.moveTo(x - 7 * k, y - 1 * k);
  c.quadraticCurveTo(x - 4 * k, y - 3 * k, x - 1.5 * k, y - 1.5 * k);
  c.lineTo(x - 1 * k, y - 3 * k);
  c.lineTo(x, y - 2 * k);
  c.lineTo(x + 1 * k, y - 3 * k);
  c.lineTo(x + 1.5 * k, y - 1.5 * k);
  c.quadraticCurveTo(x + 4 * k, y - 3 * k, x + 7 * k, y - 1 * k);
  c.quadraticCurveTo(x + 4 * k, y + 0.5 * k, x + 3 * k, y + 2.5 * k);
  c.quadraticCurveTo(x, y + 1 * k, x - 3 * k, y + 2.5 * k);
  c.quadraticCurveTo(x - 4 * k, y + 0.5 * k, x - 7 * k, y - 1 * k);
  c.closePath();
  paint(c, color);
}

function star(c: Ctx, x: number, y: number, r: number, color: string) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath();
  paint(c, color);
}

function superman(c: Ctx) {
  cape(c, '#d42a2a');
  body(c, { fur: '#2463d6', stroke: '#123a8a', shoe: '#d42a2a', strap: '#a81c1c' });
  belt(c, '#ffd23a');
  c.beginPath();
  c.moveTo(0, 8.5);
  c.lineTo(8, 13);
  c.lineTo(0, 21.5);
  c.lineTo(-8, 13);
  c.closePath();
  paint(c, '#ffd23a', '#d42a2a', 1.4);
  c.fillStyle = '#d42a2a';
  c.font = 'bold 9px sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('S', 0, 14.5);
  humanHead(c);
  hairCap(c, '#1b1b2a', -15);
  c.beginPath();
  c.arc(-2, -16, 3, 0.2, Math.PI * 1.6);
  c.lineWidth = 1.8;
  c.strokeStyle = '#1b1b2a';
  c.stroke();
  gloves(c, '#2463d6');
  humanFace(c);
}

function batman(c: Ctx) {
  const dark = '#262a36';
  cape(c, dark);
  body(c, { fur: '#6e7484', stroke: '#3a3e4a', shoe: dark, strap: '#3a3e4a' });
  belt(c, '#f2c230');
  ell(c, 0, 14, 8.5, 4.6);
  paint(c, '#f2c230');
  batShape(c, 0, 14, 1, '#111');
  humanHead(c);
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(s * 7, -30);
    c.lineTo(s * 12, -45);
    c.lineTo(s * 18, -27);
    c.closePath();
    paint(c, dark, OUTLINE);
  }
  cowl(c, dark, 0);
  maskEyes(c);
  c.beginPath();
  c.moveTo(-4, 6);
  c.quadraticCurveTo(0, 9, 4, 6);
  c.lineWidth = 1.7;
  c.strokeStyle = '#7a2a1a';
  c.stroke();
  gloves(c, dark);
}

function wonderWoman(c: Ctx) {
  longHair(c, '#1b1b2a');
  body(c, { fur: '#c8202c', stroke: '#7a1018', shoe: '#c8202c', strap: '#f2c230' });
  // saia azul com estrelas
  c.beginPath();
  c.moveTo(-15, 25);
  c.lineTo(15, 25);
  c.lineTo(18, 33);
  c.quadraticCurveTo(0, 37, -18, 33);
  c.closePath();
  paint(c, '#1f3fa8');
  for (const x of [-9, 0, 9]) star(c, x, 30, 2, '#ffffff');
  belt(c, '#f2c230', 24);
  c.beginPath();
  c.moveTo(-8, 12);
  c.lineTo(-4, 18);
  c.lineTo(0, 13);
  c.lineTo(4, 18);
  c.lineTo(8, 12);
  c.lineWidth = 2.2;
  c.strokeStyle = '#f2c230';
  c.stroke();
  humanHead(c);
  hairCap(c, '#1b1b2a', -13);
  c.beginPath();
  c.arc(0, HY, HR - 1, Math.PI * 1.22, Math.PI * 1.78);
  c.lineWidth = 3.5;
  c.strokeStyle = '#f2c230';
  c.stroke();
  star(c, 0, -31, 3.5, '#d42a2a');
  gloves(c, PEACH, 7, (s) => {
    ell(c, s * 17.5, 17.5, 5.5, 2.6, s * 0.4);
    paint(c, '#cfd3e0');
  });
  humanFace(c, { lips: '#c8202c' });
}

function flash(c: Ctx) {
  const red = '#d4212b';
  body(c, { fur: red, stroke: '#7a1018', shoe: '#f2c230', strap: '#d4a020' });
  belt(c, '#f2c230');
  ell(c, 0, 15, 6.5, 6.5);
  paint(c, '#ffffff', '#f2c230', 1.4);
  bolt(c, 0, 15, 0.9, '#f2c230');
  humanHead(c);
  cowl(c, red, 1);
  for (const s of [-1, 1]) {
    c.save();
    c.translate(s * 25, -12);
    c.scale(s, 1);
    c.beginPath();
    c.moveTo(0, -4);
    c.lineTo(9, -10);
    c.lineTo(5, -3);
    c.lineTo(11, -4);
    c.lineTo(1, 4);
    c.closePath();
    paint(c, '#f2c230', OUTLINE, 1);
    c.restore();
  }
  maskEyes(c);
  c.beginPath();
  c.moveTo(-5, 6);
  c.quadraticCurveTo(0, 10, 5, 6);
  c.lineWidth = 1.7;
  c.strokeStyle = '#7a2a1a';
  c.stroke();
  gloves(c, red);
}

function lantern(c: Ctx) {
  const green = '#2fa84f';
  body(c, { fur: '#1c1c22', stroke: '#000', belly: green, shoe: green, strap: '#1c1c22' });
  ell(c, 0, 15, 6, 6);
  paint(c, '#ffffff');
  ell(c, 0, 15, 4, 4);
  c.lineWidth = 1.6;
  c.strokeStyle = green;
  c.stroke();
  c.fillStyle = green;
  c.fillRect(-4.5, 12.5, 9, 1.5);
  c.fillRect(-4.5, 16, 9, 1.5);
  humanHead(c);
  hairCap(c, '#5a3a22', -16);
  // máscara de dominó verde
  c.beginPath();
  c.moveTo(-17, -12);
  c.quadraticCurveTo(0, -18, 17, -12);
  c.quadraticCurveTo(15, -3, 6, -5);
  c.quadraticCurveTo(0, -8, -6, -5);
  c.quadraticCurveTo(-15, -3, -17, -12);
  c.closePath();
  paint(c, green);
  maskEyes(c, '#ffffff', -10);
  gloves(c, green);
  humanFace(c, { eyes: false });
}

function aquaman(c: Ctx) {
  const blond = '#e0a83a';
  longHair(c, blond);
  body(c, { fur: '#e8892a', stroke: '#9a5410', shoe: '#2f8f4a', strap: '#f2c230' });
  // escamas
  c.save();
  ell(c, 0, 20, 17, 15);
  c.clip();
  c.strokeStyle = 'rgba(160,80,10,0.55)';
  c.lineWidth = 1;
  for (let y = 8; y < 26; y += 4.5) {
    for (let x = -16 + ((y / 4.5) % 2) * 3; x < 17; x += 6) {
      c.beginPath();
      c.arc(x, y, 3, 0, Math.PI);
      c.stroke();
    }
  }
  c.fillStyle = '#2f8f4a';
  c.fillRect(-20, 26, 40, 12);
  c.restore();
  belt(c, '#f2c230', 26);
  humanHead(c);
  hairCap(c, blond, -14);
  // barba
  c.beginPath();
  c.moveTo(-18, -2);
  c.quadraticCurveTo(-16, 16, 0, 17);
  c.quadraticCurveTo(16, 16, 18, -2);
  c.quadraticCurveTo(10, 4, 0, 3);
  c.quadraticCurveTo(-10, 4, -18, -2);
  c.closePath();
  paint(c, blond);
  gloves(c, PEACH);
  humanFace(c, { lips: '#5a2a10' });
}

function ironMan(c: Ctx) {
  const red = '#c21d1d';
  const gold = '#e8b23a';
  body(c, { fur: red, stroke: '#6e0e0e', shoe: gold, strap: red });
  ell(c, 0, 15, 5, 5);
  paint(c, '#bff6ff', '#7fd8ff', 1.6);
  belt(c, gold);
  ell(c, 0, HY, HR, HR * 0.94);
  paint(c, red, '#6e0e0e', 1.8);
  // máscara dourada
  c.beginPath();
  c.moveTo(-15, -20);
  c.quadraticCurveTo(0, -24, 15, -20);
  c.lineTo(13, 4);
  c.quadraticCurveTo(0, 14, -13, 4);
  c.closePath();
  paint(c, gold, '#9a7414', 1.2);
  for (const s of [-1, 1]) {
    c.save();
    c.translate(s * 7, -9);
    c.rotate(s * 0.15);
    c.fillStyle = '#e8fbff';
    c.shadowColor = '#7fd8ff';
    c.shadowBlur = 4;
    c.fillRect(-4.5, -1.6, 9, 3.2);
    c.restore();
  }
  c.fillStyle = '#9a7414';
  c.fillRect(-5, 5, 10, 1.4);
  gloves(c, red);
}

function captain(c: Ctx) {
  const blue = '#2a4fb8';
  body(c, { fur: blue, stroke: '#14306e', shoe: '#c8202c', strap: '#7a4a22' });
  c.save();
  ell(c, 0, 20, 17, 15);
  c.clip();
  for (let i = 0; i < 4; i++) {
    c.fillStyle = i % 2 ? '#ffffff' : '#c8202c';
    c.fillRect(-10, 21 + i * 3, 20, 3);
  }
  c.restore();
  star(c, 0, 14, 5.5, '#ffffff');
  humanHead(c);
  // capacete azul com "A" e asinhas
  c.save();
  clipHead(c);
  c.beginPath();
  c.moveTo(-HR - 2, -40);
  c.lineTo(HR + 2, -40);
  c.lineTo(HR + 2, 8);
  c.lineTo(17, 8);
  c.lineTo(17, -15);
  c.quadraticCurveTo(0, -20, -17, -15);
  c.lineTo(-17, 8);
  c.lineTo(-HR - 2, 8);
  c.closePath();
  paint(c, blue);
  c.restore();
  ell(c, 0, HY, HR, HR * 0.94);
  c.lineWidth = 1.6;
  c.strokeStyle = OUTLINE;
  c.stroke();
  c.fillStyle = '#ffffff';
  c.font = 'bold 11px sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('A', 0, -25);
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(s * 18, -10);
    c.lineTo(s * 26, -18);
    c.lineTo(s * 24, -12);
    c.lineTo(s * 28, -12);
    c.lineTo(s * 20, -5);
    c.closePath();
    paint(c, '#ffffff', OUTLINE, 1);
  }
  gloves(c, '#c8202c');
  humanFace(c);
}

function hulk(c: Ctx) {
  const green = '#6cbf3d';
  const st = '#2f6a14';
  body(c, { fur: green, stroke: st, shoe: green, strap: st });
  // shorts roxo rasgado
  c.beginPath();
  c.moveTo(-16, 24);
  c.lineTo(16, 24);
  c.lineTo(17, 32);
  for (let x = 17; x > -17; x -= 4) c.lineTo(x - 2, x % 8 ? 35 : 31);
  c.closePath();
  paint(c, '#7a3fb0');
  humanHead(c, green);
  hairCap(c, '#1b1b2a', -15);
  for (const d of [-150, -120, -60, -30]) spike(c, d, 6, 4, '#1b1b2a', undefined, HR * 0.85);
  gloves(c, green, 9);
  humanFace(c, { angry: true, lips: '#1f4a0a' });
}

function thor(c: Ctx) {
  const blond = '#e9c04a';
  cape(c, '#c8202c');
  longHair(c, blond);
  body(c, { fur: '#3b4150', stroke: '#1c2028', shoe: '#3b4150', strap: '#cfd3e0' });
  for (const [x, y] of [
    [-6, 13],
    [6, 13],
    [-6, 20],
    [6, 20],
  ]) {
    ell(c, x, y, 2.6, 2.6);
    paint(c, '#cfd3e0');
  }
  humanHead(c);
  hairCap(c, blond, -14);
  // capacete com asinhas
  c.beginPath();
  c.arc(0, HY, HR + 2, Math.PI * 1.2, Math.PI * 1.8);
  c.lineWidth = 6;
  c.strokeStyle = '#cfd3e0';
  c.stroke();
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(s * 18, -26);
    c.quadraticCurveTo(s * 30, -40, s * 34, -30);
    c.quadraticCurveTo(s * 28, -30, s * 21, -22);
    c.closePath();
    paint(c, '#ffffff', OUTLINE, 1);
  }
  // martelo
  c.fillStyle = '#7a4a22';
  c.fillRect(22, 18, 3, 14);
  c.beginPath();
  c.rect(16, 10, 15, 9);
  paint(c, '#9aa3b5', '#4a5060', 1.2);
  gloves(c, PEACH);
  humanFace(c);
}

function widow(c: Ctx) {
  const red = '#c8382a';
  ell(c, 0, -2, HR + 4, HR + 2);
  paint(c, red, OUTLINE);
  body(c, { fur: '#1c1c24', stroke: '#000', shoe: '#1c1c24', strap: '#5a5a66' });
  belt(c, '#5a5a66');
  c.beginPath();
  c.moveTo(-3, 22);
  c.lineTo(3, 22);
  c.lineTo(-3, 28);
  c.lineTo(3, 28);
  c.closePath();
  paint(c, '#e0242f');
  humanHead(c);
  hairCap(c, red, -13);
  gloves(c, '#1c1c24');
  humanFace(c, { lips: '#c8202c' });
}

function panther(c: Ctx) {
  const black = '#1c1c24';
  const line = '#a99cff';
  body(c, { fur: black, stroke: '#000', shoe: black, strap: line });
  // colar prateado
  for (let i = -3; i <= 3; i++) {
    c.beginPath();
    c.moveTo(i * 3.5 - 1.5, 7.5 + Math.abs(i) * -0.6);
    c.lineTo(i * 3.5 + 1.5, 7.5 + Math.abs(i) * -0.6);
    c.lineTo(i * 3.5, 11.5 - Math.abs(i) * 0.6);
    c.closePath();
    paint(c, '#cfd3e0');
  }
  c.strokeStyle = line;
  c.lineWidth = 1;
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(s * 4, 13);
    c.lineTo(s * 10, 24);
    c.stroke();
  }
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(s * 9, -29);
    c.quadraticCurveTo(s * 15, -40, s * 20, -26);
    c.closePath();
    paint(c, black, OUTLINE);
  }
  ell(c, 0, HY, HR, HR * 0.94);
  paint(c, black, '#000', 1.6);
  c.strokeStyle = line;
  c.lineWidth = 1.1;
  c.beginPath();
  c.moveTo(-10, -26);
  c.lineTo(0, -17);
  c.lineTo(10, -26);
  c.moveTo(0, -17);
  c.lineTo(0, -4);
  c.stroke();
  maskEyes(c, '#ffffff', -10);
  gloves(c, black);
}

const DRAW: Record<CharId, (c: Ctx) => void> = {
  sonic,
  tails,
  knuckles,
  amy,
  shadow,
  silver,
  cream,
  leo: (c) => turtle(c, '#2f6fe0'),
  raph: (c) => turtle(c, '#e0262c'),
  donnie: (c) => turtle(c, '#8a3fd6'),
  mikey: (c) => turtle(c, '#f28a1e'),
  spidey,
  venom,
  superman,
  batman,
  wonder: wonderWoman,
  flash,
  lantern,
  aquaman,
  ironman: ironMan,
  captain,
  hulk,
  thor,
  widow,
  panther,
};

export function drawCharacter(c: Ctx, id: CharId) {
  c.save();
  c.lineJoin = 'round';
  DRAW[id](c);
  c.restore();
}

/** Sprite pré-renderizado. A caixa tem 140 unidades (±70 em volta do centro). */
export const SPRITE_BOX = 140;

export function makeSprite(id: CharId, px: number): HTMLCanvasElement {
  const size = Math.max(8, Math.ceil(px));
  const cv = document.createElement('canvas');
  cv.width = size;
  cv.height = size;
  const c = cv.getContext('2d')!;
  c.scale(size / SPRITE_BOX, size / SPRITE_BOX);
  c.translate(SPRITE_BOX / 2, SPRITE_BOX / 2 - 4);
  drawCharacter(c, id);
  return cv;
}

/** Silhueta escura (personagem ainda bloqueado). */
export function makeSilhouette(id: CharId, px: number): HTMLCanvasElement {
  const cv = makeSprite(id, px);
  const c = cv.getContext('2d')!;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = 'source-in';
  c.fillStyle = '#5a4d8a';
  c.fillRect(0, 0, cv.width, cv.height);
  return cv;
}
