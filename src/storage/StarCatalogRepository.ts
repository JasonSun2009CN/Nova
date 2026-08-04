import type { Star } from '@/engine';
import type { StarCatalogMetaRecord, StarChunkRecord } from '@/contract/storage-types';
import type { NovaDatabase } from '@/storage/NovaDatabase';

const MANIFEST_URL = 'data/stars/manifest.json';
const CHUNK_URL_PREFIX = 'data/stars/';

export type StarCatalogLoadResult = Readonly<{
  stars: readonly Star[];
  source: 'network' | 'cache';
}>;

export class StarCatalogRepository {
  constructor(private readonly db: NovaDatabase) {}

  async load(): Promise<StarCatalogLoadResult> {
    await this.db.ensureOpen();

    let meta: StarCatalogMetaRecord;
    let metaFromNetwork = false;
    try {
      const remote = await this.fetchJson<{
        sourceVersion: string;
        chunks: string[];
        totalStars: number;
      }>(MANIFEST_URL);
      meta = {
        id: 'main',
        sourceVersion: remote.sourceVersion,
        chunks: remote.chunks,
        totalStars: remote.totalStars,
        fetchedAt: Date.now(),
      };
      metaFromNetwork = true;
    } catch {
      const cachedMeta = await this.db.starCatalogMeta.get('main');
      if (cachedMeta == null) throw new Error('星表清单加载失败且无缓存');
      meta = cachedMeta;
    }

    const all: Star[] = [];
    let usedNetwork = false;
    for (const id of meta.chunks) {
      const cached = await this.db.starChunks.get(id);
      if (cached != null && cached.sourceVersion === meta.sourceVersion) {
        all.push(...cached.stars);
        continue;
      }
      const stars = await this.fetchJson<Star[]>(`${CHUNK_URL_PREFIX}${id}.json`);
      const record: StarChunkRecord = {
        id,
        sourceVersion: meta.sourceVersion,
        stars,
        loadedAt: Date.now(),
      };
      await this.db.starChunks.put(record);
      all.push(...stars);
      usedNetwork = true;
    }

    if (all.length === 0) throw new Error('星表为空');

    if (metaFromNetwork) {
      await this.db.starCatalogMeta.put(meta);
    }
    return { stars: all, source: usedNetwork ? 'network' : 'cache' };
  }

  async clear(): Promise<void> {
    await this.db.ensureOpen();
    await this.db.starChunks.clear();
    await this.db.starCatalogMeta.delete('main');
  }

  async getMeta(): Promise<StarCatalogMetaRecord | undefined> {
    await this.db.ensureOpen();
    return (await this.db.starCatalogMeta.get('main')) ?? undefined;
  }

  private resolveUrl(path: string): string {
    const base =
      typeof document !== 'undefined' && document.baseURI != null ? document.baseURI : undefined;
    return base != null ? new URL(path, base).toString() : path;
  }

  private async fetchJson<T>(url: string): Promise<T> {
    const resolved = this.resolveUrl(url);
    const res = await fetch(resolved);
    if (!res.ok) throw new Error(`请求失败 ${res.status}: ${url}`);
    return (await res.json()) as T;
  }
}
