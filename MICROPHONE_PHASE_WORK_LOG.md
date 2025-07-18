# マイクロフォン実装フェーズ作業ログ v1.0

## 📋 フェーズ概要

**目的**: 相対音感トレーニングアプリの音程検出システム実装
**戦略**: HYBRID許可システムを完全排除し、ベストプラクティス基準での段階的実装
**期間**: 2025-07-18 開始
**予想総作業時間**: 6-11時間

---

## 🎯 5段階実装フロー

### Step 1: 基本マイクロフォン許可・音声取得 (1-2時間)
- **対象**: 最小限のマイクロフォン制御
- **重要設定**: `autoGainControl: false`, `echoCancellation: false`, `noiseSuppression: false`
- **テスト項目**: 
  - PC Chrome でのマイクロフォン許可
  - iPhone Safari でのマイクロフォン許可
  - 音声出力制御問題の確認

### Step 2: AudioContext・音声処理基盤 (1-2時間)
- **対象**: AudioContext 安全初期化
- **音声処理チェーン**: マイク → アナライザー (最小構成)
- **テスト項目**:
  - AudioContext 初期化成功
  - 音声データ取得成功
  - iPhone Safari サスペンド状態対応

### Step 3: 1段階ノイズフィルタリング (1-2時間)
- **対象**: ハイパスフィルター実装 (80Hz)
- **音声処理チェーン**: マイク → フィルター → アナライザー
- **テスト項目**:
  - 低周波ノイズ除去効果確認
  - 音声品質改善確認
  - パフォーマンス影響測定

### Step 4: Pitchy音程検出統合 (2-3時間)
- **対象**: Pitchy ライブラリ統合
- **音程検出**: McLeod Pitch Method (±1セント精度)
- **テスト項目**:
  - ピアノ音程検出精度テスト
  - 人声音程検出精度テスト
  - リアルタイム性能測定

### Step 5: 完全統合・テスト (1-2時間)
- **対象**: 統合テストページ作成
- **包括テスト**: 全機能統合動作確認
- **テスト項目**:
  - 基本機能: マイクロフォンON/OFF
  - 音程検出: 精度・リアルタイム性
  - iPhone Safari: 全機能動作確認
  - パフォーマンス: CPU・メモリ使用量

---

## 🚨 重要な失敗回避策

### 段階的実装の厳守
- ✅ 一度に複数機能を追加しない
- ✅ 各段階で必ずテスト実行
- ✅ iPhone Safari での毎回確認
- ✅ リソース管理の適切な実装
- ✅ 全エラーケースへの対応

### 危険な実装パターン回避
- ❌ `autoGainControl: true` (デフォルト)
- ❌ 複数MediaStream同時取得
- ❌ AudioContext の不適切な管理
- ❌ iPhone Safari制約の無視
- ❌ 段階的テストの省略

### 音程検出最適化制約 (必須)
```typescript
const constraints = {
  audio: {
    autoGainControl: false,      // 最重要
    echoCancellation: false,     // 最重要
    noiseSuppression: false,     // 最重要
    sampleRate: 44100,
    channelCount: 1,
    latency: 0.01,
  }
};
```

---

## 📝 作業ログ

### 2025-07-18 17:30 - フェーズ開始準備
- **準備完了**: HYBRID許可システム影響の既存ファイル削除
- **削除対象**: `src/hooks/useMicrophoneManager.ts` (2025-07-17作成)
- **削除理由**: HYBRID許可システム仕様が含まれ、ベストプラクティス違反
- **作業フロー**: 5段階実装フロー策定完了
- **参考資料**: 3つのベストプラクティス文書作成済み

### 進行状況
- [ ] Step 1: 基本マイクロフォン許可・音声取得
- [ ] Step 2: AudioContext・音声処理基盤
- [ ] Step 3: 1段階ノイズフィルタリング
- [ ] Step 4: Pitchy音程検出統合
- [ ] Step 5: 完全統合・テスト

### 次回作業予定
- **開始**: Step 1から慎重に実装開始
- **対象ファイル**: `src/hooks/useMicrophoneManager.ts` (新規作成)
- **実装方針**: 最小限の基本機能から段階的拡張

---

## 🔍 重要な技術的発見事項

### iPhone Safari の特殊制約
- **音声出力強制切り替え**: マイクロフォン許可と同時にスピーカーに強制切り替わる
- **setSinkId() 未サポート**: WebKit では音声出力制御APIが使用不可
- **複数ストリーム競合**: 新しいgetUserMedia()で前のストリームが自動ミュート

### autoGainControl の問題
- **デフォルト有効**: 自動的に音量調整が行われ、音程検出精度が大幅低下
- **必須無効化**: 音程検出には必ず無効化が必要

### React Hooks での注意点
- **リソースリーク**: 不適切なクリーンアップでAudioContext・MediaStreamが残存
- **useRef必須**: 非同期処理でのstate管理にはuseRefが必要

---

## 📚 作成済み参考資料

### 技術仕様書
- ✅ `PITCH_DETECTION_PHASE1_SPECIFICATION.md` - Phase 1 詳細仕様
- ✅ `MICROPHONE_CONTROL_SPECIFICATION.md` - マイクロフォン制御仕様
- ✅ `MICROPHONE_IMPLEMENTATION_BEST_PRACTICES.md` - ベストプラクティス
- ✅ `MICROPHONE_IMPLEMENTATION_WORKFLOW.md` - 実装作業フロー

### 外部技術資料
- [Web Audio API Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)
- [Pitchy Documentation](https://github.com/ianprime0509/pitchy)
- [Common getUserMedia() Errors](https://blog.addpipe.com/common-getusermedia-errors/)
- [iPhone Safari Audio Issues](https://medium.com/@python-javascript-php-html-css/ios-safari-forces-audio-output-to-speakers-when-using-getusermedia-2615196be6fe)

---

## 🧪 各段階での必須検証項目

### Step 1 検証
- [ ] セキュリティコンテキスト確認 (HTTPS)
- [ ] 基本的な許可取得動作
- [ ] iPhone Safari での許可動作
- [ ] エラーハンドリングの動作

### Step 2 検証
- [ ] AudioContext 初期化成功
- [ ] 音声データ取得成功
- [ ] iPhone Safari サスペンド対応
- [ ] リソース管理の適切性

### Step 3 検証
- [ ] ノイズフィルタリング効果確認
- [ ] 音声品質改善確認
- [ ] パフォーマンス影響測定
- [ ] フィルター設定の最適化

### Step 4 検証
- [ ] 音程検出精度 (±1セント)
- [ ] リアルタイム性能 (< 50ms)
- [ ] 信頼度閾値調整
- [ ] 人声・楽器音両対応

### Step 5 検証
- [ ] 全機能統合動作確認
- [ ] iPhone Safari 完全対応
- [ ] 長時間安定性 (30分以上)
- [ ] CPU・メモリ使用量監視

---

## 🚨 緊急時対応

### 実装中にエラーが発生した場合
1. **即座に作業停止**: 問題の拡大を防ぐ
2. **エラーログ記録**: 詳細な状況を記録
3. **段階的ロールバック**: 前の動作確認段階に戻る
4. **原因調査**: ベストプラクティス文書と照合
5. **修正後再開**: 問題解決後に慎重に再開

### よくある問題と対策
- **許可が取得できない**: セキュリティコンテキスト確認
- **音声データが取得できない**: AudioContext状態確認
- **iPhone Safari で動作しない**: サスペンド状態・制約確認
- **音程検出精度が低い**: autoGainControl設定確認

---

## 🎯 成功条件

### 基本機能
- ✅ マイクロフォンON/OFF制御が確実に動作
- ✅ iPhone Safari での完全動作
- ✅ 適切なエラーハンドリング

### 音程検出機能
- ✅ ±1セント精度での音程検出
- ✅ 50ms以下のリアルタイム処理
- ✅ 人声・楽器音両対応

### 安定性・性能
- ✅ 30分以上の長時間安定動作
- ✅ CPU使用率30%以下
- ✅ メモリ使用量50MB以下

---

## 🔄 次期フェーズ予定

### Phase 2: 音程判定システム実装
- 基音との相対音程計算
- ドレミファソラシド判定ロジック
- 正解・不正解判定
- スコア・フィードバック機能

### Phase 3: UI/UX完成
- リアルタイム可視化
- 進行状況表示
- 結果表示・統計

### Phase 4: 統合テスト・デプロイ
- 全機能統合テスト
- iPhone Safari最適化
- 本番デプロイ準備

---

**VSCode クラッシュ対策として、各作業段階でこのログを更新します。**

**最終更新**: 2025-07-18 17:30
**作業者**: Claude Code Assistant
**進捗**: フェーズ開始準備完了 - Step 1実装開始待機中