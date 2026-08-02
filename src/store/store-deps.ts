import { NovaDatabase } from '@/storage/NovaDatabase';
import { SettingsRepository } from '@/storage/SettingsRepository';
import { VoyageRepository } from '@/storage/VoyageRepository';

export type StoreDeps = {
  db: NovaDatabase;
  voyageRepo: VoyageRepository;
  settingsRepo: SettingsRepository;
};

let deps: StoreDeps = createDefaultDeps();

function createDefaultDeps(): StoreDeps {
  const db = new NovaDatabase();
  return {
    db,
    voyageRepo: new VoyageRepository(db),
    settingsRepo: new SettingsRepository(db),
  };
}

export function getStoreDeps(): StoreDeps {
  return deps;
}

export function setStoreDepsForTest(next: StoreDeps): void {
  deps = next;
}

export function resetStoreDepsForTest(): void {
  deps = createDefaultDeps();
}
