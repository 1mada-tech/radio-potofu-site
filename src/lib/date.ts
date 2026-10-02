// サイトは日本時間(JST)前提の表示をするが、Vercelのサーバー実行環境は
// タイムゾーンがUTCになっていることが多い。new Date().getHours()等の
// ローカルタイム系メソッドをサーバーコンポーネントで使うと、実行環境の
// タイムゾーン次第で時刻がずれてしまう(例: 深夜0時〜9時台の日付が
// 前日になる)ため、必ずこの関数でJSTの値を明示的に取り出す。
function jstParts(dateInput: string | number) {
  const date = new Date(dateInput);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((p) => [p.type, p.value]));
  // hour12:falseでも24:00表記になることがあるWebKit系のクセを吸収。
  const hour = parts.hour === "24" ? "00" : parts.hour;
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour,
    minute: parts.minute,
  };
}

export function formatDate(dateInput: string | number) {
  const { year, month, day } = jstParts(dateInput);
  return `${year}.${month}.${day}`;
}

export function formatDateJa(dateInput: string | number) {
  const { year, month, day } = jstParts(dateInput);
  return `${year}年${Number(month)}月${Number(day)}日`;
}

export function formatDateTime(dateInput: string | number) {
  const { year, month, day, hour, minute } = jstParts(dateInput);
  return `${year}.${month}.${day} / ${hour}:${minute}`;
}
