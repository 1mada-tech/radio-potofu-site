import type { Metadata } from "next";
import { getNetprintIssues, NETPRINT_CSV_URL } from "@/lib/netprint";
import { getSimpleCaption } from "@/lib/pageCaption";

export const metadata: Metadata = { title: "ネットプリント" };
export const revalidate = 60;

const DEFAULT_CAPTION =
  "半年に一度、現代川柳のネットプリントを発行しています。バックナンバーのPDFをこちらから読めます。";

export default async function NetprintPage() {
  const [issues, caption] = await Promise.all([
    getNetprintIssues(),
    getSimpleCaption(NETPRINT_CSV_URL),
  ]);

  return (
    <div className="container page">
      <h1>ネットプリント</h1>
      <p className="page-caption">{caption ?? DEFAULT_CAPTION}</p>
      {issues.length > 0 ? (
        <div className="episode-table-wrap">
          <table className="episode-table">
            <thead>
              <tr>
                <th>号数</th>
                <th>テーマ</th>
                <th>発行日</th>
                <th>リンク</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.issue}>
                  <td>第{issue.issue}号</td>
                  <td>{issue.theme}</td>
                  <td>{issue.publishDate}</td>
                  <td>
                    <a href={issue.fileUrl} target="_blank" rel="noopener noreferrer">
                      PDFを読む →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty-message">まだ発行されていません。</p>
      )}
    </div>
  );
}
