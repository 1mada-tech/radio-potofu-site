"use client";

import { useState } from "react";
import Image from "next/image";
import type { MicroCMSImage } from "@/lib/microcms";

type HeroProps = {
  image?: MicroCMSImage;
  introText: string;
};

function PoemText({ introText }: { introText: string }) {
  const lines = introText.split("\n");
  if (lines.length < 2) {
    return <p className="hero__poem-body">{introText}</p>;
  }
  const title = lines[0];
  const body = lines.slice(1).join("\n");
  return (
    <>
      <p className="hero__poem-kicker">今月の詩</p>
      <p className="hero__poem-title">{title}</p>
      <p className="hero__poem-body">{body}</p>
    </>
  );
}

export default function Hero({ image, introText }: HeroProps) {
  const [showPoem, setShowPoem] = useState(true);

  return (
    <section
      className="hero"
      onClick={() => image && setShowPoem((v) => !v)}
      role={image ? "button" : undefined}
      tabIndex={image ? 0 : undefined}
      aria-label={image ? (showPoem ? "詩を隠す" : "詩を表示する") : undefined}
      onKeyDown={(e) => {
        if (image && (e.key === "Enter" || e.key === " ")) setShowPoem((v) => !v);
      }}
    >
      {image ? (
        <>
          <div className="hero__image">
            <Image
              src={image.url}
              alt="ラジオポトフ"
              width={image.width}
              height={image.height}
              priority
              sizes="100vw"
            />
            <span className="hero__credit">2021年撮影</span>
          </div>
          <div className={`hero__poem${showPoem ? "" : " hero__poem--hidden"}`}>
            <PoemText introText={introText} />
          </div>
        </>
      ) : (
        <div className="container hero__text">
          <PoemText introText={introText} />
        </div>
      )}
    </section>
  );
}
