import { describe, expect, it } from 'vitest';

import { spectralColor } from '@/engine/renderer/star-colors';

describe('spectralColor', () => {
  it('O 型星偏蓝（b > r）', () => {
    const [r, g, b] = spectralColor('O');
    expect(b).toBeGreaterThan(r);
    expect(b).toBeGreaterThan(g);
  });

  it('G 型星偏黄（r≈1, g≈0.93, b 更低）', () => {
    const [r, g, b] = spectralColor('G');
    expect(r).toBeCloseTo(1, 2);
    expect(g).toBeCloseTo(0.93, 2);
    expect(b).toBeLessThan(g);
  });

  it('M 型星偏红（r > b）', () => {
    const [r, , b] = spectralColor('M');
    expect(r).toBeGreaterThan(b);
  });

  it('提供温度时用黑体近似覆盖光谱映射', () => {
    const hot = spectralColor('G', 9000);
    const cold = spectralColor('G', 3000);
    expect(hot[2]).toBeGreaterThan(cold[2]);
  });

  it('未知类型回退中性白', () => {
    expect(spectralColor('?')).toEqual([1, 1, 1]);
  });
});
