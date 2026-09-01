import type { Metadata } from "next";
import { Noto_Sans_JP, Zen_Kaku_Gothic_New, Shippori_Mincho } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSiteSettings } from "@/lib/microcms";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body",
  display: "swap",
});

const zenKakuGothicNew = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-heading",
  display: "swap",
});

const shipporiMincho = Shippori_Mincho({
  subsets: ["latin"],
  weight: ["400", "800"],
  variable: "--font-mincho",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ラジオポトフ",
    template: "%s | ラジオポトフ",
  },
  description: "ポッドキャスト「ラジオポトフ」公式サイト",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteSettings = await getSiteSettings();

  return (
    <html lang="ja">
      <body
        className={`${notoSansJP.variable} ${zenKakuGothicNew.variable} ${shipporiMincho.variable}`}
      >
        <Header />
        <main>{children}</main>
        <Footer footerText={siteSettings.footerText} />
      </body>
    </html>
  );
}
