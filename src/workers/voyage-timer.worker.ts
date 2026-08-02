import type { VoyageTimerWorkerRequest, VoyageTimerWorkerResponse } from '@/contract/worker-types';

type WorkerScope = {
  onmessage: ((event: MessageEvent) => void) | null;
  postMessage: (message: VoyageTimerWorkerResponse) => void;
  setInterval: (handler: () => void, ms?: number) => number;
  clearInterval: (handle: number) => void;
};

const DEFAULT_INTERVAL_MS = 250;
const scope = self as unknown as WorkerScope;

let tickHandle: number | null = null;

scope.onmessage = (message: MessageEvent) => {
  const request = message.data as VoyageTimerWorkerRequest;
  if (request.type === 'start') {
    if (tickHandle != null) return;
    const intervalMs = request.intervalMs > 0 ? request.intervalMs : DEFAULT_INTERVAL_MS;
    tickHandle = scope.setInterval(() => {
      scope.postMessage({ type: 'tick', ts: Date.now() });
    }, intervalMs);
  } else if (request.type === 'stop') {
    if (tickHandle != null) {
      scope.clearInterval(tickHandle);
      tickHandle = null;
    }
  }
};
