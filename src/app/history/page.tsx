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
          {entries.map((entry, i) => (
            <li className="history-item" key={i}>
              <p className="history-item__date">{entry.date}</p>
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
            </li>
          ))}
        </ol>
      ) : (
        <p className="empty-message">近日始動</p>
      )}
    </div>
  );
}
