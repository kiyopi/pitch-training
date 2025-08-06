// Svelteストア - localStorage統合
// SessionStorageManagerとリアクティブシステムの統合

import { writable, derived, get } from 'svelte/store';
import type { 
  TrainingProgress, 
  SessionResult, 
  UnifiedScoreData, 
  SessionGrade, 
  BaseNote,
  VoiceRangeType 
} from '../types/sessionStorage';
import type { Grade, NoteResult } from '../types/scoring';
import { SessionStorageManager } from '../utils/SessionStorageManager';
import { EvaluationEngine } from '../evaluation/EvaluationEngine';
import { isValidVoiceRange } from '../types/sessionStorage';

// =============================================================================
// メインストア
// =============================================================================

/**
 * トレーニング進行状況のメインストア
 */
export const trainingProgress = writable<TrainingProgress | null>(null);

/**
 * 現在のセッション番号ストア
 */
export const currentSessionId = writable<number>(1);

/**
 * 音域設定ストア
 */
export const voiceRange = writable<VoiceRangeType>('middle');

/**
 * 次の基音ストア
 */
export const nextBaseNote = writable<BaseNote>('C4');

/**
 * 次の基音名ストア
 */
export const nextBaseName = writable<string>('ド（低）');

/**
 * データ読み込み状態ストア
 */
export const isLoading = writable<boolean>(false);

/**
 * エラー状態ストア
 */
export const storageError = writable<string | null>(null);

// =============================================================================
// 派生ストア (Derived Stores)
// =============================================================================

/**
 * 8セッション完了判定
 */
export const isCompleted = derived(
  trainingProgress,
  $progress => $progress?.isCompleted || false
);

/**
 * セッション履歴
 */
export const sessionHistory = derived(
  trainingProgress,
  $progress => $progress?.sessionHistory || []
);

/**
 * S-E級総合評価
 */
export const overallGrade = derived(
  trainingProgress,
  $progress => $progress?.overallGrade || null
);

/**
 * 全体精度平均
 */
export const overallAccuracy = derived(
  trainingProgress,
  $progress => $progress?.overallAccuracy || 0
);

/**
 * 総プレイ時間
 */
export const totalPlayTime = derived(
  trainingProgress,
  $progress => $progress?.totalPlayTime || 0
);

/**
 * 使用済み基音リスト
 */
export const usedBaseNotes = derived(
  trainingProgress,
  $progress => $progress?.usedBaseNotes || []
);

/**
 * UnifiedScoreResultFixed用データ
 */
export const unifiedScoreData = derived(
  trainingProgress,
  $progress => {
    if (!$progress) return null;
    
    const manager = SessionStorageManager.getInstance();
    return manager.generateUnifiedScoreData();
  }
);

/**
 * セッション進捗率 (0-100)
 */
export const progressPercentage = derived(
  trainingProgress,
  $progress => {
    if (!$progress) return 0;
    return Math.min(($progress.sessionHistory.length / 8) * 100, 100);
  }
);

/**
 * 残りセッション数
 */
export const remainingSessions = derived(
  trainingProgress,
  $progress => {
    if (!$progress) return 8;
    return Math.max(8 - $progress.sessionHistory.length, 0);
  }
);

/**
 * 最新セッション結果
 */
export const latestSessionResult = derived(
  sessionHistory,
  $history => {
    if ($history.length === 0) return null;
    return $history[$history.length - 1];
  }
);

// =============================================================================
// アクション関数 (Actions)
// =============================================================================

/**
 * SessionStorageManagerのインスタンス取得
 */
function getStorageManager(): SessionStorageManager {
  return SessionStorageManager.getInstance();
}

/**
 * エラーハンドリング付きアクション実行
 */
async function executeWithErrorHandling<T>(
  action: () => T | Promise<T>,
  errorMessage: string
): Promise<T | null> {
  try {
    storageError.set(null);
    const result = await action();
    return result;
  } catch (error) {
    console.error(`[SessionStorage] ${errorMessage}:`, error);
    storageError.set(`${errorMessage}: ${error.message}`);
    return null;
  }
}

/**
 * 進行状況をlocalStorageから読み込み
 */
export async function loadProgress(): Promise<boolean> {
  return await executeWithErrorHandling(async () => {
    isLoading.set(true);
    
    const manager = getStorageManager();
    const progress = manager.loadProgress();
    
    if (progress) {
      // ストア更新
      trainingProgress.set(progress);
      currentSessionId.set(progress.currentSessionId);
      voiceRange.set(progress.voiceRange);
      
      // 次の基音を設定
      console.info(`[SessionStorage] 🎯 進行状況読み込み後の基音選択開始`);
      const nextNote = manager.getNextBaseNote();
      nextBaseNote.set(nextNote);
      nextBaseName.set(manager.getBaseNoteName(nextNote));
      
      console.info(`[SessionStorage] 🎹 読み込み時基音選択:`, {
        選択基音: nextNote,
        基音名: manager.getBaseNoteName(nextNote),
        選択理由: 'localStorage読み込み後の初期設定'
      });
      
      console.info('[SessionStorage] Progress loaded successfully:', {
        sessionCount: progress.sessionHistory.length,
        currentSession: progress.currentSessionId,
        voiceRange: progress.voiceRange,
        isCompleted: progress.isCompleted
      });
    } else {
      // 新規作成
      const currentVoiceRange = get(voiceRange);
      console.info(`[SessionStorage] 🆕 新規進行状況作成開始 - 音域: ${currentVoiceRange}`);
      
      const newProgress = manager.createNewProgress(currentVoiceRange);
      trainingProgress.set(newProgress);
      currentSessionId.set(1);
      voiceRange.set(currentVoiceRange);
      
      console.info(`[SessionStorage] 🎯 新規作成時の基音選択開始`);
      const nextNote = manager.getNextBaseNote();
      nextBaseNote.set(nextNote);
      nextBaseName.set(manager.getBaseNoteName(nextNote));
      
      console.info(`[SessionStorage] 🎹 新規作成基音選択:`, {
        選択基音: nextNote,
        基音名: manager.getBaseNoteName(nextNote),
        音域: currentVoiceRange,
        選択理由: '新規進行状況作成時の初期基音'
      });
      
      console.info('[SessionStorage] New progress created');
    }
    
    isLoading.set(false);
    return true;
  }, 'Failed to load progress') !== null;
}

/**
 * セッション結果を保存
 */
export async function saveSessionResult(
  noteResults: NoteResult[],
  duration: number,
  baseNote: BaseNote,
  baseName: string
): Promise<boolean> {
  return await executeWithErrorHandling(async () => {
    const manager = getStorageManager();
    const currentProgress = get(trainingProgress);
    
    if (!currentProgress) {
      throw new Error('No progress data available');
    }
    
    // SessionResultを生成
    const sessionResult: SessionResult = {
      sessionId: currentProgress.currentSessionId,
      baseNote,
      baseName,
      grade: manager.calculateSessionGrade(noteResults),
      accuracy: EvaluationEngine.calculateAccuracy(noteResults),
      averageError: EvaluationEngine.calculateAverageError(noteResults),
      completedAt: new Date().toISOString(),
      duration,
      noteResults,
      outliers: detectOutliers(noteResults),
      distribution: EvaluationEngine.calculateDistribution(noteResults),
      isCompleted: true
    };
    
    // SessionStorageManagerに保存
    const success = manager.addSessionResult(sessionResult);
    
    if (success) {
      // ストア更新
      const updatedProgress = manager.loadProgress();
      if (updatedProgress) {
        trainingProgress.set(updatedProgress);
        currentSessionId.set(updatedProgress.currentSessionId);
        
        // 次の基音を設定（8セッション未完了の場合）
        if (!updatedProgress.isCompleted) {
          console.info(`[SessionStorage] 🎯 基音選択実行開始 - セッション${sessionResult.sessionId}完了後`);
          console.info(`[SessionStorage] 📊 現在の状況:`, {
            完了セッション数: updatedProgress.sessionHistory.length,
            次セッション: updatedProgress.currentSessionId,
            完了状態: updatedProgress.isCompleted,
            使用済み基音数: updatedProgress.usedBaseNotes.length,
            現在音域: updatedProgress.voiceRange
          });
          
          const nextNote = manager.getNextBaseNote();
          nextBaseNote.set(nextNote);
          nextBaseName.set(manager.getBaseNoteName(nextNote));
          
          console.info(`[SessionStorage] 🎹 基音選択完了:`, {
            選択基音: nextNote,
            基音名: manager.getBaseNoteName(nextNote),
            次セッション予定: updatedProgress.currentSessionId,
            選択実行時刻: new Date().toISOString()
          });
          console.info(`[SessionStorage] 🔄 基音選択サマリー: ${sessionResult.baseNote}(Session${sessionResult.sessionId}) → ${nextNote}(Session${updatedProgress.currentSessionId})`);
        } else {
          console.info(`[SessionStorage] ✅ 8セッション完了 - 基音選択スキップ (isCompleted=${updatedProgress.isCompleted})`);
        }
        
        console.info('[SessionStorage] Session result saved:', {
          sessionId: sessionResult.sessionId,
          grade: sessionResult.grade,
          accuracy: sessionResult.accuracy,
          isCompleted: updatedProgress.isCompleted
        });
      }
    }
    
    return success;
  }, 'Failed to save session result') !== null;
}

/**
 * 進行状況をリセット
 */
export async function resetProgress(): Promise<boolean> {
  return await executeWithErrorHandling(async () => {
    const manager = getStorageManager();
    const success = manager.resetProgress();
    
    if (success) {
      // ストア初期化
      trainingProgress.set(null);
      currentSessionId.set(1);
      nextBaseNote.set('C4');
      nextBaseName.set('ド（低）');
      
      console.info('[SessionStorage] Progress reset successfully');
    }
    
    return success;
  }, 'Failed to reset progress') !== null;
}

/**
 * 新しい進行状況を作成
 */
export async function createNewProgress(selectedVoiceRange?: VoiceRangeType): Promise<boolean> {
  return await executeWithErrorHandling(async () => {
    const manager = getStorageManager();
    const currentVoiceRange = selectedVoiceRange || get(voiceRange);
    const newProgress = manager.createNewProgress(currentVoiceRange);
    
    // ストア設定
    trainingProgress.set(newProgress);
    currentSessionId.set(1);
    voiceRange.set(currentVoiceRange);
    
    const nextNote = manager.getNextBaseNote();
    nextBaseNote.set(nextNote);
    nextBaseName.set(manager.getBaseNoteName(nextNote));
    
    console.info('[SessionStorage] New progress created');
    return true;
  }, 'Failed to create new progress') !== null;
}

/**
 * バックアップから復旧
 */
export async function restoreFromBackup(): Promise<boolean> {
  return await executeWithErrorHandling(async () => {
    const manager = getStorageManager();
    const restored = manager.restoreFromBackup();
    
    if (restored) {
      // ストア更新
      trainingProgress.set(restored);
      currentSessionId.set(restored.currentSessionId);
      
      const nextNote = manager.getNextBaseNote();
      nextBaseNote.set(nextNote);
      nextBaseName.set(manager.getBaseNoteName(nextNote));
      
      console.info('[SessionStorage] Restored from backup');
      return true;
    }
    
    return false;
  }, 'Failed to restore from backup') !== null;
}

/**
 * 8セッション完了後の新サイクル自動開始
 */
export async function startNewCycleIfCompleted(): Promise<boolean> {
  return await executeWithErrorHandling(async () => {
    const manager = getStorageManager();
    const success = manager.startNewCycleIfCompleted();
    
    if (success) {
      // ストア再初期化
      const newProgress = manager.loadProgress();
      if (newProgress) {
        trainingProgress.set(newProgress);
        currentSessionId.set(1);
        voiceRange.set(newProgress.voiceRange);
        
        const nextNote = manager.getNextBaseNote();
        nextBaseNote.set(nextNote);
        nextBaseName.set(manager.getBaseNoteName(nextNote));
        
        console.info('[SessionStorage] 新サイクル開始: 8セッション完了から自動リセット');
        return true;
      }
    }
    
    return false;
  }, 'Failed to start new cycle') !== null;
}

/**
 * 現在の基音を除外して強制的に新しい基音を取得（連続モード用）
 */
export async function forceNewBaseNoteExcludingCurrent(): Promise<boolean> {
  return await executeWithErrorHandling(async () => {
    const manager = getStorageManager();
    const currentNote = get(nextBaseNote);
    
    console.info(`[SessionStorage] 現在の基音を除外して新基音取得: 除外=${currentNote}`);
    
    // 現在の基音を除外して新しい基音を取得
    const newNote = manager.getNextBaseNoteExcluding(currentNote);
    const newName = manager.getBaseNoteName(newNote);
    
    // ストア更新
    nextBaseNote.set(newNote);
    nextBaseName.set(newName);
    
    console.info(`[SessionStorage] 新基音取得完了: ${currentNote} → ${newNote} (${newName})`);
    return true;
  }, 'Failed to force new base note') !== null;
}

/**
 * 緊急リセット：基音重複問題解決用
 */
export async function emergencyResetForDuplication(): Promise<boolean> {
  return await executeWithErrorHandling(async () => {
    const manager = getStorageManager();
    const success = manager.emergencyResetForBaseNoteDuplication();
    
    if (success) {
      // ストア完全リセット
      const newProgress = manager.loadProgress();
      if (newProgress) {
        trainingProgress.set(newProgress);
        currentSessionId.set(1);
        voiceRange.set(newProgress.voiceRange);
        
        const nextNote = manager.getNextBaseNote();
        nextBaseNote.set(nextNote);
        nextBaseName.set(manager.getBaseNoteName(nextNote));
        
        console.info('[SessionStorage] 緊急リセット完了');
      }
    }
    
    return success;
  }, 'Failed to emergency reset') !== null;
}

/**
 * 音域設定変更
 */
export async function setVoiceRange(newVoiceRange: VoiceRangeType): Promise<boolean> {
  return await executeWithErrorHandling(async () => {
    // 音域値妥当性チェック
    if (!isValidVoiceRange(newVoiceRange)) {
      throw new Error(`Invalid voice range: ${newVoiceRange}`);
    }
    
    const manager = getStorageManager();
    const success = manager.setVoiceRange(newVoiceRange);
    
    if (success) {
      // ストア更新
      voiceRange.set(newVoiceRange);
      
      // 進行状況更新
      const updatedProgress = manager.loadProgress();
      if (updatedProgress) {
        trainingProgress.set(updatedProgress);
        
        // 次の基音を新しい音域で設定
        const nextNote = manager.getNextBaseNote();
        nextBaseNote.set(nextNote);
        nextBaseName.set(manager.getBaseNoteName(nextNote));
      }
      
      console.info(`[SessionStorage] 音域変更完了: ${newVoiceRange}`);
    }
    
    return success;
  }, 'Failed to set voice range') !== null;
}

// =============================================================================
// ユーティリティ関数
// =============================================================================

/**
 * 精度計算
 */
function calculateAccuracy(noteResults: NoteResult[]): number {
  const measuredNotes = noteResults.filter(note => 
    note.cents !== null && note.cents !== undefined && !isNaN(note.cents)
  );
  
  if (measuredNotes.length === 0) return 0;
  
  const totalError = measuredNotes.reduce((sum, note) => sum + Math.abs(note.cents!), 0);
  const averageError = totalError / measuredNotes.length;
  
  // セント誤差を精度に変換（50¢で0%、0¢で100%）
  return Math.max(0, Math.min(100, 100 - (averageError / 50) * 100));
}

/**
 * 平均誤差計算
 */
function calculateAverageError(noteResults: NoteResult[]): number {
  const measuredNotes = noteResults.filter(note => 
    note.cents !== null && note.cents !== undefined && !isNaN(note.cents)
  );
  
  if (measuredNotes.length === 0) return 100;
  
  const totalError = measuredNotes.reduce((sum, note) => sum + Math.abs(note.cents!), 0);
  return Math.round(totalError / measuredNotes.length);
}

/**
 * 外れ値検出
 */
function detectOutliers(noteResults: NoteResult[]): Array<{name: string; cents: number; severity: 'attention' | 'critical'}> {
  return noteResults
    .filter(note => note.cents !== null && Math.abs(note.cents!) >= 50)
    .map(note => ({
      name: note.name,
      cents: note.cents!,
      severity: Math.abs(note.cents!) >= 100 ? 'critical' : 'attention'
    }));
}

/**
 * グレード分布計算
 */
function calculateDistribution(noteResults: NoteResult[]): {
  excellent: number;
  good: number;
  pass: number;
  needWork: number;
  notMeasured: number;
} {
  return noteResults.reduce((acc, note) => {
    if (note.cents === null || note.cents === undefined || isNaN(note.cents)) {
      acc.notMeasured++;
    } else {
      const absCents = Math.abs(note.cents);
      if (absCents <= 15) acc.excellent++;
      else if (absCents <= 25) acc.good++;
      else if (absCents <= 40) acc.pass++;
      else acc.needWork++;
    }
    return acc;
  }, { excellent: 0, good: 0, pass: 0, needWork: 0, notMeasured: 0 });
}

// =============================================================================
// デバッグ・開発用関数
// =============================================================================

/**
 * ストレージ情報取得（デバッグ用）
 */
export function getStorageInfo(): { used: number; available: boolean } {
  const manager = getStorageManager();
  return manager.getStorageInfo();
}

/**
 * 現在の進行状況取得（デバッグ用）
 */
export function getCurrentProgress(): TrainingProgress | null {
  return get(trainingProgress);
}

/**
 * テストデータ生成（開発用）
 */
export function generateTestSessionResult(
  sessionId: number,
  baseNote: BaseNote,
  grade: SessionGrade
): SessionResult {
  const noteNames = ['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ', 'ド'];
  const noteResults: NoteResult[] = noteNames.map(name => ({
    name,
    cents: Math.random() * 40 - 20, // ±20¢の範囲
    targetFreq: 261.63 * Math.pow(2, Math.random()),
    detectedFreq: 261.63 * Math.pow(2, Math.random()),
    diff: Math.random() * 10 - 5,
    accuracy: 85 + Math.random() * 15
  }));
  
  const manager = getStorageManager();
  
  return {
    sessionId,
    baseNote,
    baseName: manager.getBaseNoteName(baseNote),
    grade,
    accuracy: EvaluationEngine.calculateAccuracy(noteResults),
    averageError: EvaluationEngine.calculateAverageError(noteResults),
    completedAt: new Date().toISOString(),
    duration: 120 + Math.random() * 60,
    noteResults,
    outliers: detectOutliers(noteResults),
    distribution: EvaluationEngine.calculateDistribution(noteResults),
    isCompleted: true
  };
}

// =============================================================================
// 型エクスポート（再エクスポート）
// =============================================================================

export type {
  TrainingProgress,
  SessionResult,
  UnifiedScoreData,
  SessionGrade,
  BaseNote,
  VoiceRangeType
} from '../types/sessionStorage';

// forceNewBaseNoteExcludingCurrent は上記で既にエクスポート済み