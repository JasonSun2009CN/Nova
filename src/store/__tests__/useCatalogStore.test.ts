import { afterEach, describe, expect, it, vi } from 'vitest';

import { protoToStar } from '@/engine';
import { NovaDatabase } from '@/storage/NovaDatabase';
import { SettingsRepository } from '@/storage/SettingsRepository';
import { StarCatalogRepository } from '@/storage/StarCatalogRepository';
import { VoyageRepository } from '@/storage/VoyageRepository';
import { resetStoreDepsForTest, setStoreDepsForTest, useCatalogStore } from '@/store/index';

const MANIFEST = { sourceVersion: 'v1', totalStars: 1, chunks: ['chunk-000'] as const };

function star() {
  return protoToStar({
    id: 'hip-1',
    raDeg: 10,
    decDeg: 10,
    distanceLy: 5,
    vMag: 2,
    spectral: 'G2V',
  });
}

function stubFetch(opts: { manifest?: boolean; chunk?: boolean } = {}) {
  const { manifest = true, chunk = true } = opts;
  const fn = vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (manifest && url.endsWith('manifest.json')) {
      return Promise.resolve(new Response(JSON.stringify(MANIFEST), { status: 200 }));
    }
    if (chunk && url.endsWith('chunk-000.json')) {
      return Promise.resolve(new Response(JSON.stringify([star()]), { status: 200 }));
    }
    return Promise.resolve(new Response('', { status: 404 }));
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

function resetCatalog(): void {
  useCatalogStore.setState({ stars: [], status: 'idle', source: null, error: null });
}

afterEach(() => {
  vi.unstubAllGlobals();
  resetStoreDepsForTest();
  resetCatalog();
});

describe('useCatalogStore (Zustand · 星表加载)', () => {
  it('加载成功：network 源，stars 就绪', async () => {
    const fetchMock = stubFetch();
    await NovaDatabase.temp('nova-cat-store-1', async (db) => {
      setStoreDepsForTest({
        db,
        settingsRepo: new SettingsRepository(db),
        voyageRepo: new VoyageRepository(db),
        starCatalogRepo: new StarCatalogRepository(db),
      });
      await useCatalogStore.getState().load();
      const s = useCatalogStore.getState();
      expect(s.status).toBe('ready');
      expect(s.source).toBe('network');
      expect(s.stars.length).toBe(1);
      expect(fetchMock).toHaveBeenCalled();
    });
  });

  it('ready 后重复 load 幂等，不再次请求', async () => {
    const fetchMock = stubFetch();
    await NovaDatabase.temp('nova-cat-store-2', async (db) => {
      setStoreDepsForTest({
        db,
        settingsRepo: new SettingsRepository(db),
        voyageRepo: new VoyageRepository(db),
        starCatalogRepo: new StarCatalogRepository(db),
      });
      await useCatalogStore.getState().load();
      const callsAfterFirst = fetchMock.mock.calls.length;
      await useCatalogStore.getState().load();
      expect(fetchMock.mock.calls.length).toBe(callsAfterFirst);
    });
  });

  it('加载失败：error 状态且 stars 为空', async () => {
    stubFetch({ manifest: false, chunk: false });
    await NovaDatabase.temp('nova-cat-store-3', async (db) => {
      setStoreDepsForTest({
        db,
        settingsRepo: new SettingsRepository(db),
        voyageRepo: new VoyageRepository(db),
        starCatalogRepo: new StarCatalogRepository(db),
      });
      await useCatalogStore.getState().load();
      const s = useCatalogStore.getState();
      expect(s.status).toBe('error');
      expect(s.error).not.toBeNull();
      expect(s.stars.length).toBe(0);
    });
  });

  it('加载失败后可重试成功', async () => {
    stubFetch({ manifest: false, chunk: false });
    await NovaDatabase.temp('nova-cat-store-4', async (db) => {
      setStoreDepsForTest({
        db,
        settingsRepo: new SettingsRepository(db),
        voyageRepo: new VoyageRepository(db),
        starCatalogRepo: new StarCatalogRepository(db),
      });
      await useCatalogStore.getState().load();
      expect(useCatalogStore.getState().status).toBe('error');
      stubFetch();
      await useCatalogStore.getState().load();
      expect(useCatalogStore.getState().status).toBe('ready');
      expect(useCatalogStore.getState().stars.length).toBe(1);
    });
  });
});
