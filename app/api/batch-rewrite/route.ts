export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
import { parseReport, parsePdfReport, batchRewrite, generateMarkedDocx } from "@/lib/batch";
import { extractDocxText } from "@/lib/document";

function detectType(name: string): "pdf" | "txt" | "docx" | "unknown" {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return "pdf";
  if (ext === "txt") return "txt";
  if (ext === "docx" || ext === "doc") return "docx";
  return "unknown";
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let rawText = "";
    let title = "未命名文档";
    let level: "mild" | "medium" | "deep" = "deep";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File | null;
      title = (form.get("title") as string) || "未命名文档";
      level = (form.get("level") as string || "deep") as typeof level;
      const textInput = form.get("text") as string;

      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileType = detectType(file.name);

        if (fileType === "pdf") {
          const result = await parsePdfReport(buffer);
          rawText = result.fullText;
        } else if (fileType === "txt") {
          rawText = buffer.toString("utf-8");
        } else if (fileType === "docx") {
          rawText = await extractDocxText(buffer);
        } else {
          return NextResponse.json({ success: false, error: "仅支持 PDF / TXT / Word 文件" }, { status: 400 });
        }

        if (!rawText || rawText.trim().length < 30) {
          return NextResponse.json({ success: false, error: "未能从文件中提取到有效文本（至少30字），请尝试粘贴文本" }, { status: 400 });
        }
      } else if (textInput && textInput.trim().length >= 30) {
        rawText = textInput.trim();
      } else {
        return NextResponse.json({ success: false, error: "请上传文件或粘贴报告文本" }, { status: 400 });
      }
    } else {
      const body = await req.json();
      rawText = body.text || "";
      title = body.title || "未命名文档";
      level = body.level || "deep";
      if (!rawText || rawText.length < 30) {
        return NextResponse.json({ success: false, error: "文本至少需要30个字符" }, { status: 400 });
      }
    }

    // 1. 解析报告，提取被标记段落
    const { sections, fullText } = parseReport(rawText);

    if (sections.length === 0) {
      return NextResponse.json({
        success: true,
        noSections: true,
        message: "未检测到明显标记段落。请确保文本包含查重百分比标记（如：重复率82%）。你也可以手动粘贴带标记的文本。",
      });
    }

    // 2. 批量改写
    const rewritten = await batchRewrite(sections, level);

    // 3. 生成预览数据
    const preview = rewritten
      .filter((s) => s.rewritten && s.rewritten !== s.text)
      .map((s) => ({
        original: s.text,
        rewritten: s.rewritten,
        type: s.type,
        score: s.score,
      }));

    const url = new URL(req.url);

    // 预览模式：返回JSON
    if (url.searchParams.get("format") === "preview") {
      return NextResponse.json({ success: true, preview, total: preview.length });
    }

    // 4. 默认返回 Word 文档
    const docxBuffer = generateMarkedDocx(fullText, rewritten, title);
    return new NextResponse(new Uint8Array(docxBuffer), {
      headers: {
        "Content-Type": "application/msword",
        "Content-Disposition": "attachment; filename=rewrite_report.doc",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "服务器错误" },
      { status: 500 }
    );
  }
}
