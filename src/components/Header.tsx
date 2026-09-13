"use client";

import { useState } from "react";
import Link from "next/link";

const navItems = [
  { href: "/episodes", label: "これまでの配信" },
  { href: "/senryu", label: "現代川柳" },
  { href: "/netprint", label: "ネットプリント" },
  { href: "/note", label: "ひみつノート" },
  { href: "/history", label: "年表" },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <div className="site-header__brand">
          <Link href="/" className="site-header__logo" onClick={() => setIsOpen(false)}>
            ラジオポトフ
          </Link>
          <span className="site-header__tagline">公式サイト</span>
        </div>

        <button
          type="button"
          className="site-header__toggle"
          aria-expanded={isOpen}
          aria-label={isOpen ? "メニューを閉じる" : "メニューを開く"}
          onClick={() => setIsOpen((v) => !v)}
        >
          <span className="site-header__toggle-bars">
            <span />
            <span />
            <span />
          </span>
          <span className="site-header__toggle-label">メニュー</span>
        </button>

        <nav className={`site-header__nav${isOpen ? " site-header__nav--open" : ""}`}>
          <ul>
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={() => setIsOpen(false)}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/omikuji"
                className="site-header__omikuji"
                onClick={() => setIsOpen(false)}
              >
                今日はこの回聞いて
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
