import { Resend } from "resend";

// テーマ募集への投稿、鍋への川柳投入があったときに配信者へメール通知する。
// RESEND_API_KEYが未設定の環境(ローカル開発など)では黙って何もしない。
const NOTIFY_TO = "1mada2mada3mada@gmail.com";
const NOTIFY_FROM = "ラジオポトフ通知 <onboarding@resend.dev>";

export async function sendNotificationEmail(subject: string, text: string): Promise<void> {
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
