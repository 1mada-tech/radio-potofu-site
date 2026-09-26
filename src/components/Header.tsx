"use client";

import { useState } from "react";
import Link from "next/link";

const navGroups = [
  {
    href: "/episodes",
    label: "これまでの配信",
    children: [
      { href: "/pick", label: "きょうのあなたに" },
      { href: "/themes", label: "テーマ募集" },
    ],
  },
  {
    href: "/senryu",
    label: "現代川柳",
    children: [
      { href: "/netprint", label: "ネットプリント" },
      { href: "/pot", label: "川柳ポトフ鍋" },
    ],
  },
  {
    href: null,
    label: "おたのしみ",
    children: [
      { href: "/note", label: "ひみつノート" },
      { href: "/history", label: "年表" },
    ],
  },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="site-header">
      <div
        className={`site-header__backdrop${isOpen ? " site-header__backdrop--open" : ""}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
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

        <nav
          className={`site-header__nav${isOpen ? " site-header__nav--open" : ""}`}
          onClick={() => setIsOpen(false)}
        >
          <div className="site-header__nav-inner">
            <ul className="site-header__nav-main">
              {navGroups.map((group) => (
                <li className="site-header__nav-group" key={group.label}>
                  {group.href ? (
                    <Link
                      href={group.href}
                      className="site-header__nav-group-title"
                      onClick={() => setIsOpen(false)}
                    >
                      ▼{group.label}
                    </Link>
                  ) : (
                    <span className="site-header__nav-group-title">▼{group.label}</span>
                  )}
                  <ul className="site-header__nav-children">
                    {group.href && (
                      <li className="site-header__nav-index">
                        <Link href={group.href} onClick={() => setIsOpen(false)}>
                          {group.label} トップ
                        </Link>
                      </li>
                    )}
                    {group.children.map((child) => (
                      <li key={child.href}>
                        <Link href={child.href} onClick={() => setIsOpen(false)}>
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
    </header>
  );
}
