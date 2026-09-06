export default function FirebaseSetupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-3xl font-bold">日</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">ワークシートジェネレーター</h1>
          <p className="text-slate-500 mt-1">セットアップが必要です</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <h2 className="font-semibold text-amber-800 mb-2">⚠️ Firebaseの設定が必要です</h2>
          <p className="text-amber-700 text-sm">
            アプリを使用するには、Firebaseプロジェクトの設定が必要です。
            以下の手順に従ってください。
          </p>
        </div>

        <div className="space-y-4">
          <Step num={1} title="Firebaseプロジェクトを作成">
            <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer"
              className="text-blue-600 underline">console.firebase.google.com</a>
            &nbsp;で新しいプロジェクトを作成します
          </Step>
          <Step num={2} title="認証・Firestore・Storageを有効化">
            Firebase ConsoleでGoogle認証、Cloud Firestore、Firebase Storageを有効にします
          </Step>
          <Step num={3} title=".envファイルを作成">
            プロジェクトルートに <code className="bg-slate-100 px-1 rounded">.env</code> ファイルを作成し、
            Firebase設定を入力します（<code className="bg-slate-100 px-1 rounded">.env.example</code> を参照）
          </Step>
          <Step num={4} title="アプリを再起動">
            <code className="bg-slate-100 px-1 rounded">npm run dev</code> で再起動します
          </Step>
        </div>

        <div className="mt-6 bg-slate-900 rounded-xl p-4 text-sm font-mono text-green-400 overflow-x-auto">
          <div className="text-slate-400 mb-2"># .env</div>
          <div>VITE_FIREBASE_API_KEY=your_api_key</div>
          <div>VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com</div>
          <div>VITE_FIREBASE_PROJECT_ID=your_project_id</div>
          <div>VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com</div>
          <div>VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id</div>
          <div>VITE_FIREBASE_APP_ID=your_app_id</div>
        </div>
      </div>
    </div>
  )
}

function Step({ num, title, children }) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0 text-sm">
        {num}
      </div>
      <div>
        <div className="font-semibold text-slate-800">{title}</div>
        <div className="text-slate-600 text-sm mt-0.5">{children}</div>
      </div>
    </div>
  )
}
