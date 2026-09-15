import { NextResponse } from "next/server";
import { updateThemeStatus, type ThemeStatus } from "@/lib/themes";

const VALID_STATUSES = ["considering", "adopted", "recorded", null];

export async function POST(request: Request) {
  const data = await request.json();
  const id = Number(data.id);
  const status = (data.status ?? null) as ThemeStatus;

  if (!Number.isInteger(id) || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  await updateThemeStatus(id, status);
  return NextResponse.json({ ok: true });
}
