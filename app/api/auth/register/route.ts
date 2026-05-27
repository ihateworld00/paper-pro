export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
import { registerUser, createToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, phone, password, name } = await req.json();

  if (!email && !phone) {
    return NextResponse.json({ success: false, error: "请输入邮箱或手机号" }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ success: false, error: "密码至少6位" }, { status: 400 });
  }

  const result = registerUser({
    email: (email || "").trim(),
    phone: (phone || "").trim(),
    password,
    name: (name || "").trim(),
  });

  if (!result.success || !result.user) {
    return NextResponse.json({ success: false, error: result.error || "注册失败" }, { status: 400 });
  }

  const token = createToken(result.user.id);
  return NextResponse.json({ success: true, token, user: result.user });
}
