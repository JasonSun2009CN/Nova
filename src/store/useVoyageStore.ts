import { create } from 'zustand';

import type { VoyageRecord } from '@/contract/storage-types';
import type { VoyageTimerWorkerResponse } from '@/contract/worker-types';
import type {
  VoyageAbortReason,
  VoyageOptions,
  VoyageProgress,
  VoyageSnapshot,
} from '@/engine/contract/voyage-types';
import { VoyageController } from '@/engine/navigation/VoyageController';
import { clearLiveVoyage, loadLiveVoyage, saveLiveVoyage } from '@/storage/live-voyage-storage';
import { getStoreDeps } from '@/store/store-deps';
import { useHistoryStore } from '@/store/useHistoryStore';

type VoyageStoreState = {
  progress: VoyageProgress | null;
  snapshot: VoyageSnapshot | null;
  originStarId: string | null;
  destStarId: string | null;
  lastSavedRecord: VoyageRecord | null;
  controllerReady: boolean;
  resumedFromSnapshot: boolean;
};

type VoyageStoreActions = {
  prepare: (
    opts: VoyageOptions & { originStarId?: string | null; destStarId?: string | null },
  ) => void;
  start: () => VoyageProgress;
  pause: () => VoyageProgress;
  resume: () => VoyageProgress;
  abort: (reason?: VoyageAbortReason) => VoyageProgress & { reason: VoyageAbortReason };
  complete: () => VoyageProgress;
  selectDestination: (destStarId: string | null) => void;
  restoreFromSnapshot: (
    snapshot: VoyageSnapshot,
    meta?: { originStarId?: string | null; destStarId?: string | null },
  ) => void;
  dispose: () => void;
  saveToHistory: () => Promise<VoyageRecord | null>;
  resumeFromLiveVoyage: () => boolean;
};

export type VoyageStore = VoyageStoreState & VoyageStoreActions;

const WORKER_TICK_MS = 250;
const LIVE_PERSIST_THROTTLE_MS = 1000;

let activeController: VoyageController | null = null;
let activeWorker: Worker | null = null;
let lastLivePersistAt = 0;

function isWorkerSupported(): boolean {
  return typeof Worker !== 'undefined';
}

function startWorker(): void {
  if (!isWorkerSupported()) return;
  if (activeWorker != null) return;
  const worker = new Worker(new URL('../workers/voyage-timer.worker.ts', import.meta.url), {
    type: 'module',
  });
  worker.onmessage = (message: MessageEvent) => {
    const data = message.data as VoyageTimerWorkerResponse;
    if (data.type === 'tick') {
      activeController?.tick(data.ts);
    }
  };
  worker.postMessage({ type: 'start', intervalMs: WORKER_TICK_MS });
  activeWorker = worker;
}

function stopWorker(): void {
  if (activeWorker == null) return;
  activeWorker.postMessage({ type: 'stop' });
  activeWorker.terminate();
  activeWorker = null;
}

function persistLiveVoyageIfDue(controller: VoyageController): void {
  const now = Date.now();
  if (now - lastLivePersistAt < LIVE_PERSIST_THROTTLE_MS) return;
  lastLivePersistAt = now;
  const { originStarId, destStarId } = useVoyageStore.getState();
  saveLiveVoyage({
    snapshot: controller.snapshot(),
    originStarId,
    destStarId,
    savedAt: now,
  });
}

function attachControllerListeners(
  controller: VoyageController,
  set: (partial: Partial<VoyageStoreState>) => void,
): void {
  controller.on('progress', (progress) => {
    set({
      progress,
      snapshot: controller.snapshot(),
    });
    persistLiveVoyageIfDue(controller);
  });

  controller.on('complete', (progress) => {
    stopWorker();
    clearLiveVoyage();
    set({
      progress,
      snapshot: controller.snapshot(),
    });
    void useVoyageStore.getState().saveToHistory();
  });

  controller.on('abort', (progress) => {
    stopWorker();
    clearLiveVoyage();
    set({
      progress,
      snapshot: controller.snapshot(),
    });
    void useVoyageStore.getState().saveToHistory();
  });

  controller.on('pause', (progress) => {
    set({
      progress,
      snapshot: controller.snapshot(),
    });
  });

  controller.on('resume', (progress) => {
    set({
      progress,
      snapshot: controller.snapshot(),
    });
  });
}

function bindController(
  controller: VoyageController,
  set: (partial: Partial<VoyageStoreState>) => void,
): void {
  if (activeController != null) {
    activeController.dispose();
  }
  activeController = controller;
  attachControllerListeners(controller, set);
  set({
    progress: controller.getProgress(),
    snapshot: controller.snapshot(),
    controllerReady: true,
  });
}

export const useVoyageStore = create<VoyageStore>((set, get) => ({
  progress: null,
  snapshot: null,
  originStarId: null,
  destStarId: null,
  lastSavedRecord: null,
  controllerReady: false,
  resumedFromSnapshot: false,

  prepare: (opts) => {
    const { originStarId = null, destStarId = null, ...voyageOpts } = opts;
    const controller = new VoyageController(voyageOpts);
    controller.setExternalTicker(isWorkerSupported());
    bindController(controller, set);
    lastLivePersistAt = 0;
    set({ originStarId, destStarId, lastSavedRecord: null, resumedFromSnapshot: false });
  },

  start: () => {
    const controller = activeController;
    if (controller == null) {
      throw new Error('VoyageStore.start: controller not prepared');
    }
    const progress = controller.start();
    set({
      progress,
      snapshot: controller.snapshot(),
    });
    if (isWorkerSupported()) startWorker();
    return progress;
  },

  pause: () => {
    const controller = activeController;
    if (controller == null) {
      throw new Error('VoyageStore.pause: controller not prepared');
    }
    const progress = controller.pause();
    stopWorker();
    set({
      progress,
      snapshot: controller.snapshot(),
    });
    return progress;
  },

  resume: () => {
    const controller = activeController;
    if (controller == null) {
      throw new Error('VoyageStore.resume: controller not prepared');
    }
    const progress = controller.resume();
    set({
      progress,
      snapshot: controller.snapshot(),
    });
    if (isWorkerSupported()) startWorker();
    return progress;
  },

  abort: (reason = 'user') => {
    const controller = activeController;
    if (controller == null) {
      throw new Error('VoyageStore.abort: controller not prepared');
    }
    const progress = controller.abort(reason);
    set({
      progress,
      snapshot: controller.snapshot(),
    });
    return progress;
  },

  complete: () => {
    const controller = activeController;
    if (controller == null) {
      throw new Error('VoyageStore.complete: controller not prepared');
    }
    const progress = controller.complete();
    set({
      progress,
      snapshot: controller.snapshot(),
    });
    return progress;
  },

  selectDestination: (destStarId) => {
    set({ destStarId });
  },

  restoreFromSnapshot: (snapshot, meta) => {
    const controller = VoyageController.fromSnapshot(snapshot);
    controller.setExternalTicker(isWorkerSupported());
    bindController(controller, set);
    lastLivePersistAt = 0;
    set({
      originStarId: meta?.originStarId ?? get().originStarId,
      destStarId: meta?.destStarId ?? get().destStarId,
      lastSavedRecord: null,
      resumedFromSnapshot: true,
    });
    if (isWorkerSupported() && controller.getProgress().status === 'running') {
      startWorker();
    }
  },

  dispose: () => {
    stopWorker();
    if (activeController != null) {
      activeController.dispose();
      activeController = null;
    }
    set({
      progress: null,
      snapshot: null,
      originStarId: null,
      destStarId: null,
      controllerReady: false,
      resumedFromSnapshot: false,
    });
  },

  saveToHistory: async () => {
    const { snapshot, originStarId, destStarId, progress } = get();
    if (snapshot == null || progress == null) return null;
    if (progress.status !== 'completed' && progress.status !== 'aborted') return null;

    const { voyageRepo } = getStoreDeps();
    const record = await voyageRepo.save({
      snapshot,
      originStar: originStarId != null ? { id: originStarId } : null,
      destStar: destStarId != null ? { id: destStarId } : null,
    });
    set({ lastSavedRecord: record });
    void useHistoryStore.getState().refresh();
    return record;
  },

  resumeFromLiveVoyage: () => {
    if (useVoyageStore.getState().controllerReady) return false;
    const live = loadLiveVoyage();
    if (live == null) return false;
    try {
      useVoyageStore.getState().restoreFromSnapshot(live.snapshot, {
        originStarId: live.originStarId ?? null,
        destStarId: live.destStarId ?? null,
      });
      return true;
    } catch {
      clearLiveVoyage();
      return false;
    }
  },
}));

export function resetVoyageControllerForTest(): void {
  stopWorker();
  lastLivePersistAt = 0;
  if (activeController != null) {
    activeController.dispose();
    activeController = null;
  }
}

export function fastForwardVoyageForTest(ms: number): void {
  if (activeController != null) {
    activeController.tick(Date.now() + ms);
  }
}
