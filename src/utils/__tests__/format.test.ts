import { describe, expect, it } from 'vitest';

import {
  formatDateTime,
  formatDurationMs,
  formatGamma,
  formatLy,
  formatMinuteLabel,
  formatVOverC,
} from '@/utils/format';

describe('formatDurationMs', () => {
  it('0ms → 00:00', () => {
    expect(formatDurationMs(0)).toBe('00:00');
  });

  it('25 分钟 → 25:00', () => {
    expect(formatDurationMs(25 * 60_000)).toBe('25:00');
  });

  it('59_999ms → 00:59（向下取整到秒）', () => {
    expect(formatDurationMs(59_999)).toBe('00:59');
  });

  it('90 分钟 → 01:30:00', () => {
    expect(formatDurationMs(90 * 60_000)).toBe('01:30:00');
  });

  it('负数 → 00:00', () => {
    expect(formatDurationMs(-5000)).toBe('00:00');
  });
});

describe('formatLy', () => {
  it('比邻星 4.246ly → 4.25 ly', () => {
    expect(formatLy(4.246)).toBe('4.25 ly');
  });

  it('0.083ly → 0.083 ly（<1 保留三位）', () => {
    expect(formatLy(0.083)).toBe('0.083 ly');
  });

  it('412ly → 412 ly（≥100 取整）', () => {
    expect(formatLy(412)).toBe('412 ly');
  });
});

describe('formatGamma', () => {
  it('γ=7.0888 → ×7.09', () => {
    expect(formatGamma(7.0888)).toBe('×7.09');
  });

  it('γ=1 → ×1.00', () => {
    expect(formatGamma(1)).toBe('×1.00');
  });
});

describe('formatVOverC', () => {
  it('0.99 → 0.990c', () => {
    expect(formatVOverC(0.99)).toBe('0.990c');
  });

  it('0.999 → 0.999c', () => {
    expect(formatVOverC(0.999)).toBe('0.999c');
  });
});

describe('formatDateTime', () => {
  it('本地时间 01-05 12:30 → 01-05 12:30', () => {
    const d = new Date(2025, 0, 5, 12, 30);
    expect(formatDateTime(d.getTime())).toBe('01-05 12:30');
  });

  it('补零：3 月 9 日 08:05 → 03-09 08:05', () => {
    const d = new Date(2025, 2, 9, 8, 5);
    expect(formatDateTime(d.getTime())).toBe('03-09 08:05');
  });
});

describe('formatMinuteLabel', () => {
  it('25 → 25分钟', () => {
    expect(formatMinuteLabel(25)).toBe('25分钟');
  });

  it('90 → 1小时30分', () => {
    expect(formatMinuteLabel(90)).toBe('1小时30分');
  });

  it('120 → 2小时', () => {
    expect(formatMinuteLabel(120)).toBe('2小时');
  });
});
