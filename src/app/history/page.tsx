import { Fragment } from "react";
import type { Metadata } from "next";
import { getHistoryEntries, getHistoryCaption, getPlayCount, type HistoryEntry } from "@/lib/history";
import { getEpisodes } from "@/lib/podcast";
import { pageMetadata } from "@/lib/pageMetadata";

export const metadata: Metadata = pageMetadata({
  title: "年表",
  description: "ラジオポトフのこれまでの歩みをまとめた年表です。",
  path: "/history",
  image: "/images/og-history.jpg",
});
export const revalidate = 60;

// 配信開始からの経過期間(○年○日)。年表の一番古い項目(「トリコロール
// ケーキ・ポトフ」と名乗ることを決めた2021年10月)ではなく、実際に
// Ptf.1が配信された日(RSSフィード上の一番古いエピソードのpublishDate、
// 2022年2月10日)を起点にする。
function elapsedSince(earliestPublishDate: string): { years: number; days: number } | null {
  const start = new Date(earliestPublishDate);
  if (Number.isNaN(start.getTime())) return null;
  const diffMs = Date.now() - start.getTime();
  if (diffMs < 0) return null;
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const years = Math.floor(totalDays / 365.25);
  const days = totalDays - Math.floor(years * 365.25);
  return { years, days };
}

function groupByYear(entries: HistoryEntry[]) {
  const groups: { year: string; items: HistoryEntry[] }[] = [];
  for (const entry of entries) {
    const last = groups[groups.length - 1];
    if (last && last.year === entry.year) {
      last.items.push(entry);
    } else {
      groups.push({ year: entry.year, items: [entry] });
    }
  }
  return groups;
}

export default async function HistoryPage() {
  const [entries, caption, episodesRes] = await Promise.all([
    getHistoryEntries(),
    getHistoryCaption(),
    getEpisodes(9999),
  ]);
  const groups = groupByYear(entries);
  const earliestPublishDate = episodesRes.contents.reduce<string | null>((earliest, ep) => {
    if (!earliest || new Date(ep.publishDate) < new Date(earliest)) return ep.publishDate;
    return earliest;
  }, null);
  const elapsed = earliestPublishDate ? elapsedSince(earliestPublishDate) : null;
  const playCount = getPlayCount();

  return (
    <div className="container page">
      <div className="page-heading">
        <h1>年表</h1>
        <p className="page-subtitle">History</p>
      </div>
      {caption && <p className="page-caption">{caption}</p>}
      {(elapsed || episodesRes.totalCount > 0 || playCount) && (
        <div className="history-summary">
          {elapsed && (
            <div className="history-summary__item">
              <p className="history-summary__number">
                {elapsed.years}年{elapsed.days}日
              </p>
              <p className="history-summary__label">配信開始から</p>
            </div>
          )}
          {episodesRes.totalCount > 0 && (
            <div className="history-summary__item">
              <p className="history-summary__number">{episodesRes.totalCount}</p>
              <p className="history-summary__label">配信回数</p>
            </div>
          )}
          {playCount && (
            <div className="history-summary__item">
              <p className="history-summary__number">{playCount.count.toLocaleString("ja-JP")}</p>
              <p className="history-summary__label">再生回数(ダウンロード含む)</p>
              <p className="history-summary__note">({playCount.lastUpdated}時点)</p>
            </div>
          )}
        </div>
      )}
      {entries.length > 0 ? (
        <div className="history-list">
          {groups.map((group, gi) => (
            <div className="history-year-group" key={group.year}>
              <div
                className={`history-year-row${gi === 0 ? " history-year-row--first" : ""}`}
              >
                <p className="history-item__date history-year">{group.year}</p>
                <span
                  className="history-item__dotcol history-item__dotcol--plain"
                  aria-hidden="true"
                />
              </div>
              {group.items.map((entry, i) => {
                const normalizedBody = entry.body
                  .replace(/([^\n])(★)/g, "$1\n$2")
                  .replace(/(★[^\n]*?[。！？])(?!\n)(?=\S)/g, "$1\n");
                const lines = normalizedBody.split("\n");
                return (
                  <div className="history-item" key={i}>
                    <p className="history-item__date">{entry.monthDay}</p>
                    <span className="history-item__dotcol" aria-hidden="true" />
                    <div className="history-item__content">
                      <p className="history-item__body">
                        {lines.map((line, li) => {
                          const isStarLine = line.trim().startsWith("★");
                          return (
                            <Fragment key={li}>
                              <span className={isStarLine ? "history-item__star-line" : undefined}>
                                {isStarLine ? line.trim().slice(1) : line}
                              </span>
                              {li < lines.length - 1 && <br />}
                            </Fragment>
                          );
                        })}
                      </p>
                      {entry.links.length > 0 && (
                        <div className="history-item__links">
                          {entry.links.map((link, li) => (
                            <a
                              key={li}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="history-item__link"
                            >
                              {link.text}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-message">近日始動</p>
      )}
    </div>
  );
}
