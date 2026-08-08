import type { VoyageRecord } from '@/contract/storage-types';
import { getDestinationName } from '@/data/destination-stars';
import { summarizeCaptainsLog } from '@/engine';
import { formatFocusEstimate, formatLy } from '@/utils/format';

const MS_PER_MINUTE = 60_000;

function originLabel(starId: string | null): string {
  if (starId == null) return '深空出发';
  if (starId === 'hip-sol') return '太阳系';
  return getDestinationName(starId) ?? '太阳系';
}

function destinationLabel(starId: string | null): string {
  if (starId == null) return '自由漂流';
  return getDestinationName(starId) ?? '未知星';
}

function formatFullDateTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatLyInChinese(ly: number): string {
  return formatLy(ly).replace(/ ly$/, ' 光年');
}

export function buildVoyageLogMarkdown(
  records: readonly VoyageRecord[],
  endTime = Date.now(),
): string {
  const summary = summarizeCaptainsLog(records, endTime);
  const lines: string[] = [];
  lines.push('# NOVA 星际旅行经过');
  lines.push('');
  lines.push(
    [
      `> 共 ${records.length} 次航行`,
      `累计专注 ${formatFocusEstimate(summary.totalFocusMs / MS_PER_MINUTE)}`,
      `累计航行 ${formatLyInChinese(summary.totalTraveledLy)}`,
      `已探索 ${summary.exploredStarCount} 颗恒星`,
      `连续专注 ${summary.streakDays} 天`,
    ].join(' · '),
  );
  lines.push('');
  lines.push('| # | 日期 | 起点 | 终点 | 专注时长 | 距离 | 状态 |');
  lines.push('|---|------|------|------|----------|------|------|');
  records.forEach((record, index) => {
    const status = record.status === 'completed' ? '完成' : '中止';
    lines.push(
      [
        `| ${index + 1}`,
        formatFullDateTime(record.createdAt),
        originLabel(record.originStarId),
        destinationLabel(record.destStarId),
        formatFocusEstimate(record.elapsedFocusMs / MS_PER_MINUTE),
        formatLyInChinese(record.traveledLy),
        `${status} |`,
      ].join(' | '),
    );
  });
  lines.push('');
  return lines.join('\n');
}
