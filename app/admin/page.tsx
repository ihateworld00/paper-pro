"use client";
import { useState, useEffect } from "react";
import Header from "@/components/Header";

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [pwd, setPwd] = useState("");
  const [orders, setOrders] = useState<Array<Record<string, string>>>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (token) setLoggedIn(true);
  }, []);

  async function login() {
    if (!pwd) return;
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", password: pwd }),
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem("admin_token", data.token);
      setLoggedIn(true);
    } else {
      setMsg("密码错误");
    }
  }

  async function loadOrders() {
    setLoading(true);
    const res = await fetch("/api/admin?action=list", {
      headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
    });
    const data = await res.json();
    if (data.success) setOrders(data.orders);
    setLoading(false);
  }

  async function verifyOrder(orderId: string) {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
      },
      body: JSON.stringify({ action: "verify", orderId }),
    });
    const data = await res.json();
    setMsg(data.success ? `已通过！激活码：${data.activationCode}` : data.error || "操作失败");
    loadOrders();
  }

  useEffect(() => {
    if (loggedIn) loadOrders();
  }, [loggedIn]);

  if (!loggedIn) {
    return (
      <div className="flex-1">
        <Header />
        <div className="max-w-sm mx-auto px-4 py-20">
          <h1 className="text-2xl font-bold mb-6 text-center">管理员登录</h1>
          <input
            type="password"
            className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mb-3"
            placeholder="输入管理密码"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
          />
          <button onClick={login} className="w-full py-3 gradient-primary text-white font-semibold rounded-xl transition">
            登录
          </button>
          {msg && <p className="mt-3 text-red-500 text-sm text-center">{msg}</p>}
        </div>
      </div>
    );
  }

  const pending = orders.filter((o) => o.status === "pending");
  const done = orders.filter((o) => o.status !== "pending");

  return (
    <div className="flex-1">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-10 page-enter">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">订单管理</h1>
          <button onClick={loadOrders} className="text-sm text-primary hover:underline">{loading ? "刷新中..." : "刷新"}</button>
        </div>

        {msg && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{msg}</div>}

        {pending.length > 0 && (
          <div className="mb-8">
            <h2 className="font-bold text-orange-600 mb-3">待处理 ({pending.length})</h2>
            <div className="space-y-3">
              {pending.map((o) => (
                <div key={o.id} className="bg-white border border-orange-200 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-mono text-sm font-bold">{o.id}</p>
                      <p className="text-xs text-gray-500">{o.plan === "single" ? "单次 ¥9.9" : "月度 ¥29.9"} · {o.createdAt?.slice(0, 16).replace("T", " ")}</p>
                    </div>
                    <button onClick={() => verifyOrder(o.id)} className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition">
                      验证通过
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">交易单号：{o.transactionId}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {done.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-500 mb-3">已处理 ({done.length})</h2>
            <div className="space-y-2">
              {done.map((o) => (
                <div key={o.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm flex justify-between">
                  <div>
                    <span className="font-mono text-xs">{o.id}</span>
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${o.status === "paid" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {o.status === "paid" ? "已通过" : "已拒绝"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{o.activationCode}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {orders.length === 0 && !loading && <p className="text-gray-400 text-center py-10">暂无订单</p>}
      </div>
    </div>
  );
}
