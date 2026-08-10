import { useCallback } from 'react';

import type { AppLanguage } from '@/contract/storage-types';
import { dictionaries, type I18nKey } from '@/i18n/dictionaries';
import { useSettingsStore } from '@/store/useSettingsStore';

type I18nParams = Record<string, string | number>;

export function useI18n() {
  const lang = useSettingsStore((s) => s.settings.language);
  const setLang = useCallback((next: AppLanguage) => {
    void useSettingsStore.getState().updateSettings({ language: next });
  }, []);
  const t = useCallback(
    (key: I18nKey, params?: I18nParams) => {
      let s: string = dictionaries[lang][key];
      if (params != null) {
        for (const [k, v] of Object.entries(params)) {
          s = s.replace(`{${k}}`, String(v));
        }
      }
      return s;
    },
    [lang],
  );
  return { t, lang, setLang };
}
