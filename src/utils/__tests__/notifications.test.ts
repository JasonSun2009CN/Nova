import { describe, expect, it } from 'vitest';

import {
  focusNotificationContent,
  getNotificationPermission,
  isNotificationSupported,
  sendFocusNotification,
} from '@/utils/notifications';

describe('utils/notifications 浏览器通知（S33）', () => {
  it('focusNotificationContent：完成/中止 + 目的星/自由漂流组合出正确文案', () => {
    expect(focusNotificationContent('complete', '比邻星 Proxima Centauri')).toEqual({
      title: '航行完成',
      body: '已抵达 比邻星 Proxima Centauri',
    });
    expect(focusNotificationContent('complete', null)).toEqual({
      title: '航行完成',
      body: '自由漂流专注结束',
    });
    expect(focusNotificationContent('aborted', '织女一 (天琴座 α Vega)')).toEqual({
      title: '航行中止',
      body: '中止于前往 织女一 (天琴座 α Vega) 途中',
    });
    expect(focusNotificationContent('aborted', null)).toEqual({
      title: '航行中止',
      body: '自由漂流已中止',
    });
  });

  it('jsdom 无 Notification：不支持探测与发送安全返回 false', () => {
    expect(isNotificationSupported()).toBe(false);
    expect(getNotificationPermission()).toBe('unsupported');
    expect(sendFocusNotification('complete', '比邻星')).toBe(false);
    expect(sendFocusNotification('aborted', null)).toBe(false);
  });
});
