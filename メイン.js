
// === 毎日自動実行のメイン関数 ===
function dailyPokeSleepBot() {
  const summary = generatePokeSleepSummary();

  Logger.log('=== summary length === ' + (summary ? summary.length : 0));
  Logger.log('=== summary head ===\n' + (summary ? summary.slice(0, 200) : '(null)'));

  if (!summary || !summary.trim()) return;
  if (summary.includes('エラー')) return;

  postToXAsThread(summary);
}


// === Xにスレッド投稿（"1/3" ブロックで確実分割・280超過防止）===
function postToXAsThread(text) {

  const service = getXService();

  if (!service.hasAccess()) {
    Logger.log('X認証必要');
    return;
  }

  if (!text) return;

  Logger.log('=== raw ===\n' + text);

  // 区切り文字で分割
  const posts = text
    .split('<<<POST_BREAK>>>')
    .map(t => t.trim())
    .filter(Boolean);

  Logger.log('投稿予定: ' + posts.length);

  let previousId = null;

  posts.forEach((post, i) => {

    Logger.log(`--- post ${i+1} ---\n${post}`);

    if (post.length > 280)
      throw new Error(`280超過 idx=${i} len=${post.length}`);

    const payload = previousId
      ? {
          text: post,
          reply: { in_reply_to_tweet_id: previousId }
        }
      : {
          text: post
        };

    const res = UrlFetchApp.fetch(
      'https://api.x.com/2/tweets',
      {
        method: 'post',
        contentType: 'application/json',
        headers: {
          Authorization: 'Bearer ' + service.getAccessToken()
        },
        payload: JSON.stringify(payload)
      }
    );

    const json = JSON.parse(res.getContentText());

    if (!json.data)
      throw new Error(JSON.stringify(json));

    previousId = json.data.id;

    Logger.log('投稿成功: ' + previousId);

    Utilities.sleep(800);

  });

}