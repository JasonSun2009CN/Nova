import { describe, expect, it } from 'vitest';

import { destinationOptionsFromStars, findDestinationOption } from '@/data/destination-stars';
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
