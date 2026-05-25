import { NextRequest, NextResponse } from "next/server";
import { generateProposal } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { topic, direction } = await req.json();
    if (!topic || typeof topic !== "string" || topic.length < 5) {
      return NextResponse.json({ success: false, error: "题目至少需要5个字符" }, { status: 400 });
    }
    const result = await generateProposal(topic, direction || "");
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "服务器错误" }, { status: 500 });
  }
}
