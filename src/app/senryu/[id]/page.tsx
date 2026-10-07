import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEssay } from "@/lib/microcms";
import { formatDateJa } from "@/lib/date";
import { excerptFromHtml } from "@/lib/excerpt";
import { pageMetadata } from "@/lib/pageMetadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const essay = await getEssay(id);
  if (!essay) return {};
  return pageMetadata({
    title: essay.title,
    description: excerptFromHtml(essay.body),
    path: `/senryu/${id}`,
  });
}

export default async function SenryuDetailPage({
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
        {/* 公開前の下書きプレビューではpublishDateが未設定でクラッシュするため、
            その場合はcreatedAtにフォールバックする。 */}
        {formatDateJa(essay.publishDate || essay.createdAt)}
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
