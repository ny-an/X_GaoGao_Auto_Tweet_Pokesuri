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
// === Gemini API 呼び出し処理 ===
function callGeminiAPI(promptText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  
  const payload = {
    "systemInstruction": { // ★修正：systemInstruction に変更
      "parts": [{ "text": "あなたはSNSアカウントの中の人「がおぷん」です。一人称は「がおぷん」を使用してください。厳格な要約者として、指定されたURLとフォーマットを絶対厳守し、捏造は一切行わないでください。" }]
    },
    "contents": [
      {
        "parts": [{ "text": promptText }]
      }
    ],
    "generationConfig": {
      "temperature": 0.2,
      // "maxOutputTokens": 10240
    },
    // ★セーフティフィルターを完全に無効化（誤検知ブロックを防ぐ）
    "safetySettings": [
      { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE" },
      { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE" },
      { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE" },
      { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE" }
    ]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const res = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(res.getContentText());

    if (json.error) {
      Logger.log('❌ Geminiエラー: ' + JSON.stringify(json.error));
      return 'まとめ生成エラー…ごめんね😿';
    }

    // ★追加：プロンプト自体がブロックされたかチェック
    if (json.promptFeedback && json.promptFeedback.blockReason) {
      Logger.log('⚠️ プロンプトがブロックされました。理由: ' + json.promptFeedback.blockReason);
      return '内容がブロックされちゃった😿';
    }

    const candidate = json.candidates[0];

    // ★追加：生成途中でストップした場合の理由をログに出す
    if (candidate.finishReason !== 'STOP') {
      Logger.log('⚠️ Geminiの生成が中断されました。理由(finishReason): ' + candidate.finishReason);
      if (candidate.safetyRatings) {
        Logger.log('🛡️ セーフティ判定詳細: ' + JSON.stringify(candidate.safetyRatings));
      }
    }

    // テキストが空の場合のエラー回避
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      Logger.log('⚠️ テキストが生成されませんでした。');
      return 'うまくまとめられなかったよ😿';
    }

    let out = candidate.content.parts[0].text.trim();
    out = out.replace(/\[引用元:\s*(https?:\/\/[^\]\s]+)\s*\]/g, '$1');

    return out;

  } catch (e) {
    Logger.log('❌ Gemini通信エラー: ' + e.message);
    return '通信エラーが発生したよ😿';
  }
}