"use client";
import { useState, useRef } from "react";
import { useOnce, remaining } from "@/lib/store";
import Header from "@/components/Header";

export default function BatchRewritePage() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState<"mild" | "medium" | "deep">("deep");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ sections: number; message?: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "txt") { setError("仅支持 PDF 和 TXT 文件"); return; }
    if (f.size > 20 * 1024 * 1024) { setError("文件不能超过20MB"); return; }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ""));
    setError("");
  }

  async function handleSubmit() {
    if (!text.trim() && !file) { setError("请粘贴报告文本或上传PDF文件"); return; }
    setError("");
    if (!useOnce()) { setError("免费次数已用完，请先升级会员"); return; }
    setLoading(true);
    setResult(null);

    try {
      // 先获取预览
      const previewUrl = "/api/batch-rewrite?format=preview";
      let previewRes: Response;
      if (file) {
        const form = new FormData();
        form.append("file", file);
        form.append("title", title || "未命名");
        form.append("level", level);
        if (text.trim()) form.append("text", text.trim());
        previewRes = await fetch(previewUrl, { method: "POST", body: form });
      } else {
        previewRes = await fetch(previewUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.trim(), title: title || "未命名", level }),
        });
      }

      const data = await previewRes.json();
      if (data.success) {
        if (data.noSections) {
          setError(data.message || "未检测到标记段落");
        } else {
          setResult({ sections: data.total, message: `共 ${data.total} 处修改，预览如下。点击下方按钮下载完整Word报告。` });
          // 存储预览数据用于展示
          (window as unknown as Record<string, unknown>).__preview = data.preview;
        }
      } else {
        setError(data.error || "处理失败");
      }
    } catch {
      setError("网络错误，请重试");
    }
    setLoading(false);
  }

  async function downloadWord() {
    setLoading(true);
    try {
      let res: Response;
      if (file) {
        const form = new FormData();
        form.append("file", file);
        form.append("title", title || "未命名");
        form.append("level", level);
        if (text.trim()) form.append("text", text.trim());
        res = await fetch("/api/batch-rewrite", { method: "POST", body: form });
      } else {
        res = await fetch("/api/batch-rewrite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.trim(), title: title || "未命名", level }),
        });
      }
      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${title || "改写报告"}_改写报告.doc`;
      a.click();
      URL.revokeObjectURL(downloadUrl);
    } catch {
      setError("下载失败");
    }
    setLoading(false);
  }

  return (
    <div className="flex-1">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-10 page-enter">
        <h1 className="text-3xl font-bold mb-2">批量改写</h1>
        <p className="text-gray-500 mb-2">
          上传 SpeedAI 查重/查AI报告，自动识别高重复率和高AI率段落，批量改写后导出Word文档。
        </p>
        <p className="text-sm text-gray-400 mb-6">
          剩余免费次数：<span className="text-primary font-bold">{remaining()}</span>
        </p>

        {/* 使用说明 */}
        <div className="p-4 bg-blue-50 rounded-xl mb-6 text-sm">
          <p className="font-bold text-blue-800 mb-2">使用方式（二选一）</p>
          <p className="text-blue-700">方式一：上传 SpeedAI 导出的 PDF 报告 → 自动解析标记段落 → 改写 → 下载Word</p>
          <p className="text-blue-700">方式二：直接粘贴报告文本（含百分比标记，如"重复率82%"）→ 改写 → 下载Word</p>
        </div>

        {/* 题目 + 强度 */}
        <div className="flex gap-3 mb-4">
          <input
            className="flex-1 p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="文档标题（可选）"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as typeof level)}
            className="p-3 border border-gray-200 rounded-lg text-sm bg-white"
          >
            <option value="mild">轻度改写</option>
            <option value="medium">中度改写</option>
            <option value="deep">深度改写</option>
          </select>
        </div>

        {/* 文件上传 */}
        <input ref={fileRef} type="file" accept=".pdf,.txt" className="hidden" onChange={handleFile} />
        <div
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition mb-4 ${
            file
              ? "border-green-500 bg-green-50"
              : "border-blue-400 bg-blue-50/50 hover:border-blue-500 hover:bg-blue-50"
          }`}
        >
          {file ? (
            <div>
              <p className="text-4xl mb-3">📄</p>
              <p className="text-green-700 font-bold text-lg">{file.name}</p>
              <p className="text-sm text-gray-500 mt-2">{(file.size / 1024).toFixed(1)} KB · 已选择</p>
              <p className="text-xs text-blue-500 mt-2 font-medium">点击此处重新选择文件</p>
            </div>
          ) : (
            <div>
              <p className="text-5xl mb-3">📁</p>
              <p className="text-gray-800 font-bold text-lg">点击上传 SpeedAI 报告</p>
              <p className="text-sm text-gray-500 mt-2">支持 PDF 和 TXT 文件，最大 20MB</p>
              <p className="text-xs text-blue-500 mt-2 font-medium">也可在下方直接粘贴报告文本</p>
            </div>
          )}
        </div>

        {/* 文本粘贴 */}
        <textarea
          className="w-full h-48 p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm leading-relaxed"
          placeholder={`或者直接粘贴报告文本...

支持的格式示例：
- "第3段 重复率82% 随着互联网技术的发展..."
- "【AI检测段落】人工智能在医疗领域的应用... AI率91%"
- "段落5：相似度67% ...内容..."

AI 会自动识别百分比标记并改写对应段落。`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button
          onClick={handleSubmit}
          disabled={loading || (!text.trim() && !file)}
          className="mt-4 w-full py-3 gradient-primary text-white font-semibold rounded-xl disabled:opacity-50 transition"
        >
          {loading ? "正在解析并改写..." : "开始批量改写 → 下载Word"}
        </button>

        {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}

        {result && (
          <div className="mt-8 space-y-6">
            <p className="text-green-600 text-sm font-medium">{result.message}</p>

            {/* 下载按钮 */}
            <button onClick={downloadWord} disabled={loading} className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition">
              📥 下载完整 Word 报告
            </button>

            {/* 预览 */}
            {typeof window !== "undefined" && ((window as unknown as Record<string, unknown>).__preview as Array<{ original: string; rewritten: string; type: string; score: number }>)?.map((item, i) => {
              const typeLabel = item.type === "plagiarism" ? "降重复率" : item.type === "ai_rate" ? "降AI率" : "双重降重";
              return (
                <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="bg-blue-50 px-5 py-3 border-b border-blue-100 flex items-center gap-3">
                    <span className="font-bold text-blue-800">修改位置 {i + 1}</span>
                    <span className="text-sm text-blue-600">{typeLabel}</span>
                    <span className="text-sm text-gray-400">查重/AI率 {item.score}%</span>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-gray-100">
                    <div className="p-5 bg-red-50/30">
                      <p className="text-xs font-bold text-red-600 mb-2">▎原文（需替换）</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{item.original}</p>
                    </div>
                    <div className="p-5 bg-green-50/30">
                      <p className="text-xs font-bold text-green-600 mb-2">▎改写后（复制替换）</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{item.rewritten}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
