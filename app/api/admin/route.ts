export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

// 管理员密码（可改为环境变量 ADMIN_PASSWORD）
const ADMIN_PWD = process.env.ADMIN_PASSWORD || "paper2026";
// 简单token
const TOKEN_SECRET = process.env.ADMIN_SECRET || "paper-pro-secret";

interface Order {
  id: string;
  plan: "single" | "monthly";
  amount: number;
  status: "pending" | "paid" | "rejected";
  transactionId: string;
  activationCode: string | null;
  createdAt: string;
}

function readOrders(): Order[] {
  try {
    if (!fs.existsSync(ORDERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(ORDERS_FILE, "utf-8"));
  } catch { return []; }
}

function writeOrders(orders: Order[]) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

function genActivationCode(): string {
  const seg = () => crypto.randomBytes(3).toString("hex").toUpperCase();
  return `PAPER-${seg()}-${seg()}`;
}

function checkAuth(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace("Bearer ", "");
  // 简单验证：token = base64(pwd:secret)
  try {
    const decoded = Buffer.from(token, "base64").toString();
    const [pwd, secret] = decoded.split(":");
    return pwd === ADMIN_PWD && secret === TOKEN_SECRET;
  } catch { return false; }
}

/** POST — 登录 or 验证订单 */
export async function POST(req: NextRequest) {
  const body = await req.json();

  // 登录
  if (body.action === "login") {
    if (body.password === ADMIN_PWD) {
      const token = Buffer.from(`${ADMIN_PWD}:${TOKEN_SECRET}`).toString("base64");
      return NextResponse.json({ success: true, token });
    }
    return NextResponse.json({ success: false, error: "密码错误" }, { status: 401 });
  }

  // 验证订单（审核通过）
  if (body.action === "verify") {
    if (!checkAuth(req)) return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
    const orders = readOrders();
    const order = orders.find((o) => o.id === body.orderId);
    if (!order) return NextResponse.json({ success: false, error: "订单不存在" }, { status: 404 });

    order.status = "paid";
    order.activationCode = genActivationCode();
    writeOrders(orders);
    return NextResponse.json({ success: true, activationCode: order.activationCode });
  }

  return NextResponse.json({ success: false, error: "无效操作" }, { status: 400 });
}

/** GET — 获取订单列表 */
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
  const orders = readOrders();
  // 按时间倒序，脱敏返回
  const safe = orders.reverse().map((o) => ({
    id: o.id,
    plan: o.plan,
    amount: o.amount,
    status: o.status,
    transactionId: o.transactionId,
    activationCode: o.activationCode,
    createdAt: o.createdAt,
  }));
  return NextResponse.json({ success: true, orders: safe });
}
