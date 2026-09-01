import Link from "next/link";
import Image from "next/image";
import Hero from "@/components/Hero";
import EpisodeCard from "@/components/EpisodeCard";
import EssayCard from "@/components/EssayCard";
import {
  getSiteSettings,
  getEssaysByType,
  ESSAY_TYPE_SENRYU,
  ESSAY_TYPE_NOTE,
  type MicroCMSImage,
} from "@/lib/microcms";
import { getEpisodes } from "@/lib/podcast";

export const revalidate = 60;

type MemberInfo = {
  name?: string;
  bio?: string;
  photo?: MicroCMSImage;
};

const LISTENER_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeOhplhZTIclDQfUUbQTYbWwDkKVQOOTCOZPXOSwTTCXSo6rw/viewform";

function SectionHeading({
  tag,
  title,
  color = "teal",
}: {
  tag: string;
  title: React.ReactNode;
  color?: "teal" | "red";
}) {
  return (
    <div className="section-title">
      <span className={`pop-tag pop-tag--${color}`}>{tag}</span>
      <h2>{title}</h2>
    </div>
  );
}

function MemberRow({ member }: { member: MemberInfo }) {
  if (!member.name) return null;

  return (
    <div className="member-row">
      {member.photo && (
        <div className="member-row__photo">
          <Image
            src={member.photo.url}
            alt={member.name}
            width={member.photo.width}
            height={member.photo.height}
          />
        </div>
      )}
      <div className="member-row__body">
        <h3>{member.name}</h3>
        <p>{member.bio}</p>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const [siteSettings, episodesRes, senryuRes, noteRes] = await Promise.all([
    getSiteSettings(),
    getEpisodes(3),
    getEssaysByType(ESSAY_TYPE_SENRYU, 3),
    getEssaysByType(ESSAY_TYPE_NOTE, 3),
  ]);

  const members: MemberInfo[] = [
    {
      name: siteSettings.member1Name,
      bio: siteSettings.member1Bio,
      photo: siteSettings.member1Photo,
    },
    {
      name: siteSettings.member2Name,
      bio: siteSettings.member2Bio,
      photo: siteSettings.member2Photo,
    },
  ].filter((m) => m.name);

  return (
    <>
      <div className="container hero-cta">
        <a
          href={LISTENER_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hero-cta__button"
        >
          <span className="hero-cta__label">おたよりはこちらから</span>
          <span className="hero-cta__note">★Googleフォームに飛びます</span>
        </a>
      </div>

      <Hero image={siteSettings.heroImage} introText={siteSettings.introText} />

      {members.length > 0 && (
        <section className="section container">
          <h2>パーソナリティ</h2>
          <div className="member-list">
            {members.map((member) => (
              <MemberRow member={member} key={member.name} />
            ))}
          </div>
        </section>
      )}

      <section className="section container">
        <div className="section__header">
          <SectionHeading tag="ラジオポトフの！" title="これまでの配信" />
          <Link href="/episodes" className="section__more">
            すべて見る →
          </Link>
        </div>
        {episodesRes.contents.length > 0 ? (
          <div className="list">
            {episodesRes.contents.map((episode) => (
              <EpisodeCard key={episode.id} episode={episode} />
            ))}
          </div>
        ) : (
          <p className="empty-message">まだエピソードが登録されていません。</p>
        )}
      </section>

      <section className="section container">
        <div className="section__header">
          <SectionHeading tag="ラジオポトフの！" title="現代川柳" color="red" />
          <Link href="/senryu" className="section__more">
            すべて見る →
          </Link>
        </div>
        {senryuRes.contents.length > 0 ? (
          <div className="list">
            {senryuRes.contents.map((essay) => (
              <EssayCard key={essay.id} essay={essay} basePath="/senryu" />
            ))}
          </div>
        ) : (
          <p className="empty-message">まだ投稿がありません。</p>
        )}
      </section>

      <section className="section container">
        <div className="section__header">
          <SectionHeading tag="ラジオポトフの！" title="ひみつノート" />
          <Link href="/note" className="section__more">
            すべて見る →
          </Link>
        </div>
        {noteRes.contents.length > 0 ? (
          <div className="list">
            {noteRes.contents.map((essay) => (
              <EssayCard key={essay.id} essay={essay} basePath="/note" />
            ))}
          </div>
        ) : (
          <p className="empty-message">まだ投稿がありません。</p>
        )}
      </section>

      <section className="section container">
        <SectionHeading
          tag="ラジオポトフへの！"
          title={
            <>
              おたよりは
              <a href={LISTENER_FORM_URL} target="_blank" rel="noopener noreferrer">
                こちらから
              </a>
            </>
          }
          color="red"
        />
      </section>
    </>
  );
}
