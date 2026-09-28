import Link from "next/link";
import Hero from "@/components/Hero";
import EpisodeCard from "@/components/EpisodeCard";
import EssayCard from "@/components/EssayCard";
import {
  getSiteSettings,
  getEssaysByType,
  ESSAY_TYPE_SENRYU,
  ESSAY_TYPE_NOTE,
} from "@/lib/microcms";
import { getEpisodes } from "@/lib/podcast";
import { getMembers, type Member } from "@/lib/members";

export const revalidate = 60;

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

const MEMBER_COLORS: Record<string, { bg: string; text: string }> = {
  今田健太郎: { bg: "#4cd964", text: "#ffffff" },
  高澤聡美: { bg: "#e6342b", text: "#ffffff" },
  鳥原弓里江: { bg: "#ffffff", text: "#211a15" },
};

const MEMBER_EMOJI: Record<string, string> = {
  今田健太郎: "🎙️",
  高澤聡美: "🍚",
  鳥原弓里江: "🧾",
};

const MEMBER_EMOJI_SECONDARY: Record<string, string> = {
  鳥原弓里江: "🐧",
};

function ProfileRow({ profile }: { profile: Member }) {
  const color = MEMBER_COLORS[profile.name];
  const emoji = MEMBER_EMOJI[profile.name];
  const secondaryEmoji = MEMBER_EMOJI_SECONDARY[profile.name];
  return (
    <div className="member-row">
      {color && (
        <span
          className="member-row__stripe"
          style={{ backgroundColor: color.bg, color: color.text }}
        >
          {profile.participation}
        </span>
      )}
      <div className="member-row__body">
        {emoji && profile.title && (
          <p className="member-row__emoji">
            {(() => {
              const count = Math.max(1, Math.round(Array.from(profile.title).length / 2));
              if (!secondaryEmoji) return emoji.repeat(count);
              const firstHalf = Math.ceil(count / 2);
              return emoji.repeat(firstHalf) + secondaryEmoji.repeat(count - firstHalf);
            })()}
          </p>
        )}
        {profile.title && <p className="member-row__meta">{profile.title}</p>}
        <h3 className="member-row__name">
          {profile.name}
          {profile.romaji && <span className="member-row__romaji">{profile.romaji}</span>}
        </h3>
        {profile.bio && <p>{profile.bio}</p>}
        {profile.links.length > 0 && (
          <div className="member-row__links">
            {profile.links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="member-row__link"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default async function HomePage() {
  const [siteSettings, episodesRes, senryuRes, noteRes, profiles] = await Promise.all([
    getSiteSettings(),
    getEpisodes(3),
    getEssaysByType(ESSAY_TYPE_SENRYU, 3),
    getEssaysByType(ESSAY_TYPE_NOTE, 3),
    getMembers(),
  ]);

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
          <p className="empty-message">近日始動</p>
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
          <p className="empty-message">近日始動</p>
        )}
      </section>

      {profiles.length > 0 && (
        <section className="section container">
          <div className="section__header">
            <SectionHeading tag="ラジオポトフは！" title="こんなひとたち" color="red" />
          </div>
          <div className="member-list">
            {profiles.map((profile) => (
              <ProfileRow profile={profile} key={profile.name} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
