import type { VoyageSnapshot, VoyageStatus } from '@/engine/contract/voyage-types';
import type { Cartesian3, CatalogTier, Star } from '@/engine/contract/catalog-types';

export type ThemeKey = 'neutral';

export type VoyageRecord = Readonly<{
  id: string;
  status: VoyageStatus;
  vOverC: number;
  gamma: number;
  focusTotalMs: number | null;
  elapsedFocusMs: number;
  traveledLy: number;
  startWallTime: number;
  endWallTime: number;
  originStarId: string | null;
  originCoords: Cartesian3 | null;
  destStarId: string | null;
  destCoords: Cartesian3 | null;
  snapshot: VoyageSnapshot;
  starsVisitedIds: readonly string[];
  createdAt: number;
  updatedAt: number;
}>;

export type SettingsKey =
  | 'theme'
  | 'defaultFocusMinutes'
  | 'defaultVOverC'
  | 'soundVolume'
  | 'musicVolume'
  | 'enableReducedMotion'
  | 'lastViewedStarId'
  | 'acceptedTermsVersion'
  | 'currentStarId';

export type SettingsValueMap = {
  theme: ThemeKey;
  defaultFocusMinutes: number;
  defaultVOverC: number;
  soundVolume: number;
  musicVolume: number;
  enableReducedMotion: boolean;
  lastViewedStarId: string | null;
  acceptedTermsVersion: string | null;
  currentStarId: string | null;
};

export type SettingsEntry<K extends SettingsKey = SettingsKey> = Readonly<{
  key: K;
  value: SettingsValueMap[K];
  updatedAt: number;
}>;

export type EnginePreferencesSerialized = Readonly<{
  defaultTier: CatalogTier | null;
  highlightSpectral: readonly Star['spectral']['type'][];
}>;

export type StarChunkRecord = Readonly<{
  id: string;
  sourceVersion: string;
  stars: readonly Star[];
  loadedAt: number;
}>;

export type StarCatalogMetaRecord = Readonly<{
  id: 'main';
  sourceVersion: string;
  chunks: readonly string[];
  totalStars: number;
  fetchedAt: number;
}>;
