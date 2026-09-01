import { notFound } from "next/navigation";
import { getEssay } from "@/lib/microcms";
import { formatDateJa } from "@/lib/date";

export default async function ZatsubunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const essay = await getEssay(id);
  if (!essay) notFound();

  return (
    <article className="container page page--article">
      <p className="article__date">
        {formatDateJa(essay.publishDate)}
        {essay.author ? ` / ${essay.author}` : ""}
      </p>
      <h1>{essay.title}</h1>
      <div
        className="article__body"
        dangerouslySetInnerHTML={{ __html: essay.body }}
      />
    </article>
  );
}
