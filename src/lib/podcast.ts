import Parser from "rss-parser";
import { parse } from "csv-parse/sync";

// SpotifyのApple Podcasts掲載情報(id1608810819)から取得した実際のRSSフィードURL。
// これまでの配信は、microCMSではなくこのフィードから毎回自動で取得する。
const FEED_URL = "https://anchor.fm/s/82465974/podcast/rss";

// Spotifyはエピソード個別の直リンクを自動取得できないため(Web APIがPremium必須)、
// 番組ページへの固定リンクをフォールバックとして使う。
const SPOTIFY_SHOW_URL = "https://open.spotify.com/show/4R3f88m9NsYKjBUJzKhipq";

// エピソードごとの補足情報用スプレッドシート。
// 列: 配信回数 / タイトル / SpotifyURL / applePodcastsURL / コメント / タグ / おすすめ度
const EPISODE_EXTRAS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1J_fSVe7sqRQaeelc2A9ocQhAbxXqB6OHpv0BxW6CbEk/export?format=csv&gid=1797359134";

// Apple Podcastsの公開API(認証不要)。直近200件のエピソードのtrackId(個別リンクに使う)が取れる。
// 配信日時(releaseDate)がRSSのpubDateと一致するので、それをキーに紐付ける。
const APPLE_PODCAST_ID = "1608810819";
const APPLE_LOOKUP_URL = `https://itunes.apple.com/lookup?id=${APPLE_PODCAST_ID}&entity=podcastEpisode&limit=200`;

export type Episode = {
  id: string;
  title: string;
  publishDate: string;
  appleUrl?: string;
  spotifyUrl?: string;
  comment?: string;
  tags?: string[];
  recommendation?: string;
};

type EpisodeExtras = {
  spotifyUrl?: string;
  appleUrl?: string;
  comment?: string;
  tags?: string[];
  recommendation?: string;
};

const parser = new Parser();

type AppleLookupResult = {
  wrapperType?: string;
  trackId?: number;
  releaseDate?: string;
};

async function fetchAppleUrlsByDate(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const res = await fetch(APPLE_LOOKUP_URL, { cache: "no-store" });
    const data: { results: AppleLookupResult[] } = await res.json();
    for (const result of data.results) {
      if (result.wrapperType !== "podcastEpisode" || !result.trackId || !result.releaseDate) {
        continue;
      }
      const key = new Date(result.releaseDate).toISOString();
      map.set(
        key,
        `https://podcasts.apple.com/jp/podcast/id${APPLE_PODCAST_ID}?i=${result.trackId}`,
      );
    }
  } catch {
    // Apple側が取得できなくても、音声リンクだけで一覧は表示できるようにする
  }
  return map;
}

function extractEpisodeNumber(title: string): number | null {
  const match = title.match(/Ptf\.(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function splitTags(raw: string): string[] {
  return raw
    .split(/[,、\s]+/)
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter((tag) => tag.length > 0);
}

// シートには1〜5の数字で入れてもらい、★の数に変換する。数字以外はそのまま表示する。
function formatRecommendation(raw: string): string {
  const num = parseInt(raw, 10);
  if (Number.isNaN(num) || num < 1 || num > 5) return raw;
  return "★".repeat(num) + "☆".repeat(5 - num);
}

async function fetchEpisodeExtrasByNumber(): Promise<Map<number, EpisodeExtras>> {
  const map = new Map<number, EpisodeExtras>();
  try {
    const res = await fetch(EPISODE_EXTRAS_CSV_URL, { cache: "no-store" });
    const text = await res.text();
    const rows: string[][] = parse(text, { skip_empty_lines: true });
    for (const row of rows.slice(1)) {
      const num = parseInt(row[0], 10);
      if (Number.isNaN(num)) continue;
      const spotifyUrl = row[2]?.trim() || undefined;
      const appleUrl = row[3]?.trim() || undefined;
      const comment = row[4]?.trim() || undefined;
      const tags = row[5]?.trim() ? splitTags(row[5]) : undefined;
      const recommendation = row[6]?.trim() ? formatRecommendation(row[6].trim()) : undefined;
      map.set(num, { spotifyUrl, appleUrl, comment, tags, recommendation });
    }
  } catch {
    // シートが取得できなくても番組ページへの固定リンクだけで一覧は表示できるようにする
  }
  return map;
}

async function fetchAllEpisodes(): Promise<Episode[]> {
  // フィードが2MB超でNext.jsのフェッチキャッシュ上限に収まらないため、
  // ここではキャッシュせず、呼び出し側ページの revalidate でページ単位にキャッシュする。
  const [feedRes, appleUrlsByDate, extrasByNumber] = await Promise.all([
    fetch(FEED_URL, { cache: "no-store" }),
    fetchAppleUrlsByDate(),
    fetchEpisodeExtrasByNumber(),
  ]);
  const xml = await feedRes.text();
  const feed = await parser.parseString(xml);

  return feed.items
    .map((item) => {
      const title = item.title ?? "";
      const publishDate = item.pubDate
        ? new Date(item.pubDate).toISOString()
        : new Date(0).toISOString();
      const episodeNumber = extractEpisodeNumber(title);
      const extras = episodeNumber !== null ? extrasByNumber.get(episodeNumber) : undefined;
      return {
        id: item.guid ?? item.link ?? title,
        title,
        publishDate,
        appleUrl: extras?.appleUrl ?? appleUrlsByDate.get(publishDate),
        spotifyUrl: extras?.spotifyUrl ?? SPOTIFY_SHOW_URL,
        comment: extras?.comment,
        tags: extras?.tags,
        recommendation: extras?.recommendation,
      };
    })
    .sort((a, b) => (a.publishDate < b.publishDate ? 1 : -1));
}

export async function getEpisodes(limit = 100, offset = 0, tagFilter?: string) {
  try {
    let items = await fetchAllEpisodes();
    if (tagFilter) {
      items = items.filter((episode) => episode.tags?.includes(tagFilter));
    }
    return {
      contents: items.slice(offset, offset + limit),
      totalCount: items.length,
    };
  } catch {
    return { contents: [] as Episode[], totalCount: 0 };
  }
}
