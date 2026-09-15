import { NextResponse } from "next/server";
import { deleteThemePost } from "@/lib/themes";

export async function POST(request: Request) {
  const data = await request.json();
  const id = Number(data.id);

  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  await deleteThemePost(id);
  return NextResponse.json({ ok: true });
}
