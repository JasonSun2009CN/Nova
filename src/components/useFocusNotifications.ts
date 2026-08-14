import { useEffect, useRef } from 'react';

import { getDestinationName } from '@/data/destination-stars';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useVoyageStore } from '@/store/useVoyageStore';
import { sendFocusNotification } from '@/utils/notifications';

export function useFocusNotifications(): void {
  const status = useVoyageStore((s) => s.progress?.status ?? 'idle');
  const destStarId = useVoyageStore((s) => s.destStarId);
  const enabled = useSettingsStore((s) => s.settings.browserNotificationsEnabled);
  const lang = useSettingsStore((s) => s.settings.language);
  const prevStatusRef = useRef(status);

  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;
    if (!enabled) return;
    if (prev === 'running' && (status === 'completed' || status === 'aborted')) {
      sendFocusNotification(
        status === 'completed' ? 'complete' : 'aborted',
        getDestinationName(destStarId),
        lang,
      );
    }
  }, [status, destStarId, enabled, lang]);
}
