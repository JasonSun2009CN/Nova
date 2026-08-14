import type { AppLanguage } from '@/contract/storage-types';
import type { VoyageRecord } from '@/contract/storage-types';
import { getDestinationName } from '@/data/destination-stars';
import { summarizeCaptainsLog } from '@/engine';
import { formatFocusEstimate, formatLy } from '@/utils/format';

const MS_PER_MINUTE = 60_000;

function originLabel(starId: string | null, lang: AppLanguage): string {
  if (starId == null) return lang === 'en' ? 'Deep space' : '深空出发';
  if (starId === 'hip-sol') return lang === 'en' ? 'Solar System' : '太阳系';
  return getDestinationName(starId) ?? (lang === 'en' ? 'Solar System' : '太阳系');
}

function destinationLabel(starId: string | null, lang: AppLanguage): string {
  if (starId == null) return lang === 'en' ? 'Free drift' : '自由漂流';
  return getDestinationName(starId) ?? (lang === 'en' ? 'Unknown star' : '未知星');
}

function formatFullDateTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatLyInLanguage(ly: number, lang: AppLanguage): string {
  if (lang === 'en') return formatLy(ly);
  return formatLy(ly).replace(/ ly$/, ' 光年');
}

export function buildVoyageLogMarkdown(
  records: readonly VoyageRecord[],
  endTime = Date.now(),
  lang: AppLanguage = 'zh',
): string {
  const summary = summarizeCaptainsLog(records, endTime);
  const lines: string[] = [];
  lines.push(lang === 'en' ? '# NOVA Interstellar Travel Log' : '# NOVA 星际旅行经过');
  lines.push('');
  lines.push(
    [
      lang === 'en' ? `${records.length} voyages` : `共 ${records.length} 次航行`,
      `${lang === 'en' ? 'Total focus' : '累计专注'} ${formatFocusEstimate(
        summary.totalFocusMs / MS_PER_MINUTE,
        lang,
      )}`,
      `${lang === 'en' ? 'Total distance' : '累计航行'} ${formatLyInLanguage(summary.totalTraveledLy, lang)}`,
      `${lang === 'en' ? 'Explored' : '已探索'} ${summary.exploredStarCount} ${lang === 'en' ? 'stars' : '颗恒星'}`,
      `${lang === 'en' ? 'Streak' : '连续专注'} ${summary.streakDays}${lang === 'en' ? 'd' : ' 天'}`,
    ].join(' · '),
  );
  lines.push('');
  lines.push(
    lang === 'en'
      ? '| # | Date | Origin | Destination | Focus | Distance | Status |'
      : '| # | 日期 | 起点 | 终点 | 专注时长 | 距离 | 状态 |',
  );
  lines.push('|---|------|------|------|----------|------|------|');
  records.forEach((record, index) => {
    const status =
      record.status === 'completed'
        ? lang === 'en'
          ? 'Completed'
          : '完成'
        : lang === 'en'
          ? 'Aborted'
          : '中止';
    lines.push(
      [
        `| ${index + 1}`,
        formatFullDateTime(record.createdAt),
        originLabel(record.originStarId, lang),
        destinationLabel(record.destStarId, lang),
        formatFocusEstimate(record.elapsedFocusMs / MS_PER_MINUTE, lang),
        formatLyInLanguage(record.traveledLy, lang),
        `${status} |`,
      ].join(' | '),
    );
  });
  lines.push('');
  return lines.join('\n');
}
