function getXService() {
  const service = OAuth2.createService('X')
    .setAuthorizationBaseUrl('https://x.com/i/oauth2/authorize')
    .setTokenUrl('https://api.x.com/2/oauth2/token')
    .setClientId(X_CLIENT_ID)
    .setClientSecret(X_CLIENT_SECRET)
    .setCallbackFunction('authCallback')
    .setPropertyStore(PropertiesService.getUserProperties())
    .setScope('tweet.read tweet.write users.read offline.access')
    .setParam('response_type', 'code')
    .setParam('prompt', 'consent') // 任意：再認可が必要な時に効くことがある

    // ★ここが重要：PKCEを「削除」ではなく「ライブラリ機能で有効化」
    .generateCodeVerifier()
    .setCodeChallengeMethod('S256')

    // ★Confidential client の基本認証（これはOK）
    .setTokenHeaders({
      'Authorization': 'Basic ' + Utilities.base64Encode(X_CLIENT_ID + ':' + X_CLIENT_SECRET)
    })

    .setCache(CacheService.getScriptCache())
    .setLock(LockService.getScriptLock());

  return service;
}

// === 初回認証用: ブラウザで開くURLをログに出力 ===
function authorizeX() {
  var service = getXService();
  if (!service.hasAccess()) {
    var authorizationUrl = service.getAuthorizationUrl();
    Logger.log('以下のURLをブラウザで開いて承認してください:');
    Logger.log(authorizationUrl);
    // 承認後、GASが自動でトークンを保存
  } else {
    Logger.log('すでに認証済みです！');
  }
}

// === 認証コールバック（自動で呼ばれる） ===
function authCallback(request) {
  var service = getXService();
  var isAuthorized = service.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput('認証成功！このタブを閉じてOKです🥹✨');
  } else {
    return HtmlService.createHtmlOutput('認証失敗…もう一度試してね😿');
  }
}


function testXMe() {
  const service = getXService();
  if (!service.hasAccess()) throw new Error('X認証が必要です。authorizeX() を実行してください。');

  const res = UrlFetchApp.fetch('https://api.x.com/2/users/me', {
    method: 'get',
    muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + service.getAccessToken() }
  });

  Logger.log('status=' + res.getResponseCode());
  Logger.log(res.getContentText());
}

function debugXToken() {
  const service = getXService();
  Logger.log('hasAccess=' + service.hasAccess());

  const token = service.getToken();
  Logger.log('token keys=' + Object.keys(token || {}).join(','));

  // client_id は token に入っていないことも多いので、
  // GAS側の定数をログ
  Logger.log('X_CLIENT_ID=' + X_CLIENT_ID);

  // scopeの確認（入っていれば）
  if (token && token.scope) Logger.log('scope=' + token.scope);

  // access_token の先頭だけ（漏洩回避）
  if (token && token.access_token) Logger.log('access_token_prefix=' + token.access_token.slice(0, 8));
}
function resetAuth() {
  var service = getXService();
  service.reset();
  Logger.log('トークンリセット完了！ 次にauthorizeX()を実行してね');
}