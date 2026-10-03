import type { ReactNode } from "react";
import Link from "next/link";

// 「鍋内のひととき」の会話文中に出てくる、サイト内の他セクション名を
// 実際のリンクに変える。文言はpotChat.tsのLINE_BANKに書いてあるものと
// 一致させること(ズレると単なる文字列としてリンクされなくなる)。
const LISTENER_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeOhplhZTIclDQfUUbQTYbWwDkKVQOOTCOZPXOSwTTCXSo6rw/viewform";

export type SectionLink = { label: string; href: string; external?: boolean };

// 固定のセクション名。「最新回」「note」のような話題のラベル自体は
// ここに含めない(そちらは個別のタイトル文字列の方にリンクを張るため、
// 呼び出し側からdynamicLinksとして渡す)。
const SECTION_LINKS: SectionLink[] = [
  { label: "きょうのあなたに", href: "/pick" },
  { label: "ひみつノート", href: "/note" },
  { label: "ネットプリント", href: "/netprint" },
  { label: "テーマ募集", href: "/themes" },
  { label: "おたよりを送る", href: LISTENER_FORM_URL, external: true },
  { label: "鍋の記録", href: "#pot-log" },
  { label: "年表", href: "/history" },
];

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// セリフの文字列を、セクション名/話題タイトル部分だけリンクにした
// ReactNodeの配列にする。dynamicLinksには、最新エピソード/note記事の
// タイトルなど、そのセリフにしか出てこない動的なリンクを渡す。
export function linkifyChatText(text: string, dynamicLinks: SectionLink[] = []): ReactNode[] {
  const links = [...SECTION_LINKS, ...dynamicLinks.filter((l) => l.label.length > 0)];
  if (links.length === 0) return [text];

  // 長いラベルを先に拾うことで、短いラベルが長いラベルの一部を
  // 誤って拾ってしまうのを防ぐ。
  const sortedLinks = [...links].sort((a, b) => b.label.length - a.label.length);
  const linkByLabel = new Map(sortedLinks.map((l) => [l.label, l]));
  const splitRegex = new RegExp(`(${sortedLinks.map((l) => escapeRegExp(l.label)).join("|")})`, "g");

  return text.split(splitRegex).map((part, i) => {
    const link = linkByLabel.get(part);
    if (!link) return part;
    if (link.external) {
      return (
        <a
          key={i}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="pot-chat__line-link"
        >
          {part}
        </a>
      );
    }
    return (
      <Link key={i} href={link.href} className="pot-chat__line-link">
        {part}
      </Link>
    );
  });
}
