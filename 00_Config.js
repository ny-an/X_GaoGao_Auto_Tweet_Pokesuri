// === 設定項目（APIキーなどの秘密情報は 00_Secrets.js に分離しています） ===
const X_REDIRECT_URI = 'https://script.google.com/macros/d/1ioinyEi1TEh2K-ZZndfWjOmrjz_U9Agc7O3uPBGdiNSBp7ZOGt9RIsiv/usercallback'; // スクリプトIDはプロジェクト設定からコピー

// 使用するAIを切り替えるフラグ ('GROK' または 'GEMINI')
const ACTIVE_AI = 'GEMINI';

// Grok設定
const GROK_MODEL = 'grok-4-1-fast-reasoning';

// Gemini設定
const GEMINI_MODEL = 'gemini-2.5-flash'; // または gemini-2.5-flash-lite 