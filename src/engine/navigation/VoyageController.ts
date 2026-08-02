import EventEmitter from 'eventemitter3';

import { LIGHT_SPEED, lorentzFactor } from '@/engine/physics/lorentz';

import type {
  VoyageAbortReason,
  VoyageEventMap,
  VoyageOptions,
  VoyageProgress,
  VoyageSnapshot,
  VoyageStatus,
} from '@/engine/contract/voyage-types';

const SECONDS_PER_YEAR = 365.25 * 24 * 3600;
const METERS_PER_LIGHT_YEAR = LIGHT_SPEED * SECONDS_PER_YEAR;
const DEFAULT_TICK_MS = 250;
const SNAPSHOT_VERSION = 1;

type EngineState = {
  status: VoyageStatus;
  focusTotalMs: number | null;
  elapsedFocusMs: number;
  traveledLy: number;
  startWallTime: number | null;
  lastTickWallTime: number | null;
  currentPauseStart: number | null;
  pausedSegments: { start: number; end: number }[];
  vOverC: number;
  tickIntervalMs: number;
  infinite: boolean;
  tickHandle: ReturnType<typeof setInterval> | null;
  abortListener: (() => void) | null;
};

export class VoyageController extends EventEmitter<VoyageEventMap> {
  private readonly s: EngineState;

  constructor(opts: VoyageOptions) {
    super();
    const { focusTotalMs, vOverC, infinite, tickIntervalMs } = normalizeOptions(opts);
    this.s = {
      status: 'idle',
      focusTotalMs,
      elapsedFocusMs: 0,
      traveledLy: 0,
      startWallTime: null,
      lastTickWallTime: null,
      currentPauseStart: null,
      pausedSegments: [],
      vOverC,
      tickIntervalMs,
      infinite,
      tickHandle: null,
      abortListener: null,
    };

    if (opts.abortSignal) {
      this.attachAbortSignal(opts.abortSignal);
    }
  }

  static fromSnapshot(snapshot: VoyageSnapshot): VoyageController {
    if (snapshot.version !== SNAPSHOT_VERSION) {
      throw new RangeError(
        `VoyageController.fromSnapshot: unsupported snapshot version ${snapshot.version}`,
      );
    }
    const ctrl = new VoyageController({
      vOverC: snapshot.opts.vOverC,
      infinite: snapshot.opts.infinite,
      tickIntervalMs: snapshot.opts.tickIntervalMs,
      ...(snapshot.opts.focusTotalMs != null
        ? { focusMinutes: snapshot.opts.focusTotalMs / 60_000 }
        : {}),
    });
    ctrl.s.status = snapshot.state.status;
    ctrl.s.elapsedFocusMs = snapshot.state.elapsedFocusMs;
    ctrl.s.traveledLy = snapshot.state.traveledLy;
    ctrl.s.startWallTime = snapshot.state.startWallTime;
    ctrl.s.lastTickWallTime = snapshot.state.lastTickWallTime;
    ctrl.s.pausedSegments = snapshot.state.pausedSegments.slice();
    ctrl.s.currentPauseStart = snapshot.state.currentPauseStart;
    if (ctrl.s.status === 'running') {
      ctrl.s.lastTickWallTime = wallNow();
      ctrl.scheduleTick();
    }
    return ctrl;
  }

  start(): VoyageProgress {
    if (this.s.status !== 'idle') {
      throw new IllegalStateError(
        `start() 只能在 idle 状态调用，当前状态：${this.s.status}`,
        this.s.status,
      );
    }
    this.s.status = 'running';
    this.s.startWallTime = wallNow();
    this.s.lastTickWallTime = this.s.startWallTime;
    this.scheduleTick();
    const progress = this.computeProgress();
    this.emit('progress', progress);
    return progress;
  }

  pause(): VoyageProgress {
    if (this.s.status !== 'running') {
      throw new IllegalStateError(
        `pause() 只能在 running 状态调用，当前状态：${this.s.status}`,
        this.s.status,
      );
    }
    this.flushTick();
    this.s.status = 'paused';
    this.s.currentPauseStart = wallNow();
    this.stopTick();
    const progress = this.computeProgress();
    this.emit('pause', progress);
    this.emit('progress', progress);
    return progress;
  }

  resume(): VoyageProgress {
    if (this.s.status !== 'paused') {
      throw new IllegalStateError(
        `resume() 只能在 paused 状态调用，当前状态：${this.s.status}`,
        this.s.status,
      );
    }
    const now = wallNow();
    if (this.s.currentPauseStart != null) {
      this.s.pausedSegments.push({ start: this.s.currentPauseStart, end: now });
      this.s.currentPauseStart = null;
    }
    this.s.status = 'running';
    this.s.lastTickWallTime = now;
    this.scheduleTick();
    const progress = this.computeProgress();
    this.emit('resume', progress);
    this.emit('progress', progress);
    return progress;
  }

  complete(): VoyageProgress {
    if (!this.s.infinite && this.s.status !== 'running' && this.s.status !== 'paused') {
      throw new IllegalStateError(
        `手动 complete() 仅允许 infinite 模式或 running/paused 状态，当前：${this.s.status}`,
        this.s.status,
      );
    }
    this.flushTick();
    this.s.status = 'completed';
    this.stopTick();
    const progress = this.computeProgress();
    this.emit('complete', progress);
    this.emit('progress', progress);
    return progress;
  }

  abort(reason: VoyageAbortReason = 'user'): VoyageProgress & { reason: VoyageAbortReason } {
    if (this.s.status === 'completed' || this.s.status === 'aborted' || this.s.status === 'idle') {
      throw new IllegalStateError(
        `abort() 不能在 idle/completed/aborted 状态调用，当前：${this.s.status}`,
        this.s.status,
      );
    }
    this.flushTick();
    this.s.status = 'aborted';
    this.stopTick();
    const progress = { ...this.computeProgress(), reason };
    this.emit('abort', progress);
    this.emit('progress', progress);
    return progress;
  }

  getProgress(): VoyageProgress {
    return this.computeProgress();
  }

  snapshot(): VoyageSnapshot {
    const pausedSegments = this.s.pausedSegments.slice();
    if (this.s.currentPauseStart != null) {
      pausedSegments.push({ start: this.s.currentPauseStart, end: wallNow() });
    }
    return {
      version: SNAPSHOT_VERSION,
      createdAt: wallNow(),
      opts: {
        vOverC: this.s.vOverC,
        infinite: this.s.infinite,
        tickIntervalMs: this.s.tickIntervalMs,
        focusTotalMs: this.s.focusTotalMs,
      },
      state: {
        status: this.s.status,
        elapsedFocusMs: this.s.elapsedFocusMs,
        traveledLy: this.s.traveledLy,
        startWallTime: this.s.startWallTime,
        lastTickWallTime: this.s.lastTickWallTime,
        pausedSegments,
        currentPauseStart: this.s.currentPauseStart,
      },
    };
  }

  dispose(): void {
    this.stopTick();
    if (this.s.abortListener) {
      this.s.abortListener = null;
    }
    this.removeAllListeners();
  }

  private attachAbortSignal(signal: AbortSignal): void {
    const handler = () => {
      if (this.s.status === 'running' || this.s.status === 'paused') {
        void this.abort('system');
      }
    };
    this.s.abortListener = handler;
    if (signal.aborted) {
      queueMicrotask(handler);
    } else {
      signal.addEventListener('abort', handler, { once: true });
    }
  }

  private scheduleTick(): void {
    if (this.s.tickHandle != null) return;
    this.s.tickHandle = setInterval(() => this.tick(), this.s.tickIntervalMs);
    if (typeof this.s.tickHandle === 'object' && 'unref' in this.s.tickHandle) {
      this.s.tickHandle.unref?.();
    }
  }

  private stopTick(): void {
    if (this.s.tickHandle != null) {
      clearInterval(this.s.tickHandle);
      this.s.tickHandle = null;
    }
  }

  private tick(): void {
    this.flushTick();
    if (this.s.focusTotalMs != null && this.s.elapsedFocusMs >= this.s.focusTotalMs) {
      this.s.status = 'completed';
      this.stopTick();
      const progress = this.computeProgress();
      this.emit('complete', progress);
      this.emit('progress', progress);
    } else {
      this.emit('progress', this.computeProgress());
    }
  }

  private flushTick(): void {
    if (this.s.status !== 'running' || this.s.lastTickWallTime == null) return;
    const now = wallNow();
    const deltaMs = now - this.s.lastTickWallTime;
    if (deltaMs <= 0) return;
    const focusSeconds = deltaMs / 1000;
    const gamma = lorentzFactor(this.s.vOverC * LIGHT_SPEED);
    const properSeconds = focusSeconds * gamma;
    const meters = this.s.vOverC * LIGHT_SPEED * properSeconds;
    this.s.traveledLy += meters / METERS_PER_LIGHT_YEAR;
    this.s.elapsedFocusMs += deltaMs;
    this.s.lastTickWallTime = now;
  }

  private computeProgress(): VoyageProgress {
    const remaining =
      this.s.focusTotalMs == null ? null : Math.max(0, this.s.focusTotalMs - this.s.elapsedFocusMs);
    const gamma = lorentzFactor(this.s.vOverC * LIGHT_SPEED);
    const pausedSegments = (this.s.pausedSegments as { start: number; end: number }[]).slice();
    if (this.s.currentPauseStart != null) {
      pausedSegments.push({ start: this.s.currentPauseStart, end: wallNow() });
    }
    return {
      status: this.s.status,
      focusTotalMs: this.s.focusTotalMs,
      elapsedFocusMs: this.s.elapsedFocusMs,
      remainingFocusMs: remaining,
      vOverC: this.s.vOverC,
      gamma,
      traveledLy: this.s.traveledLy,
      startWallTime: this.s.startWallTime,
      lastUpdateWallTime: this.s.lastTickWallTime,
      pausedSegments,
    };
  }
}

export class IllegalStateError extends Error {
  constructor(
    message: string,
    public readonly status: VoyageStatus,
  ) {
    super(message);
    this.name = 'IllegalStateError';
  }
}

function normalizeOptions(opts: VoyageOptions) {
  if (!(opts.vOverC > 0 && opts.vOverC < 1)) {
    throw new RangeError(`VoyageController: vOverC=${opts.vOverC} 必须在 (0, 1) 区间内。`);
  }
  let focusMs: number | null = null;
  const infinite = opts.infinite === true;
  if (!infinite) {
    let totalMin = 0;
    if (typeof opts.focusMinutes === 'number') totalMin += opts.focusMinutes;
    if (typeof opts.focusHours === 'number') totalMin += opts.focusHours * 60;
    if (!(totalMin > 0)) {
      throw new TypeError(
        'VoyageController: infinite=false 时必须提供正数的 focusMinutes 或 focusHours。',
      );
    }
    focusMs = totalMin * 60_000;
  } else {
    if (
      (typeof opts.focusMinutes === 'number' && opts.focusMinutes > 0) ||
      (typeof opts.focusHours === 'number' && opts.focusHours > 0)
    ) {
      throw new TypeError('VoyageController: infinite=true 时禁止设置 focusMinutes / focusHours。');
    }
  }
  const tickIntervalMs = Math.max(
    50,
    Math.trunc(
      typeof opts.tickIntervalMs === 'number' && opts.tickIntervalMs > 0
        ? opts.tickIntervalMs
        : DEFAULT_TICK_MS,
    ),
  );
  return {
    focusTotalMs: focusMs,
    vOverC: opts.vOverC,
    infinite,
    tickIntervalMs,
  };
}

function wallNow(): number {
  return Date.now();
}
