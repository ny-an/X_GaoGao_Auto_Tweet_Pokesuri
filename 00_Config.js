// === 設定項目（ここだけ自分で変更！） ===
const X_CLIENT_ID = '<YOUR_X_CLIENT_ID>';      // Developer Portal > Keys and Tokens
const X_CLIENT_SECRET = '<YOUR_X_CLIENT_SECRET>'; // 同上（Confidential Clientの場合必要）
const X_REDIRECT_URI = 'https://script.google.com/macros/d/1ioinyEi1TEh2K-ZZndfWjOmrjz_U9Agc7O3uPBGdiNSBp7ZOGt9RIsiv/usercallback'; // スクリプトIDはプロジェクト設定からコピー

// 使用するAIを切り替えるフラグ ('GROK' または 'GEMINI')
const ACTIVE_AI = 'GEMINI'; 

// Grok設定
const GROK_AI_API_KEY = '<YOUR_GROK_API_KEY>';  // https://console.x.ai/ から取得
const GROK_MODEL = 'grok-4-1-fast-reasoning';

// Gemini設定
// const GEMINI_API_KEY = '<YOUR_PAID_GEMINI_API_KEY>'; // 有料
const GEMINI_API_KEY = '<YOUR_FREE_GEMINI_API_KEY>'; // 無料
const GEMINI_MODEL = 'gemini-2.5-flash'; // または gemini-2.0-flash 等