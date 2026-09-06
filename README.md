# 📄 ワークシートジェネレーター / Worksheet Generator

English worksheets → Japanese worksheets, automatically.  
英語のワークシートをAIで日本語に変換するWebアプリです。

---

## 機能 / Features

- 📁 **フォルダ管理** — Google Driveのようなフォルダ整理
- 📄 **PDF・DOCX対応** — 両形式のアップロードに対応
- 🤖 **AI自動変換** — Gemini AIが英語→日本語に自動翻訳
- 💾 **ダウンロード** — PDF印刷またはWordとして保存
- 🔒 **安全** — Googleアカウントでログイン、データは非公開

---

## セットアップ / Setup

### 1. Firebaseプロジェクトの設定

1. [Firebase Console](https://console.firebase.google.com) でプロジェクトを作成
2. 以下を有効化:
   - **Authentication** → Google認証を有効化
   - **Cloud Firestore** → データベースを作成（本番モード推奨）
   - **Storage** → ストレージバケットを作成
3. プロジェクト設定 → Your apps → Webアプリ追加 → 設定をコピー

### 2. 環境変数の設定

`.env.example` をコピーして `.env` を作成:

```bash
cp .env.example .env
```

`.env` にFirebase設定を入力:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Firestoreインデックスの設定

Firebase Consoleでインデックスを設定するか、Firebase CLIを使用:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:indexes,firestore:rules,storage:rules
```

### 4. Gemini APIキーの設定

1. [Google AI Studio](https://aistudio.google.com/app/apikey) でAPIキーを取得（無料）
2. アプリにログイン後、設定ページでAPIキーを入力

---

## 開発 / Development

```bash
npm install
npm run dev
```

## ビルド・デプロイ / Build & Deploy

```bash
npm run build
firebase deploy --only hosting
```

---

## 技術スタック / Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Auth & DB**: Firebase (Google Auth, Firestore, Storage)
- **AI**: Google Gemini 1.5 Flash
- **Output**: Browser Print API (PDF), docx library (Word)

---

## 使い方 / How to Use

1. Googleアカウントでログイン
2. 設定ページでGemini APIキーを入力
3. 「アップロード」ボタンでPDFまたはDOCXをアップロード
4. AIが自動的に日本語ワークシートを生成（1〜2分）
5. 「PDFとして保存」または「Wordで保存」でダウンロード
