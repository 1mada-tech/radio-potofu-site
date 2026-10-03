import Parser from "rss-parser";

// ラジオポトフのnote(https://note.com/radio_potofu)のRSSフィード。
export const NOTE_FEED_URL = "https://note.com/radio_potofu/rss";

const EXCERPT_MAX_LENGTH = 80;

// RSSの概要(contentSnippet)は本文冒頭の後に「続きをみる」が付いてくるので
// 取り除き、短く切り詰める。
function buildExcerpt(snippet: string): string {
  const text = snippet.replace(/\s*続きをみる\s*$/, "").trim();
  return text.length > EXCERPT_MAX_LENGTH ? `${text.slice(0, EXCERPT_MAX_LENGTH)}…` : text;
}

export type NoteArticle = {
  id: string;
  title: string;
  link: string;
  publishDate: string;
  thumbnail?: string;
  excerpt: string;
};

type NoteFeedItem = {
  title?: string;
  link?: string;
  guid?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  thumbnail?: string;
};

const parser: Parser<object, NoteFeedItem> = new Parser({
  customFields: {
    item: [["media:thumbnail", "thumbnail"]],
  },
});

export async function getNoteArticles(): Promise<NoteArticle[]> {
  try {
    const res = await fetch(NOTE_FEED_URL, { cache: "no-store" });
    const xml = await res.text();
    const feed = await parser.parseString(xml);

    return feed.items.map((item) => {
      const title = item.title ?? "";
      const publishDate = item.pubDate
        ? new Date(item.pubDate).toISOString()
        : new Date(0).toISOString();
      return {
        id: item.guid ?? item.link ?? title,
        title,
        link: item.link ?? NOTE_FEED_URL.replace("/rss", ""),
        publishDate,
        thumbnail: item.thumbnail,
        excerpt: buildExcerpt(item.contentSnippet ?? ""),
      };
    });
  } catch {
    // noteが取得できなくても、ページ自体は(空の一覧として)表示できるようにする
    return [];
  }
}
