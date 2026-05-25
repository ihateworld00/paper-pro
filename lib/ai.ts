const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const BASE = "https://api.deepseek.com/v1";

async function chat(system: string, prompt: string): Promise<string> {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });
  if (!res.ok) throw new Error(`AI调用失败: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

/** 论文降重 */
export async function paraphrase(text: string, level: "mild" | "medium" | "deep" = "medium") {
  const levelMap = { mild: "轻度改写，保留原文风格和大部分句式", medium: "中度改写，调整句式结构、替换同义词", deep: "深度改写，完全重组句子结构、变换表达方式" };
  const sys = "你是学术论文改写专家，精通中文论文降重技巧。输出改写后的文本，保持原意不变，但表达方式完全不同。";
  const res = await chat(sys, `请对以下论文内容进行${levelMap[level]}，保持学术严谨性和原意不变，仅返回改写结果：\n\n${text}`);
  return { success: true, data: { result: res, level } };
}

/** 论文润色 */
export async function polish(text: string, style: "academic" | "concise" | "fluent" = "academic") {
  const styleMap = {
    academic: "使用更专业的学术表达，增强学术性",
    concise: "精炼语言，删除冗余，让表达更简洁有力",
    fluent: "优化语句流畅度，改善可读性",
  };
  const sys = "你是学术论文润色专家，擅长提升论文的语言质量。保留原文结构和内容，仅优化表达。";
  const res = await chat(sys, `请对以下论文进行润色（${styleMap[style]}）。返回JSON：{"result":"润色后全文","changes":[{"original":"原文","revised":"修改后","reason":"修改原因"}]}\n\n${text}`);
  try {
    const cleaned = res.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return { success: true, data: JSON.parse(cleaned) };
  } catch {
    return { success: true, data: { result: res, changes: [] } };
  }
}

/** 开题报告生成 */
export async function generateProposal(topic: string, direction: string) {
  const sys = "你是学术研究导师，擅长指导研究生撰写开题报告。请生成专业、详实的开题报告内容。";
  const prompt = `请为以下论文题目生成开题报告框架：
题目：${topic}
研究方向：${direction || "未指定"}

返回JSON：
{
  "title": "论文题目",
  "background": "选题背景与研究意义（300字）",
  "literature": "国内外研究现状综述（400字，列出5个关键研究方向）",
  "objectives": ["研究目标1", "目标2", "目标3"],
  "content": "主要研究内容（分4-5个章节描述）",
  "methods": ["研究方法1", "方法2", "方法3"],
  "innovations": ["创新点1", "创新点2"],
  "timeline": [{"phase":"阶段名","duration":"时长","tasks":"任务描述"}],
  "references": [{"author":"作者","title":"文献标题","source":"期刊/出版社","year":"年份"}]
}`;

  const res = await chat(sys, prompt);
  try {
    const cleaned = res.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return { success: true, data: JSON.parse(cleaned) };
  } catch {
    return { success: true, data: { title: topic, background: res, literature: "", objectives: [], content: "", methods: [], innovations: [], timeline: [], references: [] } };
  }
}

/** 文献综述辅助 */
export async function literatureReview(topic: string, keywords: string) {
  const sys = "你是学术文献综述写作专家，擅长梳理研究脉络和归纳学术观点。";
  const prompt = `请为主题"${topic}"（关键词：${keywords || topic}）撰写一篇文献综述框架。返回JSON：
{
  "overview": "研究领域概述（200字）",
  "schools": [{"name":"学派/方向名称","representatives":["学者1","学者2"],"coreIdeas":"核心观点","contributions":"主要贡献","limitations":"局限性"}],
  "timeline": [{"period":"时间段","developments":"该时期的主要进展"}],
  "frontiers": ["前沿热点1","热点2","热点3"],
  "summary": "总结与展望（150字）"
}`;
  const res = await chat(sys, prompt);
  try {
    const cleaned = res.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return { success: true, data: JSON.parse(cleaned) };
  } catch {
    return { success: true, data: { overview: res } };
  }
}
