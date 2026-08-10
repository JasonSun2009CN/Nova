export type FocusNotificationType = 'complete' | 'aborted';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return window.Notification.permission;
}

export async function requestNotificationPermission(): Promise<
  NotificationPermission | 'unsupported'
> {
  if (!isNotificationSupported()) return 'unsupported';
  if (window.Notification.permission !== 'default') return window.Notification.permission;
  return window.Notification.requestPermission();
}

export function focusNotificationContent(
  type: FocusNotificationType,
  destName: string | null,
): { title: string; body: string } {
  if (type === 'complete') {
    return {
      title: '航行完成',
      body: destName != null ? `已抵达 ${destName}` : '自由漂流专注结束',
    };
  }
  return {
    title: '航行中止',
    body: destName != null ? `中止于前往 ${destName} 途中` : '自由漂流已中止',
  };
}

export function sendFocusNotification(
  type: FocusNotificationType,
  destName: string | null,
): boolean {
  if (!isNotificationSupported()) return false;
  if (window.Notification.permission !== 'granted') return false;
  const { title, body } = focusNotificationContent(type, destName);
  new window.Notification(title, { body });
  return true;
}
