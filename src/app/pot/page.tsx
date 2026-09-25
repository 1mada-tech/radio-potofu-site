import type { Metadata } from "next";
import { getPotCreatures, getAllPotCreatures } from "@/lib/potCreatures";
import { getPotContent } from "@/lib/potContent";
import PotScene from "@/components/PotScene";
import PotForm from "@/components/PotForm";
import PotLog from "@/components/PotLog";

export const metadata: Metadata = { title: "川柳ポトフ鍋" };
export const revalidate = 0;

export default async function PotPage() {
  const [creatures, allCreatures, content] = await Promise.all([
    getPotCreatures(),
    getAllPotCreatures(),
    getPotContent(),
  ]);

  return (
    <div className="container page">
      <div className="page-heading">
        <h1>川柳ポトフ鍋</h1>
        <p className="page-subtitle">The Pot</p>
      </div>
      <p className="page-caption">{content.caption}</p>
      <PotForm
        namePlaceholder={content.formNamePlaceholder}
        poemPlaceholder={content.formPoemPlaceholder}
        submitLabel={content.formSubmitLabel}
      />
      <PotScene creatures={creatures} />
      <PotLog
        creatures={allCreatures}
        heading={content.logHeading}
        captionTemplate={content.logCaptionTemplate}
      />
    </div>
  );
}
