import { useMemo, useRef, useState } from 'react';

import { starDisplayName, starDistanceLy } from '@/data/destination-stars';
import { searchStars } from '@/data/star-search';
import type { Star } from '@/engine';
import { useI18n } from '@/i18n';
import type { CatalogStatus } from '@/store/useCatalogStore';
import { formatLy } from '@/utils/format';

type StarSearchProps = {
  stars: readonly Star[];
  status: CatalogStatus;
  onSelect: (star: Star) => void;
};

const MAX_RESULTS = 7;

export function StarSearch({ stars, status, onSelect }: StarSearchProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const loading = status !== 'ready';
  const results = useMemo(() => searchStars(stars, query, MAX_RESULTS), [stars, query]);
  const showDropdown = open && query.trim().length > 0;

  const handlePick = (star: Star) => {
    onSelect(star);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div data-testid="star-search" className="relative w-64 max-w-[calc(100vw-32px)]">
      <label htmlFor="star-search-input" className="sr-only">
        {t('starmap.searchLabel')}
      </label>
      <input
        id="star-search-input"
        ref={inputRef}
        type="search"
        inputMode="search"
        placeholder={t('starmap.searchPlaceholder')}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="glass-card h-10 w-full rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass)] px-3.5 text-sm text-foreground placeholder:text-deep-400 focus:border-star-blue focus:outline-none"
      />
      {showDropdown && (
        <ul
          data-testid="star-search-results"
          className="glass-card absolute left-0 right-0 top-11 z-20 max-h-64 overflow-auto rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass)] py-1"
        >
          {loading ? (
            <li className="px-3.5 py-2.5 text-xs text-deep-400">{t('starmap.searchLoading')}</li>
          ) : results.length === 0 ? (
            <li className="px-3.5 py-2.5 text-xs text-deep-400">{t('starmap.searchNoResults')}</li>
          ) : (
            results.map(({ star }) => (
              <li key={star.id}>
                <button
                  type="button"
                  data-testid="star-search-result"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handlePick(star)}
                  className="flex w-full cursor-pointer items-center justify-between gap-2 px-3.5 py-2 text-left text-sm transition-colors hover:bg-white/5"
                >
                  <span className="truncate text-foreground">{starDisplayName(star)}</span>
                  <span className="shrink-0 font-mono text-xs text-deep-400 tabular-nums">
                    {formatLy(starDistanceLy(star))}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
