import { useMemo } from 'react';

import { Toggle } from '@/components/Toggle';
import type { AmbientSoundTypeKey } from '@/contract/storage-types';
import { useI18n, type I18nKey } from '@/i18n';
import { useSettingsStore } from '@/store/useSettingsStore';

const AMBIENT_OPTIONS: { value: AmbientSoundTypeKey; labelKey: I18nKey }[] = [
  { value: 'none', labelKey: 'sound.ambientNone' },
  { value: 'cmb', labelKey: 'sound.ambientCmb' },
  { value: 'pulsar', labelKey: 'sound.ambientPulsar' },
];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-deep-300">{label}</span>
      {children}
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="range"
      min={0}
      max={1}
      step={0.01}
      aria-label={label}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-8 w-32 cursor-pointer accent-[var(--color-star-gold)]"
    />
  );
}

export function SoundSettingsPanel() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const { t } = useI18n();

  const ambientOption = useMemo(
    () => AMBIENT_OPTIONS.find((o) => o.value === settings.ambientSoundType) ?? AMBIENT_OPTIONS[0]!,
    [settings.ambientSoundType],
  );

  return (
    <section data-testid="sound-settings" className="glass-card space-y-6 rounded-2xl p-8">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-medium tracking-wide">{t('sound.title')}</h3>
        <span className="text-xs text-deep-400">{t('sound.subtitle')}</span>
      </div>

      <div className="space-y-5">
        <Row label={t('sound.engineHum')}>
          <div className="flex items-center gap-3">
            <Slider
              label={t('sound.engineHumVolume')}
              value={settings.musicVolume}
              onChange={(v) => void updateSettings({ musicVolume: v })}
            />
            <Toggle
              label={t('sound.engineHum')}
              checked={settings.engineSoundEnabled}
              onChange={(v) => void updateSettings({ engineSoundEnabled: v })}
            />
          </div>
        </Row>

        <Row label={t('sound.ambient')}>
          <select
            aria-label={t('sound.ambient')}
            value={settings.ambientSoundType}
            onChange={(e) =>
              void updateSettings({ ambientSoundType: e.target.value as AmbientSoundTypeKey })
            }
            className="h-9 cursor-pointer rounded-lg border border-[var(--color-glass-border)] bg-[var(--color-glass)] px-2.5 text-sm text-foreground focus:border-star-blue focus:outline-none"
          >
            {AMBIENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.labelKey)}
              </option>
            ))}
          </select>
        </Row>

        {settings.ambientSoundType !== 'none' && (
          <Row label={t('sound.ambientVolume')}>
            <Slider
              label={t('sound.ambientVolume')}
              value={settings.musicVolume}
              onChange={(v) => void updateSettings({ musicVolume: v })}
            />
          </Row>
        )}

        <Row label={t('sound.eventSounds')}>
          <Toggle
            label={t('sound.eventSounds')}
            checked={settings.eventSoundsEnabled}
            onChange={(v) => void updateSettings({ eventSoundsEnabled: v })}
          />
        </Row>

        {ambientOption.value !== 'none' && (
          <p className="text-xs text-deep-400">
            {t('sound.ambientPlayNote', { label: t(ambientOption.labelKey) })}
          </p>
        )}
      </div>
    </section>
  );
}
