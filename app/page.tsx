"use client";
import { useState, useEffect } from "react";
import { remaining } from "@/lib/store";
import Link from "next/link";

export default function Home() {
  const [left, setLeft] = useState(2);

  useEffect(() => { setLeft(remaining()); }, []);

  return (
    <div className="flex-1">
      {/* 导航 */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-xl font-bold gradient-text">论文通</span>
          <div className="flex gap-4 text-sm">
            <Link href="/paraphrase" className="text-gray-600 hover:text-primary">降重</Link>
            <Link href="/polish" className="text-gray-600 hover:text-primary">润色</Link>
            <Link href="/proposal" className="text-gray-600 hover:text-primary">开题报告</Link>
            <Link href="/pricing" className="text-primary font-medium">升级会员</Link>
          </div>
        </div>
      </nav>

      {/* 主视觉 */}
      <section className="gradient-primary text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-white/20 text-sm mb-6">
            AI 驱动 · 学术写作效率提升 10 倍
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
            论文写作，从此不再头疼
          </h1>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            基于大语言模型的智能论文助手，支持论文降重、学术润色、开题报告生成和文献综述。
            让AI帮你搞定繁琐的文字工作，把精力留给研究本身。
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/paraphrase" className="px-6 py-3 bg-white text-primary font-semibold rounded-xl hover:shadow-lg transition">
              立即体验（剩余{left}次免费）
            </Link>
            <Link href="/pricing" className="px-6 py-3 bg-white/20 text-white rounded-xl hover:bg-white/30 transition">
              查看定价
            </Link>
          </div>
        </div>
      </section>

      {/* 三大核心功能 */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">三大核心功能</h2>
        <p className="text-gray-500 text-center mb-12">覆盖论文写作全流程，从开题到降重一步到位</p>
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon="🔄"
            title="AI 论文降重"
            desc="智能改写论文段落，调整句式结构、替换同义词，在不改变原意的前提下大幅降低重复率。"
            href="/paraphrase"
            badge="最受欢迎"
          />
          <FeatureCard
            icon="✨"
            title="学术润色"
            desc="提升论文语言质量，精炼表达、优化逻辑、修正语法错误，让论文更具学术专业性。"
            href="/polish"
          />
          <FeatureCard
            icon="📋"
            title="开题报告生成"
            desc="输入你的研究方向，AI自动生成包含选题背景、文献综述、研究方法的完整开题报告框架。"
            href="/proposal"
            badge="新增"
          />
        </div>
      </section>

      {/* 定价 */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">简单定价，按需选择</h2>
          <p className="text-gray-500 mb-10">新用户免费试用2次，满意后再付费</p>
          <div className="grid md:grid-cols-3 gap-6">
            <PriceCard title="免费试用" price="0" unit="" features={["2次完整使用", "支持全部功能", "无需绑定支付"]} />
            <PriceCard title="单次购买" price="9.9" unit="元/次" features={["单次完整使用", "无限字数", "优先响应速度"]} highlight />
            <PriceCard title="月度会员" price="29.9" unit="元/月" features={["无限次数使用", "全部功能开放", "优先响应速度", "专属客服支持"]} />
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4 text-center text-sm">
        <p>论文通 © 2026 — AI论文助手 | 你的学术写作伴侣</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, href, badge }: { icon: string; title: string; desc: string; href: string; badge?: string }) {
  return (
    <Link href={href} className="card-hover bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden block">
      {badge && <span className="absolute top-3 right-3 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{badge}</span>}
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
    </Link>
  );
}

function PriceCard({ title, price, unit, features, highlight }: { title: string; price: string; unit: string; features: string[]; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-6 border text-left ${highlight ? "border-primary shadow-lg bg-blue-50/50" : "border-gray-200"}`}>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <div className="mb-4">
        <span className="text-3xl font-extrabold">{price === "0" ? "免费" : `¥${price}`}</span>
        {unit && <span className="text-sm text-gray-500">/{unit}</span>}
      </div>
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
