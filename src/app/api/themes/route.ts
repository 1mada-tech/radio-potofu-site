import { NextResponse } from "next/server";
import { createThemePost } from "@/lib/themes";
import { sendNotificationEmail } from "@/lib/notify";

export async function POST(request: Request) {
  const data = await request.json();

  // ハニーポット: bot対策。人間には見えない欄に何か入っていたら無視する。
  if (data.website) {
    return NextResponse.json({ ok: true });
  }

  const body = typeof data.body === "string" ? data.body : "";
  if (!body.trim()) {
    return NextResponse.json({ error: "本文を入力してください" }, { status: 400 });
  }

  const parentId =
    typeof data.parentId === "number" && Number.isInteger(data.parentId)
      ? data.parentId
      : null;
  const authorName = typeof data.authorName === "string" ? data.authorName : null;

  await createThemePost({ parentId, authorName, body });
  await sendNotificationEmail(
    parentId ? "【ラジオポトフ】テーマ募集に返信がありました" : "【ラジオポトフ】テーマ募集に投稿がありました",
    `投稿者: ${authorName || "名無し"}\n本文: ${body}`,
  );
  return NextResponse.json({ ok: true });
}
