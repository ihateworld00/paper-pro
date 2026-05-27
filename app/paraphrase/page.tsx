"use client";
import { useState } from "react";
import { useOnce, remaining } from "@/lib/store";
import Header from "@/components/Header";

type Mode = "plagiarism" | "ai_rate" | "dual";
type Level = "mild" | "medium" | "deep";

const MODES: { key: Mode; title: string; desc: string; icon: string }[] = [
  { key: "plagiarism", title: "降重复率", desc: "变换句式、替换同义词，降低知网/维普查重率", icon: "🔄" },
  { key: "ai_rate", title: "降AI率", desc: "打破AI写作规律，让文本像真人学者写的", icon: "👤" },
  { key: "dual", title: "双重降重", desc: "同时降低查重率和AI检测率，效果最强", icon: "⚡" },
];

const LEVELS: { k: Level; label: string }[] = [
  { k: "mild", label: "轻度" },
  { k: "medium", label: "中度" },
  { k: "deep", label: "深度" },
];

export default function ParaphrasePage() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("dual");
  const [level, setLevel] = useState<Level>("medium");
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
        body: JSON.stringify({ text: text.trim(), level, mode }),
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
        <h1 className="text-3xl font-bold mb-2">AI 智能降重</h1>
        <p className="text-gray-500 mb-2">
          从 SpeedAI / PaperPass 等平台查出重复段落后，粘贴到这里进行针对性改写。
        </p>
        <p className="text-sm text-gray-400 mb-6">
          剩余免费次数：<span className="text-primary font-bold">{remaining()}</span>
        </p>

        {/* 模式选择 */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-600 mb-2">改写模式</p>
          <div className="grid grid-cols-3 gap-3">
            {MODES.map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`p-3 rounded-xl border-2 text-left transition ${
                  mode === m.key
                    ? "border-primary bg-blue-50 shadow-sm"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-xl mb-1">{m.icon}</div>
                <div className="font-bold text-sm">{m.title}</div>
                <div className="text-xs text-gray-400 mt-0.5">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 改写强度 */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-600 mb-2">改写强度</p>
          <div className="flex gap-2">
            {LEVELS.map((l) => (
              <button
                key={l.k}
                onClick={() => setLevel(l.k)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                  level === l.k
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* 输入区 */}
        <textarea
          className="w-full h-48 p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm leading-relaxed"
          placeholder="粘贴从查重报告/AI检测报告中标记的段落...
例如：
- 第3段 重复率82% → 粘贴到这里
- 第7段 AI率91% → 粘贴到这里
每段单独粘贴效果最好"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
          className="mt-4 w-full py-3 gradient-primary text-white font-semibold rounded-xl disabled:opacity-50 transition"
        >
          {loading ? "AI 改写中..." : "开始改写"}
        </button>

        {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}

        {/* 结果区 */}
        {result && (
          <div className="mt-8 space-y-4">
            <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">改写结果</h3>
                <button
                  onClick={() => navigator.clipboard.writeText(result)}
                  className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition"
                >
                  一键复制
                </button>
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{result}</p>
            </div>

            {/* 对比 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <h4 className="font-bold text-sm text-red-700 mb-2">改写前</h4>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <h4 className="font-bold text-sm text-green-700 mb-2">改写后</h4>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{result}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
