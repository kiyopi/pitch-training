# Step 3: 1段階ノイズフィルタリング 実装仕様書 v1.0

## 📋 概要

### 目的
Step 2で構築した音声処理基盤を拡張し、音程検出精度向上のための1段階ノイズフィルタリングシステムを実装

### 作成日
2025-07-18

### 対象システム
Next.js 15.4.1 + TypeScript + 相対音感トレーニングアプリ

---

## 🎯 Step 3実装目標

### 1. 3段階フィルタリングシステム
- **ハイパスフィルター**: 低周波ノイズ除去（60Hz以下）
- **ローパスフィルター**: 高周波ノイズ除去（8kHz以上）
- **ノッチフィルター**: 電源ノイズ除去（50Hz/60Hz）

### 2. 音程検出最適化
- **人間の音声帯域**: 80Hz - 4kHz に特化
- **倍音強調**: 基音検出精度向上
- **ノイズ抑制**: 環境ノイズ・機器ノイズ除去

---

## 🔧 Step 3実装設計

### 1. useNoiseFilterフック作成

#### フィルター仕様
```typescript
interface NoiseFilterConfig {
  // ハイパスフィルター設定
  highpass: {
    frequency: number;    // 60Hz - 低周波ノイズカット
    Q: number;           // 0.7 - 品質係数
    gain: number;        // 0dB - ゲイン
  };
  
  // ローパスフィルター設定
  lowpass: {
    frequency: number;    // 8000Hz - 高周波ノイズカット
    Q: number;           // 0.7 - 品質係数
    gain: number;        // 0dB - ゲイン
  };
  
  // ノッチフィルター設定
  notch: {
    frequency: number;    // 50Hz or 60Hz - 電源ノイズカット
    Q: number;           // 10 - 鋭いノッチ
    gain: number;        // -40dB - 大幅減衰
  };
}
```

#### 実装インターフェース
```typescript
interface NoiseFilterState {
  isFiltering: boolean;
  highpassFilter: BiquadFilterNode | null;
  lowpassFilter: BiquadFilterNode | null;
  notchFilter: BiquadFilterNode | null;
  gainNode: GainNode | null;
  error: string | null;
}

interface NoiseFilterHook {
  filterState: NoiseFilterState;
  applyFilters: (audioContext: AudioContext, sourceNode: AudioNode) => AudioNode;
  updateFilterConfig: (config: Partial<NoiseFilterConfig>) => void;
  resetFilters: () => void;
  getFilterResponse: () => FilterResponse;
}
```

### 2. フィルターチェーン構築

#### 音声処理フロー
```
MediaStreamSource → HighPass → LowPass → Notch → Gain → AnalyserNode
                     (60Hz)    (8kHz)   (50/60Hz) (0dB)
```

#### 技術仕様
```typescript
// BiquadFilterNode設定
const createHighpassFilter = (audioContext: AudioContext): BiquadFilterNode => {
  const filter = audioContext.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 60;  // 60Hz以下をカット
  filter.Q.value = 0.7;         // 自然な減衰
  return filter;
};

const createLowpassFilter = (audioContext: AudioContext): BiquadFilterNode => {
  const filter = audioContext.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 8000; // 8kHz以上をカット
  filter.Q.value = 0.7;          // 自然な減衰
  return filter;
};

const createNotchFilter = (audioContext: AudioContext): BiquadFilterNode => {
  const filter = audioContext.createBiquadFilter();
  filter.type = 'notch';
  filter.frequency.value = 60;   // 60Hz電源ノイズカット
  filter.Q.value = 10;           // 鋭いノッチ
  return filter;
};
```

### 3. Step 2統合

#### useAudioProcessor拡張
```typescript
interface EnhancedAudioProcessorHook extends AudioProcessorHook {
  noiseFilter: NoiseFilterHook;
  getFilteredData: () => ProcessedAudioData;
  enableFiltering: (enabled: boolean) => void;
}
```

#### フィルター適用フロー
```typescript
const applyNoiseFiltering = (audioContext: AudioContext, sourceNode: AudioNode): AudioNode => {
  // 1. ハイパスフィルター適用
  const highpassNode = createHighpassFilter(audioContext);
  sourceNode.connect(highpassNode);
  
  // 2. ローパスフィルター適用
  const lowpassNode = createLowpassFilter(audioContext);
  highpassNode.connect(lowpassNode);
  
  // 3. ノッチフィルター適用
  const notchNode = createNotchFilter(audioContext);
  lowpassNode.connect(notchNode);
  
  // 4. ゲインコントロール
  const gainNode = audioContext.createGain();
  gainNode.gain.value = 1.0;
  notchNode.connect(gainNode);
  
  return gainNode;
};
```

---

## 🧪 Step 3テスト仕様

### 1. フィルター機能テスト
- [ ] ハイパスフィルター動作確認
- [ ] ローパスフィルター動作確認
- [ ] ノッチフィルター動作確認
- [ ] フィルターチェーン統合確認

### 2. 音程検出改善テスト
- [ ] フィルター適用前後の音声品質比較
- [ ] 低周波ノイズ除去効果確認
- [ ] 高周波ノイズ除去効果確認
- [ ] 電源ノイズ除去効果確認

### 3. 統合テスト
- [ ] Step 1・2システムとの統合確認
- [ ] リアルタイム処理性能確認
- [ ] iPhone Safari対応確認
- [ ] エラーハンドリング確認

---

## 📊 期待される効果

### 1. 音程検出精度向上
- **低周波ノイズ除去**: 環境ノイズ（風音、振動）の除去
- **高周波ノイズ除去**: 機器ノイズ（サンプリング、電子回路）の除去
- **電源ノイズ除去**: 50Hz/60Hz電源ノイズの除去

### 2. 音声品質向上
- **S/N比改善**: 信号対雑音比の向上
- **基音強調**: 倍音に対する基音の相対強度向上
- **周波数特性最適化**: 人間の音声帯域への特化

### 3. システム安定性
- **一定品質**: 環境に依存しない安定した音声処理
- **エラー耐性**: ノイズによる誤検出の削減
- **処理効率**: 不要な周波数成分の事前除去

---

## 🚀 実装ステップ

### Step 3.1: useNoiseFilterフック作成
- [ ] 基本インターフェース定義
- [ ] 3段階フィルター実装
- [ ] フィルター設定管理
- [ ] エラーハンドリング

### Step 3.2: Step 2統合
- [ ] useAudioProcessorとの統合
- [ ] フィルターチェーン構築
- [ ] リアルタイム処理統合
- [ ] 性能最適化

### Step 3.3: テストページ作成
- [ ] フィルター効果可視化
- [ ] 周波数応答表示
- [ ] フィルター ON/OFF 比較
- [ ] リアルタイム音声品質表示

### Step 3.4: 統合テスト
- [ ] 全システム統合確認
- [ ] 性能ベンチマーク
- [ ] クロスブラウザ対応
- [ ] iPhone Safari最適化

---

## 🔄 次のステップ準備

### Step 4準備
- **Pitchy統合**: 高品質な音声データの提供
- **McLeod Pitch Method**: 最適化された入力データ
- **音程検出精度**: フィルタリング効果の活用

### パフォーマンス最適化
- **リアルタイム処理**: 低レイテンシー音声処理
- **メモリ効率**: 効率的なフィルター処理
- **CPU負荷**: 最適化されたフィルターチェーン

---

## 🗂️ ファイル構成

### 新規作成ファイル
- `/src/hooks/useNoiseFilter.ts` - ノイズフィルタリングコアフック
- `/src/app/test/noise-filter/page.tsx` - テストページ
- `/src/utils/audioFilters.ts` - フィルター関数ユーティリティ

### 修正ファイル
- `/src/hooks/useAudioProcessor.ts` - Step 3統合
- `/src/types/audio.ts` - フィルター型定義追加

---

**作成日**: 2025-07-18  
**作成者**: Claude Code Assistant  
**対象**: Step 3 1段階ノイズフィルタリング実装

**重要**: この実装により、Step 4 Pitchy統合の基盤となる高品質な音声データが提供されます。