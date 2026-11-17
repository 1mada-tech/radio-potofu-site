// Search Console APIからクエリ別の検索パフォーマンスデータを取得するスクリプト。
// 使い方: node scripts/search-console-query.mjs [日数(デフォルト28)]
//
// 認証にはサービスアカウントのJSONキー(.search-console-key.json、gitignore済み)を使う。
// 事前にSearch Console側の「設定→ユーザーと権限」で、このサービスアカウントの
// client_emailを閲覧者として追加しておく必要がある。
import { readFileSync } from "fs";
import { google } from "googleapis";

const SITE_URL = "sc-domain:radio-potofu.com";
const KEY_PATH = new URL("../.search-console-key.json", import.meta.url);

const days = Number(process.argv[2]) || 28;

const key = JSON.parse(readFileSync(KEY_PATH, "utf8"));

const auth = new google.auth.JWT({
  email: key.client_email,
  key: key.private_key,
  scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
});

const searchconsole = google.searchconsole({ version: "v1", auth });

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

const endDate = new Date();
endDate.setDate(endDate.getDate() - 3); // GSCのデータは直近2-3日分が未確定なことが多い
const startDate = new Date(endDate);
startDate.setDate(startDate.getDate() - days);

const res = await searchconsole.searchanalytics.query({
  siteUrl: SITE_URL,
  requestBody: {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    dimensions: ["query"],
    rowLimit: 50,
  },
});

const rows = res.data.rows ?? [];
console.log(`期間: ${formatDate(startDate)} 〜 ${formatDate(endDate)} (${days}日間)`);
console.log(`クエリ数: ${rows.length}件\n`);
console.log("クエリ\tクリック数\t表示回数\tCTR\t平均掲載順位");
for (const row of rows) {
  const [query] = row.keys;
  const ctr = (row.ctr * 100).toFixed(1) + "%";
  const pos = row.position.toFixed(1);
  console.log(`${query}\t${row.clicks}\t${row.impressions}\t${ctr}\t${pos}`);
}
