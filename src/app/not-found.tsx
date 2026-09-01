import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container page">
      <h1>ページが見つかりませんでした</h1>
      <p>お探しのページは存在しないか、移動した可能性があります。</p>
      <Link href="/">トップページへ戻る</Link>
    </div>
  );
}
