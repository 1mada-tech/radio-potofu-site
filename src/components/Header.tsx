"use client";

import { useState } from "react";
import Link from "next/link";

const navGroups = [
  {
    href: "/episodes",
    label: "これまでの配信",
    children: [
      { href: "/pick", label: "きょうのあなたに", pick: true },
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
];

const standaloneLinks = [
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
            {navGroups.map((group) => (
              <div className="site-header__nav-group" key={group.href}>
                <Link
                  href={group.href}
                  className="site-header__nav-group-title"
                  onClick={() => setIsOpen(false)}
                >
                  {group.label}
                </Link>
                <ul className="site-header__nav-children">
                  {group.children.map((child) => (
                    <li key={child.href}>
                      <Link
                        href={child.href}
                        className={child.pick ? "site-header__pick" : undefined}
                        onClick={() => setIsOpen(false)}
                      >
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="site-header__nav-group site-header__nav-group--standalone">
              <ul className="site-header__nav-children">
                {standaloneLinks.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} onClick={() => setIsOpen(false)}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
