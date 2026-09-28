// 記事本文(HTML)から、メタディスクリプション用の短いプレーンテキストを作る。
export function excerptFromHtml(html: string, maxLength = 100): string {
  const text = html
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}
