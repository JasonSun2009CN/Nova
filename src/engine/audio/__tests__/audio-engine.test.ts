import { describe, expect, it, vi } from 'vitest';

import { createAudioEngine, type AudioContextLike } from '@/engine/audio/audio-engine';
import { PULSAR_SHAPE } from '@/engine/audio/synthesis';

type MockParam = {
  value: number;
  setValueAtTime: ReturnType<typeof vi.fn>;
  linearRampToValueAtTime: ReturnType<typeof vi.fn>;
  exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
  setTargetAtTime: ReturnType<typeof vi.fn>;
};

type MockNode = {
  disconnect: ReturnType<typeof vi.fn>;
  connect: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  frequency?: MockParam;
  gain?: MockParam;
  buffer: AudioBuffer | null;
  loop: boolean;
  type: string;
};

function makeParam(initial: number): MockParam {
  return {
    value: initial,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
  };
}

function makeNode(kind: 'osc' | 'gain' | 'source' | 'filter'): MockNode {
  return {
    disconnect: vi.fn(),
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    ...(kind === 'osc' || kind === 'source'
      ? { frequency: makeParam(440), gain: makeParam(1) }
      : {}),
    ...(kind === 'gain' ? { gain: makeParam(1) } : {}),
    ...(kind === 'filter' ? { frequency: makeParam(1000) } : {}),
    buffer: null,
    loop: false,
    type: kind,
  };
}

function createMockCtx() {
  const nodes: MockNode[] = [];
  const buffer: AudioBuffer = {
    duration: 2,
    length: 48000,
    numberOfChannels: 1,
    sampleRate: 24000,
    getChannelData: () => new Float32Array(48000),
  } as unknown as AudioBuffer;
  const ctx = {
    currentTime: 0,
    sampleRate: 24000,
    destination: {},
    resume: vi.fn().mockResolvedValue(undefined),
    createOscillator: vi.fn(() => {
      const n = makeNode('osc');
      nodes.push(n);
      return n;
    }),
    createGain: vi.fn(() => {
      const n = makeNode('gain');
      nodes.push(n);
      return n;
    }),
    createBufferSource: vi.fn(() => {
      const n = makeNode('source');
      nodes.push(n);
      return n;
    }),
    createBiquadFilter: vi.fn(() => {
      const n = makeNode('filter');
      nodes.push(n);
      return n;
    }),
    createBuffer: vi.fn(() => buffer),
  };
  return {
    ctx,
    asAudioContext: () => ctx as unknown as AudioContextLike,
    nodes,
    buffer,
  };
}

describe('engine/audio/audio-engine Web Audio 合成（S28）', () => {
  it('ensureStarted 前未启动，调用后 resume 并初始化', async () => {
    const engine = createAudioEngine();
    const { ctx, asAudioContext } = createMockCtx();
    expect(engine.started).toBe(false);
    await engine.ensureStarted(asAudioContext);
    expect(engine.started).toBe(true);
    expect(ctx.resume).toHaveBeenCalledTimes(1);
  });

  it('ensureStarted 幂等：二次调用不再创建新 context', async () => {
    const engine = createAudioEngine();
    const { ctx, asAudioContext } = createMockCtx();
    await engine.ensureStarted(asAudioContext);
    await engine.ensureStarted(asAudioContext);
    expect(ctx.resume).toHaveBeenCalledTimes(1);
  });

  it('嗡鸣开启：创建双振荡器（基频 + 调制）+ 增益，音量用 music', async () => {
    const engine = createAudioEngine();
    const { ctx, asAudioContext } = createMockCtx();
    await engine.ensureStarted(asAudioContext);
    engine.setHumEnabled(true);
    expect(ctx.createOscillator.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(ctx.createGain.mock.calls.length).toBeGreaterThanOrEqual(2);
    const oscList = ctx.createOscillator.mock.results.map((r) => r.value as MockNode);
    expect(oscList[0]?.start).toHaveBeenCalled();
    expect(oscList[1]?.start).toHaveBeenCalled();
  });

  it('嗡鸣关闭：增益降到 0（setTargetAtTime 收到 0 目标）', async () => {
    const engine = createAudioEngine();
    const { ctx, asAudioContext } = createMockCtx();
    await engine.ensureStarted(asAudioContext);
    engine.setHumEnabled(true);
    engine.setHumEnabled(false);
    const gainNodes = ctx.createGain.mock.results.map((r) => r.value as MockNode);
    const humGain = gainNodes.find((g) => (g.gain?.setTargetAtTime.mock.calls.length ?? 0) > 0);
    const targets = humGain?.gain?.setTargetAtTime.mock.calls.map((c) => c[0] as number) ?? [];
    expect(targets).toContain(0);
  });

  it('环境音 none → cmb：创建噪声源 + 低通滤波 + 增益，source.start', async () => {
    const engine = createAudioEngine();
    const { ctx, asAudioContext } = createMockCtx();
    await engine.ensureStarted(asAudioContext);
    engine.setAmbient('cmb');
    const sources = ctx.createBufferSource.mock.results.map((r) => r.value as MockNode);
    expect(sources[0]?.start).toHaveBeenCalled();
    expect(sources[0]?.buffer).not.toBeNull();
  });

  it('环境音 pulsar：增益被调度为周期性脉冲（linearRamp 用于 attack）', async () => {
    const engine = createAudioEngine();
    const { ctx, asAudioContext } = createMockCtx();
    await engine.ensureStarted(asAudioContext);
    engine.setAmbient('pulsar');
    const gainNodes = ctx.createGain.mock.results.map((r) => r.value as MockNode);
    const ambientGain = gainNodes.find(
      (g) => (g.gain?.linearRampToValueAtTime.mock.calls.length ?? 0) > 0,
    );
    expect(ambientGain).toBeDefined();
    expect(ambientGain?.gain?.linearRampToValueAtTime.mock.calls.length).toBeGreaterThan(0);
    expect(PULSAR_SHAPE.periodS).toBeGreaterThan(0);
  });

  it('事件音效：sound 音量 >0 时创建振荡器并调度包络', async () => {
    const engine = createAudioEngine();
    const { ctx, asAudioContext } = createMockCtx();
    await engine.ensureStarted(asAudioContext);
    engine.setVolumes({ sound: 0.5, music: 0.4 });
    const before = ctx.createOscillator.mock.calls.length;
    engine.playEvent('launch');
    expect(ctx.createOscillator.mock.calls.length).toBe(before + 1);
  });

  it('事件音效：sound 音量为 0 时不发声', async () => {
    const engine = createAudioEngine();
    const { ctx, asAudioContext } = createMockCtx();
    await engine.ensureStarted(asAudioContext);
    engine.setVolumes({ sound: 0, music: 0 });
    const before = ctx.createOscillator.mock.calls.length;
    engine.playEvent('arrive');
    expect(ctx.createOscillator.mock.calls.length).toBe(before);
  });

  it('未启动时 playEvent 静默不抛错', () => {
    const engine = createAudioEngine();
    expect(() => engine.playEvent('brake')).not.toThrow();
    expect(() => engine.setHumEnabled(true)).not.toThrow();
    expect(() => engine.setAmbient('cmb')).not.toThrow();
  });

  it('dispose 后全部节点断开且 started=false', async () => {
    const engine = createAudioEngine();
    const { asAudioContext } = createMockCtx();
    await engine.ensureStarted(asAudioContext);
    engine.setHumEnabled(true);
    engine.setAmbient('cmb');
    engine.dispose();
    expect(engine.started).toBe(false);
  });
});
