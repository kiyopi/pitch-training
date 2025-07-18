# Step 1: マイクロフォン基本機能テスト仕様書 v1.0

## 📋 概要

### 目的
基本マイクロフォン許可・音声取得機能の動作確認とテスト実行

### 実装完了日
2025-07-18

### テストページURL
`https://kiyopi.github.io/pitch-training/test/microphone/`

---

## 🎯 実装内容

### 1. useMicrophoneManager.ts
**場所**: `/src/hooks/useMicrophoneManager.ts`

**機能**:
- 基本マイクロフォン制御フック
- HYBRID許可システム完全除去済み
- 音程検出最適化制約適用
- 停止ボタン統合済み
- iPhone Safari対応

**主要実装**:
```typescript
// 音程検出最適化制約
const getOptimalConstraints = (): MediaStreamConstraints => ({
  audio: {
    autoGainControl: false,      // 最重要: 自動ゲイン制御無効
    echoCancellation: false,     // 最重要: エコーキャンセル無効
    noiseSuppression: false,     // 最重要: ノイズ抑制無効
    sampleRate: 44100,           // 高品質サンプリング
    channelCount: 1,             // モノラル
  }
});

// iPhone Safari対応の確実な停止処理
const stopRecording = () => {
  if (streamRef.current) {
    streamRef.current.getTracks().forEach(track => {
      track.stop();
      track.enabled = false;  // iPhone Safari確実停止
    });
  }
};
```

### 2. マイクロフォンテストページ
**場所**: `/src/app/test/microphone/page.tsx`

**機能**:
- 許可状態の可視化
- 開始・停止制御
- エラーハンドリング
- リアルタイム状態表示
- デバッグログ機能

---

## 🧪 テスト項目

### Step 1基本機能テスト

#### 1. マイクロフォン許可取得
- [ ] ブラウザの許可ダイアログ表示
- [ ] 許可後の状態更新確認
- [ ] 拒否時のエラーハンドリング
- [ ] 許可状態の視覚的表示

#### 2. 開始・停止制御
- [ ] 開始ボタンの動作確認
- [ ] 停止ボタンの動作確認
- [ ] 重複実行の防止
- [ ] 状態の一貫性確保

#### 3. 状態表示の確認
- [ ] 録音状態の表示
- [ ] 許可状態の表示
- [ ] 初期化状態の表示
- [ ] 音声レベルの表示

#### 4. エラーハンドリング
- [ ] NotAllowedError (許可拒否)
- [ ] NotFoundError (デバイス未検出)
- [ ] NotReadableError (他アプリ使用中)
- [ ] SecurityError (セキュリティ制約)
- [ ] エラーリセット機能

#### 5. iPhone Safari対応
- [ ] マイクロフォン許可取得
- [ ] 音声入力の開始
- [ ] 確実な停止処理
- [ ] リソース解放の確認
- [ ] サスペンド状態からの復帰

### デバッグ機能テスト

#### 1. ログ機能
- [ ] タイムスタンプ付きログ
- [ ] 最新8件のログ表示
- [ ] 操作ログの記録
- [ ] エラーログの記録

#### 2. 状態監視
- [ ] リアルタイム状態更新
- [ ] 視覚的インジケーター
- [ ] 状態変更の追跡

---

## 🔧 技術仕様

### セキュリティ要件
- HTTPS または localhost での動作
- getUserMedia API サポート確認
- 適切な権限管理

### 音声制約設定
```typescript
audio: {
  autoGainControl: false,    // 音程検出精度向上
  echoCancellation: false,   // エコー除去無効
  noiseSuppression: false,   // ノイズ抑制無効
  sampleRate: 44100,         // 高品質サンプリング
  channelCount: 1,           // モノラル
}
```

### エラーハンドリング
- 詳細なエラーメッセージ表示
- ユーザーフレンドリーな説明
- 適切な回復手順の提示

---

## 🚀 デプロイ仕様

### GitHub Actions自動デプロイ
**ワークフロー**: `.github/workflows/deploy.yml`

**トリガー**: `pitch-training-nextjs-v2-impl-001` ブランチへのpush

**処理フロー**:
1. Node.js 20環境構築
2. 依存関係インストール (`npm ci`)
3. 本番ビルド実行 (`npm run build`)
4. GitHub Pages設定
5. アーティファクトアップロード
6. 公式GitHub Pagesアクションでデプロイ

### 環境別設定
**開発環境**: GitHub Pages設定無効
**本番環境**: basePath='/pitch-training'、静的サイト出力

### 解決済み問題
1. **ローカルサーバー接続問題**: 開発・本番設定分離で解決
2. **GitHub Pages 404エラー**: パスエイリアス相対パス化で解決
3. **GitHub Actions権限エラー**: 公式推奨方式採用で解決
4. **重複ワークフロー**: 不要なworkflow削除で解決

---

## 📊 テスト実行ログ

### 実行環境
- **PC**: Chrome/Edge/Firefox/Safari
- **モバイル**: iPhone Safari/Android Chrome
- **テスト日**: 2025-07-18以降

### 実行手順
1. テストページにアクセス
2. 各テスト項目を順次実行
3. 結果を記録
4. 問題があれば詳細ログを確認

### 合格基準
- 全テスト項目の正常動作
- エラーハンドリングの適切な動作
- iPhone Safari での安定動作
- リソースリークの無いこと

---

## 🎯 次のステップ

### Step 2: AudioContext・音声処理基盤
Step 1のテスト完了後、AudioContextを使用した音声処理基盤の実装に進む

### 継続的改善
- テスト結果に基づく機能改善
- パフォーマンスの最適化
- エラーハンドリングの強化

---

**作成日**: 2025-07-18  
**作成者**: Claude Code Assistant  
**対象**: Step 1 マイクロフォン基本機能テスト

**重要**: このテストの完了がStep 2以降の実装の前提条件となります。