// Personagens desenhados à mão em canvas (fan art, sem assets oficiais).
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

/** Traço grosso com contorno: braço, perna, cabo. */
function limb(c: Ctx, x0: number, y0: number, x1: number, y1: number, w: number, color: string, stroke = OUTLINE) {
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x0, y0);
  c.lineTo(x1, y1);
  c.lineWidth = w + 2.4;
  c.strokeStyle = stroke;
  c.stroke();
  c.lineWidth = w;
  c.strokeStyle = color;
  c.stroke();
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

function clipHead(c: Ctx) {
  ell(c, 0, HY, HR, HR * 0.94);
  c.clip();
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

// ---------- turma do Sonic: pernas finas, sapatão, olhos unidos ----------

const SKIN = '#f6cf9f';

/** Sapato de bico comprido apontando pra fora, com sola branca, tira e fivela. */
function shoe(c: Ctx, s: number, color: string, strap: string, buckle?: string) {
  c.save();
  c.translate(s * 9, 38);
  c.scale(s, 1);
  c.beginPath();
  c.moveTo(-7, -2);
  c.quadraticCurveTo(-6, -8, 2, -7.5);
  c.quadraticCurveTo(15, -6.5, 15, 0);
  c.quadraticCurveTo(14, 4.5, 2, 4.5);
  c.quadraticCurveTo(-8, 4.5, -7, -2);
  c.closePath();
  paint(c, color, OUTLINE);
  c.beginPath();
  c.moveTo(-6.5, 2.6);
  c.quadraticCurveTo(4, 6, 14.2, 1.8);
  c.lineWidth = 2.2;
  c.strokeStyle = '#f4f4f4';
  c.stroke();
  ell(c, 0.5, -3.2, 2.6, 4.6, 0.15);
  paint(c, strap);
  if (buckle) {
    c.fillStyle = buckle;
    c.fillRect(-0.6, -4.6, 2.6, 2.8);
  }
  c.restore();
}

interface ToonOpts {
  fur: string;
  stroke: string;
  /** cor dos braços (no Sonic, pele) */
  arm: string;
  legs?: string;
  belly?: string;
  dress?: string;
  shoe: string;
  strap: string;
  buckle?: string;
}

function toonBody(c: Ctx, o: ToonOpts) {
  for (const s of [-1, 1]) limb(c, s * 4.5, 25, s * 7, 34, 4.2, o.legs ?? o.fur, o.stroke);
  for (const s of [-1, 1]) shoe(c, s, o.shoe, o.strap, o.buckle);
  for (const s of [-1, 1]) limb(c, s * 8, 10, s * 18, 20, 3.8, o.arm, o.stroke);
  if (o.dress) {
    c.beginPath();
    c.moveTo(-9, 8);
    c.lineTo(9, 8);
    c.quadraticCurveTo(15, 18, 18, 29);
    c.quadraticCurveTo(0, 33, -18, 29);
    c.quadraticCurveTo(-15, 18, -9, 8);
    c.closePath();
    paint(c, o.dress, OUTLINE);
    return;
  }
  ell(c, 0, 17, 10.5, 11.5);
  paint(c, o.fur, o.stroke);
  if (o.belly) {
    ell(c, 0, 19, 7, 8.5);
    paint(c, o.belly);
  }
}

/** Luvas brancas com punho dobrado. `extra` desenha por cima (anéis, espinhos…). */
function toonGloves(c: Ctx, color = '#ffffff', r = 6, extra?: (s: number) => void) {
  for (const s of [-1, 1]) {
    ell(c, s * 16.5, 18, 4.6, 2.8, s * 0.7);
    paint(c, color, OUTLINE);
    ell(c, s * 19.5, 22, r, r * 0.92);
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
    [-5, 10, 5],
    [5, 10, 5],
    [0, 13, 5.5],
    [0, 17, 4],
  ]) {
    ell(c, x * k, y, r * k, r * k);
    c.fill();
  }
}

/** Franja: mechas curtas caindo na testa. */
function bangs(c: Ctx, color: string, stroke: string, xs: number[], len = 9) {
  for (const x of xs) {
    c.beginPath();
    c.moveTo(x - 4, -30);
    c.quadraticCurveTo(x - 2, -24, x + 1.5, -30 + len);
    c.quadraticCurveTo(x + 2.5, -26, x + 4, -30);
    c.closePath();
    paint(c, color, stroke, 1.1);
  }
}

/**
 * Rosto da turma do Sonic: olhos grandes (unidos no meio, como no jogo),
 * focinho claro, nariz preto e sorriso de canto.
 */
function toonFace(c: Ctx, muzzle: string, iris: string, joined = true) {
  const ey = -12;
  c.fillStyle = '#1b1b2a';
  for (const s of [-1, 1]) {
    ell(c, s * 7.2, ey, 8.4, 10.6, s * -0.12);
    c.fill();
  }
  c.fillStyle = '#ffffff';
  for (const s of [-1, 1]) {
    ell(c, s * 7.2, ey, 7.2, 9.4, s * -0.12);
    c.fill();
  }
  if (joined) {
    ell(c, 0, ey - 2.5, 4.2, 6);
    c.fill();
  }
  for (const s of [-1, 1]) {
    ell(c, s * 4.4 + 1, ey + 1.4, 3.6, 5.6);
    paint(c, iris);
    ell(c, s * 4.4 + 1.3, ey + 2, 2, 3.4);
    paint(c, '#111');
    ell(c, s * 4.4 + 0.1, ey - 0.6, 1.2, 1.7);
    paint(c, '#fff');
  }
  // focinho: abaixo dos olhos, mais largo embaixo
  c.beginPath();
  c.moveTo(-12, 3);
  c.quadraticCurveTo(-11, -1.5, -4, -0.5);
  c.quadraticCurveTo(0, -2, 4, -0.5);
  c.quadraticCurveTo(11, -1.5, 12, 3);
  c.quadraticCurveTo(12.5, 13, 0, 13);
  c.quadraticCurveTo(-12.5, 13, -12, 3);
  c.closePath();
  paint(c, muzzle);
  // nariz
  ell(c, 0, 0.6, 3.4, 2.4);
  paint(c, '#151515');
  ell(c, -1, -0.2, 1.1, 0.7);
  paint(c, 'rgba(255,255,255,0.7)');
  // sorriso de canto
  c.beginPath();
  c.moveTo(-5, 6);
  c.quadraticCurveTo(1, 11, 7, 5);
  c.lineWidth = 1.6;
  c.lineCap = 'round';
  c.strokeStyle = '#3a1a10';
  c.stroke();
  c.beginPath();
  c.moveTo(6, 3.6);
  c.lineTo(7.8, 6.2);
  c.stroke();
}

function sonic(c: Ctx) {
  const fur = '#1f5fe0';
  const st = '#0d2c78';
  // espinhos pra trás e pra fora
  for (const d of [-118, 200, 174, 150]) spike(c, d, 25, 9, fur, st);
  for (const d of [-62, -20, 6, 30]) spike(c, d, 25, 9, fur, st);
  toonBody(c, { fur, stroke: st, arm: SKIN, belly: SKIN, shoe: '#e0262c', strap: '#ffffff', buckle: '#f2c230' });
  for (const s of [-1, 1]) ear(c, s, 15, -27, 7.5, 14, 0.45, fur, SKIN, st);
  head(c, fur, st);
  toonGloves(c);
  toonFace(c, SKIN, '#22a447');
}

function tails(c: Ctx) {
  const fur = '#f6a21e';
  const st = '#8a4d07';
  for (const s of [-1, 1]) {
    c.save();
    c.translate(s * 12, 26);
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
  toonBody(c, { fur, stroke: st, arm: fur, shoe: '#e0262c', strap: '#ffffff' });
  fluff(c, '#ffffff');
  for (const s of [-1, 1]) ear(c, s, 15, -25, 8.5, 20, 0.35, fur, '#ffffff', st);
  head(c, fur, st);
  // três mechas na testa
  for (const d of [-112, -90, -68]) spike(c, d, 8, 5, fur, st, HR * 0.8);
  toonGloves(c);
  toonFace(c, '#ffffff', '#2f7fe6');
}

function knuckles(c: Ctx) {
  const fur = '#d8262e';
  const st = '#6e0d12';
  // dreads caídos dos lados
  for (const d of [118, 140, 162]) spike(c, d, 20, 8, fur, st, HR * 0.4);
  for (const d of [62, 40, 18]) spike(c, d, 20, 8, fur, st, HR * 0.4);
  toonBody(c, { fur, stroke: st, arm: fur, shoe: '#2c9a43', strap: '#f6d03a', buckle: '#e0262c' });
  // meia-lua branca no peito
  c.beginPath();
  c.arc(0, 9, 8.5, 0.12 * Math.PI, 0.88 * Math.PI);
  c.arc(0, 5, 8.5, 0.82 * Math.PI, 0.18 * Math.PI, true);
  c.closePath();
  paint(c, '#ffffff');
  head(c, fur, st);
  for (const d of [-105, -75]) spike(c, d, 7, 5, fur, st, HR * 0.8);
  // punhos grandes com espinhos
  toonGloves(c, '#ffffff', 8, (s) => {
    for (const dy of [-3, 3]) {
      c.beginPath();
      c.moveTo(s * 25, 22 + dy - 1.8);
      c.lineTo(s * 31, 22 + dy);
      c.lineTo(s * 25, 22 + dy + 1.8);
      c.closePath();
      paint(c, '#e8e8e8', OUTLINE, 1);
    }
  });
  toonFace(c, '#f3c79a', '#8e3fd6');
}

function amy(c: Ctx) {
  const fur = '#ff6fae';
  const st = '#a3245e';
  // cabelo chanel: espinhos curtos caindo
  for (const d of [128, 150, 172]) spike(c, d, 13, 8, fur, st);
  for (const d of [52, 30, 8]) spike(c, d, 13, 8, fur, st);
  toonBody(c, { fur, stroke: st, arm: SKIN, dress: '#e8263a', shoe: '#e8263a', strap: '#ffffff' });
  for (const s of [-1, 1]) ear(c, s, 15, -27, 7.5, 13, 0.4, fur, SKIN, st);
  head(c, fur, st);
  // tiara vermelha
  c.beginPath();
  c.arc(0, HY, HR - 3, Math.PI * 1.18, Math.PI * 1.82);
  c.lineWidth = 5;
  c.lineCap = 'round';
  c.strokeStyle = '#e8263a';
  c.stroke();
  bangs(c, fur, st, [-6, 0, 6], 8);
  // pulseiras douradas
  toonGloves(c, '#ffffff', 6, (s) => {
    ell(c, s * 15.5, 16.5, 3.6, 1.8, s * 0.7);
    paint(c, '#f2c230');
  });
  toonFace(c, SKIN, '#22a447');
}

function shadow(c: Ctx) {
  const fur = '#2b2b31';
  const st = '#0b0b0e';
  // espinhos virados pra cima, com listra vermelha
  for (const d of [198, 222, 246, -18, -42, -66]) {
    spike(c, d, 22, 8.5, fur, st);
    spike(c, d, 17, 2.8, '#e0242f', undefined, HR * 0.95);
  }
  toonBody(c, { fur, stroke: st, arm: fur, shoe: '#f2f2f2', strap: '#e0242f', buckle: '#f2c230' });
  fluff(c, '#ffffff');
  for (const s of [-1, 1]) ear(c, s, 15, -27, 7.5, 14, 0.4, fur, '#e8b9a0', st);
  head(c, fur, st);
  // anéis dourados nos pulsos
  toonGloves(c, '#ffffff', 6, (s) => {
    ell(c, s * 15.5, 16.5, 3.8, 2, s * 0.7);
    paint(c, '#f2c230', '#a67c10', 0.8);
  });
  toonFace(c, '#f2c39c', '#e0242f');
  // olhar bravo
  c.beginPath();
  c.moveTo(-14, -21);
  c.lineTo(-2, -17);
  c.moveTo(14, -21);
  c.lineTo(2, -17);
  c.lineWidth = 2.2;
  c.strokeStyle = st;
  c.stroke();
}

function silver(c: Ctx) {
  const fur = '#e2e6ee';
  const st = '#7d8899';
  for (const d of [190, -10]) spike(c, d, 14, 8, fur, st);
  // leque de espinhos na frente da cabeça
  for (const d of [-150, -122, -90, -58, -30]) spike(c, d, 17, 8, fur, st, HR * 0.6);
  toonBody(c, { fur, stroke: st, arm: fur, shoe: '#f5f5f5', strap: '#25c7d9', buckle: '#f2c230' });
  fluff(c, '#ffffff', true);
  for (const s of [-1, 1]) ear(c, s, 15, -26, 7.5, 13, 0.45, fur, '#c6ccd8', st);
  head(c, fur, st);
  toonGloves(c, '#ffffff', 6, (s) => {
    ell(c, s * 19.5, 22, 2.6, 2.6);
    paint(c, '#25c7d9');
  });
  toonFace(c, '#f1d1ad', '#e2b11e');
}

/** Cheese, o chao da Cream: gotinha azul com bolinha amarela em cima. */
function chao(c: Ctx, x: number, y: number) {
  ell(c, x, y + 10, 5.5, 4.6);
  paint(c, '#9fd4ff', OUTLINE, 1);
  ell(c, x, y, 7.5, 6.5);
  paint(c, '#9fd4ff', OUTLINE, 1);
  ell(c, x, y - 12, 2.6, 2.6);
  paint(c, '#f6d03a', OUTLINE, 0.8);
  c.fillStyle = '#111';
  for (const s of [-1, 1]) {
    ell(c, x + s * 2.4, y, 1.1, 1.5);
    c.fill();
  }
  ell(c, x, y + 5.6, 2.2, 1.3);
  paint(c, '#e0262c');
}

function cream(c: Ctx) {
  const fur = '#f4dcae';
  const st = '#9a6b30';
  // orelhas compridas caídas
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
  toonBody(c, { fur, stroke: st, arm: fur, dress: '#f28a2b', shoe: '#f28a2b', strap: '#f8d24a' });
  // gravatinha azul
  c.beginPath();
  c.moveTo(0, 9);
  c.lineTo(-7, 5);
  c.lineTo(-7, 13);
  c.closePath();
  c.moveTo(0, 9);
  c.lineTo(7, 5);
  c.lineTo(7, 13);
  c.closePath();
  paint(c, '#2f63d1');
  ell(c, 0, 9, 2.4, 2.4);
  paint(c, '#2f63d1');
  head(c, fur, st);
  for (const d of [-105, -80]) spike(c, d, 6, 5, fur, st, HR * 0.85);
  toonGloves(c);
  toonFace(c, '#fff4de', '#8a4a1c', false);
  chao(c, 30, -30);
}

// ---------- Tartarugas Ninja ----------

type Prop = (c: Ctx) => void;

function turtle(c: Ctx, mask: string, letter: string, behind?: Prop, front?: Prop) {
  const skin = '#5fae3c';
  const st = '#2c5e1a';
  const pad = '#8a5a2b';
  behind?.(c);
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
  // casco aparecendo dos lados
  ell(c, 0, 19, 19, 16);
  paint(c, '#6b4a22', '#3d2810');
  // pernas grossas com joelheira
  for (const s of [-1, 1]) {
    limb(c, s * 7, 26, s * 9, 35, 7.5, skin, st);
    ell(c, s * 8.3, 31, 4, 3.2);
    paint(c, pad, OUTLINE, 1);
    ell(c, s * 10, 38.5, 7.5, 4.5);
    paint(c, skin, st);
  }
  // braços com cotoveleira e faixa no pulso
  for (const s of [-1, 1]) {
    limb(c, s * 11, 11, s * 20, 23, 6.5, skin, st);
    ell(c, s * 15.5, 17, 3.4, 2.8);
    paint(c, pad, OUTLINE, 1);
  }
  // plastrão
  c.save();
  ell(c, 0, 21, 12, 12.5);
  paint(c, '#e8c35a', '#a8842c');
  c.clip();
  c.strokeStyle = '#a8842c';
  c.lineWidth = 1.2;
  for (const y of [16, 21, 26]) {
    c.beginPath();
    c.moveTo(-12, y);
    c.lineTo(12, y);
    c.stroke();
  }
  c.restore();
  // cinto com a inicial
  ell(c, 0, 11, 14, 2.6);
  paint(c, pad);
  ell(c, 0, 11, 4.2, 4.2);
  paint(c, '#d8b45a', '#7a5a1a', 1);
  c.fillStyle = '#3d2810';
  c.font = 'bold 6px sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(letter, 0, 11.4);
  // cabeça mais larga que a dos outros
  ell(c, 0, HY, HR + 1, HR * 0.9);
  paint(c, skin, st, 1.8);
  c.save();
  ell(c, 0, HY, HR + 1, HR * 0.9);
  c.clip();
  c.fillStyle = mask;
  c.fillRect(-HR - 2, -20, HR * 2 + 4, 12);
  c.restore();
  for (const s of [-1, 1]) {
    c.save();
    c.translate(s * 8.5, -14);
    c.rotate(s * -0.12);
    ell(c, 0, 0, 5.8, 4.4);
    paint(c, '#ffffff');
    c.restore();
    ell(c, s * 7.2, -13.6, 2, 2.5);
    paint(c, '#111');
    ell(c, s * 6.6, -14.6, 0.8, 0.9);
    paint(c, '#fff');
  }
  // sorrisão
  c.beginPath();
  c.moveTo(-10, 1);
  c.quadraticCurveTo(0, 12, 10, 1);
  c.quadraticCurveTo(0, 5, -10, 1);
  c.closePath();
  paint(c, '#1c3a10');
  c.save();
  c.clip();
  c.fillStyle = '#ffffff';
  c.fillRect(-10, 1, 20, 3.4);
  c.restore();
  for (const s of [-1, 1]) {
    ell(c, s * 21, 25, 5, 4.6);
    paint(c, skin, st);
  }
  front?.(c);
}

const leoKatanas: Prop = (c) => {
  for (const s of [-1, 1]) {
    limb(c, s * 8, 6, s * 30, -36, 3.6, '#2b3a8a', '#111');
    ell(c, s * 22.5, -21.5, 4.5, 1.6, s * -1.1);
    paint(c, '#d8b45a', OUTLINE, 0.8);
  }
};

const raphSais: Prop = (c) => {
  for (const s of [-1, 1]) {
    limb(c, s * 21, 27, s * 20, 32, 3, '#a81c1c', '#3a0a0a');
    limb(c, s * 21, 24, s * 26, 6, 1.8, '#dfe3ea', '#5a6070');
    c.beginPath();
    c.moveTo(s * 17, 17);
    c.quadraticCurveTo(s * 21, 22, s * 25, 17);
    c.lineWidth = 1.8;
    c.strokeStyle = '#dfe3ea';
    c.stroke();
  }
};

const donnieBo: Prop = (c) => {
  limb(c, -36, 38, 34, -40, 4.5, '#8a5a2b', '#3d2810');
  for (const t of [0.15, 0.85]) {
    const x = -36 + 70 * t;
    const y = 38 - 78 * t;
    ell(c, x, y, 3.4, 3.4);
    paint(c, '#c9a04a');
  }
};

const mikeyChucks: Prop = (c) => {
  limb(c, 21, 22, 24, 34, 3.4, '#c46b2c', '#5a2c08');
  c.setLineDash([1.6, 1.4]);
  c.beginPath();
  c.moveTo(24, 34);
  c.quadraticCurveTo(29, 38, 31, 31);
  c.lineWidth = 1.4;
  c.strokeStyle = '#9aa3b5';
  c.stroke();
  c.setLineDash([]);
  limb(c, 31, 31, 38, 20, 3.4, '#c46b2c', '#5a2c08');
};

// ---------- heróis: corpo humano chibi ----------

const PEACH = '#f6cba3';

interface HeroOpts {
  suit: string;
  stroke?: string;
  legs?: string;
  boots: string;
  arms?: string;
  /** mais largo (Hulk) */
  wide?: number;
}

function torsoPath(c: Ctx, w = 1) {
  c.beginPath();
  c.moveTo(-13 * w, 9);
  c.quadraticCurveTo(0, 6, 13 * w, 9);
  c.lineTo(10.5 * w, 29);
  c.quadraticCurveTo(0, 32, -10.5 * w, 29);
  c.closePath();
}

function heroBody(c: Ctx, o: HeroOpts) {
  const w = o.wide ?? 1;
  const st = o.stroke ?? OUTLINE;
  for (const s of [-1, 1]) {
    limb(c, s * 5.5 * w, 27, s * 6.5 * w, 35, 6.5 * w, o.legs ?? o.suit, st);
    ell(c, s * 7.5 * w, 38.5, 6.5 * w, 4.4);
    paint(c, o.boots, OUTLINE);
  }
  for (const s of [-1, 1]) limb(c, s * 12 * w, 12, s * 19 * w, 24, 6 * w, o.arms ?? o.suit, st);
  torsoPath(c, w);
  paint(c, o.suit, st);
}

/** Pinta só dentro do tronco. */
function onTorso(c: Ctx, draw: () => void, w = 1) {
  c.save();
  torsoPath(c, w);
  c.clip();
  draw();
  c.restore();
}

function hands(c: Ctx, color: string, r = 4.6, w = 1) {
  for (const s of [-1, 1]) {
    ell(c, s * 19.5 * w, 25.5, r, r);
    paint(c, color, OUTLINE);
  }
}

function boots(c: Ctx, color: string, top = 31) {
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(s * 2.5, top);
    c.lineTo(s * 9.5, top);
    c.lineTo(s * 13.5, 38);
    c.quadraticCurveTo(s * 7.5, 43.5, s * 1.5, 38);
    c.closePath();
    paint(c, color, OUTLINE);
  }
}

function humanHead(c: Ctx, skin = PEACH) {
  ell(c, 0, HY, HR, HR * 0.94);
  paint(c, skin, OUTLINE, 1.6);
}

function humanFace(c: Ctx, o: { eyes?: boolean; lips?: string; angry?: boolean; brows?: string } = {}) {
  if (o.eyes !== false) {
    for (const s of [-1, 1]) {
      ell(c, s * 8, -9, 3.6, 4.8);
      paint(c, '#1b1b2a');
      ell(c, s * 7, -10.8, 1.3, 1.6);
      paint(c, '#fff');
    }
  }
  if (o.brows) {
    c.lineCap = 'round';
    c.lineWidth = 2;
    c.strokeStyle = o.brows;
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(s * 12, -16.5);
      c.quadraticCurveTo(s * 8, -18.5, s * 4.5, -16.8);
      c.stroke();
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
  c.beginPath();
  c.moveTo(-HR - 4, -6);
  c.quadraticCurveTo(-HR - 8, 24, -18, 30);
  c.lineTo(18, 30);
  c.quadraticCurveTo(HR + 8, 24, HR + 4, -6);
  c.arc(0, HY, HR + 4, 0, Math.PI, true);
  c.closePath();
  paint(c, color, OUTLINE);
}

function cape(c: Ctx, color: string, scallop = false) {
  c.beginPath();
  c.moveTo(-13, 6);
  c.lineTo(13, 6);
  c.quadraticCurveTo(24, 24, 28, 40);
  if (scallop) {
    // barra recortada em ondas (morcego)
    for (let i = 0; i < 4; i++) {
      const x0 = 28 - i * 14;
      c.quadraticCurveTo(x0 - 7, 34, x0 - 14, 40);
    }
  } else {
    c.quadraticCurveTo(0, 45, -28, 40);
  }
  c.quadraticCurveTo(-24, 24, -13, 6);
  c.closePath();
  paint(c, color, OUTLINE);
}

function belt(c: Ctx, color: string, y = 25, w = 1) {
  c.fillStyle = color;
  c.fillRect(-11.5 * w, y - 1.8, 23 * w, 3.6);
}

function trunks(c: Ctx, color: string) {
  onTorso(c, () => {
    c.beginPath();
    c.moveTo(-14, 23);
    c.lineTo(14, 23);
    c.lineTo(14, 33);
    c.quadraticCurveTo(0, 26, -14, 33);
    c.closePath();
    paint(c, color);
  });
}

function spidey(c: Ctx) {
  const red = '#d42a2a';
  const blue = '#1f4fbf';
  const st = '#6e0e0e';
  heroBody(c, { suit: red, stroke: st, legs: blue, boots: red, arms: red });
  boots(c, red, 32);
  onTorso(c, () => {
    // laterais azuis
    c.fillStyle = blue;
    c.fillRect(-16, 15, 7, 20);
    c.fillRect(9, 15, 7, 20);
    // teia no vermelho
    c.strokeStyle = 'rgba(40,0,0,0.5)';
    c.lineWidth = 0.7;
    for (const x of [-5, 0, 5]) {
      c.beginPath();
      c.moveTo(x, 8);
      c.lineTo(x * 1.3, 32);
      c.stroke();
    }
    for (const y of [13, 19, 25]) {
      c.beginPath();
      c.moveTo(-10, y);
      c.quadraticCurveTo(0, y + 2.5, 10, y);
      c.stroke();
    }
  });
  // aranha preta no peito
  c.strokeStyle = '#111';
  c.lineWidth = 0.9;
  for (const s of [-1, 1]) {
    for (const dy of [-2, 0, 2]) {
      c.beginPath();
      c.moveTo(0, 15 + dy);
      c.lineTo(s * 4.5, 13 + dy * 1.8);
      c.stroke();
    }
  }
  ell(c, 0, 15, 1.6, 2.8);
  paint(c, '#111');
  head(c, red, st);
  // teia no capuz
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
  // olhos grandes com moldura grossa
  for (const s of [-1, 1]) {
    c.save();
    c.translate(s * 9.5, -11);
    c.rotate(s * 0.5);
    c.beginPath();
    c.moveTo(0, -9.5);
    c.quadraticCurveTo(s * 9, -6, s * 6.5, 5);
    c.quadraticCurveTo(0, 9, -s * 6, 2);
    c.quadraticCurveTo(-s * 5, -7, 0, -9.5);
    c.closePath();
    paint(c, '#111');
    c.scale(0.72, 0.72);
    c.beginPath();
    c.moveTo(0, -9.5);
    c.quadraticCurveTo(s * 9, -6, s * 6.5, 5);
    c.quadraticCurveTo(0, 9, -s * 6, 2);
    c.quadraticCurveTo(-s * 5, -7, 0, -9.5);
    c.closePath();
    paint(c, '#ffffff');
    c.restore();
  }
  hands(c, red);
}

function venom(c: Ctx) {
  const black = '#16161c';
  const sheen = '#3b4f8a';
  heroBody(c, { suit: black, stroke: sheen, boots: black, wide: 1.1 });
  // aranha branca grande, abraçando o peito
  c.strokeStyle = '#ffffff';
  c.lineWidth = 2.4;
  c.lineCap = 'round';
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(0, 13);
    c.quadraticCurveTo(s * 9, 7, s * 14, 9);
    c.moveTo(0, 18);
    c.quadraticCurveTo(s * 8, 23, s * 11, 30);
    c.stroke();
  }
  ell(c, 0, 15, 3, 5);
  paint(c, '#ffffff');
  head(c, black, sheen);
  ell(c, -9, -22, 8, 3.5, -0.4);
  paint(c, 'rgba(120,150,255,0.28)');
  // olhos brancos pontudos
  for (const s of [-1, 1]) {
    c.save();
    c.translate(s * 10, -14);
    c.rotate(s * 0.55);
    c.beginPath();
    c.moveTo(0, -11);
    c.quadraticCurveTo(s * 10, -4, s * 6, 6);
    c.lineTo(s * 2, 3);
    c.lineTo(-s * 2, 7);
    c.quadraticCurveTo(-s * 7, -4, 0, -11);
    c.closePath();
    paint(c, '#ffffff');
    c.restore();
  }
  // sorrisão de dentes pontudos e língua pra fora
  c.beginPath();
  c.moveTo(-16, -1);
  c.quadraticCurveTo(0, 20, 16, -1);
  c.quadraticCurveTo(0, 5, -16, -1);
  c.closePath();
  paint(c, '#7a1030');
  c.save();
  c.clip();
  c.fillStyle = '#ffffff';
  c.beginPath();
  for (let x = -15; x <= 13; x += 4) {
    c.moveTo(x, 0);
    c.lineTo(x + 2, 5.5);
    c.lineTo(x + 4, 0.5);
  }
  for (let x = -11; x <= 9; x += 4) {
    c.moveTo(x, 14);
    c.lineTo(x + 2, 8.5);
    c.lineTo(x + 4, 13.5);
  }
  c.fill();
  c.restore();
  c.beginPath();
  c.moveTo(1, 9);
  c.quadraticCurveTo(10, 14, 6, 24);
  c.quadraticCurveTo(2, 26, 1, 20);
  c.quadraticCurveTo(-2, 14, 1, 9);
  c.closePath();
  paint(c, '#ff6f9a', '#b03a60', 1);
  hands(c, black, 5, 1.1);
}

function superman(c: Ctx) {
  cape(c, '#d42a2a');
  heroBody(c, { suit: '#2463d6', stroke: '#123a8a', boots: '#d42a2a' });
  boots(c, '#d42a2a', 31);
  trunks(c, '#d42a2a');
  belt(c, '#ffd23a', 23.5);
  // escudo de cinco pontas com o S
  c.beginPath();
  c.moveTo(-10, 9.5);
  c.lineTo(10, 9.5);
  c.lineTo(12.5, 13);
  c.lineTo(0, 23.5);
  c.lineTo(-12.5, 13);
  c.closePath();
  paint(c, '#ffd23a', '#d42a2a', 1.6);
  c.fillStyle = '#d42a2a';
  c.font = 'bold 10px sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('S', 0, 14.5);
  humanHead(c);
  hairCap(c, '#1b1b2a', -15);
  // cachinho na testa
  c.beginPath();
  c.arc(-2, -16, 3, 0.2, Math.PI * 1.6);
  c.lineWidth = 1.8;
  c.strokeStyle = '#1b1b2a';
  c.stroke();
  hands(c, PEACH);
  humanFace(c, { brows: '#1b1b2a' });
}

function batman(c: Ctx) {
  const dark = '#262a36';
  cape(c, dark, true);
  heroBody(c, { suit: '#6e7484', stroke: '#3a3e4a', legs: '#6e7484', boots: dark, arms: '#6e7484' });
  boots(c, dark, 31);
  trunks(c, dark);
  // cinto de utilidades com bolsinhas
  belt(c, '#f2c230', 23.5);
  c.fillStyle = '#c99a1a';
  for (const x of [-8, -3, 2, 7]) c.fillRect(x - 1.6, 22.5, 3.2, 4);
  ell(c, 0, 14, 9, 5);
  paint(c, '#f2c230', '#111', 1);
  batShape(c, 0, 14, 1.05, '#111');
  // luvas com barbatanas
  for (const s of [-1, 1]) {
    for (const k of [0, 1, 2]) {
      c.beginPath();
      c.moveTo(s * (15 + k * 1.6), 17 + k * 2);
      c.lineTo(s * (19.5 + k * 1.6), 14.5 + k * 2);
      c.lineTo(s * (17 + k * 1.6), 19.5 + k * 2);
      c.closePath();
      paint(c, dark);
    }
  }
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
  // olhos em fenda, cara séria
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(s * 3, -10);
    c.lineTo(s * 13, -12);
    c.lineTo(s * 11, -7);
    c.lineTo(s * 4, -7);
    c.closePath();
    paint(c, '#ffffff');
  }
  c.beginPath();
  c.moveTo(-5, 7);
  c.lineTo(5, 7);
  c.lineWidth = 1.8;
  c.strokeStyle = '#7a2a1a';
  c.stroke();
  hands(c, dark);
}

function wonderWoman(c: Ctx) {
  longHair(c, '#1b1b2a');
  heroBody(c, { suit: '#c8202c', stroke: '#7a1018', legs: PEACH, boots: '#c8202c', arms: PEACH });
  boots(c, '#c8202c', 29);
  for (const s of [-1, 1]) {
    c.fillStyle = '#ffffff';
    c.fillRect(s * 6 - 3.5, 31, 7, 1.6);
  }
  // saia azul com estrelas
  onTorso(c, () => {
    c.fillStyle = '#1f3fa8';
    c.fillRect(-16, 24, 32, 12);
    for (const x of [-7, 0, 7]) star(c, x, 28.5, 2, '#ffffff');
  });
  belt(c, '#f2c230', 23.5);
  // águia dourada no peito
  c.beginPath();
  c.moveTo(-10, 11);
  c.lineTo(-5, 17);
  c.lineTo(0, 12);
  c.lineTo(5, 17);
  c.lineTo(10, 11);
  c.lineWidth = 2.6;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.strokeStyle = '#f2c230';
  c.stroke();
  humanHead(c);
  hairCap(c, '#1b1b2a', -13);
  // tiara com estrela vermelha
  c.beginPath();
  c.arc(0, HY, HR - 1, Math.PI * 1.22, Math.PI * 1.78);
  c.lineWidth = 3.5;
  c.strokeStyle = '#f2c230';
  c.stroke();
  star(c, 0, -31, 3.5, '#d42a2a');
  // braceletes prateados
  for (const s of [-1, 1]) {
    ell(c, s * 17.5, 20.5, 4, 2.6, s * 0.6);
    paint(c, '#cfd3e0', OUTLINE, 0.8);
  }
  hands(c, PEACH);
  // laço dourado enrolado no quadril
  c.strokeStyle = '#e8b23a';
  c.lineWidth = 1.6;
  for (const r of [3.2, 4.6]) {
    ell(c, -15, 29, r, r * 0.8);
    c.stroke();
  }
  humanFace(c, { lips: '#c8202c' });
}

function flash(c: Ctx) {
  const red = '#d4212b';
  heroBody(c, { suit: red, stroke: '#7a1018', boots: '#f2c230' });
  boots(c, '#f2c230', 32);
  // cinto em raio
  c.beginPath();
  c.moveTo(-11, 22);
  c.lineTo(-3, 24);
  c.lineTo(0, 22);
  c.lineTo(3, 24);
  c.lineTo(11, 22);
  c.lineWidth = 2.4;
  c.strokeStyle = '#f2c230';
  c.stroke();
  ell(c, 0, 14, 6.5, 6.5);
  paint(c, '#ffffff', '#f2c230', 1.4);
  bolt(c, 0, 14, 0.9, '#f2c230');
  humanHead(c);
  cowl(c, red, 1);
  // asinhas de raio nas orelhas
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
  hands(c, red);
}

function lantern(c: Ctx) {
  const green = '#2fa84f';
  const black = '#1c1c22';
  heroBody(c, { suit: green, stroke: '#0f4a20', legs: black, boots: green, arms: black });
  boots(c, green, 31);
  onTorso(c, () => {
    // ombros pretos
    c.fillStyle = black;
    c.beginPath();
    c.moveTo(-16, 6);
    c.lineTo(16, 6);
    c.lineTo(16, 12);
    c.quadraticCurveTo(0, 19, -16, 12);
    c.closePath();
    c.fill();
  });
  ell(c, 0, 18, 6, 6);
  paint(c, '#ffffff');
  ell(c, 0, 18, 4, 4);
  c.lineWidth = 1.6;
  c.strokeStyle = green;
  c.stroke();
  c.fillStyle = green;
  c.fillRect(-4.5, 15.5, 9, 1.5);
  c.fillRect(-4.5, 19, 9, 1.5);
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
  hands(c, green);
  // anel brilhando
  c.save();
  c.shadowColor = '#7dff9a';
  c.shadowBlur = 8;
  ell(c, 21, 24, 2.4, 2.4);
  paint(c, '#bfffcc', green, 1.2);
  c.restore();
  humanFace(c, { eyes: false });
}

function aquaman(c: Ctx) {
  const blond = '#e0a83a';
  longHair(c, blond);
  heroBody(c, { suit: '#e8892a', stroke: '#9a5410', legs: '#2f8f4a', boots: '#2f8f4a', arms: '#e8892a' });
  onTorso(c, () => {
    c.strokeStyle = 'rgba(160,80,10,0.55)';
    c.lineWidth = 1;
    for (let y = 9; y < 24; y += 4.5) {
      for (let x = -14 + ((y / 4.5) % 2) * 3; x < 15; x += 6) {
        c.beginPath();
        c.arc(x, y, 3, 0, Math.PI);
        c.stroke();
      }
    }
    c.fillStyle = '#2f8f4a';
    c.fillRect(-16, 24, 32, 12);
  });
  belt(c, '#f2c230', 24);
  ell(c, 0, 24, 3.6, 3.2);
  paint(c, '#f2c230', '#9a7414', 0.8);
  // tridente
  limb(c, 24, 40, 24, -26, 2.6, '#f2c230', '#9a7414');
  c.beginPath();
  c.moveTo(17, -30);
  c.quadraticCurveTo(18, -24, 24, -24);
  c.quadraticCurveTo(30, -24, 31, -30);
  c.moveTo(24, -24);
  c.lineTo(24, -40);
  c.lineWidth = 2.4;
  c.strokeStyle = '#f2c230';
  c.lineCap = 'round';
  c.stroke();
  for (const x of [17, 24, 31]) {
    c.beginPath();
    c.moveTo(x - 2.2, x === 24 ? -38 : -28);
    c.lineTo(x, x === 24 ? -44 : -34);
    c.lineTo(x + 2.2, x === 24 ? -38 : -28);
    c.closePath();
    paint(c, '#f2c230');
  }
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
  hands(c, PEACH);
  humanFace(c, { lips: '#5a2a10' });
}

function ironMan(c: Ctx) {
  const red = '#c21d1d';
  const gold = '#e8b23a';
  heroBody(c, { suit: red, stroke: '#6e0e0e', legs: red, boots: gold, arms: gold });
  boots(c, gold, 30);
  onTorso(c, () => {
    c.fillStyle = gold;
    c.fillRect(-6, 20, 12, 12);
    c.strokeStyle = '#9a7414';
    c.lineWidth = 0.8;
    for (const y of [23, 27]) {
      c.beginPath();
      c.moveTo(-6, y);
      c.lineTo(6, y);
      c.stroke();
    }
  });
  // reator no peito
  c.save();
  c.shadowColor = '#7fd8ff';
  c.shadowBlur = 8;
  ell(c, 0, 14, 4.6, 4.6);
  paint(c, '#bff6ff', '#7fd8ff', 1.6);
  c.restore();
  // capacete vermelho
  ell(c, 0, HY, HR, HR * 0.94);
  paint(c, red, '#6e0e0e', 1.8);
  // máscara dourada: testa estreita, bochechas e queixo largos
  c.beginPath();
  c.moveTo(-9, -26);
  c.lineTo(9, -26);
  c.lineTo(11, -17);
  c.lineTo(17, -12);
  c.lineTo(15, 2);
  c.lineTo(8, 12);
  c.lineTo(-8, 12);
  c.lineTo(-15, 2);
  c.lineTo(-17, -12);
  c.lineTo(-11, -17);
  c.closePath();
  paint(c, gold, '#9a7414', 1.2);
  for (const s of [-1, 1]) {
    c.save();
    c.shadowColor = '#7fd8ff';
    c.shadowBlur = 5;
    c.beginPath();
    c.moveTo(s * 2.5, -11);
    c.lineTo(s * 12, -12.5);
    c.lineTo(s * 11, -8.5);
    c.lineTo(s * 3, -8.5);
    c.closePath();
    paint(c, '#e8fbff');
    c.restore();
  }
  c.fillStyle = '#9a7414';
  c.fillRect(-5, 5, 10, 1.4);
  hands(c, red);
  // propulsores nas mãos
  c.save();
  c.shadowColor = '#7fd8ff';
  c.shadowBlur = 6;
  for (const s of [-1, 1]) {
    ell(c, s * 19.5, 26, 1.8, 1.8);
    paint(c, '#e8fbff');
  }
  c.restore();
}

function captain(c: Ctx) {
  const blue = '#2a4fb8';
  heroBody(c, { suit: blue, stroke: '#14306e', boots: '#c8202c' });
  boots(c, '#c8202c', 30);
  onTorso(c, () => {
    for (let i = 0; i < 4; i++) {
      c.fillStyle = i % 2 ? '#ffffff' : '#c8202c';
      c.fillRect(-7, 19 + i * 3, 14, 3);
    }
  });
  belt(c, '#7a4a22', 26);
  star(c, 0, 13.5, 5.5, '#ffffff');
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
  hands(c, '#c8202c');
  humanFace(c, { brows: '#5a3a22' });
  // escudo redondo na mão
  const sx = 21;
  const sy = 26;
  for (const [r, col] of [
    [13, '#c8202c'],
    [10, '#f2f2f2'],
    [7, '#c8202c'],
    [4.6, '#2a4fb8'],
  ] as const) {
    ell(c, sx, sy, r, r);
    paint(c, col, r === 13 ? '#7a1018' : undefined, 1.2);
  }
  star(c, sx, sy + 0.3, 4, '#ffffff');
}

function hulk(c: Ctx) {
  const green = '#6cbf3d';
  const st = '#2f6a14';
  const w = 1.25;
  heroBody(c, { suit: green, stroke: st, legs: '#7a3fb0', boots: green, wide: w });
  // calça roxa rasgada
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(s * 2, 32);
    for (let k = 0; k <= 3; k++) c.lineTo(s * (2 + k * 3), k % 2 ? 36 : 33);
    c.lineTo(s * 12, 26);
    c.lineTo(s * 2, 26);
    c.closePath();
    paint(c, '#7a3fb0');
  }
  onTorso(
    c,
    () => {
      c.fillStyle = '#7a3fb0';
      c.fillRect(-18, 25, 36, 10);
      // músculos
      c.strokeStyle = 'rgba(30,80,10,0.5)';
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(0, 9);
      c.lineTo(0, 24);
      c.moveTo(-11, 15);
      c.quadraticCurveTo(-5, 18, 0, 15);
      c.quadraticCurveTo(5, 18, 11, 15);
      c.moveTo(-4, 19);
      c.lineTo(4, 19);
      c.moveTo(-4, 22);
      c.lineTo(4, 22);
      c.stroke();
    },
    w,
  );
  humanHead(c, green);
  hairCap(c, '#1b1b2a', -15);
  for (const d of [-150, -120, -60, -30]) spike(c, d, 6, 4, '#1b1b2a', undefined, HR * 0.85);
  hands(c, green, 6.5, w);
  humanFace(c, { angry: true, lips: '#1f4a0a' });
}

function thor(c: Ctx) {
  const blond = '#e9c04a';
  cape(c, '#c8202c');
  longHair(c, blond);
  heroBody(c, { suit: '#3b4150', stroke: '#1c2028', boots: '#3b4150', arms: PEACH });
  boots(c, '#2a2e38', 30);
  for (const [x, y] of [
    [-5.5, 12],
    [5.5, 12],
    [-5.5, 18.5],
    [5.5, 18.5],
  ]) {
    ell(c, x, y, 2.8, 2.8);
    paint(c, '#cfd3e0', '#6a7080', 0.8);
  }
  belt(c, '#8a5a2b', 25);
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
  hands(c, PEACH);
  // Mjolnir: cabo de couro com alça e cabeça retangular
  limb(c, 20, 27, 24, 8, 3.2, '#7a4a22', '#3d2410');
  for (const y of [12, 16, 20, 24]) {
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.fillRect(20 + (27 - y) * 0.2, y, 3.6, 1);
  }
  c.beginPath();
  c.arc(19, 31, 2.6, 0, Math.PI * 2);
  c.lineWidth = 1.2;
  c.strokeStyle = '#3d2410';
  c.stroke();
  c.save();
  c.translate(25, 3);
  c.rotate(0.2);
  c.beginPath();
  c.rect(-9, -6, 18, 11);
  const g = c.createLinearGradient(0, -6, 0, 5);
  g.addColorStop(0, '#e2e6ee');
  g.addColorStop(1, '#8a92a4');
  paint(c, '#9aa3b5', '#4a5060', 1.2);
  c.fillStyle = g;
  c.fillRect(-8.2, -5.2, 16.4, 9.4);
  c.strokeStyle = 'rgba(60,66,80,0.6)';
  c.lineWidth = 0.8;
  c.strokeRect(-6, -3.5, 12, 6);
  c.restore();
  humanFace(c, { brows: '#b8902a' });
}

function widow(c: Ctx) {
  const red = '#c8382a';
  // cabelo ruivo ondulado
  c.beginPath();
  c.moveTo(-HR - 4, -8);
  for (let i = 0; i <= 4; i++) c.quadraticCurveTo(-HR - 7 + (i % 2) * 4, -4 + i * 6, -HR - 3 + i * 0.5, i * 6);
  c.lineTo(HR + 3, 24);
  for (let i = 4; i >= 0; i--) c.quadraticCurveTo(HR + 7 - (i % 2) * 4, -4 + i * 6, HR + 4, i * 6 - 6);
  c.arc(0, HY, HR + 4, 0, Math.PI, true);
  c.closePath();
  paint(c, red, OUTLINE);
  heroBody(c, { suit: '#1c1c24', stroke: '#000', boots: '#1c1c24' });
  // cinto prateado com ampulheta vermelha
  belt(c, '#9aa0ae', 24);
  c.beginPath();
  c.moveTo(-3.4, 21);
  c.lineTo(3.4, 21);
  c.lineTo(-3.4, 27);
  c.lineTo(3.4, 27);
  c.closePath();
  paint(c, '#e0242f');
  // zíper
  c.strokeStyle = '#5a5a66';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(0, 8);
  c.lineTo(0, 20);
  c.stroke();
  humanHead(c);
  hairCap(c, red, -13);
  // braceletes dourados (ferrão da viúva)
  for (const s of [-1, 1]) {
    ell(c, s * 17.5, 20.5, 4, 2.6, s * 0.6);
    paint(c, '#e8b23a', '#9a7414', 0.8);
  }
  hands(c, '#1c1c24');
  humanFace(c, { lips: '#c8202c', brows: '#9a2a1a' });
}

function panther(c: Ctx) {
  const black = '#1c1c24';
  const line = '#a99cff';
  heroBody(c, { suit: black, stroke: '#000', boots: black });
  // colar de garras prateado
  for (let i = -3; i <= 3; i++) {
    c.beginPath();
    c.moveTo(i * 3.5 - 1.5, 8 + Math.abs(i) * -0.6);
    c.lineTo(i * 3.5 + 1.5, 8 + Math.abs(i) * -0.6);
    c.lineTo(i * 3.5, 12.5 - Math.abs(i) * 0.6);
    c.closePath();
    paint(c, '#cfd3e0');
  }
  // linhas de vibranium
  onTorso(c, () => {
    c.save();
    c.shadowColor = line;
    c.shadowBlur = 4;
    c.strokeStyle = line;
    c.lineWidth = 1;
    c.beginPath();
    for (const s of [-1, 1]) {
      c.moveTo(s * 4, 14);
      c.lineTo(s * 9, 22);
      c.lineTo(s * 4, 30);
      c.moveTo(s * 9, 22);
      c.lineTo(s * 14, 22);
    }
    c.stroke();
    c.restore();
  });
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
  hands(c, black);
  // garras nas pontas dos dedos
  for (const s of [-1, 1]) {
    for (const k of [-1, 0, 1]) {
      c.beginPath();
      c.moveTo(s * 19.5 + k * 2.2, 29);
      c.lineTo(s * 19.5 + k * 2.2 + 0.6, 32.5);
      c.lineWidth = 1;
      c.strokeStyle = '#cfd3e0';
      c.stroke();
    }
  }
}

const DRAW: Record<CharId, (c: Ctx) => void> = {
  sonic,
  tails,
  knuckles,
  amy,
  shadow,
  silver,
  cream,
  leo: (c) => turtle(c, '#2f6fe0', 'L', leoKatanas),
  raph: (c) => turtle(c, '#e0262c', 'R', undefined, raphSais),
  donnie: (c) => turtle(c, '#8a3fd6', 'D', donnieBo),
  mikey: (c) => turtle(c, '#f28a1e', 'M', undefined, mikeyChucks),
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
