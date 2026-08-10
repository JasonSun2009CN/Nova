import { useState } from 'react';

import { Toggle } from '@/components/Toggle';
import { useSettingsStore } from '@/store/useSettingsStore';
import { getNotificationPermission, requestNotificationPermission } from '@/utils/notifications';

type PermissionState = NotificationPermission | 'unsupported';

export function NotificationSettingsPanel() {
  const enabled = useSettingsStore((s) => s.settings.browserNotificationsEnabled);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
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
    ? '当前浏览器不支持通知'
    : permission === 'granted'
      ? '已授权浏览器通知'
      : permission === 'denied'
        ? '浏览器拒绝了通知权限，请在浏览器设置中允许 Nova'
        : '首次开启时会请求浏览器通知权限';

  return (
    <section data-testid="notification-settings" className="glass-card space-y-5 rounded-2xl p-8">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-medium tracking-wide">通知</h3>
        <span className="text-xs text-deep-400">专注结束提醒</span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-deep-300">浏览器通知（完成 / 中断时）</span>
        <Toggle
          label="浏览器通知"
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
