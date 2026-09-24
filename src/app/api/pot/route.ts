import { NextResponse } from "next/server";
import { createPotCreature } from "@/lib/potCreatures";

export async function POST(request: Request) {
  const data = await request.json();

  // ハニーポット: bot対策。人間には見えない欄に何か入っていたら無視する。
  if (data.website) {
    return NextResponse.json({ ok: true });
  }

  const poem = typeof data.poem === "string" ? data.poem : "";
  if (!poem.trim()) {
    return NextResponse.json({ error: "川柳を入力してください" }, { status: 400 });
  }

  const authorName = typeof data.authorName === "string" ? data.authorName : "";

  await createPotCreature({ authorName, poem });
  return NextResponse.json({ ok: true });
}
