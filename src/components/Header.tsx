"use client";

import { useState } from "react";
import Link from "next/link";

const navRow2 = [
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
          <div className="site-header__nav-inner">
            <ul className="site-header__nav-row">
              <li className="site-header__nav-group">
                <Link href="/episodes" onClick={() => setIsOpen(false)}>
                  これまでの配信
                </Link>
                <span className="site-header__nav-arrow" aria-hidden="true">
                  →
                </span>
                <Link
                  href="/pick"
                  className="site-header__pick"
                  onClick={() => setIsOpen(false)}
                >
                  きょうのあなたへ
                </Link>
              </li>
              <li>
                <Link href="/themes" onClick={() => setIsOpen(false)}>
                  テーマ募集
                </Link>
              </li>
            </ul>
            <ul className="site-header__nav-row">
              {navRow2.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} onClick={() => setIsOpen(false)}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
    </header>
  );
}
