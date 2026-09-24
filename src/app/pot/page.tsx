import type { Metadata } from "next";
import Link from "next/link";
import { getPotCreatures } from "@/lib/potCreatures";
import { POT_LIFESPAN_DAYS } from "@/lib/creature";
import PotScene from "@/components/PotScene";
import PotForm from "@/components/PotForm";

export const metadata: Metadata = { title: "ポトフ鍋" };
export const revalidate = 0;

export default async function PotPage() {
  const creatures = await getPotCreatures();

  return (
    <div className="container page">
      <div className="page-heading">
        <h1>ポトフ鍋</h1>
        <p className="page-subtitle">The Pot</p>
      </div>
      <p className="page-caption">
        投稿した現代川柳からキャラが生まれて、鍋の中で暮らしはじめます。名前は川柳の中のカタカナ言葉から、いなければ末尾の文字からつけられます。{POT_LIFESPAN_DAYS}日経つと、鍋のダシになって溶けてしまいます。
      </p>
      <PotForm />
      <PotScene creatures={creatures} />
      <p className="pot-archive-link">
        <Link href="/pot/archive">鍋の記録(出入り・節目・時間経過)はこちら →</Link>
      </p>
    </div>
  );
}
