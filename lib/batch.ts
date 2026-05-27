import { extractPdfText } from "./document";
import { paraphrase } from "./ai";

/** 被标记的段落 */
export interface FlaggedSection {
  index: number;
  text: string;
  type: "plagiarism" | "ai_rate" | "dual";
  score: number;        // 百分比 0-100
  rewritten?: string;
}

/** 解析查重/AI检测报告，提取被标记段落 */
export function parseReport(rawText: string): { sections: FlaggedSection[]; fullText: string } {
  const sections: FlaggedSection[] = [];

  // 尝试多种 SpeedAI 报告格式
  // 格式1: "段落X: 重复率82% ...内容..." 或 "第X段: 相似度82%"
  // 格式2: "【重复段落】...内容... 相似度82%"
  // 格式3: 表格格式 "| 第3段 | 82% | ... |"

  // 先按段落分割
  const blocks = rawText.split(/\n{2,}/);
  let cleanText = rawText;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim();
    if (!block || block.length < 20) continue;

    // 匹配百分比
    const pctMatch = block.match(/(?:重复率|相似度|AI[率检测]|查重率|抄袭率)[:：\s]*(\d{1,3})[%％]/i);
    const aiMatch = block.match(/(?:AI[率检测]|机器[率检测]|人工智能率)[:：\s]*(\d{1,3})[%％]/i);
    const anyPct = block.match(/(\d{1,3})[%％]/);

    if (pctMatch || aiMatch) {
      const score = parseInt((pctMatch || aiMatch)![1], 10);
      if (score < 20) continue; // 低于20% 不处理

      let type: FlaggedSection["type"] = "dual";
      if (pctMatch && !aiMatch) type = "plagiarism";
      else if (aiMatch && !pctMatch) type = "ai_rate";

      // 提取实际文本内容（去掉标记前缀）
      let text = block
        .replace(/.*?(?:重复率|相似度|AI[率检测]|查重率|抄袭率|机器[率检测]|人工智能率)[:：\s]*\d{1,3}[%％].*?[:：\s]*/i, "")
        .replace(/^[【\[](.+?)[】\]]/, "")
        .trim();

      // 如果文本太短，可能就是标记行，取整段
      if (text.length < 20) text = block;

      sections.push({ index: i, text, type, score });
    } else if (anyPct && parseInt(anyPct[1], 10) >= 30) {
      // 有百分比但格式不标准，可能也是标记段落
      const score = parseInt(anyPct[1], 10);
      let text = block.replace(/\d{1,3}[%％]/, "").trim();
      if (text.length >= 20) {
        sections.push({ index: i, text, type: "dual", score });
      }
    }
  }

  return { sections, fullText: cleanText };
}

/** 从PDF Buffer 中提取文本并解析 */
export async function parsePdfReport(pdfBuffer: Buffer): Promise<{ sections: FlaggedSection[]; fullText: string }> {
  const text = await extractPdfText(pdfBuffer);
  return parseReport(text);
}

/** 批量改写 */
export async function batchRewrite(
  sections: FlaggedSection[],
  level: "mild" | "medium" | "deep" = "deep"
): Promise<FlaggedSection[]> {
  const results: FlaggedSection[] = [];

  for (const s of sections) {
    // 根据标记类型选择改写模式
    const mode = s.type === "plagiarism" ? "plagiarism"
      : s.type === "ai_rate" ? "ai_rate"
      : "dual";

    try {
      const res = await paraphrase(s.text, level, mode);
      results.push({
        ...s,
        rewritten: res.success ? (res.data as { result: string }).result : s.text,
        type: mode,
      });
    } catch {
      results.push({ ...s, rewritten: s.text });
    }
  }

  return results;
}

/** 生成只含修改位置的 Word 文档 */
export function generateMarkedDocx(
  _fullText: string,
  sections: FlaggedSection[],
  title: string
): Buffer {
  const changes = sections.filter((s) => s.rewritten && s.rewritten !== s.text);
  const today = new Date().toLocaleDateString("zh-CN");
  const total = changes.length;
  const plagCount = changes.filter((s) => s.type === "plagiarism" || s.type === "dual").length;
  const aiCount = changes.filter((s) => s.type === "ai_rate" || s.type === "dual").length;

  // 每段改写结果独立展示
  const changeBlocks = changes.map((s, i) => {
    const typeLabel = s.type === "plagiarism" ? "降重复率" : s.type === "ai_rate" ? "降AI率" : "双重降重";
    return `
    <div style="margin-bottom:32px; page-break-inside:avoid;">
      <div style="background:#f0f4ff;padding:10px 14px;border-left:4px solid #2563eb;margin-bottom:12px;">
        <span style="font-family:'黑体',SimHei,sans-serif;font-weight:bold;font-size:15px;">修改位置 ${i + 1}</span>
        <span style="margin-left:12px;color:#666;font-size:13px;">${typeLabel} · 原始查重/AI率 ${s.score}%</span>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr>
          <td style="width:50%;padding:14px;background:#fff5f5;border:1px solid #fecaca;vertical-align:top;">
            <p style="font-family:'黑体',SimHei,sans-serif;font-weight:bold;color:#c00;margin:0 0 8px;font-size:14px;">▎原文（需替换）</p>
            <p style="margin:0;line-height:1.9;color:#333;">${escapeHtml(s.text)}</p>
          </td>
          <td style="width:50%;padding:14px;background:#f0fdf4;border:1px solid #bbf7d0;vertical-align:top;">
            <p style="font-family:'黑体',SimHei,sans-serif;font-weight:bold;color:#166534;margin:0 0 8px;font-size:14px;">▎改写后（复制替换）</p>
            <p style="margin:0;line-height:1.9;color:#333;">${escapeHtml(s.rewritten || "")}</p>
          </td>
        </tr>
      </table>
    </div>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></xml><![endif]-->
<style>
  @page { margin: 2cm 2.5cm; size: A4; }
  body { font-family: "宋体", SimSun, serif; font-size: 13px; color: #000; }
  .header { text-align: center; padding: 30px 0 20px; border-bottom: 2px solid #2563eb; margin-bottom: 24px; }
  .header h1 { font-family: "黑体", SimHei, sans-serif; font-size: 22px; margin: 0 0 6px; }
  .header p { color: #666; margin: 0; font-size: 13px; }
  .summary { margin-bottom: 28px; padding: 14px 18px; background: #f8fafc; border: 1px solid #e2e8f0; }
  .summary table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .summary td { padding: 3px 16px 3px 0; }
  .summary b { color: #2563eb; }
</style>
</head>
<body>
<div class="header">
  <h1>AI 批量改写报告</h1>
  <p>文档：${escapeHtml(title)}　|　生成日期：${today}</p>
</div>

<div class="summary">
  <table>
    <tr>
      <td><b>${total}</b> 处修改</td>
      <td>降重复率 <b>${plagCount}</b> 处</td>
      <td>降AI率 <b>${aiCount}</b> 处</td>
      <td style="color:#888;font-size:12px;">左栏红色=原文　右栏绿色=改写后</td>
    </tr>
  </table>
</div>

${changeBlocks}

<div style="text-align:center;color:#999;font-size:12px;margin-top:30px;padding-top:16px;border-top:1px solid #e5e7eb;">
  论文通 AI 批量改写 · 替换后建议重新查重验证效果
</div>
</body>
</html>`;

  return Buffer.from(html, "utf-8");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
