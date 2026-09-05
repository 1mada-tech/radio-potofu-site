import { notFound } from "next/navigation";
import { getEssay } from "@/lib/microcms";
import { formatDateJa } from "@/lib/date";

export default async function ZatsubunDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ draftKey?: string }>;
}) {
  const { id } = await params;
  const { draftKey } = await searchParams;
  const essay = await getEssay(id, draftKey);
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
