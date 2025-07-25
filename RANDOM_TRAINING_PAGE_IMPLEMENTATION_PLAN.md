# 📋 /random-training ページ実装計画書（VSCodeクラッシュ対策版）

**作成日**: 2025-07-23  
**対象**: `/src/app/random-training/page.tsx`（新規作成）  
**目的**: v3.0.0マイクテスト経由フロー対応 + VSCodeクラッシュ対策  
**作業ブランチ**: `random-training-v3-impl-002`

---

## 🚨 **VSCodeクラッシュ対策基本方針**

### **開発制約**
- **1機能1実装**: 最小単位での実装・確認サイクル
- **段階的ビルド**: 各Step後に必ずビルド確認
- **即座コミット**: 動作確認後の即座Git保存
- **強制停止**: 各Step完了時にユーザー確認待ち
- **推測禁止**: 不明点は必ずユーザー確認

---

## 🎯 **音響特化アーキテクチャ設計原則**（CLAUDE.md準拠）

### **分離アーキテクチャ: UIはReact、音・マイク制御は直接操作**
```typescript
// UI層: React管理（状態・表示制御のみ）
const [trainingState, setTrainingState] = useState<TrainingState>();
const [currentScaleIndex, setCurrentScaleIndex] = useState(0);
const [score, setScore] = useState(0);

// 音響層: 直接操作（React非依存の手動管理）
const audioContextRef = useRef<AudioContext>();
const analyserRef = useRef<AnalyserNode>();
const pitchDetectorRef = useRef<PitchDetector<Float32Array>>();
const micStreamRef = useRef<MediaStream>();
const samplerRef = useRef<Tone.Sampler>();
```

---

## 📝 **実装ステップ詳細（全20ステップ）**

### **Phase 1: 基本構造（5ステップ）**

#### **Step 1-1: ページファイル作成**
**実装内容**: 基本的なNext.jsページ構造
```typescript
'use client';
import { useState } from 'react';
export default function RandomTrainingPage() {
  return <div>Random Training</div>;
}
```
**確認**: ビルド成功・ページアクセス可能
**コミット**: `Step 1-1: /random-trainingページ基本構造作成`

#### **Step 1-2: レイアウト構築**
**実装内容**: ヘッダー・メインエリア・フッター
- タイトル「ランダム基音トレーニング」
- 緑系テーマカラー（エメラルド）
- レスポンシブ対応
**確認**: UIレイアウト正常表示
**コミット**: `Step 1-2: レイアウト構築完了`

#### **Step 1-3: 状態管理定義**
**実装内容**: 必要な状態変数の定義
```typescript
type TrainingPhase = 'ready' | 'playing' | 'listening' | 'completed';
type ScaleResult = { scale: string; correct: boolean; frequency: number };
const [phase, setPhase] = useState<TrainingPhase>('ready');
const [results, setResults] = useState<ScaleResult[]>([]);
```
**確認**: TypeScriptエラーなし
**コミット**: `Step 1-3: 状態管理定義完了`

#### **Step 1-4: URLパラメータ確認**
**実装内容**: マイクテスト経由の確認
```typescript
const searchParams = useSearchParams();
const fromMicTest = searchParams.get('from') === 'mic-test';
```
**確認**: パラメータ取得正常
**コミット**: `Step 1-4: URLパラメータ確認機能実装`

#### **Step 1-5: UI要素配置**
**実装内容**: ボタン・表示エリア配置
- スタートボタン
- 基音表示エリア
- 進行状況エリア
- 結果表示エリア
**確認**: 全UI要素の表示
**コミット**: `Step 1-5: UI要素配置完了`

---

### **Phase 2: 基音再生システム（5ステップ）**

#### **Step 2-1: Tone.js統合**
**実装内容**: Tone.jsインポートとSampler準備
```typescript
import * as Tone from 'tone';
const samplerRef = useRef<Tone.Sampler | null>(null);
```
**確認**: インポートエラーなし
**コミット**: `Step 2-1: Tone.js統合完了`

#### **Step 2-2: Sampler初期化**
**実装内容**: Salamander Grand Piano設定
```typescript
const initializeSampler = async () => {
  samplerRef.current = new Tone.Sampler({
    urls: { "C4": "C4.mp3" },
    baseUrl: "https://tonejs.github.io/audio/salamander/",
    release: 1.5
  }).toDestination();
  await Tone.loaded();
};
```
**確認**: 音源読み込み成功
**コミット**: `Step 2-2: Sampler初期化実装`

#### **Step 2-3: 基音リスト定義**
**実装内容**: 10種類の基音と日本語名
```typescript
const baseNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'];
const baseNoteNames = {
  'C4': 'ド（低）', 'D4': 'レ（低）', // ...
};
```
**確認**: データ構造正常
**コミット**: `Step 2-3: 基音リスト定義完了`

#### **Step 2-4: ランダム基音選択**
**実装内容**: ランダム選択ロジック
```typescript
const selectRandomBaseNote = () => {
  const randomIndex = Math.floor(Math.random() * baseNotes.length);
  return baseNotes[randomIndex];
};
```
**確認**: ランダム選択動作
**コミット**: `Step 2-4: ランダム基音選択実装`

#### **Step 2-5: 基音再生機能**
**実装内容**: 1.7秒間の基音再生
```typescript
const playBaseNote = async (note: string) => {
  if (samplerRef.current) {
    samplerRef.current.triggerAttack(note, undefined, 0.8);
    setTimeout(() => {
      samplerRef.current?.triggerRelease(note);
    }, 1700);
  }
};
```
**確認**: 音再生成功
**コミット**: `Step 2-5: 基音再生機能完成`

---

### **Phase 3: 音程検出システム（5ステップ）**

#### **Step 3-1: 音響基盤統合**
**実装内容**: 既存実装の移植
- AudioContext、AnalyserNode、PitchDetector
- マイクストリーム管理
**確認**: 基本構造エラーなし
**コミット**: `Step 3-1: 音響基盤統合完了`

#### **Step 3-2: マイク初期化最適化**
**実装内容**: マイクテスト経由の最適化
```typescript
const initializeMicrophoneForTraining = async () => {
  // マイクテスト済みを前提とした簡略化
  if (!fromMicTest) {
    // フルセットアップ
  } else {
    // 簡易セットアップ
  }
};
```
**確認**: マイク初期化成功
**コミット**: `Step 3-2: マイク初期化最適化`

#### **Step 3-3: 検出ループ実装**
**実装内容**: requestAnimationFrameループ
- 既存のdetectPitch関数活用
- DOM直接更新の準備
**確認**: ループ動作確認
**コミット**: `Step 3-3: 検出ループ実装`

#### **Step 3-4: 周波数表示（DOM直接）**
**実装内容**: DDAS方式での表示
```typescript
const updateFrequencyDisplay = (frequency: number) => {
  const element = frequencyDisplayRef.current;
  if (element) {
    element.textContent = `${frequency.toFixed(1)} Hz`;
  }
};
```
**確認**: リアルタイム表示
**コミット**: `Step 3-4: 周波数表示実装`

#### **Step 3-5: 音名変換統合**
**実装内容**: マイクテストページの関数を再利用
- frequencyToNote関数
- 日本語音名表示
**確認**: 音名表示正常
**コミット**: `Step 3-5: 音名変換統合完了`

---

### **Phase 4: 判定システム（5ステップ）**

#### **Step 4-1: 8音階定義**
**実装内容**: ドレミファソラシド定義
```typescript
const SCALE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'];
const SCALE_NAMES = ['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ', 'ド'];
```
**確認**: データ構造確認
**コミット**: `Step 4-1: 8音階定義完了`

#### **Step 4-2: 相対音程計算**
**実装内容**: 基音からの音程計算
```typescript
const calculateInterval = (baseFreq: number, userFreq: number): number => {
  return 1200 * Math.log2(userFreq / baseFreq); // セント値
};
```
**確認**: 計算ロジック正常
**コミット**: `Step 4-2: 相対音程計算実装`

#### **Step 4-3: 正解判定ロジック**
**実装内容**: ±50セント判定
```typescript
const judgeNote = (expectedInterval: number, actualInterval: number): boolean => {
  return Math.abs(expectedInterval - actualInterval) <= 50;
};
```
**確認**: 判定動作確認
**コミット**: `Step 4-3: 正解判定ロジック実装`

#### **Step 4-4: 進行管理**
**実装内容**: 8音階順次進行
- currentScaleIndex管理
- 自動進行ロジック
**確認**: 進行動作確認
**コミット**: `Step 4-4: 進行管理実装`

#### **Step 4-5: 結果記録**
**実装内容**: 各音階の結果保存
```typescript
const recordResult = (scale: string, correct: boolean, frequency: number) => {
  setResults(prev => [...prev, { scale, correct, frequency }]);
};
```
**確認**: 結果記録正常
**コミット**: `Step 4-5: 結果記録機能完成`

---

### **Phase 5: 完成・最適化（5ステップ）**

#### **Step 5-1: 結果表示UI**
**実装内容**: スコア・詳細表示
- 総合スコア計算
- 音階別結果表示
- ビジュアル化
**確認**: 表示正常
**コミット**: `Step 5-1: 結果表示UI完成`

#### **Step 5-2: もう一度機能**
**実装内容**: リセット・再開機能
- 状態リセット
- 音響リソース維持
**確認**: リセット動作
**コミット**: `Step 5-2: もう一度機能実装`

#### **Step 5-3: エラーハンドリング**
**実装内容**: 各種エラー対応
- マイクエラー
- 音源エラー
- ブラウザ互換性
**確認**: エラー処理動作
**コミット**: `Step 5-3: エラーハンドリング完成`

#### **Step 5-4: iPhone最適化**
**実装内容**: Safari対応強化
- スタイル競合回避
- 音量調整
**確認**: iPhone動作確認
**コミット**: `Step 5-4: iPhone最適化完了`

#### **Step 5-5: 最終調整**
**実装内容**: 
- パフォーマンス最適化
- メモリリーク対策
- UI微調整
**確認**: 全機能統合テスト
**コミット**: `Step 5-5: 最終調整完了`

---

## 📋 **各Step完了時の必須プロセス**

### **🔄 必須実行フロー**
```
1. 機能実装完了（最小単位）
2. ビルド確認（npm run build）
3. 動作テスト（ローカル/デプロイ）
4. Git操作（add → commit → push）
5. 📋 詳細確認テンプレート提示
6. ⏸️ ユーザー確認待ち（必須）
7. ✅ 「問題ない」確認取得
8. 🔄 次Step進行確認表示
```

---

## 🎯 **実装概要**

**総Step数**: 20 Steps（5 Phases）  
**予想実装時間**: 各Step 10-15分  
**VSCodeクラッシュ対策**: 最大15分間隔での確実保存  
**使用ブランチ**: `random-training-v3-impl-002`

### **成功指標**
- [ ] マイクテスト経由フローの正常動作
- [ ] 基音再生（Salamander Piano）の正常動作
- [ ] 音程検出（Pitchy）の高精度動作
- [ ] 8音階判定システムの完動
- [ ] iPhone Safari完全対応

### **技術的特徴**
- ✅ 音響特化アーキテクチャ適用
- ✅ Direct DOM Audio System (DDAS)
- ✅ React非依存の音響処理
- ✅ 適切なエラーハンドリング
- ✅ メモリリーク対策

---

**作成者**: Claude Code Assistant  
**承認待ち**: ユーザー承認待機中  
**運用開始**: 承認後、Step 1-1から段階的実装開始