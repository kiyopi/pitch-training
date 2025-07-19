# Phase 1: 音程検出システム実装仕様書 v1.0

## 📋 概要

### 目的
相対音感トレーニングアプリの核心機能である音程検出システムを実装し、ユーザーの歌唱音程をリアルタイムで高精度に検出する。

### 技術要件
- **音程検出**: Pitchy ライブラリ (McLeod Pitch Method)
- **ノイズリダクション**: 3段階フィルタリング
- **リアルタイム処理**: 低遅延音声処理
- **iPhone Safari対応**: Web Audio API制限対応

---

## 🎯 Phase 1 詳細仕様

### 1.1 マイクロフォン許可・音声入力システム

#### **実装範囲**
- Web Audio API による音声入力
- iPhone Safari 制限対応
- 動的許可状態管理
- エラーハンドリング

#### **技術仕様**
```typescript
interface MicrophoneConfig {
  sampleRate: 44100,           // 高品質音声サンプリング
  bufferSize: 4096,            // リアルタイム処理バランス
  channels: 1,                 // モノラル入力
  autoGainControl: false,      // 自動音量調整無効
  echoCancellation: false,     // エコーキャンセル無効
  noiseSuppression: false      // ブラウザ側ノイズ抑制無効
}
```

### 1.2 3段階ノイズリダクションシステム

#### **Stage 1: ハイパスフィルター**
- **目的**: 低周波ノイズ除去
- **カットオフ周波数**: 80Hz
- **対象**: 環境ノイズ、振動、風切り音

#### **Stage 2: ローパスフィルター**
- **目的**: 高周波ノイズ除去
- **カットオフ周波数**: 2000Hz
- **対象**: 電子ノイズ、サンプリングノイズ

#### **Stage 3: ノッチフィルター**
- **目的**: 電源ハムノイズ除去
- **対象周波数**: 50Hz, 60Hz, 100Hz, 120Hz
- **Q値**: 30 (狭帯域除去)

```typescript
interface NoiseReductionConfig {
  highpass: {
    frequency: 80,
    type: 'highpass',
    Q: 0.7
  },
  lowpass: {
    frequency: 2000,
    type: 'lowpass', 
    Q: 0.7
  },
  notchFilters: [
    { frequency: 50, Q: 30 },   // 50Hz電源ハム
    { frequency: 60, Q: 30 },   // 60Hz電源ハム
    { frequency: 100, Q: 30 },  // 100Hz倍音
    { frequency: 120, Q: 30 }   // 120Hz倍音
  ]
}
```

### 1.3 Pitchy音程検出システム

#### **McLeod Pitch Method実装**
- **ライブラリ**: `pitchy` v4.1.0
- **アルゴリズム**: McLeod Pitch Method (MPM)
- **精度**: ±1セント (半音の1/100)
- **検出範囲**: 80Hz - 2000Hz

#### **動的オクターブ補正**
```typescript
interface PitchDetectionConfig {
  clarityThreshold: 0.9,       // 検出信頼度閾値
  minFrequency: 80,            // 最低検出周波数
  maxFrequency: 2000,          // 最高検出周波数
  octaveCorrection: true,      // 倍音誤検出自動補正
  smoothingFactor: 0.8         // 周波数平滑化係数
}
```

### 1.4 リアルタイム音程分析

#### **処理フロー**
1. **音声入力**: マイクロフォン → AudioContext
2. **ノイズリダクション**: 3段階フィルタリング
3. **音程検出**: Pitchy MPM アルゴリズム
4. **オクターブ補正**: 倍音誤検出回避
5. **周波数平滑化**: ジッター除去
6. **音程出力**: Hz → 音名変換

#### **パフォーマンス要件**
- **処理遅延**: < 50ms
- **検出頻度**: 60Hz (16.7ms間隔)
- **CPU使用率**: < 30%
- **メモリ使用量**: < 50MB

---

## 🛠️ 作業フロー

### Step 1: 基盤システム構築 (1-2時間)
```bash
# 1.1 マイクロフォンマネージャー拡張
- 既存 useMicrophoneManager.ts の拡張
- iPhone Safari 対応強化
- エラーハンドリング改善

# 1.2 音声処理パイプライン構築
- AudioContext 最適化
- リアルタイム処理基盤
- バッファリング管理
```

### Step 2: ノイズリダクション実装 (2-3時間)
```bash
# 2.1 フィルターシステム構築
- BiquadFilterNode チェーン実装
- 動的フィルター係数調整
- パフォーマンス最適化

# 2.2 ノイズリダクションフック作成
- useNoiseReduction カスタムフック
- リアルタイム処理対応
- 設定可能なパラメーター
```

### Step 3: 音程検出エンジン実装 (3-4時間)
```bash
# 3.1 Pitchy統合
- McLeod Pitch Method 実装
- 高精度音程検出
- 動的オクターブ補正

# 3.2 音程検出フック作成
- usePitchDetection カスタムフック
- リアルタイム周波数分析
- 音程データ出力
```

### Step 4: システム統合・テスト (2-3時間)
```bash
# 4.1 統合テストページ作成
- 音程検出テスト専用ページ
- リアルタイム可視化
- デバッグ機能

# 4.2 iPhone Safari 最適化
- パフォーマンス調整
- 制限事項対応
- 安定性確保
```

### Step 5: 品質保証・文書化 (1-2時間)
```bash
# 5.1 品質保証
- 精度測定・調整
- エラーケース対応
- パフォーマンス検証

# 5.2 文書化
- API仕様書作成
- 使用方法ドキュメント
- トラブルシューティング
```

---

## 🧪 検証項目

### 機能検証
- [ ] マイクロフォン許可・音声入力
- [ ] 3段階ノイズリダクション効果
- [ ] 音程検出精度 (±1セント)
- [ ] リアルタイム処理性能 (< 50ms)
- [ ] iPhone Safari 動作確認

### 音程検出テスト
- [ ] ピアノ音 (C4-C5) 検出精度
- [ ] 人声 (歌唱) 検出精度
- [ ] 楽器音 (ギター等) 検出精度
- [ ] ノイズ環境での検出精度

### パフォーマンステスト
- [ ] CPU使用率測定
- [ ] メモリ使用量測定
- [ ] 処理遅延測定
- [ ] 長時間動作安定性

---

## 🚨 リスク・制限事項

### 技術的制約
- **iPhone Safari制限**: AudioContext起動制限
- **処理能力**: リアルタイム処理の計算負荷
- **マイクロフォン品質**: デバイス依存の音質差
- **環境ノイズ**: 検出精度への影響

### 対策方針
- **段階的実装**: 基本機能から段階的に高度化
- **パフォーマンス監視**: リアルタイム負荷監視
- **フォールバック**: 低性能環境での代替処理
- **ユーザー教育**: 最適使用環境の案内

---

## 📚 参考技術資料

### 音程検出
- [Pitchy Documentation](https://github.com/ianprime0509/pitchy)
- [McLeod Pitch Method Paper](https://www.cs.otago.ac.nz/research/dsp/papers/mcleod_pitch_method.pdf)
- [Web Audio API Specification](https://webaudio.github.io/web-audio-api/)

### ノイズリダクション
- [Digital Signal Processing](https://en.wikipedia.org/wiki/Digital_signal_processing)
- [Audio Filtering Techniques](https://www.dspguide.com/ch19.htm)
- [BiquadFilterNode](https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode)

---

**作成日**: 2025-07-18  
**作成者**: Claude Code Assistant  
**対象**: 相対音感トレーニングアプリ Phase 1 実装  
**予想作業時間**: 8-14時間  
**完成予定**: 2025-07-19