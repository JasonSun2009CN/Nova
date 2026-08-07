export const ENGINE_HUM_BASE_FREQ = 48;
export const ENGINE_HUM_MOD_FREQ = 6.5;
export const PULSAR_PERIOD_S = 1.2;

export type NoiseBufferFactory = {
  sampleRate: number;
  createBuffer: (channels: number, length: number, sampleRate: number) => AudioBuffer;
};

export function createWhiteNoiseBuffer(
  factory: NoiseBufferFactory,
  durationSeconds: number,
): AudioBuffer {
  const sampleRate = factory.sampleRate;
  const length = Math.max(1, Math.round(sampleRate * durationSeconds));
  const buffer = factory.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export function pinkFilterGain(freq: number): number {
  return 1 / Math.sqrt(1 + (freq / 400) * (freq / 400));
}

export type PulseShape = {
  periodS: number;
  attackS: number;
  decayS: number;
  amplitude: number;
};

export const PULSAR_SHAPE: PulseShape = {
  periodS: PULSAR_PERIOD_S,
  attackS: 0.02,
  decayS: 0.28,
  amplitude: 0.9,
};
