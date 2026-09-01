import Link from "next/link";

const navItems = [
  { href: "/episodes", label: "これまでの配信" },
  { href: "/senryu", label: "現代川柳" },
  { href: "/netprint", label: "ネットプリント" },
  { href: "/note", label: "ひみつノート" },
];

export default function Header() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <div className="site-header__brand">
          <Link href="/" className="site-header__logo">
            ラジオポトフ
          </Link>
          <span className="site-header__tagline">公式サイト</span>
        </div>
        <nav className="site-header__nav">
          <ul>
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
