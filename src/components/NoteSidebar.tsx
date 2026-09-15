import Link from "next/link";
import type { Essay } from "@/lib/microcms";
import { formatDate } from "@/lib/date";

export default function NoteSidebar({
  essays,
  currentId,
}: {
  essays: Essay[];
  currentId: string;
}) {
  return (
    <aside className="note-sidebar">
      <p className="note-sidebar__heading">過去記事</p>
      <ul className="note-sidebar__list">
        {essays.map((essay) => (
          <li key={essay.id}>
            <Link
              href={`/note/${essay.id}`}
              className={
                essay.id === currentId
                  ? "note-sidebar__link note-sidebar__link--current"
                  : "note-sidebar__link"
              }
            >
              <span className="note-sidebar__date">{formatDate(essay.publishDate)}</span>
              <span className="note-sidebar__title">{essay.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
