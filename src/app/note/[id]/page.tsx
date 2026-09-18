import { notFound } from "next/navigation";
import { getEssay, getEssaysByType, ESSAY_TYPE_NOTE } from "@/lib/microcms";
import { formatDateJa } from "@/lib/date";
import NoteSidebar from "@/components/NoteSidebar";

export default async function ZatsubunDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ draftKey?: string }>;
}) {
  const { id } = await params;
  const { draftKey } = await searchParams;
  const [essay, { contents: allEssays }] = await Promise.all([
    getEssay(id, draftKey),
    getEssaysByType(ESSAY_TYPE_NOTE, 100),
  ]);
  if (!essay) notFound();

  return (
    <div className="container page note-detail-layout">
      <article className="page--article">
        <h1>{essay.title}</h1>
        <div
          className="article__body"
          dangerouslySetInnerHTML={{ __html: essay.body }}
        />
        <p className="article__date article__date--footer">
          {formatDateJa(essay.publishDate)}
          {essay.author ? ` / ${essay.author}` : ""}
        </p>
      </article>
      <NoteSidebar essays={allEssays} currentId={id} />
    </div>
  );
}
