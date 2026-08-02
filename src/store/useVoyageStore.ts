import { create } from 'zustand';

import type { VoyageRecord } from '@/contract/storage-types';
import type {
  VoyageAbortReason,
  VoyageOptions,
  VoyageProgress,
  VoyageSnapshot,
} from '@/engine/contract/voyage-types';
import { VoyageController } from '@/engine/navigation/VoyageController';
import { getStoreDeps } from '@/store/store-deps';
import { useHistoryStore } from '@/store/useHistoryStore';

type VoyageStoreState = {
  progress: VoyageProgress | null;
  snapshot: VoyageSnapshot | null;
  originStarId: string | null;
  destStarId: string | null;
  lastSavedRecord: VoyageRecord | null;
  controllerReady: boolean;
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
};

export type VoyageStore = VoyageStoreState & VoyageStoreActions;

let activeController: VoyageController | null = null;

function attachControllerListeners(
  controller: VoyageController,
  set: (partial: Partial<VoyageStoreState>) => void,
): void {
  controller.on('progress', (progress) => {
    set({
      progress,
      snapshot: controller.snapshot(),
    });
  });

  controller.on('complete', (progress) => {
    set({
      progress,
      snapshot: controller.snapshot(),
    });
    void useVoyageStore.getState().saveToHistory();
  });

  controller.on('abort', (progress) => {
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

  prepare: (opts) => {
    const { originStarId = null, destStarId = null, ...voyageOpts } = opts;
    const controller = new VoyageController(voyageOpts);
    bindController(controller, set);
    set({ originStarId, destStarId, lastSavedRecord: null });
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
    return progress;
  },

  pause: () => {
    const controller = activeController;
    if (controller == null) {
      throw new Error('VoyageStore.pause: controller not prepared');
    }
    const progress = controller.pause();
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
    bindController(controller, set);
    set({
      originStarId: meta?.originStarId ?? get().originStarId,
      destStarId: meta?.destStarId ?? get().destStarId,
      lastSavedRecord: null,
    });
  },

  dispose: () => {
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
}));

export function resetVoyageControllerForTest(): void {
  if (activeController != null) {
    activeController.dispose();
    activeController = null;
  }
}
