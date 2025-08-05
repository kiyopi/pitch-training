import { c as create_ssr_component, d as compute_rest_props, f as spread, b as each, g as escape_object, h as escape_attribute_value, v as validate_component } from "./ssr.js";
import { d as derived, w as writable } from "./index.js";
const void_element_names = /^(?:area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/;
function is_void(name) {
  return void_element_names.test(name) || name.toLowerCase() === "!doctype";
}
/**
 * @license lucide-svelte v0.532.0 - ISC
 *
 * ISC License
 * 
 * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.
 * 
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 * 
 */
const defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 2,
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
};
const Icon = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, ["name", "color", "size", "strokeWidth", "absoluteStrokeWidth", "iconNode"]);
  let { name = void 0 } = $$props;
  let { color = "currentColor" } = $$props;
  let { size = 24 } = $$props;
  let { strokeWidth = 2 } = $$props;
  let { absoluteStrokeWidth = false } = $$props;
  let { iconNode = [] } = $$props;
  const mergeClasses = (...classes) => classes.filter((className, index, array) => {
    return Boolean(className) && array.indexOf(className) === index;
  }).join(" ");
  if ($$props.name === void 0 && $$bindings.name && name !== void 0) $$bindings.name(name);
  if ($$props.color === void 0 && $$bindings.color && color !== void 0) $$bindings.color(color);
  if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
  if ($$props.strokeWidth === void 0 && $$bindings.strokeWidth && strokeWidth !== void 0) $$bindings.strokeWidth(strokeWidth);
  if ($$props.absoluteStrokeWidth === void 0 && $$bindings.absoluteStrokeWidth && absoluteStrokeWidth !== void 0) $$bindings.absoluteStrokeWidth(absoluteStrokeWidth);
  if ($$props.iconNode === void 0 && $$bindings.iconNode && iconNode !== void 0) $$bindings.iconNode(iconNode);
  return `<svg${spread(
    [
      escape_object(defaultAttributes),
      escape_object($$restProps),
      { width: escape_attribute_value(size) },
      { height: escape_attribute_value(size) },
      { stroke: escape_attribute_value(color) },
      {
        "stroke-width": escape_attribute_value(absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth)
      },
      {
        class: escape_attribute_value(mergeClasses("lucide-icon", "lucide", name ? `lucide-${name}` : "", $$props.class))
      }
    ],
    {}
  )}>${each(iconNode, ([tag, attrs]) => {
    return `${((tag$1) => {
      return tag$1 ? `<${tag}${spread([escape_object(attrs)], {})}>${is_void(tag$1) ? "" : ``}${is_void(tag$1) ? "" : `</${tag$1}>`}` : "";
    })(tag)}`;
  })}${slots.default ? slots.default({}) : ``}</svg>`;
});
const Music = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    ["path", { "d": "M9 18V5l12-2v13" }],
    ["circle", { "cx": "6", "cy": "18", "r": "3" }],
    ["circle", { "cx": "18", "cy": "16", "r": "3" }]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "music" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
class EvaluationEngine {
  /**
   * 評価基準定義（統一基準）
   */
  static CRITERIA = {
    note: {
      excellent: 30,
      // ±30¢以内（実用的精度）
      good: 60,
      // ±60¢以内（半音の半分）
      pass: 120
      // ±120¢以内（1セミトーン強）
    },
    session: {
      excellentThreshold: { avgError: 40, excellentCount: 5 },
      // 平均±40¢、優秀5個以上
      goodThreshold: { avgError: 60, passCount: 6 },
      // 平均±60¢、合格6個以上
      passThreshold: { passCount: 4 }
      // 8音中50%が合格以上
    },
    overall: {
      stabilityFirst: true
      // 安定性重視（要練習による大幅減点）
    }
  };
  /**
   * 音程評価を計算（個別の音程）
   * @param cents セント差（±の誤差）
   * @returns 音程グレード
   */
  static evaluateNote(cents) {
    if (cents === null || cents === void 0 || isNaN(cents)) {
      return "notMeasured";
    }
    const absCents = Math.abs(cents);
    if (absCents <= this.CRITERIA.note.excellent) return "excellent";
    if (absCents <= this.CRITERIA.note.good) return "good";
    if (absCents <= this.CRITERIA.note.pass) return "pass";
    return "needWork";
  }
  /**
   * セッション評価を計算（8音の結果から4段階評価）
   * @param noteResults 8音の評価結果
   * @returns セッショングレード
   */
  static evaluateSession(noteResults) {
    if (!noteResults || noteResults.length === 0) return "needWork";
    const gradeCount = noteResults.reduce((acc, note) => {
      const grade = this.evaluateNote(note.cents);
      acc[grade] = (acc[grade] || 0) + 1;
      if (grade !== "notMeasured") {
        acc.totalError += Math.abs(note.cents || 0);
        acc.measuredCount += 1;
      }
      return acc;
    }, {
      excellent: 0,
      good: 0,
      pass: 0,
      needWork: 0,
      notMeasured: 0,
      totalError: 0,
      measuredCount: 0
    });
    const averageError = gradeCount.measuredCount > 0 ? gradeCount.totalError / gradeCount.measuredCount : 100;
    const passCount = gradeCount.excellent + gradeCount.good + gradeCount.pass;
    if (gradeCount.notMeasured > 3 || gradeCount.measuredCount === 0) {
      return "needWork";
    }
    const { excellentThreshold, goodThreshold, passThreshold } = this.CRITERIA.session;
    if (averageError <= excellentThreshold.avgError && gradeCount.excellent >= excellentThreshold.excellentCount) {
      return "excellent";
    }
    if (averageError <= goodThreshold.avgError && passCount >= goodThreshold.passCount) {
      return "good";
    }
    if (passCount >= passThreshold.passCount) {
      return "pass";
    }
    if (gradeCount.needWork >= 6) {
      return "needWork";
    }
    return "needWork";
  }
  /**
   * 統合評価を計算（8セッション完走時の安定性重視評価）
   * @param sessionHistory セッション履歴
   * @returns 統合グレード（S-E級）
   */
  static evaluateOverall(sessionHistory2) {
    if (!sessionHistory2 || sessionHistory2.length === 0) return "E";
    const total = sessionHistory2.length;
    const excellent = sessionHistory2.filter((s) => s.grade === "excellent").length;
    const good = sessionHistory2.filter((s) => s.grade === "good").length;
    const pass = sessionHistory2.filter((s) => s.grade === "pass").length;
    const fail = sessionHistory2.filter((s) => s.grade === "needWork").length;
    const excellentRate = excellent / total;
    const goodOrBetterRate = (excellent + good) / total;
    const successRate = (excellent + good + pass) / total;
    if (this.CRITERIA.overall.stabilityFirst && fail > 0) {
      if (successRate >= 0.875 && goodOrBetterRate >= 0.75) return "C";
      if (successRate >= 0.75) return "D";
      return "E";
    }
    if (excellentRate >= 0.5) return "S";
    if (excellentRate >= 0.25) return "A";
    if (goodOrBetterRate >= 0.875) return "A";
    if (goodOrBetterRate >= 0.75) return "B";
    if (goodOrBetterRate >= 0.5) return "B";
    return "C";
  }
  /**
   * セッションの分布データを計算
   * @param noteResults 音程結果配列
   * @returns 分布データ
   */
  static calculateDistribution(noteResults) {
    const distribution = { excellent: 0, good: 0, pass: 0, needWork: 0, notMeasured: 0 };
    noteResults.forEach((note) => {
      const grade = this.evaluateNote(note.cents);
      distribution[grade]++;
    });
    return distribution;
  }
  /**
   * 精度計算
   * @param noteResults 音程結果配列
   * @returns 精度パーセンテージ
   */
  static calculateAccuracy(noteResults) {
    if (!noteResults || noteResults.length === 0) return 0;
    const passCount = noteResults.filter((note) => {
      const grade = this.evaluateNote(note.cents);
      return ["excellent", "good", "pass"].includes(grade);
    }).length;
    return Math.round(passCount / noteResults.length * 100);
  }
  /**
   * 平均誤差計算
   * @param noteResults 音程結果配列
   * @returns 平均誤差（セント）
   */
  static calculateAverageError(noteResults) {
    if (!noteResults || noteResults.length === 0) return 0;
    const validResults = noteResults.filter(
      (note) => note.cents !== null && note.cents !== void 0 && !isNaN(note.cents)
    );
    if (validResults.length === 0) return 0;
    const totalError = validResults.reduce((sum, note) => sum + Math.abs(note.cents), 0);
    return Math.round(totalError / validResults.length);
  }
  /**
   * 評価基準を取得（外部参照用）
   * @returns 評価基準オブジェクト
   */
  static getCriteria() {
    return { ...this.CRITERIA };
  }
}
const STORAGE_KEYS = {
  TRAINING_PROGRESS: "pitch-training-random-progress-v1",
  SETTINGS: "pitch-training-settings-v1",
  TEMP_SESSION: "pitch-training-temp-session-v1"
};
const BACKUP_KEYS = {
  LAST_BACKUP: "pitch-training-backup-timestamp",
  PROGRESS_BACKUP: "pitch-training-progress-backup"
};
const BASE_NOTE_POOL = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5"];
const BASE_NOTE_NAMES = {
  "C4": "ド（低）",
  "D4": "レ（低）",
  "E4": "ミ（低）",
  "F4": "ファ（低）",
  "G4": "ソ（低）",
  "A4": "ラ（中）",
  "B4": "シ（中）",
  "C5": "ド（高）",
  "D5": "レ（高）",
  "E5": "ミ（高）"
};
const DATA_VERSION = "1.0.0";
const EVALUATION_THRESHOLDS = {
  // S-E級総合評価基準（比率）
  S_GRADE: { excellentRatio: 0.9, goodPlusRatio: 0.95 },
  A_GRADE: { excellentRatio: 0.7, goodPlusRatio: 0.85 },
  B_GRADE: { excellentRatio: 0.5, goodPlusRatio: 0.75 },
  C_GRADE: { goodPlusRatio: 0.65 },
  D_GRADE: { goodPlusRatio: 0.5 }
};
function isSessionResult(obj) {
  return typeof obj === "object" && typeof obj.sessionId === "number" && typeof obj.baseNote === "string" && typeof obj.grade === "string" && typeof obj.accuracy === "number" && Array.isArray(obj.noteResults) && typeof obj.isCompleted === "boolean";
}
function isTrainingProgress(obj) {
  return typeof obj === "object" && obj.mode === "random" && typeof obj.version === "string" && Array.isArray(obj.sessionHistory) && typeof obj.currentSessionId === "number" && typeof obj.isCompleted === "boolean";
}
class SessionStorageManager {
  static instance;
  progress = null;
  // シングルトンパターン
  static getInstance() {
    if (!SessionStorageManager.instance) {
      SessionStorageManager.instance = new SessionStorageManager();
    }
    return SessionStorageManager.instance;
  }
  constructor() {
  }
  // =============================================================================
  // 基本操作 (CRUD)
  // =============================================================================
  /**
   * 進行状況をlocalStorageから読み込み
   */
  loadProgress() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TRAINING_PROGRESS);
      if (!stored) {
        this.progress = null;
        return null;
      }
      const parsed = JSON.parse(stored);
      if (!isTrainingProgress(parsed)) {
        console.warn("[SessionStorageManager] Invalid progress data, creating backup");
        this.createBackup(parsed);
        this.progress = null;
        return null;
      }
      const healthCheckResult = this.performHealthCheck(parsed);
      if (!healthCheckResult.isHealthy) {
        console.warn("[SessionStorageManager] Data health check failed:", healthCheckResult.issues);
        this.createBackup(parsed);
        if (healthCheckResult.canRepair) {
          const repairedData = this.repairProgressData(parsed, healthCheckResult.issues);
          if (repairedData) {
            console.info("[SessionStorageManager] Data repaired successfully");
            this.saveProgress(repairedData);
            this.progress = repairedData;
            return repairedData;
          }
        }
        console.warn("[SessionStorageManager] Data irreparable, creating new progress");
        this.progress = null;
        return null;
      }
      if (parsed.version !== DATA_VERSION) {
        console.info("[SessionStorageManager] Data version mismatch, attempting migration");
        const migrated = this.migrateDataVersion(parsed);
        if (migrated) {
          this.saveProgress(migrated);
          this.progress = migrated;
          return migrated;
        }
        this.progress = null;
        return null;
      }
      this.progress = parsed;
      return this.progress;
    } catch (error) {
      console.error("[SessionStorageManager] Error loading progress:", error);
      this.progress = null;
      return null;
    }
  }
  /**
   * 進行状況をlocalStorageに保存
   */
  saveProgress(progress) {
    try {
      if (!isTrainingProgress(progress)) {
        console.error("[SessionStorageManager] Invalid progress data for save");
        return false;
      }
      progress.lastUpdatedAt = (/* @__PURE__ */ new Date()).toISOString();
      if (this.progress) {
        this.createBackup(this.progress);
      }
      localStorage.setItem(STORAGE_KEYS.TRAINING_PROGRESS, JSON.stringify(progress));
      this.progress = progress;
      console.info("[SessionStorageManager] Progress saved successfully");
      return true;
    } catch (error) {
      console.error("[SessionStorageManager] Error saving progress:", error);
      if (error.name === "QuotaExceededError") {
        this.clearBackups();
        try {
          localStorage.setItem(STORAGE_KEYS.TRAINING_PROGRESS, JSON.stringify(progress));
          this.progress = progress;
          console.info("[SessionStorageManager] Progress saved after backup cleanup");
          return true;
        } catch (retryError) {
          console.error("[SessionStorageManager] Failed to save even after cleanup:", retryError);
        }
      }
      return false;
    }
  }
  /**
   * 進行状況をリセット
   */
  resetProgress() {
    try {
      if (this.progress) {
        this.createBackup(this.progress);
      }
      localStorage.removeItem(STORAGE_KEYS.TRAINING_PROGRESS);
      this.progress = null;
      console.info("[SessionStorageManager] Progress reset successfully");
      return true;
    } catch (error) {
      console.error("[SessionStorageManager] Error resetting progress:", error);
      return false;
    }
  }
  // =============================================================================
  // セッション管理
  // =============================================================================
  /**
   * 新しい進行状況を作成（初回開始時）
   */
  createNewProgress() {
    const newProgress = {
      mode: "random",
      version: DATA_VERSION,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastUpdatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      sessionHistory: [],
      currentSessionId: 1,
      isCompleted: false,
      availableBaseNotes: [...BASE_NOTE_POOL],
      usedBaseNotes: []
    };
    this.progress = newProgress;
    this.saveProgress(newProgress);
    return newProgress;
  }
  /**
   * セッション結果を追加
   */
  addSessionResult(sessionResult) {
    try {
      let progress = this.progress || this.loadProgress();
      if (!progress) {
        progress = this.createNewProgress();
      }
      if (!isSessionResult(sessionResult)) {
        console.error("[SessionStorageManager] Invalid session result");
        return false;
      }
      if (sessionResult.sessionId !== progress.currentSessionId) {
        console.warn("[SessionStorageManager] Session ID mismatch");
        sessionResult.sessionId = progress.currentSessionId;
      }
      progress.sessionHistory.push(sessionResult);
      if (!progress.usedBaseNotes.includes(sessionResult.baseNote)) {
        progress.usedBaseNotes.push(sessionResult.baseNote);
      }
      if (progress.sessionHistory.length >= 8) {
        progress.isCompleted = true;
        progress.overallGrade = this.calculateOverallGrade(progress.sessionHistory);
        progress.overallAccuracy = this.calculateOverallAccuracy(progress.sessionHistory);
        progress.totalPlayTime = progress.sessionHistory.reduce((sum, session) => sum + session.duration, 0);
        console.info("[SessionStorageManager] 8セッション完了: isCompleted=true, currentSessionId維持");
      } else {
        progress.currentSessionId = progress.currentSessionId + 1;
        console.info(`[SessionStorageManager] 次セッションに進行: ${progress.currentSessionId}`);
      }
      return this.saveProgress(progress);
    } catch (error) {
      console.error("[SessionStorageManager] Error adding session result:", error);
      return false;
    }
  }
  /**
   * 現在のセッション番号を取得
   */
  getCurrentSessionId() {
    const progress = this.progress || this.loadProgress();
    return progress?.currentSessionId || 1;
  }
  /**
   * 次の基音を取得（重複回避）
   */
  getNextBaseNote() {
    const progress = this.progress || this.loadProgress();
    if (!progress) {
      return BASE_NOTE_POOL[Math.floor(Math.random() * BASE_NOTE_POOL.length)];
    }
    const availableNotes = BASE_NOTE_POOL.filter((note) => !progress.usedBaseNotes.includes(note));
    if (availableNotes.length === 0) {
      return BASE_NOTE_POOL[Math.floor(Math.random() * BASE_NOTE_POOL.length)];
    }
    return availableNotes[Math.floor(Math.random() * availableNotes.length)];
  }
  /**
   * 8セッション完了判定
   */
  isCompleted() {
    const progress = this.progress || this.loadProgress();
    return progress?.isCompleted || false;
  }
  // =============================================================================
  // 統合採点システム連携
  // =============================================================================
  /**
   * UnifiedScoreResultFixed用データ生成
   */
  generateUnifiedScoreData() {
    const progress = this.progress || this.loadProgress();
    if (!progress) {
      return null;
    }
    return {
      mode: "random",
      sessionHistory: progress.sessionHistory.map((session) => ({
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
  // =============================================================================
  // 評価計算ロジック
  // =============================================================================
  /**
   * S-E級総合評価を計算
   */
  calculateOverallGrade(sessionHistory2) {
    if (sessionHistory2.length < 8) return "E";
    const gradeCount = sessionHistory2.reduce((acc, session) => {
      acc[session.grade] = (acc[session.grade] || 0) + 1;
      return acc;
    }, { excellent: 0, good: 0, pass: 0, needWork: 0 });
    const totalSessions = sessionHistory2.length;
    const excellentRatio = gradeCount.excellent / totalSessions;
    const goodPlusRatio = (gradeCount.excellent + gradeCount.good + gradeCount.pass) / totalSessions;
    if (excellentRatio >= EVALUATION_THRESHOLDS.S_GRADE.excellentRatio && goodPlusRatio >= EVALUATION_THRESHOLDS.S_GRADE.goodPlusRatio) return "S";
    if (excellentRatio >= EVALUATION_THRESHOLDS.A_GRADE.excellentRatio && goodPlusRatio >= EVALUATION_THRESHOLDS.A_GRADE.goodPlusRatio) return "A";
    if (excellentRatio >= EVALUATION_THRESHOLDS.B_GRADE.excellentRatio && goodPlusRatio >= EVALUATION_THRESHOLDS.B_GRADE.goodPlusRatio) return "B";
    if (goodPlusRatio >= EVALUATION_THRESHOLDS.C_GRADE.goodPlusRatio) return "C";
    if (goodPlusRatio >= EVALUATION_THRESHOLDS.D_GRADE.goodPlusRatio) return "D";
    return "E";
  }
  /**
   * 全体精度平均を計算
   */
  calculateOverallAccuracy(sessionHistory2) {
    if (sessionHistory2.length === 0) return 0;
    const totalAccuracy = sessionHistory2.reduce((sum, session) => sum + session.accuracy, 0);
    return Math.round(totalAccuracy / sessionHistory2.length);
  }
  /**
   * セッション評価を計算（8音の結果から4段階評価）
   * 統一された評価ロジックを使用
   */
  calculateSessionGrade(noteResults) {
    return EvaluationEngine.evaluateSession(noteResults);
  }
  /**
   * 音程評価を計算
   * 統一された評価ロジックを使用
   */
  calculateNoteGrade(cents) {
    const grade = EvaluationEngine.evaluateNote(cents);
    return grade === "notMeasured" ? "notMeasured" : grade;
  }
  // =============================================================================
  // バックアップ・復旧機能
  // =============================================================================
  /**
   * 自動バックアップ作成
   */
  createBackup(data) {
    try {
      const backupData = {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        data
      };
      localStorage.setItem(BACKUP_KEYS.PROGRESS_BACKUP, JSON.stringify(backupData));
      localStorage.setItem(BACKUP_KEYS.LAST_BACKUP, backupData.timestamp);
      return true;
    } catch (error) {
      console.warn("[SessionStorageManager] Backup creation failed:", error);
      return false;
    }
  }
  /**
   * バックアップから復旧
   */
  restoreFromBackup() {
    try {
      const backupStr = localStorage.getItem(BACKUP_KEYS.PROGRESS_BACKUP);
      if (!backupStr) return null;
      const backup = JSON.parse(backupStr);
      if (isTrainingProgress(backup.data)) {
        console.info("[SessionStorageManager] Restored from backup:", backup.timestamp);
        return backup.data;
      }
      return null;
    } catch (error) {
      console.error("[SessionStorageManager] Restore failed:", error);
      return null;
    }
  }
  /**
   * バックアップクリア
   */
  clearBackups() {
    try {
      localStorage.removeItem(BACKUP_KEYS.PROGRESS_BACKUP);
      localStorage.removeItem(BACKUP_KEYS.LAST_BACKUP);
    } catch (error) {
      console.warn("[SessionStorageManager] Backup cleanup failed:", error);
    }
  }
  // =============================================================================
  // データ互換性・マイグレーション
  // =============================================================================
  /**
   * データバージョンマイグレーション
   */
  migrateDataVersion(oldData) {
    try {
      if (!oldData.version || oldData.version === "1.0.0") {
        return {
          ...oldData,
          version: DATA_VERSION,
          // 不足フィールドの補完
          availableBaseNotes: oldData.availableBaseNotes || [...BASE_NOTE_POOL],
          usedBaseNotes: oldData.usedBaseNotes || [],
          lastUpdatedAt: oldData.lastUpdatedAt || (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      console.warn("[SessionStorageManager] Unknown data version:", oldData.version);
      return null;
    } catch (error) {
      console.error("[SessionStorageManager] Migration failed:", error);
      return null;
    }
  }
  // =============================================================================
  // ユーティリティ・デバッグ
  // =============================================================================
  /**
   * 現在の進行状況を取得（デバッグ用）
   */
  getProgress() {
    return this.progress;
  }
  /**
   * localStorage使用量チェック
   */
  getStorageInfo() {
    try {
      const testKey = "storage-test";
      const testValue = "x".repeat(1024);
      localStorage.setItem(testKey, testValue);
      localStorage.removeItem(testKey);
      const used = JSON.stringify(localStorage).length;
      return { used, available: true };
    } catch (error) {
      return { used: -1, available: false };
    }
  }
  /**
   * 基音名取得
   */
  getBaseNoteName(baseNote) {
    return BASE_NOTE_NAMES[baseNote] || baseNote;
  }
  /**
   * 8セッション完了後の新サイクル開始（自動リセット）
   */
  startNewCycleIfCompleted() {
    const progress = this.progress || this.loadProgress();
    if (progress && progress.isCompleted && progress.sessionHistory.length >= 8) {
      console.info("[SessionStorageManager] 8セッション完了検出: 新サイクル開始");
      const completedCycleData = this.generateUnifiedScoreData();
      if (completedCycleData) {
        this.createCompletedCycleBackup(completedCycleData);
      }
      this.createNewProgress();
      console.info("[SessionStorageManager] 新サイクル開始完了: セッション1/8から再開");
      return true;
    }
    return false;
  }
  /**
   * 完了サイクルのバックアップ作成
   */
  createCompletedCycleBackup(completedData) {
    try {
      const backupKey = `completed-cycle-${Date.now()}`;
      const backupData = {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        cycleData: completedData
      };
      localStorage.setItem(backupKey, JSON.stringify(backupData));
      console.info("[SessionStorageManager] 完了サイクルバックアップ作成:", backupKey);
    } catch (error) {
      console.warn("[SessionStorageManager] 完了サイクルバックアップ失敗:", error);
    }
  }
  // =============================================================================
  // 健康確認・データ修復機能
  // =============================================================================
  /**
   * データ健康確認
   */
  performHealthCheck(progress) {
    const issues = [];
    let canRepair = true;
    try {
      if (progress.currentSessionId < 1 || progress.currentSessionId > 8) {
        issues.push(`無効なセッションID: ${progress.currentSessionId}`);
      }
      if (progress.sessionHistory.length > 8) {
        issues.push(`セッション履歴過多: ${progress.sessionHistory.length}件`);
      }
      if (progress.isCompleted && progress.sessionHistory.length < 8) {
        issues.push(`完了フラグ不整合: isCompleted=true but history=${progress.sessionHistory.length}`);
      }
      if (progress.usedBaseNotes && progress.usedBaseNotes.length > progress.sessionHistory.length) {
        issues.push(`使用基音リスト不整合: used=${progress.usedBaseNotes.length}, history=${progress.sessionHistory.length}`);
      }
      for (let i = 0; i < progress.sessionHistory.length; i++) {
        const expectedId = i + 1;
        const actualId = progress.sessionHistory[i].sessionId;
        if (actualId !== expectedId) {
          issues.push(`セッション履歴ID不整合: 位置${i} 期待値${expectedId} 実際値${actualId}`);
          break;
        }
      }
      const isInProgress = progress.currentSessionId > 1 && !progress.isCompleted;
      const hasHistory = progress.sessionHistory.length > 0;
      const lastSessionId = hasHistory ? Math.max(...progress.sessionHistory.map((s) => s.sessionId)) : 0;
      if (isInProgress && progress.currentSessionId !== lastSessionId + 1) {
        issues.push(`リロード検出: currentSession=${progress.currentSessionId}, lastHistory=${lastSessionId}`);
      }
      if (progress.sessionHistory.length > 8 || progress.sessionHistory.some((s) => !s.sessionId || !s.baseNote)) {
        canRepair = false;
      }
      const isHealthy = issues.length === 0;
      if (!isHealthy) {
        console.info("[SessionStorageManager] Health check issues detected:", issues);
      }
      return { isHealthy, canRepair, issues };
    } catch (error) {
      console.error("[SessionStorageManager] Health check error:", error);
      return { isHealthy: false, canRepair: false, issues: ["健康確認処理エラー"] };
    }
  }
  /**
   * データ修復処理
   */
  repairProgressData(progress, issues) {
    try {
      const repairedProgress = { ...progress };
      for (const issue of issues) {
        if (issue.includes("無効なセッションID")) {
          if (repairedProgress.sessionHistory.length === 0) {
            repairedProgress.currentSessionId = 1;
            console.info("[Repair] セッションIDを1に修正（履歴なし）");
          } else {
            const lastSession = Math.max(...repairedProgress.sessionHistory.map((s) => s.sessionId));
            repairedProgress.currentSessionId = Math.min(lastSession + 1, 8);
            console.info("[Repair] セッションIDを修正:", repairedProgress.currentSessionId);
          }
        } else if (issue.includes("完了フラグ不整合")) {
          if (repairedProgress.sessionHistory.length < 8) {
            repairedProgress.isCompleted = false;
            console.info("[Repair] 完了フラグをfalseに修正");
          }
        } else if (issue.includes("使用基音リスト不整合")) {
          repairedProgress.usedBaseNotes = [...new Set(repairedProgress.sessionHistory.map((s) => s.baseNote))];
          console.info("[Repair] 使用基音リスト再構築:", repairedProgress.usedBaseNotes.length);
        } else if (issue.includes("リロード検出")) {
          console.info("[Repair] リロード検出 - 新セッション開始に修正");
          return null;
        }
      }
      const finalCheck = this.performHealthCheck(repairedProgress);
      if (finalCheck.isHealthy) {
        console.info("[SessionStorageManager] データ修復成功");
        return repairedProgress;
      } else {
        console.warn("[SessionStorageManager] 修復後も問題残存:", finalCheck.issues);
        return null;
      }
    } catch (error) {
      console.error("[SessionStorageManager] データ修復エラー:", error);
      return null;
    }
  }
}
const trainingProgress = writable(null);
const currentSessionId = writable(1);
const nextBaseNote = writable("C4");
const nextBaseName = writable("ド（低）");
const isLoading = writable(false);
const isCompleted = derived(
  trainingProgress,
  ($progress) => $progress?.isCompleted || false
);
const sessionHistory = derived(
  trainingProgress,
  ($progress) => $progress?.sessionHistory || []
);
derived(
  trainingProgress,
  ($progress) => $progress?.overallGrade || null
);
derived(
  trainingProgress,
  ($progress) => $progress?.overallAccuracy || 0
);
derived(
  trainingProgress,
  ($progress) => $progress?.totalPlayTime || 0
);
derived(
  trainingProgress,
  ($progress) => $progress?.usedBaseNotes || []
);
const unifiedScoreData = derived(
  trainingProgress,
  ($progress) => {
    if (!$progress) return null;
    const manager = SessionStorageManager.getInstance();
    return manager.generateUnifiedScoreData();
  }
);
derived(
  trainingProgress,
  ($progress) => {
    if (!$progress) return 0;
    return Math.min($progress.sessionHistory.length / 8 * 100, 100);
  }
);
const remainingSessions = derived(
  trainingProgress,
  ($progress) => {
    if (!$progress) return 8;
    return Math.max(8 - $progress.sessionHistory.length, 0);
  }
);
derived(
  sessionHistory,
  ($history) => {
    if ($history.length === 0) return null;
    return $history[$history.length - 1];
  }
);
export {
  Music as M,
  nextBaseNote as a,
  isLoading as b,
  currentSessionId as c,
  isCompleted as i,
  nextBaseName as n,
  remainingSessions as r,
  sessionHistory as s,
  trainingProgress as t,
  unifiedScoreData as u
};
