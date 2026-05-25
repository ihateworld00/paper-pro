"use client";
import { useState } from "react";
import { useOnce, remaining } from "@/lib/store";
import Header from "@/components/Header";
import Link from "next/link";

export default function ParaphrasePage() {
  const [text, setText] = useState("");
  const [level, setLevel] = useState<"mild" | "medium" | "deep">("medium");
  const [result, setResult] = useState("");
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
      const res = await fetch("/api/paraphrase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), level }),
      });
      const data = await res.json();
      if (data.success) setResult(data.data.result);
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
        <h1 className="text-3xl font-bold mb-2">AI 论文降重</h1>
        <p className="text-gray-500 mb-6">
          智能改写，在不改变原意的前提下降低重复率。
          剩余免费次数：<span className="text-primary font-bold">{remaining()}</span>
        </p>

        {/* 降重强度选择 */}
        <div className="flex gap-2 mb-4">
          {[
            { k: "mild", label: "轻度改写" },
            { k: "medium", label: "中度改写" },
            { k: "deep", label: "深度改写" },
          ].map(({ k, label }) => (
            <button
              key={k}
              onClick={() => setLevel(k as typeof level)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                level === k ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <textarea
          className="w-full h-64 p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm leading-relaxed"
          placeholder="粘贴需要降重的论文段落..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
          className="mt-4 w-full py-3 gradient-primary text-white font-semibold rounded-xl disabled:opacity-50 transition"
        >
          {loading ? "AI 降重中..." : "开始降重"}
        </button>

        {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}

        {result && (
          <div className="mt-8 p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">降重结果</h3>
              <button
                onClick={() => navigator.clipboard.writeText(result)}
                className="text-sm text-primary hover:underline"
              >
                一键复制
              </button>
            </div>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{result}</p>
          </div>
        )}
      </div>
    </div>
  );
}
