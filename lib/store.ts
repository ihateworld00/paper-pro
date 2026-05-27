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

/** 检查登录用户的VIP状态 */
function isVipFromLogin(): boolean {
  try {
    const raw = localStorage.getItem("auth_user");
    if (!raw) return false;
    const user = JSON.parse(raw);
    if (user.vipExpire && new Date(user.vipExpire) > new Date()) return true;
  } catch {}
  return false;
}

export function useOnce(): boolean {
  // 登录用户VIP → 无限使用
  if (isVipFromLogin()) return true;

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
  if (isVipFromLogin()) return 999;
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
