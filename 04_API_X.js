// === X (Twitter) API 連携処理 ===
// 方針：
// - /2/tweets/search/recent を使って「今日(JST)の投稿」を検索
// - sort_order=relevancy を維持（体感で一番“近い”）
// - username は expansions=author_id + user.fields=username で同梱取得し、/2/users を叩かない（クレジット節約）
// - 最終的にはローカルで like_count 降順に並べ替えて上位 limit を返す

function fetchTopPokeSleepTweetsToday(limit) {
  const service = getXService();
  if (!service.hasAccess()) throw new Error('X認証が必要です。authorizeX() を実行してください。');

  const tz = 'Asia/Tokyo';
  const now = new Date();

  // 今日の00:00(JST) → UTC ISO（X APIはUTC）
  const ymd = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
  const startJst = new Date(`${ymd}T00:00:00+09:00`);
  const startUtcIso = startJst.toISOString();

  const query = '(ポケモンスリープ OR ポケスリ) -is:retweet lang:ja';

  // 安定優先：relevancyは揺れるのでrecencyで取り、ローカルでlike順にする
  const url =
    'https://api.x.com/2/tweets/search/recent' +
    '?query=' + encodeURIComponent(query) +
    '&start_time=' + encodeURIComponent(startUtcIso) +
    '&max_results=50' +
    '&sort_order=relevancy' +
    '&tweet.fields=created_at,public_metrics,author_id';

  const accessToken = service.getAccessToken();
  const res = UrlFetchApp.fetch(url, {
    method: 'get',
    muteHttpExceptions: true,
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  });

  const code = res.getResponseCode();
  const body = res.getContentText();

  if (code >= 400) {
    throw new Error(`X search error: ${code} ${body}`);
  }

  const json = JSON.parse(body);
  const data = json.data || [];

  // author_id -> username を別APIでまとめて取得
  const authorIds = [...new Set(data.map(t => t.author_id).filter(Boolean))];
  const usernames = fetchUsernamesByIds(authorIds);

  const tweets = data.map(t => {
    const like = (t.public_metrics && t.public_metrics.like_count) ? t.public_metrics.like_count : 0;
    const username = usernames[t.author_id] || 'i';
    const tweetUrl = `https://x.com/${username}/status/${t.id}`;

    return {
      id: t.id,
      username: username, // usernameを格納
      like_count: like,
      text: t.text || '',
      url: tweetUrl,
      created_at: t.created_at
    };
  });

  // 1. まず「いいね降順」にソートする（同じアカウントでも一番バズったものを優先するため）
  tweets.sort((a, b) => b.like_count - a.like_count);

  // 2. フィルター処理（公式除外 ＆ 1アカウント1投稿まで）
  const filteredTweets = [];
  const seenUsernames = new Set(); // 採用したユーザー名を記録する箱

  for (const t of tweets) {
    // 【ルールA】公式アカウント（PokemonSleepApp）は除外（大文字小文字の揺れ対策でtoLowerCase）
    if (t.username.toLowerCase() === 'pokemonsleepapp') {
      continue;
    }

    // 【ルールB】すでにこのユーザーの投稿を採用済みの場合は除外
    if (seenUsernames.has(t.username)) {
      continue;
    }

    // 条件をクリアした投稿だけを採用リストに入れ、ユーザー名を記録
    filteredTweets.push(t);
    seenUsernames.add(t.username);
  }

  // 3. 必要な件数だけ切り出して返す
  const n = Math.min(limit || 10, filteredTweets.length);
  return filteredTweets.slice(0, n);
}

// username付きURLを作るために author_id -> username をまとめて取得
function fetchUsernamesByIds(authorIds) {
  const service = getXService();
  const accessToken = service.getAccessToken();

  if (!authorIds || authorIds.length === 0) return {};

  const url =
    'https://api.x.com/2/users' +
    '?ids=' + authorIds.join(',') +
    '&user.fields=username';

  const res = UrlFetchApp.fetch(url, {
    method: 'get',
    muteHttpExceptions: true,
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  });

  const code = res.getResponseCode();
  const body = res.getContentText();

  if (code >= 400) {
    Logger.log(`X users lookup error: ${code} ${body}`);
    return {};
  }

  const json = JSON.parse(body);
  const map = {};
  (json.data || []).forEach(u => {
    map[u.id] = u.username;
  });
  return map;
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
