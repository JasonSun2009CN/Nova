import { describe, expect, it } from 'vitest';

import {
  DESTINATION_STARS,
  destinationOptionsFromStars,
  findDestinationOption,
  recommendDestination,
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

describe('recommendDestination 基于剩余专注时长的目的地推荐', () => {
  it('默认 25 分钟无星可达 → 回退推荐最近目标比邻星', () => {
    const rec = recommendDestination(DESTINATION_STARS, 25);
    expect(rec?.id).toBe('hip-70890');
  });

  it('45 分钟比邻星可达 → 推荐比邻星（唯一可达）', () => {
    const rec = recommendDestination(DESTINATION_STARS, 45);
    expect(rec?.id).toBe('hip-70890');
  });

  it('50 分钟可达上限约 4.75ly → 推荐最远的半人马座 α（4.36ly，巴纳德 5.96 不可达）', () => {
    const rec = recommendDestination(DESTINATION_STARS, 50);
    expect(rec?.distanceLy).toBeCloseTo(4.36, 2);
  });

  it('600 分钟（10 小时）→ 推荐最远可达目标五车二（42.9ly）', () => {
    const rec = recommendDestination(DESTINATION_STARS, 600);
    expect(rec?.id).toBe('hip-24608');
  });

  it('空候选或全部无距离 → 返回 null', () => {
    expect(recommendDestination([], 60)).toBeNull();
    expect(recommendDestination([{ id: 'hip-sol', name: '太阳', distanceLy: 0 }], 60)).toBeNull();
  });
});
