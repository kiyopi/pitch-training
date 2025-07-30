# 複数セッション履歴管理仕様書

**作成日**: 2025-07-30  
**対象**: ランダム基音トレーニング複数セッション履歴管理  
**技術**: localStorage + Svelte リアクティブシステム  
**ブランチ**: random-training-tonejs-fixed-001  

## 🎯 概要

8セッション完走による統合採点システムの実現のため、localStorage を使用した複数セッション履歴管理システムを実装する。

### **主要目標**
1. **セッション永続化**: ブラウザ閉鎖・再開時のデータ保持
2. **進行管理**: 1-8セッションの進捗追跡
3. **統合採点**: 8セッション完了時のS-E級総合評価
4. **セッション遷移**: 次セッション自動開始システム

## 📊 データ構造設計

### **1. セッション単体データ**
```typescript
interface SessionResult {
  sessionId: number;              // 1-8 (セッション番号)
  baseNote: string;              // "C4", "D4", etc. (基音)
  baseName: string;              // "ド（低）", "レ（低）", etc. (基音名)
  grade: SessionGrade;           // 4段階評価
  accuracy: number;              // 0-100 (精度%)
  averageError: number;          // セント誤差平均
  completedAt: string;           // ISO日時文字列
  duration: number;              // 秒 (セッション時間)
  noteResults: NoteResult[];     // 8音詳細結果
  outliers: OutlierInfo[];       // 外れ値情報
  isCompleted: boolean;          // 完了フラグ
}

type SessionGrade = 'excellent' | 'good' | 'pass' | 'needWork';

interface NoteResult {
  name: string;                  // "ド", "レ", etc.
  note: string;                  // "C4", "D4", etc.
  targetFreq: number;            // 目標周波数
  detectedFreq: number;          // 検出周波数
  diff: number;                  // 周波数差
  cents: number;                 // セント誤差
  grade: SessionGrade;           // 音程評価
}

interface OutlierInfo {
  name: string;                  // 音名
  cents: number;                 // セント誤差
  severity: 'attention' | 'critical'; // ±50-100¢ | ±100¢超
}
```

### **2. 全体進行データ**
```typescript
interface TrainingProgress {
  mode: 'random';                     // モード固定
  version: string;                    // データバージョン（互換性管理）
  createdAt: string;                  // 開始日時
  lastUpdatedAt: string;              // 最終更新日時
  
  // セッション管理
  sessionHistory: SessionResult[];    // 完了セッション履歴
  currentSessionId: number;           // 現在のセッション番号（1-8）
  isCompleted: boolean;               // 8セッション完走フラグ
  
  // 統計情報
  overallGrade?: OverallGrade;        // S-E級総合評価
  overallAccuracy?: number;           // 全体精度平均
  totalPlayTime?: number;             // 総プレイ時間
  
  // 設定情報
  availableBaseNotes: string[];       // 使用可能基音リスト
  usedBaseNotes: string[];           // 使用済み基音リスト
}

type OverallGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'E';
```

### **3. localStorage キー設計**
```typescript
// メインデータキー
const STORAGE_KEYS = {
  TRAINING_PROGRESS: 'pitch-training-random-progress-v1',
  SETTINGS: 'pitch-training-settings-v1',
  TEMP_SESSION: 'pitch-training-temp-session-v1'
} as const;

// バックアップ・復旧用
const BACKUP_KEYS = {
  LAST_BACKUP: 'pitch-training-backup-timestamp',
  PROGRESS_BACKUP: 'pitch-training-progress-backup'
} as const;
```

## 🔧 実装アーキテクチャ

### **1. ストレージ管理クラス**
```typescript
class SessionStorageManager {
  private static instance: SessionStorageManager;
  private progress: TrainingProgress | null = null;
  
  // シングルトンパターン
  public static getInstance(): SessionStorageManager {
    if (!SessionStorageManager.instance) {
      SessionStorageManager.instance = new SessionStorageManager();
    }
    return SessionStorageManager.instance;
  }
  
  // 基本操作
  public loadProgress(): TrainingProgress | null;
  public saveProgress(progress: TrainingProgress): boolean;
  public resetProgress(): boolean;
  
  // セッション管理
  public addSessionResult(session: SessionResult): boolean;
  public getCurrentSession(): number;
  public getNextBaseNote(): string;
  public isCompleted(): boolean;
  
  // 統計計算
  public calculateOverallGrade(): OverallGrade;
  public calculateOverallAccuracy(): number;
  public generateUnifiedScoreData(): UnifiedScoreData;
  
  // データ検証・修復
  public validateData(data: any): boolean;
  public migrateDataVersion(oldData: any): TrainingProgress;
  public createBackup(): boolean;
  public restoreFromBackup(): boolean;
}
```

### **2. Svelte ストア統合**
```typescript
// stores/sessionStorage.ts
import { writable, derived } from 'svelte/store';
import type { TrainingProgress, SessionResult } from '$lib/types';

// メインストア
export const trainingProgress = writable<TrainingProgress | null>(null);
export const currentSessionId = writable<number>(1);

// 派生ストア
export const isCompleted = derived(
  trainingProgress,
  $progress => $progress?.isCompleted || false
);

export const overallGrade = derived(
  trainingProgress,
  $progress => $progress?.overallGrade || null
);

export const sessionHistory = derived(
  trainingProgress,
  $progress => $progress?.sessionHistory || []
);

// アクション関数
export const sessionStorageActions = {
  loadProgress: () => {
    const manager = SessionStorageManager.getInstance();
    const progress = manager.loadProgress();
    trainingProgress.set(progress);
    if (progress) {
      currentSessionId.set(progress.currentSessionId);
    }
  },
  
  saveSessionResult: (sessionResult: SessionResult) => {
    const manager = SessionStorageManager.getInstance();
    if (manager.addSessionResult(sessionResult)) {
      const updatedProgress = manager.loadProgress();
      trainingProgress.set(updatedProgress);
      currentSessionId.set(updatedProgress?.currentSessionId || 1);
      return true;
    }
    return false;
  },
  
  resetProgress: () => {
    const manager = SessionStorageManager.getInstance();
    if (manager.resetProgress()) {
      trainingProgress.set(null);
      currentSessionId.set(1);
      return true;
    }
    return false;
  }
};
```

### **3. メインページ統合**
```typescript
// +page.svelte内での使用
import { trainingProgress, currentSessionId, sessionStorageActions } from '$lib/stores/sessionStorage';
import { onMount } from 'svelte';

// 初期化
onMount(() => {
  sessionStorageActions.loadProgress();
});

// セッション完了時
function handleSessionComplete(noteResults: NoteResult[]) {
  const sessionResult = createSessionResult(noteResults);
  const success = sessionStorageActions.saveSessionResult(sessionResult);
  
  if (success) {
    // 統合採点表示
    const manager = SessionStorageManager.getInstance();
    const unifiedData = manager.generateUnifiedScoreData();
    
    // 8セッション完了チェック
    if (manager.isCompleted()) {
      showCompletionMessage();
      unlockSNSSharing();
    } else {
      showNextSessionPrompt();
    }
  }
}
```

## 🎵 基音管理システム

### **1. 基音選択ロジック**
```typescript
// 10種類の基音プール
const BASE_NOTE_POOL = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'];

class BaseNoteManager {
  // 重複回避ランダム選択
  public selectNextBaseNote(usedNotes: string[]): string {
    const availableNotes = BASE_NOTE_POOL.filter(note => !usedNotes.includes(note));
    
    // 全て使用済みの場合はリセット
    if (availableNotes.length === 0) {
      return BASE_NOTE_POOL[Math.floor(Math.random() * BASE_NOTE_POOL.length)];
    }
    
    return availableNotes[Math.floor(Math.random() * availableNotes.length)];
  }
  
  // 基音名変換
  public getBaseNoteName(note: string): string {
    const baseNoteNames = {
      'C4': 'ド（低）', 'D4': 'レ（低）', 'E4': 'ミ（低）', 'F4': 'ファ（低）', 'G4': 'ソ（低）',
      'A4': 'ラ（中）', 'B4': 'シ（中）', 'C5': 'ド（高）', 'D5': 'レ（高）', 'E5': 'ミ（高）'
    };
    return baseNoteNames[note] || note;
  }
}
```

### **2. セッション遷移フロー**
```typescript
// セッション遷移管理
class SessionTransitionManager {
  public createNextSessionData(currentProgress: TrainingProgress): {
    sessionId: number;
    baseNote: string;
    baseName: string;
    isCompleted: boolean;
  } {
    const nextSessionId = currentProgress.currentSessionId + 1;
    const isCompleted = nextSessionId > 8;
    
    if (isCompleted) {
      return {
        sessionId: 8,
        baseNote: '',
        baseName: '',
        isCompleted: true
      };
    }
    
    const baseNoteManager = new BaseNoteManager();
    const nextBaseNote = baseNoteManager.selectNextBaseNote(currentProgress.usedBaseNotes);
    
    return {
      sessionId: nextSessionId,
      baseNote: nextBaseNote,
      baseName: baseNoteManager.getBaseNoteName(nextBaseNote),
      isCompleted: false
    };
  }
}
```

## 📋 統合採点システム連携

### **1. UnifiedScoreData生成**
```typescript
class UnifiedScoreDataGenerator {
  public generateFromProgress(progress: TrainingProgress): UnifiedScoreData {
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
}
```

### **2. S-E級評価計算**
```typescript
class OverallGradeCalculator {
  public calculateGrade(sessionHistory: SessionResult[]): OverallGrade {
    if (sessionHistory.length < 8) return 'E';
    
    const gradeCount = sessionHistory.reduce((acc, session) => {
      acc[session.grade] = (acc[session.grade] || 0) + 1;
      return acc;
    }, { excellent: 0, good: 0, pass: 0, needWork: 0 });
    
    const totalSessions = sessionHistory.length;
    const excellentRatio = gradeCount.excellent / totalSessions;
    const goodPlusRatio = (gradeCount.excellent + gradeCount.good + gradeCount.pass) / totalSessions;
    
    // UnifiedScoreResultFixed.svelteと同じロジック
    if (excellentRatio >= 0.9 && goodPlusRatio >= 0.95) return 'S';
    if (excellentRatio >= 0.7 && goodPlusRatio >= 0.85) return 'A';
    if (excellentRatio >= 0.5 && goodPlusRatio >= 0.75) return 'B';
    if (goodPlusRatio >= 0.65) return 'C';
    if (goodPlusRatio >= 0.50) return 'D';
    return 'E';
  }
}
```

## 🛡️ エラーハンドリング・復旧

### **1. データ検証**
```typescript
class DataValidator {
  public validateProgress(data: any): boolean {
    // 必須フィールド検証
    if (!data.mode || !data.version || !Array.isArray(data.sessionHistory)) {
      return false;
    }
    
    // セッション数検証
    if (data.sessionHistory.length > 8) {
      return false;
    }
    
    // セッションID連続性検証
    for (let i = 0; i < data.sessionHistory.length; i++) {
      if (data.sessionHistory[i].sessionId !== i + 1) {
        return false;
      }
    }
    
    return true;
  }
  
  public validateSession(session: any): boolean {
    const requiredFields = ['sessionId', 'baseNote', 'grade', 'accuracy', 'noteResults'];
    return requiredFields.every(field => session.hasOwnProperty(field));
  }
}
```

### **2. 自動バックアップ・復旧**
```typescript
class BackupManager {
  public createAutoBackup(progress: TrainingProgress): boolean {
    try {
      const backupData = {
        timestamp: new Date().toISOString(),
        data: progress
      };
      localStorage.setItem(BACKUP_KEYS.PROGRESS_BACKUP, JSON.stringify(backupData));
      localStorage.setItem(BACKUP_KEYS.LAST_BACKUP, backupData.timestamp);
      return true;
    } catch (error) {
      console.error('Backup failed:', error);
      return false;
    }
  }
  
  public restoreFromBackup(): TrainingProgress | null {
    try {
      const backupStr = localStorage.getItem(BACKUP_KEYS.PROGRESS_BACKUP);
      if (!backupStr) return null;
      
      const backup = JSON.parse(backupStr);
      const validator = new DataValidator();
      
      if (validator.validateProgress(backup.data)) {
        return backup.data;
      }
      return null;
    } catch (error) {
      console.error('Restore failed:', error);
      return null;
    }
  }
}
```

## 🎯 UI統合ポイント

### **1. セッション開始時**
```svelte
<!-- セッション開始ボタン -->
{#if $trainingProgress && !$trainingProgress.isCompleted}
  <div class="session-start-info">
    <h3>セッション {$currentSessionId}/8</h3>
    <p>基音: {nextSessionData?.baseName} ({nextSessionData?.baseNote})</p>
    <Button on:click={startNextSession}>
      {$currentSessionId === 1 ? 'トレーニング開始' : '次のセッションを開始'}
    </Button>
  </div>
{:else if $trainingProgress?.isCompleted}
  <div class="completion-message">
    <h3>🎉 8セッション完走おめでとうございます！</h3>
    <p>総合評価: {$trainingProgress.overallGrade}級</p>
  </div>
{/if}
```

### **2. 進行表示**
```svelte
<!-- セッション進行バー -->
<div class="session-progress">
  <div class="progress-bar">
    <div class="progress-fill" style="width: {($currentSessionId - 1) / 8 * 100}%"></div>
  </div>
  <span class="progress-text">{$currentSessionId - 1}/8 セッション完了</span>
</div>
```

### **3. 履歴管理ボタン**
```svelte
<!-- 管理ボタン -->
<div class="storage-controls">
  <Button variant="secondary" on:click={exportProgress}>
    進行状況をエクスポート
  </Button>
  <Button variant="destructive" on:click={resetWithConfirmation}>
    進行状況をリセット
  </Button>
</div>
```

## 📂 ファイル構成

### **実装ファイル**
```
/src/lib/
├── stores/
│   └── sessionStorage.ts          # Svelteストア
├── utils/
│   ├── SessionStorageManager.ts   # メインストレージ管理
│   ├── BaseNoteManager.ts         # 基音管理
│   ├── DataValidator.ts           # データ検証
│   └── BackupManager.ts           # バックアップ管理
├── types/
│   └── sessionStorage.ts          # 型定義
└── components/
    └── SessionProgressBar.svelte   # 進行表示コンポーネント

/src/routes/training/random/
└── +page.svelte                   # メインページ統合
```

## 🔄 実装フェーズ

### **Phase 1: 基盤実装**
1. **型定義作成** - SessionResult, TrainingProgress
2. **SessionStorageManager実装** - 基本CRUD操作
3. **Svelteストア統合** - リアクティブシステム

### **Phase 2: データ管理**
1. **BaseNoteManager実装** - 基音選択ロジック
2. **データ検証・バックアップ** - 堅牢性確保
3. **マイグレーション機能** - バージョン互換性

### **Phase 3: UI統合**
1. **メインページ統合** - +page.svelte修正
2. **統合採点連携** - UnifiedScoreResultFixed統合
3. **セッション遷移** - 次セッション開始フロー

### **Phase 4: 品質向上**
1. **エラーハンドリング強化** - 例外処理
2. **パフォーマンス最適化** - localStorage効率化
3. **iPhone実機テスト** - モバイル動作確認

## ✅ 成功基準

### **機能要件**
- [ ] 8セッション分のデータ永続化
- [ ] ブラウザ再起動時の状態復元
- [ ] 重複なし基音選択
- [ ] 正確なS-E級評価計算
- [ ] セッション間のスムーズな遷移

### **品質要件**
- [ ] データ破損時の自動復旧
- [ ] localStorage容量制限対応
- [ ] モバイル端末での安定動作
- [ ] 10MB以下のメモリ使用量

### **ユーザビリティ要件**
- [ ] 直感的な進行状況表示
- [ ] 明確なセッション遷移案内
- [ ] 適切な完走時の達成感演出

---

**この仕様書に基づき、堅牢で使いやすい複数セッション履歴管理システムを実装します。**