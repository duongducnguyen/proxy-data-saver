import { app } from 'electron';

const API_URL = 'https://app.woware.net/api/items/single?item_id=4';

function parseVersion(v: string): number[] {
  return v.split('.').map(n => parseInt(n) || 0);
}

function isNewer(latest: string, current: string): boolean {
  const l = parseVersion(latest);
  const c = parseVersion(current);
  for (let i = 0; i < Math.max(l.length, c.length); i++) {
    const lv = l[i] ?? 0;
    const cv = c[i] ?? 0;
    if (lv > cv) return true;
    if (lv < cv) return false;
  }
  return false;
}

export interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion: string;
  currentVersion: string;
}

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  try {
    const currentVersion = app.getVersion();
    const response = await fetch(API_URL, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return null;

    const data = await response.json();
    const latestVersion: string = data?.item?.version;
    if (!latestVersion) return null;

    return {
      hasUpdate: isNewer(latestVersion, currentVersion),
      latestVersion,
      currentVersion
    };
  } catch (err) {
    console.error('Update check failed:', err);
    return null;
  }
}
