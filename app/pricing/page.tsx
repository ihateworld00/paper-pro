"use client";
import { useState } from "react";
import { activate } from "@/lib/store";
import Header from "@/components/Header";

const ACTIVATION_MAP: Record<string, { label: string; price: string; days: number }> = {
  single: { label: "单次购买", price: "¥9.9", days: 30 },
  monthly: { label: "月度会员", price: "¥29.9", days: 30 },
};

export default function PricingPage() {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error">("success");

  function handleActivate() {
    setMsg("");
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setMsg("请输入激活码"); setMsgType("error"); return; }

    // 简单离线验证
    if (trimmed.startsWith("PAPER") && trimmed.length === 14) {
      const expire = new Date();
      expire.setMonth(expire.getMonth() + 1);
      activate(expire.toISOString());
      setMsg(`激活成功！有效期至 ${expire.toLocaleDateString("zh-CN")}`);
      setMsgType("success");
      return;
    }

    if (trimmed === "FREE2026") {
      const expire = new Date();
      expire.setDate(expire.getDate() + 7);
      activate(expire.toISOString());
      setMsg(`激活成功（7天体验）！有效期至 ${expire.toLocaleDateString("zh-CN")}`);
      setMsgType("success");
      return;
    }

    setMsg("激活码无效，请检查后重试");
    setMsgType("error");
  }

  return (
    <div className="flex-1">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-10 page-enter">
        <h1 className="text-3xl font-bold mb-2">升级会员</h1>
        <p className="text-gray-500 mb-10">购买激活码后在此输入即可激活，支持单次或包月。</p>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <PriceCard title="免费试用" price="¥0" desc="新用户2次免费" features={["2次完整使用", "全部功能", "无需激活"]} />
          <PriceCard title="单次购买" price="¥9.9" desc="30天内有效" features={["无限次数使用", "全部功能", "优先响应"]} highlight />
          <PriceCard title="月度会员" price="¥29.9" desc="30天无限使用" features={["无限次数使用", "全部功能", "优先响应", "专属客服"]} />
        </div>

        <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm max-w-md mx-auto">
          <h3 className="font-bold text-lg mb-2">输入激活码</h3>
          <p className="text-sm text-gray-500 mb-4">购买后您将获得激活码，在此输入即可激活会员</p>
          <div className="flex gap-2">
            <input
              className="flex-1 p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="输入激活码，如 PAPER-XXXX-XXXX"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleActivate()}
            />
            <button onClick={handleActivate} className="px-6 py-3 gradient-primary text-white font-medium rounded-lg text-sm transition">
              激活
            </button>
          </div>
          {msg && <p className={`mt-3 text-sm ${msgType === "success" ? "text-green-600" : "text-red-500"}`}>{msg}</p>}
          <p className="mt-4 text-xs text-gray-400">测试激活码：FREE2026（7天体验）</p>
        </div>
      </div>
    </div>
  );
}

function PriceCard({ title, price, desc, features, highlight }: { title: string; price: string; desc: string; features: string[]; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-6 border text-left ${highlight ? "border-primary shadow-lg bg-blue-50/50" : "border-gray-200"}`}>
      <h3 className="font-bold text-lg mb-1">{title}</h3>
      <p className="text-2xl font-extrabold mb-1">{price}</p>
      <p className="text-xs text-gray-400 mb-4">{desc}</p>
      <ul className="space-y-2">
        {features.map((f, i) => (
          <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span> {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
