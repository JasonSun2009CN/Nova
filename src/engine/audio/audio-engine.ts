import {
  ENGINE_HUM_BASE_FREQ,
  ENGINE_HUM_MOD_FREQ,
  PULSAR_SHAPE,
  createWhiteNoiseBuffer,
} from '@/engine/audio/synthesis';

export type AmbientSoundType = 'none' | 'cmb' | 'pulsar';
export type EventSoundType = 'launch' | 'arrive' | 'brake';

export type AudioVolumes = {
  sound: number;
  music: number;
};

type WritableNode = {
  disconnect: () => void;
};

type ParamLike = {
  value: number;
  setValueAtTime: (v: number, t: number) => void;
  linearRampToValueAtTime: (v: number, t: number) => void;
  exponentialRampToValueAtTime: (v: number, t: number) => void;
  setTargetAtTime: (v: number, t: number, tc: number) => void;
};

type OscillatorLike = WritableNode & {
  type: OscillatorType;
  frequency: ParamLike;
  connect: (dest: unknown) => void;
  start: (when?: number) => void;
  stop: (when?: number) => void;
};

type GainLike = WritableNode & {
  gain: ParamLike;
  connect: (dest: unknown) => void;
};

type BufferSourceLike = WritableNode & {
  buffer: AudioBuffer | null;
  loop: boolean;
  connect: (dest: unknown) => void;
  start: (when?: number) => void;
  stop: (when?: number) => void;
};

type FilterLike = WritableNode & {
  type: BiquadFilterType;
  frequency: { value: number };
  connect: (dest: unknown) => void;
};

export type AudioContextLike = {
  currentTime: number;
  sampleRate: number;
  destination: unknown;
  createOscillator: () => OscillatorLike;
  createGain: () => GainLike;
  createBufferSource: () => BufferSourceLike;
  createBiquadFilter: () => FilterLike;
  createBuffer: (channels: number, length: number, sampleRate: number) => AudioBuffer;
  resume: () => Promise<void>;
};

const DUCK_SECONDS = 0.25;
const STOP_DELAY_MS = DUCK_SECONDS * 1200;

export class AudioEngine {
  private ctx: AudioContextLike | null = null;
  private humNodes: { osc: OscillatorLike; sub: OscillatorLike; gain: GainLike } | null = null;
  private ambientNodes: { source: BufferSourceLike; gain: GainLike } | null = null;
  private pulsarTimer: number | null = null;
  private humEnabled = false;
  private ambientType: AmbientSoundType = 'none';
  private volumes: AudioVolumes = { sound: 0.6, music: 0.4 };

  get started(): boolean {
    return this.ctx != null;
  }

  async ensureStarted(ctxFactory: () => AudioContextLike): Promise<void> {
    if (this.ctx != null) return;
    const ctx = ctxFactory();
    await ctx.resume();
    this.ctx = ctx;
    if (this.humEnabled) this.startHum();
    if (this.ambientType !== 'none') this.startAmbient();
  }

  setVolumes(volumes: AudioVolumes): void {
    this.volumes = volumes;
    this.updateAmbientGains();
  }

  setHumEnabled(enabled: boolean): void {
    this.humEnabled = enabled;
    if (this.ctx == null) return;
    if (enabled) {
      this.startHum();
    } else {
      this.stopHum();
    }
  }

  setAmbient(type: AmbientSoundType): void {
    if (this.ambientType === type) return;
    this.ambientType = type;
    if (this.ctx == null) return;
    this.stopAmbient();
    if (type !== 'none') this.startAmbient();
  }

  playEvent(type: EventSoundType): void {
    const ctx = this.ctx;
    if (ctx == null) return;
    const volume = this.volumes.sound;
    if (volume <= 0) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const freq = EVENT_FREQUENCIES[type];
    const dur = EVENT_DURATIONS[type];
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  dispose(): void {
    this.stopHum();
    this.stopAmbient();
    this.ctx = null;
  }

  private startHum(): void {
    const ctx = this.ctx;
    if (ctx == null || this.humNodes != null) return;
    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const gain = ctx.createGain();
    const modGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = ENGINE_HUM_BASE_FREQ;
    sub.type = 'sine';
    sub.frequency.value = ENGINE_HUM_MOD_FREQ;
    modGain.gain.value = ENGINE_HUM_BASE_FREQ * 0.18;
    sub.connect(modGain);
    modGain.connect(osc.frequency as unknown as { value: number });
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.setTargetAtTime(this.volumes.music, ctx.currentTime, DUCK_SECONDS);
    osc.start();
    sub.start();
    this.humNodes = { osc, sub, gain };
  }

  private stopHum(): void {
    const ctx = this.ctx;
    if (this.humNodes == null) return;
    const { osc, sub, gain } = this.humNodes;
    if (ctx != null) {
      gain.gain.setTargetAtTime(0, ctx.currentTime, DUCK_SECONDS);
    }
    this.humNodes = null;
    window.setTimeout(() => {
      osc.stop();
      sub.stop();
      osc.disconnect();
      sub.disconnect();
      gain.disconnect();
    }, STOP_DELAY_MS);
  }

  private startAmbient(): void {
    const ctx = this.ctx;
    if (ctx == null || this.ambientNodes != null) return;
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    if (this.ambientType === 'cmb') {
      source.buffer = createWhiteNoiseBuffer(ctx, 2);
      source.loop = true;
      filter.type = 'lowpass';
      filter.frequency.value = 900;
    } else {
      source.buffer = createWhiteNoiseBuffer(ctx, PULSAR_SHAPE.periodS);
      source.loop = true;
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      this.schedulePulsarGating(gain, ctx, ctx.currentTime);
    }
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.setTargetAtTime(this.volumes.music, ctx.currentTime, DUCK_SECONDS);
    source.start();
    this.ambientNodes = { source, gain };
  }

  private stopAmbient(): void {
    const ctx = this.ctx;
    if (this.pulsarTimer != null) {
      window.clearTimeout(this.pulsarTimer);
      this.pulsarTimer = null;
    }
    if (this.ambientNodes == null) return;
    const { source, gain } = this.ambientNodes;
    if (ctx != null) {
      gain.gain.setTargetAtTime(0, ctx.currentTime, DUCK_SECONDS);
    }
    this.ambientNodes = null;
    window.setTimeout(() => {
      source.stop();
      source.disconnect();
      gain.disconnect();
    }, STOP_DELAY_MS);
  }

  private schedulePulsarGating(gain: GainLike, ctx: AudioContextLike, startTime: number): void {
    if (this.pulsarTimer != null) return;
    const t = Math.max(ctx.currentTime, startTime);
    const amp = PULSAR_SHAPE.amplitude * this.volumes.music;
    for (let i = 0; i < 16; i++) {
      const on = t + i * PULSAR_SHAPE.periodS;
      gain.gain.setValueAtTime(0.0001, on);
      gain.gain.linearRampToValueAtTime(amp, on + PULSAR_SHAPE.attackS);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        on + PULSAR_SHAPE.attackS + PULSAR_SHAPE.decayS,
      );
    }
    this.pulsarTimer = window.setTimeout(
      () => {
        this.pulsarTimer = null;
        this.schedulePulsarGating(gain, ctx, t + 16 * PULSAR_SHAPE.periodS);
      },
      16 * PULSAR_SHAPE.periodS * 1000,
    );
  }

  private updateAmbientGains(): void {
    const t = this.ctx?.currentTime ?? 0;
    if (this.humNodes != null) {
      this.humNodes.gain.gain.setTargetAtTime(this.volumes.music, t, DUCK_SECONDS);
    }
    if (this.ambientNodes != null && this.ambientType !== 'none') {
      this.ambientNodes.gain.gain.setTargetAtTime(this.volumes.music, t, DUCK_SECONDS);
    }
  }
}

const EVENT_FREQUENCIES: Record<EventSoundType, number> = {
  launch: 220,
  arrive: 880,
  brake: 160,
};

const EVENT_DURATIONS: Record<EventSoundType, number> = {
  launch: 0.7,
  arrive: 0.5,
  brake: 0.9,
};

export function createAudioEngine(): AudioEngine {
  return new AudioEngine();
}
