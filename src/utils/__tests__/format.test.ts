import { describe, expect, it } from 'vitest';

import {
  formatDateTime,
  formatDurationMs,
  formatFocusEstimate,
  formatGamma,
  formatKelvin,
  formatLy,
  formatMagnitude,
  formatMinuteLabel,
  formatSpectral,
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

describe('formatFocusEstimate', () => {
  it('0.5 分钟 → 不足 1 分钟', () => {
    expect(formatFocusEstimate(0.5)).toBe('不足 1 分钟');
  });

  it('25 → 25 分钟', () => {
    expect(formatFocusEstimate(25)).toBe('25 分钟');
  });

  it('90 → 1 小时 30 分', () => {
    expect(formatFocusEstimate(90)).toBe('1 小时 30 分');
  });

  it('120 → 2 小时', () => {
    expect(formatFocusEstimate(120)).toBe('2 小时');
  });

  it('1440 → 1 天', () => {
    expect(formatFocusEstimate(1440)).toBe('1 天');
  });

  it('318_000 → 221 天（比邻星 @0.99c）', () => {
    expect(formatFocusEstimate(318_000)).toBe('221 天');
  });

  it('525_600 → 约 1.0 年', () => {
    expect(formatFocusEstimate(525_600)).toBe('约 1.0 年');
  });

  it('1_877_000 → 约 3.6 年（织女星 @0.99c）', () => {
    expect(formatFocusEstimate(1_877_000)).toBe('约 3.6 年');
  });

  it('非法值 → —', () => {
    expect(formatFocusEstimate(Number.NaN)).toBe('—');
    expect(formatFocusEstimate(-5)).toBe('—');
  });
});

describe('formatSpectral', () => {
  it('G2V → G2V', () => {
    expect(formatSpectral({ type: 'G', subclass: 2, luminosityClass: 'V' })).toBe('G2V');
  });

  it('M5.5 无光度级 → M5.5', () => {
    expect(formatSpectral({ type: 'M', subclass: 5.5 })).toBe('M5.5');
  });

  it('无子型无光度级 → O', () => {
    expect(formatSpectral({ type: 'O' })).toBe('O');
  });
});

describe('formatMagnitude', () => {
  it('-0.01 → -0.01', () => {
    expect(formatMagnitude(-0.01)).toBe('-0.01');
  });

  it('11.13 → 11.13', () => {
    expect(formatMagnitude(11.13)).toBe('11.13');
  });
});

describe('formatKelvin', () => {
  it('5778 → 5,778 K', () => {
    expect(formatKelvin(5778)).toBe('5,778 K');
  });
});
