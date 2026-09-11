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
        <ol className="history-list">
          {entries.map((entry, i) => {
            const showYear = i === 0 || entries[i - 1].year !== entry.year;
            return (
              <li className="history-item" key={i}>
                <div className="history-item__year">{showYear && entry.year}</div>
                <div className="history-item__line">
                  <p className="history-item__date">{entry.monthDay}</p>
                  <p className="history-item__body">{entry.body}</p>
                  {entry.linkUrl && (
                    <a
                      href={entry.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="history-item__link"
                    >
                      {entry.linkText || entry.linkUrl}
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="empty-message">近日始動</p>
      )}
    </div>
  );
}
