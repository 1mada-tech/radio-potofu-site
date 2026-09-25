import type { Metadata } from "next";
import Link from "next/link";
import EssayCard from "@/components/EssayCard";
import { getEssaysByType, ESSAY_TYPE_SENRYU } from "@/lib/microcms";
import { getSenryuCaption } from "@/lib/caption";
import Pagination from "@/components/Pagination";
import SenryuHeading from "@/components/SenryuHeading";

export const metadata: Metadata = { title: "現代川柳" };

const PER_PAGE = 12;

export default async function SenryuPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const offset = (page - 1) * PER_PAGE;
  const { contents, totalCount } = await getEssaysByType(
    ESSAY_TYPE_SENRYU,
    PER_PAGE,
    offset,
  );
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));
  const caption = await getSenryuCaption();

  return (
    <div className="container page">
      {caption ? (
        <SenryuHeading
          candidates={caption.candidates}
          initialIndex={caption.initialIndex}
          before={caption.before}
          after={caption.after}
          totalVersion={caption.totalVersion}
        />
      ) : (
        <div className="page-heading">
          <h1>現代川柳</h1>
          <p className="page-subtitle">Senryu</p>
        </div>
      )}
      <p className="senryu-pot-link">
        <Link href="/pot">投稿した川柳からキャラが生まれる「川柳ポトフ鍋」はこちら →</Link>
      </p>
      {contents.length > 0 ? (
        <>
          <Pagination
            page={page}
            totalPages={totalPages}
            hrefTemplate="/senryu?page={page}"
          />
          <div className="list">
            {contents.map((essay) => (
              <EssayCard key={essay.id} essay={essay} basePath="/senryu" />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            hrefTemplate="/senryu?page={page}"
          />
        </>
      ) : (
        <p className="empty-message">近日始動</p>
      )}
    </div>
  );
}
