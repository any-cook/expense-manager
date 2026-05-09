// =====================================================================
// Firebase 設定ファイル(Realtime Database版)
// =====================================================================
// Firebase Console (https://console.firebase.google.com/) でプロジェクトを
// 作成して取得した設定情報を以下に貼り付けてください。
//
// 取得手順:
//   1. プロジェクト設定 > 全般 > マイアプリ > Web アプリ
//   2. 「SDK の設定と構成」の "構成" を選択
//   3. 表示される firebaseConfig オブジェクトの値を以下にコピー
//
// 重要: databaseURL は Realtime Database を作成すると追加されます。
//   作成後にもう一度 Web アプリの構成を確認してコピーしてください。
//
// 注意:
//   - apiKey は公開しても安全です(Firebase は別途セキュリティルールで保護)
//   - GitHub に push して構いません
// =====================================================================

export const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// 設定が埋められたかを判定するためのフラグ
export const isConfigured =
  !firebaseConfig.apiKey.includes("YOUR_API_KEY") &&
  !firebaseConfig.databaseURL.includes("YOUR_PROJECT_ID");
