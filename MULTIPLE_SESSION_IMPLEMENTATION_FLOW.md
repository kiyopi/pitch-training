# 複数セッション履歴管理 実装フロー

**作成日**: 2025-07-30  
**対象**: ランダム基音トレーニング複数セッション履歴管理実装  
**関連仕様書**: MULTIPLE_SESSION_STORAGE_SPECIFICATION.md  
**ブランチ**: random-training-tonejs-fixed-001  

## 🎯 実装概要

localStorage を使用した8セッション履歴管理システムを段階的に実装し、統合採点システムでのS-E級総合評価を実現する。

### **実装方針**
- **段階的実装**: 4つのPhaseに分けて順次実装
- **ユーザー確認**: 各Step完了時に必ずユーザー確認を取得
- **品質優先**: ビルドエラー・動作不良を避ける慎重な実装
- **既存統合**: UnifiedScoreResultFixed.svelteとの完全連携

---

## 🔧 Phase 1: 基盤実装（最優先）

### **目標**: localStorage管理の基盤構築
**推定工数**: 1-2日  
**優先度**: 🚨 最高  

#### **Step 1.1: 型定義作成**
**ファイル**: `/src/lib/types/sessionStorage.ts`

```typescript
// 作成する型定義
interface SessionResult {
  sessionId: number;              // 1-8
  baseNote: string;              // "C4", "D4", etc.
  baseName: string;              // "ド（低）", "レ（低）", etc.
  grade: SessionGrade;           // 4段階評価
  accuracy: number;              // 0-100
  averageError: number;          // セント誤差平均
  completedAt: string;           // ISO日時文字列
  duration: number;              // 秒
  noteResults: NoteResult[];     // 8音詳細結果
  outliers: OutlierInfo[];       // 外れ値情報
  isCompleted: boolean;          // 完了フラグ
}

interface TrainingProgress {
  mode: 'random';
  version: string;
  sessionHistory: SessionResult[];
  currentSessionId: number;       // 1-8
  isCompleted: boolean;          // 8セッション完走フラグ
  overallGrade?: OverallGrade;   // S-E級
  // ... 他必要フィールド
}
```

**確認ポイント**:
- 既存NoteResult型との互換性
- UnifiedScoreResultFixed.svelteで使用可能な構造

#### **Step 1.2: SessionStorageManager実装**
**ファイル**: `/src/lib/utils/SessionStorageManager.ts`

```typescript
class SessionStorageManager {
  private static instance: SessionStorageManager;
  
  // 基本操作
  public loadProgress(): TrainingProgress | null;
  public saveProgress(progress: TrainingProgress): boolean;
  public resetProgress(): boolean;
  
  // セッション管理
  public addSessionResult(session: SessionResult): boolean;
  public getCurrentSession(): number;
  public isCompleted(): boolean;
  
  // 統合採点用
  public generateUnifiedScoreData(): UnifiedScoreData;
}
```

**実装内容**:
- シングルトンパターン実装
- localStorage基本CRUD操作
- JSON.parse/stringify + 型安全性
- 基本的なエラーハンドリング

**確認ポイント**:
- localStorage読み書き正常動作
- データ型変換の正確性
- エラー時の適切な処理

#### **Step 1.3: Svelteストア統合**
**ファイル**: `/src/lib/stores/sessionStorage.ts`

```typescript
import { writable, derived } from 'svelte/store';

// メインストア
export const trainingProgress = writable<TrainingProgress | null>(null);
export const currentSessionId = writable<number>(1);

// 派生ストア
export const isCompleted = derived(trainingProgress, $progress => 
  $progress?.isCompleted || false
);

export const sessionHistory = derived(trainingProgress, $progress => 
  $progress?.sessionHistory || []
);

// アクション関数
export const sessionStorageActions = {
  loadProgress: () => { /* SessionStorageManager使用 */ },
  saveSessionResult: (result: SessionResult) => { /* 保存処理 */ },
  resetProgress: () => { /* リセット処理 */ }
};
```

**実装内容**:
- Svelteリアクティブストア作成
- derived storeでの自動計算
- アクション関数でのManager統合

**確認ポイント**:
- ストアの反応性動作
- derived storeの自動更新
- Manager連携の正確性

### **Phase 1 完了基準**
- [ ] 型定義完成・ビルドエラーなし
- [ ] SessionStorageManager基本動作確認
- [ ] Svelteストア反応性確認
- [ ] 既存コードとの互換性確認

---

## 📊 Phase 2: データ管理強化

### **目標**: 基音管理・データ検証・バックアップ機能
**推定工数**: 0.5-1日  
**優先度**: 🔶 高  

#### **Step 2.1: BaseNoteManager実装**
**ファイル**: `/src/lib/utils/BaseNoteManager.ts`

```typescript
class BaseNoteManager {
  private static readonly BASE_NOTE_POOL = [
    'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'
  ];
  
  public selectNextBaseNote(usedNotes: string[]): string;
  public getBaseNoteName(note: string): string;
  public validateBaseNote(note: string): boolean;
}
```

**実装内容**:
- 10種類基音プールから重複回避選択
- 基音名変換（C4 → ド（低））
- 基音妥当性検証

**確認ポイント**:
- 重複回避ロジックの正確性
- 全基音使用済み時の処理
- 基音名変換の正確性

#### **Step 2.2: データ検証・バックアップ機能**
**ファイル**: `/src/lib/utils/DataValidator.ts`, `/src/lib/utils/BackupManager.ts`

```typescript
// DataValidator.ts
class DataValidator {
  public validateProgress(data: any): boolean;
  public validateSession(session: any): boolean;
  public repairData(data: any): TrainingProgress | null;
}

// BackupManager.ts
class BackupManager {
  public createAutoBackup(progress: TrainingProgress): boolean;
  public restoreFromBackup(): TrainingProgress | null;
  public hasBackup(): boolean;
}
```

**実装内容**:
- データ構造検証ロジック
- セッションID連続性チェック
- 自動バックアップ作成・復旧
- データ破損時の自動修復

**確認ポイント**:
- 不正データの適切な検出
- バックアップ作成・復旧の動作
- データ修復機能の有効性

### **Phase 2 完了基準**
- [ ] 基音選択ロジック正常動作
- [ ] データ検証機能完成
- [ ] バックアップ・復旧機能動作確認
- [ ] 異常データ処理の確認

---

## 🎨 Phase 3: UI統合

### **目標**: メインページ統合・セッション遷移フロー
**推定工数**: 1-2日  
**優先度**: 🔶 高  

#### **Step 3.1: メインページ統合**
**ファイル**: `/src/routes/training/random/+page.svelte`

```svelte
<script>
import { trainingProgress, currentSessionId, sessionStorageActions } from '$lib/stores/sessionStorage';
import { onMount } from 'svelte';

// 初期化
onMount(() => {
  sessionStorageActions.loadProgress();
});

// セッション完了処理
function handleSessionComplete(noteResults) {
  const sessionResult = createSessionResult(noteResults);
  sessionStorageActions.saveSessionResult(sessionResult);
}
</script>

<!-- セッション進行表示 -->
{#if $trainingProgress}
  <div class="session-progress">
    セッション {$currentSessionId}/8
  </div>
{/if}

<!-- 次セッション開始ボタン -->
{#if $trainingProgress && !$trainingProgress.isCompleted}
  <Button on:click={startNextSession}>
    次のセッションを開始
  </Button>
{/if}
```

**実装内容**:
- localStorage初期化処理
- セッション進行表示
- セッション完了時の保存処理
- 次セッション開始フロー

**確認ポイント**:
- 初期化時のデータ読み込み
- セッション完了時のデータ保存
- 進行表示の正確性

#### **Step 3.2: UnifiedScoreResultFixed連携**
**ファイル**: `/src/lib/components/scoring/UnifiedScoreResultFixed.svelte`

```svelte
<!-- localStorage由来データでの表示 -->
{#if $trainingProgress}
  <UnifiedScoreResultFixed 
    scoreData={generateUnifiedScoreData($trainingProgress)}
    feedbackData={$feedbackData}
  />
{/if}
```

**実装内容**:
- localStorage データの統合採点表示
- 既存コンポーネントとの完全連携
- データ変換ロジック統合

**確認ポイント**:
- 統合採点表示の正確性
- 8セッション完了時の特別表示
- データ互換性の確認

#### **Step 3.3: セッション遷移フロー**

```svelte
<!-- セッション完了→次セッション案内 -->
<div class="session-transition">
  {#if justCompleted && !$isCompleted}
    <div class="next-session-prompt">
      <h3>セッション{$currentSessionId}完了！</h3>
      <p>次の基音: {nextBaseNote}</p>
      <Button on:click={startNextSession}>
        セッション{$currentSessionId + 1}を開始
      </Button>
    </div>
  {:else if $isCompleted}
    <div class="completion-celebration">
      <h2>🎉 8セッション完走おめでとうございます！</h2>
      <p>総合評価: {$trainingProgress.overallGrade}級</p>
    </div>
  {/if}
</div>
```

**実装内容**:
- セッション完了時の遷移案内
- 8セッション完走時の完了メッセージ
- SNS共有機能解禁
- 基音表示・次セッション開始

**確認ポイント**:
- 遷移フローのスムーズさ
- 完走時の達成感演出
- SNS共有の適切な解禁

### **Phase 3 完了基準**
- [ ] メインページでのlocalStorage連携動作
- [ ] セッション遷移フローの正常動作
- [ ] 統合採点表示の正確性
- [ ] 8セッション完走フローの確認

---

## 🛡️ Phase 4: 品質向上

### **目標**: エラーハンドリング・最適化・実機テスト
**推定工数**: 0.5-1日  
**優先度**: 🔷 中  

#### **Step 4.1: エラーハンドリング強化**

```typescript
// localStorage容量制限対応
class StorageManager {
  private checkStorageSpace(): boolean {
    try {
      const testKey = 'storage-test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  // 異常データの自動修復
  private repairCorruptedData(data: any): TrainingProgress | null;
  
  // ユーザーフレンドリーなエラー表示
  private handleStorageError(error: Error): void;
}
```

**実装内容**:
- localStorage容量制限検出・対応
- データ破損の自動検出・修復
- わかりやすいエラーメッセージ
- フォールバック機能

#### **Step 4.2: パフォーマンス最適化**

```typescript
// localStorage読み書き最適化
class OptimizedStorageManager {
  private cache: Map<string, any> = new Map();
  
  // 読み書き最適化
  private debouncedSave = debounce(this.saveToStorage, 1000);
  
  // メモリ使用量削減
  private compressData(data: TrainingProgress): string;
  private decompressData(compressed: string): TrainingProgress;
}
```

**実装内容**:
- データキャッシュ機能
- デバウンス処理での書き込み最適化
- データ圧縮（オプション）
- メモリリーク防止

#### **Step 4.3: iPhone実機テスト**

**テスト項目**:
- [ ] Safari での localStorage 動作
- [ ] 画面回転時のデータ保持
- [ ] アプリ切り替え時の状態維持
- [ ] 低メモリ環境での動作
- [ ] オフライン環境での動作

**実装内容**:
- モバイル特有の問題対応
- Safari私的ブラウジングモード対応
- レスポンシブ表示調整
- タッチ操作最適化

### **Phase 4 完了基準**
- [ ] エラーハンドリング強化完成
- [ ] パフォーマンス最適化完成
- [ ] iPhone実機での動作確認
- [ ] 全機能統合テスト完了

---

## 📋 実装チェックリスト

### **各Phase共通の確認事項**

#### **コード品質**
- [ ] TypeScript型安全性確保
- [ ] ESLintエラー 0件
- [ ] ビルドエラー 0件
- [ ] 既存機能への影響なし

#### **動作確認**
- [ ] ローカル開発環境での動作確認
- [ ] GitHub Pages デプロイ後の動作確認
- [ ] iPhone Safari での動作確認（Phase 3以降）

#### **データ整合性**
- [ ] localStorage データの正確性
- [ ] セッション間でのデータ継続性
- [ ] ブラウザ再起動時のデータ復元

#### **ユーザー体験**
- [ ] 直感的な操作フロー
- [ ] 適切なフィードバック表示
- [ ] エラー時の分かりやすい案内

---

## 🎯 成功基準

### **Phase 1 成功基準**
- localStorage基本操作が正常動作
- Svelteストアが適切に反応
- 型安全性が確保されている

### **Phase 2 成功基準**
- 基音重複回避が正しく動作
- データ検証・バックアップが機能
- 異常時の自動復旧が動作

### **Phase 3 成功基準**
- 1-8セッションの完全な遷移フロー
- 統合採点表示の正確性
- 8セッション完走時の適切な演出

### **Phase 4 成功基準**
- iPhone実機での安定動作
- エラー時の適切な処理
- 最適化されたパフォーマンス

### **全体成功基準**
- [ ] 8セッション完走による S-E級総合評価
- [ ] ブラウザ再起動後のデータ継続
- [ ] セッション間のスムーズな遷移
- [ ] 既存機能との完全な互換性
- [ ] iPhone Safari での完全動作

---

## 🚀 開始準備

### **実装開始前の確認**
1. 現在のブランチ: `random-training-tonejs-fixed-001`
2. 既存実装の動作確認
3. バックアップコミット作成
4. 作業ログ更新準備

### **最初の作業**
**Step 1.1: 型定義作成** から開始
- ファイル: `/src/lib/types/sessionStorage.ts`
- 内容: SessionResult, TrainingProgress 等の型定義
- 確認: 既存コードとの互換性

**実装準備完了。Phase 1 Step 1.1 から開始いたします。**