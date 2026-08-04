import { create } from 'zustand';

import type { Star } from '@/engine';
import { getStoreDeps } from '@/store/store-deps';

export type CatalogStatus = 'idle' | 'loading' | 'ready' | 'error';

export type CatalogStore = {
  stars: readonly Star[];
  status: CatalogStatus;
  source: 'cache' | 'network' | null;
  error: string | null;
  load: () => Promise<void>;
  reset: () => void;
};

export const useCatalogStore = create<CatalogStore>((set, get) => ({
  stars: [],
  status: 'idle',
  source: null,
  error: null,
  async load() {
    const { status } = get();
    if (status === 'loading' || status === 'ready') return;
    set({ status: 'loading', error: null });
    try {
      const { starCatalogRepo } = getStoreDeps();
      const { stars, source } = await starCatalogRepo.load();
      set({ stars, source, status: 'ready', error: null });
    } catch (err) {
      set({ status: 'error', error: err instanceof Error ? err.message : '星表加载失败' });
    }
  },
  reset() {
    set({ stars: [], status: 'idle', source: null, error: null });
  },
}));
