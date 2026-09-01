import { createClient } from "microcms-js-sdk";

const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
const apiKey = process.env.MICROCMS_API_KEY;

// microCMSの環境変数が未設定でもビルド/表示が落ちないようにする
export const client =
  serviceDomain && apiKey ? createClient({ serviceDomain, apiKey }) : null;

export type MicroCMSImage = {
  url: string;
  height: number;
  width: number;
};

export type Essay = {
  id: string;
  title: string;
  body: string;
  type: string[];
  author?: string;
  publishDate: string;
  createdAt: string;
  updatedAt: string;
};

// essays APIのtype選択肢(川柳／ノート)。現代川柳ページとノートページの絞り込みに使う。
export const ESSAY_TYPE_SENRYU = "川柳";
export const ESSAY_TYPE_NOTE = "ノート";

export type SiteSettings = {
  introText: string;
  heroImage?: MicroCMSImage;
  member1Name?: string;
  member1Bio?: string;
  member1Photo?: MicroCMSImage;
  member2Name?: string;
  member2Bio?: string;
  member2Photo?: MicroCMSImage;
  footerText: string;
};

const fallbackSiteSettings: SiteSettings = {
  introText:
    "猛暑詩：みこし\nすずしくなれば　こっちのもんだ\nそうおもってるやつら　全員で\n全員で　全員で　全員で　全員で\nすずしくなったら　みこしをかつごう\nでかくておもい　みこしをかつごう\nそのまま海に　ほうりなげよう\nすずしくなれば　こっちのもんだ　から\n2024年9月1日",
  heroImage: { url: "/images/hero.jpg", width: 6570, height: 4380 },
  footerText: "© Radio Potofu",
};

const REVALIDATE_SECONDS = 60;

export async function getEssaysByType(type: string, limit = 100, offset = 0) {
  if (!client) return { contents: [] as Essay[], totalCount: 0 };
  try {
    return await client.getList<Essay>({
      endpoint: "essays",
      queries: {
        limit,
        offset,
        orders: "-publishDate",
        filters: `type[contains]${type}`,
      },
      customRequestInit: { next: { revalidate: REVALIDATE_SECONDS } },
    });
  } catch {
    return { contents: [] as Essay[], totalCount: 0 };
  }
}

export async function getEssay(id: string) {
  if (!client) return null;
  try {
    return await client.getListDetail<Essay>({
      endpoint: "essays",
      contentId: id,
      customRequestInit: { next: { revalidate: REVALIDATE_SECONDS } },
    });
  } catch {
    return null;
  }
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!client) return fallbackSiteSettings;

  // site-settingsは「オブジェクト形式」で作成していれば getObject で取得できるが、
  // 誤って「リスト形式」で作成された場合でも動くように、失敗時は先頭1件を代わりに使う。
  try {
    const data = await client.getObject<SiteSettings>({
      endpoint: "site-settings",
      customRequestInit: { next: { revalidate: REVALIDATE_SECONDS } },
    });
    return { ...fallbackSiteSettings, ...data };
  } catch {
    // getObjectが失敗した場合はリスト形式とみなし、先頭1件を取得する
  }

  try {
    const res = await client.getList<SiteSettings>({
      endpoint: "site-settings",
      queries: { limit: 1 },
      customRequestInit: { next: { revalidate: REVALIDATE_SECONDS } },
    });
    if (res.contents.length > 0) {
      return { ...fallbackSiteSettings, ...res.contents[0] };
    }
    return fallbackSiteSettings;
  } catch {
    return fallbackSiteSettings;
  }
}
