"use client";
import { useState, useRef } from "react";
import { useOnce, remaining } from "@/lib/store";
import Header from "@/components/Header";

export default function ProposalPage() {
  const [topic, setTopic] = useState("");
  const [direction, setDirection] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [htmlContent, setHtmlContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      const ext = f.name.split(".").pop()?.toLowerCase();
      if (ext !== "docx" && ext !== "doc" && ext !== "pdf") {
        setError("仅支持 Word(.docx/.doc) 和 PDF 文件");
        return;
      }
      if (f.size > 20 * 1024 * 1024) {
        setError("文件大小不能超过20MB");
        return;
      }
      setFile(f);
      setError("");
      // 如果没有输入题目，用文件名作为默认题目
      if (!topic.trim()) {
        setTopic(f.name.replace(/\.[^/.]+$/, ""));
      }
    }
  }

  async function handleSubmit() {
    if (!topic.trim()) { setError("请输入论文题目"); return; }
    setError("");
    if (!useOnce()) {
      setError("免费次数已用完，请先升级会员");
      return;
    }
    setLoading(true);
    setResult(null);

    try {
      const form = new FormData();
      form.append("topic", topic.trim());
      form.append("direction", direction.trim());
      form.append("format", "json");
      if (file) form.append("file", file);

      const res = await fetch("/api/proposal", { method: "POST", body: form });
      const data = await res.json();

      if (data.success) {
        setResult(data.data);
        setHtmlContent(data.html || "");
      } else {
        setError(data.error || "生成失败");
      }
    } catch {
      setError("网络错误，请重试");
    }
    setLoading(false);
  }

  async function downloadDocx() {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("topic", topic.trim());
      form.append("direction", direction.trim());
      form.append("format", "docx");
      if (file) form.append("file", file);

      const res = await fetch("/api/proposal", { method: "POST", body: form });
      if (!res.ok) throw new Error("下载失败");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${topic}_开题报告.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Word下载失败");
    }
    setLoading(false);
  }

  function openPdfPreview() {
    if (!htmlContent) return;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(htmlContent);
      win.document.close();
    }
  }

  return (
    <div className="flex-1">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-10 page-enter">
        <h1 className="text-3xl font-bold mb-2">开题报告生成</h1>
        <p className="text-gray-500 mb-6">
          输入题目，上传已有初稿（可选），AI生成完整开题报告。
          剩余免费次数：<span className="text-primary font-bold">{remaining()}</span>
        </p>

        {/* 输入区域 */}
        <div className="space-y-4 mb-6">
          <input
            className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            placeholder="论文题目 *  例如：基于深度学习的股票价格预测研究"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <input
            className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            placeholder="研究方向（可选）  例如：金融科技、机器学习"
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
          />

          {/* 文件上传区域 */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.doc,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
              file
                ? "border-green-500 bg-green-50"
                : "border-blue-400 bg-blue-50/50 hover:border-blue-500 hover:bg-blue-50"
            }`}
          >
            {file ? (
              <div>
                <p className="text-4xl mb-3">📄</p>
                <p className="text-green-700 font-bold text-lg">{file.name}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {(file.size / 1024).toFixed(1)} KB · 已选择
                </p>
                <p className="text-xs text-blue-500 mt-2 font-medium">点击此处重新选择文件</p>
              </div>
            ) : (
              <div>
                <p className="text-5xl mb-3">📁</p>
                <p className="text-gray-800 font-bold text-lg">点击上传已有初稿</p>
                <p className="text-sm text-gray-500 mt-2">支持 Word (.docx / .doc) 和 PDF 文件，最大 20MB</p>
                <p className="text-xs text-blue-500 mt-2 font-medium">AI 将参考初稿内容，生成更精准的开题报告</p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !topic.trim()}
          className="w-full py-3 gradient-primary text-white font-semibold rounded-xl disabled:opacity-50 transition"
        >
          {loading ? "AI 生成中..." : "生成开题报告"}
        </button>

        {error && <p className="mt-4 text-red-500 text-sm text-center">{error}</p>}

        {/* 生成结果 */}
        {result && (
          <div className="mt-8 space-y-4">
            {/* 下载按钮 */}
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={downloadDocx} className="px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition flex items-center gap-2">
                <span>📄</span> 下载Word文档
              </button>
              <button onClick={openPdfPreview} className="px-6 py-3 bg-white border-2 border-primary text-primary font-medium rounded-xl hover:bg-blue-50 transition flex items-center gap-2">
                <span>🖨</span> 预览/导出PDF
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center">Word文档包含完整学术格式（黑体标题、宋体正文、标准行距）</p>
            <p className="text-xs text-gray-400 text-center">PDF导出：在新窗口打开后按 Ctrl+P → 另存为PDF</p>

            {/* 结果预览 */}
            <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-lg mb-3">生成预览</h3>
              <Section title="论文题目" content={result.title as string} />
              <Section title="选题背景与研究意义" content={result.background as string} />
              <Section title="国内外研究现状" content={result.literature as string} />
              {Array.isArray(result.objectives) && (
                <div className="mb-4">
                  <h4 className="font-bold text-sm mb-2 text-gray-700">研究目标</h4>
                  <ul className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                    {(result.objectives as string[]).map((o, i) => <li key={i}>{o}</li>)}
                  </ul>
                </div>
              )}
              <Section title="研究内容" content={result.content as string} />
              {Array.isArray(result.methods) && (
                <div className="mb-4">
                  <h4 className="font-bold text-sm mb-2 text-gray-700">研究方法</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {(result.methods as string[]).map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                </div>
              )}
              {Array.isArray(result.innovations) && (
                <div className="mb-4">
                  <h4 className="font-bold text-sm mb-2 text-gray-700">创新点</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {(result.innovations as string[]).map((v, i) => <li key={i}>{v}</li>)}
                  </ul>
                </div>
              )}
              {Array.isArray(result.timeline) && (result.timeline as { phase: string; duration: string; tasks: string }[]).length > 0 && (
                <div className="mb-4">
                  <h4 className="font-bold text-sm mb-2 text-gray-700">进度安排</h4>
                  <div className="space-y-2">
                    {(result.timeline as { phase: string; duration: string; tasks: string }[]).map((t, i) => (
                      <div key={i} className="flex gap-3 text-sm">
                        <span className="text-primary font-medium min-w-[100px]">{t.phase}</span>
                        <span className="text-gray-400 min-w-[80px]">{t.duration}</span>
                        <span className="text-gray-600">{t.tasks}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {Array.isArray(result.references) && (result.references as { author: string; title: string; source: string; year: string }[]).length > 0 && (
                <div className="mb-4">
                  <h4 className="font-bold text-sm mb-2 text-gray-700">参考文献</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                    {(result.references as { author: string; title: string; source: string; year: string }[]).map((r, i) => (
                      <li key={i}>{r.author}. {r.title}[J]. {r.source}, {r.year}.</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, content }: { title: string; content?: string }) {
  if (!content) return null;
  return (
    <div className="mb-4">
      <h4 className="font-bold text-sm mb-2 text-gray-700">{title}</h4>
      <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">{content}</p>
    </div>
  );
}
