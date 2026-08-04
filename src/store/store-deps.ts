import { NovaDatabase } from '@/storage/NovaDatabase';
import { SettingsRepository } from '@/storage/SettingsRepository';
import { StarCatalogRepository } from '@/storage/StarCatalogRepository';
import { VoyageRepository } from '@/storage/VoyageRepository';

export type StoreDeps = {
  db: NovaDatabase;
  voyageRepo: VoyageRepository;
  settingsRepo: SettingsRepository;
  starCatalogRepo: StarCatalogRepository;
};

let deps: StoreDeps = createDefaultDeps();

function createDefaultDeps(): StoreDeps {
  const db = new NovaDatabase();
  return {
    db,
    voyageRepo: new VoyageRepository(db),
    settingsRepo: new SettingsRepository(db),
    starCatalogRepo: new StarCatalogRepository(db),
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
