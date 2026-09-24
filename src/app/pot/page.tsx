import type { Metadata } from "next";
import { getPotCreatures } from "@/lib/potCreatures";
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
        投稿した現代川柳からキャラが生まれて、鍋の中で暮らしはじめます。名前は川柳の中のカタカナ言葉から、いなければ末尾の文字からつけられます。
      </p>
      <PotForm />
      <PotScene creatures={creatures} />
    </div>
  );
}
