# X GaoGao Auto Tweet Pokesuri 💤

Google Apps Script (GAS) 上で動作する、ポケモンスリープ（ポケスリ）界隈の話題を収集してX（旧Twitter）に自動でスレッド投稿するBotシステムです。
最新の人気ツイート内容を取得し、AI（Gemini / Grok）を用いて要約・感想を添えたまとめスレッドを自動生成します。

## 機能 🌟

*   **Xの自動検索と取得**: その日の「#ポケスリ」や「#ポケモンスリープ」関連のツイートをピックアップ。
*   **AIによる賢い要約**: Gemini または Grok のAPIを使用して、文章を要約し、X向けの読みやすいフォーマット（絵文字付き、トーン＆マナー調整済み）に自動整形。
*   **スレッド自動投稿**: 280文字制限を考慮し、生成されたまとめをスレッド形式でXへ自動投稿。

## 構成ファイル 📁

*   `00_Config.js` / `00_Secrets.js`: APIキーや設定値などを管理。（`00_Secrets.js` はGit管理外）
*   `01_Auth.js`: XのOAuth 2.0 認証とアクセストークントキープ、およびリセット処理。
*   `02_Main.js`: 日次実行用のメインエントリーポイント（トリガー実行関数）。
*   `03_Summary.js`: 取得したツイートをもとにAIプロンプトを構築し、要約文を生成するロジック。
*   `04_API_X.js`: X API（Top tweets検索等）の呼び出し処理および、Xへのスレッド投稿ロジック。
*   `05_AI_Clients.js`: xAI (Grok) と Google (Gemini) のAPI連携ロジック。
*   `06_Utils.js`: 共通便利関数（ランダム抽出等）。
*   `99_Tests.js`: Gemini API等のテスト用スクリプト。

## セットアップ手順 🛠️

このプロジェクトは `clasp` を用いてローカルからGASへデプロイする構成になっています。

### 事前準備
1. Node.js および `clasp` (`@google/clasp`) をインストール。
2. ターミナルで `clasp login` を実行し、Googleアカウントでログイン。

### インストール・デプロイ

```bash
# プロジェクトをクローン
git clone https://github.com/ny-an/X_GaoGao_Auto_Tweet_Pokesuri.git
cd X_GaoGao_Auto_Tweet_Pokesuri

# 秘密情報のファイルを作成
cp 00_Secrets.example.js 00_Secrets.js
```

`00_Secrets.js` をエディタで開き、各種APIキー（X Developer PortalからのClient ID/Secret、Gemini / GrokのAPIキー）を設定します。

```bash
# GAS側のプロジェクトと紐付け（既にクローンしている場合は不要）
clasp clone <GAS_Script_ID>

# コードをGASへプッシュ
clasp push
```

## AIモデルの切り替え 🤖

使用するAIモデルを変更する場合は、`00_Config.js` の `ACTIVE_AI` 変数を変更します。

```javascript
// 使用するAIを切り替えるフラグ ('GROK' または 'GEMINI')
const ACTIVE_AI = 'GEMINI'; // または 'GROK'
```

## GAS上での定期実行（トリガー設定）⏰

GASのエディタ（`https://script.google.com/`）にアクセスし、トリガー（時計マーク）から `dailyPokeSleepBot` 関数を毎日お好きな時間（例：朝7時〜8時）に実行されるよう設定してください。
※初回実行時のみ、OAuth 2.0の認証プロセス（ブラウザで許可を出す処理）が必要になります。

## ライセンス 📝

This project is licensed under the MIT License.
