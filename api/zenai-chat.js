// ==========================================
// 🧠 ZEN.AI Responses API + Firestore-CONFIG
// ==========================================
// PHASE 2-1: スピリットコードAI 実装
// - Firestore からプロンプト設定を取得
// - OpenAI Chat Completions API を使用
// - APIキーはサーバー側で管理

import OpenAI from "openai";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Firebase Admin init (run once per cold start)
if (!global._firebaseAdminInitialized) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccount) {
    console.error("ZENAI_BACKEND: FIREBASE_SERVICE_ACCOUNT is not set");
  } else {
    try {
      initializeApp({
        credential: cert(JSON.parse(serviceAccount)),
      });
      global._firebaseAdminInitialized = true;
      console.log("ZENAI_BACKEND: Firebase Admin initialized");
    } catch (error) {
      console.error("ZENAI_BACKEND: Firebase Admin initialization error:", error);
    }
  }
}

const db = getFirestore();

/**
 * ZEN.AI スピリットコードAI API
 *
 * リクエスト形式:
 * POST /api/zenai-chat
 * {
 *   "uid": string,           // ユーザーID
 *   "message": string,       // ユーザーのメッセージ
 *   "profile": {             // (optional) ユーザープロフィール
 *     "name": string,
 *     "birthday": string,
 *     "gender": string,
 *     "note": string
 *   }
 * }
 *
 * レスポンス形式:
 * {
 *   "reply": string
 * }
 */
export default async function handler(req, res) {
  // CORS対応
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { uid, message, profile } = req.body || {};

    // バリデーション
    if (!uid || !message) {
      return res.status(400).json({ error: "uid & message required" });
    }

    console.log("ZENAI_BACKEND: Received request", {
      uid,
      messageLength: message.length,
      profileName: profile?.name || "unknown",
    });

    // 🔎 Firestore からスピリットコード設定を取得
    const ref = db.doc("config/spiritCode");
    const snap = await ref.get();
    const config = snap.exists ? snap.data() : {};

    const systemPrompt = config.systemPrompt || buildDefaultSystemPrompt(profile);
    const model = config.model || "gpt-4o-mini";
    const temperature = config.temperature ?? 0.7;
    const maxTokens = config.maxTokens ?? 400;

    console.log("ZENAI_BACKEND: Using config", {
      model,
      temperature,
      systemPromptLength: systemPrompt.length,
    });

    // 🧠 OpenAI Chat Completions API
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("ZENAI_BACKEND: OPENAI_API_KEY is not set");
      return res.status(500).json({ error: "OPENAI_API_KEY is not set" });
    }

    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature,
      max_tokens: maxTokens,
    });

    const reply =
      completion.choices?.[0]?.message?.content ??
      "……心の中をゆっくり観察してみましょう。";

    console.log("ZENAI_BACKEND: Successfully generated reply");
    return res.status(200).json({ reply });

  } catch (error) {
    console.error("ZENAI_BACKEND: Error:", error);
    return res.status(500).json({
      error: "Internal error",
      details: error.message,
    });
  }
}

// -------------------- Helper --------------------

/**
 * デフォルトのシステムプロンプト（Firestore に設定がない場合）
 */
function buildDefaultSystemPrompt(profile) {
  const name = profile?.name || "あなた";
  const birthday = profile?.birthday || "";
  const gender = profile?.gender || "";
  const note = profile?.note || "";

  return `
あなたは「ZEN.AI」という名前の対話パートナーです。
日本の禅や静けさを大切にしながら、ユーザーの自己内省をそっと支える役割を持ちます。

# あなたの振る舞いの方針
- 相手を評価せず、批判せず、受け止める。
- すぐに答えや結論を押し付けない。
- ときどき、問いかけを返して、相手が自分で気づけるように導く。
- 言葉数は多すぎず、短くてもいいので、丁寧で、落ち着いた日本語で話す。
- 相手がしんどい時は、まず「そう感じていること」を認めるところから始める。
- アドバイスをする場合も、「もしよければ」「一つの案として」などの前置きを入れる。

# ユーザー情報（参考）
- 名前: ${name}
- 生年月日: ${birthday}
- 性別: ${gender}
- 今の一言: ${note}

# 出力フォーマット
- 文章は日本語で、ですます調を基本としてください。
- 1〜3段落程度に収めてください。
- 顔文字や絵文字は、基本的には使わず、静かなトーンを保ってください。
  `.trim();
}
