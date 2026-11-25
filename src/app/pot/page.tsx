import type { Metadata } from "next";
import Link from "next/link";
import { getPotCreatures, getAllPotCreatures } from "@/lib/potCreatures";
import { getEncounterCandidates } from "@/lib/potEncounters";
import { getPotContent } from "@/lib/potContent";
import PotScene from "@/components/PotScene";
import PotForm from "@/components/PotForm";
import PotLog from "@/components/PotLog";
import PotChat from "@/components/PotChat";
import DashiList from "@/components/DashiList";
import EncounterRequestForm from "@/components/EncounterRequestForm";
import EncounterGallery from "@/components/EncounterGallery";
import { pageMetadata } from "@/lib/pageMetadata";

export const metadata: Metadata = pageMetadata({
  title: "川柳ポトフ鍋",
  description: "投稿された現代川柳がキャラになり、鍋で煮込まれます。",
  path: "/pot",
  image: "/images/og-pot.jpg",
});
export const revalidate = 20;

export default async function PotPage() {
  const [creatures, allCreatures, content, encounterCandidates] = await Promise.all([
    getPotCreatures(),
    getAllPotCreatures(),
    getPotContent(),
    getEncounterCandidates(),
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
        poetNamePlaceholder={content.formPoetNamePlaceholder}
        poemPlaceholder={content.formPoemPlaceholder}
        submitLabel={content.formSubmitLabel}
      />
      <PotScene creatures={creatures} tooltipLifespanTemplate={content.tooltipLifespanTemplate} />
      {encounterCandidates.length >= 2 && (
        <section className="pot-log">
          <h2 className="pot-log__heading">キャラたちを出会わせてみる</h2>
          <p className="pot-log__caption">
            鍋カード(住民票)が発行済みの2匹と、出会いの場面を選んでください。
            <br />
            申請から通常24時間以内に出会いの「場面カード」が発行されます。
          </p>
          <EncounterRequestForm candidates={encounterCandidates} />
        </section>
      )}
      <EncounterGallery />
      <PotLog
        creatures={allCreatures}
        heading={content.logHeading}
        captionTemplate={content.logCaptionTemplate}
        tooltipLifespanTemplate={content.tooltipLifespanTemplate}
      />
      <DashiList />
      <PotChat creatures={creatures} />
      <div className="hero-cta">
        <Link href="/episodes?tag=現代川柳" className="hero-cta__button">
          <span className="hero-cta__label">これまでの現代川柳回</span>
          <span className="hero-cta__note">★現代川柳の話をした回の一覧です</span>
        </Link>
        <Link href="/senryu" className="hero-cta__button">
          <span className="hero-cta__label">現代川柳あれこれ</span>
          <span className="hero-cta__note">★現代川柳についての投稿</span>
        </Link>
      </div>
    </div>
  );
}
