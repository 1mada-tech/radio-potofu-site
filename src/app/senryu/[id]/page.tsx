import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEssay } from "@/lib/microcms";
import { formatDateJa } from "@/lib/date";
import { excerptFromHtml } from "@/lib/excerpt";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const essay = await getEssay(id);
  if (!essay) return {};
  return {
    title: essay.title,
    description: excerptFromHtml(essay.body),
  };
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
