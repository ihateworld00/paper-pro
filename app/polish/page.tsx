"use client";
import { useState } from "react";
import { useOnce, remaining } from "@/lib/store";
import Header from "@/components/Header";

export default function PolishPage() {
  const [text, setText] = useState("");
  const [style, setStyle] = useState<"academic" | "concise" | "fluent">("academic");
  const [result, setResult] = useState<{ result: string; changes: { original: string; revised: string; reason: string }[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!text.trim()) return;
    setError("");
    if (!useOnce()) {
      setError("免费次数已用完，请先升级会员");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), style }),
      });
      const data = await res.json();
      if (data.success) setResult(data.data);
      else setError(data.error || "处理失败");
    } catch {
      setError("网络错误，请重试");
    }
    setLoading(false);
  }

  return (
    <div className="flex-1">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-10 page-enter">
        <h1 className="text-3xl font-bold mb-2">学术润色</h1>
        <p className="text-gray-500 mb-6">
          提升论文语言质量，让表达更专业。
          剩余免费次数：<span className="text-primary font-bold">{remaining()}</span>
        </p>

        <div className="flex gap-2 mb-4">
          {[
            { k: "academic", label: "学术增强" },
            { k: "concise", label: "精炼简化" },
            { k: "fluent", label: "流畅优化" },
          ].map(({ k, label }) => (
            <button
              key={k}
              onClick={() => setStyle(k as typeof style)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                style === k ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <textarea
          className="w-full h-64 p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm leading-relaxed"
          placeholder="粘贴需要润色的论文内容..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
          className="mt-4 w-full py-3 gradient-primary text-white font-semibold rounded-xl disabled:opacity-50 transition"
        >
          {loading ? "AI 润色中..." : "开始润色"}
        </button>

        {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}

        {result && (
          <div className="mt-8 space-y-4">
            <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-lg mb-4">润色结果</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{result.result}</p>
            </div>

            {result.changes.length > 0 && (
              <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg mb-4">修改详情</h3>
                <div className="space-y-3">
                  {result.changes.map((c, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg text-sm">
                      <div className="flex gap-2 mb-1">
                        <span className="text-red-400 line-through min-w-0 break-all">{c.original}</span>
                        <span className="text-gray-300">→</span>
                        <span className="text-green-600 min-w-0 break-all">{c.revised}</span>
                      </div>
                      <p className="text-gray-400 text-xs">{c.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
