export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
import { loginUser, createToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { account, password } = await req.json();
  if (!account || !password) {
    return NextResponse.json({ success: false, error: "请输入账号和密码" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ success: false, error: "密码至少6位" }, { status: 400 });
  }

  const result = loginUser({ account: account.trim(), password });
  if (!result.success || !result.user) {
    return NextResponse.json({ success: false, error: result.error || "登录失败" }, { status: 401 });
  }

  const token = createToken(result.user.id);
  return NextResponse.json({ success: true, token, user: result.user });
}
