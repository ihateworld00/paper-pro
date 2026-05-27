"use client";
import { useState } from "react";
import Header from "@/components/Header";
import Link from "next/link";

const PLANS: Record<string, { label: string; price: number; desc: string }> = {
  single: { label: "单次购买", price: 9.9, desc: "30天内有效，无限次使用" },
  monthly: { label: "月度会员", price: 29.9, desc: "30天无限使用 + 专属客服" },
};

export default function PayPage() {
  const [step, setStep] = useState<"select" | "pay" | "confirm">("select");
  const [plan, setPlan] = useState("single");
  const [orderId, setOrderId] = useState("");
  const [txId, setTxId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ code?: string; msg?: string }>({});
  const [error, setError] = useState("");

  async function createOrder() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.success) {
        setOrderId(data.orderId);
        setStep("pay");
      } else {
        setError(data.error || "创建订单失败");
      }
    } catch {
      setError("网络错误");
    }
    setSubmitting(false);
  }

  async function submitPayment() {
    if (!txId.trim()) {
      setError("请输入微信交易单号");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/order", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, transactionId: txId.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ msg: "支付信息已提交，等待审核。审核通过后自动发放激活码。", code: data.activationCode || undefined });
        setStep("confirm");
      } else {
        setError(data.error || "提交失败");
      }
    } catch {
      setError("网络错误");
    }
    setSubmitting(false);
  }

  return (
    <div className="flex-1">
      <Header />
      <div className="max-w-lg mx-auto px-4 py-10 page-enter">
        <h1 className="text-2xl font-bold mb-6">购买会员</h1>

        {/* 步骤 1：选方案》创建订单 */}
        {step === "select" && (
          <>
            <div className="space-y-3 mb-6">
              {Object.entries(PLANS).map(([k, v]) => (
                <div
                  key={k}
                  onClick={() => setPlan(k)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                    plan === k ? "border-primary bg-blue-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold">{v.label}</div>
                      <div className="text-sm text-gray-500">{v.desc}</div>
                    </div>
                    <div className="text-xl font-extrabold text-primary">¥{v.price}</div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={createOrder} disabled={submitting} className="w-full py-3 gradient-primary text-white font-semibold rounded-xl disabled:opacity-50 transition">
              {submitting ? "创建中..." : "下一步：扫码支付"}
            </button>
          </>
        )}

        {/* 步骤 2：展示收款码 》输入交易单号 */}
        {step === "pay" && (
          <>
            <div className="bg-white rounded-xl border border-gray-100 p-6 text-center shadow-sm mb-6">
              <p className="text-sm text-gray-500 mb-1">订单号</p>
              <p className="font-mono font-bold text-lg mb-4 text-primary">{orderId}</p>

              <div className="mb-4 flex flex-col items-center">
                <img
                  src="/qrcode.jpg"
                  alt="微信收款码"
                  className="w-56 h-56 object-contain rounded-xl border-2 border-gray-200 mb-3"
                />
                <p className="text-sm text-gray-500 font-bold">微信扫码支付 ¥{PLANS[plan].price}</p>
                <p className="text-xs text-gray-400 mt-2">
                  请用微信扫描收款码，支付后复制<strong>微信交易单号</strong>填入下方
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                className="flex-1 p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="输入微信交易单号（420000开头）"
                value={txId}
                onChange={(e) => setTxId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitPayment()}
              />
            </div>
            <button onClick={submitPayment} disabled={submitting} className="mt-3 w-full py-3 gradient-primary text-white font-semibold rounded-xl disabled:opacity-50 transition">
              {submitting ? "提交中..." : "我已支付，提交验证"}
            </button>
            <button onClick={() => setStep("select")} className="mt-2 w-full py-2 text-gray-400 text-sm hover:text-gray-600 transition">
              返回修改方案
            </button>
          </>
        )}

        {/* 步骤 3：提交成功 */}
        {step === "confirm" && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 text-center shadow-sm">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-xl font-bold mb-2">提交成功</h3>
            <p className="text-gray-500 text-sm mb-6">{result.msg}</p>
            {result.code && (
              <div className="bg-green-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-500 mb-1">你的激活码</p>
                <p className="font-mono text-2xl font-bold text-green-600">{result.code}</p>
              </div>
            )}
            <Link href="/pricing" className="text-primary text-sm hover:underline">
              去激活页面输入激活码
            </Link>
          </div>
        )}

        {error && <p className="mt-4 text-red-500 text-sm text-center">{error}</p>}
      </div>
    </div>
  );
}
