import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import {
  client,
  getEssay,
  ESSAY_TYPE_SENRYU,
  ESSAY_TYPE_NOTE,
} from "@/lib/microcms";

// microCMSの「プレビュー」ボタンから呼ばれるエンドポイント。
// draftKeyの有効性を確認してからdraft modeを有効化し、該当記事のページへ飛ばす。
export async function GET(request: Request) {
  if (!client) {
    return new Response("microCMS is not configured", { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const draftKey = searchParams.get("draftKey");
  const contentId = searchParams.get("contentId");

  if (!draftKey || !contentId) {
    return new Response("draftKey and contentId are required", { status: 400 });
  }

  const essay = await getEssay(contentId, draftKey);
  if (!essay) {
    return new Response("Invalid draftKey or contentId", { status: 401 });
  }

  (await draftMode()).enable();

  const basePath = essay.type?.includes(ESSAY_TYPE_SENRYU)
    ? "senryu"
    : essay.type?.includes(ESSAY_TYPE_NOTE)
      ? "note"
      : null;

  if (!basePath) {
    return new Response("Unknown content type", { status: 400 });
  }

  redirect(`/${basePath}/${contentId}?draftKey=${draftKey}`);
}
