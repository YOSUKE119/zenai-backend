# ZEN.AI Backend - Environment Variables Setup Guide

## 必須環境変数

Vercel にデプロイする前に、以下の環境変数を設定してください。

---

## 1. `OPENAI_API_KEY`

**説明**: OpenAI API のアクセスキー

**取得方法**:
1. https://platform.openai.com/ にアクセス
2. API Keys → Create new secret key
3. キーをコピー（後から表示できないので注意）

**設定値の形式**:
```
sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Vercel での設定**:
1. Vercel ダッシュボード → プロジェクト選択
2. Settings → Environment Variables
3. Key: `OPENAI_API_KEY`
4. Value: コピーしたキー
5. Environment: Production, Preview, Development すべてにチェック
6. Save

---

## 2. `FIREBASE_SERVICE_ACCOUNT`

**説明**: Firebase Admin SDK のサービスアカウント認証情報（JSON形式）

**取得方法**:
1. Firebase Console にアクセス
2. プロジェクト設定 → サービス アカウント
3. 「新しい秘密鍵の生成」をクリック
4. JSON ファイルがダウンロードされる

**設定値の形式**:
- **重要**: JSON ファイルの**内容全体**を**1行の文字列**として設定

```json
{"type":"service_account","project_id":"your-project","private_key_id":"xxx","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQ...xxxxx...xxxxx\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com","client_id":"xxx","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxx%40your-project.iam.gserviceaccount.com"}
```

**変換方法** (改行を削除):
```bash
# macOS/Linux
cat service-account.json | jq -c . | pbcopy

# または手動で:
# 1. service-account.json を開く
# 2. すべての改行を削除
# 3. 1行の JSON 文字列にする
```

**Vercel での設定**:
1. Vercel ダッシュボード → プロジェクト選択
2. Settings → Environment Variables
3. Key: `FIREBASE_SERVICE_ACCOUNT`
4. Value: 1行にした JSON 文字列全体をペースト
5. Environment: Production, Preview, Development すべてにチェック
6. Save

---

## 環境変数の確認

設定後、Vercel Functions のログで以下が表示されることを確認:

```
ZENAI_BACKEND: Firebase Admin initialized
```

エラーが出る場合:
- `FIREBASE_SERVICE_ACCOUNT is not set` → 環境変数が設定されていない
- `Firebase Admin initialization error` → JSON のフォーマットが間違っている

---

## セキュリティ注意事項

### ❌ 絶対にやってはいけないこと
- フロントエンド（App.js）に API キーを直接記載
- GitHub に API キーやサービスアカウントをコミット
- `.env` ファイルを git add してコミット

### ✅ 正しい管理方法
- API キーは Vercel の Environment Variables にのみ設定
- サービスアカウント JSON はダウンロード後、安全な場所に保管
- `.gitignore` に `.env`, `service-account*.json` を追加済み

---

## トラブルシューティング

### OpenAI API エラー
```
Error: Incorrect API key provided
```
→ `OPENAI_API_KEY` の値を確認。`sk-proj-` で始まっているか確認。

### Firebase Admin エラー
```
Error: Firebase Admin initialization error
```
→ `FIREBASE_SERVICE_ACCOUNT` の JSON が正しいか確認。改行が含まれていないか確認。

### CORS エラー
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```
→ `api/zenai-chat.js` で CORS ヘッダーが設定されているか確認（既に実装済み）

---

## デプロイ後の確認

1. Vercel Functions のログを確認:
   ```
   Vercel ダッシュボード → Deployments → 最新デプロイ → Functions タブ
   ```

2. テストリクエスト:
   ```bash
   curl -X POST https://YOUR-DOMAIN.vercel.app/api/zenai-chat \
     -H "Content-Type: application/json" \
     -d '{"uid":"test123","message":"こんにちは"}'
   ```

   期待される応答:
   ```json
   {"reply":"こんにちは。何かお話ししたいことがありますか？"}
   ```

---

## 次のステップ

環境変数設定後:
1. Vercel にデプロイ
2. Firebase Console で `config/spiritCode` ドキュメントを作成
3. App.js の `ZENAI_API_URL` を実際のデプロイ URL に変更
4. アプリでテスト送信
