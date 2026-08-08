import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { NotificationSettingsPanel } from '@/components/NotificationSettingsPanel';
import { DEFAULT_SETTINGS } from '@/storage/SettingsRepository';
import { resetStoreDepsForTest, useSettingsStore } from '@/store/index';

describe('NotificationSettingsPanel（S33 浏览器通知）', () => {
  afterEach(() => {
    useSettingsStore.setState({
      settings: { ...DEFAULT_SETTINGS },
      hydrated: false,
      loading: false,
      error: null,
    });
    resetStoreDepsForTest();
  });

  it('jsdom 无 Notification：开关禁用 + 显示不支持提示', () => {
    render(<NotificationSettingsPanel />);
    const toggle = screen.getByRole('switch', { name: '浏览器通知' });
    expect(toggle).toBeDisabled();
    expect(screen.getByTestId('notification-permission-status')).toHaveTextContent(/不支持通知/);
  });
});
