export type VoyageTimerWorkerRequest = { type: 'start'; intervalMs: number } | { type: 'stop' };

export type VoyageTimerWorkerResponse = { type: 'tick'; ts: number };
