// Níveis e ranking local (fica salvo só neste aparelho).

export type Level = 'facil' | 'medio' | 'dificil';

export interface LevelCfg {
  label: string;
  emoji: string;
  fichas: number;
  /** chance de segurar: [bem no centro, meio de lado, na beirada] */
  chance: [number, number, number];
  /** chance de escorregar no caminho mesmo segurando bem */
  slip: number;
  /** erros seguidos até a próxima ser garantida */
  pity: number;
  /** velocidade da garra (mais rápida = mais difícil mirar) */
  speed: number;
}

export const LEVEL_IDS: Level[] = ['facil', 'medio', 'dificil'];

export const LEVELS: Record<Level, LevelCfg> = {
  facil: { label: 'Fácil', emoji: '🟢', fichas: 10, chance: [0.95, 0.85, 0.6], slip: 0.05, pity: 2, speed: 150 },
  medio: { label: 'Médio', emoji: '🟡', fichas: 10, chance: [0.85, 0.6, 0.3], slip: 0.15, pity: 4, speed: 175 },
  dificil: { label: 'Difícil', emoji: '🔴', fichas: 10, chance: [0.7, 0.4, 0.15], slip: 0.25, pity: Infinity, speed: 200 },
};

export interface Entry {
  name: string;
  score: number;
  date: number;
}

const RANK_KEY = 'maquina-de-urso:rank';
const NAME_KEY = 'maquina-de-urso:name';
const LEVEL_KEY = 'maquina-de-urso:level';
const TOP = 10;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // sem storage (aba anônima etc.): o jogo segue, só não salva
  }
}

export function loadRank(): Record<Level, Entry[]> {
  const r = read<Partial<Record<Level, Entry[]>>>(RANK_KEY, {});
  return { facil: r.facil ?? [], medio: r.medio ?? [], dificil: r.dificil ?? [] };
}

/** Salva a partida e devolve a posição (1 = primeiro) ou 0 se ficou fora do top. */
export function addEntry(level: Level, entry: Entry): number {
  const rank = loadRank();
  const list = [...rank[level], entry]
    .sort((a, b) => b.score - a.score || a.date - b.date)
    .slice(0, TOP);
  rank[level] = list;
  write(RANK_KEY, rank);
  return list.indexOf(entry) + 1;
}

export const loadName = () => read<string>(NAME_KEY, '');
export const saveName = (n: string) => write(NAME_KEY, n);

export function loadLevel(): Level {
  const l = read<string>(LEVEL_KEY, 'facil');
  return (LEVEL_IDS as string[]).includes(l) ? (l as Level) : 'facil';
}
export const saveLevel = (l: Level) => write(LEVEL_KEY, l);
