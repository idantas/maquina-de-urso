import type { Bg } from './stages';

type Ctx = CanvasRenderingContext2D;

/** Aleatório com semente: o cenário sai igual em todo quadro. */
function seeded(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function sky(c: Ctx, w: number, h: number, stops: string[]) {
  const g = c.createLinearGradient(0, 0, 0, h);
  stops.forEach((col, i) => g.addColorStop(i / (stops.length - 1), col));
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
}

function skyline(c: Ctx, w: number, h: number, base: number, color: string, windows: string, seed: number) {
  const r = seeded(seed);
  let x = -10;
  while (x < w) {
    const bw = 24 + r() * 34;
    const bh = h * (0.18 + r() * 0.32);
    c.fillStyle = color;
    c.fillRect(x, base - bh, bw, bh + h);
    c.fillStyle = windows;
    for (let wy = base - bh + 8; wy < base - 6; wy += 11) {
      for (let wx = x + 5; wx < x + bw - 6; wx += 8) {
        if (r() < 0.35) c.fillRect(wx, wy, 3.5, 5);
      }
    }
    x += bw + 2;
  }
}

function stars(c: Ctx, w: number, h: number, n: number, t: number, seed: number) {
  const r = seeded(seed);
  for (let i = 0; i < n; i++) {
    const x = r() * w;
    const y = r() * h;
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * (0.6 + r() * 2) + i));
    c.fillStyle = `rgba(255,255,255,${tw})`;
    c.fillRect(x, y, 1.6, 1.6);
  }
}

function hill(c: Ctx, w: number, h: number, t: number) {
  sky(c, w, h, ['#1d5fc4', '#4aa3f0', '#9bd6ff']);
  // nuvens passando
  c.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 3; i++) {
    const x = ((t * (8 + i * 4) + i * 130) % (w + 120)) - 60;
    const y = 40 + i * 38;
    for (const [dx, dy, r] of [
      [0, 0, 14],
      [16, -6, 17],
      [34, 0, 13],
    ]) {
      c.beginPath();
      c.arc(x + dx, y + dy, r, 0, Math.PI * 2);
      c.fill();
    }
  }
  // morros com faixas xadrez
  const hills: [number, number, number, string][] = [
    [w * 0.2, h * 0.78, w * 0.45, '#2f9a3e'],
    [w * 0.85, h * 0.74, w * 0.5, '#36ad47'],
  ];
  for (const [cx, cy, r, col] of hills) {
    c.save();
    c.beginPath();
    c.ellipse(cx, cy, r, r * 0.55, 0, 0, Math.PI * 2);
    c.fillStyle = col;
    c.fill();
    c.clip();
    for (let y = cy + 8; y < cy + r; y += 10) {
      for (let x = cx - r; x < cx + r; x += 10) {
        if ((Math.floor(x / 10) + Math.floor(y / 10)) % 2) {
          c.fillStyle = '#a8622a';
          c.fillRect(x, y, 10, 10);
        } else {
          c.fillStyle = '#7a4418';
          c.fillRect(x, y, 10, 10);
        }
      }
    }
    c.restore();
  }
  // palmeira
  const px = w * 0.62;
  const py = h * 0.66;
  c.strokeStyle = '#8a5a2b';
  c.lineWidth = 5;
  c.beginPath();
  c.moveTo(px, py);
  c.quadraticCurveTo(px + 6, py - 40, px - 4, py - 80);
  c.stroke();
  c.fillStyle = '#2f9a3e';
  for (const a of [-2.6, -2, -1.2, -0.5, 0.1]) {
    c.beginPath();
    c.ellipse(px - 4 + Math.cos(a) * 16, py - 80 + Math.sin(a) * 9, 18, 5, a, 0, Math.PI * 2);
    c.fill();
  }
}

function city(c: Ctx, w: number, h: number, t: number) {
  sky(c, w, h, ['#120a2e', '#2a1550', '#3a1d5e']);
  stars(c, w, h * 0.5, 40, t, 7);
  c.save();
  c.shadowColor = '#fff6d0';
  c.shadowBlur = 24;
  c.fillStyle = '#fff6d0';
  c.beginPath();
  c.arc(w * 0.76, h * 0.16, 18, 0, Math.PI * 2);
  c.fill();
  c.restore();
  skyline(c, w, h, h * 0.92, '#1a0f33', 'rgba(255,214,120,0.45)', 3);
  skyline(c, w, h, h, '#0b0618', 'rgba(255,214,120,0.7)', 11);
  // teia no canto
  c.strokeStyle = 'rgba(255,255,255,0.22)';
  c.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const a = (i / 5) * (Math.PI / 2);
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(Math.cos(a) * 90, Math.sin(a) * 90);
    c.stroke();
  }
  for (const r of [25, 50, 75]) {
    c.beginPath();
    for (let i = 0; i <= 5; i++) {
      const a = (i / 5) * (Math.PI / 2);
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) c.moveTo(x, y);
      else c.quadraticCurveTo(Math.cos(a - 0.16) * r * 0.85, Math.sin(a - 0.16) * r * 0.85, x, y);
    }
    c.stroke();
  }
}

function liga(c: Ctx, w: number, h: number, t: number) {
  sky(c, w, h, ['#2a1550', '#7a2e6e', '#ff8a3d']);
  stars(c, w, h * 0.35, 20, t, 5);
  // holofote com morcego
  const cx = w * 0.7;
  const cy = h * 0.2;
  c.save();
  c.globalAlpha = 0.16;
  c.fillStyle = '#fff3b0';
  c.beginPath();
  c.moveTo(w * 0.25, h);
  c.lineTo(cx - 34, cy);
  c.lineTo(cx + 34, cy);
  c.lineTo(w * 0.32, h);
  c.fill();
  c.restore();
  c.save();
  c.shadowColor = '#fff3b0';
  c.shadowBlur = 20;
  c.fillStyle = 'rgba(255,243,176,0.85)';
  c.beginPath();
  c.ellipse(cx, cy, 34, 22, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
  c.fillStyle = '#1a1020';
  c.save();
  c.translate(cx, cy);
  c.scale(2.6, 2.6);
  c.beginPath();
  c.moveTo(-7, -1);
  c.quadraticCurveTo(-4, -3, -1.5, -1.5);
  c.lineTo(-1, -3);
  c.lineTo(0, -2);
  c.lineTo(1, -3);
  c.lineTo(1.5, -1.5);
  c.quadraticCurveTo(4, -3, 7, -1);
  c.quadraticCurveTo(4, 0.5, 3, 2.5);
  c.quadraticCurveTo(0, 1, -3, 2.5);
  c.quadraticCurveTo(-4, 0.5, -7, -1);
  c.fill();
  c.restore();
  skyline(c, w, h, h * 0.94, '#3a1a4a', 'rgba(255,200,120,0.4)', 21);
  skyline(c, w, h, h, '#150a20', 'rgba(255,200,120,0.65)', 33);
}

function avengers(c: Ctx, w: number, h: number, t: number) {
  sky(c, w, h, ['#05051a', '#140b38', '#241050']);
  for (const [x, y, r, col] of [
    [w * 0.25, h * 0.3, 110, 'rgba(140,60,255,0.22)'],
    [w * 0.8, h * 0.55, 90, 'rgba(40,200,255,0.16)'],
  ] as const) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  }
  stars(c, w, h, 70, t, 13);
  // planeta com anel
  const px = w * 0.78;
  const py = h * 0.2;
  c.fillStyle = '#e0563a';
  c.beginPath();
  c.arc(px, py, 22, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(0,0,0,0.25)';
  c.beginPath();
  c.arc(px + 7, py + 5, 20, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = 'rgba(255,220,170,0.7)';
  c.lineWidth = 3;
  c.beginPath();
  c.ellipse(px, py, 38, 9, -0.3, 0, Math.PI * 2);
  c.stroke();
  // estrela cadente
  const k = (t * 0.35) % 1;
  if (k < 0.25) {
    const sx = w * (0.1 + k * 2.4);
    const sy = h * (0.08 + k * 0.6);
    const g = c.createLinearGradient(sx - 40, sy - 12, sx, sy);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(255,255,255,0.9)');
    c.strokeStyle = g;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(sx - 40, sy - 12);
    c.lineTo(sx, sy);
    c.stroke();
  }
  // torre
  c.fillStyle = '#0a0820';
  c.fillRect(w * 0.12, h * 0.55, 26, h);
  c.fillRect(w * 0.12 - 10, h * 0.62, 46, 10);
  c.fillStyle = 'rgba(120,200,255,0.6)';
  for (let y = h * 0.66; y < h; y += 12) c.fillRect(w * 0.12 + 6, y, 14, 3);
  skyline(c, w, h, h, '#0a0820', 'rgba(120,200,255,0.4)', 41);
}

const DRAW: Record<Bg, (c: Ctx, w: number, h: number, t: number) => void> = { hill, city, liga, avengers };

/** Desenha o cenário em (0,0)-(w,h). */
export function drawBg(c: Ctx, bg: Bg, w: number, h: number, t: number) {
  c.save();
  c.beginPath();
  c.rect(0, 0, w, h);
  c.clip();
  DRAW[bg](c, w, h, t);
  c.restore();
}
