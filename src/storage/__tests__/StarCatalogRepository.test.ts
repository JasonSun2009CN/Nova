import { afterEach, describe, expect, it, vi } from 'vitest';

import { protoToStar } from '@/engine';
import { NovaDatabase } from '@/storage/NovaDatabase';
import { StarCatalogRepository } from '@/storage/StarCatalogRepository';

const MANIFEST = { sourceVersion: 'v1', totalStars: 2, chunks: ['chunk-000'] as const };

function starA() {
  return protoToStar({
    id: 'hip-1',
    raDeg: 10,
    decDeg: 10,
    distanceLy: 5,
    vMag: 2,
    spectral: 'G2V',
  });
}

function starB() {
  return protoToStar({
    id: 'hip-2',
    raDeg: 20,
    decDeg: 20,
    distanceLy: 8,
    vMag: 3,
    spectral: 'K0V',
  });
}

function stubFetch(
  opts: {
    manifest?: boolean;
    chunk?: boolean;
    chunkId?: string;
    chunkData?: unknown;
  } = {},
) {
  const { manifest = true, chunk = true, chunkId = 'chunk-000', chunkData } = opts;
  const fn = vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (manifest && url.endsWith('manifest.json')) {
      return Promise.resolve(new Response(JSON.stringify(MANIFEST), { status: 200 }));
    }
    if (chunk && url.endsWith(`${chunkId}.json`)) {
      return Promise.resolve(
        new Response(JSON.stringify(chunkData ?? [starA(), starB()]), { status: 200 }),
      );
    }
    return Promise.resolve(new Response('', { status: 404 }));
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('StarCatalogRepository', () => {
  it('冷启动：fetch manifest + 分块，写入缓存并标记 network', async () => {
    const fetchMock = stubFetch();
    await NovaDatabase.temp('nova-star-repo-1', async (db) => {
      const repo = new StarCatalogRepository(db);
      const result = await repo.load();
      expect(result.source).toBe('network');
      expect(result.stars.length).toBe(2);
      expect((await repo.getMeta())?.sourceVersion).toBe('v1');
      expect(await db.starChunks.count()).toBe(1);
      const urls = fetchMock.mock.calls.map((c) => String(c[0]));
      expect(urls.join(' ')).toContain('data/stars/manifest.json');
      expect(urls.join(' ')).toContain('data/stars/chunk-000.json');
    });
  });

  it('热启动：manifest 失败时走缓存，只请求过一次 manifest、不拉分块', async () => {
    stubFetch();
    await NovaDatabase.temp('nova-star-repo-2', async (db) => {
      const repo = new StarCatalogRepository(db);
      await repo.load();
      const fetchMock = stubFetch({ manifest: false, chunk: false });
      const result = await repo.load();
      expect(result.source).toBe('cache');
      expect(result.stars.length).toBe(2);
      const urls = fetchMock.mock.calls.map((c) => String(c[0]));
      expect(urls).toHaveLength(1);
      expect(urls[0]).toContain('data/stars/manifest.json');
    });
  });

  it('sourceVersion 不匹配时重新拉取该分块', async () => {
    stubFetch();
    await NovaDatabase.temp('nova-star-repo-3', async (db) => {
      const repo = new StarCatalogRepository(db);
      await repo.load();
      const row = await db.starChunks.get('chunk-000');
      await db.starChunks.put({ ...row!, sourceVersion: 'old-version' });
      const fetchMock = stubFetch({ chunkData: [starB()] });
      const result = await repo.load();
      expect(result.source).toBe('network');
      expect(result.stars.map((s) => s.id)).toEqual(['hip-2']);
      expect(String(fetchMock.mock.calls[1]![0])).toContain('data/stars/chunk-000.json');
    });
  });

  it('空星表抛错', async () => {
    stubFetch({ chunkData: [] });
    await NovaDatabase.temp('nova-star-repo-4', async (db) => {
      const repo = new StarCatalogRepository(db);
      await expect(repo.load()).rejects.toThrow('星表为空');
    });
  });

  it('clear 清空分块与元数据', async () => {
    stubFetch();
    await NovaDatabase.temp('nova-star-repo-5', async (db) => {
      const repo = new StarCatalogRepository(db);
      await repo.load();
      await repo.clear();
      expect(await db.starChunks.count()).toBe(0);
      expect(await repo.getMeta()).toBeUndefined();
    });
  });

  it('loadNebulae：拉取 nebulae.json 返回列表；请求失败回退空数组', async () => {
    const fetchMock = stubFetch();
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('nebulae.json')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              nebulae: [
                {
                  id: 'm42',
                  type: 'emission',
                  coords: {
                    galactic: { lDeg: 0, bDeg: 0, distanceLy: 1344 },
                    cartesian: { xLy: 1, yLy: 2, zLy: 3 },
                  },
                  apparentMagnitude: 4,
                  distanceLy: 1344,
                },
              ],
            }),
            { status: 200 },
          ),
        );
      }
      return Promise.resolve(new Response('', { status: 404 }));
    });
    await NovaDatabase.temp('nova-star-nebulae-1', async (db) => {
      const repo = new StarCatalogRepository(db);
      const result = await repo.loadNebulae();
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('m42');
    });
    await NovaDatabase.temp('nova-star-nebulae-2', async (db) => {
      fetchMock.mockImplementation(() => Promise.resolve(new Response('', { status: 404 })));
      const repo = new StarCatalogRepository(db);
      const result = await repo.loadNebulae();
      expect(result).toEqual([]);
    });
  });
});
