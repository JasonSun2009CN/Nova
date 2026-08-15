import { useEffect, useState } from 'react';

import { useI18n } from '@/i18n';
import { useSettingsStore } from '@/store/useSettingsStore';
import {
  evaluateUpdate,
  fetchLatestReleaseInfo,
  UPDATE_SITE_URL,
  type LatestReleaseInfo,
} from '@/utils/update-check';

const UPDATE_CHECK_TEST_KEY = 'nova:update-check';

export function UpdateNotice() {
  const { t } = useI18n();
  const hydrated = useSettingsStore((s) => s.hydrated);
  const skippedUpdateVersion = useSettingsStore((s) => s.settings.skippedUpdateVersion);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const [latest, setLatest] = useState<LatestReleaseInfo | null>(null);

  useEffect(() => {
    const testFlag = localStorage.getItem(UPDATE_CHECK_TEST_KEY) === '1';
    if (!import.meta.env.PROD && !testFlag) return;
    let cancelled = false;
    void fetchLatestReleaseInfo().then((info) => {
      if (cancelled || info == null) return;
      setLatest(info);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!hydrated || latest == null) return null;
  if (evaluateUpdate(latest, __APP_VERSION__) !== 'update-available') return null;
  if (latest.version === skippedUpdateVersion) return null;

  const handleSkip = () => {
    void updateSettings({ skippedUpdateVersion: latest.version });
    setLatest(null);
  };

  const href = latest.siteUrl ?? latest.downloadUrl ?? UPDATE_SITE_URL;

  return (
    <div data-testid="update-notice" className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2">
      <div className="glass-card flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl px-5 py-3 shadow-card">
        <p className="font-display text-sm">
          <span className="text-gradient-gold">{t('update.banner')}</span>
          <span className="text-deep-400"> · </span>
          <span className="text-deep-400">
            {t('update.newVersion', { version: latest.version })}
          </span>
        </p>
        <div className="flex items-center gap-2">
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="flex h-9 cursor-pointer items-center rounded-xl bg-[var(--color-star-gold)] px-3 font-display text-xs font-medium text-[var(--color-surface)] transition-colors duration-200 hover:brightness-110"
          >
            {t('update.goToWebsite')}
          </a>
          <button
            type="button"
            onClick={handleSkip}
            className="flex h-9 cursor-pointer items-center rounded-xl border border-[var(--color-glass-border)] px-3 font-display text-xs transition-colors duration-200 hover:text-foreground"
          >
            {t('update.skipVersion')}
          </button>
        </div>
      </div>
    </div>
  );
}
