import { NextRequest, NextResponse } from "next/server";
import { paraphrase } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { text, level, mode } = await req.json();
    if (!text || typeof text !== "string" || text.length < 20) {
      return NextResponse.json({ success: false, error: "文本至少需要20个字符" }, { status: 400 });
    }
    const result = await paraphrase(text, level || "medium", mode || "plagiarism");
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "服务器错误" }, { status: 500 });
  }
}
