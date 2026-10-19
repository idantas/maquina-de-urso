// Todos os sons são sintetizados com WebAudio — nenhum arquivo de áudio.

type Opts = {
  type?: OscillatorType;
  vol?: number;
  at?: number;
  slide?: number;
  dest?: AudioNode;
};

const STEP = 60 / 150 / 4; // semicolcheia a 150 bpm

// loop original estilo chiptune (4 compassos: C, Am, F, G)
const MELODY: (number | 0)[][] = [
  [72, 0, 76, 0, 79, 0, 76, 0, 84, 0, 79, 0, 76, 0, 74, 0],
  [72, 0, 76, 0, 81, 0, 79, 0, 76, 0, 72, 0, 74, 0, 76, 0],
  [77, 0, 81, 0, 84, 0, 81, 0, 77, 0, 76, 0, 74, 0, 72, 0],
  [74, 0, 79, 0, 83, 0, 86, 0, 83, 0, 79, 0, 77, 0, 74, 0],
];
const BASS = [36, 45, 41, 43];
const MUSIC_VOL = 0.32;

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

export class Sfx {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private fx!: GainNode;
  private mus!: GainNode;
  private noiseBuf!: AudioBuffer;
  private humOsc!: OscillatorNode;
  private humGain!: GainNode;
  private humFreq = 0;
  private musicTimer: number | undefined;
  private nextNote = 0;
  private step = 0;
  muted = false;

  unlock() {
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(ctx.destination);
      this.fx = ctx.createGain();
      this.fx.connect(this.master);
      this.mus = ctx.createGain();
      this.mus.gain.value = MUSIC_VOL;
      this.mus.connect(this.master);

      const len = ctx.sampleRate;
      this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

      // zumbido do motor da garra
      this.humOsc = ctx.createOscillator();
      this.humOsc.type = 'sawtooth';
      this.humOsc.frequency.value = 80;
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 500;
      this.humGain = ctx.createGain();
      this.humGain.gain.value = 0;
      this.humOsc.connect(f).connect(this.humGain).connect(this.fx);
      this.humOsc.start();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  suspend() {
    if (this.ctx?.state === 'running') void this.ctx.suspend();
  }

  private osc(freq: number, t0: number, dur: number, o: Opts) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = o.type ?? 'square';
    osc.frequency.setValueAtTime(freq, t0);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.vol ?? 0.15, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(o.dest ?? this.fx);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  tone(freq: number, dur: number, o: Opts = {}) {
    if (!this.ctx) return;
    this.osc(freq, this.ctx.currentTime + (o.at ?? 0), dur, o);
  }

  private noiseAt(t0: number, dur: number, vol: number, freq: number, type: BiquadFilterType, dest?: AudioNode) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(dest ?? this.fx);
    src.start(t0, Math.random() * 0.5);
    src.stop(t0 + dur + 0.02);
  }

  noise(dur: number, vol = 0.2, freq = 1200, type: BiquadFilterType = 'lowpass', at = 0) {
    if (!this.ctx) return;
    this.noiseAt(this.ctx.currentTime + at, dur, vol, freq, type);
  }

  /** Motor: 0 desliga, >0 liga naquela frequência. */
  hum(freq: number) {
    if (!this.ctx || freq === this.humFreq) return;
    this.humFreq = freq;
    const t = this.ctx.currentTime;
    if (freq > 0) {
      this.humOsc.frequency.setTargetAtTime(freq, t, 0.05);
      this.humGain.gain.setTargetAtTime(0.07, t, 0.03);
    } else {
      this.humGain.gain.setTargetAtTime(0, t, 0.05);
    }
  }

  click() {
    this.tone(880, 0.05, { vol: 0.08 });
  }

  grab() {
    this.noise(0.12, 0.3, 700);
    this.tone(170, 0.18, { vol: 0.12, slide: 70 });
  }

  open() {
    this.tone(300, 0.1, { vol: 0.06, slide: 520 });
  }

  /** "Aaaah..." quando a pelúcia escapa */
  drop() {
    this.tone(520, 0.5, { type: 'triangle', vol: 0.2, slide: 140 });
    this.tone(390, 0.55, { type: 'triangle', vol: 0.1, slide: 110, at: 0.06 });
  }

  ring(at = 0) {
    this.tone(1319, 0.09, { vol: 0.06, at });
    this.tone(1976, 0.35, { vol: 0.06, at: at + 0.075 });
    this.tone(2637, 0.3, { type: 'sine', vol: 0.05, at: at + 0.075 });
  }

  /** Zumbido de neon falhando */
  buzz() {
    this.tone(110, 0.16, { type: 'sawtooth', vol: 0.05 });
    this.tone(220, 0.12, { type: 'sawtooth', vol: 0.025 });
    this.noise(0.08, 0.04, 3000, 'highpass');
  }

  /** Neon acendendo forte */
  zap() {
    this.tone(200, 0.35, { type: 'sawtooth', vol: 0.06, slide: 1600 });
    this.noise(0.3, 0.06, 2500, 'bandpass');
  }

  win() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.mus.gain.setTargetAtTime(0.05, t, 0.05);
    this.mus.gain.setTargetAtTime(MUSIC_VOL, t + 3.2, 0.4);
    this.zap();
    const notes = [523, 659, 784, 1047, 784, 1047, 1319];
    const times = [0, 0.1, 0.2, 0.3, 0.45, 0.55, 0.7];
    notes.forEach((n, i) => this.tone(n, i === notes.length - 1 ? 0.8 : 0.12, { vol: 0.12, at: times[i] }));
    for (const n of [523, 659, 784]) this.tone(n, 0.9, { type: 'triangle', vol: 0.12, at: 0.7 });
    for (const a of [1.0, 1.25, 1.5, 1.75]) this.ring(a);
  }

  /** Garra batendo na barra de neon */
  bonk() {
    this.tone(180, 0.22, { vol: 0.16, slide: 60 });
    this.noise(0.15, 0.25, 900, 'bandpass');
  }

  /** Fase nova liberada */
  levelUp() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.mus.gain.setTargetAtTime(0.05, t, 0.05);
    this.mus.gain.setTargetAtTime(MUSIC_VOL, t + 3, 0.4);
    const notes = [392, 523, 659, 784, 659, 784, 1047, 1319, 1568];
    notes.forEach((n, i) => this.tone(n, i === notes.length - 1 ? 0.9 : 0.1, { vol: 0.11, at: i * 0.09 }));
    for (const n of [523, 784, 1047]) this.tone(n, 1.1, { type: 'triangle', vol: 0.1, at: 0.8 });
    for (const a of [0.9, 1.1, 1.3]) this.ring(a);
  }

  refill() {
    [392, 523, 659].forEach((n, i) => this.tone(n, 0.12, { type: 'triangle', vol: 0.1, at: i * 0.08 }));
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.02);
  }

  startMusic() {
    if (!this.ctx || this.musicTimer !== undefined) return;
    this.nextNote = this.ctx.currentTime + 0.1;
    this.step = 0;
    this.musicTimer = window.setInterval(() => this.schedule(), 25);
  }

  private schedule() {
    const ctx = this.ctx!;
    while (this.nextNote < ctx.currentTime + 0.15) {
      this.playStep(this.step, this.nextNote);
      this.nextNote += STEP;
      this.step = (this.step + 1) % 64;
    }
  }

  private playStep(s: number, t: number) {
    const bar = Math.floor(s / 16);
    const i = s % 16;
    const m = MELODY[bar][i];
    if (m) this.osc(midi(m), t, 0.11, { type: 'square', vol: 0.045, dest: this.mus });
    if (i % 2 === 0) {
      const b = BASS[bar] + (i % 4 === 2 ? 12 : 0);
      this.osc(midi(b), t, 0.14, { type: 'triangle', vol: 0.2, dest: this.mus });
    }
    if (i % 4 === 2) this.noiseAt(t, 0.03, 0.05, 7000, 'highpass', this.mus);
  }
}
