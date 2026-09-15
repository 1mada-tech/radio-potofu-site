import { NextResponse } from "next/server";
import { createThemePost } from "@/lib/themes";

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
  return NextResponse.json({ ok: true });
}
