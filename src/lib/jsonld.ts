import { FEED_URL, type Episode } from "@/lib/podcast";

const SITE_IMAGE = "https://www.radio-potofu.com/images/og-hero.jpg";
const SITE_DESCRIPTION = "現代川柳のポッドキャスト「ラジオポトフ」公式サイト";

// Google検索結果でポッドキャストとして認識されやすくするための構造化データ。
// ホームページとエピソード一覧ページの両方で使うため共通化している。
export function podcastSeriesJsonLd({
  url,
  episodes,
}: {
  url: string;
  episodes: Episode[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "PodcastSeries",
    name: "ラジオポトフ",
    description: SITE_DESCRIPTION,
    url,
    webFeed: FEED_URL,
    image: SITE_IMAGE,
    ...(episodes.length > 0 && {
      hasPart: episodes.map((episode) => ({
        "@type": "PodcastEpisode",
        name: episode.title,
        datePublished: episode.publishDate,
        url: episode.spotifyUrl ?? episode.appleUrl,
      })),
    }),
  };
}

// サイト全体の基本情報。トップページにのみ置く。
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ラジオポトフ",
    description: SITE_DESCRIPTION,
    url: "https://www.radio-potofu.com",
  };
}
