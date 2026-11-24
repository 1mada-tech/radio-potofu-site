import { NextResponse } from "next/server";
import { createEncounterRequest } from "@/lib/potEncounters";
import { SCENE_LABELS, type SceneVariant } from "@/lib/encounterShareImage";
import { sendNotificationEmail } from "@/lib/notify";

const VALID_SCENES = new Set(Object.keys(SCENE_LABELS));

export async function POST(request: Request) {
  const data = await request.json();

  // ハニーポット: bot対策。人間には見えない欄に何か入っていたら無視する。
  if (data.website) {
    return NextResponse.json({ ok: true });
  }

  const creatureAId = Number(data.creatureAId);
  const creatureBId = Number(data.creatureBId);
  const scene = typeof data.scene === "string" ? data.scene : "";

  if (!Number.isInteger(creatureAId) || !Number.isInteger(creatureBId) || !VALID_SCENES.has(scene)) {
    return NextResponse.json({ error: "入力内容が正しくありません" }, { status: 400 });
  }

  const result = await createEncounterRequest({
    creatureAId,
    creatureBId,
    scene: scene as SceneVariant,
  });

  if (result.status === "created") {
    await sendNotificationEmail(
      "【ラジオポトフ】ナベカの遭遇シーンが申請されました",
      `キャラID: ${creatureAId} × ${creatureBId}\n場面: ${SCENE_LABELS[scene as SceneVariant]}`,
    );
  }

  return NextResponse.json({ result });
}
