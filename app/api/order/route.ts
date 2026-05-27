import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

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
  } catch {
    return [];
  }
}

function writeOrders(orders: Order[]) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

function genOrderId(): string {
  const now = new Date();
  const ts = now.toISOString().slice(2, 10).replace(/-/g, "") + now.toTimeString().slice(0, 5).replace(/:/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PP${ts}${rand}`;
}

const PLANS: Record<string, number> = { single: 9.9, monthly: 29.9 };

/** POST — 创建订单 */
export async function POST(req: NextRequest) {
  const { plan } = await req.json();
  if (!plan || !PLANS[plan]) {
    return NextResponse.json({ success: false, error: "无效的方案" }, { status: 400 });
  }
  const order: Order = {
    id: genOrderId(),
    plan,
    amount: PLANS[plan],
    status: "pending",
    transactionId: "",
    activationCode: null,
    createdAt: new Date().toISOString(),
  };
  const orders = readOrders();
  orders.push(order);
  writeOrders(orders);
  return NextResponse.json({ success: true, orderId: order.id, amount: order.amount });
}

/** PUT — 用户提交交易单号 */
export async function PUT(req: NextRequest) {
  const { orderId, transactionId } = await req.json();
  if (!orderId || !transactionId) {
    return NextResponse.json({ success: false, error: "缺少订单号或交易单号" }, { status: 400 });
  }
  const orders = readOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) return NextResponse.json({ success: false, error: "订单不存在" }, { status: 404 });
  if (order.status !== "pending") return NextResponse.json({ success: false, error: "订单已处理" }, { status: 400 });

  order.transactionId = transactionId.trim();
  writeOrders(orders);
  return NextResponse.json({ success: true, msg: "已提交，等待管理员审核" });
}

/** GET — 查询订单状态 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, error: "缺少订单号" }, { status: 400 });
  const orders = readOrders();
  const order = orders.find((o) => o.id === id);
  if (!order) return NextResponse.json({ success: false, error: "订单不存在" }, { status: 404 });
  return NextResponse.json({
    success: true,
    order: { id: order.id, plan: order.plan, amount: order.amount, status: order.status, activationCode: order.activationCode },
  });
}
