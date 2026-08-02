import { create } from 'zustand';

import type { VoyageRecord } from '@/contract/storage-types';
import { getStoreDeps } from '@/store/store-deps';

type HistoryStoreState = {
  records: VoyageRecord[];
  stats: {
    total: number;
    totalFocusHours: number;
    totalTraveledLy: number;
    completedVoyages: number;
  } | null;
  loading: boolean;
  error: string | null;
};

type HistoryStoreActions = {
  load: () => Promise<void>;
  refresh: () => Promise<void>;
  loadStats: () => Promise<void>;
  deleteRecord: (id: string) => Promise<boolean>;
  clearAll: () => Promise<void>;
  loadPage: (opts: { limit: number; offset?: number }) => Promise<void>;
};

export type HistoryStore = HistoryStoreState & HistoryStoreActions;

const EMPTY_STATS: NonNullable<HistoryStoreState['stats']> = {
  total: 0,
  totalFocusHours: 0,
  totalTraveledLy: 0,
  completedVoyages: 0,
};

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  records: [],
  stats: null,
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const { voyageRepo } = getStoreDeps();
      const [records, stats] = await Promise.all([
        voyageRepo.list({ order: 'createdAt_desc' }),
        voyageRepo.stats(),
      ]);
      set({ records, stats, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'History load failed',
      });
    }
  },

  refresh: async () => {
    await get().load();
  },

  loadStats: async () => {
    try {
      const { voyageRepo } = getStoreDeps();
      const stats = await voyageRepo.stats();
      set({ stats });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'History stats load failed',
      });
    }
  },

  deleteRecord: async (id) => {
    const { voyageRepo } = getStoreDeps();
    const deleted = await voyageRepo.delete(id);
    if (deleted) {
      set({ records: get().records.filter((r) => r.id !== id) });
      await get().loadStats();
    }
    return deleted;
  },

  clearAll: async () => {
    const { voyageRepo } = getStoreDeps();
    await voyageRepo.clearAll();
    set({ records: [], stats: { ...EMPTY_STATS } });
  },

  loadPage: async ({ limit, offset = 0 }) => {
    set({ loading: true, error: null });
    try {
      const { voyageRepo } = getStoreDeps();
      const records = await voyageRepo.list({
        order: 'createdAt_desc',
        limit,
        offset,
      });
      set({ records, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'History page load failed',
      });
    }
  },
}));
