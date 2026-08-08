export type RenderQuality = 'high' | 'medium' | 'low';

export type QualityConfig = {
  starSizeScale: number;
  starOpacity: number;
  doppler: boolean;
  pixelRatioCap: number;
};

export const QUALITY_ORDER: readonly RenderQuality[] = ['high', 'medium', 'low'];

export const QUALITY_CONFIGS: Record<RenderQuality, QualityConfig> = {
  high: { starSizeScale: 1, starOpacity: 1, doppler: true, pixelRatioCap: 2 },
  medium: { starSizeScale: 0.7, starOpacity: 0.8, doppler: false, pixelRatioCap: 1.5 },
  low: { starSizeScale: 0.45, starOpacity: 0.6, doppler: false, pixelRatioCap: 1 },
};

export const FRAME_BUDGET_MS = 22;
export const DOWNGRADE_FRAMES = 30;
export const UPGRADE_FRAMES = 120;

export type FpsGovernorOptions = {
  frameBudgetMs?: number;
  downgradeFrames?: number;
  upgradeFrames?: number;
};

export class FpsGovernor {
  private readonly frameBudgetMs: number;
  private readonly downgradeFrames: number;
  private readonly upgradeFrames: number;
  private readonly recentFrames: number[] = [];
  private slowStreak = 0;
  private fastStreak = 0;
  quality: RenderQuality = 'high';

  constructor(opts: FpsGovernorOptions = {}) {
    this.frameBudgetMs = opts.frameBudgetMs ?? FRAME_BUDGET_MS;
    this.downgradeFrames = opts.downgradeFrames ?? DOWNGRADE_FRAMES;
    this.upgradeFrames = opts.upgradeFrames ?? UPGRADE_FRAMES;
  }

  /** 每帧调用，frameMs 为上一帧耗时（毫秒）。返回是否发生档位切换。 */
  update(frameMs: number): boolean {
    if (!Number.isFinite(frameMs) || frameMs <= 0) return false;
    this.recentFrames.push(frameMs);
    if (this.recentFrames.length > 30) this.recentFrames.shift();
    const avg = this.recentFrames.reduce((a, b) => a + b, 0) / this.recentFrames.length;
    const idx = QUALITY_ORDER.indexOf(this.quality);

    if (avg > this.frameBudgetMs) {
      this.slowStreak += 1;
      this.fastStreak = 0;
      if (this.slowStreak >= this.downgradeFrames && idx < QUALITY_ORDER.length - 1) {
        this.quality = QUALITY_ORDER[idx + 1]!;
        this.slowStreak = 0;
        this.recentFrames.length = 0;
        return true;
      }
    } else {
      this.slowStreak = 0;
      this.fastStreak += 1;
      if (this.fastStreak >= this.upgradeFrames && idx > 0) {
        this.quality = QUALITY_ORDER[idx - 1]!;
        this.fastStreak = 0;
        this.recentFrames.length = 0;
        return true;
      }
    }
    return false;
  }

  get config(): QualityConfig {
    return QUALITY_CONFIGS[this.quality];
  }

  reset(): void {
    this.quality = 'high';
    this.slowStreak = 0;
    this.fastStreak = 0;
    this.recentFrames.length = 0;
  }
}
