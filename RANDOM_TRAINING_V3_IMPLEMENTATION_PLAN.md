# 📋 ランダム基音モード v3.0.0 実装計画書

**作成日**: 2025-07-23  
**対象**: `/src/app/training/random/page.tsx`  
**目的**: VSCodeクラッシュ対策 + v3.0.0マイクテスト経由フロー対応  

---

## 🚨 **VSCodeクラッシュ対策基本方針**

### **開発制約**
- **1機能1実装**: 最小単位での実装・確認サイクル
- **段階的ビルド**: 各Step後に必ずビルド確認
- **即座コミット**: 動作確認後の即座Git保存
- **強制停止**: 各Step完了時にユーザー確認待ち
- **推測禁止**: 不明点は必ずユーザー確認

### **技術制約**
- **メモリ管理**: AudioContext・PitchDetectorの適切な解放
- **プロセス分離**: UI層（React）と音響層（直接操作）の完全分離
- **iPhone対応**: CSS・JavaScript競合問題の事前対策

---

## 🔄 **Phase 1: 音程検出基盤システム（6 Steps）**

### **Step 1-1: Pitchy統合基盤**
**実装内容**: Pitchyライブラリインポート + 基本初期化
```typescript
import { PitchDetector } from 'pitchy';
const pitchDetectorRef = useRef<PitchDetector | null>(null);
```
**変更範囲**: import文 + useRef追加のみ
**確認**: ビルドエラーなし + 既存機能正常動作
**コミット**: `Step 1-1: Pitchy統合基盤実装`

### **Step 1-2: AudioContext・AnalyserNode基盤**
**実装内容**: Web Audio API基本構造 + useRef追加
```typescript
const audioContextRef = useRef<AudioContext | null>(null);
const analyserRef = useRef<AnalyserNode | null>(null);
```
**変更範囲**: AudioContext初期化関数のみ
**確認**: AudioContext正常作成 + エラーなし
**コミット**: `Step 1-2: AudioContext・AnalyserNode基盤実装`

### **Step 1-3: マイクストリーム取得関数**
**実装内容**: getUserMedia + AnalyserNode接続
```typescript
const initializeMicrophone = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const source = audioContextRef.current!.createMediaStreamSource(stream);
  source.connect(analyserRef.current!);
};
```
**変更範囲**: マイク取得関数1つのみ
**確認**: マイクアクセス成功 + 音声入力検出
**コミット**: `Step 1-3: マイクストリーム取得関数実装`

### **Step 1-4: 基本音程検出ループ**
**実装内容**: requestAnimationFrame + Pitchy.findPitch()
```typescript
const detectPitch = () => {
  const [frequency, clarity] = pitchDetectorRef.current!.findPitch(floatDataArray, 44100);
  requestAnimationFrame(detectPitch);
};
```
**変更範囲**: 検出ループ関数1つのみ
**確認**: 周波数数値リアルタイム取得
**コミット**: `Step 1-4: 基本音程検出ループ実装`

### **Step 1-5: 音名変換機能**
**実装内容**: frequency → note変換関数
```typescript
const frequencyToNote = (frequency: number): { note: string, octave: number } => {
  // A4 = 440Hz を基準とした12平均律計算
};
```
**変更範囲**: 変換関数1つ + 表示エリア
**確認**: 周波数→音名表示（ド、レ、ミ）
**コミット**: `Step 1-5: 音名変換機能実装`

### **Step 1-6: DOM直接更新システム（DDAS）**
**実装内容**: React state経由しない表示更新
```typescript
const updateFrequencyDisplay = (frequency: number) => {
  if (frequencyDisplayRef.current) {
    frequencyDisplayRef.current.textContent = `${frequency.toFixed(1)} Hz`;
  }
};
```
**変更範囲**: DOM更新関数のみ
**確認**: リアルタイム表示の滑らかな更新
**コミット**: `Step 1-6: DOM直接更新システム実装`

---

## 🔄 **Phase 2: 8音階判定システム（5 Steps）**

### **Step 2-1: 判定状態管理**
**実装内容**: 8音階進行状態の管理システム
```typescript
type TrainingPhase = 'waiting' | 'listening' | 'completed';
type ScalePosition = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7; // ドレミファソラシド
const [currentScale, setCurrentScale] = useState<ScalePosition>(0);
const [trainingPhase, setTrainingPhase] = useState<TrainingPhase>('waiting');
```
**変更範囲**: useState + 状態管理関数のみ
**確認**: 状態遷移ロジック正常動作
**コミット**: `Step 2-1: 判定状態管理システム実装`

### **Step 2-2: 音程判定ロジック**
**実装内容**: 基音からの相対音程計算（±50セント）
```typescript
const judgeNote = (detectedFreq: number, expectedNote: number): boolean => {
  const cents = 1200 * Math.log2(detectedFreq / expectedNote);
  return Math.abs(cents) <= 50; // ±50セント以内で正解
};
```
**変更範囲**: 判定関数1つのみ
**確認**: 正解・不正解判定の精度確認
**コミット**: `Step 2-2: 音程判定ロジック実装`

### **Step 2-3: 進行表示UI**
**実装内容**: 8音階の現在位置表示
```typescript
const scaleNames = ['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ', 'ド'];
// 進行状況ビジュアル表示コンポーネント
```
**変更範囲**: 進行表示コンポーネントのみ
**確認**: 視覚的進行状況の表示
**コミット**: `Step 2-3: 進行表示UI実装`

### **Step 2-4: 結果表示システム**
**実装内容**: 最終スコア・音階別結果表示
```typescript
interface TrainingResult {
  score: number;
  details: { scale: string; correct: boolean; frequency: number }[];
  timestamp: Date;
}
```
**変更範囲**: 結果表示コンポーネントのみ
**確認**: スコア計算・表示の正確性
**コミット**: `Step 2-4: 結果表示システム実装`

### **Step 2-5: もう一度ボタン**
**実装内容**: リセット機能 + 状態初期化
```typescript
const resetTraining = () => {
  setCurrentScale(0);
  setTrainingPhase('waiting');
  setResults([]);
  // AudioContext・PitchDetector は維持
};
```
**変更範囲**: リセット関数のみ
**確認**: 完全な状態リセット + 再開可能
**コミット**: `Step 2-5: もう一度ボタン実装`

---

## 🔄 **Phase 3: v3.0.0フロー対応（4 Steps）**

### **Step 3-1: マイクテスト経由パラメータ処理**
**実装内容**: URLパラメータ解析 + マイク初期化済み前提
```typescript
const searchParams = useSearchParams();
const fromMicTest = searchParams.get('from') === 'mic-test';
// マイク許可済み前提でのスキップロジック
```
**変更範囲**: useEffect + パラメータ処理のみ
**確認**: マイクテストページからの正常遷移
**コミット**: `Step 3-1: マイクテスト経由パラメータ処理実装`

### **Step 3-2: エラーハンドリング強化**
**実装内容**: 段階的復旧システム
```typescript
type ErrorType = 'permission' | 'device' | 'context' | 'detection';
interface ErrorHandler {
  type: ErrorType;
  message: string;
  recovery: () => Promise<void>;
}
```
**変更範囲**: エラーハンドリング関数のみ
**確認**: 各種エラーケースの適切な処理
**コミット**: `Step 3-2: エラーハンドリング強化実装`

### **Step 3-3: iPhone対応強化**
**実装内容**: CSS・JavaScript競合問題対策
```typescript
// CLAUDE.md記載の正しい実装パターン適用
// 完全JavaScript制御での動的スタイル更新
if (elementRef.current) {
  elementRef.current.style.width = `${value}%`;
  elementRef.current.style.backgroundColor = '#10b981';
}
```
**変更範囲**: スタイル制御方式変更のみ
**確認**: iPhone Safariでの正常動作
**コミット**: `Step 3-3: iPhone対応強化実装`

### **Step 3-4: パフォーマンス最適化**
**実装内容**: メモリリーク対策 + クリーンアップ強化
```typescript
useEffect(() => {
  return () => {
    // 多層リソース解放システム
    cancelAnimationFrame(animationFrameRef.current);
    audioContextRef.current?.close();
    pitchDetectorRef.current = null;
  };
}, []);
```
**変更範囲**: クリーンアップ関数のみ
**確認**: 長時間使用でのメモリ使用量安定
**コミット**: `Step 3-4: パフォーマンス最適化実装`

---

## 📋 **各Step完了時の必須プロセス**

### **🔄 必須実行フロー**
```
1. 機能実装完了（最小単位）
2. ビルド確認（npm run build）
3. 動作テスト（ローカル確認）
4. Git操作（add → commit → push）
5. 📋 詳細確認テンプレート提示
6. ⏸️ ユーザー確認待ち（必須）
7. ✅ 「問題ない」確認取得
8. 🔄 次Step進行確認表示
```

### **📋 Step完了時確認テンプレート**
```
## 📋 Step X-Y 実装内容の確認をお願いします

### **実装した内容**
- [具体的な実装内容]

### **変更ファイル**  
- /src/app/training/random/page.tsx ([行番号])

### **期待される効果**
- [機能追加・改善点]

### **ビルド結果**
✅ 成功 / ❌ 失敗

### **Git操作結果**
- コミット: ✅ 完了 / ❌ 失敗
- プッシュ: ✅ 完了 / ❌ 失敗

---

## ❓ Step X-Y の確認作業

**Step X-Y の実装内容をご確認ください。**

**問題がある場合**: 修正点をお教えください
**問題がない場合**: 「問題ない」または「承認」とお答えください

**ユーザーから問題ないことを確認いただいた後に、次Stepへの進行確認を表示いたします。**
```

---

## 🎯 **実装概要**

**総Step数**: 15 Steps  
**予想実装時間**: 各Step 10-15分  
**VSCodeクラッシュ対策**: 最大15分間隔での確実保存  
**使い捨てブランチ**: `random-training-v3-impl-001`

### **成功指標**
- [ ] Pitchy音程検出の正常動作（±50セント精度）
- [ ] 8音階順次判定システムの完動
- [ ] マイクテスト経由フローの正常遷移
- [ ] iPhone Safari完全対応
- [ ] VSCodeクラッシュ耐性の確保

### **技術債務回避**
- ✅ 音響特化アーキテクチャ適用
- ✅ Direct DOM Audio System実装
- ✅ 適切なエラーハンドリング
- ✅ メモリリーク対策

---

**作成者**: Claude Code Assistant  
**承認**: ユーザー承認済み（2025-07-23）  
**運用開始**: Step 1-1から段階的実装開始