import type { Metadata } from "next";

const SITE_URL = "https://www.radio-potofu.com";
const SITE_TITLE = "ラジオポトフ";
const DEFAULT_OG_IMAGE = "/images/og-hero.jpg";

// 各ページのtitle/descriptionを、SNSシェア時のOGP/Twitterカードにも
// そのまま反映させるための共通ヘルパー。layout.tsx側のopenGraph/twitter
// 設定はページ側で何も指定しないとまるごと上書きされず残ってしまう
// (Next.jsのmetadataはネストしたオブジェクト単位で親の値を引き継ぐため、
// 子ページがopenGraphを指定しない限りサイト全体のデフォルトのままになる)。
// pathを渡すとog:urlもページ固有のURLになる。
export function pageMetadata({
  title,
  description,
  path,
  image,
}: {
  title: string;
  description: string;
  path?: string;
  image?: string;
}): Metadata {
  const url = path ? `${SITE_URL}${path}` : undefined;
  const ogImage = image ?? DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    // 重複URL(クエリ付き等)がある場合に、どれが正とするURLかを検索エンジンに
    // 伝える。pathを渡さないページ(ホームはlayout.tsx側で別途設定)では省略。
    ...(url ? { alternates: { canonical: url } } : {}),
    openGraph: {
      type: "website",
      ...(url ? { url } : {}),
      siteName: SITE_TITLE,
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
