"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  vipExpire: string | null;
  freeUsed: number;
}

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    try {
      const u = localStorage.getItem("auth_user");
      if (u) setUser(JSON.parse(u));
    } catch {}
  }, []);

  function logout() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setUser(null);
    setMenuOpen(false);
    router.push("/");
  }

  const isVip = user?.vipExpire && new Date(user.vipExpire) > new Date();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold gradient-text">论文通</Link>

        <div className="hidden md:flex items-center gap-4 text-sm">
          <Link href="/paraphrase" className="text-gray-600 hover:text-primary">降重</Link>
          <Link href="/batch-rewrite" className="text-gray-600 hover:text-primary">批量改写</Link>
          <Link href="/polish" className="text-gray-600 hover:text-primary">润色</Link>
          <Link href="/proposal" className="text-gray-600 hover:text-primary">开题报告</Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 pl-3 ml-2 border-l border-gray-200"
              >
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
                  {user.name?.charAt(0) || "U"}
                </div>
                <span className="text-gray-700 max-w-[80px] truncate">{user.name}</span>
                {isVip && <span className="text-xs bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full font-medium">VIP</span>}
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)}></div>
                  <div className="absolute right-0 top-12 z-20 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-bold text-sm">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email || user.phone}</p>
                      {isVip ? (
                        <p className="text-xs text-yellow-600 mt-1">VIP 有效期至 {new Date(user.vipExpire!).toLocaleDateString("zh-CN")}</p>
                      ) : (
                        <p className="text-xs text-gray-400 mt-1">剩余免费 {Math.max(0, 2 - user.freeUsed)} 次</p>
                      )}
                    </div>
                    <Link href="/pricing" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      {isVip ? "续费会员" : "升级会员"}
                    </Link>
                    <button onClick={logout} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">
                      退出登录
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-3 ml-2 border-l border-gray-200">
              <Link href="/login" className="text-gray-600 hover:text-primary font-medium">登录</Link>
              <Link href="/register" className="px-4 py-1.5 gradient-primary text-white rounded-lg text-sm font-medium">注册</Link>
            </div>
          )}
        </div>

        {/* 移动端简化菜单 */}
        <div className="md:hidden flex items-center gap-2">
          {user ? (
            <Link href="/pricing" className="text-xs text-primary font-medium">
              {isVip ? "VIP" : `${Math.max(0, 2 - user.freeUsed)}次`}
            </Link>
          ) : (
            <Link href="/login" className="text-xs text-primary font-medium">登录</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
