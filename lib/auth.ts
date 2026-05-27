import crypto from "crypto";
import fs from "fs";
import path from "path";

const USERS_FILE = path.join(process.cwd(), "data", "users.json");
const SALT_ROUNDS = 16;

interface User {
  id: string;
  email: string;
  phone: string;
  password: string;  // sha256(salt + password)
  salt: string;
  name: string;
  avatar: string;
  createdAt: string;
  vipExpire: string | null;
  freeUsed: number;
}

function readUsers(): User[] {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function writeUsers(users: User[]) {
  const dir = path.dirname(USERS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || crypto.randomBytes(SALT_ROUNDS).toString("hex");
  const h = crypto.createHash("sha256").update(s + password).digest("hex");
  return { hash: h, salt: s };
}

/** 注册 */
export function registerUser(params: { email: string; phone: string; password: string; name: string }): { success: boolean; error?: string; user?: Omit<User, "password" | "salt"> } {
  const users = readUsers();

  if (params.email && users.some((u) => u.email === params.email)) {
    return { success: false, error: "该邮箱已被注册" };
  }
  if (params.phone && users.some((u) => u.phone === params.phone)) {
    return { success: false, error: "该手机号已被注册" };
  }

  const { hash, salt } = hashPassword(params.password);
  const user: User = {
    id: crypto.randomUUID(),
    email: params.email || "",
    phone: params.phone || "",
    password: hash,
    salt,
    name: params.name || params.email || params.phone || "用户",
    avatar: "",
    createdAt: new Date().toISOString(),
    vipExpire: null,
    freeUsed: 0,
  };

  users.push(user);
  writeUsers(users);

  const { password: _, salt: __, ...safe } = user;
  return { success: true, user: safe };
}

/** 登录 */
export function loginUser(params: { account: string; password: string }): { success: boolean; error?: string; token?: string; user?: Omit<User, "password" | "salt"> } {
  const users = readUsers();
  const user = users.find((u) => u.email === params.account || u.phone === params.account);
  if (!user) {
    return { success: false, error: "账号不存在" };
  }

  const { hash } = hashPassword(params.password, user.salt);
  if (hash !== user.password) {
    return { success: false, error: "密码错误" };
  }

  // 生成登录令牌
  const token = crypto.createHash("sha256").update(user.id + Date.now().toString()).digest("hex");
  const { password: _, salt: __, ...safe } = user;

  return { success: true, token, user: safe };
}

/** 验证令牌 */
export function verifyToken(token: string): Omit<User, "password" | "salt"> | null {
  // 简单实现：令牌包含用户ID的哈希
  // 实际生产环境应使用JWT
  const users = readUsers();
  // 遍历查找（简化实现）
  // 令牌只是用来确认登录态，真正的验证在me接口
  return null; // 实际验证由 /api/auth/me 处理
}

/** 获取用户信息 */
export function getUserById(id: string): Omit<User, "password" | "salt"> | null {
  const users = readUsers();
  const user = users.find((u) => u.id === id);
  if (!user) return null;
  const { password: _, salt: __, ...safe } = user;
  return safe;
}

/** 更新用户VIP状态 */
export function updateUserVip(id: string, expireDate: string): boolean {
  const users = readUsers();
  const user = users.find((u) => u.id === id);
  if (!user) return false;
  user.vipExpire = expireDate;
  writeUsers(users);
  return true;
}

/** 更新用户免费使用次数 */
export function incrementUserFreeUsed(id: string): { freeUsed: number; maxFree: number } {
  const users = readUsers();
  const user = users.find((u) => u.id === id);
  if (!user) return { freeUsed: 0, maxFree: 2 };
  user.freeUsed += 1;
  writeUsers(users);
  return { freeUsed: user.freeUsed, maxFree: 2 };
}

/** 生成登录令牌（存到内存） */
const tokenStore = new Map<string, string>(); // token → userId

export function createToken(userId: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  tokenStore.set(token, userId);
  // 24小时过期
  setTimeout(() => tokenStore.delete(token), 24 * 60 * 60 * 1000);
  return token;
}

export function getUserIdByToken(token: string): string | null {
  return tokenStore.get(token) || null;
}

export function removeToken(token: string): void {
  tokenStore.delete(token);
}
