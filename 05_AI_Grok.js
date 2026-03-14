// === Grok API 呼び出し処理 ===
function callGrokAPI(promptText) {
  const url = 'https://api.x.ai/v1/chat/completions';
  const payload = {
    model: GROK_MODEL,
    messages: [
      { role: 'system', content: 'あなたは厳格な要約者です。引用元以外を追加せず、URLも引用元のみ使用します。' },
      { role: 'user', content: promptText }
    ],
    max_tokens: 800,
    temperature: 0.8
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + GROK_AI_API_KEY },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const json = fetchWithRetry_(url, options, 2);

  if (json.error) {
    Logger.log('Grokエラー: ' + JSON.stringify(json.error));
    return 'まとめ生成エラー…ごめんね😿';
  }

  const out = (json.choices?.[0]?.message?.content || '').trim()
    .replace(/\[引用元:\s*(https?:\/\/[^\]\s]+)\s*\]/g, '$1');

  return out;
}