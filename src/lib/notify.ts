import { Resend } from "resend";

// テーマ募集への投稿、鍋への川柳投入があったときに配信者へメール通知する。
// RESEND_API_KEYが未設定の環境では黙って何もしない。
// また、`npm run dev`(ローカル開発)ではNODE_ENVが自動的に"development"に
// なるため、.env.localに本番と同じAPIキーが入っていても、ローカルでの
// 動作確認で誤って本物の通知メールを飛ばさないよう常にスキップする
// (Vercel上の本番・プレビューはビルド時にNODE_ENVが"production"になるため、
// そちらは今まで通りメールが送られる)。
const NOTIFY_TO = "1mada2mada3mada@gmail.com";
const NOTIFY_FROM = "ラジオポトフ通知 <onboarding@resend.dev>";

export async function sendNotificationEmail(subject: string, text: string): Promise<void> {
  if (process.env.NODE_ENV !== "production") return;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: NOTIFY_FROM,
      to: NOTIFY_TO,
      subject,
      text,
    });
  } catch (error) {
    // 通知の失敗で投稿自体を失敗させたくないので、ログに残すだけにする。
    console.error("notification email failed:", error);
  }
}
