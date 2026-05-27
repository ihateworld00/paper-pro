import { NextRequest, NextResponse } from "next/server";
import { generateProposal } from "@/lib/ai";
import { extractDocxText, extractPdfText, generateProposalDocx, generateProposalHtml } from "@/lib/document";

function detectFileType(name: string): "docx" | "pdf" | "unknown" {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "docx" || ext === "doc") return "docx";
  if (ext === "pdf") return "pdf";
  return "unknown";
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let topic: string;
    let direction = "";
    let format = "json";
    let draftText = "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      topic = (form.get("topic") as string) || "";
      direction = (form.get("direction") as string) || "";
      format = (form.get("format") as string) || "json";
      const file = form.get("file") as File | null;

      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const ft = detectFileType(file.name);
        if (ft === "docx") draftText = await extractDocxText(buffer);
        else if (ft === "pdf") draftText = await extractPdfText(buffer);
        else return NextResponse.json({ success: false, error: "仅支持 Word(.docx/.doc) 和 PDF 文件" }, { status: 400 });
        if (!draftText || draftText.trim().length < 20) {
          return NextResponse.json({ success: false, error: "未能从文件中提取到有效文本内容" }, { status: 400 });
        }
      }
    } else {
      const body = await req.json();
      topic = body.topic || "";
      direction = body.direction || "";
      format = body.format || "json";
    }

    if (!topic || topic.length < 5) {
      return NextResponse.json({ success: false, error: "题目至少需要5个字符" }, { status: 400 });
    }

    const result = await generateProposal(topic, direction, draftText);
    if (!result.success || !result.data) {
      return NextResponse.json(result, { status: 500 });
    }

    const data = result.data as Record<string, unknown>;

    // Word 文档下载（HTML格式，Word/WPS完美打开）
    if (format === "docx") {
      const buf = generateProposalDocx(data as Parameters<typeof generateProposalDocx>[0]);
      return new NextResponse(buf, {
        headers: {
          "Content-Type": "application/msword",
          "Content-Disposition": "attachment; filename=proposal.doc",
        },
      });
    }

    // HTML 预览/PDF打印
    if (format === "html") {
      return new NextResponse(generateProposalHtml(data as Parameters<typeof generateProposalHtml>[0]), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // 默认 JSON + HTML
    return NextResponse.json({
      ...result,
      html: generateProposalHtml(data as Parameters<typeof generateProposalHtml>[0]),
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "服务器错误" }, { status: 500 });
  }
}
