import type { CharId } from './characters';

export type Bg = 'hill' | 'city' | 'liga' | 'avengers';

/** Barra de neon que vai e volta na horizontal. */
export interface Obstacle {
  y: number;
  w: number;
  /** px por segundo */
  speed: number;
  /** 0..1, onde começa o vai-e-volta */
  phase: number;
}

export interface Stage {
  name: string;
  sign: string;
  emoji: string;
  chars: CharId[];
  /** pelúcias numa partida pra passar de fase */
  goal: number;
  obstacles: Obstacle[];
  bg: Bg;
  /** cor base do neon */
  hue: number;
}

export const STAGES: Stage[] = [
  {
    name: 'Green Hill',
    sign: 'GREEN HILL',
    emoji: '💍',
    chars: ['sonic', 'tails', 'knuckles', 'amy', 'shadow', 'silver', 'cream'],
    goal: 3,
    obstacles: [],
    bg: 'hill',
    hue: 205,
  },
  {
    name: 'Cidade Noturna',
    sign: 'CIDADE NOTURNA',
    emoji: '🕸️',
    chars: ['leo', 'raph', 'donnie', 'mikey', 'spidey', 'venom'],
    goal: 3,
    obstacles: [{ y: 262, w: 86, speed: 70, phase: 0 }],
    bg: 'city',
    hue: 275,
  },
  {
    name: 'Liga da Justiça',
    sign: 'LIGA DA JUSTIÇA',
    emoji: '🦇',
    chars: ['superman', 'batman', 'wonder', 'flash', 'lantern', 'aquaman'],
    goal: 4,
    obstacles: [
      { y: 228, w: 84, speed: 90, phase: 0 },
      { y: 282, w: 64, speed: 125, phase: 0.55 },
    ],
    bg: 'liga',
    hue: 42,
  },
  {
    name: 'Vingadores',
    sign: 'VINGADORES',
    emoji: '🛡️',
    chars: ['ironman', 'captain', 'hulk', 'thor', 'widow', 'panther'],
    goal: 4,
    obstacles: [
      { y: 222, w: 92, speed: 115, phase: 0 },
      { y: 278, w: 70, speed: 160, phase: 0.35 },
    ],
    bg: 'avengers',
    hue: 355,
  },
];

const KEY = 'maquina-de-urso:unlocked';
const STAGE_KEY = 'maquina-de-urso:stage';

function read(key: string): number {
  try {
    return Number(localStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
}

function write(key: string, n: number) {
  try {
    localStorage.setItem(key, String(n));
  } catch {
    // sem storage: o progresso vale só nesta sessão
  }
}

/** Índice da última fase liberada. */
export const loadUnlocked = () => Math.min(read(KEY), STAGES.length - 1);
export const saveUnlocked = (n: number) => write(KEY, n);
export const loadStage = () => Math.min(read(STAGE_KEY), loadUnlocked());
export const saveStage = (n: number) => write(STAGE_KEY, n);
