// === 共通ユーティリティ関数 ===

// options: { includeLikes: boolean }
function buildSourcesText(tweets, options) {
  const includeLikes = options && options.includeLikes;

  return (tweets || []).map((t, i) => {
    const oneLine = (t.text || '')
      .replace(/https?:\/\/t\.co\/[0-9A-Za-z]+/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120);

    const head = includeLikes
      ? `${i + 1}. ❤️${t.like_count}`
      : `${i + 1}. ランダム枠`;

    return [
      head,
      oneLine,
      t.url
    ].join('\n');
  }).join('\n\n');
}

// 配列から重複なしで最大n件ランダム抽出
function pickRandom_(arr, n) {
  const a = (arr || []).slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a.slice(0, Math.min(n, a.length));
}

// 帯域/一時失敗の軽リトライ（AI系通信・その他汎用）
function fetchWithRetry_(url, options, retries) {
  let lastErr = null;

  for (let i = 0; i <= retries; i++) {
    try {
      const res = UrlFetchApp.fetch(url, options);
      const text = res.getContentText();
      return JSON.parse(text);
    } catch (e) {
      lastErr = e;
      const msg = (e && e.message) ? e.message : String(e);

      if (msg.includes('Bandwidth quota exceeded') && i < retries) {
        Utilities.sleep(800 * (i + 1));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}