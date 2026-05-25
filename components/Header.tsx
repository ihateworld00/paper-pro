"use client";
import Link from "next/link";

export default function Header() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold gradient-text">论文通</Link>
        <div className="flex gap-4 text-sm">
          <Link href="/paraphrase" className="text-gray-600 hover:text-primary">降重</Link>
          <Link href="/polish" className="text-gray-600 hover:text-primary">润色</Link>
          <Link href="/proposal" className="text-gray-600 hover:text-primary">开题报告</Link>
          <Link href="/pricing" className="text-primary font-medium">升级</Link>
        </div>
      </div>
    </nav>
  );
}
