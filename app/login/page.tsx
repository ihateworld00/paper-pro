"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");
    if (!account.trim()) { setError("请输入邮箱或手机号"); return; }
    if (!password) { setError("请输入密码"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: account.trim(), password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("auth_user", JSON.stringify(data.user));
        router.push("/");
      } else {
        setError(data.error || "登录失败");
      }
    } catch {
      setError("网络错误，请重试");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex">
      {/* 左侧品牌区 */}
      <div className="hidden lg:flex w-1/2 gradient-primary items-center justify-center p-12">
        <div className="text-white max-w-md">
          <h1 className="text-4xl font-extrabold mb-4">论文通</h1>
          <p className="text-xl text-white/80 mb-8">AI 论文助手 · 降重 · 润色 · 开题</p>
          <div className="space-y-4 text-white/70">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔄</span>
              <div><p className="font-bold text-white">智能降重</p><p className="text-sm">查重率直降，确保学术原创性</p></div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">✨</span>
              <div><p className="font-bold text-white">学术润色</p><p className="text-sm">提升语言质量，表达更专业</p></div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📋</span>
              <div><p className="font-bold text-white">开题报告</p><p className="text-sm">一键生成，格式规范完整</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧登录区 */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          {/* 移动端Logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-extrabold gradient-text">论文通</h1>
            <p className="text-gray-500 text-sm mt-1">AI 论文助手</p>
          </div>

          <h2 className="text-2xl font-bold mb-1">欢迎回来</h2>
          <p className="text-gray-500 text-sm mb-8">登录你的账号继续使用</p>

          {/* 邮箱/手机 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">邮箱 / 手机号</label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              placeholder="请输入邮箱或手机号"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          {/* 密码 */}
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
              >
                {showPwd ? "隐藏" : "显示"}
              </button>
            </div>
          </div>

          {/* 记住我 + 忘记密码 */}
          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-300" defaultChecked />
              记住登录状态
            </label>
            <span className="text-sm text-primary hover:underline cursor-pointer">忘记密码？</span>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>
          )}

          {/* 登录按钮 */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 gradient-primary text-white font-semibold rounded-xl disabled:opacity-50 transition hover:shadow-lg"
          >
            {loading ? "登录中..." : "登录"}
          </button>

          {/* 注册入口 */}
          <p className="text-center text-sm text-gray-500 mt-6">
            还没有账号？{" "}
            <Link href="/register" className="text-primary font-medium hover:underline">
              立即注册
            </Link>
          </p>

          {/* 分割线 */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center"><span className="bg-white px-4 text-sm text-gray-400">其他登录方式</span></div>
          </div>

          {/* 微信登录（预留） */}
          <button className="w-full py-3 border-2 border-green-500 text-green-600 font-medium rounded-xl hover:bg-green-50 transition flex items-center justify-center gap-2">
            <span className="text-xl">💬</span> 微信扫码登录
          </button>

          {/* 返回首页 */}
          <p className="text-center mt-8">
            <Link href="/" className="text-sm text-gray-400 hover:text-primary transition">← 返回首页</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
