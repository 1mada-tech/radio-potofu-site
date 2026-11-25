import { pool } from "@/lib/db";
import type { SceneVariant } from "@/lib/encounterShareImage";

export type EncounterCreatureRef = {
  id: number;
  poem: string;
  createdAt: string;
  honorific: string;
  entryNumber: number;
};

export type PotEncounter = {
  id: number;
  scene: SceneVariant;
  note: string | null;
  requestedAt: string;
  metAt: string | null;
  // 遭遇の通し番号(申請順、1始まり)。キャラの投入順entryNumberと同じ考え方。
  entryNumber: number;
  creatureA: EncounterCreatureRef;
  creatureB: EncounterCreatureRef;
};

const entryNumberFor = (alias: string) =>
  `(SELECT COUNT(*) FROM pot_creatures p2 WHERE p2.created_at <= ${alias}.created_at)`;

const ENCOUNTER_SELECT = `
  SELECT
    e.id, e.scene, e.note, e.requested_at, e.met_at,
    (SELECT COUNT(*) FROM pot_encounters e2 WHERE e2.requested_at <= e.requested_at) AS entry_number,
    ca.id AS a_id, ca.poem AS a_poem, ca.created_at AS a_created_at, ca.honorific AS a_honorific,
    ${entryNumberFor("ca")} AS a_entry_number,
    cb.id AS b_id, cb.poem AS b_poem, cb.created_at AS b_created_at, cb.honorific AS b_honorific,
    ${entryNumberFor("cb")} AS b_entry_number
  FROM pot_encounters e
  JOIN pot_creatures ca ON ca.id = e.creature_a_id
  JOIN pot_creatures cb ON cb.id = e.creature_b_id
`;

type Row = {
  id: number;
  scene: string;
  note: string | null;
  requested_at: string;
  met_at: string | null;
  entry_number: string;
  a_id: number;
  a_poem: string;
  a_created_at: string;
  a_honorific: string;
  a_entry_number: string;
  b_id: number;
  b_poem: string;
  b_created_at: string;
  b_honorific: string;
  b_entry_number: string;
};

function toEncounter(row: Row): PotEncounter {
  return {
    id: row.id,
    scene: row.scene as SceneVariant,
    note: row.note,
    requestedAt: row.requested_at,
    metAt: row.met_at,
    entryNumber: Number(row.entry_number),
    creatureA: {
      id: row.a_id,
      poem: row.a_poem,
      createdAt: row.a_created_at,
      honorific: row.a_honorific,
      entryNumber: Number(row.a_entry_number),
    },
    creatureB: {
      id: row.b_id,
      poem: row.b_poem,
      createdAt: row.b_created_at,
      honorific: row.b_honorific,
      entryNumber: Number(row.b_entry_number),
    },
  };
}

// 公開ギャラリー用。note記入済み(発行済み)のものだけ、出会った日が新しい順。
export async function getPublishedEncounters(): Promise<PotEncounter[]> {
  const { rows } = await pool.query<Row>(`${ENCOUNTER_SELECT} WHERE e.note IS NOT NULL ORDER BY e.met_at DESC`);
  return rows.map(toEncounter);
}

// 「ナベカ申請チェック」用。まだnoteを書いていない申請、古い順。
export async function getPendingEncounters(): Promise<PotEncounter[]> {
  const { rows } = await pool.query<Row>(`${ENCOUNTER_SELECT} WHERE e.note IS NULL ORDER BY e.requested_at ASC`);
  return rows.map(toEncounter);
}

// 僕(Claude)が遭遇シーンのひとことメッセージを手書きしたあと、DBに書き込むための更新。
export async function setEncounterNote(id: number, note: string): Promise<void> {
  await pool.query(`UPDATE pot_encounters SET note = $1, met_at = now() WHERE id = $2`, [note, id]);
}

export type CreateEncounterResult =
  | { status: "created" }
  | { status: "duplicate"; existing: PotEncounter }
  | { status: "daily-cap-reached" }
  | { status: "invalid" };

// 申請の作成。ペア順序はid昇順に正規化する(A×BとB×Aを同一視するため)。
// 「同じペア+場面の再申請」と「1日1件の上限」は、DB側のユニーク制約が
// 確実に(競合状態も含めて)弾いてくれるので、ここではそのエラーを検知して
// 適切な結果を返すだけにする。
export async function createEncounterRequest(params: {
  creatureAId: number;
  creatureBId: number;
  scene: SceneVariant;
}): Promise<CreateEncounterResult> {
  if (params.creatureAId === params.creatureBId) return { status: "invalid" };
  const [aId, bId] = [params.creatureAId, params.creatureBId].sort((x, y) => x - y);

  try {
    await pool.query(`INSERT INTO pot_encounters (creature_a_id, creature_b_id, scene) VALUES ($1, $2, $3)`, [
      aId,
      bId,
      params.scene,
    ]);
    return { status: "created" };
  } catch (err) {
    const pgErr = err as { code?: string; constraint?: string };
    if (pgErr.code === "23505") {
      if (pgErr.constraint === "pot_encounters_pair_scene_uniq") {
        const { rows } = await pool.query<Row>(
          `${ENCOUNTER_SELECT} WHERE e.creature_a_id = $1 AND e.creature_b_id = $2 AND e.scene = $3`,
          [aId, bId, params.scene],
        );
        if (rows[0]) return { status: "duplicate", existing: toEncounter(rows[0]) };
      }
      if (pgErr.constraint === "pot_encounters_one_per_day") {
        return { status: "daily-cap-reached" };
      }
    }
    throw err;
  }
}

// 申請フォームの候補一覧用。カード発行済み(note記入済み)のキャラのみ対象
// (まだ住民票すら出ていない子をいきなり遭遇させるのは変なので)。
export async function getEncounterCandidates(): Promise<EncounterCreatureRef[]> {
  const { rows } = await pool.query<{
    id: number;
    poem: string;
    created_at: string;
    honorific: string;
    entry_number: string;
  }>(
    `SELECT c1.id, c1.poem, c1.created_at, c1.honorific, ${entryNumberFor("c1")} AS entry_number
     FROM pot_creatures c1
     WHERE c1.note IS NOT NULL
     ORDER BY c1.created_at DESC`,
  );
  return rows.map((r) => ({
    id: r.id,
    poem: r.poem,
    createdAt: r.created_at,
    honorific: r.honorific,
    entryNumber: Number(r.entry_number),
  }));
}
