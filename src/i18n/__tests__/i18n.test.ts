import { describe, expect, it } from 'vitest';

import { en, zh, type I18nKey } from '@/i18n/dictionaries';

const KEYS = Object.keys(zh) as I18nKey[];

function placeholders(s: string): string[] {
  const out: string[] = [];
  for (const m of s.matchAll(/\{(\w+)\}/g)) out.push(m[1]!);
  return out.sort();
}

describe('i18n 字典', () => {
  it('zh 与 en 键完全一致', () => {
    expect(Object.keys(en).sort()).toEqual([...KEYS].sort());
  });

  it('每条目的 {占位符} 在 zh 与 en 中一致', () => {
    for (const key of KEYS) {
      expect(placeholders(en[key])).toEqual(placeholders(zh[key]));
    }
  });

  it('en 无残留中文，zh 核心文案存在', () => {
    for (const key of KEYS) {
      expect(en[key]).not.toMatch(/[一-鿿]/);
    }
    expect(zh['setup.start']).toBe('启动航行');
    expect(zh['result.completed']).toBe('本次航行完成');
  });
});
