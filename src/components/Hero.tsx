import Image from "next/image";
import type { MicroCMSImage } from "@/lib/microcms";

type HeroProps = {
  image?: MicroCMSImage;
  introText: string;
};

function PoemText({ introText }: { introText: string }) {
  const lines = introText.split("\n");
  if (lines.length < 3) {
    return <p className="hero__poem-body">{introText}</p>;
  }
  const title = lines[0];
  const date = lines[lines.length - 1];
  const body = lines.slice(1, -1).join("\n");
  return (
    <>
      <p className="hero__poem-title">{title}</p>
      <p className="hero__poem-body">{body}</p>
      <p className="hero__poem-date">{date}</p>
    </>
  );
}

export default function Hero({ image, introText }: HeroProps) {
  return (
    <section className="hero">
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
          <div className="hero__poem">
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
