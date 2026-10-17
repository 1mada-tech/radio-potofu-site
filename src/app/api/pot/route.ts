import { NextResponse } from "next/server";
import { createPotCreature } from "@/lib/potCreatures";
import { sendNotificationEmail } from "@/lib/notify";

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
  const poetName = typeof data.poetName === "string" ? data.poetName : "";

  const creature = await createPotCreature({ authorName, poetName, poem });
  await sendNotificationEmail(
    "【ラジオポトフ】鍋に川柳が投入されました",
    `投稿者: ${authorName || "名無し"}\n作者: ${poetName || "(投稿者本人)"}\n川柳: ${poem}`,
  );
  return NextResponse.json({ ok: true, creature });
}
