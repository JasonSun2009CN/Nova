import type { SpectralClass } from '@/engine/contract/catalog-types';

export function formatDurationMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

export function formatLy(ly: number): string {
  if (ly >= 100) return `${ly.toFixed(0)} ly`;
  if (ly >= 1) return `${ly.toFixed(2)} ly`;
  return `${ly.toFixed(3)} ly`;
}

export function formatGamma(gamma: number): string {
  return `×${gamma.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatVOverC(vOverC: number): string {
  for (let decimals = 3; decimals <= 15; decimals += 1) {
    if (Number(vOverC.toFixed(decimals)) < 1) {
      return `${vOverC.toFixed(decimals)}c`;
    }
  }
  return `${vOverC.toPrecision(16)}c`;
}

export function formatDateTime(ts: number): string {
  const d = new Date(ts);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hh}:${mm}`;
}

export function formatMinuteLabel(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) {
    return `${hours}小时${minutes}分`;
  }
  if (hours > 0) {
    return `${hours}小时`;
  }
  return `${minutes}分钟`;
}

const MINUTES_PER_DAY = 60 * 24;
const MINUTES_PER_YEAR = 60 * 24 * 365;

export function formatFocusEstimate(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return '—';
  if (totalMinutes < 1) return '不足 1 分钟';
  if (totalMinutes < 60) return `${Math.round(totalMinutes)} 分钟`;
  if (totalMinutes < MINUTES_PER_DAY) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return minutes > 0 ? `${hours} 小时 ${minutes} 分` : `${hours} 小时`;
  }
  if (totalMinutes < MINUTES_PER_YEAR) {
    return `${Math.round(totalMinutes / MINUTES_PER_DAY)} 天`;
  }
  return `约 ${(totalMinutes / MINUTES_PER_YEAR).toFixed(1)} 年`;
}

export function formatSpectral(spectral: SpectralClass): string {
  const subclass = spectral.subclass != null ? String(spectral.subclass) : '';
  const luminosity = spectral.luminosityClass ?? '';
  return `${spectral.type}${subclass}${luminosity}`;
}

export function formatMagnitude(m: number): string {
  return m.toFixed(2);
}

export function formatKelvin(k: number): string {
  return `${Math.round(k).toLocaleString('en-US')} K`;
}
