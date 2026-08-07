import {
  createAudioEngine,
  type AudioContextLike,
  type AudioEngine,
} from '@/engine/audio/audio-engine';
import { NovaDatabase } from '@/storage/NovaDatabase';
import { SettingsRepository } from '@/storage/SettingsRepository';
import { StarCatalogRepository } from '@/storage/StarCatalogRepository';
import { VoyageRepository } from '@/storage/VoyageRepository';

export type StoreDeps = {
  db: NovaDatabase;
  voyageRepo: VoyageRepository;
  settingsRepo: SettingsRepository;
  starCatalogRepo: StarCatalogRepository;
  audioEngine: AudioEngine;
};

let deps: StoreDeps = createDefaultDeps();

function createDefaultDeps(): StoreDeps {
  const db = new NovaDatabase();
  return {
    db,
    voyageRepo: new VoyageRepository(db),
    settingsRepo: new SettingsRepository(db),
    starCatalogRepo: new StarCatalogRepository(db),
    audioEngine: createAudioEngine(),
  };
}

export function getStoreDeps(): StoreDeps {
  return deps;
}

export function setStoreDepsForTest(next: Partial<StoreDeps>): void {
  deps = { ...createDefaultDeps(), ...next };
}

export function resetStoreDepsForTest(): void {
  deps = createDefaultDeps();
}

export function ensureAudioEngineStarted(): void {
  const { audioEngine } = deps;
  if (audioEngine.started) return;
  if (typeof AudioContext === 'undefined') return;
  void audioEngine.ensureStarted(() => new AudioContext() as unknown as AudioContextLike);
}
