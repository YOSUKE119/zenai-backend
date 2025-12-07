# ZEN.AI Backend API

ZEN.AIアプリ用のOpenAI連携バックエンドAPI（Vercel Serverless Functions）

## 概要

このプロジェクトは、ZEN.AIモバイルアプリからOpenAI APIを安全に利用するためのバックエンドサーバーです。
OpenAI APIキーをクライアント側に露出させず、Vercel環境変数に保存して使用します。

## プロジェクト構成

```
zenai-backend/
├── api/
│   └── zenai-chat.js    # OpenAI連携のServerless Function
├── package.json
├── vercel.json
├── .gitignore
└── README.md
```

## セットアップ手順

### 1. 依存関係のインストール

```bash
cd zenai-backend
npm install
```

### 2. GitHubリポジトリの作成とプッシュ

```bash
git init
git add .
git commit -m "Initial commit: ZEN.AI backend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/zenai-backend.git
git push -u origin main
```

### 3. Vercelプロジェクトの作成

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. 「Add New...」→「Project」をクリック
3. GitHubリポジトリ `zenai-backend` を選択
4. プロジェクト名を確認（例: `zenai-backend`）
5. Framework Preset: **Other**（自動検出されない場合）
6. 「Deploy」をクリック

### 4. 環境変数の設定

デプロイ完了後、環境変数を設定します：

1. Vercel Project Settings → 「Environment Variables」タブ
2. 以下の環境変数を追加：

| Name | Value | Environment |
|------|-------|-------------|
| `OPENAI_API_KEY` | `sk-proj-...`（実際のOpenAI APIキー） | Production, Preview, Development |

3. 「Save」をクリック
4. 環境変数を反映させるため、再デプロイ：
   - 「Deployments」タブ → 最新のデプロイ → 「...」メニュー → 「Redeploy」

### 5. デプロイURLの確認

デプロイ完了後、以下の形式のURLが発行されます：

```
https://zenai-backend-xxxx.vercel.app
```

APIエンドポイントは：

```
https://zenai-backend-xxxx.vercel.app/api/zenai-chat
```

このURLをコピーして、ZEN.AIアプリの `App.js` に設定します。

## API仕様

### エンドポイント

```
POST /api/zenai-chat
```

### リクエスト

```json
{
  "messages": [
    { "role": "user", "content": "今日は疲れた..." },
    { "role": "assistant", "content": "そうですか..." }
  ],
  "profile": {
    "name": "山田太郎",
    "birthday": "1990-01-01",
    "gender": "男性",
    "note": "最近考え事が多い"
  }
}
```

### レスポンス

```json
{
  "replyText": "疲れたと感じることができたこと自体が、自分の状態に気づけている証拠ですね。どんなことで疲れを感じているのでしょうか。"
}
```

### エラーレスポンス

```json
{
  "error": "エラーメッセージ",
  "details": "詳細な情報（開発環境のみ）"
}
```

## ローカルでのテスト

Vercel CLIを使ってローカルでテストできます：

```bash
# Vercel CLIのインストール
npm install -g vercel

# ローカル開発サーバーの起動
vercel dev
```

これで `http://localhost:3000/api/zenai-chat` でテストできます。

### cURLでのテスト例

```bash
curl -X POST http://localhost:3000/api/zenai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "今日はどんな気分ですか？"}
    ],
    "profile": {
      "name": "テストユーザー",
      "birthday": "1990-01-01",
      "gender": "",
      "note": "テスト中"
    }
  }'
```

## ZEN.AIアプリとの連携

### App.js の設定

1. `App.js` の `ZENAI_API_URL` を実際のVercel URLに変更：

```javascript
const ZENAI_API_URL = 'https://zenai-backend-xxxx.vercel.app/api/zenai-chat';
```

2. アプリを再起動して、チャットでメッセージを送信
3. コンソールで以下のログを確認：
   - `ZENAI: バックエンドAPIに問い合わせ中...`
   - `ZENAI: AI応答を受信しました`

## トラブルシューティング

### エラー: "OPENAI_API_KEY is not set"

**原因**: 環境変数が設定されていない

**解決策**:
1. Vercel Dashboard → Project Settings → Environment Variables
2. `OPENAI_API_KEY` が設定されているか確認
3. 設定後、再デプロイ

### エラー: "CORS policy"

**原因**: クロスオリジンリクエストがブロックされている

**解決策**:
`api/zenai-chat.js` にCORSヘッダーが設定されているか確認（既に実装済み）

### エラー: "OpenAI request failed"

**原因**: OpenAI APIキーが無効、または制限に達している

**解決策**:
1. OpenAI Platform でAPIキーを確認
2. 使用量と制限を確認
3. 必要に応じて新しいAPIキーを生成

### レスポンスが遅い

**原因**:
- コールドスタート（Vercelのサーバーレス関数が初回起動）
- OpenAI APIのレスポンス時間

**解決策**:
- 初回リクエストは遅くなる可能性があります（5-10秒）
- 2回目以降は高速化します
- 必要に応じて `max_tokens` を調整

## モデルとコスト

現在の設定：
- モデル: `gpt-4o-mini`
- max_tokens: 400
- temperature: 0.7

コスト目安（2024年12月時点）:
- gpt-4o-mini: 入力 $0.150/1M tokens, 出力 $0.600/1M tokens
- 1会話あたり約0.01円程度（非常に低コスト）

## セキュリティ

- ✅ APIキーはVercel環境変数に保存（クライアントに露出しない）
- ✅ CORS設定済み
- ⚠️ 現在は認証なし（今後Firebase Authenticationと連携予定）

## 次のステップ

1. ✅ OpenAI連携完了
2. 🔲 Firebase Authentication導入
3. 🔲 ユーザー認証によるAPI保護
4. 🔲 レート制限の実装
5. 🔲 モニタリングとログ収集

## ライセンス

ISC
