import type { VoyageSnapshot } from '@/engine/contract/voyage-types';

export type LiveVoyageMeta = {
  snapshot: VoyageSnapshot;
  originStarId: string | null;
  destStarId: string | null;
  savedAt: number;
};

const STORAGE_KEY = 'nova:live-voyage';

function getStorage(): Storage | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage;
}

function isLiveVoyageMeta(value: unknown): value is LiveVoyageMeta {
  if (typeof value !== 'object' || value == null) return false;
  const snapshot = (value as { snapshot?: unknown }).snapshot;
  if (typeof snapshot !== 'object' || snapshot == null) return false;
  const status = (snapshot as { state?: { status?: unknown } }).state?.status;
  return status === 'running' || status === 'paused';
}

export function saveLiveVoyage(meta: LiveVoyageMeta): void {
  const storage = getStorage();
  if (storage == null) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(meta));
  } catch {
    return;
  }
}

export function loadLiveVoyage(): LiveVoyageMeta | null {
  const storage = getStorage();
  if (storage == null) return null;
  let raw: string | null = null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (raw == null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isLiveVoyageMeta(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearLiveVoyage(): void {
  const storage = getStorage();
  if (storage == null) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    return;
  }
}
