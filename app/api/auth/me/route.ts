export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
import { getUserIdByToken, getUserById } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
  }

  const userId = getUserIdByToken(token);
  if (!userId) {
    return NextResponse.json({ success: false, error: "登录已过期" }, { status: 401 });
  }

  const user = getUserById(userId);
  if (!user) {
    return NextResponse.json({ success: false, error: "用户不存在" }, { status: 404 });
  }

  return NextResponse.json({ success: true, user });
}
