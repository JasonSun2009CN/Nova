import { useState } from 'react';

import { Toggle } from '@/components/Toggle';
import { useI18n } from '@/i18n';
import { useSettingsStore } from '@/store/useSettingsStore';
import { getNotificationPermission, requestNotificationPermission } from '@/utils/notifications';

type PermissionState = NotificationPermission | 'unsupported';

export function NotificationSettingsPanel() {
  const enabled = useSettingsStore((s) => s.settings.browserNotificationsEnabled);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const { t } = useI18n();
  const [permission, setPermission] = useState<PermissionState>(() => getNotificationPermission());

  const supported = permission !== 'unsupported';

  const handleToggle = async (next: boolean) => {
    void updateSettings({ browserNotificationsEnabled: next });
    if (next) {
      const result = await requestNotificationPermission();
      setPermission(result);
    }
  };

  const statusText = !supported
    ? t('notif.unsupported')
    : permission === 'granted'
      ? t('notif.granted')
      : permission === 'denied'
        ? t('notif.denied')
        : t('notif.firstOpen');

  return (
    <section data-testid="notification-settings" className="glass-card space-y-5 rounded-2xl p-8">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-medium tracking-wide">{t('notif.title')}</h3>
        <span className="text-xs text-deep-400">{t('notif.subtitle')}</span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-deep-300">{t('notif.enable')}</span>
        <Toggle
          label={t('notif.enableToggle')}
          checked={enabled}
          disabled={!supported}
          onChange={(value) => void handleToggle(value)}
        />
      </div>

      <p data-testid="notification-permission-status" className="text-xs text-deep-400">
        {statusText}
      </p>
    </section>
  );
}
