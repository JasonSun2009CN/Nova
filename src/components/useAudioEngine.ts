import { useEffect } from 'react';

import { getStoreDeps } from '@/store/store-deps';
import { useSettingsStore } from '@/store/useSettingsStore';

export function useAudioEngine(): void {
  const settings = useSettingsStore((s) => s.settings);
  const hydrated = useSettingsStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    const { audioEngine } = getStoreDeps();
    audioEngine.setVolumes({ sound: settings.soundVolume, music: settings.musicVolume });
    audioEngine.setHumEnabled(settings.engineSoundEnabled);
    audioEngine.setAmbient(settings.ambientSoundType);
  }, [
    hydrated,
    settings.soundVolume,
    settings.musicVolume,
    settings.engineSoundEnabled,
    settings.ambientSoundType,
  ]);
}
