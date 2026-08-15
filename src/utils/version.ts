export type VersionParts = {
  major: number;
  minor: number;
  patch: number;
};

export function parseVersion(input: string): VersionParts | null {
  const normalized = input.trim().replace(/^v/i, '');
  const parts = normalized.split('.');
  if (parts.length < 2 || parts.length > 3) return null;
  const nums: number[] = [];
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return null;
    nums.push(Number.parseInt(part, 10));
  }
  return { major: nums[0]!, minor: nums[1]!, patch: nums[2] ?? 0 };
}

export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (pa == null || pb == null) return 0;
  for (const key of ['major', 'minor', 'patch'] as const) {
    if (pa[key] < pb[key]) return -1;
    if (pa[key] > pb[key]) return 1;
  }
  return 0;
}

export function isVersionNewer(latest: string, current: string): boolean {
  return compareVersions(latest, current) > 0;
}
