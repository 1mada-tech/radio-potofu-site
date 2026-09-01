import Link from "next/link";
import type { Essay } from "@/lib/microcms";
import { formatDate } from "@/lib/date";

export default function EssayCard({
  essay,
  basePath,
}: {
  essay: Essay;
  basePath: string;
}) {
  return (
    <Link href={`${basePath}/${essay.id}`} className="card card--essay">
      <p className="card__date">{formatDate(essay.publishDate)}</p>
      <h3 className="card__title">{essay.title}</h3>
    </Link>
  );
}
