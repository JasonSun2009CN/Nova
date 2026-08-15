import { compareVersions } from '@/utils/version';

export const UPDATE_MANIFEST_URL = 'https://jasonsun2009cn.github.io/Nova/latest.json';
export const UPDATE_SITE_URL = 'https://jasonsun2009cn.github.io/Nova/';

export type LatestReleaseInfo = {
  version: string;
  releasedAt?: string;
  notes?: string;
  downloadUrl?: string;
  siteUrl?: string;
};

export function parseLatestReleaseInfo(json: unknown): LatestReleaseInfo | null {
  if (typeof json !== 'object' || json == null) return null;
  const record = json as Record<string, unknown>;
  if (typeof record.version !== 'string' || record.version.trim() === '') return null;
  const result: LatestReleaseInfo = { version: record.version.trim() };
  for (const key of ['releasedAt', 'notes', 'downloadUrl', 'siteUrl'] as const) {
    if (typeof record[key] === 'string') {
      result[key] = record[key];
    }
  }
  return result;
}

export async function fetchLatestReleaseInfo(
  fetchImpl: typeof fetch = fetch,
): Promise<LatestReleaseInfo | null> {
  try {
    const res = await fetchImpl(UPDATE_MANIFEST_URL);
    if (!res.ok) return null;
    return parseLatestReleaseInfo((await res.json()) as unknown);
  } catch {
    return null;
  }
}

export type UpdateStatus = 'update-available' | 'up-to-date';

export function evaluateUpdate(latest: LatestReleaseInfo, currentVersion: string): UpdateStatus {
  return compareVersions(latest.version, currentVersion) > 0 ? 'update-available' : 'up-to-date';
}
