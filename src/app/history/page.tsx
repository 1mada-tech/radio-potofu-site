import { Fragment } from "react";
import type { Metadata } from "next";
import { getHistoryEntries, getHistoryCaption, type HistoryEntry } from "@/lib/history";

export const metadata: Metadata = { title: "年表" };
export const revalidate = 60;

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
  const [entries, caption] = await Promise.all([getHistoryEntries(), getHistoryCaption()]);
  const groups = groupByYear(entries);

  return (
    <div className="container page">
      <div className="page-heading">
        <h1>年表</h1>
        <p className="page-subtitle">History</p>
      </div>
      {caption && <p className="page-caption">{caption}</p>}
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
