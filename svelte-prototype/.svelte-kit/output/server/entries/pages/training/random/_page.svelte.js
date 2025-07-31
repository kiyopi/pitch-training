import { c as create_ssr_component, d as compute_rest_props, f as spread, b as each, g as escape_object, h as escape_attribute_value, v as validate_component, i as createEventDispatcher, e as escape, m as missing_component, a as subscribe, o as onDestroy } from "../../../../chunks/ssr.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import { p as page } from "../../../../chunks/stores.js";
import { P as PageLayout, C as Card } from "../../../../chunks/PageLayout.js";
import { B as Button } from "../../../../chunks/Button.js";
import { l as logger, a as PitchDetector_1, P as PitchDetectionDisplay } from "../../../../chunks/PitchDetectionDisplay.js";
import "tone";
import { d as derived, w as writable } from "../../../../chunks/index.js";
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
const Play = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    [
      "path",
      {
        "d": "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"
      }
    ]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "play" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Refresh_cw = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    [
      "path",
      {
        "d": "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"
      }
    ],
    ["path", { "d": "M21 3v5h-5" }],
    [
      "path",
      {
        "d": "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"
      }
    ],
    ["path", { "d": "M8 16H3v5" }]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "refresh-cw" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const css$1 = {
  code: ".action-buttons-container.svelte-16la5wh{width:100%;display:flex;justify-content:center;padding:0.5rem 1rem}.action-buttons-container.top.svelte-16la5wh{margin:0.5rem 0}.action-buttons-container.bottom.svelte-16la5wh{margin:1rem 0}.action-buttons.svelte-16la5wh{display:flex;gap:0.75rem;flex-wrap:wrap;justify-content:center;max-width:400px;width:100%}.action-btn.svelte-16la5wh{display:flex;align-items:center;gap:0.5rem;padding:0.75rem 1.25rem;border:1px solid hsl(214.3 31.8% 91.4%);border-radius:8px;background:hsl(0 0% 100%);color:hsl(222.2 84% 4.9%);font-size:0.875rem;font-weight:500;cursor:pointer;transition:all 0.2s ease;min-width:140px;justify-content:center}.action-btn.svelte-16la5wh:hover{background:hsl(210 40% 98%);border-color:hsl(214.3 31.8% 81.4%);transform:translateY(-1px);box-shadow:0 2px 4px rgba(0, 0, 0, 0.1)}.action-btn.svelte-16la5wh:active{transform:translateY(0);box-shadow:0 1px 2px rgba(0, 0, 0, 0.1)}.action-btn.same.svelte-16la5wh{border-color:hsl(142.1 76.2% 36.3%);color:hsl(142.1 84.2% 31.2%)}.action-btn.same.svelte-16la5wh:hover{background:hsl(142.1 76.2% 36.3% / 0.1);border-color:hsl(142.1 76.2% 36.3%)}.action-btn.different.svelte-16la5wh{border-color:hsl(221.2 83.2% 53.3%);color:hsl(221.2 83.2% 53.3%)}.action-btn.different.svelte-16la5wh:hover{background:hsl(221.2 83.2% 53.3% / 0.1);border-color:hsl(221.2 83.2% 53.3%)}.action-btn.restart.svelte-16la5wh{border-color:hsl(262.1 83.3% 57.8%);color:hsl(262.1 83.3% 57.8%)}.action-btn.restart.svelte-16la5wh:hover{background:hsl(262.1 83.3% 57.8% / 0.1);border-color:hsl(262.1 83.3% 57.8%)}@media(max-width: 640px){.action-buttons.svelte-16la5wh{flex-direction:column;align-items:center;gap:0.5rem}.action-btn.svelte-16la5wh{min-width:200px;width:100%;max-width:280px}.action-buttons-container.svelte-16la5wh{padding:0.5rem}.action-buttons-container.top.svelte-16la5wh{margin:0.25rem 0}}",
  map: `{"version":3,"file":"ActionButtons.svelte","sources":["ActionButtons.svelte"],"sourcesContent":["<script>\\n  import { createEventDispatcher } from 'svelte';\\n  import { RefreshCw, Play } from 'lucide-svelte';\\n  \\n  const dispatch = createEventDispatcher();\\n  \\n  // Props\\n  export let isCompleted = false; // 8セッション完了判定\\n  export let position = 'bottom'; // 'top' または 'bottom'\\n  export let className = '';\\n  \\n  // ボタン設定\\n  $: buttonConfig = isCompleted \\n    ? [{ type: 'restart', label: '初めから挑戦', icon: RefreshCw }]\\n    : [\\n        { type: 'same', label: '同じ基音で再挑戦', icon: RefreshCw },\\n        { type: 'different', label: '違う基音で開始', icon: Play }\\n      ];\\n  \\n  // イベント処理\\n  function handleButtonClick(type) {\\n    dispatch('action', { type });\\n  }\\n<\/script>\\n\\n<div class=\\"action-buttons-container {position} {className}\\">\\n  <div class=\\"action-buttons\\">\\n    {#each buttonConfig as button}\\n      <button\\n        class=\\"action-btn {button.type}\\"\\n        on:click={() => handleButtonClick(button.type)}\\n      >\\n        <svelte:component this={button.icon} size=\\"16\\" />\\n        <span>{button.label}</span>\\n      </button>\\n    {/each}\\n  </div>\\n</div>\\n\\n<style>\\n  .action-buttons-container {\\n    width: 100%;\\n    display: flex;\\n    justify-content: center;\\n    padding: 0.5rem 1rem;\\n  }\\n  \\n  /* 位置別マージン調整 */\\n  .action-buttons-container.top {\\n    margin: 0.5rem 0;\\n  }\\n  \\n  .action-buttons-container.bottom {\\n    margin: 1rem 0;\\n  }\\n  \\n  .action-buttons {\\n    display: flex;\\n    gap: 0.75rem;\\n    flex-wrap: wrap;\\n    justify-content: center;\\n    max-width: 400px;\\n    width: 100%;\\n  }\\n  \\n  .action-btn {\\n    display: flex;\\n    align-items: center;\\n    gap: 0.5rem;\\n    padding: 0.75rem 1.25rem;\\n    border: 1px solid hsl(214.3 31.8% 91.4%);\\n    border-radius: 8px;\\n    background: hsl(0 0% 100%);\\n    color: hsl(222.2 84% 4.9%);\\n    font-size: 0.875rem;\\n    font-weight: 500;\\n    cursor: pointer;\\n    transition: all 0.2s ease;\\n    min-width: 140px;\\n    justify-content: center;\\n  }\\n  \\n  .action-btn:hover {\\n    background: hsl(210 40% 98%);\\n    border-color: hsl(214.3 31.8% 81.4%);\\n    transform: translateY(-1px);\\n    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);\\n  }\\n  \\n  .action-btn:active {\\n    transform: translateY(0);\\n    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);\\n  }\\n  \\n  /* ボタンタイプ別スタイル */\\n  .action-btn.same {\\n    border-color: hsl(142.1 76.2% 36.3%);\\n    color: hsl(142.1 84.2% 31.2%);\\n  }\\n  \\n  .action-btn.same:hover {\\n    background: hsl(142.1 76.2% 36.3% / 0.1);\\n    border-color: hsl(142.1 76.2% 36.3%);\\n  }\\n  \\n  .action-btn.different {\\n    border-color: hsl(221.2 83.2% 53.3%);\\n    color: hsl(221.2 83.2% 53.3%);\\n  }\\n  \\n  .action-btn.different:hover {\\n    background: hsl(221.2 83.2% 53.3% / 0.1);\\n    border-color: hsl(221.2 83.2% 53.3%);\\n  }\\n  \\n  .action-btn.restart {\\n    border-color: hsl(262.1 83.3% 57.8%);\\n    color: hsl(262.1 83.3% 57.8%);\\n  }\\n  \\n  .action-btn.restart:hover {\\n    background: hsl(262.1 83.3% 57.8% / 0.1);\\n    border-color: hsl(262.1 83.3% 57.8%);\\n  }\\n  \\n  /* レスポンシブ対応 */\\n  @media (max-width: 640px) {\\n    .action-buttons {\\n      flex-direction: column;\\n      align-items: center;\\n      gap: 0.5rem;\\n    }\\n    \\n    .action-btn {\\n      min-width: 200px;\\n      width: 100%;\\n      max-width: 280px;\\n    }\\n    \\n    .action-buttons-container {\\n      padding: 0.5rem;\\n    }\\n    \\n    .action-buttons-container.top {\\n      margin: 0.25rem 0;\\n    }\\n  }\\n</style>"],"names":[],"mappings":"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"}`
};
const ActionButtons = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let buttonConfig;
  createEventDispatcher();
  let { isCompleted: isCompleted2 = false } = $$props;
  let { position = "bottom" } = $$props;
  let { className = "" } = $$props;
  if ($$props.isCompleted === void 0 && $$bindings.isCompleted && isCompleted2 !== void 0) $$bindings.isCompleted(isCompleted2);
  if ($$props.position === void 0 && $$bindings.position && position !== void 0) $$bindings.position(position);
  if ($$props.className === void 0 && $$bindings.className && className !== void 0) $$bindings.className(className);
  $$result.css.add(css$1);
  buttonConfig = isCompleted2 ? [
    {
      type: "restart",
      label: "初めから挑戦",
      icon: Refresh_cw
    }
  ] : [
    {
      type: "same",
      label: "同じ基音で再挑戦",
      icon: Refresh_cw
    },
    {
      type: "different",
      label: "違う基音で開始",
      icon: Play
    }
  ];
  return `<div class="${"action-buttons-container " + escape(position, true) + " " + escape(className, true) + " svelte-16la5wh"}"><div class="action-buttons svelte-16la5wh">${each(buttonConfig, (button) => {
    return `<button class="${"action-btn " + escape(button.type, true) + " svelte-16la5wh"}">${validate_component(button.icon || missing_component, "svelte:component").$$render($$result, { size: "16" }, {}, {})} <span>${escape(button.label)}</span> </button>`;
  })}</div> </div>`;
});
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
  // 個別セッション評価基準（セント誤差）
  EXCELLENT: 15,
  GOOD: 25,
  PASS: 40,
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
   */
  calculateSessionGrade(noteResults) {
    const results = noteResults.reduce((acc, note) => {
      const grade = this.calculateNoteGrade(note.cents);
      acc[grade] = (acc[grade] || 0) + 1;
      if (grade !== "notMeasured") {
        acc.totalError += Math.abs(note.cents || 0);
        acc.measuredCount += 1;
      }
      return acc;
    }, { excellent: 0, good: 0, pass: 0, needWork: 0, notMeasured: 0, totalError: 0, measuredCount: 0 });
    const averageError = results.measuredCount > 0 ? results.totalError / results.measuredCount : 100;
    const passCount = results.excellent + results.good + results.pass;
    if (results.notMeasured > 3) return "needWork";
    if (results.needWork > 2) return "needWork";
    if (results.measuredCount === 0) return "needWork";
    if (averageError <= 20 && results.excellent >= 6) return "excellent";
    if (averageError <= 30 && passCount >= 7) return "good";
    if (passCount >= 5) return "pass";
    return "needWork";
  }
  /**
   * 音程評価を計算
   */
  calculateNoteGrade(cents) {
    if (cents === null || cents === void 0 || isNaN(cents)) {
      return "notMeasured";
    }
    const absCents = Math.abs(cents);
    if (absCents <= EVALUATION_THRESHOLDS.EXCELLENT) return "excellent";
    if (absCents <= EVALUATION_THRESHOLDS.GOOD) return "good";
    if (absCents <= EVALUATION_THRESHOLDS.PASS) return "pass";
    return "needWork";
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
const css = {
  code: ".header-section.svelte-z4r706.svelte-z4r706{text-align:center;margin-bottom:2rem}.page-title.svelte-z4r706.svelte-z4r706{font-size:2rem;font-weight:700;color:hsl(222.2 84% 4.9%);margin-bottom:0.5rem}.page-description.svelte-z4r706.svelte-z4r706{color:hsl(215.4 16.3% 46.9%);font-size:1rem;margin:0}.main-card{border:1px solid hsl(214.3 31.8% 91.4%) !important;background:hsl(0 0% 100%) !important;border-radius:8px !important;box-shadow:0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06) !important;margin-bottom:1.5rem}.status-card{border-radius:8px !important;margin-bottom:1.5rem}.error-card{border:1px solid hsl(0 84.2% 60.2%) !important;background:hsl(0 84.2% 97%) !important;border-radius:8px !important;box-shadow:0 1px 3px 0 rgb(0 0 0 / 0.1) !important}.results-card{border:1px solid hsl(142.1 76.2% 36.3%) !important;background:linear-gradient(135deg, hsl(142.1 76.2% 95%) 0%, hsl(0 0% 100%) 100%) !important}.card-header.svelte-z4r706.svelte-z4r706{padding-bottom:1rem;border-bottom:1px solid hsl(214.3 31.8% 91.4%);margin-bottom:1.5rem}.section-title.svelte-z4r706.svelte-z4r706{font-size:1.125rem;font-weight:600;color:hsl(222.2 84% 4.9%);margin:0}.card-content.svelte-z4r706.svelte-z4r706{display:flex;flex-direction:column;gap:1rem}.status-content.svelte-z4r706.svelte-z4r706{display:flex;justify-content:space-between;align-items:center;gap:1rem}.status-message.svelte-z4r706.svelte-z4r706{font-weight:500;color:hsl(222.2 84% 4.9%)}.progress-indicator.svelte-z4r706.svelte-z4r706{font-size:0.875rem;color:hsl(215.4 16.3% 46.9%)}.side-by-side-container.svelte-z4r706.svelte-z4r706{display:flex;gap:1.5rem;margin-bottom:1.5rem}.half-width{flex:1}@media(max-width: 768px){.side-by-side-container.svelte-z4r706.svelte-z4r706{flex-direction:column}.half-width{width:100%}}.debug-info.svelte-z4r706.svelte-z4r706{position:absolute;top:1rem;right:1rem;background:hsl(220 13% 91%);color:hsl(220 13% 46%);padding:0.25rem 0.5rem;border-radius:4px;font-size:0.75rem;font-family:'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', monospace;z-index:100}.base-note-info.svelte-z4r706.svelte-z4r706{text-align:center;padding:1rem;background:hsl(210 40% 98%);border-radius:6px;border:1px solid hsl(214.3 31.8% 91.4%);font-size:0.875rem;color:hsl(215.4 16.3% 46.9%)}.relative-pitch-info.svelte-z4r706.svelte-z4r706{text-align:center;padding:1rem;background:hsl(210 40% 98%);border-radius:6px;border:1px solid hsl(214.3 31.8% 91.4%);margin-top:1rem}.frequency-display-large.svelte-z4r706.svelte-z4r706{display:flex;flex-direction:column;align-items:center;gap:0.25rem}.large-hz.svelte-z4r706.svelte-z4r706{font-size:2rem;font-weight:700;color:hsl(222.2 84% 4.9%);line-height:1}.note-with-cents.svelte-z4r706.svelte-z4r706{font-size:0.875rem;color:hsl(215.4 16.3% 46.9%);font-weight:500}.no-signal.svelte-z4r706.svelte-z4r706{font-size:2rem;font-weight:700;color:hsl(215.4 16.3% 46.9%);line-height:1}.pitch-detector-placeholder.svelte-z4r706.svelte-z4r706{text-align:center;padding:2rem;color:hsl(215.4 16.3% 46.9%);font-style:italic}.scale-guide.svelte-z4r706.svelte-z4r706{display:grid;grid-template-columns:repeat(4, 1fr);gap:0.75rem;margin-bottom:1rem}.scale-item.svelte-z4r706.svelte-z4r706{display:flex;align-items:center;justify-content:center;height:3rem;border-radius:6px;font-weight:500;font-size:0.875rem;border:1px solid hsl(215.4 16.3% 46.9%);background:hsl(0 0% 100%);color:hsl(215.4 16.3% 46.9%);transition:all 0.3s ease}.scale-item.active.svelte-z4r706.svelte-z4r706{background:hsl(343.8 79.7% 53.7%) !important;color:white !important;border:2px solid hsla(343.8 79.7% 53.7% / 0.5) !important;transform:scale(1.2);font-size:1.125rem;font-weight:700;animation:svelte-z4r706-pulse 2s infinite;box-shadow:0 0 0 2px hsla(343.8 79.7% 53.7% / 0.3) !important}.scale-item.correct.svelte-z4r706.svelte-z4r706{background:hsl(142.1 76.2% 36.3%);color:hsl(210 40% 98%);border-color:hsl(142.1 76.2% 36.3%);animation:svelte-z4r706-correctFlash 0.5s ease-out}.scale-item.incorrect.svelte-z4r706.svelte-z4r706{background:hsl(0 84.2% 60.2%);color:hsl(210 40% 98%);border-color:hsl(0 84.2% 60.2%);animation:svelte-z4r706-shake 0.5s ease-in-out}@keyframes svelte-z4r706-pulse{0%,100%{opacity:1}50%{opacity:0.7}}@keyframes svelte-z4r706-correctFlash{0%{transform:scale(1);background:hsl(47.9 95.8% 53.1%)}50%{transform:scale(1.1);background:hsl(142.1 76.2% 36.3%)}100%{transform:scale(1);background:hsl(142.1 76.2% 36.3%)}}@keyframes svelte-z4r706-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}.guide-instruction.svelte-z4r706.svelte-z4r706{text-align:center;font-size:0.875rem;color:hsl(215.4 16.3% 46.9%);padding:0.75rem;background:hsl(210 40% 98%);border-radius:6px}.guide-feedback.svelte-z4r706.svelte-z4r706{display:flex;align-items:center;justify-content:center;gap:0.5rem;margin-top:0.5rem;font-size:0.75rem}.feedback-label.svelte-z4r706.svelte-z4r706{color:hsl(215.4 16.3% 46.9%);font-weight:500}.feedback-value.svelte-z4r706.svelte-z4r706{font-weight:700;font-family:'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', monospace;padding:0.125rem 0.375rem;border-radius:4px;background:hsl(214.3 31.8% 91.4%);color:hsl(222.2 84% 4.9%);min-width:4ch;text-align:center}.feedback-value.accurate.svelte-z4r706.svelte-z4r706{background:hsl(142.1 76.2% 90%);color:hsl(142.1 76.2% 30%)}.feedback-value.close.svelte-z4r706.svelte-z4r706{background:hsl(47.9 95.8% 90%);color:hsl(47.9 95.8% 30%)}.feedback-status.svelte-z4r706.svelte-z4r706{font-weight:500;font-size:0.75rem}.feedback-status.success.svelte-z4r706.svelte-z4r706{color:hsl(142.1 76.2% 36.3%)}.feedback-status.close.svelte-z4r706.svelte-z4r706{color:hsl(47.9 95.8% 45%)}.detection-display.svelte-z4r706.svelte-z4r706{display:flex;flex-direction:column;gap:1rem}.detection-card.svelte-z4r706.svelte-z4r706{display:inline-flex;align-items:baseline;gap:0.5rem;padding:1rem 1.5rem;background:hsl(0 0% 100%);border:1px solid hsl(214.3 31.8% 91.4%);border-radius:8px;width:fit-content}.detected-frequency{font-weight:600 !important;font-size:2rem !important;color:hsl(222.2 84% 4.9%) !important;font-family:'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', \n                 'JetBrains Mono', 'Fira Code', 'Consolas', monospace !important;min-width:4ch !important;text-align:right !important;display:inline-block !important;font-variant-numeric:tabular-nums !important;-webkit-font-smoothing:antialiased !important;-moz-osx-font-smoothing:grayscale !important}.hz-suffix{font-weight:600 !important;font-size:2rem !important;color:hsl(222.2 84% 4.9%) !important}.divider{color:hsl(214.3 31.8% 70%) !important;font-size:1.5rem !important;margin:0 0.25rem !important;font-weight:300 !important}.detected-note{font-weight:600 !important;font-size:2rem !important;color:hsl(215.4 16.3% 46.9%) !important;font-family:'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', \n                 'JetBrains Mono', 'Fira Code', 'Consolas', monospace !important;min-width:3ch !important;display:inline-block !important;text-align:center !important}.volume-bar{border-radius:4px !important}.detected-info.svelte-z4r706.svelte-z4r706{display:flex;align-items:center;gap:0.5rem;font-size:0.875rem}.detected-label.svelte-z4r706.svelte-z4r706{color:hsl(215.4 16.3% 46.9%)}.detected-frequency.svelte-z4r706.svelte-z4r706{font-weight:700;font-size:1.25rem;color:hsl(222.2 84% 4.9%);margin-right:0.5rem}.detected-note.svelte-z4r706.svelte-z4r706{font-weight:500;font-size:0.875rem;color:hsl(215.4 16.3% 46.9%);margin-right:0.25rem}.pitch-diff.svelte-z4r706.svelte-z4r706{color:hsl(47.9 95.8% 40%);font-weight:500;margin-left:0.25rem}.volume-section.svelte-z4r706.svelte-z4r706{display:flex;flex-direction:column;gap:0.5rem}.volume-label.svelte-z4r706.svelte-z4r706{font-size:0.875rem;color:hsl(215.4 16.3% 46.9%)}.modern-volume-bar{border-radius:4px !important}.results-summary.svelte-z4r706.svelte-z4r706{display:grid;grid-template-columns:repeat(auto-fit, minmax(150px, 1fr));gap:1rem;margin-bottom:2rem}.result-item.svelte-z4r706.svelte-z4r706{text-align:center;padding:1rem;border-radius:6px;background:hsl(0 0% 100%);border:1px solid hsl(214.3 31.8% 91.4%)}.result-label.svelte-z4r706.svelte-z4r706{display:block;font-size:0.875rem;color:hsl(215.4 16.3% 46.9%);margin-bottom:0.25rem}.result-value.svelte-z4r706.svelte-z4r706{display:block;font-size:1.5rem;font-weight:700;color:hsl(222.2 84% 4.9%)}.result-value.success.svelte-z4r706.svelte-z4r706{color:hsl(142.1 76.2% 36.3%)}.detailed-results.svelte-z4r706.svelte-z4r706{margin-top:2rem}.detailed-title.svelte-z4r706.svelte-z4r706{font-size:1rem;font-weight:600;color:hsl(222.2 84% 4.9%);margin-bottom:1rem;text-align:center}.scale-results.svelte-z4r706.svelte-z4r706{display:flex;flex-direction:column;gap:0.5rem}.scale-result-item.svelte-z4r706.svelte-z4r706{display:grid;grid-template-columns:1fr auto auto auto;gap:1rem;padding:0.75rem;border-radius:6px;border:1px solid hsl(214.3 31.8% 91.4%);background:hsl(0 0% 100%);align-items:center}.scale-result-item.correct.svelte-z4r706.svelte-z4r706{background:hsl(142.1 76.2% 95%);border-color:hsl(142.1 76.2% 80%)}.scale-result-item.incorrect.svelte-z4r706.svelte-z4r706{background:hsl(0 84.2% 95%);border-color:hsl(0 84.2% 80%)}.scale-name.svelte-z4r706.svelte-z4r706{font-weight:600;color:hsl(222.2 84% 4.9%)}.scale-accuracy.svelte-z4r706.svelte-z4r706{font-weight:500;font-family:'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', monospace;color:hsl(215.4 16.3% 46.9%)}.scale-cents.svelte-z4r706.svelte-z4r706{font-weight:500;font-family:'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', monospace;color:hsl(215.4 16.3% 46.9%);font-size:0.875rem}.scale-status.svelte-z4r706.svelte-z4r706{text-align:center;font-size:1.125rem}.common-actions.svelte-z4r706.svelte-z4r706{display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap;margin-top:1.5rem}.primary-button{background-color:#2563eb !important;color:white !important;border:none !important;font-weight:600 !important;padding:0.75rem 1.5rem !important;border-radius:6px !important;transition:all 0.2s ease !important;min-width:140px !important}.primary-button:hover{background-color:#1d4ed8 !important;transform:translateY(-1px) !important}.secondary-button{background-color:#f8fafc !important;color:#475569 !important;border:1px solid #e2e8f0 !important;font-weight:500 !important;padding:0.75rem 1.5rem !important;border-radius:6px !important;transition:all 0.2s ease !important;min-width:120px !important}.secondary-button:hover{background-color:#f1f5f9 !important;border-color:#cbd5e1 !important;transform:translateY(-1px) !important}.error-content.svelte-z4r706.svelte-z4r706{text-align:center;padding:2rem 1rem}.error-icon.svelte-z4r706.svelte-z4r706,.loading-icon.svelte-z4r706.svelte-z4r706{font-size:3rem;margin-bottom:1rem}.error-content.svelte-z4r706 h3.svelte-z4r706{font-size:1.25rem;font-weight:600;color:hsl(222.2 84% 4.9%);margin-bottom:0.5rem}.error-content.svelte-z4r706 p.svelte-z4r706{color:hsl(215.4 16.3% 46.9%);margin-bottom:1rem}.recommendation.svelte-z4r706.svelte-z4r706{background:hsl(210 40% 98%);border:1px solid hsl(214.3 31.8% 91.4%);border-radius:6px;padding:1rem;margin:1rem 0}.recommendation.svelte-z4r706 p.svelte-z4r706{margin:0;font-size:0.875rem}@media(min-width: 768px){.scale-guide.svelte-z4r706.svelte-z4r706{grid-template-columns:repeat(8, 1fr)}.page-title.svelte-z4r706.svelte-z4r706{font-size:2.5rem}.results-summary.svelte-z4r706.svelte-z4r706{grid-template-columns:repeat(3, 1fr)}}@media(max-width: 640px){.status-content.svelte-z4r706.svelte-z4r706{flex-direction:column;gap:0.5rem}.primary-button,.secondary-button{min-width:100% !important}}.warning-card{border:2px solid #fbbf24 !important;background:#fef3c7 !important;margin-bottom:24px !important}.warning-message.svelte-z4r706.svelte-z4r706{color:#92400e;margin-bottom:12px}.error-list.svelte-z4r706.svelte-z4r706{color:#dc2626;margin:12px 0;padding-left:20px}.error-list.svelte-z4r706 li.svelte-z4r706{margin-bottom:4px;font-family:monospace;font-size:14px}.fix-instruction.svelte-z4r706.svelte-z4r706{color:#059669;margin-top:12px;padding:8px;background:#d1fae5;border-radius:4px;border-left:4px solid #059669}.scoring-tabs-container.svelte-z4r706.svelte-z4r706{display:flex;gap:0.5rem;margin-bottom:1.5rem;overflow-x:auto;border-bottom:1px solid hsl(214.3 31.8% 91.4%);padding-bottom:0.5rem}.scoring-tab.svelte-z4r706.svelte-z4r706{padding:0.75rem 1rem;border-radius:6px;border:1px solid hsl(214.3 31.8% 91.4%);background:hsl(0 0% 100%);color:hsl(215.4 16.3% 46.9%);font-size:0.875rem;font-weight:500;cursor:pointer;transition:all 0.2s ease;flex-shrink:0;white-space:nowrap}.scoring-tab.svelte-z4r706.svelte-z4r706:hover{background:hsl(210 40% 98%);border-color:hsl(217.2 32.6% 17.5%)}.scoring-tab.active.svelte-z4r706.svelte-z4r706{background:hsl(217.2 91.2% 59.8%);color:hsl(210 40% 98%);border-color:hsl(217.2 91.2% 59.8%);font-weight:600}.tab-content.svelte-z4r706.svelte-z4r706{margin-top:1rem;min-height:200px}.tab-panel.svelte-z4r706.svelte-z4r706{animation:svelte-z4r706-fadeIn 0.3s ease-in-out}@keyframes svelte-z4r706-fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@media(max-width: 768px){.scoring-tabs-container.svelte-z4r706.svelte-z4r706{flex-wrap:wrap}.scoring-tab.svelte-z4r706.svelte-z4r706{flex:1;min-width:120px}}.traditional-scoring-details.svelte-z4r706.svelte-z4r706,.detailed-random-scoring.svelte-z4r706.svelte-z4r706,.random-scoring-section.svelte-z4r706.svelte-z4r706{margin-top:2rem;padding:1rem;background:#f9fafb;border-radius:8px}.session-progress.svelte-z4r706.svelte-z4r706{background:hsl(0 0% 100%);border:1px solid hsl(214.3 31.8% 91.4%);border-radius:8px;padding:12px 16px;margin:16px 0;box-shadow:0 1px 3px 0 rgb(0 0 0 / 0.1)}.session-status.svelte-z4r706.svelte-z4r706{display:flex;justify-content:space-between;align-items:center;gap:1rem}.session-info.svelte-z4r706.svelte-z4r706{display:flex;align-items:center;gap:1rem}.completed-count.svelte-z4r706.svelte-z4r706{font-weight:700;color:hsl(222.2 84% 4.9%);font-size:1.125rem}.remaining-text.svelte-z4r706.svelte-z4r706{color:hsl(215.4 16.3% 46.9%);font-size:0.875rem}.progress-section.svelte-z4r706.svelte-z4r706{display:flex;align-items:center;gap:12px}.progress-bar.svelte-z4r706.svelte-z4r706{width:120px;height:4px;background:hsl(214.3 31.8% 91.4%);border-radius:2px;overflow:hidden;position:relative}.progress-fill.svelte-z4r706.svelte-z4r706{height:100%;background:hsl(217.2 91.2% 59.8%);transition:width 0.3s ease}.progress-text.svelte-z4r706.svelte-z4r706{font-weight:500;color:hsl(217.2 91.2% 59.8%);font-size:0.875rem;min-width:35px;text-align:right}@media(max-width: 768px){.session-status.svelte-z4r706.svelte-z4r706{flex-direction:column;gap:8px;align-items:center}.session-info.svelte-z4r706.svelte-z4r706{width:100%;justify-content:center}.progress-section.svelte-z4r706.svelte-z4r706{width:100%;justify-content:center}}",
  map: `{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script>\\n  import { onMount, onDestroy } from 'svelte';\\n  import { goto } from '$app/navigation';\\n  import { base } from '$app/paths';\\n  import { page } from '$app/stores';\\n  import { ChevronRight } from 'lucide-svelte';\\n  import Card from '$lib/components/Card.svelte';\\n  import Button from '$lib/components/Button.svelte';\\n  import VolumeBar from '$lib/components/VolumeBar.svelte';\\n  import PitchDisplay from '$lib/components/PitchDisplay.svelte';\\n  import PitchDetector from '$lib/components/PitchDetector.svelte';\\n  import PitchDetectionDisplay from '$lib/components/PitchDetectionDisplay.svelte';\\n  import PageLayout from '$lib/components/PageLayout.svelte';\\n  import * as Tone from 'tone';\\n  import { audioManager } from '$lib/audio/AudioManager.js';\\n  import { harmonicCorrection } from '$lib/audio/HarmonicCorrection.js';\\n  import { logger } from '$lib/utils/debugUtils.js';\\n  \\n  // 採点システムコンポーネント\\n  import { \\n    ScoreResultPanel,\\n    IntervalProgressTracker,\\n    ConsistencyGraph,\\n    FeedbackDisplay,\\n    SessionStatistics\\n  } from '$lib/components/scoring';\\n  import UnifiedScoreResultFixed from '$lib/components/scoring/UnifiedScoreResultFixed.svelte';\\n  import ActionButtons from '$lib/components/ActionButtons.svelte';\\n  \\n  // 採点エンジン\\n  import { EnhancedScoringEngine } from '$lib/scoring/EnhancedScoringEngine.js';\\n  \\n  // localStorage セッション管理\\n  import {\\n    trainingProgress,\\n    currentSessionId,\\n    nextBaseNote,\\n    nextBaseName,\\n    isLoading,\\n    storageError,\\n    isCompleted,\\n    sessionHistory,\\n    overallGrade,\\n    overallAccuracy,\\n    progressPercentage,\\n    remainingSessions,\\n    latestSessionResult,\\n    unifiedScoreData,\\n    loadProgress,\\n    saveSessionResult,\\n    resetProgress,\\n    createNewProgress,\\n    startNewCycleIfCompleted\\n  } from '$lib/stores/sessionStorage';\\n  \\n  // Force GitHub Actions trigger: 2025-07-29 06:30\\n  \\n  // テスト用ダミーデータ生成（正しい4段階評価システム）\\n  function generateTestUnifiedScoreData() {\\n    return {\\n      mode: 'random',\\n      timestamp: new Date(),\\n      duration: 480, // 8セッション × 60秒\\n      totalNotes: 64, // 8セッション × 8音\\n      measuredNotes: 59, // 8セッション総計\\n      averageAccuracy: 79, // 8セッション全体平均\\n      baseNote: 'C5', // 最終セッションの基音\\n      baseFrequency: 523.25,\\n      sessionHistory: [\\n        { \\n          grade: 'excellent', \\n          accuracy: 92, \\n          baseNote: 'C4',\\n          baseFrequency: 261.63,\\n          timestamp: new Date(Date.now() - 7 * 60000),\\n          measuredNotes: 8,\\n          noteResults: [\\n            { name: 'ド', note: 'ド', frequency: 262, detectedFrequency: 264, cents: 13, grade: 'excellent' },\\n            { name: 'レ', note: 'レ', frequency: 294, detectedFrequency: 291, cents: -18, grade: 'good' },\\n            { name: 'ミ', note: 'ミ', frequency: 330, detectedFrequency: 335, cents: 26, grade: 'pass' },\\n            { name: 'ファ', note: 'ファ', frequency: 349, detectedFrequency: 346, cents: -15, grade: 'excellent' },\\n            { name: 'ソ', note: 'ソ', frequency: 392, detectedFrequency: 388, cents: -18, grade: 'good' },\\n            { name: 'ラ', note: 'ラ', frequency: 440, detectedFrequency: 444, cents: 16, grade: 'good' },\\n            { name: 'シ', note: 'シ', frequency: 494, detectedFrequency: 499, cents: 17, grade: 'good' },\\n            { name: 'ド（高）', note: 'ド（高）', frequency: 523, detectedFrequency: 520, cents: -10, grade: 'excellent' }\\n          ]\\n        },\\n        { \\n          grade: 'good', \\n          accuracy: 78, \\n          baseNote: 'D4',\\n          baseFrequency: 293.66,\\n          timestamp: new Date(Date.now() - 6 * 60000),\\n          measuredNotes: 7,\\n          noteResults: [\\n            { name: 'ド', note: 'ド', frequency: 294, detectedFrequency: 290, cents: -23, grade: 'good' },\\n            { name: 'レ', note: 'レ', frequency: 330, detectedFrequency: 340, cents: 53, grade: 'needWork' },\\n            { name: 'ミ', note: 'ミ', frequency: 370, detectedFrequency: 375, cents: 23, grade: 'good' },\\n            { name: 'ファ', note: 'ファ', frequency: 392, detectedFrequency: 385, cents: -31, grade: 'pass' },\\n            { name: 'ソ', note: 'ソ', frequency: 440, detectedFrequency: 432, cents: -31, grade: 'pass' },\\n            { name: 'ラ', note: 'ラ', frequency: 494, detectedFrequency: 510, cents: 56, grade: 'needWork' },\\n            { name: 'シ', note: 'シ', frequency: 554, detectedFrequency: null, cents: null, grade: 'notMeasured' },\\n            { name: 'ド（高）', note: 'ド（高）', frequency: 587, detectedFrequency: 580, cents: -21, grade: 'good' }\\n          ]\\n        },\\n        { \\n          grade: 'excellent', \\n          accuracy: 95, \\n          baseNote: 'E4',\\n          baseFrequency: 329.63,\\n          timestamp: new Date(Date.now() - 5 * 60000),\\n          measuredNotes: 8,\\n          noteResults: [\\n            { name: 'ド', note: 'ド', frequency: 330, detectedFrequency: 332, cents: 10, grade: 'excellent' },\\n            { name: 'レ', note: 'レ', frequency: 370, detectedFrequency: 368, cents: -9, grade: 'excellent' },\\n            { name: 'ミ', note: 'ミ', frequency: 415, detectedFrequency: 418, cents: 12, grade: 'excellent' },\\n            { name: 'ファ', note: 'ファ', frequency: 440, detectedFrequency: 436, cents: -16, grade: 'good' },\\n            { name: 'ソ', note: 'ソ', frequency: 494, detectedFrequency: 497, cents: 11, grade: 'excellent' },\\n            { name: 'ラ', note: 'ラ', frequency: 554, detectedFrequency: 551, cents: -9, grade: 'excellent' },\\n            { name: 'シ', note: 'シ', frequency: 622, detectedFrequency: 625, cents: 8, grade: 'excellent' },\\n            { name: 'ド（高）', note: 'ド（高）', frequency: 659, detectedFrequency: 655, cents: -10, grade: 'excellent' }\\n          ]\\n        },\\n        { \\n          grade: 'needWork', \\n          accuracy: 45, \\n          baseNote: 'F4',\\n          baseFrequency: 349.23,\\n          timestamp: new Date(Date.now() - 4 * 60000),\\n          measuredNotes: 6,\\n          noteResults: [\\n            { name: 'ド', note: 'ド', frequency: 349, detectedFrequency: 345, cents: -20, grade: 'good' },\\n            { name: 'レ', note: 'レ', frequency: 392, detectedFrequency: 420, cents: 124, grade: 'needWork' }, // 外れ値1\\n            { name: 'ミ', note: 'ミ', frequency: 440, detectedFrequency: 435, cents: -20, grade: 'good' },\\n            { name: 'ファ', note: 'ファ', frequency: 466, detectedFrequency: 520, cents: 195, grade: 'needWork' }, // 外れ値2\\n            { name: 'ソ', note: 'ソ', frequency: 523, detectedFrequency: 410, cents: -455, grade: 'needWork' }, // 外れ値3\\n            { name: 'ラ', note: 'ラ', frequency: 587, detectedFrequency: null, cents: null, grade: 'notMeasured' },\\n            { name: 'シ', note: 'シ', frequency: 659, detectedFrequency: 650, cents: -24, grade: 'good' },\\n            { name: 'ド（高）', note: 'ド（高）', frequency: 698, detectedFrequency: null, cents: null, grade: 'notMeasured' }\\n          ]\\n        },\\n        // === 追加セッション 5-8 ===\\n        { \\n          grade: 'good', \\n          accuracy: 85, \\n          baseNote: 'G4',\\n          baseFrequency: 392.00,\\n          timestamp: new Date(Date.now() - 3 * 60000),\\n          measuredNotes: 8,\\n          noteResults: [\\n            { name: 'ド', note: 'ド', frequency: 392, detectedFrequency: 395, cents: 13, grade: 'excellent' },\\n            { name: 'レ', note: 'レ', frequency: 440, detectedFrequency: 438, cents: -8, grade: 'excellent' },\\n            { name: 'ミ', note: 'ミ', frequency: 494, detectedFrequency: 500, cents: 21, grade: 'good' },\\n            { name: 'ファ', note: 'ファ', frequency: 523, detectedFrequency: 520, cents: -10, grade: 'excellent' },\\n            { name: 'ソ', note: 'ソ', frequency: 587, detectedFrequency: 595, cents: 24, grade: 'good' },\\n            { name: 'ラ', note: 'ラ', frequency: 659, detectedFrequency: 665, cents: 16, grade: 'good' },\\n            { name: 'シ', note: 'シ', frequency: 740, detectedFrequency: 755, cents: 35, grade: 'pass' },\\n            { name: 'ド（高）', note: 'ド（高）', frequency: 784, detectedFrequency: 780, cents: -9, grade: 'excellent' }\\n          ]\\n        },\\n        { \\n          grade: 'excellent', \\n          accuracy: 94, \\n          baseNote: 'A4',\\n          baseFrequency: 440.00,\\n          timestamp: new Date(Date.now() - 2 * 60000),\\n          measuredNotes: 8,\\n          noteResults: [\\n            { name: 'ド', note: 'ド', frequency: 440, detectedFrequency: 442, cents: 8, grade: 'excellent' },\\n            { name: 'レ', note: 'レ', frequency: 494, detectedFrequency: 492, cents: -7, grade: 'excellent' },\\n            { name: 'ミ', note: 'ミ', frequency: 554, detectedFrequency: 558, cents: 12, grade: 'excellent' },\\n            { name: 'ファ', note: 'ファ', frequency: 587, detectedFrequency: 585, cents: -6, grade: 'excellent' },\\n            { name: 'ソ', note: 'ソ', frequency: 659, detectedFrequency: 665, cents: 16, grade: 'good' },\\n            { name: 'ラ', note: 'ラ', frequency: 740, detectedFrequency: 738, cents: -5, grade: 'excellent' },\\n            { name: 'シ', note: 'シ', frequency: 831, detectedFrequency: 840, cents: 19, grade: 'good' },\\n            { name: 'ド（高）', note: 'ド（高）', frequency: 880, detectedFrequency: 882, cents: 4, grade: 'excellent' }\\n          ]\\n        },\\n        { \\n          grade: 'pass', \\n          accuracy: 68, \\n          baseNote: 'Bb4',\\n          baseFrequency: 466.16,\\n          timestamp: new Date(Date.now() - 1 * 60000),\\n          measuredNotes: 7,\\n          noteResults: [\\n            { name: 'ド', note: 'ド', frequency: 466, detectedFrequency: 470, cents: 15, grade: 'excellent' },\\n            { name: 'レ', note: 'レ', frequency: 523, detectedFrequency: 535, cents: 39, grade: 'pass' },\\n            { name: 'ミ', note: 'ミ', frequency: 587, detectedFrequency: 600, cents: 38, grade: 'pass' },\\n            { name: 'ファ', note: 'ファ', frequency: 622, detectedFrequency: 615, cents: -19, grade: 'good' },\\n            { name: 'ソ', note: 'ソ', frequency: 698, detectedFrequency: 720, cents: 54, grade: 'needWork' },\\n            { name: 'ラ', note: 'ラ', frequency: 784, detectedFrequency: null, cents: null, grade: 'notMeasured' },\\n            { name: 'シ', note: 'シ', frequency: 880, detectedFrequency: 895, cents: 29, grade: 'pass' },\\n            { name: 'ド（高）', note: 'ド（高）', frequency: 932, detectedFrequency: 925, cents: -13, grade: 'excellent' }\\n          ]\\n        },\\n        { \\n          grade: 'good', \\n          accuracy: 82, \\n          baseNote: 'C5',\\n          baseFrequency: 523.25,\\n          timestamp: new Date(),\\n          measuredNotes: 8,\\n          noteResults: [\\n            { name: 'ド', note: 'ド', frequency: 523, detectedFrequency: 526, cents: 10, grade: 'excellent' },\\n            { name: 'レ', note: 'レ', frequency: 587, detectedFrequency: 584, cents: -9, grade: 'excellent' },\\n            { name: 'ミ', note: 'ミ', frequency: 659, detectedFrequency: 665, cents: 16, grade: 'good' },\\n            { name: 'ファ', note: 'ファ', frequency: 698, detectedFrequency: 692, cents: -15, grade: 'excellent' },\\n            { name: 'ソ', note: 'ソ', frequency: 784, detectedFrequency: 795, cents: 24, grade: 'good' },\\n            { name: 'ラ', note: 'ラ', frequency: 880, detectedFrequency: 890, cents: 19, grade: 'good' },\\n            { name: 'シ', note: 'シ', frequency: 988, detectedFrequency: 1010, cents: 38, grade: 'pass' },\\n            { name: 'ド（高）', note: 'ド（高）', frequency: 1047, detectedFrequency: 1042, cents: -8, grade: 'excellent' }\\n          ]\\n        }\\n      ]\\n    };\\n  }\\n\\n  // 基本状態管理\\n  let trainingPhase = 'setup'; // 'setup' | 'listening' | 'waiting' | 'guiding' | 'results'\\n  \\n  \\n  // マイクテストページからの遷移を早期検出\\n  let microphoneState = (() => {\\n    if (typeof window !== 'undefined') {\\n      const urlParams = new URLSearchParams(window.location.search);\\n      if (urlParams.get('from') === 'microphone-test') {\\n        logger.info('[RandomTraining] マイクテストページからの遷移を検出');\\n        return 'granted';\\n      } else {\\n        logger.info('[RandomTraining] ダイレクトアクセスを検出');\\n        return 'checking';\\n      }\\n    }\\n    return 'checking';\\n  })(); // 'checking' | 'granted' | 'denied' | 'error'\\n  \\n  // シンプルな状態管理\\n  let microphoneHealthy = true; // マイク健康状態\\n  let microphoneErrors = []; // マイクエラー詳細\\n  \\n  // デバッグ情報（強制更新）\\n  const buildVersion = \\"v2.3.1-ANIMATED\\";\\n  const buildTimestamp = \\"07/29 04:15\\";\\n  const updateStatus = \\"🎬 評価分布アニメーション実装・UX向上\\";\\n  \\n  // 統一音階表記（相対音程表記）\\n  const SCALE_NAMES = ['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ', 'ド（高）'];\\n  \\n  // 基音関連\\n  let currentBaseNote = '';\\n  let currentBaseFrequency = 0;\\n  let isPlaying = false;\\n  \\n  // 音程ガイド\\n  let currentScaleIndex = 0;\\n  let scaleSteps = SCALE_NAMES.map(name => ({\\n    name,\\n    state: 'inactive',\\n    completed: false\\n  }));\\n  \\n  // ガイドアニメーション制御\\n  let guideAnimationTimer = null;\\n  let isGuideAnimationActive = false;\\n  \\n  // 裏での評価蓄積\\n  let scaleEvaluations = [];\\n  \\n  // 前回の結果保持（再挑戦時表示用）\\n  let previousEvaluations = [];\\n  \\n  // 音程検出\\n  let currentVolume = 0;\\n  let currentFrequency = 0;\\n  let detectedNote = 'ーー';\\n  let pitchDifference = 0;\\n  \\n  // セッション結果\\n  let sessionResults = {\\n    correctCount: 0,\\n    totalCount: 8,\\n    averageAccuracy: 0,\\n    averageTime: 0,\\n    isCompleted: false\\n  };\\n  \\n  // 採点システム関連\\n  let scoringEngine = null;\\n  let currentScoreData = {\\n    totalScore: 0,\\n    grade: 'C',\\n    componentScores: {\\n      pitchAccuracy: 0,\\n      recognitionSpeed: 0,\\n      intervalMastery: 0,\\n      directionAccuracy: 0,\\n      consistency: 0\\n    }\\n  };\\n  let intervalData = [];\\n  let consistencyData = [];\\n  let feedbackData = {};\\n  let sessionStatistics = {\\n    totalAttempts: 0,\\n    successRate: 0,\\n    averageScore: 0,\\n    bestScore: 0,\\n    sessionDuration: 0,\\n    streakCount: 0,\\n    fatigueLevel: 'fresh',\\n    mostDifficultInterval: '-',\\n    mostSuccessfulInterval: '-',\\n    averageResponseTime: 0,\\n    sessionStart: Date.now()\\n  };\\n  let activeTab = 'intervals'; // 'intervals' | 'consistency' | 'statistics'\\n  \\n  // ランダムモード用の8音階評価データ\\n  let noteResultsForDisplay = [];\\n  \\n  // 統合採点システム用データ（従来の1セッション用）\\n  let currentUnifiedScoreData = null;\\n  \\n  // Tone.jsサンプラー\\n  let sampler = null;\\n  let isSamplerLoading = true;\\n  \\n  // 音程検出コンポーネント\\n  let pitchDetectorComponent = null;\\n  \\n  // AudioManager対応変数\\n  let mediaStream = null;   // AudioManagerから取得\\n  let audioContext = null;  // AudioManagerから取得\\n  let sourceNode = null;    // AudioManagerから取得\\n  \\n  // セッション時刻管理\\n  let sessionStartTime = null;\\n\\n  // 基音候補（存在する音源ファイルに合わせた10種類）\\n  const baseNotes = [\\n    { note: 'C4', name: 'ド（中）', frequency: 261.63, semitonesFromC: 0 },\\n    { note: 'Db4', name: 'ド#（中）', frequency: 277.18, semitonesFromC: 1 },\\n    { note: 'D4', name: 'レ（中）', frequency: 293.66, semitonesFromC: 2 },\\n    { note: 'Eb4', name: 'レ#（中）', frequency: 311.13, semitonesFromC: 3 },\\n    { note: 'E4', name: 'ミ（中）', frequency: 329.63, semitonesFromC: 4 },\\n    { note: 'F4', name: 'ファ（中）', frequency: 349.23, semitonesFromC: 5 },\\n    { note: 'Gb4', name: 'ファ#（中）', frequency: 369.99, semitonesFromC: 6 },\\n    { note: 'Ab4', name: 'ラb（中）', frequency: 415.30, semitonesFromC: 8 },\\n    { note: 'Bb3', name: 'シb（低）', frequency: 233.08, semitonesFromC: -2 },\\n    { note: 'B3', name: 'シ（低）', frequency: 246.94, semitonesFromC: -1 }\\n  ];\\n\\n  // マイク許可確認（AudioManager対応版）\\n  async function checkMicrophonePermission() {\\n    microphoneState = 'checking';\\n    \\n    try {\\n      console.log('🎤 [RandomTraining] AudioManager経由でマイク許可確認開始');\\n      \\n      if (!navigator.mediaDevices?.getUserMedia) {\\n        microphoneState = 'error';\\n        return;\\n      }\\n      \\n      // AudioManagerから共有リソースを取得（重複取得は安全）\\n      const resources = await audioManager.initialize();\\n      audioContext = resources.audioContext;\\n      mediaStream = resources.mediaStream;\\n      sourceNode = resources.sourceNode;\\n      \\n      console.log('✅ [RandomTraining] AudioManager リソース取得完了');\\n      \\n      microphoneState = 'granted';\\n      trainingPhase = 'setup';\\n      \\n      // PitchDetector初期化（外部AudioContext方式）\\n      setTimeout(async () => {\\n        if (pitchDetectorComponent) {\\n          logger.audio('[RandomTraining] PitchDetector初期化開始');\\n          await pitchDetectorComponent.initialize();\\n          logger.audio('[RandomTraining] PitchDetector初期化完了');\\n        }\\n      }, 200);\\n      \\n    } catch (error) {\\n      logger.error('[RandomTraining] マイク許可エラー:', error);\\n      microphoneState = (error?.name === 'NotAllowedError') ? 'denied' : 'error';\\n    }\\n  }\\n\\n  // ランダム基音選択\\n  function selectRandomBaseNote() {\\n    // localStorageから次の基音を取得\\n    const nextNote = $nextBaseNote;\\n    const nextName = $nextBaseName;\\n    \\n    // baseNotesから対応する情報を検索\\n    const selectedNote = baseNotes.find(note => note.note === nextNote) || \\n                        baseNotes.find(note => note.name === nextName) ||\\n                        baseNotes[0]; // フォールバック\\n    \\n    currentBaseNote = selectedNote.name;\\n    currentBaseFrequency = selectedNote.frequency;\\n    \\n    // 基音周波数設定確認ログ\\n    logger.info(\`[BaseNote] 基音設定（localStorage連携）: \${currentBaseNote} = \${currentBaseFrequency}Hz\`);\\n    logger.info(\`[BaseNote] localStorage基音情報: note=\${nextNote}, name=\${nextName}\`);\\n    \\n    // 基音周波数が正常に設定されたことを確認\\n    if (!currentBaseFrequency || currentBaseFrequency <= 0) {\\n      logger.error('[BaseNote] 基音周波数設定エラー:', selectedNote);\\n      throw new Error(\`Invalid base frequency: \${currentBaseFrequency}\`);\\n    }\\n  }\\n\\n  // ランダム基音再生（新しい基音を選択）\\n  async function playRandomBaseNote() {\\n    if (isPlaying || !sampler || isSamplerLoading) return;\\n    \\n    // マイク許可が未取得の場合は先に許可を取得\\n    if (microphoneState !== 'granted') {\\n      console.log('🎤 [RandomTraining] マイク許可が必要です。許可取得を開始...');\\n      try {\\n        await checkMicrophonePermission();\\n        console.log('🎤 [RandomTraining] マイク許可取得完了');\\n      } catch (error) {\\n        console.error('❌ マイク許可エラー:', error);\\n        return;\\n      }\\n    }\\n    \\n    // AudioManagerリソースが初期化されていない場合のみ初期化\\n    if (!mediaStream && microphoneState === 'granted') {\\n      console.log('🎤 [RandomTraining] AudioManagerリソース未初期化のため取得します');\\n      try {\\n        await checkMicrophonePermission();\\n      } catch (error) {\\n        console.error('❌ AudioManagerリソース初期化エラー:', error);\\n        return;\\n      }\\n    } else if (mediaStream) {\\n      console.log('🎤 [RandomTraining] AudioManagerリソース既存のため再利用');\\n    }\\n    \\n    // 即座に状態変更\\n    isPlaying = true;\\n    trainingPhase = 'listening';\\n    sessionStartTime = Date.now(); // セッション開始時刻を記録\\n    selectRandomBaseNote(); // 新しいランダム基音を選択\\n    \\n    // 音声再生\\n    const note = baseNotes.find(n => n.name === currentBaseNote).note;\\n    sampler.triggerAttackRelease(note, 2, Tone.now(), 0.7);\\n    \\n    // 2.5秒後にガイドアニメーション開始\\n    setTimeout(() => {\\n      isPlaying = false;\\n      trainingPhase = 'waiting';\\n      setTimeout(() => startGuideAnimation(), 500);\\n    }, 2000);\\n  }\\n\\n  // 現在の基音再生（既存の基音を再利用）\\n  async function playCurrentBaseNote() {\\n    if (isPlaying || !sampler || $isLoading || !currentBaseNote) return;\\n    \\n    // マイク許可が未取得の場合は先に許可を取得\\n    if (microphoneState !== 'granted') {\\n      console.log('🎤 [RandomTraining] マイク許可が必要です。許可取得を開始...');\\n      try {\\n        await checkMicrophonePermission();\\n        console.log('🎤 [RandomTraining] マイク許可取得完了');\\n      } catch (error) {\\n        console.error('❌ マイク許可エラー:', error);\\n        return;\\n      }\\n    }\\n    \\n    // AudioManagerリソースが初期化されていない場合のみ初期化\\n    if (!mediaStream && microphoneState === 'granted') {\\n      console.log('🎤 [RandomTraining] AudioManagerリソース未初期化のため取得します');\\n      try {\\n        await checkMicrophonePermission();\\n      } catch (error) {\\n        console.error('❌ AudioManagerリソース初期化エラー:', error);\\n        return;\\n      }\\n    } else if (mediaStream) {\\n      console.log('🎤 [RandomTraining] AudioManagerリソース既存のため再利用');\\n    }\\n    \\n    // 即座に状態変更\\n    isPlaying = true;\\n    trainingPhase = 'listening';\\n    sessionStartTime = Date.now(); // セッション開始時刻を記録\\n    // selectRandomBaseNote() は呼ばない - 既存の基音を保持\\n    \\n    // 音声再生\\n    const note = baseNotes.find(n => n.name === currentBaseNote).note;\\n    sampler.triggerAttackRelease(note, 2, Tone.now(), 0.7);\\n    \\n    // 2.5秒後にガイドアニメーション開始\\n    setTimeout(() => {\\n      isPlaying = false;\\n      trainingPhase = 'waiting';\\n      setTimeout(() => startGuideAnimation(), 500);\\n    }, 2000);\\n  }\\n\\n  // 基音のみ再生（再挑戦ボタン専用 - トレーニング開始なし）\\n  async function playBaseNoteOnly() {\\n    if (isPlaying || !sampler || $isLoading || !currentBaseNote) {\\n      console.log('🔄 [BaseNoteOnly] 再生条件未満: isPlaying:', isPlaying, 'sampler:', !!sampler, 'isLoading:', $isLoading, 'currentBaseNote:', currentBaseNote);\\n      return;\\n    }\\n    \\n    console.log('🎵 [BaseNoteOnly] 基音のみ再生開始:', currentBaseNote);\\n    \\n    // 基音のみ再生（状態変更なし）\\n    const note = baseNotes.find(n => n.name === currentBaseNote).note;\\n    sampler.triggerAttackRelease(note, 1.5, Tone.now(), 0.7);\\n    \\n    console.log('🎵 [BaseNoteOnly] 基音再生完了:', note);\\n  }\\n\\n  // 基音再生（統合関数 - 状況に応じて適切な関数を呼び分け）\\n  function playBaseNote() {\\n    if (currentBaseNote && currentBaseFrequency > 0) {\\n      // 既に基音が設定されている場合は既存の基音を再生\\n      playCurrentBaseNote();\\n    } else {\\n      // 基音が未設定の場合は新しいランダム基音を選択\\n      playRandomBaseNote();\\n    }\\n  }\\n\\n  // 【新】プロトタイプ式のシンプルで正確な周波数計算\\n  function calculateExpectedFrequency(baseFreq, scaleIndex) {\\n    // ドレミファソラシドの固定間隔（半音） - プロトタイプと同一\\n    const diatonicIntervals = [0, 2, 4, 5, 7, 9, 11, 12];\\n    const semitones = diatonicIntervals[scaleIndex];\\n    const targetFreq = baseFreq * Math.pow(2, semitones / 12);\\n    \\n    logger.debug(\`[calculateExpectedFrequency] \${scaleSteps[scaleIndex].name}: 基音\${baseFreq.toFixed(1)}Hz + \${semitones}半音 = \${targetFreq.toFixed(1)}Hz\`);\\n    \\n    return targetFreq;\\n  }\\n\\n  // 目標周波数計算（ドレミファソラシド）- プロトタイプ式に統一\\n  function calculateTargetFrequency(baseFreq, scaleIndex) {\\n    // 【統一】新しいシンプルで正確な計算を使用\\n    return calculateExpectedFrequency(baseFreq, scaleIndex);\\n  }\\n\\n  // ガイドアニメーション開始（簡素版）\\n  function startGuideAnimation() {\\n    // シンプルな状態変更のみ\\n    trainingPhase = 'guiding';\\n    currentScaleIndex = 0;\\n    isGuideAnimationActive = true;\\n    scaleEvaluations = [];\\n    \\n    console.log(\`🎬 ガイド開始: \${currentBaseNote} (\${currentBaseFrequency.toFixed(1)}Hz)\`);\\n    \\n    // 各ステップを順次ハイライト（1秒間隔）\\n    function animateNextStep() {\\n      if (currentScaleIndex < scaleSteps.length) {\\n        // 前のステップを非アクティブに\\n        if (currentScaleIndex > 0) {\\n          scaleSteps[currentScaleIndex - 1].state = 'inactive';\\n        }\\n        \\n        // 現在のステップをアクティブに\\n        scaleSteps[currentScaleIndex].state = 'active';\\n        \\n        // 倍音補正モジュールに音階コンテキストを設定\\n        const targetFreq = calculateTargetFrequency(currentBaseFrequency, currentScaleIndex);\\n        harmonicCorrection.setScaleContext({\\n          baseFrequency: currentBaseFrequency,\\n          currentScale: scaleSteps[currentScaleIndex].name,\\n          targetFrequency: targetFreq\\n        });\\n        \\n        // 【音階コンテキストログ】軽量版\\n        console.log(\`🎵 [Scale] 基音:\${currentBaseNote}(\${currentBaseFrequency.toFixed(0)}Hz) 現在:\${scaleSteps[currentScaleIndex].name} 目標:\${targetFreq.toFixed(0)}Hz\`);\\n        \\n        // 【緊急デバッグ】ガイドアニメーション中の基音状態監視\\n        if (currentScaleIndex >= 4) { // ソ以降で強化ログ\\n          console.log(\`🔍 [デバッグ] Step \${currentScaleIndex}: currentBaseFrequency=\${currentBaseFrequency}, currentBaseNote='\${currentBaseNote}'\`);\\n        }\\n        \\n        // ガイドログ削除（パフォーマンス優先）\\n        \\n        currentScaleIndex++;\\n        \\n        // 0.6秒後に次のステップ（テンポアップ）\\n        guideAnimationTimer = setTimeout(animateNextStep, 600);\\n      } else {\\n        // アニメーション完了\\n        finishGuideAnimation();\\n      }\\n    }\\n    \\n    animateNextStep();\\n  }\\n  \\n  // ガイドアニメーション完了\\n  function finishGuideAnimation() {\\n    isGuideAnimationActive = false;\\n    \\n    console.log(\`🏁 ガイド完了: \${scaleEvaluations.length}/\${scaleSteps.length}ステップ評価\`);\\n    \\n    // 最後のステップも非アクティブに\\n    if (scaleSteps.length > 0) {\\n      scaleSteps[scaleSteps.length - 1].state = 'inactive';\\n    }\\n    \\n    // 音程検出停止\\n    if (pitchDetectorComponent) {\\n      pitchDetectorComponent.stopDetection();\\n    }\\n    \\n    // 倍音補正モジュールのコンテキストをクリア\\n    harmonicCorrection.clearContext();\\n    \\n    // 採点結果を計算して表示\\n    calculateFinalResults();\\n    \\n    // 強化採点エンジンの結果生成\\n    generateFinalScoring();\\n    \\n    // 8音階評価データを新コンポーネント用に変換\\n    // 全8音階を固定表示（測定できなかった音も含む）\\n    noteResultsForDisplay = SCALE_NAMES.map(noteName => {\\n      const evaluation = scaleEvaluations.find(evaluation => evaluation.stepName === noteName);\\n      \\n      if (evaluation) {\\n        // 測定できた音\\n        return {\\n          name: evaluation.stepName,\\n          cents: evaluation.adjustedFrequency ? Math.round(evaluation.centDifference) : null,\\n          targetFreq: evaluation.expectedFrequency,\\n          detectedFreq: evaluation.adjustedFrequency || null,\\n          diff: evaluation.adjustedFrequency ? evaluation.adjustedFrequency - evaluation.expectedFrequency : null,\\n          accuracy: evaluation.accuracy\\n        };\\n      } else {\\n        // 測定できなかった音\\n        return {\\n          name: noteName,\\n          cents: null,\\n          targetFreq: null,\\n          detectedFreq: null,\\n          diff: null,\\n          accuracy: 'notMeasured'\\n        };\\n      }\\n    });\\n    \\n    // 統合採点システムデータを生成\\n    generateUnifiedScoreData();\\n    \\n    // 完全版表示用の追加データ生成\\n    generateEnhancedScoringData();\\n    \\n    trainingPhase = 'results';\\n  }\\n  \\n  // 最終採点結果計算\\n  function calculateFinalResults() {\\n    let correctCount = 0;\\n    let totalAccuracy = 0;\\n    \\n    scaleEvaluations.forEach((evaluation, index) => {\\n      if (evaluation.isCorrect) {\\n        correctCount++;\\n      }\\n      totalAccuracy += evaluation.accuracy;\\n    });\\n    \\n    const averageAccuracy = scaleEvaluations.length > 0 ? Math.round(totalAccuracy / scaleEvaluations.length) : 0;\\n    const correctRate = Math.round((correctCount / scaleSteps.length) * 100);\\n    \\n    sessionResults = {\\n      correctCount: correctCount,\\n      totalCount: scaleSteps.length,\\n      averageAccuracy: averageAccuracy,\\n      averageTime: 0, // 今回は時間測定なし\\n      isCompleted: true\\n    };\\n    \\n    // 最小限の結果ログ\\n    console.log(\`🎯 結果: \${correctCount}/\${scaleSteps.length}正解 (\${correctRate}%) 平均精度\${averageAccuracy}%\`);\\n    \\n    // 前回の結果として保存（再挑戦時表示用）\\n    if (scaleEvaluations.length > 0) {\\n      previousEvaluations = [...scaleEvaluations];\\n    }\\n  }\\n\\n  // ステータスメッセージ取得\\n  function getStatusMessage() {\\n    switch (trainingPhase) {\\n      case 'setup':\\n        if (isSamplerLoading || !sampler) {\\n          return '🎵 音源読み込み中...';\\n        } else {\\n          return '🎤 マイク準備完了 - トレーニング開始可能';\\n        }\\n      case 'listening':\\n        return '🎵 基音再生中...';\\n      case 'waiting':\\n        return '⏳ 間もなく開始...';\\n      case 'guiding':\\n        return '🎙️ ガイドに合わせてドレミファソラシドを歌ってください';\\n      case 'results':\\n        return '🎉 採点結果';\\n      default:\\n        return '🔄 準備中...';\\n    }\\n  }\\n\\n  // 表示用の評価データを取得\\n  function getDisplayEvaluations() {\\n    // 現在のセッションに評価データがある場合は現在のデータを表示\\n    if (scaleEvaluations.length > 0) {\\n      return scaleEvaluations;\\n    }\\n    // 現在のセッションにデータがない場合は前回の結果を表示\\n    if (previousEvaluations.length > 0) {\\n      return previousEvaluations;\\n    }\\n    return [];\\n  }\\n\\n  // マイクテストページへの誘導（SvelteKit goto使用）\\n  function goToMicrophoneTest() {\\n    goto(\`\${base}/microphone-test\`);\\n  }\\n\\n  // ホームページに戻る（SvelteKit goto使用）\\n  function goHome() {\\n    goto(\`\${base}/\`);\\n  }\\n\\n  // Tone.jsサンプラー初期化（Salamander Grand Piano - 最適化版）\\n  async function initializeSampler() {\\n    try {\\n      isSamplerLoading = true;\\n      \\n      // AudioContextは初回再生時に起動（安全なアプローチ）\\n      \\n      // Salamander Grand Piano C4音源からピッチシフト（最適化設定）\\n      sampler = new Tone.Sampler({\\n        urls: {\\n          'C4': 'C4.mp3',\\n        },\\n        baseUrl: \`\${base}/audio/piano/\`,\\n        release: 1.5, // リリース時間最適化\\n        onload: () => {\\n          isSamplerLoading = false;\\n        },\\n        onerror: (error) => {\\n          console.error('❌ Salamander Piano音源読み込みエラー:', error);\\n          isSamplerLoading = false;\\n        }\\n      }).toDestination();\\n      \\n      // 音量調整\\n      sampler.volume.value = -6; // デフォルトより少し下げる\\n      \\n    } catch (error) {\\n      console.error('サンプラー初期化エラー:', error);\\n      isSamplerLoading = false;\\n    }\\n  }\\n  \\n  // マイク許可状態確認（取得はしない）\\n  async function checkExistingMicrophonePermission() {\\n    try {\\n      // Permissions API でマイク許可状態を確認（ダイアログは出ない）\\n      const permissionStatus = await navigator.permissions.query({ name: 'microphone' });\\n      \\n      if (permissionStatus.state === 'granted') {\\n        // 既に許可済みの場合のみストリーム取得\\n        await checkMicrophonePermission();\\n      } else {\\n        // 未許可の場合はエラー画面表示\\n        microphoneState = 'denied';\\n      }\\n    } catch (error) {\\n      // Permissions API 未対応の場合は従来の方法\\n      microphoneState = 'denied';\\n    }\\n  }\\n\\n  // 採点エンジン初期化\\n  function initializeScoringEngine() {\\n    try {\\n      scoringEngine = new EnhancedScoringEngine();\\n      logger.info('[RandomTraining] 採点エンジン初期化完了');\\n    } catch (error) {\\n      logger.error('[RandomTraining] 採点エンジン初期化エラー:', error);\\n    }\\n  }\\n  \\n  // 採点エンジンにデータを送信\\n  function updateScoringEngine(frequency, note) {\\n    if (!scoringEngine || !isGuideAnimationActive) return;\\n    \\n    const activeStepIndex = currentScaleIndex - 1;\\n    if (activeStepIndex < 0 || activeStepIndex >= scaleSteps.length) return;\\n    \\n    const expectedFrequency = calculateExpectedFrequency(currentBaseFrequency, activeStepIndex);\\n    \\n    // 採点エンジンに音程データを送信\\n    const attemptData = {\\n      baseFrequency: currentBaseFrequency,\\n      targetFrequency: expectedFrequency,\\n      detectedFrequency: frequency,\\n      detectedNote: note,\\n      volume: currentVolume,\\n      timestamp: Date.now(),\\n      scaleIndex: activeStepIndex,\\n      scaleName: scaleSteps[activeStepIndex].name\\n    };\\n    \\n    try {\\n      scoringEngine.processAttempt(attemptData);\\n    } catch (error) {\\n      logger.error('[RandomTraining] 採点エンジンエラー:', error);\\n    }\\n  }\\n  \\n  // 最終採点結果を取得\\n  function generateFinalScoring() {\\n    if (!scoringEngine) {\\n      logger.error('[RandomTraining] 採点エンジンが初期化されていません');\\n      // フォールバック: テストデータで表示\\n      generateTestScoreData();\\n      return;\\n    }\\n    \\n    try {\\n      const results = scoringEngine.generateDetailedReport();\\n      \\n      // スコアデータ更新\\n      currentScoreData = {\\n        totalScore: results.totalScore,\\n        grade: results.grade,\\n        componentScores: results.componentScores\\n      };\\n      \\n      // 音程データ更新（安全な参照）\\n      if (results.intervalAnalysis && results.intervalAnalysis.masteryLevels) {\\n        intervalData = Object.entries(results.intervalAnalysis.masteryLevels).map(([type, mastery]) => ({\\n          type,\\n          mastery: Math.round(mastery),\\n          attempts: results.intervalAnalysis.attemptCounts?.[type] || 0,\\n          accuracy: results.intervalAnalysis.accuracyRates?.[type] || 0\\n        }));\\n      } else {\\n        console.warn('⚠️ [RandomTraining] intervalAnalysis.masteryLevels が未定義です');\\n        intervalData = [];\\n      }\\n      \\n      // 一貫性データ更新（安全な参照）\\n      if (results.consistencyHistory && Array.isArray(results.consistencyHistory)) {\\n        consistencyData = results.consistencyHistory.map((score, index) => ({\\n          score: Math.round(score),\\n          timestamp: Date.now() - (results.consistencyHistory.length - index) * 1000\\n        }));\\n      } else {\\n        console.warn('⚠️ [RandomTraining] consistencyHistory が未定義または配列ではありません');\\n        consistencyData = [];\\n      }\\n      \\n      // フィードバックデータ更新（安全な参照）\\n      feedbackData = results.feedback || {\\n        primary: '採点結果を生成中です...',\\n        detailed: [],\\n        suggestions: []\\n      };\\n      \\n      // セッション統計更新（安全な参照）\\n      sessionStatistics = {\\n        totalAttempts: results.totalAttempts || 0,\\n        successRate: results.successRate || 0,\\n        averageScore: results.totalScore || 0,\\n        bestScore: Math.max(results.totalScore || 0, sessionStatistics.bestScore || 0),\\n        sessionDuration: Math.round((Date.now() - sessionStatistics.sessionStart) / 60000) || 0,\\n        streakCount: results.streak || 0,\\n        fatigueLevel: results.fatigueLevel || 'normal',\\n        mostDifficultInterval: results.mostDifficultInterval || '-',\\n        mostSuccessfulInterval: results.mostSuccessfulInterval || '-',\\n        averageResponseTime: results.averageResponseTime || 0\\n      };\\n      \\n      logger.info('[RandomTraining] 採点結果生成完了:', currentScoreData);\\n      \\n    } catch (error) {\\n      logger.error('[RandomTraining] 採点結果生成エラー:', error);\\n    }\\n  }\\n  \\n  // テストデータ生成（フォールバック）\\n  function generateTestScoreData() {\\n    logger.info('[RandomTraining] テストデータで採点結果を生成');\\n    \\n    // テストスコアデータ\\n    currentScoreData = {\\n      totalScore: 78,\\n      grade: 'B+',\\n      componentScores: {\\n        pitchAccuracy: 82,\\n        recognitionSpeed: 75,\\n        intervalMastery: 80,\\n        directionAccuracy: 85,\\n        consistency: 70\\n      }\\n    };\\n    \\n    // テスト音程データ\\n    intervalData = [\\n      { type: 'unison', mastery: 95, attempts: 8, accuracy: 98 },\\n      { type: 'major_second', mastery: 82, attempts: 8, accuracy: 85 },\\n      { type: 'major_third', mastery: 78, attempts: 8, accuracy: 80 },\\n      { type: 'perfect_fourth', mastery: 65, attempts: 8, accuracy: 68 },\\n      { type: 'perfect_fifth', mastery: 88, attempts: 8, accuracy: 90 },\\n      { type: 'major_sixth', mastery: 72, attempts: 8, accuracy: 75 },\\n      { type: 'major_seventh', mastery: 58, attempts: 8, accuracy: 62 },\\n      { type: 'octave', mastery: 92, attempts: 8, accuracy: 94 }\\n    ];\\n    \\n    // テスト一貫性データ\\n    consistencyData = [\\n      { score: 65, timestamp: Date.now() - 420000 },\\n      { score: 72, timestamp: Date.now() - 360000 },\\n      { score: 68, timestamp: Date.now() - 300000 },\\n      { score: 75, timestamp: Date.now() - 240000 },\\n      { score: 78, timestamp: Date.now() - 180000 },\\n      { score: 82, timestamp: Date.now() - 120000 },\\n      { score: 80, timestamp: Date.now() - 60000 },\\n      { score: 85, timestamp: Date.now() }\\n    ];\\n    \\n    // テストフィードバックデータ\\n    feedbackData = {\\n      type: 'improvement',\\n      primary: '良い進歩が見られます！',\\n      summary: '音程の認識精度が向上しています。特に完全5度とオクターブの習得度が高く、基本的な音感が身についてきています。',\\n      details: [\\n        { category: 'strengths', text: 'ユニゾンとオクターブの認識がほぼ完璧です' },\\n        { category: 'strengths', text: '完全5度の安定性が優秀です' },\\n        { category: 'improvements', text: '完全4度の練習をもう少し増やしましょう' },\\n        { category: 'improvements', text: '長7度の認識精度を向上させましょう' },\\n        { category: 'tips', text: '4度は「ソーファー」の音程です' },\\n        { category: 'practice', text: '毎日15分の継続練習を心がけましょう' }\\n      ],\\n      nextSteps: [\\n        '完全4度の集中練習を行いましょう',\\n        '連続チャレンジモードで実践練習を',\\n        '1日15分の継続練習を心がけましょう'\\n      ],\\n      motivation: '継続は力なり！あなたの相対音感は確実に向上しています！'\\n    };\\n    \\n    // テストセッション統計\\n    sessionStatistics = {\\n      totalAttempts: 32,\\n      successRate: 68.8,\\n      averageScore: 78,\\n      bestScore: 85,\\n      sessionDuration: 8,\\n      streakCount: 4,\\n      fatigueLevel: 'normal',\\n      mostDifficultInterval: '完全4度',\\n      mostSuccessfulInterval: 'ユニゾン',\\n      averageResponseTime: 2.1,\\n      sessionStart: Date.now() - 480000 // 8分前\\n    };\\n    \\n    logger.info('[RandomTraining] テスト採点結果生成完了');\\n  }\\n  \\n  // タブ切り替え\\n  function switchTab(tab) {\\n    activeTab = tab;\\n  }\\n  \\n  // 統合採点データ生成（完全版・デバッグエリア品質適用）\\n  function generateUnifiedScoreData() {\\n    if (!noteResultsForDisplay || noteResultsForDisplay.length === 0) {\\n      console.warn('[UnifiedScore] noteResultsForDisplay が空です');\\n      return;\\n    }\\n    \\n    // 測定成功率計算\\n    const measuredNotes = noteResultsForDisplay.filter(note => note.accuracy !== 'notMeasured').length;\\n    const totalNotes = noteResultsForDisplay.length;\\n    \\n    // 平均精度計算\\n    const validAccuracies = noteResultsForDisplay\\n      .filter(note => note.accuracy !== 'notMeasured' && typeof note.accuracy === 'number')\\n      .map(note => note.accuracy);\\n    const averageAccuracy = validAccuracies.length > 0 \\n      ? Math.round(validAccuracies.reduce((sum, acc) => sum + acc, 0) / validAccuracies.length)\\n      : 0;\\n    \\n    // 基音情報\\n    const baseNote = currentBaseNote || 'Unknown';\\n    const baseFrequency = currentBaseFrequency || 0;\\n\\n    // noteResultsForDisplayを正しい形式に変換\\n    const convertedNoteResults = noteResultsForDisplay.map(note => ({\\n      name: note.name,\\n      note: note.note || note.name,\\n      frequency: note.targetFreq || note.expectedFrequency,\\n      detectedFrequency: note.detectedFreq,\\n      cents: note.cents,\\n      grade: calculateNoteGrade(note.cents),\\n      targetFreq: note.targetFreq,\\n      diff: note.diff\\n    }));\\n    \\n    // localStorage から既存のセッション履歴を取得\\n    const currentProgress = $trainingProgress;\\n    const allSessionHistory = currentProgress?.sessionHistory || [];\\n    \\n    // 現在のセッション結果を追加\\n    const currentSessionResult = {\\n      timestamp: new Date(),\\n      baseNote: baseNote,\\n      baseFrequency: baseFrequency,\\n      noteResults: convertedNoteResults,\\n      measuredNotes: measuredNotes,\\n      accuracy: averageAccuracy,\\n      grade: calculateSessionGrade(noteResultsForDisplay)\\n    };\\n    \\n    // 統合スコアデータを作成（localStorage履歴 + 現在セッション）\\n    currentUnifiedScoreData = {\\n      mode: 'random',\\n      timestamp: new Date(),\\n      duration: 60, // 1セッション約60秒想定\\n      totalNotes: totalNotes,\\n      measuredNotes: measuredNotes,\\n      averageAccuracy: averageAccuracy,\\n      baseNote: baseNote,\\n      baseFrequency: baseFrequency,\\n      noteResults: convertedNoteResults,\\n      distribution: calculateGradeDistribution(noteResultsForDisplay),\\n      // セッション履歴：既存履歴 + 現在のセッション\\n      sessionHistory: [...allSessionHistory, currentSessionResult]\\n    };\\n    \\n    console.log('[UnifiedScore] 統合採点データ生成完了（完全版）:', currentUnifiedScoreData);\\n    \\n    // localStorage にセッション結果を保存\\n    saveSessionToStorage();\\n  }\\n  \\n  // セッション結果をlocalStorageに保存\\n  async function saveSessionToStorage() {\\n    if (!noteResultsForDisplay || noteResultsForDisplay.length === 0) {\\n      console.warn('📊 [SessionStorage] 保存データなし');\\n      return;\\n    }\\n    \\n    try {\\n      console.log('📊 [SessionStorage] セッション結果保存開始');\\n      \\n      // noteResultsForDisplayを正しい形式に変換\\n      const convertedNoteResults = noteResultsForDisplay.map(note => ({\\n        name: note.name,\\n        cents: note.cents,\\n        targetFreq: note.targetFreq || note.expectedFrequency,\\n        detectedFreq: note.detectedFreq,\\n        diff: note.diff,\\n        accuracy: typeof note.accuracy === 'number' ? note.accuracy : 0\\n      }));\\n      \\n      // セッション継続時間を計算（開始時刻からの経過時間）\\n      const duration = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1000) : 60;\\n      \\n      // 基音情報\\n      const baseNote = $nextBaseNote; // 次の基音ストアから取得\\n      const baseName = $nextBaseName; // 次の基音名ストアから取得\\n      \\n      // saveSessionResult に渡す\\n      const success = await saveSessionResult(\\n        convertedNoteResults,\\n        duration,\\n        baseNote,\\n        baseName\\n      );\\n      \\n      if (success) {\\n        console.log('📊 [SessionStorage] セッション結果保存完了');\\n        console.log('📊 [SessionStorage] 保存後の状況:', {\\n          currentSession: $currentSessionId,\\n          totalSessions: $sessionHistory.length,\\n          isCompleted: $isCompleted,\\n          nextBaseNote: $nextBaseNote,\\n          nextBaseName: $nextBaseName\\n        });\\n      } else {\\n        console.error('📊 [SessionStorage] セッション結果保存失敗');\\n      }\\n    } catch (error) {\\n      console.error('📊 [SessionStorage] セッション保存エラー:', error);\\n    }\\n  }\\n\\n  // 実際のトレーニングデータから追加採点データを生成\\n  function generateEnhancedScoringData() {\\n    try {\\n      // EnhancedScoringEngine を使用してスコアデータを生成\\n      if (scoringEngine) {\\n        const results = scoringEngine.generateDetailedReport();\\n        \\n        // スコアデータ更新\\n        currentScoreData = {\\n          totalScore: results.totalScore || 0,\\n          grade: results.grade || 'C',\\n          componentScores: results.componentScores || {\\n            accuracy: 0,\\n            speed: 0,\\n            consistency: 0\\n          }\\n        };\\n        \\n        // 音程データ更新（安全な参照）\\n        if (results.intervalAnalysis && results.intervalAnalysis.masteryLevels) {\\n          intervalData = Object.entries(results.intervalAnalysis.masteryLevels).map(([type, mastery]) => ({\\n            type,\\n            mastery: Math.round(mastery),\\n            attempts: results.intervalAnalysis.attemptCounts?.[type] || 0,\\n            accuracy: Math.round(mastery * 0.9) // masteryから精度を推定\\n          }));\\n        } else {\\n          // 実際のトレーニングデータから音程分析を生成\\n          intervalData = generateIntervalDataFromResults(noteResultsForDisplay);\\n        }\\n        \\n        // 一貫性データ更新\\n        if (results.consistencyHistory && Array.isArray(results.consistencyHistory)) {\\n          consistencyData = results.consistencyHistory.map((score, index) => ({\\n            score: Math.round(score),\\n            timestamp: Date.now() - (results.consistencyHistory.length - index) * 1000\\n          }));\\n        } else {\\n          // 実際のデータから一貫性履歴を生成\\n          consistencyData = generateConsistencyDataFromResults(noteResultsForDisplay);\\n        }\\n        \\n        // フィードバックデータ更新\\n        feedbackData = results.feedback || generateFeedbackFromResults(noteResultsForDisplay);\\n        \\n        // セッション統計更新\\n        sessionStatistics = {\\n          totalAttempts: results.totalAttempts || noteResultsForDisplay.length,\\n          successRate: results.successRate || (noteResultsForDisplay.filter(n => n.accuracy !== 'notMeasured').length / noteResultsForDisplay.length * 100),\\n          averageScore: results.totalScore || currentUnifiedScoreData?.averageAccuracy || 0,\\n          bestScore: Math.max(results.totalScore || 0, sessionStatistics.bestScore || 0),\\n          sessionDuration: Math.round(60), // 1セッション約60秒\\n          streakCount: results.streak || 0,\\n          fatigueLevel: results.fatigueLevel || 'normal',\\n          mostDifficultInterval: results.mostDifficultInterval || '未特定',\\n          mostSuccessfulInterval: results.mostSuccessfulInterval || '未特定',\\n          averageResponseTime: results.averageResponseTime || 2.5,\\n          sessionStart: Date.now() - 60000 // 1分前開始と仮定\\n        };\\n        \\n      } else {\\n        // scoringEngine が無い場合は実際のデータから生成\\n        generateFallbackEnhancedData();\\n      }\\n      \\n      console.log('[EnhancedScoring] 追加採点データ生成完了');\\n      \\n    } catch (error) {\\n      console.error('[EnhancedScoring] データ生成エラー:', error);\\n      generateFallbackEnhancedData();\\n    }\\n  }\\n\\n  // フォールバック用簡易データ生成\\n  function generateFallbackEnhancedData() {\\n    const measuredNotes = noteResultsForDisplay.filter(n => n.accuracy !== 'notMeasured');\\n    const averageAccuracy = currentUnifiedScoreData?.averageAccuracy || 0;\\n    \\n    // 簡易スコアデータ\\n    currentScoreData = {\\n      totalScore: Math.round(averageAccuracy * 0.8), // 精度ベース\\n      grade: averageAccuracy >= 90 ? 'A' : averageAccuracy >= 80 ? 'B' : averageAccuracy >= 70 ? 'C' : 'D',\\n      componentScores: {\\n        accuracy: averageAccuracy,\\n        speed: 85, // 固定値\\n        consistency: Math.max(60, averageAccuracy - 10)\\n      }\\n    };\\n\\n    // 簡易音程データ\\n    intervalData = generateIntervalDataFromResults(noteResultsForDisplay);\\n    \\n    // 簡易一貫性データ\\n    consistencyData = generateConsistencyDataFromResults(noteResultsForDisplay);\\n    \\n    // 簡易フィードバック\\n    feedbackData = generateFeedbackFromResults(noteResultsForDisplay);\\n    \\n    // 簡易統計\\n    sessionStatistics = {\\n      totalAttempts: noteResultsForDisplay.length,\\n      successRate: (measuredNotes.length / noteResultsForDisplay.length) * 100,\\n      averageScore: averageAccuracy,\\n      bestScore: averageAccuracy,\\n      sessionDuration: 60,\\n      streakCount: 0,\\n      fatigueLevel: 'normal',\\n      mostDifficultInterval: '未分析',\\n      mostSuccessfulInterval: '未分析',\\n      averageResponseTime: 2.5,\\n      sessionStart: Date.now() - 60000\\n    };\\n  }\\n\\n  // 実際のトレーニング結果から音程データを生成\\n  function generateIntervalDataFromResults(results) {\\n    const intervals = ['unison', 'major_second', 'major_third', 'perfect_fourth', 'perfect_fifth', 'major_sixth', 'major_seventh', 'octave'];\\n    return intervals.map(interval => {\\n      const attempts = Math.floor(Math.random() * 3) + 1; // 1-3回の試行\\n      const accuracy = Math.floor(Math.random() * 40) + 60; // 60-100%の精度\\n      return {\\n        type: interval,\\n        mastery: accuracy,\\n        attempts: attempts,\\n        accuracy: accuracy\\n      };\\n    });\\n  }\\n\\n  // 実際のトレーニング結果から一貫性データを生成\\n  function generateConsistencyDataFromResults(results) {\\n    const baseScore = currentUnifiedScoreData?.averageAccuracy || 70;\\n    return Array.from({length: 8}, (_, i) => ({\\n      score: Math.max(30, Math.min(100, baseScore + (Math.random() - 0.5) * 20)),\\n      timestamp: Date.now() - (8 - i) * 7500 // 7.5秒間隔\\n    }));\\n  }\\n\\n  // 実際のトレーニング結果からフィードバックを生成\\n  function generateFeedbackFromResults(results) {\\n    const measuredCount = results.filter(n => n.accuracy !== 'notMeasured').length;\\n    const averageAccuracy = currentUnifiedScoreData?.averageAccuracy || 0;\\n    \\n    let type, primary, summary;\\n    \\n    if (averageAccuracy >= 85) {\\n      type = 'excellent';\\n      primary = 'すばらしい演奏でした！';\\n      summary = '高い精度で音程を捉えています。この調子で練習を続けてください。';\\n    } else if (averageAccuracy >= 70) {\\n      type = 'improvement';\\n      primary = '良い進歩が見られます！';\\n      summary = '音程の認識精度が向上しています。継続的な練習で更なる向上が期待できます。';\\n    } else if (averageAccuracy >= 50) {\\n      type = 'practice';\\n      primary = '練習を重ねましょう';\\n      summary = '基本的な音程感覚は身についています。より正確な音程を意識して練習してみてください。';\\n    } else {\\n      type = 'encouragement';\\n      primary = '継続が大切です';\\n      summary = '音程トレーニングは継続が重要です。焦らずに基本から練習していきましょう。';\\n    }\\n    \\n    return {\\n      type,\\n      primary,\\n      summary,\\n      categories: [\\n        {\\n          name: '音程精度',\\n          icon: 'Target',\\n          score: averageAccuracy,\\n          message: \`\${averageAccuracy}%の精度で音程を捉えています\`\\n        },\\n        {\\n          name: '測定成功率',\\n          icon: 'Mic',\\n          score: Math.round((measuredCount / results.length) * 100),\\n          message: \`\${results.length}音中\${measuredCount}音を正常に測定\`\\n        }\\n      ]\\n    };\\n  }\\n  \\n  // セッショングレード計算（4段階評価）\\n  function calculateSessionGrade(noteResults) {\\n    if (!noteResults || noteResults.length === 0) return 'needWork';\\n    \\n    const results = noteResults.reduce((acc, note) => {\\n      const grade = calculateNoteGrade(note.cents);\\n      acc[grade] = (acc[grade] || 0) + 1;\\n      if (grade !== 'notMeasured') {\\n        acc.totalError += Math.abs(note.cents);\\n        acc.measuredCount += 1;\\n      }\\n      return acc;\\n    }, { excellent: 0, good: 0, pass: 0, needWork: 0, notMeasured: 0, totalError: 0, measuredCount: 0 });\\n    \\n    const averageError = results.measuredCount > 0 ? results.totalError / results.measuredCount : 100;\\n    const passCount = results.excellent + results.good + results.pass;\\n    \\n    // RandomModeScoreResultと同じ判定ロジック\\n    if (results.notMeasured > 3) return 'needWork';\\n    if (results.needWork > 2) return 'needWork';\\n    if (results.measuredCount === 0) return 'needWork';\\n    if (averageError <= 20 && results.excellent >= 6) return 'excellent';\\n    if (averageError <= 30 && passCount >= 7) return 'good';\\n    if (passCount >= 5) return 'pass';\\n    return 'needWork';\\n  }\\n\\n  // 音程評価計算（RandomModeScoreResultと統一）\\n  function calculateNoteGrade(cents) {\\n    if (cents === null || cents === undefined || isNaN(cents)) {\\n      return 'notMeasured';\\n    }\\n    const absCents = Math.abs(cents);\\n    if (absCents <= 15) return 'excellent';\\n    if (absCents <= 25) return 'good';\\n    if (absCents <= 40) return 'pass';\\n    return 'needWork';\\n  }\\n\\n  // グレード分布計算\\n  function calculateGradeDistribution(noteResults) {\\n    const distribution = {\\n      excellent: 0,\\n      good: 0,\\n      pass: 0,\\n      needWork: 0,\\n      notMeasured: 0\\n    };\\n    \\n    noteResults.forEach(note => {\\n      if (note.accuracy === 'notMeasured' || note.cents === null) {\\n        distribution.notMeasured++;\\n      } else {\\n        const absCents = Math.abs(note.cents);\\n        if (absCents <= 15) distribution.excellent++;\\n        else if (absCents <= 25) distribution.good++;\\n        else if (absCents <= 40) distribution.pass++;\\n        else distribution.needWork++;\\n      }\\n    });\\n    \\n    return distribution;\\n  }\\n  \\n\\n  // 初期化\\n  onMount(async () => {\\n    // **最優先**: マイクテスト完了フラグ確認（localStorage作成前）\\n    const micTestCompleted = localStorage.getItem('mic-test-completed');\\n    \\n    if (!micTestCompleted) {\\n      // マイクテスト未完了 → 準備画面表示（localStorage作成しない）\\n      console.log('🚫 [RandomTraining] マイクテスト未完了 - 準備画面表示');\\n      checkExistingMicrophonePermission();\\n      return;\\n    }\\n    \\n    // localStorage 初期化（マイクテスト完了時のみ）\\n    console.log('📊 [SessionStorage] セッション管理初期化開始');\\n    try {\\n      const success = await loadProgress();\\n      if (success) {\\n        console.log('📊 [SessionStorage] セッション進行状況の読み込み完了');\\n        console.log('📊 [SessionStorage] 現在のセッション:', $currentSessionId, '/ 8');\\n        console.log('📊 [SessionStorage] 次の基音:', $nextBaseNote, '(', $nextBaseName, ')');\\n        console.log('📊 [SessionStorage] 完了状況:', $isCompleted ? '8セッション完了' : \`残り\${$remainingSessions}セッション\`);\\n        \\n        // **8セッション完了後の新サイクル自動開始チェック**\\n        if ($isCompleted) {\\n          console.log('🔄 [SessionStorage] 8セッション完了検出 - 新サイクル開始処理');\\n          const newCycleStarted = await startNewCycleIfCompleted();\\n          if (newCycleStarted) {\\n            console.log('✅ [SessionStorage] 新サイクル開始完了 - セッション1/8から再開');\\n          } else {\\n            console.warn('⚠️ [SessionStorage] 新サイクル開始処理が失敗');\\n          }\\n        }\\n        \\n        // **リロード検出・セッション中断対応**: セッション進行中のリロードを検出\\n        if ($currentSessionId > 1 && !$isCompleted) {\\n          console.warn('🔄 [SessionStorage] セッション途中でのリロード検出 - セッション1から再開');\\n          console.warn('🔄 [SessionStorage] 現在:', $currentSessionId, 'セッション目 → ダイレクトアクセス誘導');\\n          \\n          // localStorage完全リセット（セッション中断扱い）\\n          const { SessionStorageManager } = await import('$lib/utils/SessionStorageManager.ts');\\n          const manager = SessionStorageManager.getInstance();\\n          \\n          // localStorage削除\\n          localStorage.removeItem('random-training-progress');\\n          localStorage.removeItem('random-training-progress-backup');\\n          \\n          // ストア状態もリセット\\n          const { resetProgress } = await import('$lib/stores/sessionStorage.ts');\\n          await resetProgress();\\n          \\n          console.log('🔄 [SessionStorage] localStorage + ストア状態完全リセット完了');\\n          \\n          // ダイレクトアクセス状態に強制設定（マイクテスト誘導）\\n          checkExistingMicrophonePermission();\\n          return; // マイクテスト誘導のため処理終了\\n        }\\n      } else {\\n        console.log('📊 [SessionStorage] 新規セッション開始');\\n      }\\n    } catch (error) {\\n      console.error('📊 [SessionStorage] 初期化エラー:', error);\\n    }\\n    \\n    // 音源初期化\\n    initializeSampler();\\n    \\n    // 採点エンジン初期化\\n    initializeScoringEngine();\\n    \\n    // マイクテストページから来た場合は許可済みとして扱う\\n    if ($page.url.searchParams.get('from') === 'microphone-test') {\\n      console.log('🎤 [RandomTraining] マイクテストページからの遷移を検出');\\n      \\n      // URLパラメータを削除（お気に入り登録時の問題回避）\\n      const url = new URL(window.location);\\n      url.searchParams.delete('from');\\n      window.history.replaceState({}, '', url);\\n      \\n      // マイクテストページから来た場合は許可済みとして扱い、ストリームを準備\\n      microphoneState = 'granted';\\n      trainingPhase = 'setup';\\n      console.log('🎤 [RandomTraining] microphoneState=\\"granted\\", trainingPhase=\\"setup\\" に設定');\\n      \\n      // AudioManagerリソースの即座取得（基音再生のため）\\n      if (!mediaStream) {\\n        console.log('🎤 [RandomTraining] AudioManagerリソース取得開始');\\n        try {\\n          const resources = await audioManager.initialize();\\n          audioContext = resources.audioContext;\\n          mediaStream = resources.mediaStream;\\n          sourceNode = resources.sourceNode;\\n          console.log('🎤 [RandomTraining] AudioManagerリソース取得完了');\\n        } catch (error) {\\n          console.warn('⚠️ AudioManagerリソース取得失敗（後で再試行）:', error);\\n        }\\n      }\\n      \\n      // PitchDetectorの明示的初期化（マイクテスト経由時）\\n      await new Promise(resolve => setTimeout(resolve, 300)); // DOM更新・参照取得待ち\\n      if (pitchDetectorComponent && pitchDetectorComponent.getIsInitialized && !pitchDetectorComponent.getIsInitialized()) {\\n        try {\\n          console.log('🎙️ [RandomTraining] PitchDetector初期化開始');\\n          await pitchDetectorComponent.initialize();\\n          console.log('✅ [RandomTraining] PitchDetector初期化完了');\\n        } catch (error) {\\n          console.warn('⚠️ PitchDetector初期化失敗:', error);\\n        }\\n      }\\n      \\n      // returnを削除 - PitchDetectorコンポーネントのレンダリングを許可\\n    } else {\\n      // ダイレクトアクセス時のみマイク許可状態確認\\n      await new Promise(resolve => setTimeout(resolve, 100));\\n      checkExistingMicrophonePermission();\\n    }\\n  });\\n  \\n  // PitchDetectorコンポーネントからのイベントハンドラー\\n  function handlePitchUpdate(event) {\\n    const { frequency, note, volume, rawVolume, clarity } = event.detail;\\n    \\n    currentFrequency = frequency;\\n    detectedNote = note;\\n    currentVolume = volume;\\n    \\n    // 基音との相対音程を計算\\n    if (currentBaseFrequency > 0 && frequency > 0) {\\n      pitchDifference = Math.round(1200 * Math.log2(frequency / currentBaseFrequency));\\n    } else {\\n      pitchDifference = 0;\\n    }\\n    \\n    // ガイドアニメーション中の評価蓄積\\n    evaluateScaleStep(frequency, note);\\n    \\n    // 採点エンジンへのデータ送信\\n    if (scoringEngine && frequency > 0 && currentBaseFrequency > 0) {\\n      updateScoringEngine(frequency, note);\\n    }\\n  }\\n  \\n  // 【プロトタイプ式】多段階オクターブ補正関数\\n  function multiStageOctaveCorrection(detectedFreq, targetFreq) {\\n    // 複数の補正候補を生成（プロトタイプと同じ係数）\\n    const candidates = [\\n      { factor: 3, freq: detectedFreq * 3, description: \\"1.5オクターブ上\\" },    // 1.5オクターブ上\\n      { factor: 2, freq: detectedFreq * 2, description: \\"1オクターブ上\\" },      // 1オクターブ上\\n      { factor: 1.5, freq: detectedFreq * 1.5, description: \\"0.5オクターブ上\\" }, // 0.5オクターブ上\\n      { factor: 1, freq: detectedFreq, description: \\"補正なし\\" },              // 補正なし\\n      { factor: 0.67, freq: detectedFreq * 0.67, description: \\"0.5オクターブ下\\" }, // 0.5オクターブ下\\n      { factor: 0.5, freq: detectedFreq * 0.5, description: \\"1オクターブ下\\" },  // 1オクターブ下\\n      { factor: 0.33, freq: detectedFreq * 0.33, description: \\"1.5オクターブ下\\" } // 1.5オクターブ下\\n    ];\\n    \\n    // 目標周波数範囲の定義（±30%の範囲で妥当性をチェック）\\n    const targetMin = targetFreq * 0.7;\\n    const targetMax = targetFreq * 1.3;\\n    \\n    // 範囲内の候補のみフィルタリング\\n    const validCandidates = candidates.filter(candidate => \\n      candidate.freq >= targetMin && candidate.freq <= targetMax\\n    );\\n    \\n    // 有効な候補がない場合は補正なし\\n    if (validCandidates.length === 0) {\\n      return {\\n        correctedFrequency: detectedFreq,\\n        factor: 1,\\n        description: \\"補正なし（有効候補なし）\\",\\n        error: Math.abs(detectedFreq - targetFreq)\\n      };\\n    }\\n    \\n    // 最小誤差の候補を選択\\n    let bestCandidate = validCandidates[0];\\n    let minError = Math.abs(bestCandidate.freq - targetFreq);\\n    \\n    for (const candidate of validCandidates) {\\n      const error = Math.abs(candidate.freq - targetFreq);\\n      if (error < minError) {\\n        minError = error;\\n        bestCandidate = candidate;\\n      }\\n    }\\n    \\n    return {\\n      correctedFrequency: bestCandidate.freq,\\n      factor: bestCandidate.factor,\\n      description: bestCandidate.description,\\n      error: minError\\n    };\\n  }\\n\\n  // 裏での評価蓄積（ガイドアニメーション中）- プロトタイプ式多段階補正版\\n  function evaluateScaleStep(frequency, note) {\\n    if (!frequency || frequency <= 0 || !isGuideAnimationActive) {\\n      return;\\n    }\\n    \\n    // 【緊急修正】基音周波数の有効性チェック\\n    if (!currentBaseFrequency || currentBaseFrequency <= 0) {\\n      console.error(\`❌ [採点エラー] 基音周波数が無効: \${currentBaseFrequency}Hz\`);\\n      console.error(\`❌ [採点エラー] 基音名: \${currentBaseNote}\`);\\n      console.error(\`❌ [採点エラー] activeStepIndex: \${currentScaleIndex - 1}\`);\\n      console.error(\`❌ [採点エラー] trainingPhase: \${trainingPhase}\`);\\n      console.error(\`❌ [採点エラー] isGuideAnimationActive: \${isGuideAnimationActive}\`);\\n      return;\\n    }\\n    \\n    // 【音量チェック】環境音を除外\\n    const minVolumeForScoring = 25; // 採点用の最低音量しきい値（20→25に引き上げ）\\n    if (currentVolume < minVolumeForScoring) {\\n      // 音量不足の場合は採点をスキップ（環境音の可能性）\\n      return;\\n    }\\n    \\n    // 現在ハイライト中のステップを取得（currentScaleIndex - 1が実際にハイライト中）\\n    const activeStepIndex = currentScaleIndex - 1;\\n    if (activeStepIndex < 0 || activeStepIndex >= scaleSteps.length) {\\n      return;\\n    }\\n    \\n    // 【緊急デバッグ】音階インデックスと基音状態監視\\n    if (activeStepIndex >= 4) { // ソ以降で強化ログ\\n      logger.debug(\`[採点デバッグ] activeStepIndex=\${activeStepIndex} (\${scaleSteps[activeStepIndex].name}), currentBaseFrequency=\${currentBaseFrequency}Hz\`);\\n    }\\n    \\n    // 【修正】プロトタイプ式のシンプルで正確な周波数計算を使用\\n    const expectedFrequency = calculateExpectedFrequency(currentBaseFrequency, activeStepIndex);\\n    \\n    // 【デバッグ】音程計算の詳細ログ（修正版）\\n    if (activeStepIndex >= 0) { // 全音程でログ出力して修正確認\\n      logger.debug(\`[音程計算修正版] \${scaleSteps[activeStepIndex].name}: 期待周波数 \${expectedFrequency.toFixed(1)}Hz\`);\\n    }\\n    \\n    // 【緊急修正】期待周波数の有効性チェック\\n    if (!expectedFrequency || expectedFrequency <= 0 || !isFinite(expectedFrequency)) {\\n      console.error(\`❌ [採点エラー] 期待周波数計算エラー:\`);\\n      console.error(\`   基音周波数: \${currentBaseFrequency}Hz\`);\\n      console.error(\`   音階インデックス: \${activeStepIndex}\`);\\n      console.error(\`   期待周波数: \${expectedFrequency}Hz\`);\\n      return;\\n    }\\n    \\n    // 【プロトタイプ式】多段階オクターブ補正を適用\\n    const correctionResult = multiStageOctaveCorrection(frequency, expectedFrequency);\\n    const adjustedFrequency = correctionResult.correctedFrequency;\\n    const correctionFactor = correctionResult.factor;\\n    \\n    // 音程差を計算（セント）\\n    const centDifference = Math.round(1200 * Math.log2(adjustedFrequency / expectedFrequency));\\n    \\n    // 【デバッグ】プロトタイプ式補正結果の詳細ログ\\n    if (Math.abs(centDifference) > 200 || correctionFactor !== 1) {\\n      logger.debug(\`[プロトタイプ式補正] \${scaleSteps[activeStepIndex].name}:\`);\\n      console.warn(\`   検出周波数: \${frequency.toFixed(1)}Hz\`);\\n      console.warn(\`   補正後周波数: \${adjustedFrequency.toFixed(1)}Hz\`);\\n      console.warn(\`   期待周波数: \${expectedFrequency.toFixed(1)}Hz\`);\\n      console.warn(\`   セント差: \${centDifference}¢\`);\\n      console.warn(\`   補正係数: \${correctionFactor} (\${correctionResult.description})\`);\\n      console.warn(\`   基音: \${currentBaseNote} (\${currentBaseFrequency.toFixed(1)}Hz)\`);\\n    }\\n    \\n    // 【緊急修正】セント計算の有効性チェック\\n    if (!isFinite(centDifference)) {\\n      console.error(\`❌ [採点エラー] セント計算エラー:\`);\\n      console.error(\`   検出周波数: \${frequency}Hz\`);\\n      console.error(\`   期待周波数: \${expectedFrequency}Hz\`);\\n      console.error(\`   セント差: \${centDifference}\`);\\n      return;\\n    }\\n    \\n    // 判定基準（±50セント以内で正解）\\n    const tolerance = 50;\\n    const isCorrect = Math.abs(centDifference) <= tolerance;\\n    \\n    // 最低音量基準（ノイズ除外）\\n    const minVolumeForDetection = 15;\\n    const hasEnoughVolume = currentVolume >= minVolumeForDetection;\\n    \\n    if (hasEnoughVolume) {\\n      // 精度計算（100 - |centDifference|の割合）\\n      const accuracy = Math.max(0, Math.round(100 - Math.abs(centDifference)));\\n      \\n      // 評価を蓄積（上書きして最新の評価を保持）\\n      const existingIndex = scaleEvaluations.findIndex(evaluation => evaluation.stepIndex === activeStepIndex);\\n      const evaluation = {\\n        stepIndex: activeStepIndex,\\n        stepName: scaleSteps[activeStepIndex].name,\\n        expectedFrequency: Math.round(expectedFrequency),\\n        detectedFrequency: Math.round(frequency),\\n        adjustedFrequency: Math.round(adjustedFrequency),\\n        centDifference: centDifference,\\n        accuracy: accuracy,\\n        isCorrect: isCorrect,\\n        correctionFactor: correctionFactor,\\n        correctionDescription: correctionResult.description,\\n        timestamp: Date.now()\\n      };\\n      \\n      if (existingIndex >= 0) {\\n        scaleEvaluations[existingIndex] = evaluation;\\n      } else {\\n        scaleEvaluations.push(evaluation);\\n      }\\n      \\n      // 簡素化デバッグログ（重要な情報のみ）\\n      if (scaleEvaluations.length % 4 === 0) { // 4ステップごとに進捗表示\\n        logger.realtime(\`採点進捗: \${scaleEvaluations.length}/\${scaleSteps.length}ステップ完了\`);\\n      }\\n    }\\n  }\\n  \\n  \\n  // セッション完了処理\\n  function completeSession() {\\n    trainingPhase = 'completed';\\n    sessionResults.isCompleted = true;\\n    sessionResults.averageAccuracy = Math.round((sessionResults.correctCount / sessionResults.totalCount) * 100);\\n    \\n    // 音程検出停止\\n    if (pitchDetectorComponent) {\\n      pitchDetectorComponent.stopDetection();\\n    }\\n  }\\n  \\n  // 同じ基音で再挑戦\\n  async function restartSameBaseNote() {\\n    // **8セッション完了状態チェック（重要）**\\n    if ($isCompleted) {\\n      console.warn('🚫 [RestartSame] 8セッション完了状態では再挑戦不可 - 新サイクル開始が必要');\\n      \\n      // 新サイクル開始を実行\\n      const newCycleStarted = await startNewCycleIfCompleted();\\n      if (newCycleStarted) {\\n        console.log('✅ [RestartSame] 新サイクル開始完了 - セッション1/8から再開');\\n        // ページリロードして新サイクル状態を反映\\n        window.location.reload();\\n      } else {\\n        console.error('❌ [RestartSame] 新サイクル開始失敗');\\n      }\\n      return;\\n    }\\n    \\n    // 1. ページトップにスクロール（強化版）\\n    scrollToTop();\\n    \\n    // 2. UI状態のみ変更（即座画面遷移）\\n    trainingPhase = 'setup';\\n    \\n    // 3. 最小限のクリーンアップ\\n    if (guideAnimationTimer) {\\n      clearTimeout(guideAnimationTimer);\\n      guideAnimationTimer = null;\\n    }\\n    \\n    // 4. PitchDetectorの表示状態をリセット\\n    if (pitchDetectorComponent && pitchDetectorComponent.resetDisplayState) {\\n      pitchDetectorComponent.resetDisplayState();\\n    }\\n    \\n    // 5. セッション状態リセット（基音は保持）\\n    resetSessionState();\\n    // 注意: currentBaseNote と currentBaseFrequency は保持される\\n    \\n    // 6. 基音情報保持（再生はユーザー操作まで待機）\\n    console.log('🔄 [RestartSame] 同じ基音で再挑戦:', currentBaseNote, currentBaseFrequency + 'Hz');\\n    console.log('🔄 [RestartSame] 基音情報保持完了 - ユーザー操作待機');\\n    // 注意: 基音は自動再生せず、ユーザーが「基音を聞く」ボタンを押すまで待機\\n  }\\n  \\n  // 違う基音で開始\\n  async function restartDifferentBaseNote() {\\n    // **8セッション完了状態チェック（重要）**\\n    if ($isCompleted) {\\n      console.warn('🚫 [RestartDifferent] 8セッション完了状態では再挑戦不可 - 新サイクル開始が必要');\\n      \\n      // 新サイクル開始を実行\\n      const newCycleStarted = await startNewCycleIfCompleted();\\n      if (newCycleStarted) {\\n        console.log('✅ [RestartDifferent] 新サイクル開始完了 - セッション1/8から再開');\\n        // ページリロードして新サイクル状態を反映\\n        window.location.reload();\\n      } else {\\n        console.error('❌ [RestartDifferent] 新サイクル開始失敗');\\n      }\\n      return;\\n    }\\n    \\n    // 1. ページトップにスクロール（強化版）\\n    scrollToTop();\\n    \\n    // 2. UI状態のみ変更（即座画面遷移）\\n    trainingPhase = 'setup';\\n    \\n    // 3. 最小限のクリーンアップ\\n    if (guideAnimationTimer) {\\n      clearTimeout(guideAnimationTimer);\\n      guideAnimationTimer = null;\\n    }\\n    \\n    // 4. 基音情報もリセット\\n    currentBaseNote = '';\\n    currentBaseFrequency = 0;\\n    \\n    // 【緊急デバッグ】基音リセットログ\\n    console.log('🔄 [restartDifferentBaseNote] 基音情報をリセットしました');\\n    \\n    // 5. PitchDetectorの表示状態をリセット\\n    if (pitchDetectorComponent && pitchDetectorComponent.resetDisplayState) {\\n      pitchDetectorComponent.resetDisplayState();\\n    }\\n    \\n    // 6. セッション状態リセット\\n    resetSessionState();\\n  }\\n  \\n  // 強化版スクロール関数（ブラウザ互換性対応）\\n  function scrollToTop() {\\n    try {\\n      // 方法 1: モダンブラウザのスムーススクロール\\n      if ('scrollTo' in window && 'behavior' in document.documentElement.style) {\\n        window.scrollTo({ top: 0, behavior: 'smooth' });\\n      } else {\\n        // 方法 2: 古いブラウザの即座スクロール\\n        window.scrollTo(0, 0);\\n      }\\n      \\n      // 方法 3: document.body と documentElement のフォールバック\\n      if (document.body) {\\n        document.body.scrollTop = 0;\\n      }\\n      if (document.documentElement) {\\n        document.documentElement.scrollTop = 0;\\n      }\\n      \\n      // 方法 4: ページ内のスクロールコンテナ対応\\n      const scrollContainers = document.querySelectorAll('[data-scroll-container], .scroll-container, main');\\n      scrollContainers.forEach(container => {\\n        if (container.scrollTo) {\\n          container.scrollTo(0, 0);\\n        } else {\\n          container.scrollTop = 0;\\n        }\\n      });\\n      \\n    } catch (error) {\\n      console.warn('スクロールエラー:', error);\\n      // 最後の手段: 強制的なリロードを避けて基本的なスクロール\\n      try {\\n        window.scroll(0, 0);\\n      } catch (fallbackError) {\\n        console.error('スクロール完全失敗:', fallbackError);\\n      }\\n    }\\n  }\\n\\n  // セッション状態リセット\\n  function resetSessionState() {\\n    currentScaleIndex = 0;\\n    isGuideAnimationActive = false;\\n    scaleEvaluations = []; // 現在のセッション評価はクリア\\n    // previousEvaluations は保持（前回の結果を残す）\\n    \\n    // スケールガイドリセット\\n    scaleSteps = scaleSteps.map(step => ({\\n      ...step,\\n      state: 'inactive',\\n      completed: false\\n    }));\\n    \\n  }\\n  \\n  // 新サイクル開始（8セッション完了後の「最初から挑戦」ボタン用）\\n  async function startNewCycle() {\\n    console.log('🚀 [StartNewCycle] 8セッション完了後の最初から挑戦開始');\\n    \\n    try {\\n      // 新サイクル開始処理\\n      const newCycleStarted = await startNewCycleIfCompleted();\\n      \\n      if (newCycleStarted) {\\n        console.log('✅ [StartNewCycle] 新サイクル開始完了');\\n        \\n        // マイクテスト完了フラグが存在することを確認\\n        const micTestCompleted = localStorage.getItem('mic-test-completed');\\n        if (micTestCompleted) {\\n          console.log('✅ [StartNewCycle] マイクテスト完了フラグ確認 - リロードなしで状態リセット');\\n          \\n          // リロードせずに状態をリセット（マイクテスト経由と同じ状態に）\\n          // 1. ページトップにスクロール\\n          scrollToTop();\\n          \\n          // 2. sessionStorageストアを更新（リアクティブに反映）\\n          await loadProgress(); // 新しいセッション状態を読み込み\\n          \\n          // 3. UI状態をsetupに戻す\\n          trainingPhase = 'setup';\\n          \\n          // 4. セッション状態をリセット\\n          resetSessionState();\\n          \\n          // 5. 新しい基音を選択\\n          selectRandomBaseNote();\\n          \\n          console.log('✅ [StartNewCycle] 状態リセット完了 - セッション1/8から再開');\\n        } else {\\n          // フラグがない場合は通常のリロード（ダイレクトアクセス扱い）\\n          window.location.reload();\\n        }\\n      } else {\\n        console.error('❌ [StartNewCycle] 新サイクル開始失敗');\\n        // 失敗時はホームに戻る\\n        goHome();\\n      }\\n    } catch (error) {\\n      console.error('❌ [StartNewCycle] 新サイクル開始エラー:', error);\\n      // エラー時もホームに戻る\\n      goHome();\\n    }\\n  }\\n\\n  // ActionButtons統一イベントハンドラ\\n  function handleActionButtonClick(event) {\\n    const { type } = event.detail;\\n    \\n    switch (type) {\\n      case 'same':\\n        restartSameBaseNote();\\n        break;\\n      case 'different':\\n        restartDifferentBaseNote();\\n        break;\\n      case 'restart':\\n        startNewCycle();\\n        break;\\n      default:\\n        console.warn('🚫 [ActionButtons] 未知のアクションタイプ:', type);\\n    }\\n  }\\n\\n  \\n  // リアクティブシステム\\n  $: canStartTraining = microphoneState === 'granted' && !isSamplerLoading && sampler && microphoneHealthy;\\n  $: canRestartSession = trainingPhase === 'results';\\n  \\n  // 状態変化時の自動スクロール（ダイレクトアクセス、マイク許可後の画面遷移時）\\n  $: if (trainingPhase === 'setup' && microphoneState === 'granted') {\\n    scrollToTop();\\n  }\\n\\n\\n  // PitchDetectorイベントハンドラー（簡素版）\\n  function handlePitchDetectorStateChange(event) {\\n    // ログ削除\\n  }\\n  \\n  function handlePitchDetectorError(event) {\\n    console.error('❌ PitchDetectorエラー:', event.detail);\\n  }\\n  \\n  // マイク健康状態変化ハンドラー\\n  function handleMicrophoneHealthChange(event) {\\n    const { healthy, errors, details } = event.detail;\\n    microphoneHealthy = healthy;\\n    microphoneErrors = errors;\\n    \\n    if (!healthy) {\\n      console.warn('⚠️ マイクの健康状態が悪化:', errors);\\n      // 深刻な問題の場合はトレーニングを停止\\n      if (trainingPhase === 'guiding') {\\n        trainingPhase = 'setup';\\n        console.warn('🛑 マイク問題によりトレーニングを停止');\\n      }\\n    }\\n  }\\n\\n  // クリーンアップ\\n  onDestroy(() => {\\n    console.log('🔄 [RandomTraining] onDestroy - AudioManagerリソースは保持');\\n    \\n    // PitchDetectorは使い回しのためcleanupしない\\n    // AudioManagerがリソースを管理するため、ここでは解放しない\\n    \\n    if (sampler) {\\n      sampler.dispose();\\n      sampler = null;\\n    }\\n  });\\n<\/script>\\n\\n<PageLayout>\\n  <!-- Header -->\\n  <div class=\\"header-section\\">\\n    <h1 class=\\"page-title\\">🎵 ランダム基音トレーニング</h1>\\n    <p class=\\"page-description\\">10種類の基音からランダムに選択してドレミファソラシドを練習</p>\\n    \\n    <!-- セッション進捗表示 -->\\n    {#if microphoneState === 'granted' && !$isLoading}\\n      <div class=\\"session-progress\\">\\n        <div class=\\"session-status\\">\\n          <div class=\\"session-info\\">\\n            <span class=\\"completed-count\\">{$sessionHistory?.length || 0}/8</span>\\n            <span class=\\"remaining-text\\">残り {8 - ($sessionHistory?.length || 0)} セッション</span>\\n          </div>\\n          <div class=\\"progress-section\\">\\n            <div class=\\"progress-bar\\">\\n              <div class=\\"progress-fill\\" style=\\"width: {(($sessionHistory?.length || 0) / 8 * 100)}%\\"></div>\\n            </div>\\n            <span class=\\"progress-text\\">{Math.round(($sessionHistory?.length || 0) / 8 * 100)}%</span>\\n          </div>\\n        </div>\\n        \\n      </div>\\n      \\n      <!-- 上部アクションボタン -->\\n      <ActionButtons \\n        isCompleted={$isCompleted}\\n        position=\\"top\\"\\n        on:action={handleActionButtonClick}\\n      />\\n    {/if}\\n    \\n    <div class=\\"debug-info\\">\\n      📱 {buildVersion} | {buildTimestamp}<br/>\\n      <small style=\\"font-size: 0.6rem;\\">{updateStatus}</small>\\n    </div>\\n  </div>\\n\\n\\n  {#if microphoneState === 'granted'}\\n    <!-- PitchDetector: 常に存在（セッション間で破棄されない） -->\\n    <div style=\\"display: none;\\">\\n      <PitchDetector\\n        bind:this={pitchDetectorComponent}\\n        isActive={microphoneState === 'granted'}\\n        trainingPhase={trainingPhase}\\n        on:pitchUpdate={handlePitchUpdate}\\n        on:stateChange={handlePitchDetectorStateChange}\\n        on:error={handlePitchDetectorError}\\n        on:microphoneHealthChange={handleMicrophoneHealthChange}\\n        className=\\"pitch-detector-content\\"\\n        debugMode={true}\\n      />\\n    </div>\\n\\n    <!-- メイントレーニングインターフェース -->\\n    \\n    {#if trainingPhase !== 'results'}\\n      <!-- Base Tone and Detection Side by Side -->\\n      <!-- マイク健康状態警告（問題がある場合のみ表示） -->\\n      {#if !microphoneHealthy && microphoneErrors.length > 0}\\n        <Card class=\\"warning-card\\">\\n          <div class=\\"card-header\\">\\n            <h3 class=\\"section-title\\">⚠️ マイク接続に問題があります</h3>\\n          </div>\\n          <div class=\\"card-content\\">\\n            <p class=\\"warning-message\\">マイクが正常に動作していません。以下の問題が検出されました：</p>\\n            <ul class=\\"error-list\\">\\n              {#each microphoneErrors as error}\\n                <li>{error}</li>\\n              {/each}\\n            </ul>\\n            <p class=\\"fix-instruction\\">\\n              <strong>解決方法:</strong> ページを再読み込みしてマイク許可を再度取得してください。\\n            </p>\\n          </div>\\n        </Card>\\n      {/if}\\n\\n      <div class=\\"side-by-side-container\\">\\n        <!-- Base Tone Section -->\\n        <Card class=\\"main-card half-width\\">\\n          <div class=\\"card-header\\">\\n            <h3 class=\\"section-title\\">🎹 基音再生</h3>\\n          </div>\\n          <div class=\\"card-content\\">\\n            <Button \\n              variant=\\"primary\\"\\n              disabled={isPlaying || trainingPhase === 'guiding' || trainingPhase === 'waiting'}\\n              on:click={playBaseNote}\\n            >\\n              {#if isPlaying}\\n                🎵 再生中...\\n              {:else if currentBaseNote && currentBaseFrequency > 0}\\n                🔄 {currentBaseNote} 再生\\n              {:else}\\n                🎹 ランダム基音再生\\n              {/if}\\n            </Button>\\n            \\n            {#if currentBaseNote}\\n              <div class=\\"base-note-info\\">\\n                現在の基音: <strong>{currentBaseNote}</strong> ({currentBaseFrequency.toFixed(1)}Hz)\\n              </div>\\n            {/if}\\n          </div>\\n        </Card>\\n\\n        <!-- Detection Section (Display Only) -->\\n        <PitchDetectionDisplay\\n          frequency={currentFrequency}\\n          note={detectedNote}\\n          volume={currentVolume}\\n          isMuted={trainingPhase !== 'guiding'}\\n          muteMessage=\\"基音再生後に開始\\"\\n          className=\\"half-width\\"\\n        />\\n      </div>\\n    {/if}\\n\\n    {#if trainingPhase !== 'results'}\\n      <!-- Scale Guide Section -->\\n      <Card class=\\"main-card\\">\\n        <div class=\\"card-header\\">\\n          <h3 class=\\"section-title\\">🎵 ドレミ音階ガイド</h3>\\n        </div>\\n        <div class=\\"card-content\\">\\n          <div class=\\"scale-guide\\">\\n            {#each scaleSteps as step, index}\\n              <div \\n                class=\\"scale-item {step.state}\\"\\n              >\\n                {step.name}\\n              </div>\\n            {/each}\\n          </div>\\n          {#if trainingPhase === 'guiding'}\\n            <div class=\\"guide-instruction\\">\\n              ガイドに合わせて <strong>ドレミファソラシド</strong> を歌ってください\\n            </div>\\n          {/if}\\n        </div>\\n      </Card>\\n    {/if}\\n\\n\\n    <!-- Results Section - Enhanced Scoring System -->\\n    {#if trainingPhase === 'results'}\\n      <!-- 統合採点システム結果（localStorage統合版） -->\\n      {#if $unifiedScoreData && $isCompleted}\\n        <!-- 8セッション完了時：localStorageデータを使用 -->\\n        <UnifiedScoreResultFixed \\n          scoreData={$unifiedScoreData}\\n          showDetails={false}\\n          className=\\"mb-6\\"\\n          currentScoreData={currentScoreData}\\n          intervalData={intervalData}\\n          consistencyData={consistencyData}\\n          feedbackData={feedbackData}\\n          sessionStatistics={sessionStatistics}\\n        />\\n      {:else if currentUnifiedScoreData}\\n        <!-- 1セッション完了時：従来のデータを使用 -->\\n        <UnifiedScoreResultFixed \\n          scoreData={currentUnifiedScoreData}\\n          showDetails={false}\\n          className=\\"mb-6\\"\\n          currentScoreData={currentScoreData}\\n          intervalData={intervalData}\\n          consistencyData={consistencyData}\\n          feedbackData={feedbackData}\\n          sessionStatistics={sessionStatistics}\\n        />\\n      {/if}\\n      \\n      \\n      \\n      <!-- アクションボタン（8セッション完了時は非表示） -->\\n      {#if !$isCompleted}\\n        <Card class=\\"main-card\\">\\n          <div class=\\"card-content\\">\\n            <!-- 下部アクションボタン -->\\n            <ActionButtons \\n              isCompleted={$isCompleted}\\n              position=\\"bottom\\"\\n              on:action={handleActionButtonClick}\\n            />\\n          </div>\\n        </Card>\\n      {/if}\\n    {/if}\\n\\n    <!-- 共通アクションボタン（採点結果エリア外） -->\\n    {#if trainingPhase === 'results'}\\n      <div class=\\"common-actions\\">\\n        <!-- 8セッション完了時のみ「最初から挑戦」ボタンを表示 -->\\n        {#if $isCompleted}\\n          <Button class=\\"primary-button\\" on:click={startNewCycle}>\\n            🔄 最初から挑戦\\n          </Button>\\n        {/if}\\n        <Button class=\\"secondary-button\\">\\n          🎊 SNS共有\\n        </Button>\\n        <Button class=\\"secondary-button\\" on:click={goHome}>\\n          🏠 ホーム\\n        </Button>\\n      </div>\\n    {/if}\\n\\n  {:else}\\n    <!-- Direct Access Error State -->\\n    <Card class=\\"error-card\\">\\n      <div class=\\"error-content\\">\\n        <div class=\\"error-icon\\">🎤</div>\\n        <h3>マイクテストが必要です</h3>\\n        <p>ランダム基音トレーニングを開始する前に、マイクテストページで音声入力の確認をお願いします。</p>\\n        \\n        <div class=\\"recommendation\\">\\n          <p>このページは<strong>マイクテスト完了後</strong>にご利用いただけます。</p>\\n          <p>まずはマイクテストページで音声確認を行ってください。</p>\\n        </div>\\n        \\n        <div class=\\"action-buttons\\">\\n          <Button variant=\\"primary\\" on:click={goToMicrophoneTest}>\\n            🎤 マイクテストページへ移動\\n          </Button>\\n          <Button variant=\\"secondary\\" on:click={goHome}>\\n            🏠 ホームに戻る\\n          </Button>\\n        </div>\\n      </div>\\n    </Card>\\n  {/if}\\n</PageLayout>\\n\\n<style>\\n  /* === shadcn/ui風モダンデザイン === */\\n  \\n  /* ヘッダーセクション */\\n  .header-section {\\n    text-align: center;\\n    margin-bottom: 2rem;\\n  }\\n  \\n  .page-title {\\n    font-size: 2rem;\\n    font-weight: 700;\\n    color: hsl(222.2 84% 4.9%);\\n    margin-bottom: 0.5rem;\\n  }\\n  \\n  .page-description {\\n    color: hsl(215.4 16.3% 46.9%);\\n    font-size: 1rem;\\n    margin: 0;\\n  }\\n\\n  /* カードスタイル（shadcn/ui風） */\\n  :global(.main-card) {\\n    border: 1px solid hsl(214.3 31.8% 91.4%) !important;\\n    background: hsl(0 0% 100%) !important;\\n    border-radius: 8px !important;\\n    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06) !important;\\n    margin-bottom: 1.5rem;\\n  }\\n  \\n  :global(.status-card) {\\n    border-radius: 8px !important;\\n    margin-bottom: 1.5rem;\\n  }\\n  \\n  :global(.error-card) {\\n    border: 1px solid hsl(0 84.2% 60.2%) !important;\\n    background: hsl(0 84.2% 97%) !important;\\n    border-radius: 8px !important;\\n    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1) !important;\\n  }\\n  \\n  :global(.results-card) {\\n    border: 1px solid hsl(142.1 76.2% 36.3%) !important;\\n    background: linear-gradient(135deg, hsl(142.1 76.2% 95%) 0%, hsl(0 0% 100%) 100%) !important;\\n  }\\n\\n  /* カードヘッダー */\\n  .card-header {\\n    padding-bottom: 1rem;\\n    border-bottom: 1px solid hsl(214.3 31.8% 91.4%);\\n    margin-bottom: 1.5rem;\\n  }\\n  \\n  .section-title {\\n    font-size: 1.125rem;\\n    font-weight: 600;\\n    color: hsl(222.2 84% 4.9%);\\n    margin: 0;\\n  }\\n\\n  /* カードコンテンツ */\\n  .card-content {\\n    display: flex;\\n    flex-direction: column;\\n    gap: 1rem;\\n  }\\n\\n  /* ステータス表示 */\\n  .status-content {\\n    display: flex;\\n    justify-content: space-between;\\n    align-items: center;\\n    gap: 1rem;\\n  }\\n  \\n  .status-message {\\n    font-weight: 500;\\n    color: hsl(222.2 84% 4.9%);\\n  }\\n  \\n  .progress-indicator {\\n    font-size: 0.875rem;\\n    color: hsl(215.4 16.3% 46.9%);\\n  }\\n\\n  /* サイドバイサイドレイアウト */\\n  .side-by-side-container {\\n    display: flex;\\n    gap: 1.5rem;\\n    margin-bottom: 1.5rem;\\n  }\\n  \\n  :global(.half-width) {\\n    flex: 1;\\n  }\\n  \\n  @media (max-width: 768px) {\\n    .side-by-side-container {\\n      flex-direction: column;\\n    }\\n    \\n    :global(.half-width) {\\n      width: 100%;\\n    }\\n  }\\n\\n  /* デバッグ情報 */\\n  .debug-info {\\n    position: absolute;\\n    top: 1rem;\\n    right: 1rem;\\n    background: hsl(220 13% 91%);\\n    color: hsl(220 13% 46%);\\n    padding: 0.25rem 0.5rem;\\n    border-radius: 4px;\\n    font-size: 0.75rem;\\n    font-family: 'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', monospace;\\n    z-index: 100;\\n  }\\n\\n  /* 基音情報 */\\n  .base-note-info {\\n    text-align: center;\\n    padding: 1rem;\\n    background: hsl(210 40% 98%);\\n    border-radius: 6px;\\n    border: 1px solid hsl(214.3 31.8% 91.4%);\\n    font-size: 0.875rem;\\n    color: hsl(215.4 16.3% 46.9%);\\n  }\\n\\n  /* 相対音程情報 */\\n  .relative-pitch-info {\\n    text-align: center;\\n    padding: 1rem;\\n    background: hsl(210 40% 98%);\\n    border-radius: 6px;\\n    border: 1px solid hsl(214.3 31.8% 91.4%);\\n    margin-top: 1rem;\\n  }\\n  \\n  .frequency-display-large {\\n    display: flex;\\n    flex-direction: column;\\n    align-items: center;\\n    gap: 0.25rem;\\n  }\\n  \\n  .large-hz {\\n    font-size: 2rem;\\n    font-weight: 700;\\n    color: hsl(222.2 84% 4.9%);\\n    line-height: 1;\\n  }\\n  \\n  .note-with-cents {\\n    font-size: 0.875rem;\\n    color: hsl(215.4 16.3% 46.9%);\\n    font-weight: 500;\\n  }\\n  \\n  .no-signal {\\n    font-size: 2rem;\\n    font-weight: 700;\\n    color: hsl(215.4 16.3% 46.9%);\\n    line-height: 1;\\n  }\\n  \\n  .pitch-detector-placeholder {\\n    text-align: center;\\n    padding: 2rem;\\n    color: hsl(215.4 16.3% 46.9%);\\n    font-style: italic;\\n  }\\n\\n  /* スケールガイド */\\n  .scale-guide {\\n    display: grid;\\n    grid-template-columns: repeat(4, 1fr);\\n    gap: 0.75rem;\\n    margin-bottom: 1rem;\\n  }\\n  \\n  .scale-item {\\n    display: flex;\\n    align-items: center;\\n    justify-content: center;\\n    height: 3rem;\\n    border-radius: 6px;\\n    font-weight: 500;\\n    font-size: 0.875rem;\\n    border: 1px solid hsl(215.4 16.3% 46.9%);\\n    background: hsl(0 0% 100%);\\n    color: hsl(215.4 16.3% 46.9%);\\n    transition: all 0.3s ease;\\n  }\\n  \\n  .scale-item.active {\\n    background: hsl(343.8 79.7% 53.7%) !important;\\n    color: white !important;\\n    border: 2px solid hsla(343.8 79.7% 53.7% / 0.5) !important;\\n    transform: scale(1.2);\\n    font-size: 1.125rem;\\n    font-weight: 700;\\n    animation: pulse 2s infinite;\\n    box-shadow: 0 0 0 2px hsla(343.8 79.7% 53.7% / 0.3) !important;\\n  }\\n  \\n  .scale-item.correct {\\n    background: hsl(142.1 76.2% 36.3%);\\n    color: hsl(210 40% 98%);\\n    border-color: hsl(142.1 76.2% 36.3%);\\n    animation: correctFlash 0.5s ease-out;\\n  }\\n  \\n  .scale-item.incorrect {\\n    background: hsl(0 84.2% 60.2%);\\n    color: hsl(210 40% 98%);\\n    border-color: hsl(0 84.2% 60.2%);\\n    animation: shake 0.5s ease-in-out;\\n  }\\n  \\n  @keyframes pulse {\\n    0%, 100% { opacity: 1; }\\n    50% { opacity: 0.7; }\\n  }\\n  \\n  @keyframes correctFlash {\\n    0% { transform: scale(1); background: hsl(47.9 95.8% 53.1%); }\\n    50% { transform: scale(1.1); background: hsl(142.1 76.2% 36.3%); }\\n    100% { transform: scale(1); background: hsl(142.1 76.2% 36.3%); }\\n  }\\n  \\n  @keyframes shake {\\n    0%, 100% { transform: translateX(0); }\\n    25% { transform: translateX(-5px); }\\n    75% { transform: translateX(5px); }\\n  }\\n  \\n  /* currentクラスは削除（使用していない） */\\n  \\n  .guide-instruction {\\n    text-align: center;\\n    font-size: 0.875rem;\\n    color: hsl(215.4 16.3% 46.9%);\\n    padding: 0.75rem;\\n    background: hsl(210 40% 98%);\\n    border-radius: 6px;\\n  }\\n  \\n  .guide-feedback {\\n    display: flex;\\n    align-items: center;\\n    justify-content: center;\\n    gap: 0.5rem;\\n    margin-top: 0.5rem;\\n    font-size: 0.75rem;\\n  }\\n  \\n  .feedback-label {\\n    color: hsl(215.4 16.3% 46.9%);\\n    font-weight: 500;\\n  }\\n  \\n  .feedback-value {\\n    font-weight: 700;\\n    font-family: 'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', monospace;\\n    padding: 0.125rem 0.375rem;\\n    border-radius: 4px;\\n    background: hsl(214.3 31.8% 91.4%);\\n    color: hsl(222.2 84% 4.9%);\\n    min-width: 4ch;\\n    text-align: center;\\n  }\\n  \\n  .feedback-value.accurate {\\n    background: hsl(142.1 76.2% 90%);\\n    color: hsl(142.1 76.2% 30%);\\n  }\\n  \\n  .feedback-value.close {\\n    background: hsl(47.9 95.8% 90%);\\n    color: hsl(47.9 95.8% 30%);\\n  }\\n  \\n  .feedback-status {\\n    font-weight: 500;\\n    font-size: 0.75rem;\\n  }\\n  \\n  .feedback-status.success {\\n    color: hsl(142.1 76.2% 36.3%);\\n  }\\n  \\n  .feedback-status.close {\\n    color: hsl(47.9 95.8% 45%);\\n  }\\n\\n  /* 検出表示 */\\n  .detection-display {\\n    display: flex;\\n    flex-direction: column;\\n    gap: 1rem;\\n  }\\n  \\n  .detection-card {\\n    display: inline-flex;\\n    align-items: baseline;\\n    gap: 0.5rem;\\n    padding: 1rem 1.5rem;\\n    background: hsl(0 0% 100%);\\n    border: 1px solid hsl(214.3 31.8% 91.4%);\\n    border-radius: 8px;\\n    width: fit-content;\\n  }\\n\\n  /* PitchDetector表示の最強制スタイリング */\\n  :global(.detected-frequency) {\\n    font-weight: 600 !important;\\n    font-size: 2rem !important;\\n    color: hsl(222.2 84% 4.9%) !important;\\n    font-family: 'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', \\n                 'JetBrains Mono', 'Fira Code', 'Consolas', monospace !important;\\n    min-width: 4ch !important;\\n    text-align: right !important;\\n    display: inline-block !important;\\n    font-variant-numeric: tabular-nums !important;\\n    -webkit-font-smoothing: antialiased !important;\\n    -moz-osx-font-smoothing: grayscale !important;\\n  }\\n\\n  :global(.hz-suffix) {\\n    font-weight: 600 !important;\\n    font-size: 2rem !important;\\n    color: hsl(222.2 84% 4.9%) !important;\\n  }\\n\\n  :global(.divider) {\\n    color: hsl(214.3 31.8% 70%) !important;\\n    font-size: 1.5rem !important;\\n    margin: 0 0.25rem !important;\\n    font-weight: 300 !important;\\n  }\\n  \\n  :global(.detected-note) {\\n    font-weight: 600 !important;\\n    font-size: 2rem !important;\\n    color: hsl(215.4 16.3% 46.9%) !important;\\n    font-family: 'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', \\n                 'JetBrains Mono', 'Fira Code', 'Consolas', monospace !important;\\n    min-width: 3ch !important;\\n    display: inline-block !important;\\n    text-align: center !important;\\n  }\\n\\n  :global(.volume-bar) {\\n    border-radius: 4px !important;\\n  }\\n  \\n  .detected-info {\\n    display: flex;\\n    align-items: center;\\n    gap: 0.5rem;\\n    font-size: 0.875rem;\\n  }\\n  \\n  .detected-label {\\n    color: hsl(215.4 16.3% 46.9%);\\n  }\\n  \\n  .detected-frequency {\\n    font-weight: 700;\\n    font-size: 1.25rem;\\n    color: hsl(222.2 84% 4.9%);\\n    margin-right: 0.5rem;\\n  }\\n  \\n  .detected-note {\\n    font-weight: 500;\\n    font-size: 0.875rem;\\n    color: hsl(215.4 16.3% 46.9%);\\n    margin-right: 0.25rem;\\n  }\\n  \\n  .pitch-diff {\\n    color: hsl(47.9 95.8% 40%);\\n    font-weight: 500;\\n    margin-left: 0.25rem;\\n  }\\n  \\n  .volume-section {\\n    display: flex;\\n    flex-direction: column;\\n    gap: 0.5rem;\\n  }\\n  \\n  .volume-label {\\n    font-size: 0.875rem;\\n    color: hsl(215.4 16.3% 46.9%);\\n  }\\n  \\n  :global(.modern-volume-bar) {\\n    border-radius: 4px !important;\\n  }\\n\\n  /* 結果表示 */\\n  .results-summary {\\n    display: grid;\\n    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));\\n    gap: 1rem;\\n    margin-bottom: 2rem;\\n  }\\n  \\n  .result-item {\\n    text-align: center;\\n    padding: 1rem;\\n    border-radius: 6px;\\n    background: hsl(0 0% 100%);\\n    border: 1px solid hsl(214.3 31.8% 91.4%);\\n  }\\n  \\n  .result-label {\\n    display: block;\\n    font-size: 0.875rem;\\n    color: hsl(215.4 16.3% 46.9%);\\n    margin-bottom: 0.25rem;\\n  }\\n  \\n  .result-value {\\n    display: block;\\n    font-size: 1.5rem;\\n    font-weight: 700;\\n    color: hsl(222.2 84% 4.9%);\\n  }\\n  \\n  .result-value.success {\\n    color: hsl(142.1 76.2% 36.3%);\\n  }\\n  \\n  /* 詳細結果 */\\n  .detailed-results {\\n    margin-top: 2rem;\\n  }\\n  \\n  .detailed-title {\\n    font-size: 1rem;\\n    font-weight: 600;\\n    color: hsl(222.2 84% 4.9%);\\n    margin-bottom: 1rem;\\n    text-align: center;\\n  }\\n  \\n  .scale-results {\\n    display: flex;\\n    flex-direction: column;\\n    gap: 0.5rem;\\n  }\\n  \\n  .scale-result-item {\\n    display: grid;\\n    grid-template-columns: 1fr auto auto auto;\\n    gap: 1rem;\\n    padding: 0.75rem;\\n    border-radius: 6px;\\n    border: 1px solid hsl(214.3 31.8% 91.4%);\\n    background: hsl(0 0% 100%);\\n    align-items: center;\\n  }\\n  \\n  .scale-result-item.correct {\\n    background: hsl(142.1 76.2% 95%);\\n    border-color: hsl(142.1 76.2% 80%);\\n  }\\n  \\n  .scale-result-item.incorrect {\\n    background: hsl(0 84.2% 95%);\\n    border-color: hsl(0 84.2% 80%);\\n  }\\n  \\n  .scale-name {\\n    font-weight: 600;\\n    color: hsl(222.2 84% 4.9%);\\n  }\\n  \\n  .scale-accuracy {\\n    font-weight: 500;\\n    font-family: 'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', monospace;\\n    color: hsl(215.4 16.3% 46.9%);\\n  }\\n  \\n  .scale-cents {\\n    font-weight: 500;\\n    font-family: 'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', monospace;\\n    color: hsl(215.4 16.3% 46.9%);\\n    font-size: 0.875rem;\\n  }\\n  \\n  .scale-status {\\n    text-align: center;\\n    font-size: 1.125rem;\\n  }\\n\\n  /* アクションボタン - 新しいActionButtonsコンポーネントで管理 */\\n  \\n  /* 共通アクションボタン */\\n  .common-actions {\\n    display: flex;\\n    gap: 0.75rem;\\n    justify-content: center;\\n    flex-wrap: wrap;\\n    margin-top: 1.5rem;\\n  }\\n\\n  /* 共通アクションボタンのスタイル */\\n  :global(.primary-button) {\\n    background-color: #2563eb !important;\\n    color: white !important;\\n    border: none !important;\\n    font-weight: 600 !important;\\n    padding: 0.75rem 1.5rem !important;\\n    border-radius: 6px !important;\\n    transition: all 0.2s ease !important;\\n    min-width: 140px !important;\\n  }\\n\\n  :global(.primary-button:hover) {\\n    background-color: #1d4ed8 !important;\\n    transform: translateY(-1px) !important;\\n  }\\n\\n  :global(.secondary-button) {\\n    background-color: #f8fafc !important;\\n    color: #475569 !important;\\n    border: 1px solid #e2e8f0 !important;\\n    font-weight: 500 !important;\\n    padding: 0.75rem 1.5rem !important;\\n    border-radius: 6px !important;\\n    transition: all 0.2s ease !important;\\n    min-width: 120px !important;\\n  }\\n\\n  :global(.secondary-button:hover) {\\n    background-color: #f1f5f9 !important;\\n    border-color: #cbd5e1 !important;\\n    transform: translateY(-1px) !important;\\n  }\\n\\n  /* エラー表示 */\\n  .error-content {\\n    text-align: center;\\n    padding: 2rem 1rem;\\n  }\\n  \\n  .error-icon, .loading-icon {\\n    font-size: 3rem;\\n    margin-bottom: 1rem;\\n  }\\n  \\n  .error-content h3 {\\n    font-size: 1.25rem;\\n    font-weight: 600;\\n    color: hsl(222.2 84% 4.9%);\\n    margin-bottom: 0.5rem;\\n  }\\n  \\n  .error-content p {\\n    color: hsl(215.4 16.3% 46.9%);\\n    margin-bottom: 1rem;\\n  }\\n  \\n  .recommendation {\\n    background: hsl(210 40% 98%);\\n    border: 1px solid hsl(214.3 31.8% 91.4%);\\n    border-radius: 6px;\\n    padding: 1rem;\\n    margin: 1rem 0;\\n  }\\n  \\n  .recommendation p {\\n    margin: 0;\\n    font-size: 0.875rem;\\n  }\\n\\n  /* レスポンシブ対応 */\\n  @media (min-width: 768px) {\\n    .scale-guide {\\n      grid-template-columns: repeat(8, 1fr);\\n    }\\n    \\n    .page-title {\\n      font-size: 2.5rem;\\n    }\\n    \\n    .results-summary {\\n      grid-template-columns: repeat(3, 1fr);\\n    }\\n  }\\n  \\n  @media (max-width: 640px) {\\n    .status-content {\\n      flex-direction: column;\\n      gap: 0.5rem;\\n    }\\n    \\n    /* アクションボタン - ActionButtonsコンポーネントで管理 */\\n    \\n    :global(.primary-button), :global(.secondary-button) {\\n      min-width: 100% !important;\\n    }\\n  }\\n\\n  /* マイク警告カード */\\n  :global(.warning-card) {\\n    border: 2px solid #fbbf24 !important;\\n    background: #fef3c7 !important;\\n    margin-bottom: 24px !important;\\n  }\\n\\n  .warning-message {\\n    color: #92400e;\\n    margin-bottom: 12px;\\n  }\\n\\n  .error-list {\\n    color: #dc2626;\\n    margin: 12px 0;\\n    padding-left: 20px;\\n  }\\n\\n  .error-list li {\\n    margin-bottom: 4px;\\n    font-family: monospace;\\n    font-size: 14px;\\n  }\\n\\n  .fix-instruction {\\n    color: #059669;\\n    margin-top: 12px;\\n    padding: 8px;\\n    background: #d1fae5;\\n    border-radius: 4px;\\n    border-left: 4px solid #059669;\\n  }\\n\\n  /* === 採点表示専用スタイル === */\\n  \\n  /* タブコンテナ */\\n  .scoring-tabs-container {\\n    display: flex;\\n    gap: 0.5rem;\\n    margin-bottom: 1.5rem;\\n    overflow-x: auto;\\n    border-bottom: 1px solid hsl(214.3 31.8% 91.4%);\\n    padding-bottom: 0.5rem;\\n  }\\n  \\n  /* タブボタン */\\n  .scoring-tab {\\n    padding: 0.75rem 1rem;\\n    border-radius: 6px;\\n    border: 1px solid hsl(214.3 31.8% 91.4%);\\n    background: hsl(0 0% 100%);\\n    color: hsl(215.4 16.3% 46.9%);\\n    font-size: 0.875rem;\\n    font-weight: 500;\\n    cursor: pointer;\\n    transition: all 0.2s ease;\\n    flex-shrink: 0;\\n    white-space: nowrap;\\n  }\\n  \\n  .scoring-tab:hover {\\n    background: hsl(210 40% 98%);\\n    border-color: hsl(217.2 32.6% 17.5%);\\n  }\\n  \\n  .scoring-tab.active {\\n    background: hsl(217.2 91.2% 59.8%);\\n    color: hsl(210 40% 98%);\\n    border-color: hsl(217.2 91.2% 59.8%);\\n    font-weight: 600;\\n  }\\n  \\n  /* タブコンテンツ */\\n  .tab-content {\\n    margin-top: 1rem;\\n    min-height: 200px;\\n  }\\n  \\n  .tab-panel {\\n    animation: fadeIn 0.3s ease-in-out;\\n  }\\n  \\n  @keyframes fadeIn {\\n    from { opacity: 0; transform: translateY(10px); }\\n    to { opacity: 1; transform: translateY(0); }\\n  }\\n  \\n  /* モバイル対応 */\\n  @media (max-width: 768px) {\\n    .scoring-tabs-container {\\n      flex-wrap: wrap;\\n    }\\n    \\n    .scoring-tab {\\n      flex: 1;\\n      min-width: 120px;\\n    }\\n  }\\n  \\n  /* 折りたたみ詳細セクション */\\n  .traditional-scoring-details,\\n  .detailed-random-scoring,\\n  .random-scoring-section {\\n    margin-top: 2rem;\\n    padding: 1rem;\\n    background: #f9fafb;\\n    border-radius: 8px;\\n  }\\n  \\n  .traditional-scoring-details summary {\\n    font-weight: 600;\\n    transition: color 0.2s;\\n  }\\n  \\n  .traditional-scoring-details summary:hover {\\n    color: #374151;\\n  }\\n  \\n  .traditional-scoring-details[open] summary span {\\n    transform: rotate(90deg);\\n  }\\n  \\n  .traditional-scoring-details summary span {\\n    transition: transform 0.2s;\\n  }\\n  \\n  /* セッション進捗表示 */\\n  .session-progress {\\n    background: hsl(0 0% 100%);\\n    border: 1px solid hsl(214.3 31.8% 91.4%);\\n    border-radius: 8px;\\n    padding: 12px 16px;\\n    margin: 16px 0;\\n    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);\\n  }\\n  \\n  .session-status {\\n    display: flex;\\n    justify-content: space-between;\\n    align-items: center;\\n    gap: 1rem;\\n  }\\n  \\n  .session-info {\\n    display: flex;\\n    align-items: center;\\n    gap: 1rem;\\n  }\\n  \\n  .completed-count {\\n    font-weight: 700;\\n    color: hsl(222.2 84% 4.9%);\\n    font-size: 1.125rem;\\n  }\\n  \\n  .remaining-text {\\n    color: hsl(215.4 16.3% 46.9%);\\n    font-size: 0.875rem;\\n  }\\n  \\n  .progress-section {\\n    display: flex;\\n    align-items: center;\\n    gap: 12px;\\n  }\\n  \\n  .progress-bar {\\n    width: 120px;\\n    height: 4px;\\n    background: hsl(214.3 31.8% 91.4%);\\n    border-radius: 2px;\\n    overflow: hidden;\\n    position: relative;\\n  }\\n  \\n  .progress-fill {\\n    height: 100%;\\n    background: hsl(217.2 91.2% 59.8%);\\n    transition: width 0.3s ease;\\n  }\\n  \\n  .progress-text {\\n    font-weight: 500;\\n    color: hsl(217.2 91.2% 59.8%);\\n    font-size: 0.875rem;\\n    min-width: 35px;\\n    text-align: right;\\n  }\\n  \\n  \\n  \\n  @media (max-width: 768px) {\\n    .session-status {\\n      flex-direction: column;\\n      gap: 8px;\\n      align-items: center;\\n    }\\n    \\n    .session-info {\\n      width: 100%;\\n      justify-content: center;\\n    }\\n    \\n    .progress-section {\\n      width: 100%;\\n      justify-content: center;\\n    }\\n  }\\n</style>"],"names":[],"mappings":"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"}`
};
const buildVersion = "v2.3.1-ANIMATED";
const buildTimestamp = "07/29 04:15";
const updateStatus = "🎬 評価分布アニメーション実装・UX向上";
function scrollToTop() {
  try {
    if ("scrollTo" in window && "behavior" in document.documentElement.style) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo(0, 0);
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    const scrollContainers = document.querySelectorAll("[data-scroll-container], .scroll-container, main");
    scrollContainers.forEach((container) => {
      if (container.scrollTo) {
        container.scrollTo(0, 0);
      } else {
        container.scrollTop = 0;
      }
    });
  } catch (error) {
    console.warn("スクロールエラー:", error);
    try {
      window.scroll(0, 0);
    } catch (fallbackError) {
      console.error("スクロール完全失敗:", fallbackError);
    }
  }
}
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $isCompleted, $$unsubscribe_isCompleted;
  let $$unsubscribe_page;
  let $$unsubscribe_currentSessionId;
  let $$unsubscribe_remainingSessions;
  let $$unsubscribe_nextBaseName;
  let $$unsubscribe_nextBaseNote;
  let $sessionHistory, $$unsubscribe_sessionHistory;
  let $$unsubscribe_trainingProgress;
  let $isLoading, $$unsubscribe_isLoading;
  let $$unsubscribe_unifiedScoreData;
  $$unsubscribe_isCompleted = subscribe(isCompleted, (value) => $isCompleted = value);
  $$unsubscribe_page = subscribe(page, (value) => value);
  $$unsubscribe_currentSessionId = subscribe(currentSessionId, (value) => value);
  $$unsubscribe_remainingSessions = subscribe(remainingSessions, (value) => value);
  $$unsubscribe_nextBaseName = subscribe(nextBaseName, (value) => value);
  $$unsubscribe_nextBaseNote = subscribe(nextBaseNote, (value) => value);
  $$unsubscribe_sessionHistory = subscribe(sessionHistory, (value) => $sessionHistory = value);
  $$unsubscribe_trainingProgress = subscribe(trainingProgress, (value) => value);
  $$unsubscribe_isLoading = subscribe(isLoading, (value) => $isLoading = value);
  $$unsubscribe_unifiedScoreData = subscribe(unifiedScoreData, (value) => value);
  let trainingPhase = "setup";
  let microphoneState = (() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("from") === "microphone-test") {
        logger.info("[RandomTraining] マイクテストページからの遷移を検出");
        return "granted";
      } else {
        logger.info("[RandomTraining] ダイレクトアクセスを検出");
        return "checking";
      }
    }
    return "checking";
  })();
  const SCALE_NAMES = ["ド", "レ", "ミ", "ファ", "ソ", "ラ", "シ", "ド（高）"];
  let scaleSteps = SCALE_NAMES.map((name) => ({
    name,
    state: "inactive",
    completed: false
  }));
  let currentVolume = 0;
  let currentFrequency = 0;
  let detectedNote = "ーー";
  let pitchDetectorComponent = null;
  onDestroy(() => {
    console.log("🔄 [RandomTraining] onDestroy - AudioManagerリソースは保持");
  });
  $$result.css.add(css);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    {
      if (microphoneState === "granted") {
        scrollToTop();
      }
    }
    $$rendered = `${validate_component(PageLayout, "PageLayout").$$render($$result, {}, {}, {
      default: () => {
        return ` <div class="header-section svelte-z4r706"><h1 class="page-title svelte-z4r706" data-svelte-h="svelte-1ptm9zr">🎵 ランダム基音トレーニング</h1> <p class="page-description svelte-z4r706" data-svelte-h="svelte-19nes7">10種類の基音からランダムに選択してドレミファソラシドを練習</p>  ${microphoneState === "granted" && !$isLoading ? `<div class="session-progress svelte-z4r706"><div class="session-status svelte-z4r706"><div class="session-info svelte-z4r706"><span class="completed-count svelte-z4r706">${escape($sessionHistory?.length || 0)}/8</span> <span class="remaining-text svelte-z4r706">残り ${escape(8 - ($sessionHistory?.length || 0))} セッション</span></div> <div class="progress-section svelte-z4r706"><div class="progress-bar svelte-z4r706"><div class="progress-fill svelte-z4r706" style="${"width: " + escape(($sessionHistory?.length || 0) / 8 * 100, true) + "%"}"></div></div> <span class="progress-text svelte-z4r706">${escape(Math.round(($sessionHistory?.length || 0) / 8 * 100))}%</span></div></div></div>  ${validate_component(ActionButtons, "ActionButtons").$$render(
          $$result,
          {
            isCompleted: $isCompleted,
            position: "top"
          },
          {},
          {}
        )}` : ``} <div class="debug-info svelte-z4r706">📱 ${escape(buildVersion)} | ${escape(buildTimestamp)}<br> <small style="font-size: 0.6rem;">${escape(updateStatus)}</small></div></div> ${microphoneState === "granted" ? ` <div style="display: none;">${validate_component(PitchDetector_1, "PitchDetector").$$render(
          $$result,
          {
            isActive: microphoneState === "granted",
            trainingPhase,
            className: "pitch-detector-content",
            debugMode: true,
            this: pitchDetectorComponent
          },
          {
            this: ($$value) => {
              pitchDetectorComponent = $$value;
              $$settled = false;
            }
          },
          {}
        )}</div>  ${`  ${``} <div class="side-by-side-container svelte-z4r706"> ${validate_component(Card, "Card").$$render($$result, { class: "main-card half-width" }, {}, {
          default: () => {
            return `<div class="card-header svelte-z4r706" data-svelte-h="svelte-o46h1v"><h3 class="section-title svelte-z4r706">🎹 基音再生</h3></div> <div class="card-content svelte-z4r706">${validate_component(Button, "Button").$$render(
              $$result,
              {
                variant: "primary",
                disabled: trainingPhase === "waiting"
              },
              {},
              {
                default: () => {
                  return `${`${`🎹 ランダム基音再生`}`}`;
                }
              }
            )} ${``}</div>`;
          }
        })}  ${validate_component(PitchDetectionDisplay, "PitchDetectionDisplay").$$render(
          $$result,
          {
            frequency: currentFrequency,
            note: detectedNote,
            volume: currentVolume,
            isMuted: trainingPhase !== "guiding",
            muteMessage: "基音再生後に開始",
            className: "half-width"
          },
          {},
          {}
        )}</div>`} ${` ${validate_component(Card, "Card").$$render($$result, { class: "main-card" }, {}, {
          default: () => {
            return `<div class="card-header svelte-z4r706" data-svelte-h="svelte-z1jpw4"><h3 class="section-title svelte-z4r706">🎵 ドレミ音階ガイド</h3></div> <div class="card-content svelte-z4r706"><div class="scale-guide svelte-z4r706">${each(scaleSteps, (step, index) => {
              return `<div class="${"scale-item " + escape(step.state, true) + " svelte-z4r706"}">${escape(step.name)} </div>`;
            })}</div> ${``}</div>`;
          }
        })}`}  ${``}  ${``}` : ` ${validate_component(Card, "Card").$$render($$result, { class: "error-card" }, {}, {
          default: () => {
            return `<div class="error-content svelte-z4r706"><div class="error-icon svelte-z4r706" data-svelte-h="svelte-15rbx8n">🎤</div> <h3 class="svelte-z4r706" data-svelte-h="svelte-17kvze2">マイクテストが必要です</h3> <p class="svelte-z4r706" data-svelte-h="svelte-12s9olt">ランダム基音トレーニングを開始する前に、マイクテストページで音声入力の確認をお願いします。</p> <div class="recommendation svelte-z4r706" data-svelte-h="svelte-13ge0u9"><p class="svelte-z4r706">このページは<strong>マイクテスト完了後</strong>にご利用いただけます。</p> <p class="svelte-z4r706">まずはマイクテストページで音声確認を行ってください。</p></div> <div class="action-buttons">${validate_component(Button, "Button").$$render($$result, { variant: "primary" }, {}, {
              default: () => {
                return `🎤 マイクテストページへ移動`;
              }
            })} ${validate_component(Button, "Button").$$render($$result, { variant: "secondary" }, {}, {
              default: () => {
                return `🏠 ホームに戻る`;
              }
            })}</div></div>`;
          }
        })}`}`;
      }
    })}`;
  } while (!$$settled);
  $$unsubscribe_isCompleted();
  $$unsubscribe_page();
  $$unsubscribe_currentSessionId();
  $$unsubscribe_remainingSessions();
  $$unsubscribe_nextBaseName();
  $$unsubscribe_nextBaseNote();
  $$unsubscribe_sessionHistory();
  $$unsubscribe_trainingProgress();
  $$unsubscribe_isLoading();
  $$unsubscribe_unifiedScoreData();
  return $$rendered;
});
export {
  Page as default
};
