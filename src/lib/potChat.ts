// 鍋の中のキャラたちの、それっぽい会話を自動生成する。
// 「鍋内のひととき」機能用。文字起こし(体)の演出なので、実際に意味の
// 通った会話である必要はなく、雰囲気重視。
//
// solo: 話者1人のひとり言。
// exchange: 2人のやり取り(2行ワンセット)。{B}はもう一方の話者名に置き換わる。
// group3: 3人のやり取り(3行ワンセット、names.length>=3の時だけ使う)。
//         {B}{C}はそれぞれ他の2人の話者名に置き換わる。
// {SUFFIX}: どのタイプでも使える。そのセリフを言っている本人の敬称
// (くん/ちゃん/にゃん等、名前の末尾部分)だけに置き換わる。
// 文言はここで調整できる。

// requires: このテンプレートを使うのに必要な話題データ。
// {EP}は最新エピソードのタイトル、{NOTE}は最新note記事のタイトルに
// 置き換わる(どちらも使う時はrequiresに両方書く)。該当データが
// 取得できなかった場合、そのテンプレートは自動的に使われない。
type Topic = "episode" | "note" | "waiting";
type SoloLine = { type: "solo"; text: string; requires?: Topic[] };
type ExchangeLine = { type: "exchange"; a: string; b: string; requires?: Topic[] };
type Group3Line = { type: "group3"; a: string; b: string; c: string; requires?: Topic[] };
type LineTemplate = SoloLine | ExchangeLine | Group3Line;

const LINE_BANK: LineTemplate[] = [
  { type: "solo", text: "あれ、ここどこだっけ…" },
  { type: "solo", text: "なんか良い匂いしてきたな" },
  { type: "solo", text: "ちょっと熱くない？" },
  { type: "solo", text: "もう慣れたよ" },
  { type: "solo", text: "スープになるってどんな気分なんだろう" },
  { type: "solo", text: "鍋の外、今日は晴れてるみたいだよ" },
  { type: "solo", text: "そろそろ味が馴染んできた気がする" },
  { type: "solo", text: "誰かが見てる気配がする" },
  { type: "solo", text: "…寝てた" },
  { type: "solo", text: "……{SUFFIX}、ってなんだよ" },
  { type: "solo", text: "自分で選んだわけじゃないんだけど、{SUFFIX}って呼ばれてる" },
  { type: "solo", text: "待機列にいた頃の方が涼しかった", requires: ["waiting"] },
  { type: "solo", text: "そろそろダシになる頃合いかもしれない" },
  { type: "solo", text: "溶けるのは怖くない。ただ名残惜しい" },
  { type: "solo", text: "今日の句会、自分の番あったかな" },
  { type: "solo", text: "湯気の向こうに誰かいる気がする" },
  { type: "solo", text: "お椀に掬われる日を待っている" },
  { type: "solo", text: "この鍋、意外と居心地がいい" },
  { type: "solo", text: "最初はもっと尖った味だった気がする" },
  { type: "solo", text: "ふと、自分の川柳を思い出した" },
  { type: "solo", text: "鍋底の方が落ち着く" },
  { type: "solo", text: "もう何日目だろう" },
  { type: "solo", text: "今日はやけに静かだ" },
  { type: "solo", text: "気づいたら、ずっと同じ体勢でいる" },
  { type: "solo", text: "湯気がやけに白い" },
  { type: "solo", text: "たまには外の空気が恋しい" },
  { type: "solo", text: "鍋のふち、意外と見晴らしがいい" },
  { type: "solo", text: "誰かの句会の話が聞こえてきた" },
  { type: "solo", text: "この色合い、自分でも気に入ってる" },
  { type: "solo", text: "そういえば、まだ名乗ってなかった気がする" },
  { type: "solo", text: "味のことは、あまり深く考えないようにしてる" },
  { type: "solo", text: "隣の匂いが移ってきた" },
  { type: "solo", text: "今日のスープ、ちょっと薄い気がする" },
  { type: "solo", text: "火が強くなった気がする" },
  { type: "solo", text: "そろそろ出番かもしれない" },
  { type: "solo", text: "ここに来てから、時間の感覚がなくなった" },
  { type: "solo", text: "別に不満があるわけじゃない" },
  { type: "solo", text: "湯気の形、毎回違う気がする" },
  { type: "solo", text: "今、自分が何匹目か分からなくなった" },
  { type: "solo", text: "誰かに名前を呼ばれた気がした" },
  { type: "solo", text: "味変わったの、自分だけじゃないよね" },
  { type: "solo", text: "静かに揺られているのが好き" },

  { type: "exchange", a: "{B}、休みの日は何してるの？", b: "煮込まれてる" },
  { type: "exchange", a: "{B}、良い具材っぷりだね", b: "褒めてる？" },
  { type: "exchange", a: "さっきから湯気がすごいね", b: "気にしたら負けだよ" },
  { type: "exchange", a: "我々、煮込まれてるな", b: "そうだね" },
  { type: "exchange", a: "{B}はいつからここに？", b: "さあ…気づいたらいた" },
  { type: "exchange", a: "この鍋、出口あるのかな", b: "たぶんお椀だと思う" },
  { type: "exchange", a: "{B}、名前どうしてそうなったの？", b: "知らない。気づいたらそうだった" },
  { type: "exchange", a: "となりの{B}、静かだね", b: "寝てるだけだよ" },
  { type: "exchange", a: "鍋の記録、読まれてるらしいよ", b: "恥ずかしいこと言ってないよね" },
  { type: "exchange", a: "{B}はどんな川柳から生まれたの？", b: "忘れた。たぶん面白くなかった" },
  {
    type: "exchange",
    a: "待機列にいる子たち、元気かな",
    b: "こっちはこっちで大変なんだよ",
    requires: ["waiting"],
  },
  { type: "exchange", a: "溶けるの、{B}は怖くない？", b: "怖いけど、それもいいかなって" },
  { type: "exchange", a: "{B}、今日はよく喋るね", b: "湯気にあてられたのかも" },
  { type: "exchange", a: "さっきからずっと静かだけど大丈夫？", b: "{B}こそ喋りすぎじゃない？" },
  { type: "exchange", a: "鍋の記録、下の方までちゃんと読まれてるのかな", b: "全部読まれてたら恥ずかしいな" },
  { type: "exchange", a: "{B}、味は馴染んできた？", b: "馴染みすぎて自分がわからなくなってきた" },
  { type: "exchange", a: "外、今何時くらいだろう", b: "{B}、時計なんて持ってないでしょ" },
  { type: "exchange", a: "{B}とはもっと早く話したかったな", b: "同じ鍋にいるんだから、まだ間に合うよ" },
  { type: "exchange", a: "次に入ってくるのはどんな子かな", b: "{B}よりは落ち着いてるといいけど" },
  { type: "exchange", a: "{B}、その名前気に入ってる？", b: "慣れたらそれなりに悪くないよ" },
  { type: "exchange", a: "{B}、最近よく喋るようになったね", b: "慣れてきたのかも" },
  { type: "exchange", a: "このスープ、{B}はどう感じてる？", b: "まだよく分からない" },
  { type: "exchange", a: "{B}、鍋のどのあたりが好き？", b: "端っこかな。落ち着く" },
  { type: "exchange", a: "さっき揺れたよね", b: "{B}が動いたんじゃないの？" },
  { type: "exchange", a: "{B}の句、覚えてる？", b: "正直あんまり" },
  { type: "exchange", a: "ここ、意外と広いね", b: "{B}がそう思うだけかも" },
  { type: "exchange", a: "{B}、ちゃんと眠れてる？", b: "湯気のせいで夢ばかり見る" },
  { type: "exchange", a: "次に入ってくる子、誰か知ってる？", b: "{B}こそ知らないでしょ" },
  { type: "exchange", a: "{B}の名前、呼びやすいね", b: "そう？自分じゃよく分からない" },
  { type: "exchange", a: "今日は少し味が違う気がする", b: "{B}の気のせいだと思う" },
  { type: "exchange", a: "{B}、ここに来る前のこと覚えてる？", b: "うっすらとだけ" },
  { type: "exchange", a: "湯気って、{B}は平気？", b: "もう慣れた" },
  { type: "exchange", a: "{B}、鍋のふちまで行ったことある？", b: "怖くてまだない" },
  { type: "exchange", a: "さっきの揺れ、誰か気づいた？", b: "{B}が一番驚いてたよ" },
  { type: "exchange", a: "{B}はどこの句会から来たの？", b: "忘れちゃった、もう" },
  { type: "exchange", a: "静かだと、逆に落ち着かない", b: "{B}はにぎやかな方が好きなんだね" },
  { type: "exchange", a: "{B}、自分の番が来たらどうする？", b: "まだ考えてない" },
  { type: "exchange", a: "この鍋、意外と快適じゃない？", b: "{B}がそう思うなら、そうなのかも" },

  {
    type: "group3",
    a: "ねえ、この中で一番古株って誰だっけ",
    b: "たぶん{C}じゃない？",
    c: "急に話振らないでよ",
  },
  {
    type: "group3",
    a: "{B}と{C}、仲良さそうだね",
    b: "そう見える？",
    c: "{A}こそ、2人のこと気にしすぎじゃない？",
  },
  {
    type: "group3",
    a: "今日で鍋が何日目か、誰か数えてる？",
    b: "{C}が数えてそうなタイプ",
    c: "数えてないよ。たぶん",
  },
  {
    type: "group3",
    a: "みんな、味の感想ある？",
    b: "{A}に聞かれても困るな",
    c: "{B}の言う通り、自分の味ってよくわからない",
  },
  {
    type: "group3",
    a: "誰からともなく静かになったね",
    b: "{C}が黙ったからじゃない？",
    c: "{B}が先に黙ってたと思うけど",
  },
  {
    type: "group3",
    a: "{B}と{C}、最近よく喋ってるね",
    b: "そう？普通だよ",
    c: "{A}こそ、気にしすぎ",
  },
  {
    type: "group3",
    a: "誰からともなく歌い出しそうな空気だ",
    b: "{C}が歌うタイプには見えない",
    c: "{B}も似たようなものでしょ",
  },
  {
    type: "group3",
    a: "この3人、妙に馬が合う気がする",
    b: "{C}はどう思う？",
    c: "悪くはないと思う",
  },
  {
    type: "group3",
    a: "{B}、{C}のこと信頼してる？",
    b: "まあね",
    c: "急に名前出さないでよ",
  },

  // 番組のエピソード/note記事を使った話題。最新に限らず過去のものも
  // 話題に挙がる(pickTopicItemで重み付けランダムに選ぶ)。
  { type: "solo", text: "{EP}、もう聴いた", requires: ["episode"] },
  { type: "solo", text: "外では{EP}の話で持ちきりみたいだよ", requires: ["episode"] },
  { type: "solo", text: "noteの{NOTE}、内容が気になる", requires: ["note"] },
  { type: "solo", text: "{EP}、内容がどんな話か気になる", requires: ["episode"] },
  { type: "solo", text: "noteの{NOTE}、読む時間あるかな", requires: ["note"] },
  { type: "solo", text: "{EP}を聴いた感想、誰かに言いたい", requires: ["episode"] },
  {
    type: "exchange",
    a: "{B}、{EP}聴いた？",
    b: "まだなんだ。あとで聴く",
    requires: ["episode"],
  },
  {
    type: "exchange",
    a: "noteに{NOTE}って記事が出てたね",
    b: "{B}、もう読んだの？",
    requires: ["note"],
  },
  {
    type: "exchange",
    a: "{EP}、{B}はどう思った？",
    b: "鍋の中にいると、外の話って実感わかないな",
    requires: ["episode"],
  },
  {
    type: "exchange",
    a: "{EP}の内容、{B}はどう思う？",
    b: "正直、まだピンと来てない",
    requires: ["episode"],
  },
  {
    type: "exchange",
    a: "noteの{NOTE}、{B}は読んだ？",
    b: "まだ。気になってはいる",
    requires: ["note"],
  },
  {
    type: "exchange",
    a: "{B}、{EP}の話、外でもしてた？",
    b: "鍋の中までは届かないよ",
    requires: ["episode"],
  },

  // サイト内の他のセクションへの言及。
  { type: "solo", text: "ひみつノート、まだ覗いたことないんだよな" },
  { type: "solo", text: "年表に『寒空のもと、煮えたぎるポトフ鍋のように』って書いてあるらしい" },
  { type: "solo", text: "ネットプリント、コンビニで出せるって聞いた" },
  { type: "solo", text: "きょうのあなたに、で選ばれたことがある気がする" },
  { type: "solo", text: "テーマ募集、お題を考えるの苦手なんだよな" },
  { type: "solo", text: "おたよりを送るって機能、誰か使ったことあるのかな" },
  { type: "solo", text: "ひみつノート、気になってはいるんだけど後回しにしてる" },
  { type: "solo", text: "年表、時報を始めた話が載ってるの知ってる？" },
  { type: "solo", text: "ネットプリントがどんな見た目か想像つかない" },
  { type: "solo", text: "きょうのあなたに、って企画、誰が考えたんだろう" },
  { type: "solo", text: "テーマ募集、いざ考えると難しいよね" },
  { type: "solo", text: "おたよりを送るって、誰かから届いてるのかな" },
  { type: "exchange", a: "{B}、ひみつノート読んだ？", b: "気になってはいるんだけどね" },
  { type: "exchange", a: "年表、{B}は載ってた？", b: "探したけどまだ見つからないんだ" },
  {
    type: "exchange",
    a: "ネットプリントのやつ、{B}はもう印刷した？",
    b: "したよ。手元に残るのがいいよね",
  },
  { type: "exchange", a: "{B}、きょうのあなたに診断された？", b: "された。わりと当たってた" },
  { type: "exchange", a: "テーマ募集にお題出した？", b: "{B}こそ、出したの？" },
  { type: "exchange", a: "{B}、おたよりを送るって使ったことある？", b: "ないけど、気にはなってる" },
  { type: "exchange", a: "きょうのあなたに、って知ってる？", b: "{B}、名前は聞いたことあるよ" },
  {
    type: "exchange",
    a: "ネットプリント、{B}は気になってる？",
    b: "コンビニで印刷できるんだよね。やってみる",
  },
  { type: "exchange", a: "年表、プロフィール写真の話知ってる？", b: "{B}、まだなんだ。見てみようかな" },
  { type: "exchange", a: "{B}、テーマ募集に送るネタある？", b: "鍋の中からじゃ思いつかないよ" },
  { type: "solo", text: "年表を読むと高澤さんがベランダキャットと戦い始めた時期がわかるよ" },
  { type: "solo", text: "年表、音声を間違えてステレオで録った回があるらしい。誰も気づかなかったんだって" },
  { type: "solo", text: "年表に『ダジャレを言いまくるブーム』って書いてあって笑った" },
  { type: "solo", text: "年表を読むと再生数が2000回突破した時期がわかる。すごいよな" },
  {
    type: "exchange",
    a: "{B}、年表の『ジュラシックパークを観ながら収録したら本編まで録れてた』って話知ってる？",
    b: "知ってる。2時間まるごとボツになったやつだよね",
  },
  {
    type: "exchange",
    a: "年表、高澤さんが引っ越しと嘘ついて収録休んだ回あるらしいよ",
    b: "{B}、それ本当に嘘だったのかな",
  },
  {
    type: "exchange",
    a: "年表に『今田、現代川柳を知る』って書いてあったけど",
    b: "それ、たぶん自分たちが生まれるきっかけだよね",
  },
  {
    type: "group3",
    a: "{B}、年表の『初の昼収録』の話読んだ？",
    b: "読んだ。昼は飛行機が飛んでるって気づいた話でしょ",
    c: "{A}、それそんなに驚くこと？",
  },
  {
    type: "group3",
    a: "{B}はひみつノート読んでる？",
    b: "たまにね。{C}は？",
    c: "存在は知ってるけど、まだ",
  },
  {
    type: "group3",
    a: "{B}と{C}、ネットプリントの話してた？",
    b: "してないよ",
    c: "{A}の聞き間違いじゃない？",
  },
];

function makeRng(seed: number) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export type PotChatLine = { speaker: string; text: string };

export type PotChatTopicItem = { title: string; url: string };

export type PotChatTopics = {
  // 新しい順(先頭が最新)。最新だけでなく過去のものも話題に挙がる。
  episodes?: PotChatTopicItem[];
  notes?: PotChatTopicItem[];
  hasWaitingQueue?: boolean;
};

// 新しい順のリストから、最新を重めに・過去のものも控えめに選ぶ。
// (索引が若い=新しいほど重みが大きい、調和級数的な重み付け)
function pickTopicItem(list: PotChatTopicItem[] | undefined, rng: () => number): string {
  if (!list || list.length === 0) return "";
  const weights = list.map((_, i) => 1 / (i + 1));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < list.length; i++) {
    r -= weights[i];
    if (r <= 0) return list[i].title;
  }
  return list[list.length - 1].title;
}

// {EP}/{NOTE}を実際の話題データ(重み付けでランダムに選んだ1件)に置き換える。
function fillTopics(text: string, topics: PotChatTopics, rng: () => number): string {
  let result = text;
  if (result.includes("{EP}")) {
    result = result.replaceAll("{EP}", pickTopicItem(topics.episodes, rng));
  }
  if (result.includes("{NOTE}")) {
    result = result.replaceAll("{NOTE}", pickTopicItem(topics.notes, rng));
  }
  return result;
}

export type PotChatRosterMember = { name: string; honorific: string };

// 鍋に今いるキャラ(名前+敬称)一覧から、会話を組み立てる。
// 呼ぶたびに違う組み合わせになるよう、現在時刻を種にしている
// (ページを開き直すたびに別の会話が見られるようにするため)。
// topicsを渡すと、最新エピソード/note記事のタイトルを使った
// セリフも候補に入る(渡さない/取得できなかった分は自動で除外)。
export function generatePotChat(
  roster: PotChatRosterMember[],
  lineCount = 8,
  topics: PotChatTopics = {},
): PotChatLine[] {
  if (roster.length === 0) return [];

  const names = roster.map((r) => r.name);
  const honorificByName = new Map(roster.map((r) => [r.name, r.honorific]));

  const rng = makeRng(Date.now() + Math.floor(Math.random() * 1000000));

  // 既に選ばれている名前(exclude)を避けて、ランダムに話者を1人選ぶ。
  function pickName(exclude: string[] = []): string {
    const pool = names.filter((n) => !exclude.includes(n));
    const candidates = pool.length > 0 ? pool : names;
    return candidates[Math.floor(rng() * candidates.length)];
  }

  // {SUFFIX}を、そのセリフを言っている本人の敬称に置き換える。
  function fillOwnSuffix(text: string, speaker: string): string {
    return text.replaceAll("{SUFFIX}", honorificByName.get(speaker) ?? "");
  }

  const availableTopics = new Set<Topic>();
  if (topics.episodes && topics.episodes.length > 0) availableTopics.add("episode");
  if (topics.notes && topics.notes.length > 0) availableTopics.add("note");
  if (topics.hasWaitingQueue) availableTopics.add("waiting");

  // 1匹しかいない時に2人・3人の会話テンプレートを選ぶと、自分自身と
  // 喋っているように見えて不自然なので、使えるテンプレートの種類を
  // 今の匹数に応じて絞る。requiresがある場合は、該当データが
  // 無ければそのテンプレート自体を候補から外す。
  const availableTypes: LineTemplate["type"][] =
    names.length >= 3
      ? ["solo", "exchange", "group3"]
      : names.length === 2
        ? ["solo", "exchange"]
        : ["solo"];
  const pool = LINE_BANK.filter(
    (t) =>
      availableTypes.includes(t.type) &&
      (t.requires?.every((topic) => availableTopics.has(topic)) ?? true),
  );

  // 話者が違っても、1回の出力の中で全く同じセリフが2回出ると
  // (特にセリフ自体に名前が入っていない場合に)不自然に見えるので、
  // 話者に関係なく、一度使ったセリフの文字列は避ける。
  const usedTexts = new Set<string>();
  const alreadySaid = (text: string) => usedTexts.has(text);
  const markSaid = (text: string) => {
    usedTexts.add(text);
  };

  const result: PotChatLine[] = [];
  let guard = 0;
  while (result.length < lineCount && guard < lineCount * 30) {
    guard += 1;
    const template = pool[Math.floor(rng() * pool.length)];
    // 1つ前のセリフの話者と、この固まりの最初の話者が同じだと、
    // 同じキャラが2連続で喋っているように見えて不自然なので避ける。
    const prevSpeaker = result[result.length - 1]?.speaker;

    if (template.type === "solo") {
      const speaker = pickName(prevSpeaker ? [prevSpeaker] : []);
      const text = fillOwnSuffix(fillTopics(template.text, topics, rng), speaker);
      if (alreadySaid(text)) continue;
      result.push({ speaker, text });
      markSaid(text);
    } else if (template.type === "exchange") {
      const speakerA = pickName(prevSpeaker ? [prevSpeaker] : []);
      const speakerB = pickName([speakerA]);
      const textA = fillOwnSuffix(
        fillTopics(template.a, topics, rng).replaceAll("{B}", speakerB),
        speakerA,
      );
      const textB = fillOwnSuffix(
        fillTopics(template.b, topics, rng).replaceAll("{B}", speakerA),
        speakerB,
      );
      if (alreadySaid(textA)) continue;
      if (result.length + 1 < lineCount && alreadySaid(textB)) continue;

      result.push({ speaker: speakerA, text: textA });
      markSaid(textA);
      if (result.length < lineCount) {
        result.push({ speaker: speakerB, text: textB });
        markSaid(textB);
      }
    } else {
      const speakerA = pickName(prevSpeaker ? [prevSpeaker] : []);
      const speakerB = pickName([speakerA]);
      const speakerC = pickName([speakerA, speakerB]);
      const sub = (s: string, speaker: string) =>
        fillOwnSuffix(
          fillTopics(s, topics, rng)
            .replaceAll("{A}", speakerA)
            .replaceAll("{B}", speakerB)
            .replaceAll("{C}", speakerC),
          speaker,
        );
      const lines = [
        { speaker: speakerA, text: sub(template.a, speakerA) },
        { speaker: speakerB, text: sub(template.b, speakerB) },
        { speaker: speakerC, text: sub(template.c, speakerC) },
      ];
      if (lines.some((l) => alreadySaid(l.text))) continue;

      for (const line of lines) {
        if (result.length >= lineCount) break;
        result.push(line);
        markSaid(line.text);
      }
    }
  }

  return result.slice(0, lineCount);
}
