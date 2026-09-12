import { Fragment } from "react";
import type { Metadata } from "next";
import { getHistoryEntries } from "@/lib/history";

export const metadata: Metadata = { title: "年表" };
export const revalidate = 60;

export default async function HistoryPage() {
  const entries = await getHistoryEntries();

  return (
    <div className="container page">
      <h1>年表</h1>
      {entries.length > 0 ? (
        <div className="history-list">
          {entries.map((entry, i) => {
            const showYear = i === 0 || entries[i - 1].year !== entry.year;
            const normalizedBody = entry.body
              .replace(/([^\n])(★)/g, "$1\n$2")
              .replace(/(★[^\n]*?[。！？])(?!\n)(?=\S)/g, "$1\n");
            const lines = normalizedBody.split("\n");
            return (
              <Fragment key={i}>
                {showYear && (
                  <div className={`history-year-row${i === 0 ? " history-year-row--first" : ""}`}>
                    <p className="history-item__date history-year">{entry.year}</p>
                    <span className="history-item__dotcol history-item__dotcol--plain" aria-hidden="true" />
                  </div>
                )}
                <div className="history-item">
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
              </Fragment>
            );
          })}
        </div>
      ) : (
        <p className="empty-message">近日始動</p>
      )}
    </div>
  );
}
