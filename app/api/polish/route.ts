export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
import { polish } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { text, style } = await req.json();
    if (!text || typeof text !== "string" || text.length < 50) {
      return NextResponse.json({ success: false, error: "文本至少需要50个字符" }, { status: 400 });
    }
    const result = await polish(text, style || "academic");
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "服务器错误" }, { status: 500 });
  }
}
