const KEY = "paperpro_usage";

export interface Usage {
  freeUsed: number;
  maxFree: number;
  activated: boolean;
  expireDate: string | null;
}

export function getUsage(): Usage {
  if (typeof window === "undefined") return { freeUsed: 0, maxFree: 2, activated: false, expireDate: null };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { freeUsed: 0, maxFree: 2, activated: false, expireDate: null };
}

export function saveUsage(u: Usage) {
  localStorage.setItem(KEY, JSON.stringify(u));
}

export function useOnce(): boolean {
  const u = getUsage();
  if (u.activated && u.expireDate && new Date(u.expireDate) > new Date()) return true;
  if (u.freeUsed < u.maxFree) {
    u.freeUsed++;
    saveUsage(u);
    return true;
  }
  return false;
}

export function remaining(): number {
  const u = getUsage();
  if (u.activated && u.expireDate && new Date(u.expireDate) > new Date()) return 999;
  return Math.max(0, u.maxFree - u.freeUsed);
}

export function activate(expireDate: string) {
  const u = getUsage();
  u.activated = true;
  u.expireDate = expireDate;
  saveUsage(u);
}
