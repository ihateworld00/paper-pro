"use client";
import { useState } from "react";
import { useOnce, remaining } from "@/lib/store";
import Header from "@/components/Header";

export default function ProposalPage() {
  const [topic, setTopic] = useState("");
  const [direction, setDirection] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!topic.trim()) return;
    setError("");
    if (!useOnce()) {
      setError("免费次数已用完，请先升级会员");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), direction: direction.trim() }),
      });
      const data = await res.json();
      if (data.success) setResult(data.data);
      else setError(data.error || "生成失败");
    } catch {
      setError("网络错误，请重试");
    }
    setLoading(false);
  }

  return (
    <div className="flex-1">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-10 page-enter">
        <h1 className="text-3xl font-bold mb-2">开题报告生成</h1>
        <p className="text-gray-500 mb-6">
          AI自动生成完整的开题报告框架。
          剩余免费次数：<span className="text-primary font-bold">{remaining()}</span>
        </p>

        <div className="space-y-4 mb-4">
          <input
            className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            placeholder="输入论文题目，例如：基于深度学习的股票价格预测研究"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <input
            className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            placeholder="研究方向（可选），例如：金融科技、机器学习"
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !topic.trim()}
          className="w-full py-3 gradient-primary text-white font-semibold rounded-xl disabled:opacity-50 transition"
        >
          {loading ? "AI 生成中..." : "生成开题报告"}
        </button>

        {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}

        {result && (
          <div className="mt-8 space-y-6">
            <Section title="论文题目" content={result.title as string} />
            <Section title="选题背景与研究意义" content={result.background as string} />
            <Section title="国内外研究现状" content={result.literature as string} />
            {Array.isArray(result.objectives) && (
              <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg mb-3">研究目标</h3>
                <ul className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                  {(result.objectives as string[]).map((o, i) => <li key={i}>{o}</li>)}
                </ul>
              </div>
            )}
            <Section title="研究内容" content={result.content as string} />
            {Array.isArray(result.methods) && (
              <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg mb-3">研究方法</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  {(result.methods as string[]).map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </div>
            )}
            {Array.isArray(result.innovations) && (
              <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg mb-3">创新点</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  {(result.innovations as string[]).map((v, i) => <li key={i}>{v}</li>)}
                </ul>
              </div>
            )}
            {Array.isArray(result.timeline) && (result.timeline as { phase: string; duration: string; tasks: string }[]).length > 0 && (
              <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg mb-3">进度安排</h3>
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
              <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg mb-3">参考文献</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                  {(result.references as { author: string; title: string; source: string; year: string }[]).map((r, i) => (
                    <li key={i}>{r.author}. {r.title}[J]. {r.source}, {r.year}.</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, content }: { title: string; content?: string }) {
  if (!content) return null;
  return (
    <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
      <h3 className="font-bold text-lg mb-3">{title}</h3>
      <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">{content}</p>
    </div>
  );
}
