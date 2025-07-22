# STEP_COMPLETION_CHECKLIST.md - Step別完了基準

## 🎯 このドキュメントについて

### **目的**
- 各Step完了基準の明確定義
- クラッシュ復帰時の進捗確認
- 品質保証・テスト基準統一

### **使用方法**
1. **Step開始時**: 完了基準を事前確認
2. **作業中**: チェックリスト項目を順次確認
3. **Step完了時**: 全項目チェック・証跡記録

---

## 📋 Phase 1: 共通基盤構築

### **Step 1-1A: useAudioEngine基本構造作成** ⏸️

#### **完了基準チェックリスト**
- [ ] **ファイル作成**: `/src/hooks/useAudioEngine.ts` 作成
- [ ] **インターフェース定義**: AudioEngineConfig・AudioEngineReturn完成
- [ ] **基本Hook構造**: useState・useRef・useCallback実装
- [ ] **TypeScript型安全**: エラーなしでコンパイル
- [ ] **基本エクスポート**: Hook正常エクスポート確認

#### **実装必須項目**
```typescript
interface AudioEngineConfig {
  mode: 'random' | 'continuous' | 'chromatic';
  enablePitchDetection: boolean;
  enableHarmonicCorrection: boolean;
  baseNotes: string[];
}

export interface AudioEngineReturn {
  // 基音再生機能
  playBaseTone: (note: string) => Promise<void>;
  stopBaseTone: () => void;
  
  // マイクロフォン機能
  startPitchDetection: () => Promise<void>;
  stopPitchDetection: () => void;
  
  // リアルタイム検出
  currentPitch: number | null;
  correctedPitch: number | null;
  confidence: number;
  
  // 状態管理
  isPlaying: boolean;
  phase: AudioSystemPhase;
  error: string | null;
}
```

#### **テスト基準**
- [ ] **基本インポート**: 他ファイルからimport成功
- [ ] **型チェック**: TypeScript strict mode通過
- [ ] **基本呼び出し**: Hook実行時エラーなし

#### **完了証跡記録**
- **ファイル**: `/src/hooks/useAudioEngine.ts`
- **コミット**: `[未実装]`
- **テスト結果**: `[未実行]`
- **確認日**: `[未完了]`

---

### **Step 1-1B: Tone.js統合** ⏸️

#### **完了基準チェックリスト**
- [ ] **Salamander Piano設定移植**: `/test/separated-audio/`から設定移植
- [ ] **既存3モード設定互換**: volume:6, release:1.5, velocity:0.8統一
- [ ] **AudioContext管理**: Tone.start()・状態管理実装
- [ ] **エラーハンドリング**: 音源読み込み・再生エラー対応
- [ ] **メモリ管理**: sampler破棄・リソース解放実装

#### **実装必須項目**
```typescript
// Salamander Piano設定（既存モード互換）
const sampler = new Tone.Sampler({
  urls: { "C4": "C4.mp3" },
  baseUrl: "https://tonejs.github.io/audio/salamander/",
  release: 1.5,         // 既存統一設定
  volume: 6             // iPhone最適化設定
}).toDestination();

// 再生パラメータ統一
sampler.triggerAttack(note, undefined, 0.8); // velocity統一
```

#### **テスト基準**
- [ ] **音源再生**: C4-E5範囲の基音正常再生
- [ ] **設定互換**: 既存3モードと同一音質・音量
- [ ] **エラー処理**: ネットワーク・音源エラー適切処理
- [ ] **メモリ確認**: メモリリークなし

#### **完了証跡記録**
- **ファイル**: `/src/hooks/useAudioEngine.ts` (Tone.js統合)
- **コミット**: `[未実装]`
- **テスト結果**: `[未実行]`
- **確認日**: `[未完了]`

---

### **Step 1-1C: Pitchy統合** ⏸️

#### **完了基準チェックリスト**
- [ ] **PitchDetector移植**: `/test/separated-audio/`からMcLeod Pitch Method移植
- [ ] **Web Audio API統合**: AudioContext・AnalyserNode管理
- [ ] **マイクロフォン管理**: MediaStream取得・エラーハンドリング
- [ ] **リアルタイム検出**: 60fps音程検出・状態更新
- [ ] **権限管理**: マイク許可・エラー状態適切処理

#### **実装必須項目**
```typescript
// PitchDetector統合
const detector = PitchDetector.forFloat32Array(analyser.fftSize);
const pitch = detector.findPitch(float32Array, audioContext.sampleRate);

// マイクロフォン管理
const stream = await navigator.mediaDevices.getUserMedia({ 
  audio: { sampleRate: 44100 } 
});
```

#### **テスト基準**
- [ ] **音程検出**: 130-1047Hz人間音域での精度確認
- [ ] **リアルタイム**: 遅延なし60fps更新
- [ ] **権限処理**: 許可・拒否・エラー全状態対応
- [ ] **iPhone確認**: Safari環境正常動作

#### **完了証跡記録**
- **ファイル**: `/src/hooks/useAudioEngine.ts` (Pitchy統合)
- **コミット**: `[未実装]`
- **テスト結果**: `[未実行]`
- **確認日**: `[未完了]`

---

### **Step 1-1D: 倍音補正システム統合** ⏸️

#### **完了基準チェックリスト**
- [ ] **HarmonicCorrectionConfig移植**: 倍音補正設定統合
- [ ] **correctHarmonicFrequency実装**: 倍音自動補正関数
- [ ] **人間音域制限**: C3-C6 (130.81-1046.50Hz) 範囲制限
- [ ] **安定化バッファ**: 過去5フレーム平均処理
- [ ] **信頼度計算**: 補正精度・確信度数値化

#### **実装必須項目**
```typescript
interface HarmonicCorrectionConfig {
  fundamentalSearchRange: number;    // ±50Hz基音探索
  harmonicRatios: number[];          // [0.5, 2.0, 3.0, 4.0]
  confidenceThreshold: number;       // 0.8確信度
  vocalRange: { min: number, max: number }; // C3-C6
}

// 倍音補正関数
function correctHarmonicFrequency(
  detectedFreq: number, 
  config: HarmonicCorrectionConfig
): { corrected: number, confidence: number, type: string }
```

#### **テスト基準**
- [ ] **補正精度**: 倍音誤検出の90%以上補正
- [ ] **人間音声対応**: 実際の歌声サンプルで動作確認
- [ ] **安定性**: 継続検出時の安定した補正
- [ ] **デバッグ表示**: 補正種別・信頼度可視化

#### **完了証跡記録**
- **ファイル**: `/src/hooks/useAudioEngine.ts` (倍音補正統合)
- **コミット**: `[未実装]`
- **テスト結果**: `[未実行]`
- **確認日**: `[未完了]`

---

### **Step 1-2A: TrainingLayout.tsx作成** ⏸️

#### **完了基準チェックリスト**
- [ ] **ファイル作成**: `/src/components/TrainingLayout.tsx` 作成
- [ ] **インターフェース定義**: TrainingLayoutProps完成
- [ ] **モード別カラー**: green・purple・orange対応
- [ ] **タイムスタンプ統合**: 既存3モードタイムスタンプ統一
- [ ] **レスポンシブ対応**: モバイル・デスクトップ最適化

#### **実装必須項目**
```typescript
interface TrainingLayoutProps {
  title: string;
  subtitle: string;
  colorScheme: 'green' | 'purple' | 'orange';
  children: React.ReactNode;
  debugLog?: string[];
  showTimestamp?: boolean;
}
```

#### **テスト基準**
- [ ] **3モード表示**: ランダム・連続・12音階全対応
- [ ] **カラー確認**: モード別グラデーション正常表示
- [ ] **レイアウト**: max-w-4xl統一・中央配置
- [ ] **iPhone確認**: Safari環境レスポンシブ正常

#### **完了証跡記録**
- **ファイル**: `/src/components/TrainingLayout.tsx`
- **コミット**: `[未実装]`
- **テスト結果**: `[未実行]`
- **確認日**: `[未完了]`

---

### **Step 1-2B: AudioControls.tsx作成** ⏸️

#### **完了基準チェックリスト**
- [ ] **ファイル作成**: `/src/components/AudioControls.tsx` 作成
- [ ] **モード別制御**: ランダム・連続・12音階制御統合
- [ ] **ボタン状態管理**: 再生中・停止状態適切表示
- [ ] **アイコン統合**: Lucide React アイコン統一
- [ ] **アクセシビリティ**: disabled状態・フォーカス対応

#### **実装必須項目**
```typescript
interface AudioControlsProps {
  mode: 'random' | 'continuous' | 'chromatic';
  isPlaying: boolean;
  onStart: (param?: any) => void;
  onStop?: () => void;
  onDirectionChange?: (direction: 'ascending' | 'descending') => void;
}
```

#### **テスト基準**
- [ ] **ランダムモード**: 単発再生ボタン正常動作
- [ ] **連続モード**: 開始・停止ボタン正常動作
- [ ] **12音階モード**: 上行・下行・停止ボタン正常動作
- [ ] **状態同期**: isPlayingと表示状態同期

#### **完了証跡記録**
- **ファイル**: `/src/components/AudioControls.tsx`
- **コミット**: `[未実装]`
- **テスト結果**: `[未実行]`
- **確認日**: `[未完了]`

---

### **Step 1-2C: PitchDisplay.tsx作成** ⏸️

#### **完了基準チェックリスト**
- [ ] **ファイル作成**: `/src/components/PitchDisplay.tsx` 作成
- [ ] **リアルタイム表示**: 周波数・音程名・信頼度表示
- [ ] **倍音補正表示**: 補正前後・補正種別表示
- [ ] **デバッグモード**: 詳細情報表示・非表示切り替え
- [ ] **視覚的フィードバック**: 色・アニメーション・グラフ

#### **実装必須項目**
```typescript
interface PitchDisplayProps {
  currentPitch: number | null;
  correctedPitch: number | null;
  targetPitch: number | null;
  confidence: number;
  showDebugInfo?: boolean;
  compact?: boolean;
}
```

#### **テスト基準**
- [ ] **周波数表示**: リアルタイム数値更新確認
- [ ] **音程名変換**: 周波数→音程名正確変換
- [ ] **補正表示**: 倍音補正情報明確表示
- [ ] **パフォーマンス**: 60fps更新時パフォーマンス確認

#### **完了証跡記録**
- **ファイル**: `/src/components/PitchDisplay.tsx`
- **コミット**: `[未実装]`
- **テスト結果**: `[未実行]`
- **確認日**: `[未完了]`

---

## 📋 Phase 2: ランダムモード高度化

### **Step 2-1A: ランダムモードHook統合** ⏸️

#### **完了基準チェックリスト**
- [ ] **useAudioEngine統合**: `/src/app/training/random/page.tsx`修正
- [ ] **既存機能保持**: 既存ランダム選択・再生ロジック維持
- [ ] **Hook設定**: mode:'random', enablePitchDetection:true設定
- [ ] **状態管理統合**: isPlaying・currentNote状態統合
- [ ] **エラーハンドリング**: Hook・既存両方のエラー適切処理

#### **テスト基準**
- [ ] **既存機能**: 従来の基音再生機能正常動作
- [ ] **Hook機能**: 新規Hook機能正常動作
- [ ] **状態同期**: Hook・コンポーネント状態同期
- [ ] **エラー処理**: 各種エラー状況適切対応

#### **完了証跡記録**
- **ファイル**: `/src/app/training/random/page.tsx`
- **コミット**: `[未実装]`
- **テスト結果**: `[未実行]`
- **確認日**: `[未完了]`

---

## 📊 チェックリスト活用ガイド

### **Step開始時**
1. 完了基準チェックリスト事前確認
2. 実装必須項目把握
3. テスト基準理解

### **作業中**
1. チェック項目を順次確認
2. 完了項目にチェックマーク
3. 問題発生時は詳細記録

### **Step完了時**
1. 全チェック項目確認
2. テスト基準全項目クリア
3. 完了証跡記録更新
4. PROJECT_PROGRESS_TRACKER.md更新

### **復帰時**
1. 前回完了Step確認
2. 進行中Stepチェック状況確認
3. 次回作業項目特定

---

**作成日**: 2025-07-22  
**最終更新**: 2025-07-22  
**管理者**: Claude Code Assistant  
**用途**: VSCodeクラッシュ対応・品質保証・進捗管理