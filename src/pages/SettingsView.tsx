import { NotificationSettingsPanel } from '@/components/NotificationSettingsPanel';
import { SoundSettingsPanel } from '@/components/SoundSettingsPanel';
import { useI18n } from '@/i18n';

type SettingsViewProps = {
  onBack: () => void;
};

export function SettingsView({ onBack }: SettingsViewProps) {
  const { t } = useI18n();

  return (
    <section data-testid="settings-view" className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-[var(--color-glass-border)] px-4 py-3 sm:px-6">
        <button
          type="button"
          aria-label={t('common.close')}
          onClick={onBack}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-deep-300 transition-colors hover:text-foreground"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="font-display text-base font-medium tracking-wide">{t('app.settings')}</h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-6">
          <SoundSettingsPanel />
          <NotificationSettingsPanel />
        </div>
      </div>
    </section>
  );
}
