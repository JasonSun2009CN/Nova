import { useMemo } from 'react';

import { Toggle } from '@/components/Toggle';
import type { AmbientSoundTypeKey } from '@/contract/storage-types';
import { useSettingsStore } from '@/store/useSettingsStore';

const AMBIENT_OPTIONS: { value: AmbientSoundTypeKey; label: string }[] = [
  { value: 'none', label: '关闭' },
  { value: 'cmb', label: '宇宙微波背景' },
  { value: 'pulsar', label: '脉冲星节奏' },
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

  const ambientOption = useMemo(
    () => AMBIENT_OPTIONS.find((o) => o.value === settings.ambientSoundType) ?? AMBIENT_OPTIONS[0]!,
    [settings.ambientSoundType],
  );

  return (
    <section data-testid="sound-settings" className="glass-card space-y-6 rounded-2xl p-8">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-medium tracking-wide">音效</h3>
        <span className="text-xs text-deep-500">航行背景与事件提示</span>
      </div>

      <div className="space-y-5">
        <Row label="引擎嗡鸣">
          <div className="flex items-center gap-3">
            <Slider
              label="引擎嗡鸣音量"
              value={settings.musicVolume}
              onChange={(v) => void updateSettings({ musicVolume: v })}
            />
            <Toggle
              label="引擎嗡鸣"
              checked={settings.engineSoundEnabled}
              onChange={(v) => void updateSettings({ engineSoundEnabled: v })}
            />
          </div>
        </Row>

        <Row label="环境音">
          <select
            aria-label="环境音"
            value={settings.ambientSoundType}
            onChange={(e) =>
              void updateSettings({ ambientSoundType: e.target.value as AmbientSoundTypeKey })
            }
            className="h-9 cursor-pointer rounded-lg border border-[var(--color-glass-border)] bg-[var(--color-glass)] px-2.5 text-sm text-foreground focus:border-star-blue focus:outline-none"
          >
            {AMBIENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Row>

        {settings.ambientSoundType !== 'none' && (
          <Row label="环境音音量">
            <Slider
              label="环境音音量"
              value={settings.musicVolume}
              onChange={(v) => void updateSettings({ musicVolume: v })}
            />
          </Row>
        )}

        <Row label="事件音效（启动 / 到达 / 中断）">
          <Toggle
            label="事件音效"
            checked={settings.eventSoundsEnabled}
            onChange={(v) => void updateSettings({ eventSoundsEnabled: v })}
          />
        </Row>

        {ambientOption.value !== 'none' && (
          <p className="text-xs text-deep-500">{ambientOption.label}将随航行播放</p>
        )}
      </div>
    </section>
  );
}
