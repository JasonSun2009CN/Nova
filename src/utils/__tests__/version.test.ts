import { describe, expect, it } from 'vitest';

import { compareVersions, isVersionNewer, parseVersion } from '@/utils/version';

describe('parseVersion', () => {
  it('标准 x.y.z 解析', () => {
    expect(parseVersion('0.6.0')).toEqual({ major: 0, minor: 6, patch: 0 });
  });

  it('前导 v 忽略', () => {
    expect(parseVersion('v0.6.0')).toEqual({ major: 0, minor: 6, patch: 0 });
    expect(parseVersion('V1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 });
  });

  it('缺 patch 时按 0 处理', () => {
    expect(parseVersion('1.2')).toEqual({ major: 1, minor: 2, patch: 0 });
  });

  it('非法输入返回 null', () => {
    expect(parseVersion('')).toBeNull();
    expect(parseVersion('abc')).toBeNull();
    expect(parseVersion('0.x.0')).toBeNull();
    expect(parseVersion('0.6.0.1')).toBeNull();
    expect(parseVersion('0.6.0-beta')).toBeNull();
  });
});

describe('compareVersions', () => {
  it('等值返回 0', () => {
    expect(compareVersions('0.6.0', '0.6.0')).toBe(0);
    expect(compareVersions('v0.6.0', '0.6.0')).toBe(0);
  });

  it('更高版本返回 1', () => {
    expect(compareVersions('0.6.0', '0.5.9')).toBe(1);
    expect(compareVersions('0.10.0', '0.9.9')).toBe(1);
    expect(compareVersions('1.0.0', '0.6.0')).toBe(1);
  });

  it('更低版本返回 -1', () => {
    expect(compareVersions('0.5.0', '0.6.0')).toBe(-1);
    expect(compareVersions('0.6.0', '1.0.0')).toBe(-1);
  });

  it('非法输入一律视为相等', () => {
    expect(compareVersions('', '0.6.0')).toBe(0);
    expect(compareVersions('0.6.0', 'abc')).toBe(0);
  });
});

describe('isVersionNewer', () => {
  it('最新版更高时为 true', () => {
    expect(isVersionNewer('0.6.0', '0.5.0')).toBe(true);
  });

  it('当前已是最新时为 false', () => {
    expect(isVersionNewer('0.6.0', '0.6.0')).toBe(false);
  });

  it('最新版更低时为 false', () => {
    expect(isVersionNewer('0.5.0', '0.6.0')).toBe(false);
  });
});
