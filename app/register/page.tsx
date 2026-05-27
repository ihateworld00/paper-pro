"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister() {
    setError("");
    if (!email.trim() && !phone.trim()) { setError("邮箱和手机号至少填写一项"); return; }
    if (!password || password.length < 6) { setError("密码至少6位"); return; }
    if (password !== confirmPwd) { setError("两次密码输入不一致"); return; }
    if (!agreeTerms) { setError("请先同意服务条款和隐私政策"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          phone: phone.trim(),
          password,
          name: name.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("auth_user", JSON.stringify(data.user));
        router.push("/");
      } else {
        setError(data.error || "注册失败");
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
          <h1 className="text-4xl font-extrabold mb-4">加入论文通</h1>
          <p className="text-xl text-white/80 mb-8">注册即享 2 次免费使用，体验 AI 论文写作效率提升</p>
          <div className="space-y-4 text-white/70 text-sm">
            <div className="flex items-center gap-2"><span className="text-green-300 text-lg">✓</span> 新用户免费试用 2 次</div>
            <div className="flex items-center gap-2"><span className="text-green-300 text-lg">✓</span> 无需绑定支付方式</div>
            <div className="flex items-center gap-2"><span className="text-green-300 text-lg">✓</span> 支持邮箱/手机号注册</div>
            <div className="flex items-center gap-2"><span className="text-green-300 text-lg">✓</span> 微信扫码一键登录</div>
          </div>
        </div>
      </div>

      {/* 右侧注册区 */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-extrabold gradient-text">论文通</h1>
            <p className="text-gray-500 text-sm mt-1">AI 论文助手</p>
          </div>

          <h2 className="text-2xl font-bold mb-1">创建账号</h2>
          <p className="text-gray-500 text-sm mb-8">注册后即可免费试用</p>

          {/* 昵称 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">昵称 <span className="text-gray-400">（可选）</span></label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              placeholder="给自己起个名字"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* 邮箱 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">邮箱 <span className="text-gray-400">（邮箱和手机至少填一项）</span></label>
            <input
              type="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              placeholder="请输入邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* 手机号 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">手机号 <span className="text-gray-400">（邮箱和手机至少填一项）</span></label>
            <input
              type="tel"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              placeholder="请输入手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* 密码 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                placeholder="至少6位密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          {/* 确认密码 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">确认密码</label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              placeholder="请再次输入密码"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRegister()}
            />
          </div>

          {/* 协议 */}
          <div className="mb-6">
            <label className="flex items-start gap-2 text-sm text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-gray-300 mt-0.5"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <span>我已阅读并同意 <span className="text-primary hover:underline">服务条款</span> 和 <span className="text-primary hover:underline">隐私政策</span></span>
            </label>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>
          )}

          {/* 注册按钮 */}
          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full py-3 gradient-primary text-white font-semibold rounded-xl disabled:opacity-50 transition hover:shadow-lg"
          >
            {loading ? "注册中..." : "注册"}
          </button>

          {/* 登录入口 */}
          <p className="text-center text-sm text-gray-500 mt-6">
            已有账号？{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              立即登录
            </Link>
          </p>

          {/* 返回首页 */}
          <p className="text-center mt-8">
            <Link href="/" className="text-sm text-gray-400 hover:text-primary transition">← 返回首页</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
