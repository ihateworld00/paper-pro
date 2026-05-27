import * as mammoth from "mammoth";
import { createRequire } from "node:module";
const req = createRequire(import.meta.url || __filename);
// pdf-parse 导出 PDFParse 函数
const pdfParseMod = req("pdf-parse") as { PDFParse: (buf: Buffer) => Promise<{ text: string }> };

/** 从 Word (.docx) 文件中提取文本 */
export async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

/** 从 PDF 文件中提取文本 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdf = new pdfParseMod.PDFParse(new Uint8Array(buffer));
  await pdf.load();
  const result = await pdf.getText();
  return result.text || "";
}

interface ProposalData {
  title: string;
  background: string;
  literature: string;
  objectives: string[];
  content: string;
  methods: string[];
  innovations: string[];
  timeline: { phase: string; duration: string; tasks: string }[];
  references: { author: string; title: string; source: string; year: string }[];
}

/** 生成开题报告 Word 文档（HTML格式，Word/WPS完美打开） */
export function generateProposalDocx(data: ProposalData): Buffer {
  const html = generateProposalHtml(data)
    .replace("<!DOCTYPE html>", `<!DOCTYPE html>\n<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->`)
    .replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">');
  return Buffer.from(html, "utf-8");
}

/** 生成开题报告 HTML（用于预览和PDF导出） */
export function generateProposalHtml(data: ProposalData): string {
  const today = new Date().toLocaleDateString("zh-CN");

  const refs = data.references.length > 0
    ? data.references.map((r, i) => `<p class="ref">[${i + 1}] ${r.author}. ${r.title}[J]. ${r.source}, ${r.year}.</p>`).join("\n") : "";

  const objectives = data.objectives.length > 0
    ? data.objectives.map((o, i) => `<p>${i + 1}. ${o}</p>`).join("\n") : "";

  const methods = data.methods.length > 0
    ? data.methods.map((m, i) => `<p>${i + 1}. ${m}</p>`).join("\n") : "";

  const innovations = data.innovations.length > 0
    ? data.innovations.map((v, i) => `<p>${i + 1}. ${v}</p>`).join("\n") : "";

  const timeline = data.timeline.length > 0
    ? data.timeline.map((t) => `<p><strong>${t.phase}</strong>（${t.duration}）：${t.tasks}</p>`).join("\n") : "";

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>开题报告 — ${data.title}</title>
<style>
  @page { margin: 2.5cm 2cm; size: A4; }
  body { font-family: "宋体", SimSun, serif; font-size: 14px; line-height: 1.8; color: #000; max-width: 700px; margin: 0 auto; padding: 20px; }
  .cover { text-align: center; padding: 60px 0 40px; }
  .cover h1 { font-family: "黑体", SimHei, sans-serif; font-size: 28px; margin-bottom: 24px; }
  .cover .title { font-family: "黑体", SimHei, sans-serif; font-size: 18px; font-weight: bold; margin-bottom: 12px; }
  .cover .date { font-size: 13px; color: #666; }
  h2 { font-family: "黑体", SimHei, sans-serif; font-size: 18px; margin: 32px 0 12px; border-bottom: 1px solid #000; padding-bottom: 4px; }
  p { text-indent: 2em; margin: 0 0 6px; }
  .ref { text-indent: 0; font-size: 12px; }
  @media print {
    body { padding: 0; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
<div class="no-print" style="text-align:right;margin-bottom:20px;">
  <button onclick="window.print()" style="padding:8px 24px;background:#1e40af;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;">打印 / 导出PDF</button>
</div>
<div class="cover">
  <h1>毕业论文开题报告</h1>
  <div class="title">题目：${data.title}</div>
  <div class="date">生成日期：${today}</div>
</div>
<h2>一、选题背景与研究意义</h2>
<p>${data.background}</p>
<h2>二、国内外研究现状</h2>
<p>${data.literature}</p>
<h2>三、研究目标</h2>
${objectives}
<h2>四、主要研究内容</h2>
<p>${data.content}</p>
<h2>五、研究方法</h2>
${methods}
<h2>六、创新点</h2>
${innovations}
<h2>七、研究进度安排</h2>
${timeline}
<h2>八、参考文献</h2>
${refs}
</body>
</html>`;
}
