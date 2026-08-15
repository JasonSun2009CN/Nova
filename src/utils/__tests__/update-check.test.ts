import { describe, expect, it, vi } from 'vitest';

import {
  evaluateUpdate,
  fetchLatestReleaseInfo,
  parseLatestReleaseInfo,
  UPDATE_MANIFEST_URL,
} from '@/utils/update-check';

describe('parseLatestReleaseInfo', () => {
  it('合法清单返回解析结果', () => {
    const result = parseLatestReleaseInfo({
      version: '0.6.0',
      releasedAt: '2026-08-15',
      notes: '首个桌面版发布。',
      downloadUrl: 'https://example.com/releases/latest',
    });
    expect(result).toEqual({
      version: '0.6.0',
      releasedAt: '2026-08-15',
      notes: '首个桌面版发布。',
      downloadUrl: 'https://example.com/releases/latest',
    });
  });

  it('version 前后空白被裁剪', () => {
    expect(parseLatestReleaseInfo({ version: '  0.6.0  ' })?.version).toBe('0.6.0');
  });

  it('缺 version 返回 null', () => {
    expect(parseLatestReleaseInfo({ releasedAt: '2026-08-15' })).toBeNull();
  });

  it('version 非字符串返回 null', () => {
    expect(parseLatestReleaseInfo({ version: 0.6 })).toBeNull();
  });

  it('非对象输入返回 null', () => {
    expect(parseLatestReleaseInfo(null)).toBeNull();
    expect(parseLatestReleaseInfo('0.6.0')).toBeNull();
    expect(parseLatestReleaseInfo(undefined)).toBeNull();
  });

  it('可选字段非字符串时忽略', () => {
    const result = parseLatestReleaseInfo({ version: '0.6.0', notes: 42 });
    expect(result?.notes).toBeUndefined();
  });
});

describe('evaluateUpdate', () => {
  it('最新版更高时提示可更新', () => {
    expect(evaluateUpdate({ version: '0.6.0' }, '0.5.0')).toBe('update-available');
  });

  it('当前已是最新版时无需更新', () => {
    expect(evaluateUpdate({ version: '0.6.0' }, '0.6.0')).toBe('up-to-date');
  });

  it('最新版低于当前版本时无需更新', () => {
    expect(evaluateUpdate({ version: '0.5.0' }, '0.6.0')).toBe('up-to-date');
  });
});

describe('fetchLatestReleaseInfo', () => {
  it('请求成功时返回解析后的清单', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ version: '0.6.0' }),
    })) as unknown as typeof fetch;
    const result = await fetchLatestReleaseInfo(fetchImpl);
    expect(result?.version).toBe('0.6.0');
    expect(fetchImpl).toHaveBeenCalledWith(UPDATE_MANIFEST_URL);
  });

  it('HTTP 非 2xx 时返回 null', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false })) as unknown as typeof fetch;
    expect(await fetchLatestReleaseInfo(fetchImpl)).toBeNull();
  });

  it('网络异常时返回 null', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('network down');
    }) as unknown as typeof fetch;
    expect(await fetchLatestReleaseInfo(fetchImpl)).toBeNull();
  });

  it('响应 JSON 非法时返回 null', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ foo: 'bar' }),
    })) as unknown as typeof fetch;
    expect(await fetchLatestReleaseInfo(fetchImpl)).toBeNull();
  });
});
