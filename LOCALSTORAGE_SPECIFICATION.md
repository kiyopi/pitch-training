# localStorage仕様書 - 相対音感トレーニングアプリ

## 📋 概要

### 目的
相対音感トレーニングアプリのセッション進行・評価データを永続化し、ユーザーの学習進捗を管理する。

### 設計原則
- **データ整合性**: 健康確認機能による自動修復
- **パフォーマンス**: Svelteリアクティブストアとの統合
- **安全性**: バックアップ・復旧機能
- **拡張性**: 複数モード対応設計

---

## 🗄️ データ構造仕様

### メインデータ (TrainingProgress)

**キー**: `pitch-training-random-progress-v1`

```typescript
interface TrainingProgress {
  // システム情報
  mode: 'random' | 'continuous' | 'chromatic';
  version: string;                    // データバージョン（現在: "1.0.0"）
  createdAt: string;                  // ISO8601形式
  lastUpdatedAt: string;              // ISO8601形式

  // セッション管理
  sessionHistory: SessionResult[];    // 完了セッション履歴（最大8件）
  currentSessionId: number;           // 現在のセッション番号（1-8）
  isCompleted: boolean;               // 8セッション完了判定

  // 基音管理
  availableBaseNotes: BaseNote[];     // 使用可能基音リスト
  usedBaseNotes: BaseNote[];          // 使用済み基音リスト

  // 総合評価（8セッション完了時のみ）
  overallGrade?: Grade;               // S-E級総合評価
  overallAccuracy?: number;           // 全体精度平均
  totalPlayTime?: number;             // 総プレイ時間（秒）
}
```

### セッション結果データ (SessionResult)

```typescript
interface SessionResult {
  // セッション基本情報
  sessionId: number;                  // セッション番号（1-8）
  baseNote: BaseNote;                 // 使用基音
  baseName: string;                   // 基音名（日本語）
  
  // 評価結果
  grade: SessionGrade;                // セッション評価（4段階）
  accuracy: number;                   // 精度（0-100%）
  averageError: number;               // 平均誤差（セント）
  
  // 時間情報
  completedAt: string;                // 完了時刻（ISO8601）
  duration: number;                   // プレイ時間（秒）
  
  // 詳細結果
  noteResults: NoteResult[];          // 8音の個別結果
  outliers: OutlierInfo[];            // 外れ値情報
  distribution: GradeDistribution;     // 評価分布
  isCompleted: boolean;               // 完了フラグ
}
```

### 音程結果データ (NoteResult)

```typescript
interface NoteResult {
  name: string;                       // 音程名（ド、レ、ミ...）
  cents: number | null;               // セント誤差（±値）
  targetFreq: number;                 // 目標周波数（Hz）
  detectedFreq: number;               // 検出周波数（Hz）
  diff: number;                       // 周波数差（Hz）
  accuracy: number;                   // 個別精度（0-100%）
}
```

---

## 🗂️ localStorage キー構成

### メインデータ
| キー | 用途 | データ型 |
|------|------|----------|
| `pitch-training-random-progress-v1` | ランダムモード進行状況 | TrainingProgress |
| `pitch-training-continuous-progress-v1` | 連続モード進行状況 | TrainingProgress |
| `pitch-training-chromatic-progress-v1` | 12音階モード進行状況 | TrainingProgress |

### システムデータ
| キー | 用途 | データ型 |
|------|------|----------|
| `mic-test-completed` | マイクテスト完了フラグ | 'true' \| null |

### バックアップデータ
| キー | 用途 | データ型 |
|------|------|----------|
| `pitch-training-progress-backup` | メインデータのバックアップ | BackupData |
| `pitch-training-backup-timestamp` | バックアップ作成時刻 | ISO8601 string |
| `completed-cycle-{timestamp}` | 完了サイクルの記録 | CompletedCycleData |

---

## 🔄 データライフサイクル

### 1. 初回アクセス時
```javascript
// 新規ユーザー
localStorage.getItem('pitch-training-random-progress-v1') === null
→ createNewProgress() 実行
→ 初期状態でメインデータ作成
```

### 2. セッション実行時
```javascript
// セッション開始
loadProgress() → 既存データ読み込み
currentSessionId → 次のセッション番号取得
getNextBaseNote() → 重複回避基音選択

// セッション完了
addSessionResult(sessionResult) → 履歴追加
saveProgress(updatedProgress) → データ更新
```

### 3. 8セッション完了時
```javascript
// 完了検出
sessionHistory.length >= 8 → isCompleted = true
calculateOverallGrade() → S-E級総合評価
calculateOverallAccuracy() → 全体精度計算

// 新サイクル開始
startNewCycleIfCompleted() → 完了サイクルバックアップ
createNewProgress() → 新規進行状況作成
```

### 4. リロード・ページ遷移時
```javascript
// データ読み込み
loadProgress() → 健康確認実行
performHealthCheck() → 整合性チェック
repairProgressData() → 異常データ修復（必要時）
```

---

## 🛡️ 健康確認システム

### 実行タイミング
- localStorage読み込み時（必須）
- データ検証後、バージョンチェック前

### チェック項目

#### 1. セッションID妥当性
```javascript
if (progress.currentSessionId < 1 || progress.currentSessionId > 8) {
  issues.push(`無効なセッションID: ${progress.currentSessionId}`);
}
```

#### 2. セッション履歴整合性
```javascript
if (progress.sessionHistory.length > 8) {
  issues.push(`セッション履歴過多: ${progress.sessionHistory.length}件`);
}
```

#### 3. 完了状態整合性
```javascript
if (progress.isCompleted && progress.sessionHistory.length < 8) {
  issues.push(`完了フラグ不整合: isCompleted=true but history=${progress.sessionHistory.length}`);
}
```

#### 4. 使用基音リスト確認
```javascript
if (progress.usedBaseNotes.length > progress.sessionHistory.length) {
  issues.push(`使用基音リスト不整合: used=${progress.usedBaseNotes.length}, history=${progress.sessionHistory.length}`);
}
```

#### 5. セッション履歴ID連続性
```javascript
for (let i = 0; i < progress.sessionHistory.length; i++) {
  const expectedId = i + 1;
  const actualId = progress.sessionHistory[i].sessionId;
  if (actualId !== expectedId) {
    issues.push(`セッション履歴ID不整合: 位置${i} 期待値${expectedId} 実際値${actualId}`);
  }
}
```

#### 6. リロード検出
```javascript
const isInProgress = progress.currentSessionId > 1 && !progress.isCompleted;
const lastSessionId = Math.max(...progress.sessionHistory.map(s => s.sessionId));
if (isInProgress && progress.currentSessionId !== lastSessionId + 1) {
  issues.push(`リロード検出: currentSession=${progress.currentSessionId}, lastHistory=${lastSessionId}`);
}
```

### 修復処理

#### 自動修復可能な問題
- **無効セッションID**: 履歴に基づいて適切な値に修正
- **完了フラグ不整合**: 履歴件数に基づいてフラグ修正
- **使用基音リスト不整合**: 履歴から再構築

#### 修復不可能な問題（初期化）
- **リロード検出**: 新セッション開始に誘導
- **セッション履歴過多**: データ破損として扱い
- **重篤な構造異常**: 安全な初期状態で再開

---

## 📊 評価システム統合

### S-E級総合評価

```javascript
// 8セッション完了時の総合評価計算
function calculateOverallGrade(sessionHistory: SessionResult[]): Grade {
  const gradeCount = sessionHistory.reduce((acc, session) => {
    acc[session.grade] = (acc[session.grade] || 0) + 1;
    return acc;
  }, { excellent: 0, good: 0, pass: 0, needWork: 0 });

  const excellentRatio = gradeCount.excellent / 8;
  const goodPlusRatio = (gradeCount.excellent + gradeCount.good + gradeCount.pass) / 8;

  // S-E級判定ロジック
  if (excellentRatio >= 0.5 && goodPlusRatio >= 0.875) return 'S';
  if (excellentRatio >= 0.375 && goodPlusRatio >= 0.75) return 'A';
  if (excellentRatio >= 0.25 && goodPlusRatio >= 0.625) return 'B';
  if (goodPlusRatio >= 0.5) return 'C';
  if (goodPlusRatio >= 0.25) return 'D';
  return 'E';
}
```

### 統合採点データ生成

```javascript
// UnifiedScoreResultFixed用データ変換
function generateUnifiedScoreData(): UnifiedScoreData {
  return {
    mode: 'random',
    sessionHistory: progress.sessionHistory.map(session => ({
      sessionId: session.sessionId,
      grade: session.grade,
      accuracy: session.accuracy,
      baseNote: session.baseNote,
      baseName: session.baseName,
      noteResults: session.noteResults,
      completedAt: session.completedAt
    })),
    overallGrade: progress.overallGrade,
    overallAccuracy: progress.overallAccuracy,
    isCompleted: progress.isCompleted,
    totalSessions: progress.sessionHistory.length,
    targetSessions: 8
  };
}
```

---

## 🔧 実装クラス構成

### SessionStorageManager（シングルトン）

```typescript
class SessionStorageManager {
  // 基本操作
  public loadProgress(): TrainingProgress | null
  public saveProgress(progress: TrainingProgress): boolean
  public resetProgress(): boolean

  // セッション管理
  public createNewProgress(): TrainingProgress
  public addSessionResult(sessionResult: SessionResult): boolean
  public getCurrentSessionId(): number
  public getNextBaseNote(): BaseNote
  public isCompleted(): boolean

  // 評価計算
  public calculateOverallGrade(sessionHistory: SessionResult[]): Grade
  public calculateOverallAccuracy(sessionHistory: SessionResult[]): number
  public calculateSessionGrade(noteResults: NoteResult[]): SessionGrade

  // 健康確認・修復
  private performHealthCheck(progress: TrainingProgress): HealthCheckResult
  private repairProgressData(progress: TrainingProgress, issues: string[]): TrainingProgress | null

  // バックアップ・復旧
  public restoreFromBackup(): TrainingProgress | null
  private createBackup(data: any): boolean
  public startNewCycleIfCompleted(): boolean
}
```

### Svelteストア統合（sessionStorage.ts）

```typescript
// メインストア
export const trainingProgress = writable<TrainingProgress | null>(null);
export const currentSessionId = writable<number>(1);
export const nextBaseNote = writable<BaseNote>('C4');

// 派生ストア
export const isCompleted = derived(trainingProgress, $progress => $progress?.isCompleted || false);
export const sessionHistory = derived(trainingProgress, $progress => $progress?.sessionHistory || []);
export const overallGrade = derived(trainingProgress, $progress => $progress?.overallGrade || null);

// アクション関数
export async function loadProgress(): Promise<boolean>
export async function saveSessionResult(noteResults, duration, baseNote, baseName): Promise<boolean>
export async function resetProgress(): Promise<boolean>
```

---

## 🚨 制約・注意事項

### ブラウザ制約
- **容量制限**: 約5-10MB（ブラウザ依存）
- **同期処理**: 非同期操作でラップして使用
- **プライベートモード**: 利用不可の場合あり

### データ一貫性
- **原子性**: SessionStorageManagerで一元管理
- **整合性**: 健康確認機能で自動保証
- **隔離性**: モード別キーで分離

### パフォーマンス考慮
- **遅延読み込み**: onMount時に非同期読み込み
- **バッチ更新**: セッション完了時に一括保存
- **キャッシュ活用**: Svelteストアでメモリキャッシュ

---

## 📈 使用例・フロー

### 典型的な使用フロー

```javascript
// 1. アプリ初期化時
onMount(async () => {
  await loadProgress();  // localStorage → Svelteストア
  console.log('現在セッション:', $currentSessionId);
  console.log('次の基音:', $nextBaseNote);
});

// 2. セッション実行時
async function completeSession(noteResults, duration, baseNote, baseName) {
  const success = await saveSessionResult(noteResults, duration, baseNote, baseName);
  if (success) {
    console.log('セッション保存完了');
    if ($isCompleted) {
      console.log('8セッション完了！総合評価:', $overallGrade);
    }
  }
}

// 3. 進捗確認
$: console.log('進捗:', $sessionHistory.length, '/', 8);
$: console.log('完了状態:', $isCompleted);
```

### エラーハンドリング

```javascript
// 健康確認結果の確認
import { storageError } from '$lib/stores/sessionStorage';

$: if ($storageError) {
  console.error('Storage error:', $storageError);
  // エラー表示UI等
}
```

---

## 🔄 今後の拡張予定

### 連続モード対応
```typescript
// キー拡張
'pitch-training-continuous-progress-v1' → TrainingProgress
// 設定差分: autoPlay=true, 中級基音セット
```

### 12音階モード対応
```typescript
// キー拡張  
'pitch-training-chromatic-progress-v1' → TrainingProgress
// 設定差分: sessionCount=1, 12音階, 基音選択UI
```

### 統計機能強化
```typescript
// 新規データ追加
interface ExtendedTrainingProgress extends TrainingProgress {
  personalBests: PersonalBest[];       // 個人記録
  weaknessAnalysis: WeaknessData[];    // 苦手音程分析
  improvementTrends: TrendData[];      // 上達傾向
}
```

---

*このドキュメントは localStorage の完全仕様書です。実装時は SessionStorageManager.ts と sessionStorage.ts を参照してください。*