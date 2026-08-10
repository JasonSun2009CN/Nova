import { describe, expect, it } from 'vitest';

import {
  DESTINATION_STARS,
  destinationOptionsFromStars,
  distanceBetweenStars,
  findDestinationOption,
  recommendDestination,
  starDistanceLy,
} from '@/data/destination-stars';
import { protoToStar, type ProtoStar } from '@/engine/data/star-mapper';

const ROSS_154: ProtoStar = {
  id: 'hip-92403',
  properName: 'Ross 154',
  raDeg: 210.5,
  decDeg: -23.4,
  distanceLy: 9.7,
  vMag: 10.4,
  absMag: 13.07,
  spectral: 'M3.5V',
  tier: 'tier1-nearby-100ly',
};

function star(overrides: Partial<ProtoStar> = {}): ReturnType<typeof protoToStar> {
  return protoToStar({ ...ROSS_154, ...overrides });
}

describe('destination-stars 目录驱动的目的地解析', () => {
  it('destinationOptionsFromStars 只取有名字的星并按距离升序', () => {
    const options = destinationOptionsFromStars([
      star({ id: 'hip-1001', properName: '远星', distanceLy: 40 }),
      star({ id: 'hip-1002', properName: '近星', distanceLy: 5 }),
      star({ id: 'hip-1003', properName: undefined, distanceLy: 8 }),
    ]);
    expect(options.map((o) => o.id)).toEqual(['hip-1002', 'hip-1001']);
  });

  it('findDestinationOption 能解析不在 DESTINATION_STARS 里的目录星', () => {
    const hit = findDestinationOption('hip-92403', [star()]);
    expect(hit).not.toBeNull();
    expect(hit?.name).toBe('Ross 154');
    expect(hit?.distanceLy).toBeCloseTo(9.7, 1);
  });

  it('findDestinationOption 无目录时回退到 DESTINATION_STARS', () => {
    const hit = findDestinationOption('hip-70890', []);
    expect(hit?.id).toBe('hip-70890');
    expect(hit?.name).toContain('比邻星');
  });

  it('findDestinationOption 未知 id 或空选择返回 null', () => {
    expect(findDestinationOption('hip-999999', [])).toBeNull();
    expect(findDestinationOption(null, [star()])).toBeNull();
  });
});

describe('distanceBetweenStars 两星 leg 距离（变动出发地）', () => {
  it('太阳出发时退化为目的星的太阳距（太阳在原点）', () => {
    const sol = protoToStar({
      ...ROSS_154,
      id: 'hip-sol',
      properName: '太阳',
      distanceLy: 0,
      raDeg: 0,
      decDeg: 0,
    });
    expect(distanceBetweenStars(sol, star())).toBeCloseTo(9.7, 1);
  });

  it('两星距离 = cartesian 坐标差的欧氏距离（对称性）', () => {
    const a = protoToStar({ ...ROSS_154, id: 'hip-a', distanceLy: 6, raDeg: 0, decDeg: 0 });
    const b = protoToStar({ ...ROSS_154, id: 'hip-b', distanceLy: 6, raDeg: 0, decDeg: 90 });
    const ab = distanceBetweenStars(a, b);
    expect(ab).toBeCloseTo(Math.sqrt(72), 1);
    expect(distanceBetweenStars(b, a)).toBeCloseTo(ab, 5);
  });

  it('非太阳出发地：leg 距离不等于目的星太阳距，且小于两星到太阳距离之和', () => {
    const proxima = protoToStar({
      id: 'hip-70890',
      properName: '比邻星',
      raDeg: 217.4,
      decDeg: -62.68,
      distanceLy: 4.246,
      vMag: 11.05,
      absMag: 15.6,
      spectral: 'M5.5V',
      tier: 'tier1-nearby-100ly',
    });
    const vega = protoToStar({
      id: 'hip-91262',
      properName: '织女星',
      raDeg: 279.23,
      decDeg: 38.78,
      distanceLy: 25.04,
      vMag: 0.03,
      absMag: 0.58,
      spectral: 'A0V',
      tier: 'tier1-nearby-100ly',
    });
    const leg = distanceBetweenStars(proxima, vega);
    expect(leg).toBeGreaterThan(0);
    expect(leg).toBeLessThan(starDistanceLy(proxima) + starDistanceLy(vega));
    expect(leg).not.toBeCloseTo(starDistanceLy(vega), 1);
  });
});

describe('recommendDestination 基于剩余专注时长 + 引擎 γ_max 的目的地推荐（S22）', () => {
  it('25 分钟 @常规引擎（γ_max=10 万）→ 比邻星/半人马座 α 均可达，推荐最远的半人马座 α A', () => {
    const rec = recommendDestination(DESTINATION_STARS, 25, 100_000);
    expect(rec?.id).toBe('hip-71683');
    expect(rec?.distanceLy).toBeCloseTo(4.36, 2);
  });

  it('45 分钟 @常规引擎 → 推荐最远可达的拉兰德 21185（8.31ly，可达半径约 8.56ly）', () => {
    const rec = recommendDestination(DESTINATION_STARS, 45, 100_000);
    expect(rec?.id).toBe('hip-54035');
  });

  it('600 分钟（10 小时）@常规引擎 → 可达半径约 114ly，推荐最远可达的轩辕十四（79.3ly）', () => {
    const rec = recommendDestination(DESTINATION_STARS, 600, 100_000);
    expect(rec?.id).toBe('hip-49669');
  });

  it('低引擎（γ_max=5 万）25 分钟无可达 → 回退推荐最近目标比邻星', () => {
    const rec = recommendDestination(DESTINATION_STARS, 25, 50_000);
    expect(rec?.id).toBe('hip-70890');
  });

  it('gammaMax 非正抛 RangeError', () => {
    expect(() => recommendDestination(DESTINATION_STARS, 25, 0)).toThrow(RangeError);
    expect(() => recommendDestination(DESTINATION_STARS, 25, Number.NaN)).toThrow(RangeError);
  });

  it('空候选或全部无距离 → 返回 null', () => {
    expect(recommendDestination([], 60, 100_000)).toBeNull();
    expect(
      recommendDestination([{ id: 'hip-sol', name: '太阳', distanceLy: 0 }], 60, 100_000),
    ).toBeNull();
  });
});
