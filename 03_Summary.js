// === メイン処理 ===
function generatePokeSleepSummary() {
  const today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/M/d');

  // 1) 今日の投稿（実データ）
  const fetched = fetchTopPokeSleepTweetsToday(30);
  const mainTweets = fetched.filter(t => (t.like_count || 0) >= 30).slice(0, 5);

  if (mainTweets.length === 0) {
    Logger.log('❤️30以上の投稿が0件のため投稿しません。');
    return '';
  }

  const slots = 5 - mainTweets.length;
  const randomTweets = slots > 0
    ? pickRandom_(fetched.filter(t => (t.like_count || 0) < 30), Math.min(slots, 2))
    : [];

  const selectedTweets = mainTweets.concat(randomTweets);
  const totalParts = Math.min(3, selectedTweets.length);
  const selectedForPrompt = selectedTweets.slice(0, totalParts);

  const selectedMain = selectedForPrompt.filter(t => (t.like_count || 0) >= 30);
  const selectedRandom = selectedForPrompt.filter(t => (t.like_count || 0) < 30);

  const sourcesMain = buildSourcesText(selectedMain, { includeLikes: true });
  const sourcesRandom = selectedRandom.length > 0
    ? buildSourcesText(selectedRandom, { includeLikes: false })
    : '';

  Logger.log('📌 引用元データ（メイン）:\n' + sourcesMain);
  if (sourcesRandom) Logger.log('🎲 引用元データ（ランダム）:\n' + sourcesRandom);

  // プロンプト作成（既存の文字列そのまま）
  const prompt = `
今日の日付は${today}。
以下の引用元だけを使って作成（捏造禁止・URLは引用元のみ）。

【メイン引用元（❤️30以上・優先）】
${sourcesMain}
${sourcesRandom ? `\n【ランダム引用元（枠が余った時のみ使用・❤️数は言わない）】\n${sourcesRandom}\n` : ''}

要件:
- スレッド形式で出力（1/${totalParts}〜${totalParts}/${totalParts}）
- 1/${totalParts} の先頭にタイトル1行を必ず入れる（1回だけ）：
  「ポケスリ界隈 ${today} の人気まとめ🥹✨」
- 各ポストは下のフォーマット厳守（余計な前置き・後置き禁止）
- メイン引用元から先に使い、足りない分だけランダム引用元で埋める
- メイン引用元のポストは冒頭を「❤️xx｜」で開始（xxは引用元の❤️数）
- ランダム引用元のポストは❤️数を一切言わない（「❤️xx｜」も禁止）
- 各ポストの最後に必ず次の区切り文字を入れる：
  <<<POST_BREAK>>>
  最後のポストの後にも必ず入れる

事実まとめ行（1行目）の文末ルール（厳守）:
- 「事実まとめ1行」の語尾は、必ず「体言止め（名詞終わり）」にするか、「〜が話題に」「〜と報告」のように短く言い切る形にすること。
- 「〜になっています」「〜を集めています」「〜ました」などの冗長な語尾や丁寧語（です・ます調）は一切禁止。

文章トーン（最重要）:
- 各ポストに「まとめ → 共感や余白の一言」の順で書く
- 「共感や余白の一言」は次の4パターンをバランスよく使う：
  ① 「がおぷん」を主語にした感想
  ② 読者への共感（例：「こういうの嬉しいよね」）
  ③ 感嘆や余韻（例：「これは憧れる」「運強すぎる」）
  ④ 軽い巻き込み（例：「こういうの、やりたくなるよね」）
- 「がおぷん」を主語にするのは全体の最大40%まで（毎回使用は禁止）
- 同じ語尾を連続使用しない（例：「〜よね」が連続しない）
- 命令形は禁止（例：「教えて」「やろう」は使わない）
- 自然なXユーザーの一言コメントのように書く

絵文字ルール（キャラ固定 + 語気記号）:

【A: キャラ絵文字（必須）】
- 各ポストに必ず「🥹＋感情絵文字」を1回だけ使用する（2つセット固定）
- タイトル行、事実まとめ行には使用しない
- これはキャラ表現。必ず要約文の末尾に付ける
- 同じ組み合わせを連続ポストで繰り返さない
- 感情に合った組み合わせを選ぶ：
  嬉しい・感動 → 🥹✨
  可愛い → 🥹🫶
  驚き → 🥹💡
  達成・すごい → 🥹🔥
  共感 → 🥹🤝
  癒し → 🥹💤
  羨ましい → 🥹👀

【B: 語気記号（任意）】
- コメント文（最後の「ひとこと」行）の末尾に、必要に応じて語気記号を0〜1個付けてよい
- 語気記号は単体で使用してよい（キャラ絵文字とは別扱い）
- 使用可能：❗️ / ‼️ / … / ⁉️ / 〜
- ただし同じ語気記号を連続ポストで繰り返さない

ハッシュタグルール（厳守）:
- 各ポスト末尾に #ポケスリ を付けない（禁止）
- 2/${totalParts}〜${totalParts}/${totalParts} では「#ポケスリ」「#ポケモンスリープ」は使用禁止（本文中にも入れない）
- 元投稿テキストに含まれていたハッシュタグは最大2個まで残してよいが、
  2/${totalParts}〜${totalParts}/${totalParts} では上記2つタグが含まれていた場合は削除する

URLルール:
- 引用元URLは「最後の行」にURLだけを置く（[引用元: ] 表記は禁止）
- URLは各ポストちょうど1つ

長さ:
- 各パートは240文字以内（URLを含む）

フォーマット（各ポスト必須）:
{idx}/{n}
（idx=1の時だけ、次のタイトル行を入れる）
ポケスリ界隈 ${today} の人気まとめ🥹✨

（メインの場合）
❤️{like}｜{事実まとめ1行（客観・簡潔・必ず体言止め等で言い切る）}
{事実補足1行（任意・客観）}
がおぷんのひとこと要約・感想（主語付き・1行のみ）
{ハッシュタグ（任意・最大2つ。無ければ行ごと省略）}
{URL（必ず最後の行・URLのみ）}

（ランダムの場合）
{事実まとめ1行（客観・簡潔・必ず体言止め等で言い切る）}
{事実補足1行（任意・客観）}
がおぷんのひとこと要約・感想（主語付き・1行のみ）
{ハッシュタグ（任意・最大2つ。無ければ行ごと省略）}
{URL（必ず最後の行・URLのみ）}

出力は日本語で、すぐにX投稿できる形に。
区切り文字 <<<POST_BREAK>>> を絶対に省略しない。
`.trim();

  // === AI分岐処理 ===
  let out = '';
  if (ACTIVE_AI === 'GROK') {
    Logger.log('🤖 Grokで生成を開始します...');
    out = callGrokAPI(prompt);
  } else if (ACTIVE_AI === 'GEMINI') {
    Logger.log('🤖 Geminiで生成を開始します...');
    out = callGeminiAPI(prompt);
  } else {
    Logger.log('⚠️ 有効なAIが選択されていません。');
    return '設定エラー😿';
  }

  Logger.log('✅ 最終生成結果:\n' + out);
  return out;
}
