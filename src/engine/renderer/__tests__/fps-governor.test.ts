import { describe, expect, it } from 'vitest';

import {
  DOWNGRADE_FRAMES,
  FRAME_BUDGET_MS,
  FpsGovernor,
  QUALITY_CONFIGS,
  QUALITY_ORDER,
  UPGRADE_FRAMES,
} from '@/engine/renderer/fps-governor';

describe('engine/renderer/fps-governor 帧率自动降级（S29）', () => {
  it('初始为 high，配置对应高画质', () => {
    const g = new FpsGovernor();
    expect(g.quality).toBe('high');
    expect(QUALITY_CONFIGS.high.doppler).toBe(true);
    expect(QUALITY_CONFIGS.high.starSizeScale).toBe(1);
  });

  it('持续高帧耗时超过阈值 → 降到 medium 再 low', () => {
    const g = new FpsGovernor();
    let changed = 0;
    for (let i = 0; i < 1000; i++) {
      if (g.update(40)) changed += 1;
    }
    expect(g.quality).toBe('low');
    expect(changed).toBeGreaterThanOrEqual(2);
  });

  it('降级到 low 后不再更低（边界安全）', () => {
    const g = new FpsGovernor();
    for (let i = 0; i < 5000; i++) g.update(80);
    expect(g.quality).toBe('low');
    const idx = QUALITY_ORDER.indexOf('low');
    expect(idx).toBe(QUALITY_ORDER.length - 1);
  });

  it('帧耗时达标持续足够 → 从 low 逐级升回 high', () => {
    const g = new FpsGovernor();
    for (let i = 0; i < 500; i++) g.update(40);
    expect(g.quality).toBe('low');
    let upgraded = 0;
    for (let i = 0; i < 5000; i++) {
      if (g.update(8)) upgraded += 1;
    }
    expect(g.quality).toBe('high');
    expect(upgraded).toBeGreaterThanOrEqual(2);
  });

  it('帧耗时刚好在阈值内不误降（16ms 应保持 high）', () => {
    const g = new FpsGovernor();
    for (let i = 0; i < 500; i++) g.update(16);
    expect(g.quality).toBe('high');
  });

  it('非法的 frameMs（0/NaN）忽略不降级', () => {
    const g = new FpsGovernor();
    for (let i = 0; i < 1000; i++) g.update(Number.NaN);
    expect(g.quality).toBe('high');
  });

  it('update 返回 true 表示发生了档位切换', () => {
    const g = new FpsGovernor();
    expect(g.update(8)).toBe(false);
    let sawChange = false;
    for (let i = 0; i < 100; i++) {
      if (g.update(50)) sawChange = true;
    }
    expect(sawChange).toBe(true);
  });

  it('reset 回到 high 并清空计数', () => {
    const g = new FpsGovernor();
    for (let i = 0; i < 500; i++) g.update(50);
    expect(g.quality).toBe('low');
    g.reset();
    expect(g.quality).toBe('high');
    for (let i = 0; i < 10; i++) g.update(8);
    expect(g.quality).toBe('high');
  });

  it('config 随 quality 变化返回对应画质参数', () => {
    const g = new FpsGovernor();
    const high = g.config;
    expect(high).toBe(QUALITY_CONFIGS.high);
    for (let i = 0; i < 100; i++) g.update(50);
    expect(g.config).toBe(QUALITY_CONFIGS[g.quality]);
  });

  it('阈值常量在合理范围（预算 < 60fps 帧长，降级快于升级）', () => {
    expect(FRAME_BUDGET_MS).toBeGreaterThanOrEqual(16);
    expect(FRAME_BUDGET_MS).toBeLessThan(34);
    expect(DOWNGRADE_FRAMES).toBeLessThan(UPGRADE_FRAMES);
  });
});
