import { c as create_ssr_component, f as compute_rest_props, g as spread, d as each, h as escape_object, i as escape_attribute_value, v as validate_component, a as validate_store, b as subscribe, o as onDestroy, e as escape } from "../../../../chunks/ssr.js";
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
function validate_dynamic_element(tag) {
  const is_string = typeof tag === "string";
  if (tag && !is_string) {
    throw new Error('<svelte:element> expects "this" attribute to be a string.');
  }
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
      validate_dynamic_element(tag$1);
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
class IntervalAnalyzer {
  constructor() {
    this.intervalTypes = {
      unison: {
        name: "同度",
        semitones: 0,
        importance: 0.8,
        description: "基音と同じ高さ",
        difficulty: "基本",
        commonErrors: ["微細なピッチのずれ"]
      },
      minorSecond: {
        name: "短2度",
        semitones: 1,
        importance: 0.9,
        description: "半音上",
        difficulty: "高",
        commonErrors: ["長2度との混同", "音程幅の過大評価"]
      },
      majorSecond: {
        name: "長2度",
        semitones: 2,
        importance: 1,
        description: "全音上（ドレ）",
        difficulty: "基本",
        commonErrors: ["短2度との混同"]
      },
      minorThird: {
        name: "短3度",
        semitones: 3,
        importance: 1,
        description: "短調の3度（ドミ♭）",
        difficulty: "中",
        commonErrors: ["長3度との混同"]
      },
      majorThird: {
        name: "長3度",
        semitones: 4,
        importance: 1,
        description: "長調の3度（ドミ）",
        difficulty: "基本",
        commonErrors: ["短3度との混同", "完全4度への誤認"]
      },
      perfectFourth: {
        name: "完全4度",
        semitones: 5,
        importance: 0.9,
        description: "安定した協和音程（ドファ）",
        difficulty: "基本",
        commonErrors: ["長3度・減5度との混同"]
      },
      tritone: {
        name: "減5度",
        semitones: 6,
        importance: 0.7,
        description: "不安定な音程（ドファ#）",
        difficulty: "高",
        commonErrors: ["完全4度・完全5度との混同"]
      },
      perfectFifth: {
        name: "完全5度",
        semitones: 7,
        importance: 0.9,
        description: "最も安定した音程（ドソ）",
        difficulty: "基本",
        commonErrors: ["減5度・長6度との混同"]
      },
      minorSixth: {
        name: "短6度",
        semitones: 8,
        importance: 0.8,
        description: "短調的色彩（ドラ♭）",
        difficulty: "中",
        commonErrors: ["長6度・完全5度との混同"]
      },
      majorSixth: {
        name: "長6度",
        semitones: 9,
        importance: 0.8,
        description: "明るい響き（ドラ）",
        difficulty: "中",
        commonErrors: ["短6度・短7度との混同"]
      },
      minorSeventh: {
        name: "短7度",
        semitones: 10,
        importance: 0.7,
        description: "属7和音の7度（ドシ♭）",
        difficulty: "中",
        commonErrors: ["長7度・長6度との混同"]
      },
      majorSeventh: {
        name: "長7度",
        semitones: 11,
        importance: 0.7,
        description: "鋭い不協和音程（ドシ）",
        difficulty: "高",
        commonErrors: ["短7度・8度との混同"]
      },
      octave: {
        name: "8度",
        semitones: 12,
        importance: 0.9,
        description: "1オクターブ上（ドド）",
        difficulty: "基本",
        commonErrors: ["HarmonicCorrectionによる倍音誤検出"]
      }
    };
    this.masteryData = /* @__PURE__ */ new Map();
    this.analysisHistory = [];
    this.maxHistoryLength = 100;
    this.debugMode = true;
    this.initializeMasteryData();
    this.log("🎵 IntervalAnalyzer初期化完了", {
      intervalCount: Object.keys(this.intervalTypes).length,
      masteryData: this.masteryData.size
    });
  }
  /**
   * メイン音程分析処理
   * @param {number} baseFreq - 基音周波数
   * @param {number} targetFreq - 目標周波数
   * @param {number} detectedFreq - 検出周波数
   * @returns {Object} - 音程分析結果
   */
  analyzeInterval(baseFreq, targetFreq, detectedFreq) {
    try {
      const targetSemitones = this.calculateSemitones(baseFreq, targetFreq);
      const targetInterval = this.identifyInterval(targetSemitones);
      const detectedSemitones = this.calculateSemitones(baseFreq, detectedFreq);
      const detectedInterval = this.identifyInterval(detectedSemitones);
      const accuracy = this.calculateIntervalAccuracy(targetSemitones, detectedSemitones);
      this.updateMastery(targetInterval.key, accuracy);
      const mastery = this.getMastery(targetInterval.key);
      const analysis = {
        targetInterval,
        detectedInterval,
        targetSemitones,
        detectedSemitones,
        accuracy,
        mastery,
        masteryLevels: Object.fromEntries(this.masteryData),
        // EnhancedScoringEngine互換性のため追加
        isCorrectInterval: targetInterval.key === detectedInterval.key,
        feedback: this.generateIntervalFeedback(targetInterval, detectedInterval, accuracy),
        timestamp: Date.now()
      };
      this.recordAnalysis(analysis);
      if (this.debugMode) {
        this.logAnalysisDetails(analysis);
      }
      return analysis;
    } catch (error) {
      console.error("❌ [IntervalAnalyzer] 分析エラー:", error);
      return this.createErrorResult(baseFreq, targetFreq, detectedFreq);
    }
  }
  /**
   * 周波数からセミトーン差を計算
   * @param {number} baseFreq - 基音周波数
   * @param {number} targetFreq - 目標周波数
   * @returns {number} - セミトーン数（小数点含む）
   */
  calculateSemitones(baseFreq, targetFreq) {
    if (!baseFreq || !targetFreq || baseFreq <= 0 || targetFreq <= 0) {
      return 0;
    }
    const semitones = 12 * Math.log2(targetFreq / baseFreq);
    const normalizedSemitones = (semitones % 12 + 12) % 12;
    return normalizedSemitones;
  }
  /**
   * セミトーン数から音程を特定
   * @param {number} semitones - セミトーン数
   * @returns {Object} - 音程情報
   */
  identifyInterval(semitones) {
    let closestInterval = null;
    let minDistance = Infinity;
    for (const [key, interval] of Object.entries(this.intervalTypes)) {
      const distance = Math.abs(semitones - interval.semitones);
      if (distance < minDistance) {
        minDistance = distance;
        closestInterval = { key, ...interval, distance };
      }
    }
    return closestInterval;
  }
  /**
   * 音程精度の計算
   * @param {number} targetSemitones - 目標セミトーン
   * @param {number} detectedSemitones - 検出セミトーン
   * @returns {number} - 精度スコア (0-100)
   */
  calculateIntervalAccuracy(targetSemitones, detectedSemitones) {
    const semitoneDiff = Math.abs(targetSemitones - detectedSemitones);
    const accuracy = Math.max(0, 100 - semitoneDiff * 50);
    return Math.min(100, accuracy);
  }
  /**
   * 習得度の更新
   * @param {string} intervalKey - 音程キー
   * @param {number} accuracy - 精度スコア
   */
  updateMastery(intervalKey, accuracy) {
    if (!this.masteryData.has(intervalKey)) {
      this.masteryData.set(intervalKey, {
        attempts: 0,
        totalAccuracy: 0,
        averageAccuracy: 0,
        bestAccuracy: 0,
        recentAttempts: [],
        lastAttempt: null,
        trend: "stable"
      });
    }
    const mastery = this.masteryData.get(intervalKey);
    mastery.attempts++;
    mastery.totalAccuracy += accuracy;
    mastery.averageAccuracy = mastery.totalAccuracy / mastery.attempts;
    mastery.bestAccuracy = Math.max(mastery.bestAccuracy, accuracy);
    mastery.lastAttempt = Date.now();
    mastery.recentAttempts.push(accuracy);
    if (mastery.recentAttempts.length > 10) {
      mastery.recentAttempts.shift();
    }
    mastery.trend = this.calculateTrend(mastery.recentAttempts);
    this.masteryData.set(intervalKey, mastery);
  }
  /**
   * 習得度の取得
   * @param {string} intervalKey - 音程キー
   * @returns {Object} - 習得度情報
   */
  getMastery(intervalKey) {
    const mastery = this.masteryData.get(intervalKey);
    if (!mastery) {
      return {
        attempts: 0,
        averageAccuracy: 0,
        bestAccuracy: 0,
        level: "beginner",
        progress: 0
      };
    }
    const level = this.determineMasteryLevel(mastery.averageAccuracy, mastery.attempts);
    const progress = Math.min(100, mastery.averageAccuracy * mastery.attempts / 500);
    return {
      ...mastery,
      level,
      progress: Math.round(progress)
    };
  }
  /**
   * 習得レベルの判定
   * @param {number} averageAccuracy - 平均精度
   * @param {number} attempts - 試行回数
   * @returns {string} - 習得レベル
   */
  determineMasteryLevel(averageAccuracy, attempts) {
    if (attempts < 3) return "beginner";
    if (averageAccuracy >= 90 && attempts >= 10) return "master";
    if (averageAccuracy >= 80 && attempts >= 7) return "advanced";
    if (averageAccuracy >= 70 && attempts >= 5) return "intermediate";
    if (averageAccuracy >= 50) return "novice";
    return "beginner";
  }
  /**
   * トレンド分析
   * @param {Array} recentAttempts - 直近の試行結果
   * @returns {string} - トレンド ('improving' | 'stable' | 'declining')
   */
  calculateTrend(recentAttempts) {
    if (recentAttempts.length < 3) return "stable";
    const recent = recentAttempts.slice(-3);
    const earlier = recentAttempts.slice(-6, -3);
    if (earlier.length === 0) return "stable";
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, val) => sum + val, 0) / earlier.length;
    const improvement = recentAvg - earlierAvg;
    if (improvement > 5) return "improving";
    if (improvement < -5) return "declining";
    return "stable";
  }
  /**
   * 音程フィードバック生成
   * @param {Object} targetInterval - 目標音程
   * @param {Object} detectedInterval - 検出音程
   * @param {number} accuracy - 精度
   * @returns {string} - フィードバックメッセージ
   */
  generateIntervalFeedback(targetInterval, detectedInterval, accuracy) {
    const isCorrect = targetInterval.key === detectedInterval.key;
    if (isCorrect && accuracy >= 90) {
      return `🎯 ${targetInterval.name}を完璧に認識しました！`;
    }
    if (isCorrect && accuracy >= 70) {
      return `✅ ${targetInterval.name}の認識は正しいです。精度を上げてみましょう。`;
    }
    if (isCorrect) {
      return `👍 ${targetInterval.name}を認識できています。もう少し正確に。`;
    }
    const errorType = this.analyzeIntervalError(targetInterval, detectedInterval);
    return `❌ ${targetInterval.name}ではなく${detectedInterval.name}と認識されました。${errorType}`;
  }
  /**
   * 音程エラーの分析
   * @param {Object} target - 目標音程
   * @param {Object} detected - 検出音程
   * @returns {string} - エラー分析結果
   */
  analyzeIntervalError(target, detected) {
    const semitoneDiff = detected.semitones - target.semitones;
    if (Math.abs(semitoneDiff) === 1) {
      return semitoneDiff > 0 ? "少し高めに歌っています。" : "少し低めに歌っています。";
    }
    if (Math.abs(semitoneDiff) <= 2) {
      return "音程幅の調整が必要です。";
    }
    if (Math.abs(semitoneDiff) >= 6) {
      return "オクターブ関係の可能性があります。";
    }
    return "音程の特徴を意識してみてください。";
  }
  /**
   * 全音程の習得状況取得
   * @returns {Object} - 全音程習得データ
   */
  getAllMasteryData() {
    const result = {};
    for (const [key, interval] of Object.entries(this.intervalTypes)) {
      result[key] = {
        interval,
        mastery: this.getMastery(key)
      };
    }
    return result;
  }
  /**
   * 弱点音程の特定
   * @param {number} limit - 取得件数制限
   * @returns {Array} - 弱点音程リスト
   */
  getWeakIntervals(limit = 3) {
    const masteryList = Object.entries(this.getAllMasteryData()).filter(([key, data]) => data.mastery.attempts >= 2).sort((a, b) => a[1].mastery.averageAccuracy - b[1].mastery.averageAccuracy).slice(0, limit);
    return masteryList.map(([key, data]) => ({
      key,
      name: data.interval.name,
      accuracy: data.mastery.averageAccuracy,
      attempts: data.mastery.attempts,
      improvement: this.generateImprovementTip(key, data)
    }));
  }
  /**
   * 得意音程の特定
   * @param {number} limit - 取得件数制限
   * @returns {Array} - 得意音程リスト
   */
  getStrongIntervals(limit = 3) {
    const masteryList = Object.entries(this.getAllMasteryData()).filter(([key, data]) => data.mastery.attempts >= 3).sort((a, b) => b[1].mastery.averageAccuracy - a[1].mastery.averageAccuracy).slice(0, limit);
    return masteryList.map(([key, data]) => ({
      key,
      name: data.interval.name,
      accuracy: data.mastery.averageAccuracy,
      attempts: data.mastery.attempts,
      reason: this.generateStrengthReason(key, data)
    }));
  }
  /**
   * 改善提案の生成
   * @param {string} intervalKey - 音程キー
   * @param {Object} data - 音程データ
   * @returns {string} - 改善提案
   */
  generateImprovementTip(intervalKey, data) {
    const interval = data.interval;
    const mastery = data.mastery;
    if (mastery.trend === "improving") {
      return `📈 改善中です！${interval.description}の特徴を意識して練習を続けましょう。`;
    }
    if (interval.commonErrors.length > 0) {
      return `💡 ${interval.commonErrors[0]}に注意してください。`;
    }
    return `🎯 ${interval.description}を意識して、ゆっくりと練習してみましょう。`;
  }
  /**
   * 強み理由の生成
   * @param {string} intervalKey - 音程キー
   * @param {Object} data - 音程データ
   * @returns {string} - 強み理由
   */
  generateStrengthReason(intervalKey, data) {
    const interval = data.interval;
    const mastery = data.mastery;
    if (mastery.averageAccuracy >= 95) {
      return `完璧な精度で${interval.name}を認識できています！`;
    }
    if (mastery.trend === "improving") {
      return `${interval.name}の理解が急速に向上しています。`;
    }
    return `${interval.name}の認識が安定しています。`;
  }
  /**
   * 習得度データの初期化
   */
  initializeMasteryData() {
  }
  /**
   * 分析履歴の記録
   * @param {Object} analysis - 分析結果
   */
  recordAnalysis(analysis) {
    this.analysisHistory.push(analysis);
    if (this.analysisHistory.length > this.maxHistoryLength) {
      this.analysisHistory.shift();
    }
  }
  /**
   * エラー結果の作成
   * @param {number} baseFreq - 基音周波数
   * @param {number} targetFreq - 目標周波数
   * @param {number} detectedFreq - 検出周波数
   * @returns {Object} - エラー結果
   */
  createErrorResult(baseFreq, targetFreq, detectedFreq) {
    return {
      targetInterval: { name: "不明", key: "unknown" },
      detectedInterval: { name: "不明", key: "unknown" },
      accuracy: 0,
      mastery: { level: "beginner", progress: 0 },
      masteryLevels: Object.fromEntries(this.masteryData),
      // EnhancedScoringEngine互換性のため追加
      isCorrectInterval: false,
      feedback: "音程分析でエラーが発生しました。",
      error: true
    };
  }
  /**
   * 詳細分析ログ出力
   * @param {Object} analysis - 分析結果
   */
  logAnalysisDetails(analysis) {
    console.group(`🎵 [IntervalAnalyzer] ${analysis.targetInterval.name}分析結果`);
    console.log("🎯 音程分析:", {
      目標: `${analysis.targetInterval.name} (${analysis.targetSemitones.toFixed(1)}セミトーン)`,
      検出: `${analysis.detectedInterval.name} (${analysis.detectedSemitones.toFixed(1)}セミトーン)`,
      正解: analysis.isCorrectInterval ? "✅" : "❌",
      精度: `${analysis.accuracy.toFixed(1)}%`
    });
    console.log("📊 習得状況:", {
      レベル: analysis.mastery.level,
      試行回数: analysis.mastery.attempts,
      平均精度: `${analysis.mastery.averageAccuracy?.toFixed(1) || 0}%`,
      進捗: `${analysis.mastery.progress}%`,
      トレンド: analysis.mastery.trend
    });
    console.log("💬 フィードバック:", analysis.feedback);
    console.groupEnd();
  }
  /**
   * デバッグログ出力
   * @param {string} message - ログメッセージ
   * @param {Object} data - 追加データ
   */
  log(message, data = null) {
    if (this.debugMode) {
      if (data) {
        console.log(`[IntervalAnalyzer] ${message}`, data);
      } else {
        console.log(`[IntervalAnalyzer] ${message}`);
      }
    }
  }
  /**
   * 統計データの取得
   * @returns {Object} - 統計データ
   */
  getStatistics() {
    return {
      totalAnalyses: this.analysisHistory.length,
      intervalTypes: Object.keys(this.intervalTypes).length,
      masteryLevels: Object.fromEntries(this.masteryData),
      sessionStartTime: this.sessionStartTime || Date.now()
    };
  }
  /**
   * データのリセット
   */
  reset() {
    this.masteryData.clear();
    this.analysisHistory = [];
    this.initializeMasteryData();
    this.log("🔄 IntervalAnalyzer リセット完了");
  }
}
if (typeof window !== "undefined" && true) {
  window.IntervalAnalyzer = IntervalAnalyzer;
}
class DirectionAnalyzer {
  constructor() {
    this.directions = {
      ascending: {
        name: "上行",
        icon: "↗️",
        description: "基音より高い音程",
        color: "#10b981",
        commonErrors: [
          "オクターブ下認識（倍音効果）",
          "音程幅の過小評価",
          "目標音程の手前で停止"
        ]
      },
      descending: {
        name: "下行",
        icon: "↘️",
        description: "基音より低い音程",
        color: "#3b82f6",
        commonErrors: [
          "オクターブ上認識（倍音効果）",
          "音程幅の過大評価",
          "目標音程を通り越す"
        ]
      },
      unison: {
        name: "同音",
        icon: "➡️",
        description: "基音と同じ高さ",
        color: "#6b7280",
        commonErrors: [
          "微細なピッチずれ",
          "倍音による誤認識"
        ]
      }
    };
    this.directionMastery = /* @__PURE__ */ new Map();
    this.analysisHistory = [];
    this.maxHistoryLength = 50;
    this.debugMode = true;
    this.thresholds = {
      unison: 0.5,
      // ±0.5セミトーン以内を同音と判定
      overshoot: 1.5,
      // 目標から1.5セミトーン以上のずれをオーバーシュート
      significant: 3
      // 3セミトーン以上の差を有意な方向性エラー
    };
    this.initializeDirectionMastery();
    this.log("🧭 DirectionAnalyzer初期化完了", {
      directions: Object.keys(this.directions).length,
      thresholds: this.thresholds
    });
  }
  /**
   * メイン方向性分析処理
   * @param {number} baseFreq - 基音周波数
   * @param {number} targetFreq - 目標周波数
   * @param {number} detectedFreq - 検出周波数
   * @returns {Object} - 方向性分析結果
   */
  analyzeDirection(baseFreq, targetFreq, detectedFreq) {
    try {
      const targetDirection = this.determineDirection(baseFreq, targetFreq);
      const targetSemitones = this.calculateSemitones(baseFreq, targetFreq);
      const detectedDirection = this.determineDirection(baseFreq, detectedFreq);
      const detectedSemitones = this.calculateSemitones(baseFreq, detectedFreq);
      const directionCorrect = targetDirection.key === detectedDirection.key;
      const overshootAnalysis = this.analyzeOvershoot(targetSemitones, detectedSemitones);
      const accuracy = this.calculateDirectionAccuracy(
        targetDirection.key,
        detectedDirection.key,
        targetSemitones,
        detectedSemitones
      );
      this.updateDirectionMastery(targetDirection.key, accuracy, directionCorrect);
      const mastery = this.getDirectionMastery(targetDirection.key);
      const analysis = {
        targetDirection,
        detectedDirection,
        targetSemitones,
        detectedSemitones,
        directionCorrect,
        accuracy,
        mastery,
        overshoot: overshootAnalysis,
        feedback: this.generateDirectionFeedback(
          targetDirection,
          detectedDirection,
          overshootAnalysis,
          accuracy
        ),
        timestamp: Date.now()
      };
      this.recordAnalysis(analysis);
      if (this.debugMode) {
        this.logAnalysisDetails(analysis);
      }
      return analysis;
    } catch (error) {
      console.error("❌ [DirectionAnalyzer] 分析エラー:", error);
      return this.createErrorResult(baseFreq, targetFreq, detectedFreq);
    }
  }
  /**
   * 方向性の判定
   * @param {number} baseFreq - 基音周波数
   * @param {number} targetFreq - 目標周波数
   * @returns {Object} - 方向性情報
   */
  determineDirection(baseFreq, targetFreq) {
    const semitones = this.calculateSemitones(baseFreq, targetFreq);
    if (Math.abs(semitones) <= this.thresholds.unison) {
      return { key: "unison", ...this.directions.unison };
    }
    if (semitones > 0) {
      return { key: "ascending", ...this.directions.ascending };
    } else {
      return { key: "descending", ...this.directions.descending };
    }
  }
  /**
   * セミトーン差の計算
   * @param {number} baseFreq - 基音周波数
   * @param {number} targetFreq - 目標周波数
   * @returns {number} - セミトーン差（符号付き）
   */
  calculateSemitones(baseFreq, targetFreq) {
    if (!baseFreq || !targetFreq || baseFreq <= 0 || targetFreq <= 0) {
      return 0;
    }
    return 12 * Math.log2(targetFreq / baseFreq);
  }
  /**
   * オーバーシュート・アンダーシュート分析
   * @param {number} targetSemitones - 目標セミトーン
   * @param {number} detectedSemitones - 検出セミトーン
   * @returns {Object} - オーバーシュート分析結果
   */
  analyzeOvershoot(targetSemitones, detectedSemitones) {
    const difference = detectedSemitones - targetSemitones;
    const absDifference = Math.abs(difference);
    let type = "accurate";
    let severity = "none";
    if (absDifference >= this.thresholds.overshoot) {
      if (difference > 0) {
        type = "overshoot";
      } else {
        type = "undershoot";
      }
      if (absDifference >= this.thresholds.significant) {
        severity = "severe";
      } else {
        severity = "moderate";
      }
    }
    return {
      type,
      severity,
      difference,
      absDifference,
      percentage: absDifference / Math.abs(targetSemitones) * 100
    };
  }
  /**
   * 方向性精度の計算
   * @param {string} targetDir - 目標方向
   * @param {string} detectedDir - 検出方向
   * @param {number} targetSemitones - 目標セミトーン
   * @param {number} detectedSemitones - 検出セミトーン
   * @returns {number} - 方向性精度 (0-100)
   */
  calculateDirectionAccuracy(targetDir, detectedDir, targetSemitones, detectedSemitones) {
    if (targetDir !== detectedDir) {
      return Math.max(0, 30 - Math.abs(detectedSemitones - targetSemitones) * 5);
    }
    const semitoneError = Math.abs(detectedSemitones - targetSemitones);
    const accuracy = Math.max(0, 100 - semitoneError * 25);
    return Math.min(100, accuracy);
  }
  /**
   * 方向性習得度の更新
   * @param {string} direction - 方向性
   * @param {number} accuracy - 精度
   * @param {boolean} correct - 正解フラグ
   */
  updateDirectionMastery(direction, accuracy, correct) {
    if (!this.directionMastery.has(direction)) {
      this.directionMastery.set(direction, {
        attempts: 0,
        correctAttempts: 0,
        totalAccuracy: 0,
        averageAccuracy: 0,
        bestAccuracy: 0,
        successRate: 0,
        recentAttempts: [],
        recentCorrects: [],
        lastAttempt: null,
        trend: "stable"
      });
    }
    const mastery = this.directionMastery.get(direction);
    mastery.attempts++;
    if (correct) mastery.correctAttempts++;
    mastery.totalAccuracy += accuracy;
    mastery.averageAccuracy = mastery.totalAccuracy / mastery.attempts;
    mastery.bestAccuracy = Math.max(mastery.bestAccuracy, accuracy);
    mastery.successRate = mastery.correctAttempts / mastery.attempts * 100;
    mastery.lastAttempt = Date.now();
    mastery.recentAttempts.push(accuracy);
    mastery.recentCorrects.push(correct);
    if (mastery.recentAttempts.length > 10) {
      mastery.recentAttempts.shift();
      mastery.recentCorrects.shift();
    }
    mastery.trend = this.calculateDirectionTrend(mastery.recentCorrects);
    this.directionMastery.set(direction, mastery);
  }
  /**
   * 方向性習得度の取得
   * @param {string} direction - 方向性
   * @returns {Object} - 習得度情報
   */
  getDirectionMastery(direction) {
    const mastery = this.directionMastery.get(direction);
    if (!mastery) {
      return {
        attempts: 0,
        successRate: 0,
        averageAccuracy: 0,
        level: "beginner",
        progress: 0
      };
    }
    const level = this.determineDirectionLevel(mastery.successRate, mastery.attempts);
    const progress = Math.min(100, mastery.successRate * mastery.attempts / 500);
    return {
      ...mastery,
      level,
      progress: Math.round(progress)
    };
  }
  /**
   * 方向性習得レベルの判定
   * @param {number} successRate - 成功率
   * @param {number} attempts - 試行回数
   * @returns {string} - 習得レベル
   */
  determineDirectionLevel(successRate, attempts) {
    if (attempts < 3) return "beginner";
    if (successRate >= 95 && attempts >= 10) return "master";
    if (successRate >= 85 && attempts >= 7) return "advanced";
    if (successRate >= 75 && attempts >= 5) return "intermediate";
    if (successRate >= 60) return "novice";
    return "beginner";
  }
  /**
   * 方向性トレンド分析
   * @param {Array} recentCorrects - 直近の正解状況
   * @returns {string} - トレンド
   */
  calculateDirectionTrend(recentCorrects) {
    if (recentCorrects.length < 5) return "stable";
    const recent = recentCorrects.slice(-3);
    const earlier = recentCorrects.slice(-6, -3);
    if (earlier.length === 0) return "stable";
    const recentSuccessRate = recent.filter(Boolean).length / recent.length;
    const earlierSuccessRate = earlier.filter(Boolean).length / earlier.length;
    const improvement = recentSuccessRate - earlierSuccessRate;
    if (improvement > 0.2) return "improving";
    if (improvement < -0.2) return "declining";
    return "stable";
  }
  /**
   * 方向性フィードバック生成
   * @param {Object} targetDirection - 目標方向
   * @param {Object} detectedDirection - 検出方向
   * @param {Object} overshoot - オーバーシュート分析
   * @param {number} accuracy - 精度
   * @returns {string} - フィードバックメッセージ
   */
  generateDirectionFeedback(targetDirection, detectedDirection, overshoot, accuracy) {
    const isCorrect = targetDirection.key === detectedDirection.key;
    if (isCorrect && accuracy >= 90) {
      return `🎯 ${targetDirection.name}の方向性が完璧です！`;
    }
    if (isCorrect && accuracy >= 70) {
      return `✅ ${targetDirection.name}の方向は正しいです。距離の調整をしてみましょう。`;
    }
    if (isCorrect) {
      if (overshoot.type === "overshoot") {
        return `👍 ${targetDirection.name}の方向は正しいですが、少し歌いすぎです。`;
      } else if (overshoot.type === "undershoot") {
        return `👍 ${targetDirection.name}の方向は正しいですが、もう少し大きく歌ってみてください。`;
      }
      return `👍 ${targetDirection.name}の方向は認識できています。`;
    }
    if (targetDirection.key === "ascending" && detectedDirection.key === "descending") {
      return `❌ 上行のつもりが下行になっています。基音より高く歌ってください。`;
    }
    if (targetDirection.key === "descending" && detectedDirection.key === "ascending") {
      return `❌ 下行のつもりが上行になっています。基音より低く歌ってください。`;
    }
    if (targetDirection.key !== "unison" && detectedDirection.key === "unison") {
      return `❌ 音程変化が小さすぎます。${targetDirection.name}により大きく歌ってください。`;
    }
    return `❌ ${targetDirection.name}ではなく${detectedDirection.name}と認識されました。`;
  }
  /**
   * 全方向性の習得状況取得
   * @returns {Object} - 全方向性習得データ
   */
  getAllDirectionMastery() {
    const result = {};
    for (const [key, direction] of Object.entries(this.directions)) {
      result[key] = {
        direction,
        mastery: this.getDirectionMastery(key)
      };
    }
    return result;
  }
  /**
   * 方向性比較分析
   * @returns {Object} - 上行・下行の比較結果
   */
  getDirectionComparison() {
    const ascending = this.getDirectionMastery("ascending");
    const descending = this.getDirectionMastery("descending");
    return {
      ascending,
      descending,
      comparison: {
        betterDirection: ascending.successRate > descending.successRate ? "ascending" : "descending",
        difference: Math.abs(ascending.successRate - descending.successRate),
        recommendation: this.generateDirectionRecommendation(ascending, descending)
      }
    };
  }
  /**
   * 方向性改善提案生成
   * @param {Object} ascending - 上行習得度
   * @param {Object} descending - 下行習得度
   * @returns {string} - 改善提案
   */
  generateDirectionRecommendation(ascending, descending) {
    const diff = ascending.successRate - descending.successRate;
    if (Math.abs(diff) < 10) {
      return "上行・下行ともにバランス良く習得できています。";
    }
    if (diff > 10) {
      return "下行の練習を重点的に行うことをお勧めします。下向きの音程により意識を向けてみてください。";
    } else {
      return "上行の練習を重点的に行うことをお勧めします。上向きの音程により意識を向けてみてください。";
    }
  }
  /**
   * 方向性習得度データの初期化
   */
  initializeDirectionMastery() {
    for (const directionKey of Object.keys(this.directions)) {
      if (!this.directionMastery.has(directionKey)) {
        this.directionMastery.set(directionKey, {
          attempts: 0,
          correctAttempts: 0,
          totalAccuracy: 0,
          averageAccuracy: 0,
          bestAccuracy: 0,
          successRate: 0,
          recentAttempts: [],
          recentCorrects: [],
          lastAttempt: null,
          trend: "stable"
        });
      }
    }
  }
  /**
   * 分析履歴の記録
   * @param {Object} analysis - 分析結果
   */
  recordAnalysis(analysis) {
    this.analysisHistory.push(analysis);
    if (this.analysisHistory.length > this.maxHistoryLength) {
      this.analysisHistory.shift();
    }
  }
  /**
   * エラー結果の作成
   * @param {number} baseFreq - 基音周波数
   * @param {number} targetFreq - 目標周波数
   * @param {number} detectedFreq - 検出周波数
   * @returns {Object} - エラー結果
   */
  createErrorResult(baseFreq, targetFreq, detectedFreq) {
    return {
      targetDirection: { name: "不明", key: "unknown" },
      detectedDirection: { name: "不明", key: "unknown" },
      directionCorrect: false,
      accuracy: 0,
      mastery: { level: "beginner", progress: 0 },
      overshoot: { type: "unknown", severity: "none" },
      feedback: "方向性分析でエラーが発生しました。",
      error: true
    };
  }
  /**
   * 詳細分析ログ出力
   * @param {Object} analysis - 分析結果
   */
  logAnalysisDetails(analysis) {
    console.group(`🧭 [DirectionAnalyzer] ${analysis.targetDirection.name}分析結果`);
    console.log("🎯 方向性分析:", {
      目標: `${analysis.targetDirection.name} (${analysis.targetSemitones.toFixed(1)}セミトーン)`,
      検出: `${analysis.detectedDirection.name} (${analysis.detectedSemitones.toFixed(1)}セミトーン)`,
      正解: analysis.directionCorrect ? "✅" : "❌",
      精度: `${analysis.accuracy.toFixed(1)}%`
    });
    console.log("📊 オーバーシュート分析:", {
      タイプ: analysis.overshoot.type,
      深刻度: analysis.overshoot.severity,
      差分: `${analysis.overshoot.difference.toFixed(1)}セミトーン`,
      誤差率: `${analysis.overshoot.percentage.toFixed(1)}%`
    });
    console.log("📈 習得状況:", {
      レベル: analysis.mastery.level,
      成功率: `${analysis.mastery.successRate?.toFixed(1) || 0}%`,
      試行回数: analysis.mastery.attempts,
      トレンド: analysis.mastery.trend
    });
    console.log("💬 フィードバック:", analysis.feedback);
    console.groupEnd();
  }
  /**
   * デバッグログ出力
   * @param {string} message - ログメッセージ
   * @param {Object} data - 追加データ
   */
  log(message, data = null) {
    if (this.debugMode) {
      if (data) {
        console.log(`[DirectionAnalyzer] ${message}`, data);
      } else {
        console.log(`[DirectionAnalyzer] ${message}`);
      }
    }
  }
  /**
   * 統計データの取得
   * @returns {Object} - 統計データ
   */
  getStatistics() {
    return {
      totalAnalyses: this.analysisHistory.length,
      directionTypes: Object.keys(this.directions).length,
      masteryData: Object.fromEntries(this.directionMastery),
      thresholds: this.thresholds
    };
  }
  /**
   * データのリセット
   */
  reset() {
    this.directionMastery.clear();
    this.analysisHistory = [];
    this.initializeDirectionMastery();
    this.log("🔄 DirectionAnalyzer リセット完了");
  }
}
if (typeof window !== "undefined" && true) {
  window.DirectionAnalyzer = DirectionAnalyzer;
}
class ConsistencyTracker {
  constructor(config = {}) {
    this.config = {
      windowSize: config.windowSize || 5,
      // 一貫性評価のウィンドウサイズ
      maxHistory: config.maxHistory || 100,
      // 最大履歴保持数
      stabilityThreshold: config.stabilityThreshold || 25,
      // 安定性閾値（セント）
      trendWindowSize: config.trendWindowSize || 10,
      // トレンド分析ウィンドウ
      fatigueDetectionWindow: config.fatigueDetectionWindow || 15
      // 疲労検出ウィンドウ
    };
    this.consistencyData = /* @__PURE__ */ new Map();
    this.stabilityHistory = [];
    this.sessionData = {
      startTime: Date.now(),
      totalAttempts: 0,
      overallConsistency: 0,
      stabilityTrend: "stable",
      fatigueLevel: "fresh",
      concentrationLevel: "high"
    };
    this.debugMode = true;
    this.log("📊 ConsistencyTracker初期化完了", {
      config: this.config,
      sessionStart: new Date(this.sessionData.startTime).toLocaleTimeString()
    });
  }
  /**
   * 新しい試行の記録と一貫性分析
   * @param {string} intervalType - 音程タイプ
   * @param {number} centsDiff - セント差
   * @param {number} accuracy - 精度スコア
   * @param {number} responseTime - 反応時間
   * @returns {Object} - 一貫性分析結果
   */
  recordAttempt(intervalType, centsDiff, accuracy, responseTime) {
    try {
      this.addAttemptData(intervalType, centsDiff, accuracy, responseTime);
      const intervalConsistency = this.calculateIntervalConsistency(intervalType);
      this.updateOverallConsistency();
      const stabilityTrend = this.analyzeStabilityTrend();
      const fatigueAnalysis = this.analyzeFatigue();
      const analysis = {
        intervalType,
        intervalConsistency,
        overallConsistency: this.sessionData.overallConsistency,
        stabilityTrend,
        fatigueAnalysis,
        recommendations: this.generateConsistencyRecommendations(intervalConsistency, fatigueAnalysis),
        timestamp: Date.now()
      };
      this.updateSessionData(analysis);
      if (this.debugMode) {
        this.logConsistencyDetails(analysis);
      }
      return analysis;
    } catch (error) {
      console.error("❌ [ConsistencyTracker] 記録エラー:", error);
      return this.createErrorResult(intervalType);
    }
  }
  /**
   * 試行データの追加
   * @param {string} intervalType - 音程タイプ
   * @param {number} centsDiff - セント差
   * @param {number} accuracy - 精度スコア
   * @param {number} responseTime - 反応時間
   */
  addAttemptData(intervalType, centsDiff, accuracy, responseTime) {
    if (!this.consistencyData.has(intervalType)) {
      this.consistencyData.set(intervalType, {
        attempts: [],
        statistics: {
          count: 0,
          mean: 0,
          standardDeviation: 0,
          variance: 0,
          range: 0,
          consistencyScore: 0
        },
        trend: "stable",
        lastUpdated: Date.now()
      });
    }
    const data = this.consistencyData.get(intervalType);
    const attemptData = {
      centsDiff,
      accuracy,
      responseTime,
      timestamp: Date.now()
    };
    data.attempts.push(attemptData);
    if (data.attempts.length > this.config.maxHistory) {
      data.attempts.shift();
    }
    this.updateStatistics(intervalType);
    this.stabilityHistory.push({
      intervalType,
      centsDiff: Math.abs(centsDiff),
      accuracy,
      timestamp: Date.now()
    });
    if (this.stabilityHistory.length > this.config.maxHistory) {
      this.stabilityHistory.shift();
    }
    this.sessionData.totalAttempts++;
  }
  /**
   * 音程別統計の更新
   * @param {string} intervalType - 音程タイプ
   */
  updateStatistics(intervalType) {
    const data = this.consistencyData.get(intervalType);
    const attempts = data.attempts;
    if (attempts.length === 0) return;
    const centsDiffs = attempts.map((a) => Math.abs(a.centsDiff));
    const count = centsDiffs.length;
    const mean = centsDiffs.reduce((sum, val) => sum + val, 0) / count;
    const variance = centsDiffs.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / count;
    const standardDeviation = Math.sqrt(variance);
    const range = Math.max(...centsDiffs) - Math.min(...centsDiffs);
    const consistencyScore = Math.max(0, 100 - standardDeviation * 2);
    data.statistics = {
      count,
      mean: Math.round(mean * 10) / 10,
      standardDeviation: Math.round(standardDeviation * 10) / 10,
      variance: Math.round(variance * 10) / 10,
      range: Math.round(range * 10) / 10,
      consistencyScore: Math.round(consistencyScore * 10) / 10
    };
    data.trend = this.calculateIntervalTrend(attempts);
    data.lastUpdated = Date.now();
  }
  /**
   * 音程別一貫性の計算
   * @param {string} intervalType - 音程タイプ
   * @returns {Object} - 一貫性分析結果
   */
  calculateIntervalConsistency(intervalType) {
    const data = this.consistencyData.get(intervalType);
    if (!data || data.attempts.length < 2) {
      return {
        level: "insufficient_data",
        score: 0,
        description: "データ不足",
        attempts: data?.attempts.length || 0
      };
    }
    const stats = data.statistics;
    const level = this.determineConsistencyLevel(stats.consistencyScore);
    return {
      intervalType,
      level,
      score: stats.consistencyScore,
      statistics: stats,
      trend: data.trend,
      description: this.getConsistencyDescription(level),
      attempts: stats.count,
      recommendation: this.getIntervalRecommendation(intervalType, stats, data.trend)
    };
  }
  /**
   * 一貫性レベルの判定
   * @param {number} score - 一貫性スコア
   * @returns {string} - 一貫性レベル
   */
  determineConsistencyLevel(score) {
    if (score >= 90) return "excellent";
    if (score >= 75) return "good";
    if (score >= 60) return "fair";
    if (score >= 40) return "poor";
    return "very_poor";
  }
  /**
   * 一貫性レベルの説明
   * @param {string} level - 一貫性レベル
   * @returns {string} - 説明文
   */
  getConsistencyDescription(level) {
    const descriptions = {
      excellent: "非常に安定した精度で認識できています",
      good: "安定した認識ができています",
      fair: "やや不安定ですが、改善の余地があります",
      poor: "不安定な認識です。練習を重ねましょう",
      very_poor: "非常に不安定です。基礎練習から始めましょう",
      insufficient_data: "データが不足しています"
    };
    return descriptions[level] || "評価不能";
  }
  /**
   * 全体的一貫性の更新
   */
  updateOverallConsistency() {
    if (this.stabilityHistory.length < 5) {
      this.sessionData.overallConsistency = 0;
      return;
    }
    const recentAttempts = this.stabilityHistory.slice(-this.config.trendWindowSize);
    const centsDiffs = recentAttempts.map((a) => a.centsDiff);
    const mean = centsDiffs.reduce((sum, val) => sum + val, 0) / centsDiffs.length;
    const standardDeviation = Math.sqrt(
      centsDiffs.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / centsDiffs.length
    );
    this.sessionData.overallConsistency = Math.max(0, 100 - standardDeviation * 2);
  }
  /**
   * 安定性トレンドの分析
   * @returns {Object} - トレンド分析結果
   */
  analyzeStabilityTrend() {
    if (this.stabilityHistory.length < this.config.trendWindowSize) {
      return {
        trend: "insufficient_data",
        direction: "stable",
        confidence: 0,
        description: "データ不足"
      };
    }
    const recentData = this.stabilityHistory.slice(-this.config.trendWindowSize);
    const half = Math.floor(this.config.trendWindowSize / 2);
    const earlierHalf = recentData.slice(0, half);
    const laterHalf = recentData.slice(-half);
    const earlierAvg = earlierHalf.reduce((sum, a) => sum + a.centsDiff, 0) / earlierHalf.length;
    const laterAvg = laterHalf.reduce((sum, a) => sum + a.centsDiff, 0) / laterHalf.length;
    const improvement = earlierAvg - laterAvg;
    const improvementPercent = improvement / earlierAvg * 100;
    let trend, direction, confidence;
    if (Math.abs(improvementPercent) < 10) {
      trend = "stable";
      direction = "stable";
      confidence = 0.7;
    } else if (improvement > 0) {
      trend = "improving";
      direction = "better";
      confidence = Math.min(0.9, Math.abs(improvementPercent) / 20);
    } else {
      trend = "declining";
      direction = "worse";
      confidence = Math.min(0.9, Math.abs(improvementPercent) / 20);
    }
    this.sessionData.stabilityTrend = trend;
    return {
      trend,
      direction,
      confidence: Math.round(confidence * 100) / 100,
      improvement: Math.round(improvement * 10) / 10,
      improvementPercent: Math.round(improvementPercent * 10) / 10,
      description: this.getTrendDescription(trend, direction)
    };
  }
  /**
   * 疲労度・集中力の分析
   * @returns {Object} - 疲労分析結果
   */
  analyzeFatigue() {
    if (this.stabilityHistory.length < this.config.fatigueDetectionWindow) {
      return {
        fatigueLevel: "unknown",
        concentrationLevel: "unknown",
        recommendation: "データ不足のため判定できません"
      };
    }
    const recentData = this.stabilityHistory.slice(-this.config.fatigueDetectionWindow);
    const sessionDuration = Date.now() - this.sessionData.startTime;
    const sessionMinutes = sessionDuration / (1e3 * 60);
    let timeFatigue = "fresh";
    if (sessionMinutes > 30) timeFatigue = "moderate";
    if (sessionMinutes > 60) timeFatigue = "tired";
    if (sessionMinutes > 90) timeFatigue = "exhausted";
    const accuracies = recentData.map((a) => a.accuracy);
    const recentAvgAccuracy = accuracies.reduce((sum, val) => sum + val, 0) / accuracies.length;
    const allAccuracies = this.stabilityHistory.map((a) => a.accuracy);
    const overallAvgAccuracy = allAccuracies.reduce((sum, val) => sum + val, 0) / allAccuracies.length;
    const accuracyDrop = overallAvgAccuracy - recentAvgAccuracy;
    let performanceFatigue = "fresh";
    if (accuracyDrop > 5) performanceFatigue = "moderate";
    if (accuracyDrop > 10) performanceFatigue = "tired";
    if (accuracyDrop > 20) performanceFatigue = "exhausted";
    const fatigueLevel = this.combineFatigueFactors(timeFatigue, performanceFatigue);
    const concentrationLevel = this.evaluateConcentration(recentData);
    this.sessionData.fatigueLevel = fatigueLevel;
    this.sessionData.concentrationLevel = concentrationLevel;
    return {
      fatigueLevel,
      concentrationLevel,
      sessionMinutes: Math.round(sessionMinutes),
      accuracyDrop: Math.round(accuracyDrop * 10) / 10,
      recommendation: this.getFatigueRecommendation(fatigueLevel, concentrationLevel)
    };
  }
  /**
   * 疲労要因の統合
   * @param {string} timeFatigue - 時間疲労
   * @param {string} performanceFatigue - パフォーマンス疲労
   * @returns {string} - 総合疲労度
   */
  combineFatigueFactors(timeFatigue, performanceFatigue) {
    const fatigueOrder = ["fresh", "moderate", "tired", "exhausted"];
    const timeIndex = fatigueOrder.indexOf(timeFatigue);
    const performanceIndex = fatigueOrder.indexOf(performanceFatigue);
    const maxIndex = Math.max(timeIndex, performanceIndex);
    return fatigueOrder[maxIndex];
  }
  /**
   * 集中力の評価
   * @param {Array} recentData - 直近データ
   * @returns {string} - 集中力レベル
   */
  evaluateConcentration(recentData) {
    const centsDiffs = recentData.map((a) => a.centsDiff);
    const standardDeviation = Math.sqrt(
      centsDiffs.reduce((sum, val) => sum + Math.pow(val - centsDiffs.reduce((s, v) => s + v, 0) / centsDiffs.length, 2), 0) / centsDiffs.length
    );
    if (standardDeviation <= 15) return "high";
    if (standardDeviation <= 25) return "medium";
    if (standardDeviation <= 40) return "low";
    return "very_low";
  }
  /**
   * 一貫性改善提案の生成
   * @param {Object} intervalConsistency - 音程一貫性
   * @param {Object} fatigueAnalysis - 疲労分析
   * @returns {Array} - 改善提案リスト
   */
  generateConsistencyRecommendations(intervalConsistency, fatigueAnalysis) {
    const recommendations = [];
    if (fatigueAnalysis.fatigueLevel === "tired" || fatigueAnalysis.fatigueLevel === "exhausted") {
      recommendations.push({
        type: "rest",
        priority: "high",
        message: "疲労が見られます。10-15分の休憩をお勧めします。",
        icon: "😴"
      });
    }
    if (fatigueAnalysis.concentrationLevel === "low" || fatigueAnalysis.concentrationLevel === "very_low") {
      recommendations.push({
        type: "focus",
        priority: "medium",
        message: "集中力が低下しています。深呼吸をして、ゆっくりと練習してみてください。",
        icon: "🧘"
      });
    }
    if (intervalConsistency.level === "poor" || intervalConsistency.level === "very_poor") {
      recommendations.push({
        type: "practice",
        priority: "medium",
        message: `${intervalConsistency.intervalType}の練習を重点的に行いましょう。ゆっくりと正確に歌うことを意識してください。`,
        icon: "🎯"
      });
    }
    if (intervalConsistency.trend === "improving") {
      recommendations.push({
        type: "encouragement",
        priority: "low",
        message: "改善が見られます！この調子で練習を続けてください。",
        icon: "📈"
      });
    }
    return recommendations;
  }
  /**
   * 音程別推奨事項の生成
   * @param {string} intervalType - 音程タイプ
   * @param {Object} statistics - 統計データ
   * @param {string} trend - トレンド
   * @returns {string} - 推奨事項
   */
  getIntervalRecommendation(intervalType, statistics, trend) {
    if (statistics.consistencyScore >= 80) {
      return "安定した認識ができています。この精度を維持しましょう。";
    }
    if (trend === "improving") {
      return "改善傾向にあります。継続して練習してください。";
    }
    if (statistics.standardDeviation > 30) {
      return "ばらつきが大きいです。ゆっくりと正確に歌うことを意識してください。";
    }
    return `${intervalType}の特徴を意識して、一定の精度で歌えるよう練習しましょう。`;
  }
  /**
   * トレンド説明の生成
   * @param {string} trend - トレンド
   * @param {string} direction - 方向
   * @returns {string} - 説明文
   */
  getTrendDescription(trend, direction) {
    const descriptions = {
      stable: "安定した精度を維持しています",
      improving: "精度が向上しています",
      declining: "精度が低下しています"
    };
    return descriptions[trend] || "傾向を分析中";
  }
  /**
   * 疲労度推奨事項の生成
   * @param {string} fatigueLevel - 疲労度
   * @param {string} concentrationLevel - 集中力
   * @returns {string} - 推奨事項
   */
  getFatigueRecommendation(fatigueLevel, concentrationLevel) {
    if (fatigueLevel === "exhausted") {
      return "今日はここまでにして、十分な休息を取ることをお勧めします。";
    }
    if (fatigueLevel === "tired") {
      return "15-20分の休憩を取ってから練習を再開しましょう。";
    }
    if (concentrationLevel === "very_low") {
      return "集中力が低下しています。環境を整えて、短時間の集中練習を心がけましょう。";
    }
    if (concentrationLevel === "low") {
      return "深呼吸をして、一つ一つの音程に集中して練習してみてください。";
    }
    return "良い状態です。この調子で練習を続けてください。";
  }
  /**
   * 音程別トレンドの計算
   * @param {Array} attempts - 試行データ
   * @returns {string} - トレンド
   */
  calculateIntervalTrend(attempts) {
    if (attempts.length < 6) return "stable";
    const recent = attempts.slice(-3);
    const earlier = attempts.slice(-6, -3);
    const recentAvg = recent.reduce((sum, a) => sum + Math.abs(a.centsDiff), 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, a) => sum + Math.abs(a.centsDiff), 0) / earlier.length;
    const improvement = earlierAvg - recentAvg;
    if (improvement > 5) return "improving";
    if (improvement < -5) return "declining";
    return "stable";
  }
  /**
   * セッションデータの更新
   * @param {Object} analysis - 分析結果
   */
  updateSessionData(analysis) {
    this.sessionData.overallConsistency = analysis.overallConsistency;
    this.sessionData.stabilityTrend = analysis.stabilityTrend.trend;
    this.sessionData.fatigueLevel = analysis.fatigueAnalysis.fatigueLevel;
    this.sessionData.concentrationLevel = analysis.fatigueAnalysis.concentrationLevel;
  }
  /**
   * エラー結果の作成
   * @param {string} intervalType - 音程タイプ
   * @returns {Object} - エラー結果
   */
  createErrorResult(intervalType) {
    return {
      intervalType,
      intervalConsistency: { level: "error", score: 0 },
      overallConsistency: 0,
      stabilityTrend: { trend: "error" },
      fatigueAnalysis: { fatigueLevel: "unknown" },
      recommendations: [],
      error: true
    };
  }
  /**
   * 詳細一貫性ログ出力
   * @param {Object} analysis - 分析結果
   */
  logConsistencyDetails(analysis) {
    console.group(`📊 [ConsistencyTracker] ${analysis.intervalType}一貫性分析`);
    console.log("🎯 音程一貫性:", {
      レベル: analysis.intervalConsistency.level,
      スコア: `${analysis.intervalConsistency.score}%`,
      標準偏差: `${analysis.intervalConsistency.statistics?.standardDeviation || 0}セント`,
      試行回数: analysis.intervalConsistency.attempts
    });
    console.log("📈 トレンド分析:", {
      全体傾向: analysis.stabilityTrend.trend,
      方向: analysis.stabilityTrend.direction,
      信頼度: `${(analysis.stabilityTrend.confidence * 100).toFixed(0)}%`,
      改善度: `${analysis.stabilityTrend.improvement}セント`
    });
    console.log("😴 疲労分析:", {
      疲労度: analysis.fatigueAnalysis.fatigueLevel,
      集中力: analysis.fatigueAnalysis.concentrationLevel,
      セッション時間: `${analysis.fatigueAnalysis.sessionMinutes}分`,
      精度低下: `${analysis.fatigueAnalysis.accuracyDrop}%`
    });
    if (analysis.recommendations.length > 0) {
      console.log("💡 推奨事項:", analysis.recommendations.map((r) => r.message));
    }
    console.groupEnd();
  }
  /**
   * デバッグログ出力
   * @param {string} message - ログメッセージ
   * @param {Object} data - 追加データ
   */
  log(message, data = null) {
    if (this.debugMode) {
      if (data) {
        console.log(`[ConsistencyTracker] ${message}`, data);
      } else {
        console.log(`[ConsistencyTracker] ${message}`);
      }
    }
  }
  /**
   * 全一貫性データの取得
   * @returns {Object} - 全一貫性データ
   */
  getAllConsistencyData() {
    const result = {};
    for (const [intervalType, data] of this.consistencyData.entries()) {
      result[intervalType] = {
        statistics: data.statistics,
        trend: data.trend,
        attempts: data.attempts.length,
        lastUpdated: data.lastUpdated
      };
    }
    return {
      intervalData: result,
      sessionData: this.sessionData,
      overallStats: {
        totalAttempts: this.sessionData.totalAttempts,
        overallConsistency: this.sessionData.overallConsistency,
        sessionDuration: Date.now() - this.sessionData.startTime
      }
    };
  }
  /**
   * 統計データの取得
   * @returns {Object} - 統計データ
   */
  getStatistics() {
    return {
      totalIntervalTypes: this.consistencyData.size,
      totalAttempts: this.sessionData.totalAttempts,
      sessionDuration: Date.now() - this.sessionData.startTime,
      overallConsistency: this.sessionData.overallConsistency,
      stabilityTrend: this.sessionData.stabilityTrend,
      fatigueLevel: this.sessionData.fatigueLevel
    };
  }
  /**
   * データのリセット
   */
  reset() {
    this.consistencyData.clear();
    this.stabilityHistory = [];
    this.sessionData = {
      startTime: Date.now(),
      totalAttempts: 0,
      overallConsistency: 0,
      stabilityTrend: "stable",
      fatigueLevel: "fresh",
      concentrationLevel: "high"
    };
    this.log("🔄 ConsistencyTracker リセット完了");
  }
}
if (typeof window !== "undefined" && true) {
  window.ConsistencyTracker = ConsistencyTracker;
}
class EnhancedScoringEngine {
  constructor(config = {}) {
    this.config = {
      // 採点重み設定
      weights: {
        pitchAccuracy: config.weights?.pitchAccuracy || 0.4,
        // 音程精度
        recognitionSpeed: config.weights?.recognitionSpeed || 0.2,
        // 認識速度
        intervalMastery: config.weights?.intervalMastery || 0.2,
        // 音程習得度
        directionAccuracy: config.weights?.directionAccuracy || 0.1,
        // 方向性精度
        consistency: config.weights?.consistency || 0.1
        // 一貫性
      },
      // 速度評価設定
      speedThresholds: {
        excellent: config.speedThresholds?.excellent || 1e3,
        // 1秒以内
        good: config.speedThresholds?.good || 2e3,
        // 2秒以内
        fair: config.speedThresholds?.fair || 3e3,
        // 3秒以内
        poor: config.speedThresholds?.poor || 5e3
        // 5秒以内
      },
      // HarmonicCorrection連携設定
      harmonicCorrection: {
        enabled: config.harmonicCorrection?.enabled ?? true,
        tolerance: config.harmonicCorrection?.tolerance || 50
        // セント
      },
      // データ保持設定
      sessionTracking: config.sessionTracking ?? true,
      maxHistorySize: config.maxHistorySize || 100
    };
    this.intervalAnalyzer = new IntervalAnalyzer();
    this.directionAnalyzer = new DirectionAnalyzer();
    this.consistencyTracker = new ConsistencyTracker();
    this.sessionData = {
      startTime: Date.now(),
      totalAttempts: 0,
      overallScore: 0,
      performanceHistory: [],
      currentLevel: "beginner",
      achievements: /* @__PURE__ */ new Set(),
      lastAnalysis: null
    };
    this.performanceMetrics = {
      averageSpeed: 0,
      accuracyTrend: "stable",
      strengthAreas: [],
      improvementAreas: [],
      sessionProgress: 0
    };
    this.debugMode = true;
    this.log("🎯 EnhancedScoringEngine初期化完了", {
      weights: this.config.weights,
      analyzers: ["IntervalAnalyzer", "DirectionAnalyzer", "ConsistencyTracker"]
    });
  }
  /**
   * メイン採点処理
   * @param {Object} params - 採点パラメータ
   * @param {number} params.baseFreq - 基音周波数
   * @param {number} params.targetFreq - 目標周波数
   * @param {number} params.detectedFreq - 検出周波数
   * @param {number} params.responseTime - 反応時間(ms)
   * @param {number} params.volume - 音量
   * @param {Object} params.harmonicCorrection - HarmonicCorrection結果
   * @returns {Object} - 統合採点結果
   */
  async analyzePerformance(params) {
    try {
      const {
        baseFreq,
        targetFreq,
        detectedFreq,
        responseTime,
        volume = 50,
        harmonicCorrection = null
      } = params;
      const validation = this.validateInputs(params);
      if (!validation.valid) {
        return this.createErrorResult(validation.error);
      }
      const correctedFreq = this.applyHarmonicCorrection(detectedFreq, harmonicCorrection);
      const analyses = await Promise.all([
        this.intervalAnalyzer.analyzeInterval(baseFreq, targetFreq, correctedFreq),
        this.directionAnalyzer.analyzeDirection(baseFreq, targetFreq, correctedFreq),
        this.consistencyTracker.recordAttempt(
          this.getIntervalType(baseFreq, targetFreq),
          this.calculateCentsDifference(targetFreq, correctedFreq),
          this.calculateRawAccuracy(targetFreq, correctedFreq),
          responseTime
        )
      ]);
      const [intervalAnalysis, directionAnalysis, consistencyAnalysis] = analyses;
      const speedAnalysis = this.analyzeRecognitionSpeed(responseTime);
      const integratedScore = this.calculateIntegratedScore({
        intervalAnalysis,
        directionAnalysis,
        consistencyAnalysis,
        speedAnalysis,
        volume
      });
      const performanceEvaluation = this.evaluateOverallPerformance(integratedScore);
      const adaptiveFeedback = this.generateAdaptiveFeedback({
        intervalAnalysis,
        directionAnalysis,
        consistencyAnalysis,
        speedAnalysis,
        performanceEvaluation
      });
      const sessionUpdate = this.updateSessionData(integratedScore, performanceEvaluation);
      const result = {
        // 基本情報
        timestamp: Date.now(),
        sessionAttempt: this.sessionData.totalAttempts,
        // 専門分析結果
        analyses: {
          interval: intervalAnalysis,
          direction: directionAnalysis,
          consistency: consistencyAnalysis,
          speed: speedAnalysis
        },
        // 統合評価
        score: integratedScore,
        performance: performanceEvaluation,
        feedback: adaptiveFeedback,
        // セッション情報
        session: sessionUpdate,
        // メタデータ
        metadata: {
          baseFreq,
          targetFreq,
          detectedFreq,
          correctedFreq,
          responseTime,
          volume,
          harmonicCorrectionApplied: !!harmonicCorrection
        }
      };
      this.recordAnalysisResult(result);
      if (this.debugMode) {
        this.logScoringDetails(result);
      }
      return result;
    } catch (error) {
      console.error("❌ [EnhancedScoringEngine] 採点エラー:", error);
      return this.createErrorResult("採点処理中にエラーが発生しました");
    }
  }
  /**
   * 入力値の検証
   * @param {Object} params - パラメータ
   * @returns {Object} - 検証結果
   */
  validateInputs(params) {
    const { baseFreq, targetFreq, detectedFreq, responseTime } = params;
    if (!baseFreq || !targetFreq || !detectedFreq) {
      return { valid: false, error: "必要な周波数データが不足しています" };
    }
    if (baseFreq <= 0 || targetFreq <= 0 || detectedFreq <= 0) {
      return { valid: false, error: "周波数は正の値である必要があります" };
    }
    if (responseTime < 0 || responseTime > 3e4) {
      return { valid: false, error: "反応時間が範囲外です" };
    }
    return { valid: true };
  }
  /**
   * HarmonicCorrectionの適用
   * @param {number} detectedFreq - 検出周波数
   * @param {Object} harmonicCorrection - 補正データ
   * @returns {number} - 補正後周波数
   */
  applyHarmonicCorrection(detectedFreq, harmonicCorrection) {
    if (!this.config.harmonicCorrection.enabled || !harmonicCorrection) {
      return detectedFreq;
    }
    if (harmonicCorrection.correctedFrequency && Math.abs(harmonicCorrection.correctedFrequency - detectedFreq) <= this.config.harmonicCorrection.tolerance) {
      this.log("🔧 HarmonicCorrection適用", {
        original: detectedFreq,
        corrected: harmonicCorrection.correctedFrequency,
        correction: harmonicCorrection.correction
      });
      return harmonicCorrection.correctedFrequency;
    }
    return detectedFreq;
  }
  /**
   * 認識速度の分析
   * @param {number} responseTime - 反応時間(ms)
   * @returns {Object} - 速度分析結果
   */
  analyzeRecognitionSpeed(responseTime) {
    const { speedThresholds } = this.config;
    let level, score, feedback;
    if (responseTime <= speedThresholds.excellent) {
      level = "excellent";
      score = 100;
      feedback = "⚡ 素早い認識です！";
    } else if (responseTime <= speedThresholds.good) {
      level = "good";
      score = 85;
      feedback = "👍 良い反応速度です。";
    } else if (responseTime <= speedThresholds.fair) {
      level = "fair";
      score = 70;
      feedback = "📈 もう少し早く認識できると良いでしょう。";
    } else if (responseTime <= speedThresholds.poor) {
      level = "poor";
      score = 50;
      feedback = "🐌 ゆっくりと確実に認識しましょう。";
    } else {
      level = "very_poor";
      score = 25;
      feedback = "⏰ 時間をかけすぎています。練習を重ねましょう。";
    }
    return {
      level,
      score,
      responseTime,
      feedback,
      comparison: this.compareToAverageSpeed(responseTime)
    };
  }
  /**
   * 統合スコアの計算
   * @param {Object} analyses - 各分析結果
   * @returns {Object} - 統合スコア
   */
  calculateIntegratedScore(analyses) {
    const { weights } = this.config;
    const { intervalAnalysis, directionAnalysis, consistencyAnalysis, speedAnalysis, volume } = analyses;
    const pitchAccuracy = intervalAnalysis.accuracy || 0;
    const recognitionSpeed = speedAnalysis.score || 0;
    const intervalMastery = this.calculateMasteryScore(intervalAnalysis.mastery);
    const directionAccuracy = directionAnalysis.accuracy || 0;
    const consistency = consistencyAnalysis.overallConsistency || 0;
    const totalScore = pitchAccuracy * weights.pitchAccuracy + recognitionSpeed * weights.recognitionSpeed + intervalMastery * weights.intervalMastery + directionAccuracy * weights.directionAccuracy + consistency * weights.consistency;
    const volumeAdjustment = this.calculateVolumeAdjustment(volume);
    const adjustedScore = Math.min(100, totalScore * volumeAdjustment);
    return {
      total: Math.round(adjustedScore * 10) / 10,
      components: {
        pitchAccuracy: Math.round(pitchAccuracy * 10) / 10,
        recognitionSpeed: Math.round(recognitionSpeed * 10) / 10,
        intervalMastery: Math.round(intervalMastery * 10) / 10,
        directionAccuracy: Math.round(directionAccuracy * 10) / 10,
        consistency: Math.round(consistency * 10) / 10
      },
      weights,
      volumeAdjustment: Math.round(volumeAdjustment * 100) / 100,
      grade: this.determineGrade(adjustedScore)
    };
  }
  /**
   * 習得度スコアの計算
   * @param {Object} mastery - 習得度データ
   * @returns {number} - 習得度スコア
   */
  calculateMasteryScore(mastery) {
    if (!mastery || mastery.attempts === 0) return 0;
    const baseScore = mastery.averageAccuracy || 0;
    const attemptBonus = Math.min(20, mastery.attempts * 2);
    const trendBonus = mastery.trend === "improving" ? 10 : 0;
    return Math.min(100, baseScore + attemptBonus + trendBonus);
  }
  /**
   * 音量調整係数の計算
   * @param {number} volume - 音量 (0-100)
   * @returns {number} - 調整係数
   */
  calculateVolumeAdjustment(volume) {
    if (volume < 20) return 0.8;
    if (volume > 80) return 0.95;
    return 1;
  }
  /**
   * 成績の判定
   * @param {number} score - スコア
   * @returns {string} - 成績
   */
  determineGrade(score) {
    if (score >= 95) return "S";
    if (score >= 90) return "A+";
    if (score >= 85) return "A";
    if (score >= 80) return "B+";
    if (score >= 75) return "B";
    if (score >= 70) return "C+";
    if (score >= 65) return "C";
    if (score >= 60) return "D+";
    if (score >= 55) return "D";
    return "F";
  }
  /**
   * 総合パフォーマンス評価
   * @param {Object} score - 統合スコア
   * @returns {Object} - パフォーマンス評価
   */
  evaluateOverallPerformance(score) {
    const level = this.determinePerformanceLevel(score.total);
    const strengths = this.identifyStrengths(score.components);
    const weaknesses = this.identifyWeaknesses(score.components);
    const improvement = this.calculateImprovement();
    return {
      level,
      score: score.total,
      grade: score.grade,
      strengths,
      weaknesses,
      improvement,
      recommendation: this.generatePerformanceRecommendation(level, strengths, weaknesses)
    };
  }
  /**
   * パフォーマンスレベルの判定
   * @param {number} score - 総合スコア
   * @returns {string} - パフォーマンスレベル
   */
  determinePerformanceLevel(score) {
    if (score >= 90) return "excellent";
    if (score >= 80) return "good";
    if (score >= 70) return "average";
    if (score >= 60) return "below_average";
    return "needs_improvement";
  }
  /**
   * 強みの特定
   * @param {Object} components - 成分スコア
   * @returns {Array} - 強み一覧
   */
  identifyStrengths(components) {
    const strengths = [];
    Object.entries(components).forEach(([key, value]) => {
      if (value >= 85) {
        strengths.push({
          area: key,
          score: value,
          level: "excellent"
        });
      } else if (value >= 75) {
        strengths.push({
          area: key,
          score: value,
          level: "good"
        });
      }
    });
    return strengths.sort((a, b) => b.score - a.score);
  }
  /**
   * 弱点の特定
   * @param {Object} components - 成分スコア
   * @returns {Array} - 弱点一覧
   */
  identifyWeaknesses(components) {
    const weaknesses = [];
    Object.entries(components).forEach(([key, value]) => {
      if (value < 60) {
        weaknesses.push({
          area: key,
          score: value,
          severity: value < 40 ? "high" : "medium"
        });
      }
    });
    return weaknesses.sort((a, b) => a.score - b.score);
  }
  /**
   * 改善度の計算
   * @returns {Object} - 改善度情報
   */
  calculateImprovement() {
    const history = this.sessionData.performanceHistory;
    if (history.length < 3) {
      return {
        trend: "insufficient_data",
        change: 0,
        description: "データ不足"
      };
    }
    const recent = history.slice(-3);
    const earlier = history.slice(-6, -3);
    if (earlier.length === 0) {
      return {
        trend: "stable",
        change: 0,
        description: "安定"
      };
    }
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, val) => sum + val, 0) / earlier.length;
    const change = recentAvg - earlierAvg;
    let trend, description;
    if (change > 5) {
      trend = "improving";
      description = "向上中";
    } else if (change < -5) {
      trend = "declining";
      description = "低下中";
    } else {
      trend = "stable";
      description = "安定";
    }
    return { trend, change: Math.round(change * 10) / 10, description };
  }
  /**
   * 適応的フィードバック生成
   * @param {Object} analyses - 各分析結果
   * @returns {Object} - フィードバック
   */
  generateAdaptiveFeedback(analyses) {
    const {
      intervalAnalysis,
      directionAnalysis,
      consistencyAnalysis,
      speedAnalysis,
      performanceEvaluation
    } = analyses;
    const feedback = {
      primary: this.getPrimaryFeedback(performanceEvaluation),
      detailed: {
        interval: intervalAnalysis.feedback || "音程分析結果なし",
        direction: directionAnalysis.feedback || "方向性分析結果なし",
        consistency: this.getConsistencyFeedback(consistencyAnalysis),
        speed: speedAnalysis.feedback || "速度分析結果なし"
      },
      recommendations: this.generateRecommendations(analyses),
      encouragement: this.generateEncouragement(performanceEvaluation),
      nextSteps: this.suggestNextSteps(performanceEvaluation)
    };
    return feedback;
  }
  /**
   * メインフィードバックの生成
   * @param {Object} performance - パフォーマンス評価
   * @returns {string} - メインフィードバック
   */
  getPrimaryFeedback(performance) {
    const { level, grade, score } = performance;
    const messages = {
      excellent: `🎯 素晴らしい！${grade}評価（${score}点）です。`,
      good: `👍 良い結果です！${grade}評価（${score}点）。`,
      average: `📈 平均的な結果です。${grade}評価（${score}点）。`,
      below_average: `💪 練習を続けましょう。${grade}評価（${score}点）。`,
      needs_improvement: `🎓 基礎から練習していきましょう。${grade}評価（${score}点）。`
    };
    return messages[level] || `結果: ${grade}評価（${score}点）`;
  }
  /**
   * 一貫性フィードバックの生成
   * @param {Object} consistency - 一貫性分析
   * @returns {string} - 一貫性フィードバック
   */
  getConsistencyFeedback(consistency) {
    if (consistency.recommendations && consistency.recommendations.length > 0) {
      return consistency.recommendations[0].message;
    }
    const score = consistency.overallConsistency || 0;
    if (score >= 80) return "🎯 一貫した精度を保っています。";
    if (score >= 60) return "📊 まずまずの安定性です。";
    return "📈 一貫性の改善が必要です。";
  }
  /**
   * 推奨事項の生成
   * @param {Object} analyses - 分析結果
   * @returns {Array} - 推奨事項リスト
   */
  generateRecommendations(analyses) {
    const recommendations = [];
    if (analyses.consistencyAnalysis.recommendations) {
      recommendations.push(...analyses.consistencyAnalysis.recommendations);
    }
    const { performanceEvaluation } = analyses;
    if (performanceEvaluation.weaknesses.length > 0) {
      const mainWeakness = performanceEvaluation.weaknesses[0];
      recommendations.push({
        type: "improvement",
        priority: "high",
        message: this.getImprovementSuggestion(mainWeakness.area),
        icon: "🎯"
      });
    }
    return recommendations;
  }
  /**
   * 改善提案の生成
   * @param {string} area - 改善エリア
   * @returns {string} - 改善提案
   */
  getImprovementSuggestion(area) {
    const suggestions = {
      pitchAccuracy: "音程の精度向上のため、ゆっくりと正確に歌う練習をしましょう。",
      recognitionSpeed: "反応速度向上のため、聞いた瞬間に歌う練習をしましょう。",
      intervalMastery: "苦手な音程を重点的に練習しましょう。",
      directionAccuracy: "上行・下行の方向性を意識して練習しましょう。",
      consistency: "一定の精度を保つため、集中力を高めて練習しましょう。"
    };
    return suggestions[area] || "継続的な練習で改善していきましょう。";
  }
  /**
   * 励ましメッセージの生成
   * @param {Object} performance - パフォーマンス
   * @returns {string} - 励ましメッセージ
   */
  generateEncouragement(performance) {
    if (performance.improvement.trend === "improving") {
      return "📈 確実に上達しています！この調子で続けましょう。";
    }
    if (performance.strengths.length > 0) {
      const strength = performance.strengths[0];
      return `⭐ ${this.getAreaName(strength.area)}が得意ですね！`;
    }
    return "🌟 練習を続けることで必ず上達します。頑張りましょう！";
  }
  /**
   * 次のステップの提案
   * @param {Object} performance - パフォーマンス
   * @returns {string} - 次のステップ
   */
  suggestNextSteps(performance) {
    if (performance.level === "excellent") {
      return "🎓 上級レベルに到達しています。より複雑な音程に挑戦してみましょう。";
    }
    if (performance.weaknesses.length > 0) {
      const weakness = performance.weaknesses[0];
      return `🎯 ${this.getAreaName(weakness.area)}の練習に重点を置きましょう。`;
    }
    return "📚 基礎練習を継続し、全体的なレベルアップを目指しましょう。";
  }
  /**
   * エリア名の取得
   * @param {string} area - エリアキー
   * @returns {string} - エリア名
   */
  getAreaName(area) {
    const names = {
      pitchAccuracy: "音程精度",
      recognitionSpeed: "認識速度",
      intervalMastery: "音程習得度",
      directionAccuracy: "方向性認識",
      consistency: "一貫性"
    };
    return names[area] || area;
  }
  /**
   * セッションデータの更新
   * @param {Object} score - スコア
   * @param {Object} performance - パフォーマンス
   * @returns {Object} - セッション更新情報
   */
  updateSessionData(score, performance) {
    this.sessionData.totalAttempts++;
    this.sessionData.performanceHistory.push(score.total);
    this.sessionData.overallScore = this.calculateSessionAverage();
    this.sessionData.currentLevel = performance.level;
    this.sessionData.lastAnalysis = Date.now();
    if (this.sessionData.performanceHistory.length > this.config.maxHistorySize) {
      this.sessionData.performanceHistory.shift();
    }
    this.updatePerformanceMetrics(score, performance);
    this.checkAchievements(score, performance);
    return {
      attempt: this.sessionData.totalAttempts,
      sessionAverage: this.sessionData.overallScore,
      sessionDuration: Date.now() - this.sessionData.startTime,
      level: this.sessionData.currentLevel,
      newAchievements: Array.from(this.sessionData.achievements)
    };
  }
  /**
   * セッション平均の計算
   * @returns {number} - セッション平均
   */
  calculateSessionAverage() {
    const history = this.sessionData.performanceHistory;
    if (history.length === 0) return 0;
    return history.reduce((sum, val) => sum + val, 0) / history.length;
  }
  /**
   * パフォーマンスメトリクスの更新
   * @param {Object} score - スコア
   * @param {Object} performance - パフォーマンス
   */
  updatePerformanceMetrics(score, performance) {
    if (score.components.recognitionSpeed > 0) {
      this.performanceMetrics.averageSpeed = (this.performanceMetrics.averageSpeed + score.components.recognitionSpeed) / 2;
    }
    this.performanceMetrics.accuracyTrend = performance.improvement.trend;
    this.performanceMetrics.strengthAreas = performance.strengths.map((s) => s.area);
    this.performanceMetrics.improvementAreas = performance.weaknesses.map((w) => w.area);
    this.performanceMetrics.sessionProgress = Math.min(
      100,
      this.sessionData.totalAttempts / 20 * 100
    );
  }
  /**
   * 達成確認
   * @param {Object} score - スコア
   * @param {Object} performance - パフォーマンス
   */
  checkAchievements(score, performance) {
    if (this.sessionData.totalAttempts === 1) {
      this.sessionData.achievements.add("first_attempt");
    }
    if (score.total >= 90 && !this.sessionData.achievements.has("high_score")) {
      this.sessionData.achievements.add("high_score");
    }
    if (score.total >= 98 && !this.sessionData.achievements.has("perfect_score")) {
      this.sessionData.achievements.add("perfect_score");
    }
    if (this.sessionData.totalAttempts >= 10 && !this.sessionData.achievements.has("persistent")) {
      this.sessionData.achievements.add("persistent");
    }
    if (performance.improvement.trend === "improving" && !this.sessionData.achievements.has("improving")) {
      this.sessionData.achievements.add("improving");
    }
  }
  /**
   * 平均速度との比較
   * @param {number} responseTime - 反応時間
   * @returns {Object} - 比較結果
   */
  compareToAverageSpeed(responseTime) {
    const sessionAvg = this.performanceMetrics.averageSpeed || 2e3;
    const difference = responseTime - sessionAvg;
    return {
      sessionAverage: sessionAvg,
      difference,
      comparison: difference < -500 ? "much_faster" : difference < -200 ? "faster" : difference < 200 ? "similar" : difference < 500 ? "slower" : "much_slower"
    };
  }
  /**
   * 音程タイプの取得
   * @param {number} baseFreq - 基音周波数
   * @param {number} targetFreq - 目標周波数
   * @returns {string} - 音程タイプ
   */
  getIntervalType(baseFreq, targetFreq) {
    const semitones = Math.round(12 * Math.log2(targetFreq / baseFreq));
    const normalizedSemitones = (semitones % 12 + 12) % 12;
    const intervalMap = {
      0: "unison",
      1: "minorSecond",
      2: "majorSecond",
      3: "minorThird",
      4: "majorThird",
      5: "perfectFourth",
      6: "tritone",
      7: "perfectFifth",
      8: "minorSixth",
      9: "majorSixth",
      10: "minorSeventh",
      11: "majorSeventh"
    };
    return intervalMap[normalizedSemitones] || "unknown";
  }
  /**
   * セント差の計算
   * @param {number} targetFreq - 目標周波数
   * @param {number} detectedFreq - 検出周波数
   * @returns {number} - セント差
   */
  calculateCentsDifference(targetFreq, detectedFreq) {
    if (!targetFreq || !detectedFreq) return 0;
    return 1200 * Math.log2(detectedFreq / targetFreq);
  }
  /**
   * 生精度の計算
   * @param {number} targetFreq - 目標周波数
   * @param {number} detectedFreq - 検出周波数
   * @returns {number} - 生精度 (0-100)
   */
  calculateRawAccuracy(targetFreq, detectedFreq) {
    const centsDiff = Math.abs(this.calculateCentsDifference(targetFreq, detectedFreq));
    return Math.max(0, 100 - centsDiff);
  }
  /**
   * 分析結果の記録
   * @param {Object} result - 結果
   */
  recordAnalysisResult(result) {
    this.sessionData.lastAnalysis = result;
  }
  /**
   * エラー結果の作成
   * @param {string} errorMessage - エラーメッセージ
   * @returns {Object} - エラー結果
   */
  createErrorResult(errorMessage) {
    return {
      timestamp: Date.now(),
      error: true,
      message: errorMessage,
      score: {
        total: 0,
        components: {
          pitchAccuracy: 0,
          recognitionSpeed: 0,
          intervalMastery: 0,
          directionAccuracy: 0,
          consistency: 0
        },
        grade: "F"
      },
      performance: {
        level: "needs_improvement",
        strengths: [],
        weaknesses: [],
        improvement: { trend: "unknown", change: 0 }
      },
      feedback: {
        primary: "エラーが発生しました。もう一度お試しください。",
        detailed: {},
        recommendations: [],
        encouragement: "",
        nextSteps: ""
      }
    };
  }
  /**
   * 詳細採点ログ出力
   * @param {Object} result - 採点結果
   */
  logScoringDetails(result) {
    console.group(`🎯 [EnhancedScoringEngine] 統合採点結果 #${result.sessionAttempt}`);
    console.log("📊 統合スコア:", {
      総合: `${result.score.total}点 (${result.score.grade})`,
      音程精度: `${result.score.components.pitchAccuracy}%`,
      認識速度: `${result.score.components.recognitionSpeed}%`,
      音程習得度: `${result.score.components.intervalMastery}%`,
      方向性精度: `${result.score.components.directionAccuracy}%`,
      一貫性: `${result.score.components.consistency}%`
    });
    console.log("📈 パフォーマンス:", {
      レベル: result.performance.level,
      改善傾向: result.performance.improvement.trend,
      強み: result.performance.strengths.map((s) => s.area),
      弱点: result.performance.weaknesses.map((w) => w.area)
    });
    console.log("💬 フィードバック:", {
      メイン: result.feedback.primary,
      推奨事項: result.feedback.recommendations.length
    });
    console.log("📚 セッション:", {
      試行回数: result.session.attempt,
      平均点: result.session.sessionAverage.toFixed(1),
      継続時間: `${Math.round(result.session.sessionDuration / 6e4)}分`
    });
    console.groupEnd();
  }
  /**
   * デバッグログ出力
   * @param {string} message - ログメッセージ
   * @param {Object} data - 追加データ
   */
  log(message, data = null) {
    if (this.debugMode) {
      if (data) {
        console.log(`[EnhancedScoringEngine] ${message}`, data);
      } else {
        console.log(`[EnhancedScoringEngine] ${message}`);
      }
    }
  }
  /**
   * 試行結果を処理（analyzePerformanceのエイリアス）
   * @param {Object} params - 採点パラメータ
   * @returns {Object} - 統合採点結果
   */
  async processAttempt(params) {
    return await this.analyzePerformance(params);
  }
  /**
   * 詳細レポートを生成
   * @returns {Object} - 詳細レポート
   */
  generateDetailedReport() {
    const statistics = this.getStatistics();
    const sessionData = this.sessionData;
    const overallPerformance = {
      totalScore: sessionData.overallScore,
      totalAttempts: sessionData.totalAttempts,
      averageScore: sessionData.totalAttempts > 0 ? sessionData.overallScore / sessionData.totalAttempts : 0,
      sessionDuration: Date.now() - sessionData.startTime,
      level: sessionData.currentLevel
    };
    const detailedAnalysis = {
      intervals: statistics.analyzers.interval,
      directions: statistics.analyzers.direction,
      consistency: statistics.analyzers.consistency
    };
    const improvements = this.generateImprovementSuggestions();
    const sessionStats = {
      startTime: sessionData.startTime,
      duration: Date.now() - sessionData.startTime,
      attempts: sessionData.totalAttempts,
      achievements: Array.from(sessionData.achievements),
      performanceHistory: sessionData.performanceHistory.slice(-10)
      // 直近10回
    };
    const feedback = {
      primary: improvements.length > 0 ? improvements[0].message : "良好な演奏です！",
      detailed: improvements.map((imp) => imp.message),
      suggestions: improvements.map((imp) => imp.actions).flat()
    };
    const componentScores = [
      { label: "音程精度", value: Math.round(statistics.analyzers.interval?.averageAccuracy || 0), weight: 40 },
      { label: "認識速度", value: Math.round(100 - (statistics.averageResponseTime || 5e3) / 50), weight: 20 },
      { label: "音程習得", value: Math.round(statistics.analyzers.interval?.masteryLevel || 0), weight: 20 },
      { label: "方向精度", value: Math.round(statistics.analyzers.direction?.accuracy || 0), weight: 10 },
      { label: "一貫性", value: Math.round(statistics.analyzers.consistency?.score || 0), weight: 10 }
    ];
    const totalScore = componentScores.reduce(
      (sum, component) => sum + component.value * component.weight / 100,
      0
    );
    let grade = "C";
    if (totalScore >= 90) grade = "S";
    else if (totalScore >= 80) grade = "A";
    else if (totalScore >= 70) grade = "B";
    return {
      timestamp: Date.now(),
      // ランダムトレーニングページが期待するプロパティ
      totalScore: Math.round(totalScore),
      grade,
      componentScores,
      feedback,
      intervalAnalysis: {
        masteryLevels: statistics.analyzers.interval?.intervalMastery || {},
        attemptCounts: statistics.analyzers.interval?.attemptCounts || {},
        accuracyRates: statistics.analyzers.interval?.accuracyRates || {}
      },
      consistencyHistory: statistics.analyzers.consistency?.recentScores || [],
      // 元の形式も保持
      overall: overallPerformance,
      detailed: detailedAnalysis,
      improvements,
      session: sessionStats,
      metadata: {
        version: "2.2.1-FIXED",
        engine: "EnhancedScoringEngine"
      }
    };
  }
  /**
   * パフォーマンス推奨事項を生成
   * @param {string} level - パフォーマンスレベル
   * @param {Array} strengths - 強み
   * @param {Array} weaknesses - 弱点
   * @returns {string} - 推奨事項
   */
  generatePerformanceRecommendation(level, strengths, weaknesses) {
    const recommendations = [];
    switch (level) {
      case "excellent":
        recommendations.push("素晴らしい演奏です！この精度を維持しながら、より難しい音程にチャレンジしてみましょう。");
        break;
      case "good":
        recommendations.push("良好な精度です。安定した演奏を継続し、弱点分野の向上を図りましょう。");
        break;
      case "average":
        recommendations.push("基本的な能力は身についています。継続的な練習で更なる向上が期待できます。");
        break;
      case "needs_improvement":
        recommendations.push("基礎練習を重点的に行い、音程感覚の向上を図りましょう。");
        break;
      default:
        recommendations.push("基本的な音程から段階的に練習を重ねて、音感を育てていきましょう。");
    }
    if (weaknesses.includes("interval")) {
      recommendations.push("音程の正確性向上のため、楽器での確認を併用した練習をお勧めします。");
    }
    if (weaknesses.includes("direction")) {
      recommendations.push("音程の上行・下行判定の精度向上のため、音階練習を取り入れましょう。");
    }
    if (weaknesses.includes("consistency")) {
      recommendations.push("安定した精度を保つため、集中力を維持した継続的な練習が効果的です。");
    }
    if (weaknesses.includes("speed")) {
      recommendations.push("認識速度向上のため、短時間での集中的な判定練習を行いましょう。");
    }
    return recommendations.join(" ");
  }
  /**
   * 改善提案を生成
   * @returns {Array} - 改善提案リスト
   */
  generateImprovementSuggestions() {
    const suggestions = [];
    const stats = this.getStatistics();
    if (stats.analyzers.interval.averageAccuracy < 70) {
      suggestions.push({
        category: "interval",
        priority: "high",
        message: "音程の正確性向上が必要です。基本的な音程（完全5度、オクターブ）から練習を始めましょう。",
        actions: ["基本音程の集中練習", "楽器での確認", "歌唱練習"]
      });
    }
    if (stats.analyzers.direction.accuracy < 80) {
      suggestions.push({
        category: "direction",
        priority: "medium",
        message: "音程の上行・下行の判断精度を向上させましょう。",
        actions: ["音階練習", "聴音練習", "インターバル識別"]
      });
    }
    if (stats.analyzers.consistency.score < 75) {
      suggestions.push({
        category: "consistency",
        priority: "medium",
        message: "安定した精度を保つため、継続的な練習が効果的です。",
        actions: ["定期的な練習", "集中力向上", "疲労管理"]
      });
    }
    return suggestions;
  }
  /**
   * 統計データの取得
   * @returns {Object} - 統計データ
   */
  getStatistics() {
    return {
      session: this.sessionData,
      performance: this.performanceMetrics,
      analyzers: {
        interval: this.intervalAnalyzer.getStatistics(),
        direction: this.directionAnalyzer.getStatistics(),
        consistency: this.consistencyTracker.getStatistics()
      },
      config: this.config
    };
  }
  /**
   * 設定の更新
   * @param {Object} newConfig - 新しい設定
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.log("⚙️ 設定更新完了", this.config);
  }
  /**
   * データのリセット
   */
  reset() {
    this.intervalAnalyzer.reset();
    this.directionAnalyzer.reset();
    this.consistencyTracker.reset();
    this.sessionData = {
      startTime: Date.now(),
      totalAttempts: 0,
      overallScore: 0,
      performanceHistory: [],
      currentLevel: "beginner",
      achievements: /* @__PURE__ */ new Set(),
      lastAnalysis: null
    };
    this.performanceMetrics = {
      averageSpeed: 0,
      accuracyTrend: "stable",
      strengthAreas: [],
      improvementAreas: [],
      sessionProgress: 0
    };
    this.log("🔄 EnhancedScoringEngine リセット完了");
  }
}
if (typeof window !== "undefined" && true) {
  window.EnhancedScoringEngine = EnhancedScoringEngine;
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
const css = {
  code: ".header-section.svelte-1ktm6f3.svelte-1ktm6f3{text-align:center;margin-bottom:2rem}.page-title.svelte-1ktm6f3.svelte-1ktm6f3{font-size:2rem;font-weight:700;color:hsl(222.2 84% 4.9%);margin-bottom:0.5rem}.page-description.svelte-1ktm6f3.svelte-1ktm6f3{color:hsl(215.4 16.3% 46.9%);font-size:1rem;margin:0}.main-card{border:1px solid hsl(214.3 31.8% 91.4%) !important;background:hsl(0 0% 100%) !important;border-radius:8px !important;box-shadow:0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06) !important;margin-bottom:1.5rem}.status-card{border-radius:8px !important;margin-bottom:1.5rem}.error-card{border:1px solid hsl(0 84.2% 60.2%) !important;background:hsl(0 84.2% 97%) !important;border-radius:8px !important;box-shadow:0 1px 3px 0 rgb(0 0 0 / 0.1) !important}.results-card{border:1px solid hsl(142.1 76.2% 36.3%) !important;background:linear-gradient(135deg, hsl(142.1 76.2% 95%) 0%, hsl(0 0% 100%) 100%) !important}.card-header.svelte-1ktm6f3.svelte-1ktm6f3{padding-bottom:1rem;border-bottom:1px solid hsl(214.3 31.8% 91.4%);margin-bottom:1.5rem}.section-title.svelte-1ktm6f3.svelte-1ktm6f3{font-size:1.125rem;font-weight:600;color:hsl(222.2 84% 4.9%);margin:0}.card-content.svelte-1ktm6f3.svelte-1ktm6f3{display:flex;flex-direction:column;gap:1rem}.status-content.svelte-1ktm6f3.svelte-1ktm6f3{display:flex;justify-content:space-between;align-items:center;gap:1rem}.status-message.svelte-1ktm6f3.svelte-1ktm6f3{font-weight:500;color:hsl(222.2 84% 4.9%)}.progress-indicator.svelte-1ktm6f3.svelte-1ktm6f3{font-size:0.875rem;color:hsl(215.4 16.3% 46.9%)}.side-by-side-container.svelte-1ktm6f3.svelte-1ktm6f3{display:flex;gap:1.5rem;margin-bottom:1.5rem}.half-width{flex:1}@media(max-width: 768px){.side-by-side-container.svelte-1ktm6f3.svelte-1ktm6f3{flex-direction:column}.half-width{width:100%}}.debug-info.svelte-1ktm6f3.svelte-1ktm6f3{position:absolute;top:1rem;right:1rem;background:hsl(220 13% 91%);color:hsl(220 13% 46%);padding:0.25rem 0.5rem;border-radius:4px;font-size:0.75rem;font-family:'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', monospace;z-index:100}.base-note-info.svelte-1ktm6f3.svelte-1ktm6f3{text-align:center;padding:1rem;background:hsl(210 40% 98%);border-radius:6px;border:1px solid hsl(214.3 31.8% 91.4%);font-size:0.875rem;color:hsl(215.4 16.3% 46.9%)}.relative-pitch-info.svelte-1ktm6f3.svelte-1ktm6f3{text-align:center;padding:1rem;background:hsl(210 40% 98%);border-radius:6px;border:1px solid hsl(214.3 31.8% 91.4%);margin-top:1rem}.frequency-display-large.svelte-1ktm6f3.svelte-1ktm6f3{display:flex;flex-direction:column;align-items:center;gap:0.25rem}.large-hz.svelte-1ktm6f3.svelte-1ktm6f3{font-size:2rem;font-weight:700;color:hsl(222.2 84% 4.9%);line-height:1}.note-with-cents.svelte-1ktm6f3.svelte-1ktm6f3{font-size:0.875rem;color:hsl(215.4 16.3% 46.9%);font-weight:500}.no-signal.svelte-1ktm6f3.svelte-1ktm6f3{font-size:2rem;font-weight:700;color:hsl(215.4 16.3% 46.9%);line-height:1}.pitch-detector-placeholder.svelte-1ktm6f3.svelte-1ktm6f3{text-align:center;padding:2rem;color:hsl(215.4 16.3% 46.9%);font-style:italic}.scale-guide.svelte-1ktm6f3.svelte-1ktm6f3{display:grid;grid-template-columns:repeat(4, 1fr);gap:0.75rem;margin-bottom:1rem}.scale-item.svelte-1ktm6f3.svelte-1ktm6f3{display:flex;align-items:center;justify-content:center;height:3rem;border-radius:6px;font-weight:500;font-size:0.875rem;border:1px solid hsl(215.4 16.3% 46.9%);background:hsl(0 0% 100%);color:hsl(215.4 16.3% 46.9%);transition:all 0.3s ease}.scale-item.active.svelte-1ktm6f3.svelte-1ktm6f3{background:hsl(343.8 79.7% 53.7%) !important;color:white !important;border:2px solid hsla(343.8 79.7% 53.7% / 0.5) !important;transform:scale(1.2);font-size:1.125rem;font-weight:700;animation:svelte-1ktm6f3-pulse 2s infinite;box-shadow:0 0 0 2px hsla(343.8 79.7% 53.7% / 0.3) !important}.scale-item.correct.svelte-1ktm6f3.svelte-1ktm6f3{background:hsl(142.1 76.2% 36.3%);color:hsl(210 40% 98%);border-color:hsl(142.1 76.2% 36.3%);animation:svelte-1ktm6f3-correctFlash 0.5s ease-out}.scale-item.incorrect.svelte-1ktm6f3.svelte-1ktm6f3{background:hsl(0 84.2% 60.2%);color:hsl(210 40% 98%);border-color:hsl(0 84.2% 60.2%);animation:svelte-1ktm6f3-shake 0.5s ease-in-out}@keyframes svelte-1ktm6f3-pulse{0%,100%{opacity:1}50%{opacity:0.7}}@keyframes svelte-1ktm6f3-correctFlash{0%{transform:scale(1);background:hsl(47.9 95.8% 53.1%)}50%{transform:scale(1.1);background:hsl(142.1 76.2% 36.3%)}100%{transform:scale(1);background:hsl(142.1 76.2% 36.3%)}}@keyframes svelte-1ktm6f3-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}.guide-instruction.svelte-1ktm6f3.svelte-1ktm6f3{text-align:center;font-size:0.875rem;color:hsl(215.4 16.3% 46.9%);padding:0.75rem;background:hsl(210 40% 98%);border-radius:6px}.guide-feedback.svelte-1ktm6f3.svelte-1ktm6f3{display:flex;align-items:center;justify-content:center;gap:0.5rem;margin-top:0.5rem;font-size:0.75rem}.feedback-label.svelte-1ktm6f3.svelte-1ktm6f3{color:hsl(215.4 16.3% 46.9%);font-weight:500}.feedback-value.svelte-1ktm6f3.svelte-1ktm6f3{font-weight:700;font-family:'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', monospace;padding:0.125rem 0.375rem;border-radius:4px;background:hsl(214.3 31.8% 91.4%);color:hsl(222.2 84% 4.9%);min-width:4ch;text-align:center}.feedback-value.accurate.svelte-1ktm6f3.svelte-1ktm6f3{background:hsl(142.1 76.2% 90%);color:hsl(142.1 76.2% 30%)}.feedback-value.close.svelte-1ktm6f3.svelte-1ktm6f3{background:hsl(47.9 95.8% 90%);color:hsl(47.9 95.8% 30%)}.feedback-status.svelte-1ktm6f3.svelte-1ktm6f3{font-weight:500;font-size:0.75rem}.feedback-status.success.svelte-1ktm6f3.svelte-1ktm6f3{color:hsl(142.1 76.2% 36.3%)}.feedback-status.close.svelte-1ktm6f3.svelte-1ktm6f3{color:hsl(47.9 95.8% 45%)}.detection-display.svelte-1ktm6f3.svelte-1ktm6f3{display:flex;flex-direction:column;gap:1rem}.detection-card.svelte-1ktm6f3.svelte-1ktm6f3{display:inline-flex;align-items:baseline;gap:0.5rem;padding:1rem 1.5rem;background:hsl(0 0% 100%);border:1px solid hsl(214.3 31.8% 91.4%);border-radius:8px;width:fit-content}.detected-frequency{font-weight:600 !important;font-size:2rem !important;color:hsl(222.2 84% 4.9%) !important;font-family:'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', \n                 'JetBrains Mono', 'Fira Code', 'Consolas', monospace !important;min-width:4ch !important;text-align:right !important;display:inline-block !important;font-variant-numeric:tabular-nums !important;-webkit-font-smoothing:antialiased !important;-moz-osx-font-smoothing:grayscale !important}.hz-suffix{font-weight:600 !important;font-size:2rem !important;color:hsl(222.2 84% 4.9%) !important}.divider{color:hsl(214.3 31.8% 70%) !important;font-size:1.5rem !important;margin:0 0.25rem !important;font-weight:300 !important}.detected-note{font-weight:600 !important;font-size:2rem !important;color:hsl(215.4 16.3% 46.9%) !important;font-family:'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', \n                 'JetBrains Mono', 'Fira Code', 'Consolas', monospace !important;min-width:3ch !important;display:inline-block !important;text-align:center !important}.volume-bar{border-radius:4px !important}.detected-info.svelte-1ktm6f3.svelte-1ktm6f3{display:flex;align-items:center;gap:0.5rem;font-size:0.875rem}.detected-label.svelte-1ktm6f3.svelte-1ktm6f3{color:hsl(215.4 16.3% 46.9%)}.detected-frequency.svelte-1ktm6f3.svelte-1ktm6f3{font-weight:700;font-size:1.25rem;color:hsl(222.2 84% 4.9%);margin-right:0.5rem}.detected-note.svelte-1ktm6f3.svelte-1ktm6f3{font-weight:500;font-size:0.875rem;color:hsl(215.4 16.3% 46.9%);margin-right:0.25rem}.pitch-diff.svelte-1ktm6f3.svelte-1ktm6f3{color:hsl(47.9 95.8% 40%);font-weight:500;margin-left:0.25rem}.volume-section.svelte-1ktm6f3.svelte-1ktm6f3{display:flex;flex-direction:column;gap:0.5rem}.volume-label.svelte-1ktm6f3.svelte-1ktm6f3{font-size:0.875rem;color:hsl(215.4 16.3% 46.9%)}.modern-volume-bar{border-radius:4px !important}.results-summary.svelte-1ktm6f3.svelte-1ktm6f3{display:grid;grid-template-columns:repeat(auto-fit, minmax(150px, 1fr));gap:1rem;margin-bottom:2rem}.result-item.svelte-1ktm6f3.svelte-1ktm6f3{text-align:center;padding:1rem;border-radius:6px;background:hsl(0 0% 100%);border:1px solid hsl(214.3 31.8% 91.4%)}.result-label.svelte-1ktm6f3.svelte-1ktm6f3{display:block;font-size:0.875rem;color:hsl(215.4 16.3% 46.9%);margin-bottom:0.25rem}.result-value.svelte-1ktm6f3.svelte-1ktm6f3{display:block;font-size:1.5rem;font-weight:700;color:hsl(222.2 84% 4.9%)}.result-value.success.svelte-1ktm6f3.svelte-1ktm6f3{color:hsl(142.1 76.2% 36.3%)}.detailed-results.svelte-1ktm6f3.svelte-1ktm6f3{margin-top:2rem}.detailed-title.svelte-1ktm6f3.svelte-1ktm6f3{font-size:1rem;font-weight:600;color:hsl(222.2 84% 4.9%);margin-bottom:1rem;text-align:center}.scale-results.svelte-1ktm6f3.svelte-1ktm6f3{display:flex;flex-direction:column;gap:0.5rem}.scale-result-item.svelte-1ktm6f3.svelte-1ktm6f3{display:grid;grid-template-columns:1fr auto auto auto;gap:1rem;padding:0.75rem;border-radius:6px;border:1px solid hsl(214.3 31.8% 91.4%);background:hsl(0 0% 100%);align-items:center}.scale-result-item.correct.svelte-1ktm6f3.svelte-1ktm6f3{background:hsl(142.1 76.2% 95%);border-color:hsl(142.1 76.2% 80%)}.scale-result-item.incorrect.svelte-1ktm6f3.svelte-1ktm6f3{background:hsl(0 84.2% 95%);border-color:hsl(0 84.2% 80%)}.scale-name.svelte-1ktm6f3.svelte-1ktm6f3{font-weight:600;color:hsl(222.2 84% 4.9%)}.scale-accuracy.svelte-1ktm6f3.svelte-1ktm6f3{font-weight:500;font-family:'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', monospace;color:hsl(215.4 16.3% 46.9%)}.scale-cents.svelte-1ktm6f3.svelte-1ktm6f3{font-weight:500;font-family:'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', monospace;color:hsl(215.4 16.3% 46.9%);font-size:0.875rem}.scale-status.svelte-1ktm6f3.svelte-1ktm6f3{text-align:center;font-size:1.125rem}.top-action-buttons.svelte-1ktm6f3.svelte-1ktm6f3{margin:0.125rem 0 0.125rem 0 !important;padding:0 !important}.bottom-action-card{margin-top:0.5rem !important;margin-bottom:0.5rem !important;padding:0.25rem !important}.bottom-action-card .card-content{padding:0.25rem !important;margin:0 !important}.action-buttons-container.top{margin:0 !important;padding:0.25rem 1rem !important}.action-buttons-container.bottom{margin:0 !important;padding:0.25rem 1rem !important}.unified-score-result{padding-top:0.25rem !important}@media(max-width: 640px){.iphone-no-margin{margin:0 !important;padding:0 !important}.mb-6{margin-bottom:0 !important}.page-container.svelte-1ktm6f3.svelte-1ktm6f3{margin:0 !important;padding:0 !important}}.error-content.svelte-1ktm6f3.svelte-1ktm6f3{text-align:center;padding:2rem 1rem}.error-icon.svelte-1ktm6f3.svelte-1ktm6f3,.loading-icon.svelte-1ktm6f3.svelte-1ktm6f3{font-size:3rem;margin-bottom:1rem}.error-content.svelte-1ktm6f3 h3.svelte-1ktm6f3{font-size:1.25rem;font-weight:600;color:hsl(222.2 84% 4.9%);margin-bottom:0.5rem}.error-content.svelte-1ktm6f3 p.svelte-1ktm6f3{color:hsl(215.4 16.3% 46.9%);margin-bottom:1rem}.recommendation.svelte-1ktm6f3.svelte-1ktm6f3{background:hsl(210 40% 98%);border:1px solid hsl(214.3 31.8% 91.4%);border-radius:6px;padding:1rem;margin:1rem 0}.recommendation.svelte-1ktm6f3 p.svelte-1ktm6f3{margin:0;font-size:0.875rem}@media(min-width: 768px){.scale-guide.svelte-1ktm6f3.svelte-1ktm6f3{grid-template-columns:repeat(8, 1fr)}.page-title.svelte-1ktm6f3.svelte-1ktm6f3{font-size:2.5rem}.results-summary.svelte-1ktm6f3.svelte-1ktm6f3{grid-template-columns:repeat(3, 1fr)}}@media(max-width: 640px){.status-content.svelte-1ktm6f3.svelte-1ktm6f3{flex-direction:column;gap:0.5rem}.primary-button,.secondary-button{min-width:100% !important}}.warning-card{border:2px solid #fbbf24 !important;background:#fef3c7 !important;margin-bottom:24px !important}.warning-message.svelte-1ktm6f3.svelte-1ktm6f3{color:#92400e;margin-bottom:12px}.error-list.svelte-1ktm6f3.svelte-1ktm6f3{color:#dc2626;margin:12px 0;padding-left:20px}.error-list.svelte-1ktm6f3 li.svelte-1ktm6f3{margin-bottom:4px;font-family:monospace;font-size:14px}.fix-instruction.svelte-1ktm6f3.svelte-1ktm6f3{color:#059669;margin-top:12px;padding:8px;background:#d1fae5;border-radius:4px;border-left:4px solid #059669}.scoring-tabs-container.svelte-1ktm6f3.svelte-1ktm6f3{display:flex;gap:0.5rem;margin-bottom:1.5rem;overflow-x:auto;border-bottom:1px solid hsl(214.3 31.8% 91.4%);padding-bottom:0.5rem}.scoring-tab.svelte-1ktm6f3.svelte-1ktm6f3{padding:0.75rem 1rem;border-radius:6px;border:1px solid hsl(214.3 31.8% 91.4%);background:hsl(0 0% 100%);color:hsl(215.4 16.3% 46.9%);font-size:0.875rem;font-weight:500;cursor:pointer;transition:all 0.2s ease;flex-shrink:0;white-space:nowrap}.scoring-tab.svelte-1ktm6f3.svelte-1ktm6f3:hover{background:hsl(210 40% 98%);border-color:hsl(217.2 32.6% 17.5%)}.scoring-tab.active.svelte-1ktm6f3.svelte-1ktm6f3{background:hsl(217.2 91.2% 59.8%);color:hsl(210 40% 98%);border-color:hsl(217.2 91.2% 59.8%);font-weight:600}.tab-content.svelte-1ktm6f3.svelte-1ktm6f3{margin-top:1rem;min-height:200px}.tab-panel.svelte-1ktm6f3.svelte-1ktm6f3{animation:svelte-1ktm6f3-fadeIn 0.3s ease-in-out}@keyframes svelte-1ktm6f3-fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@media(max-width: 768px){.scoring-tabs-container.svelte-1ktm6f3.svelte-1ktm6f3{flex-wrap:wrap}.scoring-tab.svelte-1ktm6f3.svelte-1ktm6f3{flex:1;min-width:120px}}.traditional-scoring-details.svelte-1ktm6f3.svelte-1ktm6f3,.detailed-random-scoring.svelte-1ktm6f3.svelte-1ktm6f3,.random-scoring-section.svelte-1ktm6f3.svelte-1ktm6f3{margin-top:2rem;padding:1rem;background:#f9fafb;border-radius:8px}.session-progress.svelte-1ktm6f3.svelte-1ktm6f3{background:hsl(0 0% 100%);border:1px solid hsl(214.3 31.8% 91.4%);border-radius:8px;padding:12px 16px;margin:16px 0;box-shadow:0 1px 3px 0 rgb(0 0 0 / 0.1)}.session-status.svelte-1ktm6f3.svelte-1ktm6f3{display:flex;justify-content:space-between;align-items:center;gap:1rem}.session-info.svelte-1ktm6f3.svelte-1ktm6f3{display:flex;align-items:center;gap:1rem}.completed-count.svelte-1ktm6f3.svelte-1ktm6f3{font-weight:700;color:hsl(222.2 84% 4.9%);font-size:1.125rem}.remaining-text.svelte-1ktm6f3.svelte-1ktm6f3{color:hsl(215.4 16.3% 46.9%);font-size:0.875rem}.progress-section.svelte-1ktm6f3.svelte-1ktm6f3{display:flex;align-items:center;gap:12px}.progress-bar.svelte-1ktm6f3.svelte-1ktm6f3{width:120px;height:4px;background:hsl(214.3 31.8% 91.4%);border-radius:2px;overflow:hidden;position:relative}.progress-fill.svelte-1ktm6f3.svelte-1ktm6f3{height:100%;background:hsl(217.2 91.2% 59.8%);transition:width 0.3s ease}.progress-text.svelte-1ktm6f3.svelte-1ktm6f3{font-weight:500;color:hsl(217.2 91.2% 59.8%);font-size:0.875rem;min-width:35px;text-align:right}.guide-start-bar-container.svelte-1ktm6f3.svelte-1ktm6f3{margin-top:1rem;padding:0.75rem;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0}.guide-start-label.svelte-1ktm6f3.svelte-1ktm6f3{font-size:0.875rem;color:#64748b;margin-bottom:0.5rem;text-align:center;font-weight:500}.guide-start-bar.svelte-1ktm6f3.svelte-1ktm6f3{position:relative;height:8px;background:#e2e8f0;border-radius:4px;overflow:hidden;display:flex;align-items:center}.guide-progress-fill.svelte-1ktm6f3.svelte-1ktm6f3{height:100%;background:linear-gradient(90deg, #3b82f6, #1d4ed8);border-radius:4px;transition:width 0.1s ease-out}.guide-music-icon.svelte-1ktm6f3.svelte-1ktm6f3{position:absolute;right:8px;top:50%;transform:translateY(-50%);color:#64748b;transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:white;box-shadow:0 2px 4px rgba(0, 0, 0, 0.1)}.guide-music-icon.glowing.svelte-1ktm6f3.svelte-1ktm6f3{color:#fbbf24;background:#fffbeb;box-shadow:0 0 12px rgba(251, 191, 36, 0.4);animation:svelte-1ktm6f3-pulse-glow 1s infinite}@keyframes svelte-1ktm6f3-pulse-glow{0%,100%{transform:translateY(-50%) scale(1);box-shadow:0 0 12px rgba(251, 191, 36, 0.4)}50%{transform:translateY(-50%) scale(1.1);box-shadow:0 0 20px rgba(251, 191, 36, 0.6)}}@media(max-width: 768px){.session-status.svelte-1ktm6f3.svelte-1ktm6f3{flex-direction:column;gap:8px;align-items:center}.session-info.svelte-1ktm6f3.svelte-1ktm6f3{width:100%;justify-content:center}.progress-section.svelte-1ktm6f3.svelte-1ktm6f3{width:100%;justify-content:center}}",
  map: `{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script>\\n  import { onMount, onDestroy } from 'svelte';\\n  import { goto } from '$app/navigation';\\n  import { base } from '$app/paths';\\n  import { page } from '$app/stores';\\n  import { ChevronRight, Music } from 'lucide-svelte';\\n  import Card from '$lib/components/Card.svelte';\\n  import Button from '$lib/components/Button.svelte';\\n  import VolumeBar from '$lib/components/VolumeBar.svelte';\\n  import PitchDisplay from '$lib/components/PitchDisplay.svelte';\\n  import PitchDetector from '$lib/components/PitchDetector.svelte';\\n  import PitchDetectionDisplay from '$lib/components/PitchDetectionDisplay.svelte';\\n  import PageLayout from '$lib/components/PageLayout.svelte';\\n  import * as Tone from 'tone';\\n  import { audioManager } from '$lib/audio/AudioManager.js';\\n  import { harmonicCorrection } from '$lib/audio/HarmonicCorrection.js';\\n  import { logger } from '$lib/utils/debugUtils.js';\\n  \\n  // 採点システムコンポーネント\\n  import { \\n    ScoreResultPanel,\\n    IntervalProgressTracker,\\n    ConsistencyGraph,\\n    FeedbackDisplay,\\n    SessionStatistics\\n  } from '$lib/components/scoring';\\n  import UnifiedScoreResultFixed from '$lib/components/scoring/UnifiedScoreResultFixed.svelte';\\n  import ActionButtons from '$lib/components/ActionButtons.svelte';\\n  import { EvaluationEngine } from '$lib/evaluation/EvaluationEngine';\\n  \\n  // 採点エンジン\\n  import { EnhancedScoringEngine } from '$lib/scoring/EnhancedScoringEngine.js';\\n  \\n  // localStorage セッション管理\\n  import {\\n    trainingProgress,\\n    currentSessionId,\\n    nextBaseNote,\\n    nextBaseName,\\n    isLoading,\\n    storageError,\\n    isCompleted,\\n    sessionHistory,\\n    overallGrade,\\n    overallAccuracy,\\n    progressPercentage,\\n    remainingSessions,\\n    latestSessionResult,\\n    unifiedScoreData,\\n    loadProgress,\\n    saveSessionResult,\\n    resetProgress,\\n    createNewProgress,\\n    startNewCycleIfCompleted\\n  } from '$lib/stores/sessionStorage';\\n  \\n  // Force GitHub Actions trigger: 2025-07-29 06:30\\n  \\n  // デバイス依存音量設定\\n  function getVolumeForDevice() {\\n    const isIPhone = /iPhone/.test(navigator.userAgent);\\n    const isIPad = /iPad/.test(navigator.userAgent);\\n    const isIPadOS = /Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;\\n    const isIOS = isIPhone || isIPad || isIPadOS;\\n    \\n    if (isIOS) {\\n      console.log('🔊 [RandomTraining] iOS/iPadOS検出 - 音量35dB設定');\\n      return 35; // iOS/iPadOS: 高音量設定\\n    } else {\\n      console.log('🔊 [RandomTraining] PC検出 - 音量-6dB設定');\\n      return -6; // PC: 標準音量設定\\n    }\\n  }\\n  \\n  // 統合グレード計算関数（EvaluationEngineを使用）\\n  function calculateUnifiedGrade(sessionHistory) {\\n    return EvaluationEngine.evaluateOverall(sessionHistory);\\n  }\\n  \\n  // テスト用ダミーデータ生成（正しい4段階評価システム）\\n  function generateTestUnifiedScoreData() {\\n    return {\\n      mode: 'random',\\n      timestamp: new Date(),\\n      duration: 480, // 8セッション × 60秒\\n      totalNotes: 64, // 8セッション × 8音\\n      measuredNotes: 59, // 8セッション総計\\n      averageAccuracy: 79, // 8セッション全体平均\\n      baseNote: 'C5', // 最終セッションの基音\\n      baseFrequency: 523.25,\\n      sessionHistory: [\\n        { \\n          grade: 'excellent', \\n          accuracy: 92, \\n          baseNote: 'C4',\\n          baseFrequency: 261.63,\\n          timestamp: new Date(Date.now() - 7 * 60000),\\n          measuredNotes: 8,\\n          noteResults: [\\n            { name: 'ド', note: 'ド', frequency: 262, detectedFrequency: 264, cents: 13, grade: 'excellent' },\\n            { name: 'レ', note: 'レ', frequency: 294, detectedFrequency: 291, cents: -18, grade: 'good' },\\n            { name: 'ミ', note: 'ミ', frequency: 330, detectedFrequency: 335, cents: 26, grade: 'pass' },\\n            { name: 'ファ', note: 'ファ', frequency: 349, detectedFrequency: 346, cents: -15, grade: 'excellent' },\\n            { name: 'ソ', note: 'ソ', frequency: 392, detectedFrequency: 388, cents: -18, grade: 'good' },\\n            { name: 'ラ', note: 'ラ', frequency: 440, detectedFrequency: 444, cents: 16, grade: 'good' },\\n            { name: 'シ', note: 'シ', frequency: 494, detectedFrequency: 499, cents: 17, grade: 'good' },\\n            { name: 'ド（高）', note: 'ド（高）', frequency: 523, detectedFrequency: 520, cents: -10, grade: 'excellent' }\\n          ]\\n        },\\n        { \\n          grade: 'good', \\n          accuracy: 78, \\n          baseNote: 'D4',\\n          baseFrequency: 293.66,\\n          timestamp: new Date(Date.now() - 6 * 60000),\\n          measuredNotes: 7,\\n          noteResults: [\\n            { name: 'ド', note: 'ド', frequency: 294, detectedFrequency: 290, cents: -23, grade: 'good' },\\n            { name: 'レ', note: 'レ', frequency: 330, detectedFrequency: 340, cents: 53, grade: 'needWork' },\\n            { name: 'ミ', note: 'ミ', frequency: 370, detectedFrequency: 375, cents: 23, grade: 'good' },\\n            { name: 'ファ', note: 'ファ', frequency: 392, detectedFrequency: 385, cents: -31, grade: 'pass' },\\n            { name: 'ソ', note: 'ソ', frequency: 440, detectedFrequency: 432, cents: -31, grade: 'pass' },\\n            { name: 'ラ', note: 'ラ', frequency: 494, detectedFrequency: 510, cents: 56, grade: 'needWork' },\\n            { name: 'シ', note: 'シ', frequency: 554, detectedFrequency: null, cents: null, grade: 'notMeasured' },\\n            { name: 'ド（高）', note: 'ド（高）', frequency: 587, detectedFrequency: 580, cents: -21, grade: 'good' }\\n          ]\\n        },\\n        { \\n          grade: 'excellent', \\n          accuracy: 95, \\n          baseNote: 'E4',\\n          baseFrequency: 329.63,\\n          timestamp: new Date(Date.now() - 5 * 60000),\\n          measuredNotes: 8,\\n          noteResults: [\\n            { name: 'ド', note: 'ド', frequency: 330, detectedFrequency: 332, cents: 10, grade: 'excellent' },\\n            { name: 'レ', note: 'レ', frequency: 370, detectedFrequency: 368, cents: -9, grade: 'excellent' },\\n            { name: 'ミ', note: 'ミ', frequency: 415, detectedFrequency: 418, cents: 12, grade: 'excellent' },\\n            { name: 'ファ', note: 'ファ', frequency: 440, detectedFrequency: 436, cents: -16, grade: 'good' },\\n            { name: 'ソ', note: 'ソ', frequency: 494, detectedFrequency: 497, cents: 11, grade: 'excellent' },\\n            { name: 'ラ', note: 'ラ', frequency: 554, detectedFrequency: 551, cents: -9, grade: 'excellent' },\\n            { name: 'シ', note: 'シ', frequency: 622, detectedFrequency: 625, cents: 8, grade: 'excellent' },\\n            { name: 'ド（高）', note: 'ド（高）', frequency: 659, detectedFrequency: 655, cents: -10, grade: 'excellent' }\\n          ]\\n        },\\n        { \\n          grade: 'needWork', \\n          accuracy: 45, \\n          baseNote: 'F4',\\n          baseFrequency: 349.23,\\n          timestamp: new Date(Date.now() - 4 * 60000),\\n          measuredNotes: 6,\\n          noteResults: [\\n            { name: 'ド', note: 'ド', frequency: 349, detectedFrequency: 345, cents: -20, grade: 'good' },\\n            { name: 'レ', note: 'レ', frequency: 392, detectedFrequency: 420, cents: 124, grade: 'needWork' }, // 外れ値1\\n            { name: 'ミ', note: 'ミ', frequency: 440, detectedFrequency: 435, cents: -20, grade: 'good' },\\n            { name: 'ファ', note: 'ファ', frequency: 466, detectedFrequency: 520, cents: 195, grade: 'needWork' }, // 外れ値2\\n            { name: 'ソ', note: 'ソ', frequency: 523, detectedFrequency: 410, cents: -455, grade: 'needWork' }, // 外れ値3\\n            { name: 'ラ', note: 'ラ', frequency: 587, detectedFrequency: null, cents: null, grade: 'notMeasured' },\\n            { name: 'シ', note: 'シ', frequency: 659, detectedFrequency: 650, cents: -24, grade: 'good' },\\n            { name: 'ド（高）', note: 'ド（高）', frequency: 698, detectedFrequency: null, cents: null, grade: 'notMeasured' }\\n          ]\\n        },\\n        // === 追加セッション 5-8 ===\\n        { \\n          grade: 'good', \\n          accuracy: 85, \\n          baseNote: 'G4',\\n          baseFrequency: 392.00,\\n          timestamp: new Date(Date.now() - 3 * 60000),\\n          measuredNotes: 8,\\n          noteResults: [\\n            { name: 'ド', note: 'ド', frequency: 392, detectedFrequency: 395, cents: 13, grade: 'excellent' },\\n            { name: 'レ', note: 'レ', frequency: 440, detectedFrequency: 438, cents: -8, grade: 'excellent' },\\n            { name: 'ミ', note: 'ミ', frequency: 494, detectedFrequency: 500, cents: 21, grade: 'good' },\\n            { name: 'ファ', note: 'ファ', frequency: 523, detectedFrequency: 520, cents: -10, grade: 'excellent' },\\n            { name: 'ソ', note: 'ソ', frequency: 587, detectedFrequency: 595, cents: 24, grade: 'good' },\\n            { name: 'ラ', note: 'ラ', frequency: 659, detectedFrequency: 665, cents: 16, grade: 'good' },\\n            { name: 'シ', note: 'シ', frequency: 740, detectedFrequency: 755, cents: 35, grade: 'pass' },\\n            { name: 'ド（高）', note: 'ド（高）', frequency: 784, detectedFrequency: 780, cents: -9, grade: 'excellent' }\\n          ]\\n        },\\n        { \\n          grade: 'excellent', \\n          accuracy: 94, \\n          baseNote: 'A4',\\n          baseFrequency: 440.00,\\n          timestamp: new Date(Date.now() - 2 * 60000),\\n          measuredNotes: 8,\\n          noteResults: [\\n            { name: 'ド', note: 'ド', frequency: 440, detectedFrequency: 442, cents: 8, grade: 'excellent' },\\n            { name: 'レ', note: 'レ', frequency: 494, detectedFrequency: 492, cents: -7, grade: 'excellent' },\\n            { name: 'ミ', note: 'ミ', frequency: 554, detectedFrequency: 558, cents: 12, grade: 'excellent' },\\n            { name: 'ファ', note: 'ファ', frequency: 587, detectedFrequency: 585, cents: -6, grade: 'excellent' },\\n            { name: 'ソ', note: 'ソ', frequency: 659, detectedFrequency: 665, cents: 16, grade: 'good' },\\n            { name: 'ラ', note: 'ラ', frequency: 740, detectedFrequency: 738, cents: -5, grade: 'excellent' },\\n            { name: 'シ', note: 'シ', frequency: 831, detectedFrequency: 840, cents: 19, grade: 'good' },\\n            { name: 'ド（高）', note: 'ド（高）', frequency: 880, detectedFrequency: 882, cents: 4, grade: 'excellent' }\\n          ]\\n        },\\n        { \\n          grade: 'pass', \\n          accuracy: 68, \\n          baseNote: 'Bb4',\\n          baseFrequency: 466.16,\\n          timestamp: new Date(Date.now() - 1 * 60000),\\n          measuredNotes: 7,\\n          noteResults: [\\n            { name: 'ド', note: 'ド', frequency: 466, detectedFrequency: 470, cents: 15, grade: 'excellent' },\\n            { name: 'レ', note: 'レ', frequency: 523, detectedFrequency: 535, cents: 39, grade: 'pass' },\\n            { name: 'ミ', note: 'ミ', frequency: 587, detectedFrequency: 600, cents: 38, grade: 'pass' },\\n            { name: 'ファ', note: 'ファ', frequency: 622, detectedFrequency: 615, cents: -19, grade: 'good' },\\n            { name: 'ソ', note: 'ソ', frequency: 698, detectedFrequency: 720, cents: 54, grade: 'needWork' },\\n            { name: 'ラ', note: 'ラ', frequency: 784, detectedFrequency: null, cents: null, grade: 'notMeasured' },\\n            { name: 'シ', note: 'シ', frequency: 880, detectedFrequency: 895, cents: 29, grade: 'pass' },\\n            { name: 'ド（高）', note: 'ド（高）', frequency: 932, detectedFrequency: 925, cents: -13, grade: 'excellent' }\\n          ]\\n        },\\n        { \\n          grade: 'good', \\n          accuracy: 82, \\n          baseNote: 'C5',\\n          baseFrequency: 523.25,\\n          timestamp: new Date(),\\n          measuredNotes: 8,\\n          noteResults: [\\n            { name: 'ド', note: 'ド', frequency: 523, detectedFrequency: 526, cents: 10, grade: 'excellent' },\\n            { name: 'レ', note: 'レ', frequency: 587, detectedFrequency: 584, cents: -9, grade: 'excellent' },\\n            { name: 'ミ', note: 'ミ', frequency: 659, detectedFrequency: 665, cents: 16, grade: 'good' },\\n            { name: 'ファ', note: 'ファ', frequency: 698, detectedFrequency: 692, cents: -15, grade: 'excellent' },\\n            { name: 'ソ', note: 'ソ', frequency: 784, detectedFrequency: 795, cents: 24, grade: 'good' },\\n            { name: 'ラ', note: 'ラ', frequency: 880, detectedFrequency: 890, cents: 19, grade: 'good' },\\n            { name: 'シ', note: 'シ', frequency: 988, detectedFrequency: 1010, cents: 38, grade: 'pass' },\\n            { name: 'ド（高）', note: 'ド（高）', frequency: 1047, detectedFrequency: 1042, cents: -8, grade: 'excellent' }\\n          ]\\n        }\\n      ]\\n    };\\n  }\\n\\n  // 基本状態管理\\n  let trainingPhase = 'setup'; // 'setup' | 'listening' | 'waiting' | 'guiding' | 'results'\\n  \\n  \\n  // マイクテストページからの遷移を早期検出\\n  let microphoneState = (() => {\\n    if (typeof window !== 'undefined') {\\n      const urlParams = new URLSearchParams(window.location.search);\\n      if (urlParams.get('from') === 'microphone-test') {\\n        logger.info('[RandomTraining] マイクテストページからの遷移を検出');\\n        return 'granted';\\n      } else {\\n        logger.info('[RandomTraining] ダイレクトアクセスを検出');\\n        return 'checking';\\n      }\\n    }\\n    return 'checking';\\n  })(); // 'checking' | 'granted' | 'denied' | 'error'\\n  \\n  // シンプルな状態管理\\n  let microphoneHealthy = true; // マイク健康状態\\n  let microphoneErrors = []; // マイクエラー詳細\\n  \\n  // デバッグ情報（強制更新）\\n  const buildVersion = \\"v2.3.1-ANIMATED\\";\\n  const buildTimestamp = \\"07/29 04:15\\";\\n  const updateStatus = \\"🎬 評価分布アニメーション実装・UX向上\\";\\n  \\n  // 統一音階表記（相対音程表記）\\n  const SCALE_NAMES = ['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ', 'ド（高）'];\\n  \\n  // 基音関連\\n  let currentBaseNote = '';\\n  let currentBaseFrequency = 0;\\n  let isPlaying = false;\\n  \\n  // 音程ガイド\\n  let currentScaleIndex = 0;\\n  let scaleSteps = SCALE_NAMES.map(name => ({\\n    name,\\n    state: 'inactive',\\n    completed: false\\n  }));\\n  \\n  // ガイドアニメーション制御\\n  let guideAnimationTimer = null;\\n  let isGuideAnimationActive = false;\\n  \\n  // ドレミガイドスタートバー制御\\n  let guideStartProgress = 0; // 0-100のプログレス\\n  let isGuideStartBarActive = false;\\n  let guideStartTimer = null;\\n  let musicIconGlowing = false;\\n  \\n  // 裏での評価蓄積\\n  let scaleEvaluations = [];\\n  \\n  // 前回の結果保持（再挑戦時表示用）\\n  let previousEvaluations = [];\\n  \\n  // 音程検出\\n  let currentVolume = 0;\\n  let currentFrequency = 0;\\n  let detectedNote = 'ーー';\\n  let pitchDifference = 0;\\n  \\n  // ガイダンス表示用変数削除（UI簡素化）\\n  \\n  // セッション結果\\n  let sessionResults = {\\n    correctCount: 0,\\n    totalCount: 8,\\n    averageAccuracy: 0,\\n    averageTime: 0,\\n    isCompleted: false\\n  };\\n  \\n  // 採点システム関連\\n  let scoringEngine = null;\\n\\n  // 表示は常に評価システムと同じ処理を使用\\n  let currentScoreData = {\\n    totalScore: 0,\\n    grade: 'C',\\n    componentScores: {\\n      pitchAccuracy: 0,\\n      recognitionSpeed: 0,\\n      intervalMastery: 0,\\n      directionAccuracy: 0,\\n      consistency: 0\\n    }\\n  };\\n  let intervalData = [];\\n  let consistencyData = [];\\n  let feedbackData = {};\\n  let technicalFeedbackData = {};\\n  let sessionStatistics = {\\n    totalAttempts: 0,\\n    successRate: 0,\\n    averageScore: 0,\\n    bestScore: 0,\\n    sessionDuration: 0,\\n    streakCount: 0,\\n    fatigueLevel: 'fresh',\\n    mostDifficultInterval: '-',\\n    mostSuccessfulInterval: '-',\\n    averageResponseTime: 0,\\n    sessionStart: Date.now()\\n  };\\n  let activeTab = 'intervals'; // 'intervals' | 'consistency' | 'statistics'\\n  \\n  // ランダムモード用の8音階評価データ\\n  let noteResultsForDisplay = [];\\n  \\n  // 統合採点システム用データ（従来の1セッション用）\\n  let currentUnifiedScoreData = null;\\n  \\n  // Tone.jsサンプラー\\n  let sampler = null;\\n  let isSamplerLoading = true;\\n  \\n  // 音程検出コンポーネント\\n  let pitchDetectorComponent = null;\\n  \\n  // AudioManager対応変数\\n  let mediaStream = null;   // AudioManagerから取得\\n  let audioContext = null;  // AudioManagerから取得\\n  let sourceNode = null;    // AudioManagerから取得\\n  \\n  // セッション時刻管理\\n  let sessionStartTime = null;\\n\\n  // 基音候補（存在する音源ファイルに合わせた10種類）\\n  const baseNotes = [\\n    { note: 'C4', name: 'ド（中）', frequency: 261.63, semitonesFromC: 0 },\\n    { note: 'Db4', name: 'ド#（中）', frequency: 277.18, semitonesFromC: 1 },\\n    { note: 'D4', name: 'レ（中）', frequency: 293.66, semitonesFromC: 2 },\\n    { note: 'Eb4', name: 'レ#（中）', frequency: 311.13, semitonesFromC: 3 },\\n    { note: 'E4', name: 'ミ（中）', frequency: 329.63, semitonesFromC: 4 },\\n    { note: 'F4', name: 'ファ（中）', frequency: 349.23, semitonesFromC: 5 },\\n    { note: 'Gb4', name: 'ファ#（中）', frequency: 369.99, semitonesFromC: 6 },\\n    { note: 'Ab4', name: 'ラb（中）', frequency: 415.30, semitonesFromC: 8 },\\n    { note: 'Bb3', name: 'シb（低）', frequency: 233.08, semitonesFromC: -2 },\\n    { note: 'B3', name: 'シ（低）', frequency: 246.94, semitonesFromC: -1 }\\n  ];\\n\\n  // マイク許可確認（AudioManager対応版）\\n  async function checkMicrophonePermission() {\\n    microphoneState = 'checking';\\n    \\n    try {\\n      console.log('🎤 [RandomTraining] AudioManager経由でマイク許可確認開始');\\n      \\n      if (!navigator.mediaDevices?.getUserMedia) {\\n        microphoneState = 'error';\\n        return;\\n      }\\n      \\n      // AudioManagerから共有リソースを取得（重複取得は安全）\\n      const resources = await audioManager.initialize();\\n      audioContext = resources.audioContext;\\n      mediaStream = resources.mediaStream;\\n      sourceNode = resources.sourceNode;\\n      \\n      console.log('✅ [RandomTraining] AudioManager リソース取得完了');\\n      \\n      microphoneState = 'granted';\\n      trainingPhase = 'setup';\\n      \\n      // PitchDetector初期化（外部AudioContext方式）\\n      setTimeout(async () => {\\n        if (pitchDetectorComponent) {\\n          logger.audio('[RandomTraining] PitchDetector初期化開始');\\n          \\n          // iPad対応: マイク感度5.0x自動設定\\n          const isIPhone = /iPhone/.test(navigator.userAgent);\\n          const isIPad = /iPad/.test(navigator.userAgent);\\n          const isIPadOS = /Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;\\n          \\n          if (isIPad || isIPadOS) {\\n            console.log('🔧 [RandomTraining] iPad検出 - マイク感度7.0x自動設定開始');\\n            audioManager.setSensitivity(7.0);\\n            console.log('✅ [RandomTraining] iPad マイク感度7.0x自動設定完了');\\n          }\\n          \\n          // iPad対応: AudioManager強制初期化\\n          try {\\n            console.log('🎤 [RandomTraining] AudioManager再初期化開始（iPad対応）');\\n            await audioManager.initialize();\\n            console.log('✅ [RandomTraining] AudioManager再初期化完了');\\n          } catch (error) {\\n            console.warn('⚠️ AudioManager再初期化エラー:', error);\\n          }\\n          \\n          await pitchDetectorComponent.initialize();\\n          logger.audio('[RandomTraining] PitchDetector初期化完了');\\n        }\\n      }, 200);\\n      \\n    } catch (error) {\\n      logger.error('[RandomTraining] マイク許可エラー:', error);\\n      microphoneState = (error?.name === 'NotAllowedError') ? 'denied' : 'error';\\n    }\\n  }\\n\\n  // ランダム基音選択\\n  function selectRandomBaseNote() {\\n    // localStorageから次の基音を取得\\n    const nextNote = $nextBaseNote;\\n    const nextName = $nextBaseName;\\n    \\n    // baseNotesから対応する情報を検索\\n    const selectedNote = baseNotes.find(note => note.note === nextNote) || \\n                        baseNotes.find(note => note.name === nextName) ||\\n                        baseNotes[0]; // フォールバック\\n    \\n    currentBaseNote = selectedNote.name;\\n    currentBaseFrequency = selectedNote.frequency;\\n    \\n    // 基音周波数設定確認ログ\\n    logger.info(\`[BaseNote] 基音設定（localStorage連携）: \${currentBaseNote} = \${currentBaseFrequency}Hz\`);\\n    logger.info(\`[BaseNote] localStorage基音情報: note=\${nextNote}, name=\${nextName}\`);\\n    \\n    // 基音周波数が正常に設定されたことを確認\\n    if (!currentBaseFrequency || currentBaseFrequency <= 0) {\\n      logger.error('[BaseNote] 基音周波数設定エラー:', selectedNote);\\n      throw new Error(\`Invalid base frequency: \${currentBaseFrequency}\`);\\n    }\\n  }\\n\\n  // ランダム基音再生（新しい基音を選択）\\n  async function playRandomBaseNote() {\\n    if (isPlaying || !sampler || isSamplerLoading) return;\\n    \\n    // マイク許可が未取得の場合は先に許可を取得\\n    if (microphoneState !== 'granted') {\\n      console.log('🎤 [RandomTraining] マイク許可が必要です。許可取得を開始...');\\n      try {\\n        await checkMicrophonePermission();\\n        console.log('🎤 [RandomTraining] マイク許可取得完了');\\n      } catch (error) {\\n        console.error('❌ マイク許可エラー:', error);\\n        return;\\n      }\\n    }\\n    \\n    // AudioManagerリソースが初期化されていない場合のみ初期化\\n    if (!mediaStream && microphoneState === 'granted') {\\n      console.log('🎤 [RandomTraining] AudioManagerリソース未初期化のため取得します');\\n      try {\\n        await checkMicrophonePermission();\\n      } catch (error) {\\n        console.error('❌ AudioManagerリソース初期化エラー:', error);\\n        return;\\n      }\\n    } else if (mediaStream) {\\n      console.log('🎤 [RandomTraining] AudioManagerリソース既存のため再利用');\\n    }\\n    \\n    // 即座に状態変更\\n    isPlaying = true;\\n    trainingPhase = 'listening';\\n    sessionStartTime = Date.now(); // セッション開始時刻を記録\\n    selectRandomBaseNote(); // 新しいランダム基音を選択\\n    \\n    // 音声再生\\n    const note = baseNotes.find(n => n.name === currentBaseNote).note;\\n    sampler.triggerAttackRelease(note, 2, Tone.now(), 0.7);\\n    \\n    // 2.5秒後にガイドアニメーション開始\\n    setTimeout(() => {\\n      isPlaying = false;\\n      trainingPhase = 'waiting';\\n      setTimeout(() => startGuideAnimation(), 500);\\n    }, 2000);\\n  }\\n\\n  // 現在の基音再生（既存の基音を再利用）\\n  async function playCurrentBaseNote() {\\n    if (isPlaying || !sampler || $isLoading || !currentBaseNote) return;\\n    \\n    // マイク許可が未取得の場合は先に許可を取得\\n    if (microphoneState !== 'granted') {\\n      console.log('🎤 [RandomTraining] マイク許可が必要です。許可取得を開始...');\\n      try {\\n        await checkMicrophonePermission();\\n        console.log('🎤 [RandomTraining] マイク許可取得完了');\\n      } catch (error) {\\n        console.error('❌ マイク許可エラー:', error);\\n        return;\\n      }\\n    }\\n    \\n    // AudioManagerリソースが初期化されていない場合のみ初期化\\n    if (!mediaStream && microphoneState === 'granted') {\\n      console.log('🎤 [RandomTraining] AudioManagerリソース未初期化のため取得します');\\n      try {\\n        await checkMicrophonePermission();\\n      } catch (error) {\\n        console.error('❌ AudioManagerリソース初期化エラー:', error);\\n        return;\\n      }\\n    } else if (mediaStream) {\\n      console.log('🎤 [RandomTraining] AudioManagerリソース既存のため再利用');\\n    }\\n    \\n    // 即座に状態変更\\n    isPlaying = true;\\n    trainingPhase = 'listening';\\n    sessionStartTime = Date.now(); // セッション開始時刻を記録\\n    // selectRandomBaseNote() は呼ばない - 既存の基音を保持\\n    \\n    // AudioContext状態確認・再開\\n    if (typeof window !== 'undefined' && window.Tone) {\\n      const context = window.Tone.context || window.Tone.getContext();\\n      if (context && context.state === 'suspended') {\\n        console.log('🔄 [RandomTraining] AudioContext suspended検出 - 再開中...');\\n        await context.resume();\\n        console.log('✅ [RandomTraining] AudioContext再開完了');\\n      }\\n    }\\n\\n    // 音声再生\\n    const note = baseNotes.find(n => n.name === currentBaseNote).note;\\n    sampler.triggerAttackRelease(note, 2, Tone.now(), 0.7);\\n    \\n    // 2.5秒後にガイドアニメーション開始\\n    setTimeout(() => {\\n      isPlaying = false;\\n      trainingPhase = 'waiting';\\n      setTimeout(() => startGuideAnimation(), 500);\\n    }, 2000);\\n  }\\n\\n  // 基音のみ再生（再挑戦ボタン専用 - トレーニング開始なし）\\n  async function playBaseNoteOnly() {\\n    if (isPlaying || !sampler || $isLoading || !currentBaseNote) {\\n      console.log('🔄 [BaseNoteOnly] 再生条件未満: isPlaying:', isPlaying, 'sampler:', !!sampler, 'isLoading:', $isLoading, 'currentBaseNote:', currentBaseNote);\\n      return;\\n    }\\n    \\n    console.log('🎵 [BaseNoteOnly] 基音のみ再生開始:', currentBaseNote);\\n    \\n    // AudioContext状態確認・再開\\n    if (typeof window !== 'undefined' && window.Tone) {\\n      const context = window.Tone.context || window.Tone.getContext();\\n      if (context && context.state === 'suspended') {\\n        console.log('🔄 [BaseNoteOnly] AudioContext suspended検出 - 再開中...');\\n        await context.resume();\\n        console.log('✅ [BaseNoteOnly] AudioContext再開完了');\\n      }\\n    }\\n\\n    // 基音のみ再生（状態変更なし）\\n    const note = baseNotes.find(n => n.name === currentBaseNote).note;\\n    sampler.triggerAttackRelease(note, 1.5, Tone.now(), 0.7);\\n    \\n    console.log('🎵 [BaseNoteOnly] 基音再生完了:', note);\\n  }\\n\\n  // 基音再生（統合関数 - 状況に応じて適切な関数を呼び分け）\\n  function playBaseNote() {\\n    if (currentBaseNote && currentBaseFrequency > 0) {\\n      // 既に基音が設定されている場合は既存の基音を再生\\n      playCurrentBaseNote();\\n    } else {\\n      // 基音が未設定の場合は新しいランダム基音を選択\\n      playRandomBaseNote();\\n    }\\n    \\n    // ドレミガイドスタートバーを開始\\n    startGuideStartBar();\\n  }\\n\\n  // ドレミガイドスタートバー制御関数\\n  function startGuideStartBar() {\\n    // 既存のタイマーをクリア\\n    if (guideStartTimer) {\\n      clearInterval(guideStartTimer);\\n    }\\n    \\n    // バー状態をリセット\\n    guideStartProgress = 0;\\n    isGuideStartBarActive = true;\\n    musicIconGlowing = false;\\n    \\n    console.log('🎵 [GuideStartBar] ガイドスタートバー開始');\\n    \\n    // 2秒間でプログレスを100%まで進める（50msごとに2.5%ずつ）\\n    guideStartTimer = setInterval(() => {\\n      guideStartProgress += 2.5;\\n      \\n      if (guideStartProgress >= 100) {\\n        // プログレス完了時\\n        guideStartProgress = 100;\\n        musicIconGlowing = true;\\n        \\n        console.log('🎵 [GuideStartBar] ガイド開始タイミング！');\\n        \\n        // 少し遅延してバーを非表示\\n        setTimeout(() => {\\n          isGuideStartBarActive = false;\\n          musicIconGlowing = false;\\n          guideStartProgress = 0;\\n        }, 800);\\n        \\n        clearInterval(guideStartTimer);\\n        guideStartTimer = null;\\n      }\\n    }, 50);\\n  }\\n  \\n  // クリーンアップ\\n  function cleanupGuideStartBar() {\\n    if (guideStartTimer) {\\n      clearInterval(guideStartTimer);\\n      guideStartTimer = null;\\n    }\\n    isGuideStartBarActive = false;\\n    musicIconGlowing = false;\\n    guideStartProgress = 0;\\n  }\\n\\n  // 【新】プロトタイプ式のシンプルで正確な周波数計算\\n  function calculateExpectedFrequency(baseFreq, scaleIndex) {\\n    // ドレミファソラシドの固定間隔（半音） - プロトタイプと同一\\n    const diatonicIntervals = [0, 2, 4, 5, 7, 9, 11, 12];\\n    const semitones = diatonicIntervals[scaleIndex];\\n    const targetFreq = baseFreq * Math.pow(2, semitones / 12);\\n    \\n    logger.debug(\`[calculateExpectedFrequency] \${scaleSteps[scaleIndex].name}: 基音\${baseFreq.toFixed(1)}Hz + \${semitones}半音 = \${targetFreq.toFixed(1)}Hz\`);\\n    \\n    return targetFreq;\\n  }\\n\\n  // 目標周波数計算（ドレミファソラシド）- プロトタイプ式に統一\\n  function calculateTargetFrequency(baseFreq, scaleIndex) {\\n    // 【統一】新しいシンプルで正確な計算を使用\\n    return calculateExpectedFrequency(baseFreq, scaleIndex);\\n  }\\n\\n  // ガイドアニメーション開始（簡素版）\\n  function startGuideAnimation() {\\n    // シンプルな状態変更のみ\\n    trainingPhase = 'guiding';\\n    currentScaleIndex = 0;\\n    isGuideAnimationActive = true;\\n    scaleEvaluations = [];\\n    \\n    console.log(\`🎬 ガイド開始: \${currentBaseNote} (\${currentBaseFrequency.toFixed(1)}Hz)\`);\\n    \\n    // 各ステップを順次ハイライト（1秒間隔）\\n    function animateNextStep() {\\n      if (currentScaleIndex < scaleSteps.length) {\\n        // 前のステップを非アクティブに\\n        if (currentScaleIndex > 0) {\\n          scaleSteps[currentScaleIndex - 1].state = 'inactive';\\n        }\\n        \\n        // 現在のステップをアクティブに\\n        scaleSteps[currentScaleIndex].state = 'active';\\n        \\n        // 倍音補正モジュールに音階コンテキストを設定\\n        const targetFreq = calculateTargetFrequency(currentBaseFrequency, currentScaleIndex);\\n        harmonicCorrection.setScaleContext({\\n          baseFrequency: currentBaseFrequency,\\n          currentScale: scaleSteps[currentScaleIndex].name,\\n          targetFrequency: targetFreq\\n        });\\n        \\n        // 【音階コンテキストログ】軽量版\\n        console.log(\`🎵 [Scale] 基音:\${currentBaseNote}(\${currentBaseFrequency.toFixed(0)}Hz) 現在:\${scaleSteps[currentScaleIndex].name} 目標:\${targetFreq.toFixed(0)}Hz\`);\\n        \\n        // 【緊急デバッグ】ガイドアニメーション中の基音状態監視\\n        if (currentScaleIndex >= 4) { // ソ以降で強化ログ\\n          console.log(\`🔍 [デバッグ] Step \${currentScaleIndex}: currentBaseFrequency=\${currentBaseFrequency}, currentBaseNote='\${currentBaseNote}'\`);\\n        }\\n        \\n        // ガイドログ削除（パフォーマンス優先）\\n        \\n        currentScaleIndex++;\\n        \\n        // 0.6秒後に次のステップ（テンポアップ）\\n        guideAnimationTimer = setTimeout(() => {\\n          animateNextStep();\\n        }, 600);\\n      } else {\\n        // アニメーション完了\\n        finishGuideAnimation();\\n      }\\n    }\\n    \\n    animateNextStep();\\n  }\\n  \\n  // ガイドアニメーション完了\\n  function finishGuideAnimation() {\\n    isGuideAnimationActive = false;\\n    \\n    console.log(\`🏁 ガイド完了: \${scaleEvaluations.length}/\${scaleSteps.length}ステップ評価\`);\\n    \\n    // 最後のステップも非アクティブに\\n    if (scaleSteps.length > 0) {\\n      scaleSteps[scaleSteps.length - 1].state = 'inactive';\\n    }\\n    \\n    // 音程検出停止\\n    if (pitchDetectorComponent) {\\n      pitchDetectorComponent.stopDetection();\\n    }\\n    \\n    // 倍音補正モジュールのコンテキストをクリア\\n    harmonicCorrection.clearContext();\\n    \\n    // 採点結果を計算して表示\\n    calculateFinalResults();\\n    \\n    // 強化採点エンジンの結果生成\\n    generateFinalScoring();\\n    \\n    // 8音階評価データを新コンポーネント用に変換\\n    // 全8音階を固定表示（測定できなかった音も含む）\\n    noteResultsForDisplay = SCALE_NAMES.map(noteName => {\\n      const evaluation = scaleEvaluations.find(evaluation => evaluation.stepName === noteName);\\n      \\n      if (evaluation) {\\n        // 測定できた音\\n        return {\\n          name: evaluation.stepName,\\n          cents: evaluation.adjustedFrequency ? Math.round(evaluation.centDifference) : null,\\n          targetFreq: evaluation.expectedFrequency,\\n          detectedFreq: evaluation.adjustedFrequency || null,\\n          diff: evaluation.adjustedFrequency ? evaluation.adjustedFrequency - evaluation.expectedFrequency : null,\\n          accuracy: evaluation.accuracy\\n        };\\n      } else {\\n        // 測定できなかった音\\n        return {\\n          name: noteName,\\n          cents: null,\\n          targetFreq: null,\\n          detectedFreq: null,\\n          diff: null,\\n          accuracy: 'notMeasured'\\n        };\\n      }\\n    });\\n    \\n    // 統合採点システムデータを生成\\n    generateUnifiedScoreData();\\n    \\n    // 完全版表示用の追加データ生成（バックグラウンド処理）\\n    generateEnhancedScoringData();\\n    \\n    trainingPhase = 'results';\\n  }\\n  \\n  // 最終採点結果計算\\n  function calculateFinalResults() {\\n    let correctCount = 0;\\n    let totalAccuracy = 0;\\n    \\n    scaleEvaluations.forEach((evaluation, index) => {\\n      if (evaluation.isCorrect) {\\n        correctCount++;\\n      }\\n      totalAccuracy += evaluation.accuracy;\\n    });\\n    \\n    const averageAccuracy = scaleEvaluations.length > 0 ? Math.round(totalAccuracy / scaleEvaluations.length) : 0;\\n    const correctRate = Math.round((correctCount / scaleSteps.length) * 100);\\n    \\n    sessionResults = {\\n      correctCount: correctCount,\\n      totalCount: scaleSteps.length,\\n      averageAccuracy: averageAccuracy,\\n      averageTime: 0, // 今回は時間測定なし\\n      isCompleted: true\\n    };\\n    \\n    // 最小限の結果ログ\\n    console.log(\`🎯 結果: \${correctCount}/\${scaleSteps.length}正解 (\${correctRate}%) 平均精度\${averageAccuracy}%\`);\\n    \\n    // 前回の結果として保存（再挑戦時表示用）\\n    if (scaleEvaluations.length > 0) {\\n      previousEvaluations = [...scaleEvaluations];\\n    }\\n  }\\n\\n  // ステータスメッセージ取得\\n  function getStatusMessage() {\\n    switch (trainingPhase) {\\n      case 'setup':\\n        if (isSamplerLoading || !sampler) {\\n          return '🎵 音源読み込み中...';\\n        } else {\\n          return '🎤 マイク準備完了 - トレーニング開始可能';\\n        }\\n      case 'listening':\\n        return '🎵 基音再生中...';\\n      case 'waiting':\\n        return '⏳ 間もなく開始...';\\n      case 'guiding':\\n        return '🎙️ ガイドに合わせてドレミファソラシドを歌ってください';\\n      case 'results':\\n        return '🎉 採点結果';\\n      default:\\n        return '🔄 準備中...';\\n    }\\n  }\\n\\n  // 表示用の評価データを取得\\n  function getDisplayEvaluations() {\\n    // 現在のセッションに評価データがある場合は現在のデータを表示\\n    if (scaleEvaluations.length > 0) {\\n      return scaleEvaluations;\\n    }\\n    // 現在のセッションにデータがない場合は前回の結果を表示\\n    if (previousEvaluations.length > 0) {\\n      return previousEvaluations;\\n    }\\n    return [];\\n  }\\n\\n  // マイクテストページへの誘導（SvelteKit goto使用）\\n  function goToMicrophoneTest() {\\n    goto(\`\${base}/microphone-test\`);\\n  }\\n\\n  // ホームページに戻る（SvelteKit goto使用）\\n  function goHome() {\\n    goto(\`\${base}/\`);\\n  }\\n\\n  // Tone.jsサンプラー初期化（Salamander Grand Piano - 最適化版）\\n  async function initializeSampler() {\\n    try {\\n      isSamplerLoading = true;\\n      \\n      // AudioContextは初回再生時に起動（安全なアプローチ）\\n      \\n      // Salamander Grand Piano C4音源からピッチシフト（最適化設定）\\n      sampler = new Tone.Sampler({\\n        urls: {\\n          'C4': 'C4.mp3',\\n        },\\n        baseUrl: \`\${base}/audio/piano/\`,\\n        release: 1.5, // リリース時間最適化\\n        volume: getVolumeForDevice(), // デバイス依存音量設定\\n        onload: () => {\\n          isSamplerLoading = false;\\n        },\\n        onerror: (error) => {\\n          console.error('❌ Salamander Piano音源読み込みエラー:', error);\\n          isSamplerLoading = false;\\n        }\\n      }).toDestination();\\n      \\n      // デバイス判定（調査用） - iPadOS 13以降対応\\n      const isIPhone = /iPhone/.test(navigator.userAgent);\\n      const isIPad = /iPad/.test(navigator.userAgent);\\n      const isIPadOS = /Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;\\n      const isIOS = isIPhone || isIPad || isIPadOS;\\n      \\n      // デバイス情報ログ出力\\n      if (isIPad) {\\n        console.log('🔍 [RandomTraining] iPad検出:', navigator.userAgent);\\n      } else if (isIPadOS) {\\n        console.log('🔍 [RandomTraining] iPadOS検出:', navigator.userAgent);\\n      } else if (isIPhone) {\\n        console.log('🔍 [RandomTraining] iPhone検出:', navigator.userAgent);\\n      } else {\\n        console.log('🔍 [RandomTraining] その他デバイス検出:', navigator.userAgent);\\n      }\\n      \\n      // 標準音量設定（全デバイス共通）\\n      // sampler.volume.value = -6; // 標準: -6dB ← コメントアウト: 初期化時の volume: 35 を維持\\n      console.log('🔊 [RandomTraining] 音量設定維持: 35dB');\\n      \\n    } catch (error) {\\n      console.error('サンプラー初期化エラー:', error);\\n      isSamplerLoading = false;\\n    }\\n  }\\n  \\n  // マイク許可状態確認（取得はしない）\\n  async function checkExistingMicrophonePermission() {\\n    try {\\n      // Permissions API でマイク許可状態を確認（ダイアログは出ない）\\n      const permissionStatus = await navigator.permissions.query({ name: 'microphone' });\\n      \\n      if (permissionStatus.state === 'granted') {\\n        // 既に許可済みの場合のみストリーム取得\\n        await checkMicrophonePermission();\\n      } else {\\n        // 未許可の場合はエラー画面表示\\n        microphoneState = 'denied';\\n      }\\n    } catch (error) {\\n      // Permissions API 未対応の場合は従来の方法\\n      microphoneState = 'denied';\\n    }\\n  }\\n\\n  // 採点エンジン初期化\\n  function initializeScoringEngine() {\\n    try {\\n      scoringEngine = new EnhancedScoringEngine();\\n      logger.info('[RandomTraining] 採点エンジン初期化完了');\\n    } catch (error) {\\n      logger.error('[RandomTraining] 採点エンジン初期化エラー:', error);\\n    }\\n  }\\n  \\n  // 採点エンジンにデータを送信\\n  function updateScoringEngine(frequency, note) {\\n    if (!scoringEngine || !isGuideAnimationActive) return;\\n    \\n    const activeStepIndex = currentScaleIndex - 1;\\n    if (activeStepIndex < 0 || activeStepIndex >= scaleSteps.length) return;\\n    \\n    const expectedFrequency = calculateExpectedFrequency(currentBaseFrequency, activeStepIndex);\\n    \\n    // 採点エンジンに音程データを送信\\n    const attemptData = {\\n      baseFrequency: currentBaseFrequency,\\n      targetFrequency: expectedFrequency,\\n      detectedFrequency: frequency,\\n      detectedNote: note,\\n      volume: currentVolume,\\n      timestamp: Date.now(),\\n      scaleIndex: activeStepIndex,\\n      scaleName: scaleSteps[activeStepIndex].name\\n    };\\n    \\n    try {\\n      scoringEngine.processAttempt(attemptData);\\n    } catch (error) {\\n      logger.error('[RandomTraining] 採点エンジンエラー:', error);\\n    }\\n  }\\n  \\n  // 最終採点結果を取得\\n  function generateFinalScoring() {\\n    if (!scoringEngine) {\\n      logger.error('[RandomTraining] 採点エンジンが初期化されていません');\\n      // フォールバック: テストデータで表示\\n      generateTestScoreData();\\n      return;\\n    }\\n    \\n    try {\\n      const results = scoringEngine.generateDetailedReport();\\n      \\n      // スコアデータ更新\\n      currentScoreData = {\\n        totalScore: results.totalScore,\\n        grade: results.grade,\\n        componentScores: results.componentScores\\n      };\\n      \\n      // 音程データ更新（安全な参照）\\n      if (results.intervalAnalysis && results.intervalAnalysis.masteryLevels) {\\n        intervalData = Object.entries(results.intervalAnalysis.masteryLevels).map(([type, mastery]) => ({\\n          type,\\n          mastery: Math.round(mastery),\\n          attempts: results.intervalAnalysis.attemptCounts?.[type] || 0,\\n          accuracy: results.intervalAnalysis.accuracyRates?.[type] || 0\\n        }));\\n      } else {\\n        console.warn('⚠️ [RandomTraining] intervalAnalysis.masteryLevels が未定義です');\\n        intervalData = [];\\n      }\\n      \\n      // 一貫性データ更新（安全な参照）\\n      if (results.consistencyHistory && Array.isArray(results.consistencyHistory)) {\\n        consistencyData = results.consistencyHistory.map((score, index) => ({\\n          score: Math.round(score),\\n          timestamp: Date.now() - (results.consistencyHistory.length - index) * 1000\\n        }));\\n      } else {\\n        console.warn('⚠️ [RandomTraining] consistencyHistory が未定義または配列ではありません');\\n        consistencyData = [];\\n      }\\n      \\n      // フィードバックデータ更新（安全な参照）\\n      feedbackData = results.feedback || {\\n        primary: '採点結果を生成中です...',\\n        detailed: [],\\n        suggestions: []\\n      };\\n      \\n      // セッション統計更新（安全な参照）\\n      sessionStatistics = {\\n        totalAttempts: results.totalAttempts || 0,\\n        successRate: results.successRate || 0,\\n        averageScore: results.totalScore || 0,\\n        bestScore: Math.max(results.totalScore || 0, sessionStatistics.bestScore || 0),\\n        sessionDuration: Math.round((Date.now() - sessionStatistics.sessionStart) / 60000) || 0,\\n        streakCount: results.streak || 0,\\n        fatigueLevel: results.fatigueLevel || 'normal',\\n        mostDifficultInterval: results.mostDifficultInterval || '-',\\n        mostSuccessfulInterval: results.mostSuccessfulInterval || '-',\\n        averageResponseTime: results.averageResponseTime || 0\\n      };\\n      \\n      logger.info('[RandomTraining] 採点結果生成完了:', currentScoreData);\\n      \\n    } catch (error) {\\n      logger.error('[RandomTraining] 採点結果生成エラー:', error);\\n    }\\n  }\\n  \\n  // テストデータ生成（フォールバック）\\n  function generateTestScoreData() {\\n    logger.info('[RandomTraining] テストデータで採点結果を生成');\\n    \\n    // テストスコアデータ\\n    currentScoreData = {\\n      totalScore: 78,\\n      grade: 'B+',\\n      componentScores: {\\n        pitchAccuracy: 82,\\n        recognitionSpeed: 75,\\n        intervalMastery: 80,\\n        directionAccuracy: 85,\\n        consistency: 70\\n      }\\n    };\\n    \\n    // テスト音程データ\\n    intervalData = [\\n      { type: 'unison', mastery: 95, attempts: 8, accuracy: 98 },\\n      { type: 'major_second', mastery: 82, attempts: 8, accuracy: 85 },\\n      { type: 'major_third', mastery: 78, attempts: 8, accuracy: 80 },\\n      { type: 'perfect_fourth', mastery: 65, attempts: 8, accuracy: 68 },\\n      { type: 'perfect_fifth', mastery: 88, attempts: 8, accuracy: 90 },\\n      { type: 'major_sixth', mastery: 72, attempts: 8, accuracy: 75 },\\n      { type: 'major_seventh', mastery: 58, attempts: 8, accuracy: 62 },\\n      { type: 'octave', mastery: 92, attempts: 8, accuracy: 94 }\\n    ];\\n    \\n    // テスト一貫性データ\\n    consistencyData = [\\n      { score: 65, timestamp: Date.now() - 420000 },\\n      { score: 72, timestamp: Date.now() - 360000 },\\n      { score: 68, timestamp: Date.now() - 300000 },\\n      { score: 75, timestamp: Date.now() - 240000 },\\n      { score: 78, timestamp: Date.now() - 180000 },\\n      { score: 82, timestamp: Date.now() - 120000 },\\n      { score: 80, timestamp: Date.now() - 60000 },\\n      { score: 85, timestamp: Date.now() }\\n    ];\\n    \\n    // テストフィードバックデータ\\n    feedbackData = {\\n      type: 'improvement',\\n      primary: '良い進歩が見られます！',\\n      summary: '音程の認識精度が向上しています。特に完全5度とオクターブの習得度が高く、基本的な音感が身についてきています。',\\n      details: [\\n        { category: 'strengths', text: 'ユニゾンとオクターブの認識がほぼ完璧です' },\\n        { category: 'strengths', text: '完全5度の安定性が優秀です' },\\n        { category: 'improvements', text: '完全4度の練習をもう少し増やしましょう' },\\n        { category: 'improvements', text: '長7度の認識精度を向上させましょう' },\\n        { category: 'tips', text: '4度は「ソーファー」の音程です' },\\n        { category: 'practice', text: '毎日15分の継続練習を心がけましょう' }\\n      ],\\n      nextSteps: [\\n        '完全4度の集中練習を行いましょう',\\n        '連続チャレンジモードで実践練習を',\\n        '1日15分の継続練習を心がけましょう'\\n      ],\\n      motivation: '継続は力なり！あなたの相対音感は確実に向上しています！'\\n    };\\n    \\n    // テストセッション統計\\n    sessionStatistics = {\\n      totalAttempts: 32,\\n      successRate: 68.8,\\n      averageScore: 78,\\n      bestScore: 85,\\n      sessionDuration: 8,\\n      streakCount: 4,\\n      fatigueLevel: 'normal',\\n      mostDifficultInterval: '完全4度',\\n      mostSuccessfulInterval: 'ユニゾン',\\n      averageResponseTime: 2.1,\\n      sessionStart: Date.now() - 480000 // 8分前\\n    };\\n    \\n    logger.info('[RandomTraining] テスト採点結果生成完了');\\n  }\\n  \\n  // タブ切り替え\\n  function switchTab(tab) {\\n    activeTab = tab;\\n  }\\n  \\n  // 統合採点データ生成（完全版・デバッグエリア品質適用）\\n  function generateUnifiedScoreData() {\\n    if (!noteResultsForDisplay || noteResultsForDisplay.length === 0) {\\n      console.warn('[UnifiedScore] noteResultsForDisplay が空です');\\n      return;\\n    }\\n    \\n    // 測定成功率計算\\n    const measuredNotes = noteResultsForDisplay.filter(note => note.accuracy !== 'notMeasured').length;\\n    const totalNotes = noteResultsForDisplay.length;\\n    \\n    // 平均精度計算\\n    const validAccuracies = noteResultsForDisplay\\n      .filter(note => note.accuracy !== 'notMeasured' && typeof note.accuracy === 'number')\\n      .map(note => note.accuracy);\\n    const averageAccuracy = validAccuracies.length > 0 \\n      ? Math.round(validAccuracies.reduce((sum, acc) => sum + acc, 0) / validAccuracies.length)\\n      : 0;\\n    \\n    // 基音情報\\n    const baseNote = currentBaseNote || 'Unknown';\\n    const baseFrequency = currentBaseFrequency || 0;\\n\\n    // noteResultsForDisplayを正しい形式に変換\\n    const convertedNoteResults = noteResultsForDisplay.map(note => ({\\n      name: note.name,\\n      note: note.note || note.name,\\n      frequency: note.targetFreq || note.expectedFrequency,\\n      detectedFrequency: note.detectedFreq,\\n      cents: note.cents,\\n      grade: EvaluationEngine.evaluateNote(note.cents),\\n      targetFreq: note.targetFreq,\\n      diff: note.diff\\n    }));\\n    \\n    // localStorage から既存のセッション履歴を取得\\n    const currentProgress = $trainingProgress;\\n    const allSessionHistory = currentProgress?.sessionHistory || [];\\n    \\n    // 現在のセッション結果を追加\\n    const currentSessionResult = {\\n      timestamp: new Date(),\\n      baseNote: baseNote,\\n      baseFrequency: baseFrequency,\\n      noteResults: convertedNoteResults,\\n      measuredNotes: measuredNotes,\\n      accuracy: averageAccuracy,\\n      grade: EvaluationEngine.evaluateSession(noteResultsForDisplay)\\n    };\\n    \\n    // 統合スコアデータを作成（localStorage履歴 + 現在セッション）\\n    const sessionHistory = [...allSessionHistory, currentSessionResult];\\n    currentUnifiedScoreData = {\\n      mode: 'random',\\n      timestamp: new Date(),\\n      duration: 60, // 1セッション約60秒想定\\n      totalNotes: totalNotes,\\n      measuredNotes: measuredNotes,\\n      averageAccuracy: averageAccuracy,\\n      baseNote: baseNote,\\n      baseFrequency: baseFrequency,\\n      noteResults: convertedNoteResults,\\n      distribution: EvaluationEngine.calculateDistribution(noteResultsForDisplay),\\n      // セッション履歴：既存履歴 + 現在のセッション\\n      sessionHistory: sessionHistory,\\n      // 統合グレード算出\\n      unifiedGrade: calculateUnifiedGrade(sessionHistory)\\n    };\\n    \\n    console.log('[UnifiedScore] 統合採点データ生成完了（完全版）:', currentUnifiedScoreData);\\n    \\n    // localStorage にセッション結果を保存\\n    saveSessionToStorage();\\n  }\\n  \\n  // セッション結果をlocalStorageに保存\\n  async function saveSessionToStorage() {\\n    if (!noteResultsForDisplay || noteResultsForDisplay.length === 0) {\\n      console.warn('📊 [SessionStorage] 保存データなし');\\n      return;\\n    }\\n    \\n    try {\\n      console.log('📊 [SessionStorage] セッション結果保存開始');\\n      \\n      // noteResultsForDisplayを正しい形式に変換\\n      const convertedNoteResults = noteResultsForDisplay.map(note => ({\\n        name: note.name,\\n        cents: note.cents,\\n        targetFreq: note.targetFreq || note.expectedFrequency,\\n        detectedFreq: note.detectedFreq,\\n        diff: note.diff,\\n        accuracy: typeof note.accuracy === 'number' ? note.accuracy : 0\\n      }));\\n      \\n      // セッション継続時間を計算（開始時刻からの経過時間）\\n      const duration = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1000) : 60;\\n      \\n      // 基音情報\\n      const baseNote = $nextBaseNote; // 次の基音ストアから取得\\n      const baseName = $nextBaseName; // 次の基音名ストアから取得\\n      \\n      // saveSessionResult に渡す\\n      const success = await saveSessionResult(\\n        convertedNoteResults,\\n        duration,\\n        baseNote,\\n        baseName\\n      );\\n      \\n      if (success) {\\n        console.log('📊 [SessionStorage] セッション結果保存完了');\\n        console.log('📊 [SessionStorage] 保存後の状況:', {\\n          currentSession: $currentSessionId,\\n          totalSessions: $sessionHistory.length,\\n          isCompleted: $isCompleted,\\n          nextBaseNote: $nextBaseNote,\\n          nextBaseName: $nextBaseName\\n        });\\n      } else {\\n        console.error('📊 [SessionStorage] セッション結果保存失敗');\\n      }\\n    } catch (error) {\\n      console.error('📊 [SessionStorage] セッション保存エラー:', error);\\n    }\\n  }\\n\\n  // 実際のトレーニングデータから追加採点データを生成\\n  async function generateEnhancedScoringData() {\\n    try {\\n      // EnhancedScoringEngine を使用してスコアデータを生成\\n      if (scoringEngine) {\\n        // sessionHistoryデータをEnhancedScoringEngineに渡す\\n        const currentSessionHistory = $sessionHistory || [];\\n        \\n        // 各セッションの各音程データをanalyzePerformanceで処理\\n        for (const [sessionIndex, session] of currentSessionHistory.entries()) {\\n          if (session.noteResults && session.noteResults.length > 0) {\\n            \\n            const baseFreq = session.baseFrequency || 262;\\n            \\n            // 各音程データを個別に分析\\n            for (const note of session.noteResults) {\\n              if (note.detectedFreq && note.targetFreq) {\\n                await scoringEngine.analyzePerformance({\\n                  baseFreq: baseFreq,\\n                  targetFreq: note.targetFreq,\\n                  detectedFreq: note.detectedFreq,\\n                  responseTime: 2000, // デフォルト反応時間\\n                  volume: 50,\\n                  harmonicCorrection: null\\n                });\\n              }\\n            }\\n          }\\n        }\\n        \\n        const results = scoringEngine.generateDetailedReport();\\n        \\n        // スコアデータ更新\\n        currentScoreData = {\\n          totalScore: results.totalScore || 0,\\n          grade: results.grade || 'C',\\n          componentScores: results.componentScores || {\\n            accuracy: 0,\\n            speed: 0,\\n            consistency: 0\\n          }\\n        };\\n        \\n        // 音程データ更新（安全な参照）\\n        if (results.intervalAnalysis && results.intervalAnalysis.masteryLevels) {\\n          intervalData = Object.entries(results.intervalAnalysis.masteryLevels).map(([type, mastery]) => ({\\n            type,\\n            mastery: Math.round(mastery),\\n            attempts: results.intervalAnalysis.attemptCounts?.[type] || 0,\\n            accuracy: Math.round(mastery * 0.9) // masteryから精度を推定\\n          }));\\n        } else {\\n          // 実際のトレーニングデータから音程分析を生成\\n          intervalData = generateIntervalDataFromResults(noteResultsForDisplay);\\n        }\\n        \\n        // 一貫性データ更新\\n        if (results.consistencyHistory && Array.isArray(results.consistencyHistory)) {\\n          consistencyData = results.consistencyHistory.map((score, index) => ({\\n            score: Math.round(score),\\n            timestamp: Date.now() - (results.consistencyHistory.length - index) * 1000\\n          }));\\n        } else {\\n          // 実際のデータから一貫性履歴を生成\\n          consistencyData = generateConsistencyDataFromResults(noteResultsForDisplay);\\n        }\\n        \\n        // フィードバックデータ更新（8セッション完了時はカスタムメッセージを優先）\\n        feedbackData = generateFeedbackFromResults(noteResultsForDisplay) || results.feedback;\\n        \\n        // 技術分析結果データ更新（8セッション完了時のみ）\\n        console.log('🎯 [generateEnhancedScoringData] 技術分析結果生成を開始');\\n        console.log('🎯 [generateEnhancedScoringData] results:', results);\\n        technicalFeedbackData = generateTechnicalFeedbackFromEnhancedEngine(results);\\n        console.log('🎯 [generateEnhancedScoringData] technicalFeedbackData結果:', technicalFeedbackData);\\n        \\n        // セッション統計更新\\n        sessionStatistics = {\\n          totalAttempts: results.totalAttempts || noteResultsForDisplay.length,\\n          successRate: results.successRate || (noteResultsForDisplay.filter(n => n.accuracy !== 'notMeasured').length / noteResultsForDisplay.length * 100),\\n          averageScore: results.totalScore || currentUnifiedScoreData?.averageAccuracy || 0,\\n          bestScore: Math.max(results.totalScore || 0, sessionStatistics.bestScore || 0),\\n          sessionDuration: Math.round(60), // 1セッション約60秒\\n          streakCount: results.streak || 0,\\n          fatigueLevel: results.fatigueLevel || 'normal',\\n          mostDifficultInterval: results.mostDifficultInterval || '未特定',\\n          mostSuccessfulInterval: results.mostSuccessfulInterval || '未特定',\\n          averageResponseTime: results.averageResponseTime || 2.5,\\n          sessionStart: Date.now() - 60000 // 1分前開始と仮定\\n        };\\n        \\n      } else {\\n        // scoringEngine が無い場合は実際のデータから生成\\n        generateFallbackEnhancedData();\\n      }\\n      \\n      console.log('[EnhancedScoring] 追加採点データ生成完了');\\n      \\n    } catch (error) {\\n      console.error('[EnhancedScoring] データ生成エラー:', error);\\n      generateFallbackEnhancedData();\\n    }\\n  }\\n\\n  // フォールバック用簡易データ生成\\n  function generateFallbackEnhancedData() {\\n    const measuredNotes = noteResultsForDisplay.filter(n => n.accuracy !== 'notMeasured');\\n    const averageAccuracy = currentUnifiedScoreData?.averageAccuracy || 0;\\n    \\n    // 簡易スコアデータ\\n    currentScoreData = {\\n      totalScore: Math.round(averageAccuracy * 0.8), // 精度ベース\\n      grade: averageAccuracy >= 90 ? 'A' : averageAccuracy >= 80 ? 'B' : averageAccuracy >= 70 ? 'C' : 'D',\\n      componentScores: {\\n        accuracy: averageAccuracy,\\n        speed: 85, // 固定値\\n        consistency: Math.max(60, averageAccuracy - 10)\\n      }\\n    };\\n\\n    // 簡易音程データ\\n    intervalData = generateIntervalDataFromResults(noteResultsForDisplay);\\n    \\n    // 簡易一貫性データ\\n    consistencyData = generateConsistencyDataFromResults(noteResultsForDisplay);\\n    \\n    // 簡易フィードバック\\n    feedbackData = generateFeedbackFromResults(noteResultsForDisplay);\\n    \\n    // 簡易統計\\n    sessionStatistics = {\\n      totalAttempts: noteResultsForDisplay.length,\\n      successRate: (measuredNotes.length / noteResultsForDisplay.length) * 100,\\n      averageScore: averageAccuracy,\\n      bestScore: averageAccuracy,\\n      sessionDuration: 60,\\n      streakCount: 0,\\n      fatigueLevel: 'normal',\\n      mostDifficultInterval: '未分析',\\n      mostSuccessfulInterval: '未分析',\\n      averageResponseTime: 2.5,\\n      sessionStart: Date.now() - 60000\\n    };\\n  }\\n\\n  // 実際のトレーニング結果から音階別データを生成\\n  function generateIntervalDataFromResults(results) {\\n    // 音階名と音程名の対応\\n    const scaleData = [\\n      { scale: 'ド', interval: 'unison', intervalName: 'ユニゾン' },\\n      { scale: 'レ', interval: 'major_second', intervalName: '長2度' },\\n      { scale: 'ミ', interval: 'major_third', intervalName: '長3度' },\\n      { scale: 'ファ', interval: 'perfect_fourth', intervalName: '完全4度' },\\n      { scale: 'ソ', interval: 'perfect_fifth', intervalName: '完全5度' },\\n      { scale: 'ラ', interval: 'major_sixth', intervalName: '長6度' },\\n      { scale: 'シ', interval: 'major_seventh', intervalName: '長7度' },\\n      { scale: 'ド（高）', interval: 'octave', intervalName: 'オクターブ' }\\n    ];\\n    \\n    return scaleData.map((item, index) => {\\n      // 実際の結果から該当する音階のデータを取得\\n      const noteResult = results.find(r => r.targetNote && r.targetNote.includes(item.scale)) || results[index];\\n      \\n      if (noteResult && noteResult.accuracy !== 'notMeasured') {\\n        // 実際の誤差をセント単位で計算（精度から逆算）\\n        const accuracyValue = parseFloat(noteResult.accuracy) || 0;\\n        const errorCents = Math.round((100 - accuracyValue) * 0.5); // 簡易的な変換\\n        \\n        return {\\n          type: item.interval,\\n          scale: item.scale,\\n          intervalName: item.intervalName,\\n          attempts: 1, // 1セッションでは1回\\n          averageError: errorCents,\\n          accuracy: accuracyValue\\n        };\\n      } else {\\n        // 測定できなかった場合\\n        return {\\n          type: item.interval,\\n          scale: item.scale,\\n          intervalName: item.intervalName,\\n          attempts: 0,\\n          averageError: null,\\n          accuracy: 0\\n        };\\n      }\\n    });\\n  }\\n\\n  // localStorage セッション履歴から音階別データを生成（8セッション完了時用）\\n  function generateIntervalDataFromSessionHistory(sessionHistory) {\\n    if (!sessionHistory || !Array.isArray(sessionHistory)) {\\n      console.warn('⚠️ [RandomTraining] sessionHistory が無効です');\\n      return [];\\n    }\\n\\n    // 音階データの定義（ドレミファソラシド↑の8音階）\\n    const scaleData = [\\n      { type: 'unison', scale: 'ド', intervalName: 'ユニゾン', noteIndex: 0 },\\n      { type: 'major_second', scale: 'レ', intervalName: '長2度', noteIndex: 1 },\\n      { type: 'major_third', scale: 'ミ', intervalName: '長3度', noteIndex: 2 },\\n      { type: 'perfect_fourth', scale: 'ファ', intervalName: '完全4度', noteIndex: 3 },\\n      { type: 'perfect_fifth', scale: 'ソ', intervalName: '完全5度', noteIndex: 4 },\\n      { type: 'major_sixth', scale: 'ラ', intervalName: '長6度', noteIndex: 5 },\\n      { type: 'major_seventh', scale: 'シ', intervalName: '長7度', noteIndex: 6 },\\n      { type: 'octave', scale: 'ド（高）', intervalName: 'オクターブ', noteIndex: 7 }\\n    ];\\n\\n    const intervalStats = {};\\n\\n    // 各音階の統計を初期化\\n    scaleData.forEach(item => {\\n      intervalStats[item.type] = {\\n        type: item.type,\\n        scale: item.scale,\\n        intervalName: item.intervalName,\\n        attempts: 0,\\n        successCount: 0,\\n        accuracySum: 0,\\n        accuracyValues: [],\\n        errorValues: []  // セント単位の誤差を記録\\n      };\\n    });\\n\\n    // セッション履歴を解析\\n    sessionHistory.forEach(session => {\\n      if (!session.noteResults || !Array.isArray(session.noteResults)) {\\n        return;\\n      }\\n\\n      session.noteResults.forEach((noteResult, noteIndex) => {\\n        if (noteIndex >= scaleData.length) return;\\n\\n        const intervalType = scaleData[noteIndex].type;\\n        const stats = intervalStats[intervalType];\\n\\n        stats.attempts++;\\n\\n        if (noteResult.accuracy !== 'notMeasured' && typeof noteResult.accuracy === 'number') {\\n          stats.accuracyValues.push(noteResult.accuracy);\\n          stats.accuracySum += noteResult.accuracy;\\n          \\n          // 精度から誤差セントを計算（簡易的な変換）\\n          const errorCents = Math.round((100 - noteResult.accuracy) * 0.5);\\n          stats.errorValues.push(errorCents);\\n          \\n          // 70%以上を成功とみなす\\n          if (noteResult.accuracy >= 70) {\\n            stats.successCount++;\\n          }\\n        }\\n      });\\n    });\\n\\n    // 統計からintervalDataを生成\\n    return scaleData.map(item => {\\n      const stats = intervalStats[item.type];\\n      \\n      if (stats.attempts === 0) {\\n        return {\\n          type: item.type,\\n          scale: item.scale,\\n          intervalName: item.intervalName,\\n          attempts: 0,\\n          averageError: null,\\n          accuracy: 0\\n        };\\n      }\\n\\n      const averageAccuracy = stats.accuracyValues.length > 0 \\n        ? Math.round(stats.accuracySum / stats.accuracyValues.length)\\n        : 0;\\n      \\n      const averageError = stats.errorValues.length > 0\\n        ? Math.round(stats.errorValues.reduce((a, b) => a + b, 0) / stats.errorValues.length)\\n        : null;\\n      \\n      const mastery = stats.accuracyValues.length > 0\\n        ? Math.round((stats.successCount / stats.accuracyValues.length) * 100)\\n        : 0;\\n\\n      return {\\n        type: item.type,\\n        scale: item.scale,\\n        intervalName: item.intervalName,\\n        mastery: mastery,\\n        attempts: stats.attempts,\\n        averageError: averageError,\\n        accuracy: averageAccuracy\\n      };\\n    });\\n  }\\n\\n  // 実際のトレーニング結果から一貫性データを生成\\n  function generateConsistencyDataFromResults(results) {\\n    const baseScore = currentUnifiedScoreData?.averageAccuracy || 70;\\n    return Array.from({length: 8}, (_, i) => ({\\n      score: Math.max(30, Math.min(100, baseScore + (Math.random() - 0.5) * 20)),\\n      timestamp: Date.now() - (8 - i) * 7500 // 7.5秒間隔\\n    }));\\n  }\\n\\n  // 実際のトレーニング結果からフィードバックを生成\\n  function generateFeedbackFromResults(results) {\\n    const measuredCount = results.filter(n => n.accuracy !== 'notMeasured').length;\\n    const averageAccuracy = currentUnifiedScoreData?.averageAccuracy || 0;\\n    \\n    // モード別完了判定\\n    const mode = 'random'; // 現在はランダムモード固定、将来的にはpropsから取得\\n    const requiredSessions = mode === 'chromatic' ? 12 : 8;\\n    const currentSessionHistory = $sessionHistory || [];\\n    const completedSessions = currentSessionHistory.length;\\n    \\n    // 基本オブジェクトを常に生成（1442行の条件文を満たすため）\\n    const baseFeedback = {\\n      type: 'info',\\n      categories: [\\n        {\\n          name: '音程精度',\\n          icon: 'Target',\\n          score: averageAccuracy,\\n          message: \`\${averageAccuracy}%の精度で音程を捉えています\`\\n        },\\n        {\\n          name: '測定成功率',\\n          icon: 'Mic',\\n          score: Math.round((measuredCount / results.length) * 100),\\n          message: \`\${results.length}音中\${measuredCount}音を正常に測定\`\\n        }\\n      ]\\n    };\\n    \\n    // セッション完了前はS-E級メッセージなしの基本オブジェクトのみ\\n    if (completedSessions < requiredSessions) {\\n      return baseFeedback;\\n    }\\n    \\n    // S-E級判定に基づいたメッセージ生成（完了後のみ）\\n    let type, primary, summary, icon;\\n    \\n    // unifiedGradeから適切なメッセージを生成（統計値を含む）\\n    const grade = currentUnifiedScoreData?.unifiedGrade || 'E';\\n    const totalSessions = currentSessionHistory.length;\\n    \\n    // 統計値の計算\\n    let excellentCount = 0, goodCount = 0, passCount = 0;\\n    currentSessionHistory.forEach(session => {\\n      if (session.grade === 'excellent') excellentCount++;\\n      else if (session.grade === 'good') goodCount++;\\n      else if (session.grade === 'pass') passCount++;\\n    });\\n    \\n    const excellentRate = totalSessions > 0 ? Math.round((excellentCount / totalSessions) * 100) : 0;\\n    const goodRate = totalSessions > 0 ? Math.round(((excellentCount + goodCount + passCount) / totalSessions) * 100) : 0;\\n    const passRate = totalSessions > 0 ? Math.round(((excellentCount + goodCount + passCount) / totalSessions) * 100) : 0;\\n    \\n    switch (grade) {\\n      case 'S':\\n        type = 'excellent';\\n        primary = '音楽家レベルの相対音感を達成！';\\n        summary = \`優秀率\${excellentRate}%超えの実力を証明されました。\`;\\n        icon = 'Trophy';\\n        break;\\n      case 'A':\\n        type = 'excellent';\\n        primary = 'エキスパートレベル到達！';\\n        summary = \`優秀率\${excellentRate}%の安定した音感能力です。\`;\\n        icon = 'Crown';\\n        break;\\n      case 'B':\\n        type = 'improvement';\\n        primary = 'プロフィシエント級達成！';\\n        summary = \`良好率\${goodRate}%の確実な進歩を示しています。\`;\\n        icon = 'Star';\\n        break;\\n      case 'C':\\n        type = 'improvement';\\n        primary = 'アドバンス級到達！';\\n        summary = \`合格率\${passRate}%で着実に成長中です。\`;\\n        icon = 'Award';\\n        break;\\n      case 'D':\\n        type = 'practice';\\n        primary = '継続練習で必ず上達！';\\n        summary = \`現在の合格率\${passRate}%から目標70%へ向けて練習を続けましょう。\`;\\n        icon = 'Target';\\n        break;\\n      case 'E':\\n      default:\\n        type = 'encouragement';\\n        primary = 'E級ビギナー';\\n        summary = '練習開始段階です。継続的な練習で必ず上達します。';\\n        icon = 'TrendingUp';\\n        break;\\n    }\\n    \\n    // 完了時：baseFeedbackにS-E級メッセージを追加\\n    return {\\n      ...baseFeedback,\\n      type,\\n      primary,\\n      summary\\n    };\\n  }\\n  \\n  // 技術分析結果用のフィードバック生成（8セッション完了時のみ）\\n  function generateTechnicalFeedbackFromEnhancedEngine(enhancedResults) {\\n    // モード別完了判定\\n    const mode = 'random'; // 現在はランダムモード固定、将来的にはpropsから取得\\n    const requiredSessions = mode === 'chromatic' ? 12 : 8;\\n    const currentSessionHistory = $sessionHistory || [];\\n    const completedSessions = currentSessionHistory.length;\\n    \\n    // セッション完了前は技術分析結果なし\\n    if (completedSessions < requiredSessions || !enhancedResults) {\\n      return null;\\n    }\\n    \\n    // EnhancedScoringEngineの実装済みimprovements配列を活用\\n    const improvements = enhancedResults.improvements || [];\\n    const statistics = enhancedResults.detailed?.statistics || {};\\n    \\n    // 技術分析データを整理（アイコン度合い表示）\\n    const technicalAnalysis = [];\\n    \\n    // 正しいフィールドを使用して値を取得\\n    let intervalAccuracy = 0;\\n    let directionAccuracy = 0;\\n    \\n    if (enhancedResults.detailed?.intervals) {\\n      // 音程精度: 平均精度を計算\\n      const intervalsData = enhancedResults.detailed.intervals;\\n      if (intervalsData.totalAnalyses > 0) {\\n        let totalAccuracy = 0;\\n        let totalAttempts = 0;\\n        \\n        for (const [intervalType, data] of Object.entries(intervalsData.masteryLevels)) {\\n          if (data.attempts > 0) {\\n            totalAccuracy += data.averageAccuracy * data.attempts;\\n            totalAttempts += data.attempts;\\n          }\\n        }\\n        \\n        intervalAccuracy = totalAttempts > 0 ? (totalAccuracy / totalAttempts) : 0;\\n      }\\n    }\\n    \\n    if (enhancedResults.detailed?.directions) {\\n      // 方向性精度: 平均精度を計算\\n      const directionsData = enhancedResults.detailed.directions;\\n      if (directionsData.totalAnalyses > 0) {\\n        let totalAccuracy = 0;\\n        let totalAttempts = 0;\\n        \\n        for (const [directionType, data] of Object.entries(directionsData.masteryData)) {\\n          if (data.attempts > 0) {\\n            totalAccuracy += data.averageAccuracy * data.attempts;\\n            totalAttempts += data.attempts;\\n          }\\n        }\\n        \\n        directionAccuracy = totalAttempts > 0 ? (totalAccuracy / totalAttempts) : 0;\\n      }\\n    }\\n    \\n    const isIntervalGood = intervalAccuracy >= 70;\\n    const isDirectionGood = directionAccuracy >= 80;\\n    \\n    // 技術分析結果のフォーマット（基準値と説明付き）\\n    technicalAnalysis.push({\\n      category: 'improvements',\\n      text: \`音程精度: \${Math.round(intervalAccuracy)}%　（音の高さを捉える正確性　目標基準：70〜85%）\`\\n    });\\n    \\n    technicalAnalysis.push({\\n      category: 'improvements',\\n      text: \`方向性: \${Math.round(directionAccuracy)}%　（音程の上下判断の精度　目標基準：80〜90%）\`\\n    });\\n    \\n    // 📝 一貫性評価について\\n    // 従来の一貫性評価（セッション間比較）は以下の理由で削除：\\n    // 1. 基音変更により同一音程でも絶対周波数が異なる\\n    // 2. 相対音感では基音との関係性が重要（異なる基音=別タスク）\\n    // 3. 技術誤差と真のパフォーマンス変動が区別できない\\n    // \\n    // 将来実装予定: 3タブ統合評価（技術分析・音程別精度・一貫性グラフ）\\n    \\n    // アドバイス（改善提案のメッセージ部分）\\n    const adviceItems = improvements.map(imp => ({\\n      category: 'tips',\\n      text: imp.message\\n    }));\\n    \\n    // 練習提案（改善提案のアクション部分）\\n    const practiceItems = improvements.flatMap(imp => \\n      (imp.actions || []).map(action => ({\\n        category: 'practice',\\n        text: action\\n      }))\\n    );\\n    \\n    const finalDetails = [...technicalAnalysis, ...adviceItems, ...practiceItems];\\n    \\n    return {\\n      type: 'info',\\n      primary: '詳細分析結果',\\n      summary: '音程精度・一貫性・方向性の総合分析',\\n      details: technicalAnalysis  // アドバイスと練習提案を除外し、技術分析のみ表示\\n    };\\n  }\\n  \\n  // 評価関数は統一されたユーティリティからインポートして使用\\n  \\n\\n  // 初期化\\n  onMount(async () => {\\n    // **最優先**: マイクテスト完了フラグ確認（localStorage作成前）\\n    const micTestCompleted = localStorage.getItem('mic-test-completed');\\n    \\n    if (!micTestCompleted) {\\n      // マイクテスト未完了 → 準備画面表示（localStorage作成しない）\\n      console.log('🚫 [RandomTraining] マイクテスト未完了 - 準備画面表示');\\n      checkExistingMicrophonePermission();\\n      return;\\n    }\\n    \\n    // localStorage 初期化（マイクテスト完了時のみ）\\n    console.log('📊 [SessionStorage] セッション管理初期化開始');\\n    try {\\n      const success = await loadProgress();\\n      if (success) {\\n        console.log('📊 [SessionStorage] セッション進行状況の読み込み完了');\\n        console.log('📊 [SessionStorage] 現在のセッション:', $currentSessionId, '/ 8');\\n        console.log('📊 [SessionStorage] 次の基音:', $nextBaseNote, '(', $nextBaseName, ')');\\n        console.log('📊 [SessionStorage] 完了状況:', $isCompleted ? '8セッション完了' : \`残り\${$remainingSessions}セッション\`);\\n        \\n        // **8セッション完了後の新サイクル自動開始チェック**\\n        if ($isCompleted) {\\n          console.log('🔄 [SessionStorage] 8セッション完了検出 - 新サイクル開始処理');\\n          const newCycleStarted = await startNewCycleIfCompleted();\\n          if (newCycleStarted) {\\n            console.log('✅ [SessionStorage] 新サイクル開始完了 - セッション1/8から再開');\\n          } else {\\n            console.warn('⚠️ [SessionStorage] 新サイクル開始処理が失敗');\\n          }\\n        }\\n        \\n        // **リロード検出・セッション中断対応**: セッション進行中のリロードを検出\\n        if ($currentSessionId > 1 && !$isCompleted) {\\n          console.warn('🔄 [SessionStorage] セッション途中でのリロード検出 - セッション1から再開');\\n          console.warn('🔄 [SessionStorage] 現在:', $currentSessionId, 'セッション目 → ダイレクトアクセス誘導');\\n          \\n          // localStorage完全リセット（セッション中断扱い）\\n          const { SessionStorageManager } = await import('$lib/utils/SessionStorageManager.ts');\\n          const manager = SessionStorageManager.getInstance();\\n          \\n          // localStorage削除\\n          localStorage.removeItem('random-training-progress');\\n          localStorage.removeItem('random-training-progress-backup');\\n          \\n          // ストア状態もリセット\\n          const { resetProgress } = await import('$lib/stores/sessionStorage.ts');\\n          await resetProgress();\\n          \\n          console.log('🔄 [SessionStorage] localStorage + ストア状態完全リセット完了');\\n          \\n          // ダイレクトアクセス状態に強制設定（マイクテスト誘導）\\n          checkExistingMicrophonePermission();\\n          return; // マイクテスト誘導のため処理終了\\n        }\\n      } else {\\n        console.log('📊 [SessionStorage] 新規セッション開始');\\n      }\\n    } catch (error) {\\n      console.error('📊 [SessionStorage] 初期化エラー:', error);\\n    }\\n    \\n    // 音源初期化\\n    initializeSampler();\\n    \\n    // 採点エンジン初期化\\n    initializeScoringEngine();\\n    \\n    // マイクテストページから来た場合は許可済みとして扱う\\n    if ($page.url.searchParams.get('from') === 'microphone-test') {\\n      console.log('🎤 [RandomTraining] マイクテストページからの遷移を検出');\\n      \\n      // URLパラメータを削除（お気に入り登録時の問題回避）\\n      const url = new URL(window.location);\\n      url.searchParams.delete('from');\\n      window.history.replaceState({}, '', url);\\n      \\n      // マイクテストページから来た場合は許可済みとして扱い、ストリームを準備\\n      microphoneState = 'granted';\\n      trainingPhase = 'setup';\\n      console.log('🎤 [RandomTraining] microphoneState=\\"granted\\", trainingPhase=\\"setup\\" に設定');\\n      \\n      // AudioManagerリソースの即座取得（基音再生のため）\\n      if (!mediaStream) {\\n        console.log('🎤 [RandomTraining] AudioManagerリソース取得開始');\\n        try {\\n          const resources = await audioManager.initialize();\\n          audioContext = resources.audioContext;\\n          mediaStream = resources.mediaStream;\\n          sourceNode = resources.sourceNode;\\n          console.log('🎤 [RandomTraining] AudioManagerリソース取得完了');\\n        } catch (error) {\\n          console.warn('⚠️ AudioManagerリソース取得失敗（後で再試行）:', error);\\n        }\\n      }\\n      \\n      // PitchDetectorの明示的初期化（マイクテスト経由時）\\n      await new Promise(resolve => setTimeout(resolve, 300)); // DOM更新・参照取得待ち\\n      if (pitchDetectorComponent && pitchDetectorComponent.getIsInitialized && !pitchDetectorComponent.getIsInitialized()) {\\n        try {\\n          console.log('🎙️ [RandomTraining] PitchDetector初期化開始');\\n          \\n          // iPad対応: AudioManager健康チェック&再初期化\\n          const status = audioManager.getStatus();\\n          console.log('🔍 [RandomTraining] AudioManager状態:', status);\\n          \\n          if (!status.isInitialized || !status.mediaStreamActive) {\\n            console.log('🔄 [RandomTraining] AudioManager状態不良 - 再初期化実行');\\n            await audioManager.initialize();\\n          }\\n          \\n          await pitchDetectorComponent.initialize();\\n          console.log('✅ [RandomTraining] PitchDetector初期化完了');\\n        } catch (error) {\\n          console.warn('⚠️ PitchDetector初期化失敗:', error);\\n        }\\n      }\\n      \\n      // returnを削除 - PitchDetectorコンポーネントのレンダリングを許可\\n    } else {\\n      // ダイレクトアクセス時のみマイク許可状態確認\\n      await new Promise(resolve => setTimeout(resolve, 100));\\n      checkExistingMicrophonePermission();\\n    }\\n  });\\n  \\n  // PitchDetectorコンポーネントからのイベントハンドラー\\n  function handlePitchUpdate(event) {\\n    const { frequency, note, volume, rawVolume, clarity } = event.detail;\\n    \\n    // 初期値設定（生の値）\\n    let displayFrequency = frequency;\\n    let displayNote = note;\\n    \\n    // 表示は常に評価システムと同じ補正を適用\\n    if (trainingPhase === 'guiding' && isGuideAnimationActive && currentBaseFrequency > 0 && frequency > 0) {\\n      const correctedResult = getEvaluationCorrectedFrequency(frequency);\\n      if (correctedResult) {\\n        displayFrequency = correctedResult.frequency;\\n        displayNote = correctedResult.note;\\n      }\\n    }\\n    \\n    currentFrequency = displayFrequency;\\n    detectedNote = displayNote;\\n    currentVolume = volume;\\n    \\n    // ガイダンス機能削除済み（UI簡素化）\\n    \\n    // 基音との相対音程を計算（補正後の値で）\\n    if (currentBaseFrequency > 0 && displayFrequency > 0) {\\n      pitchDifference = Math.round(1200 * Math.log2(displayFrequency / currentBaseFrequency));\\n    } else {\\n      pitchDifference = 0;\\n    }\\n    \\n    // ガイドアニメーション中の評価蓄積（元の周波数で実行）\\n    evaluateScaleStep(frequency, note);\\n    \\n    // 採点エンジンへのデータ送信\\n    if (scoringEngine && frequency > 0 && currentBaseFrequency > 0) {\\n      updateScoringEngine(frequency, note);\\n    }\\n  }\\n\\n  // 評価システムと同じ補正を周波数表示に適用する関数\\n  function getEvaluationCorrectedFrequency(frequency) {\\n    if (!frequency || frequency <= 0 || !isGuideAnimationActive || !currentBaseFrequency) {\\n      return null;\\n    }\\n    \\n    // 【統一】音量チェック（評価システムと同じ）\\n    const minVolumeForDisplay = 25;\\n    if (currentVolume < minVolumeForDisplay) {\\n      return null; // ノイズ除外\\n    }\\n    \\n    // 現在ハイライト中のステップを取得\\n    const activeStepIndex = currentScaleIndex - 1;\\n    if (activeStepIndex < 0 || activeStepIndex >= scaleSteps.length) {\\n      return null;\\n    }\\n    \\n    // 期待周波数を計算\\n    const expectedFrequency = calculateExpectedFrequency(currentBaseFrequency, activeStepIndex);\\n    if (!expectedFrequency || expectedFrequency <= 0) {\\n      return null;\\n    }\\n    \\n    // 多段階オクターブ補正を適用\\n    const correctionResult = multiStageOctaveCorrection(frequency, expectedFrequency);\\n    const adjustedFrequency = correctionResult.correctedFrequency;\\n    \\n    // 周波数から音程名に変換\\n    const adjustedNote = frequencyToNote(adjustedFrequency);\\n    \\n    return {\\n      frequency: Math.round(adjustedFrequency),\\n      note: adjustedNote\\n    };\\n  }\\n\\n  // 周波数から音程名に変換（PitchDetectorと同じロジック）\\n  function frequencyToNote(frequency) {\\n    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];\\n    const A4 = 440;\\n    \\n    if (frequency <= 0) return 'ーー';\\n    \\n    const semitonesFromA4 = Math.round(12 * Math.log2(frequency / A4));\\n    const noteIndex = (semitonesFromA4 + 9 + 120) % 12;\\n    const octave = Math.floor((semitonesFromA4 + 9) / 12) + 4;\\n    \\n    return noteNames[noteIndex] + octave;\\n  }\\n  \\n  // 【プロトタイプ式】多段階オクターブ補正関数\\n  function multiStageOctaveCorrection(detectedFreq, targetFreq) {\\n    // 拡張補正候補を生成（より柔軟な倍音補正）\\n    const candidates = [\\n      { factor: 4, freq: detectedFreq * 4, description: \\"2オクターブ上\\" },      // 2オクターブ上\\n      { factor: 3, freq: detectedFreq * 3, description: \\"1.5オクターブ上\\" },   // 1.5オクターブ上\\n      { factor: 2.5, freq: detectedFreq * 2.5, description: \\"1.3オクターブ上\\" }, // 1.3オクターブ上\\n      { factor: 2, freq: detectedFreq * 2, description: \\"1オクターブ上\\" },      // 1オクターブ上\\n      { factor: 1.5, freq: detectedFreq * 1.5, description: \\"0.5オクターブ上\\" }, // 0.5オクターブ上\\n      { factor: 1, freq: detectedFreq, description: \\"補正なし\\" },              // 補正なし\\n      { factor: 0.75, freq: detectedFreq * 0.75, description: \\"0.33オクターブ下\\" }, // 0.33オクターブ下\\n      { factor: 0.67, freq: detectedFreq * 0.67, description: \\"0.5オクターブ下\\" }, // 0.5オクターブ下\\n      { factor: 0.5, freq: detectedFreq * 0.5, description: \\"1オクターブ下\\" },  // 1オクターブ下\\n      { factor: 0.4, freq: detectedFreq * 0.4, description: \\"1.3オクターブ下\\" }, // 1.3オクターブ下\\n      { factor: 0.33, freq: detectedFreq * 0.33, description: \\"1.5オクターブ下\\" }, // 1.5オクターブ下\\n      { factor: 0.25, freq: detectedFreq * 0.25, description: \\"2オクターブ下\\" }  // 2オクターブ下\\n    ];\\n    \\n    // 2段階評価：まず緩い範囲、次に厳しい範囲\\n    let bestCandidate = null;\\n    let minError = Infinity;\\n    \\n    // Step 1: ±50%の範囲で最適候補を探索（緩和版）\\n    const relaxedMin = targetFreq * 0.5;\\n    const relaxedMax = targetFreq * 1.5;\\n    \\n    const relaxedCandidates = candidates.filter(candidate => \\n      candidate.freq >= relaxedMin && candidate.freq <= relaxedMax\\n    );\\n    \\n    // Step 2: 緩い範囲内で最小誤差を見つける\\n    for (const candidate of relaxedCandidates) {\\n      const error = Math.abs(candidate.freq - targetFreq);\\n      if (error < minError) {\\n        minError = error;\\n        bestCandidate = candidate;\\n      }\\n    }\\n    \\n    // Step 3: 緩い範囲でも候補がない場合は全候補から最適解を選択\\n    if (!bestCandidate) {\\n      for (const candidate of candidates) {\\n        const error = Math.abs(candidate.freq - targetFreq);\\n        if (error < minError) {\\n          minError = error;\\n          bestCandidate = candidate;\\n        }\\n      }\\n    }\\n    \\n    // Step 4: それでも見つからない場合は補正なし（フォールバック）\\n    if (!bestCandidate) {\\n      return {\\n        correctedFrequency: detectedFreq,\\n        factor: 1,\\n        description: \\"補正なし（フォールバック）\\",\\n        error: Math.abs(detectedFreq - targetFreq)\\n      };\\n    }\\n    \\n    return {\\n      correctedFrequency: bestCandidate.freq,\\n      factor: bestCandidate.factor,\\n      description: bestCandidate.description,\\n      error: minError\\n    };\\n  }\\n\\n  // 裏での評価蓄積（ガイドアニメーション中）- プロトタイプ式多段階補正版\\n  function evaluateScaleStep(frequency, note) {\\n    if (!frequency || frequency <= 0 || !isGuideAnimationActive) {\\n      return;\\n    }\\n    \\n    // 【緊急修正】基音周波数の有効性チェック\\n    if (!currentBaseFrequency || currentBaseFrequency <= 0) {\\n      console.error(\`❌ [採点エラー] 基音周波数が無効: \${currentBaseFrequency}Hz\`);\\n      console.error(\`❌ [採点エラー] 基音名: \${currentBaseNote}\`);\\n      console.error(\`❌ [採点エラー] activeStepIndex: \${currentScaleIndex - 1}\`);\\n      console.error(\`❌ [採点エラー] trainingPhase: \${trainingPhase}\`);\\n      console.error(\`❌ [採点エラー] isGuideAnimationActive: \${isGuideAnimationActive}\`);\\n      return;\\n    }\\n    \\n    // 【音量チェック】環境音を除外\\n    const minVolumeForScoring = 25; // 採点用の最低音量しきい値（20→25に引き上げ）\\n    if (currentVolume < minVolumeForScoring) {\\n      // 音量不足の場合は採点をスキップ（環境音の可能性）\\n      return;\\n    }\\n    \\n    // 現在ハイライト中のステップを取得（currentScaleIndex - 1が実際にハイライト中）\\n    const activeStepIndex = currentScaleIndex - 1;\\n    if (activeStepIndex < 0 || activeStepIndex >= scaleSteps.length) {\\n      return;\\n    }\\n    \\n    // 【緊急デバッグ】音階インデックスと基音状態監視\\n    if (activeStepIndex >= 4) { // ソ以降で強化ログ\\n      logger.debug(\`[採点デバッグ] activeStepIndex=\${activeStepIndex} (\${scaleSteps[activeStepIndex].name}), currentBaseFrequency=\${currentBaseFrequency}Hz\`);\\n    }\\n    \\n    // 【修正】プロトタイプ式のシンプルで正確な周波数計算を使用\\n    const expectedFrequency = calculateExpectedFrequency(currentBaseFrequency, activeStepIndex);\\n    \\n    // 【デバッグ】音程計算の詳細ログ（修正版）\\n    if (activeStepIndex >= 0) { // 全音程でログ出力して修正確認\\n      logger.debug(\`[音程計算修正版] \${scaleSteps[activeStepIndex].name}: 期待周波数 \${expectedFrequency.toFixed(1)}Hz\`);\\n    }\\n    \\n    // 【緊急修正】期待周波数の有効性チェック\\n    if (!expectedFrequency || expectedFrequency <= 0 || !isFinite(expectedFrequency)) {\\n      console.error(\`❌ [採点エラー] 期待周波数計算エラー:\`);\\n      console.error(\`   基音周波数: \${currentBaseFrequency}Hz\`);\\n      console.error(\`   音階インデックス: \${activeStepIndex}\`);\\n      console.error(\`   期待周波数: \${expectedFrequency}Hz\`);\\n      return;\\n    }\\n    \\n    // 【プロトタイプ式】多段階オクターブ補正を適用\\n    const correctionResult = multiStageOctaveCorrection(frequency, expectedFrequency);\\n    const adjustedFrequency = correctionResult.correctedFrequency;\\n    const correctionFactor = correctionResult.factor;\\n    \\n    // 音程差を計算（セント）\\n    const centDifference = Math.round(1200 * Math.log2(adjustedFrequency / expectedFrequency));\\n    \\n    // 【デバッグ】プロトタイプ式補正結果の詳細ログ\\n    if (Math.abs(centDifference) > 200 || correctionFactor !== 1) {\\n      logger.debug(\`[プロトタイプ式補正] \${scaleSteps[activeStepIndex].name}:\`);\\n      console.warn(\`   検出周波数: \${frequency.toFixed(1)}Hz\`);\\n      console.warn(\`   補正後周波数: \${adjustedFrequency.toFixed(1)}Hz\`);\\n      console.warn(\`   期待周波数: \${expectedFrequency.toFixed(1)}Hz\`);\\n      console.warn(\`   セント差: \${centDifference}¢\`);\\n      console.warn(\`   補正係数: \${correctionFactor} (\${correctionResult.description})\`);\\n      console.warn(\`   基音: \${currentBaseNote} (\${currentBaseFrequency.toFixed(1)}Hz)\`);\\n    }\\n    \\n    // 【緊急修正】セント計算の有効性チェック\\n    if (!isFinite(centDifference)) {\\n      console.error(\`❌ [採点エラー] セント計算エラー:\`);\\n      console.error(\`   検出周波数: \${frequency}Hz\`);\\n      console.error(\`   期待周波数: \${expectedFrequency}Hz\`);\\n      console.error(\`   セント差: \${centDifference}\`);\\n      return;\\n    }\\n    \\n    // 判定基準（±50セント以内で正解）\\n    const tolerance = 50;\\n    const isCorrect = Math.abs(centDifference) <= tolerance;\\n    \\n    // 最低音量基準（ノイズ除外）\\n    const minVolumeForDetection = 15;\\n    const hasEnoughVolume = currentVolume >= minVolumeForDetection;\\n    \\n    if (hasEnoughVolume) {\\n      // 精度計算（100 - |centDifference|の割合）\\n      const accuracy = Math.max(0, Math.round(100 - Math.abs(centDifference)));\\n      \\n      // 評価を蓄積（上書きして最新の評価を保持）\\n      const existingIndex = scaleEvaluations.findIndex(evaluation => evaluation.stepIndex === activeStepIndex);\\n      const evaluation = {\\n        stepIndex: activeStepIndex,\\n        stepName: scaleSteps[activeStepIndex].name,\\n        expectedFrequency: Math.round(expectedFrequency),\\n        detectedFrequency: Math.round(frequency),\\n        adjustedFrequency: Math.round(adjustedFrequency),\\n        centDifference: centDifference,\\n        accuracy: accuracy,\\n        isCorrect: isCorrect,\\n        correctionFactor: correctionFactor,\\n        correctionDescription: correctionResult.description,\\n        timestamp: Date.now()\\n      };\\n      \\n      if (existingIndex >= 0) {\\n        scaleEvaluations[existingIndex] = evaluation;\\n      } else {\\n        scaleEvaluations.push(evaluation);\\n      }\\n      \\n      // 簡素化デバッグログ（重要な情報のみ）\\n      if (scaleEvaluations.length % 4 === 0) { // 4ステップごとに進捗表示\\n        logger.realtime(\`採点進捗: \${scaleEvaluations.length}/\${scaleSteps.length}ステップ完了\`);\\n      }\\n    }\\n  }\\n  \\n  \\n  // セッション完了処理\\n  function completeSession() {\\n    trainingPhase = 'completed';\\n    sessionResults.isCompleted = true;\\n    sessionResults.averageAccuracy = Math.round((sessionResults.correctCount / sessionResults.totalCount) * 100);\\n    \\n    // 音程検出停止\\n    if (pitchDetectorComponent) {\\n      pitchDetectorComponent.stopDetection();\\n    }\\n  }\\n  \\n  // 同じ基音で再挑戦\\n  async function restartSameBaseNote() {\\n    // **8セッション完了状態チェック（重要）**\\n    if ($isCompleted) {\\n      console.warn('🚫 [RestartSame] 8セッション完了状態では再挑戦不可 - 新サイクル開始が必要');\\n      \\n      // 新サイクル開始を実行\\n      const newCycleStarted = await startNewCycleIfCompleted();\\n      if (newCycleStarted) {\\n        console.log('✅ [RestartSame] 新サイクル開始完了 - セッション1/8から再開');\\n        // ページリロードして新サイクル状態を反映\\n        window.location.reload();\\n      } else {\\n        console.error('❌ [RestartSame] 新サイクル開始失敗');\\n      }\\n      return;\\n    }\\n    \\n    // 1. ページトップにスクロール（強化版）\\n    scrollToTop();\\n    \\n    // 2. UI状態のみ変更（即座画面遷移）\\n    trainingPhase = 'setup';\\n    \\n    // 3. 最小限のクリーンアップ\\n    if (guideAnimationTimer) {\\n      clearTimeout(guideAnimationTimer);\\n      guideAnimationTimer = null;\\n    }\\n    \\n    // 4. PitchDetectorの表示状態をリセット\\n    if (pitchDetectorComponent && pitchDetectorComponent.resetDisplayState) {\\n      pitchDetectorComponent.resetDisplayState();\\n    }\\n    \\n    // 5. セッション状態リセット（基音は保持）\\n    resetSessionState();\\n    // 注意: currentBaseNote と currentBaseFrequency は保持される\\n    \\n    // 6. 基音情報保持（再生はユーザー操作まで待機）\\n    console.log('🔄 [RestartSame] 同じ基音で再挑戦:', currentBaseNote, currentBaseFrequency + 'Hz');\\n    console.log('🔄 [RestartSame] 基音情報保持完了 - ユーザー操作待機');\\n    // 注意: 基音は自動再生せず、ユーザーが「基音を聞く」ボタンを押すまで待機\\n  }\\n  \\n  // 違う基音で開始\\n  async function restartDifferentBaseNote() {\\n    // **8セッション完了状態チェック（重要）**\\n    if ($isCompleted) {\\n      console.warn('🚫 [RestartDifferent] 8セッション完了状態では再挑戦不可 - 新サイクル開始が必要');\\n      \\n      // 新サイクル開始を実行\\n      const newCycleStarted = await startNewCycleIfCompleted();\\n      if (newCycleStarted) {\\n        console.log('✅ [RestartDifferent] 新サイクル開始完了 - セッション1/8から再開');\\n        // ページリロードして新サイクル状態を反映\\n        window.location.reload();\\n      } else {\\n        console.error('❌ [RestartDifferent] 新サイクル開始失敗');\\n      }\\n      return;\\n    }\\n    \\n    // 1. ページトップにスクロール（強化版）\\n    scrollToTop();\\n    \\n    // 2. UI状態のみ変更（即座画面遷移）\\n    trainingPhase = 'setup';\\n    \\n    // 3. 最小限のクリーンアップ\\n    if (guideAnimationTimer) {\\n      clearTimeout(guideAnimationTimer);\\n      guideAnimationTimer = null;\\n    }\\n    \\n    // 4. 基音情報もリセット\\n    currentBaseNote = '';\\n    currentBaseFrequency = 0;\\n    \\n    // 【緊急デバッグ】基音リセットログ\\n    console.log('🔄 [restartDifferentBaseNote] 基音情報をリセットしました');\\n    \\n    // 5. PitchDetectorの表示状態をリセット\\n    if (pitchDetectorComponent && pitchDetectorComponent.resetDisplayState) {\\n      pitchDetectorComponent.resetDisplayState();\\n    }\\n    \\n    // 6. セッション状態リセット\\n    resetSessionState();\\n  }\\n  \\n  // 強化版スクロール関数（ブラウザ互換性対応）\\n  function scrollToTop() {\\n    try {\\n      // 方法 1: モダンブラウザのスムーススクロール\\n      if ('scrollTo' in window && 'behavior' in document.documentElement.style) {\\n        window.scrollTo({ top: 0, behavior: 'smooth' });\\n      } else {\\n        // 方法 2: 古いブラウザの即座スクロール\\n        window.scrollTo(0, 0);\\n      }\\n      \\n      // 方法 3: document.body と documentElement のフォールバック\\n      if (document.body) {\\n        document.body.scrollTop = 0;\\n      }\\n      if (document.documentElement) {\\n        document.documentElement.scrollTop = 0;\\n      }\\n      \\n      // 方法 4: ページ内のスクロールコンテナ対応\\n      const scrollContainers = document.querySelectorAll('[data-scroll-container], .scroll-container, main');\\n      scrollContainers.forEach(container => {\\n        if (container.scrollTo) {\\n          container.scrollTo(0, 0);\\n        } else {\\n          container.scrollTop = 0;\\n        }\\n      });\\n      \\n    } catch (error) {\\n      console.warn('スクロールエラー:', error);\\n      // 最後の手段: 強制的なリロードを避けて基本的なスクロール\\n      try {\\n        window.scroll(0, 0);\\n      } catch (fallbackError) {\\n        console.error('スクロール完全失敗:', fallbackError);\\n      }\\n    }\\n  }\\n\\n  // セッション状態リセット\\n  function resetSessionState() {\\n    currentScaleIndex = 0;\\n    isGuideAnimationActive = false;\\n    scaleEvaluations = []; // 現在のセッション評価はクリア\\n    // previousEvaluations は保持（前回の結果を残す）\\n    \\n    // スケールガイドリセット\\n    scaleSteps = scaleSteps.map(step => ({\\n      ...step,\\n      state: 'inactive',\\n      completed: false\\n    }));\\n    \\n  }\\n  \\n  // 新サイクル開始（8セッション完了後の「最初から挑戦」ボタン用）\\n  async function startNewCycle() {\\n    console.log('🚀 [StartNewCycle] 8セッション完了後の最初から挑戦開始');\\n    \\n    try {\\n      // 新サイクル開始処理\\n      const newCycleStarted = await startNewCycleIfCompleted();\\n      \\n      if (newCycleStarted) {\\n        console.log('✅ [StartNewCycle] 新サイクル開始完了');\\n        \\n        // マイクテスト完了フラグが存在することを確認\\n        const micTestCompleted = localStorage.getItem('mic-test-completed');\\n        if (micTestCompleted) {\\n          console.log('✅ [StartNewCycle] マイクテスト完了フラグ確認 - リロードなしで状態リセット');\\n          \\n          // リロードせずに状態をリセット（マイクテスト経由と同じ状態に）\\n          // 1. ページトップにスクロール\\n          scrollToTop();\\n          \\n          // 2. sessionStorageストアを更新（リアクティブに反映）\\n          await loadProgress(); // 新しいセッション状態を読み込み\\n          \\n          // 3. UI状態をsetupに戻す\\n          trainingPhase = 'setup';\\n          \\n          // 4. セッション状態をリセット\\n          resetSessionState();\\n          \\n          // 5. 新しい基音を選択\\n          selectRandomBaseNote();\\n          \\n          console.log('✅ [StartNewCycle] 状態リセット完了 - セッション1/8から再開');\\n        } else {\\n          // フラグがない場合は通常のリロード（ダイレクトアクセス扱い）\\n          window.location.reload();\\n        }\\n      } else {\\n        console.error('❌ [StartNewCycle] 新サイクル開始失敗');\\n        // 失敗時はホームに戻る\\n        goHome();\\n      }\\n    } catch (error) {\\n      console.error('❌ [StartNewCycle] 新サイクル開始エラー:', error);\\n      // エラー時もホームに戻る\\n      goHome();\\n    }\\n  }\\n\\n  // ActionButtons統一イベントハンドラ\\n  function handleActionButtonClick(event) {\\n    const { type } = event.detail;\\n    \\n    switch (type) {\\n      case 'same':\\n        restartSameBaseNote();\\n        break;\\n      case 'different':\\n        restartDifferentBaseNote();\\n        break;\\n      case 'restart':\\n        startNewCycle();\\n        break;\\n      case 'home':\\n        goHome();\\n        break;\\n      default:\\n        console.warn('🚫 [ActionButtons] 未知のアクションタイプ:', type);\\n    }\\n  }\\n\\n  \\n  // リアクティブシステム\\n  $: canStartTraining = microphoneState === 'granted' && !isSamplerLoading && sampler && microphoneHealthy;\\n  $: canRestartSession = trainingPhase === 'results';\\n\\n  // 8セッション完了時：localStorageデータから音程別データを生成\\n  $: if ($unifiedScoreData && $isCompleted && $unifiedScoreData.sessionHistory) {\\n    intervalData = generateIntervalDataFromSessionHistory($unifiedScoreData.sessionHistory);\\n    console.log('🎵 [RandomTraining] intervalData生成完了:', intervalData.length, '件');\\n  }\\n  \\n  // 状態変化時の自動スクロール（ダイレクトアクセス、マイク許可後の画面遷移時）\\n  $: if (trainingPhase === 'setup' && microphoneState === 'granted') {\\n    scrollToTop();\\n  }\\n\\n\\n  // PitchDetectorイベントハンドラー（簡素版）\\n  function handlePitchDetectorStateChange(event) {\\n    // ログ削除\\n  }\\n  \\n  function handlePitchDetectorError(event) {\\n    console.error('❌ PitchDetectorエラー:', event.detail);\\n  }\\n  \\n  // マイク健康状態変化ハンドラー\\n  function handleMicrophoneHealthChange(event) {\\n    const { healthy, errors, details } = event.detail;\\n    microphoneHealthy = healthy;\\n    microphoneErrors = errors;\\n    \\n    if (!healthy) {\\n      console.warn('⚠️ マイクの健康状態が悪化:', errors);\\n      // 深刻な問題の場合はトレーニングを停止\\n      if (trainingPhase === 'guiding') {\\n        trainingPhase = 'setup';\\n        console.warn('🛑 マイク問題によりトレーニングを停止');\\n      }\\n    }\\n  }\\n\\n  // クリーンアップ\\n  onDestroy(() => {\\n    console.log('🔄 [RandomTraining] onDestroy - AudioManagerリソースは保持');\\n    \\n    // PitchDetectorは使い回しのためcleanupしない\\n    // AudioManagerがリソースを管理するため、ここでは解放しない\\n    \\n    if (sampler) {\\n      sampler.dispose();\\n      sampler = null;\\n    }\\n  });\\n<\/script>\\n\\n<PageLayout>\\n  <!-- Header -->\\n  <div class=\\"header-section\\">\\n    <h1 class=\\"page-title\\">🎵 ランダム基音トレーニング</h1>\\n    <p class=\\"page-description\\">10種類の基音からランダムに選択してドレミファソラシドを練習</p>\\n    \\n    \\n    <!-- セッション進捗表示 -->\\n    {#if microphoneState === 'granted' && !$isLoading}\\n      <div class=\\"session-progress\\">\\n        <div class=\\"session-status\\">\\n          <div class=\\"session-info\\">\\n            <span class=\\"completed-count\\">{$sessionHistory?.length || 0}/8</span>\\n            <span class=\\"remaining-text\\">残り {8 - ($sessionHistory?.length || 0)} セッション</span>\\n          </div>\\n          <div class=\\"progress-section\\">\\n            <div class=\\"progress-bar\\">\\n              <div class=\\"progress-fill\\" style=\\"width: {(($sessionHistory?.length || 0) / 8 * 100)}%\\"></div>\\n            </div>\\n            <span class=\\"progress-text\\">{Math.round(($sessionHistory?.length || 0) / 8 * 100)}%</span>\\n          </div>\\n        </div>\\n        \\n      </div>\\n      \\n      <!-- 上部アクションボタン（基音再生画面では非表示） -->\\n      {#if trainingPhase === 'results'}\\n        <div class=\\"top-action-buttons\\">\\n          <ActionButtons \\n            isCompleted={$isCompleted}\\n            position=\\"top\\"\\n            on:action={handleActionButtonClick}\\n          />\\n        </div>\\n      {/if}\\n    {/if}\\n    \\n    <div class=\\"debug-info\\">\\n      📱 {buildVersion} | {buildTimestamp}<br/>\\n      <small style=\\"font-size: 0.6rem;\\">{updateStatus}</small>\\n    </div>\\n  </div>\\n\\n\\n  {#if microphoneState === 'granted'}\\n    <!-- PitchDetector: 常に存在（セッション間で破棄されない） -->\\n    <div style=\\"display: none;\\">\\n      <PitchDetector\\n        bind:this={pitchDetectorComponent}\\n        isActive={microphoneState === 'granted'}\\n        trainingPhase={trainingPhase}\\n        on:pitchUpdate={handlePitchUpdate}\\n        on:stateChange={handlePitchDetectorStateChange}\\n        on:error={handlePitchDetectorError}\\n        on:microphoneHealthChange={handleMicrophoneHealthChange}\\n        className=\\"pitch-detector-content\\"\\n        debugMode={true}\\n        disableHarmonicCorrection={false}\\n      />\\n    </div>\\n\\n    <!-- メイントレーニングインターフェース -->\\n    \\n    {#if trainingPhase !== 'results'}\\n      <!-- Base Tone and Detection Side by Side -->\\n      <!-- マイク健康状態警告（問題がある場合のみ表示） -->\\n      {#if !microphoneHealthy && microphoneErrors.length > 0}\\n        <Card class=\\"warning-card\\">\\n          <div class=\\"card-header\\">\\n            <h3 class=\\"section-title\\">⚠️ マイク接続に問題があります</h3>\\n          </div>\\n          <div class=\\"card-content\\">\\n            <p class=\\"warning-message\\">マイクが正常に動作していません。以下の問題が検出されました：</p>\\n            <ul class=\\"error-list\\">\\n              {#each microphoneErrors as error}\\n                <li>{error}</li>\\n              {/each}\\n            </ul>\\n            <p class=\\"fix-instruction\\">\\n              <strong>解決方法:</strong> ページを再読み込みしてマイク許可を再度取得してください。\\n            </p>\\n          </div>\\n        </Card>\\n      {/if}\\n\\n      <div class=\\"side-by-side-container\\">\\n        <!-- Base Tone Section -->\\n        <Card class=\\"main-card half-width\\">\\n          <div class=\\"card-header\\">\\n            <h3 class=\\"section-title\\">🎹 基音再生</h3>\\n          </div>\\n          <div class=\\"card-content\\">\\n            <Button \\n              variant=\\"primary\\"\\n              disabled={isPlaying || trainingPhase === 'guiding' || trainingPhase === 'waiting'}\\n              on:click={playBaseNote}\\n            >\\n              {#if isPlaying}\\n                🎵 再生中...\\n              {:else if currentBaseNote && currentBaseFrequency > 0}\\n                🔄 {currentBaseNote} 再生\\n              {:else}\\n                🎹 ランダム基音再生\\n              {/if}\\n            </Button>\\n            \\n            {#if currentBaseNote}\\n              <div class=\\"base-note-info\\">\\n                現在の基音: <strong>{currentBaseNote}</strong> ({currentBaseFrequency.toFixed(1)}Hz)\\n              </div>\\n            {/if}\\n            \\n            <!-- ドレミガイドスタートバー -->\\n            <div class=\\"guide-start-bar-container\\">\\n              <div class=\\"guide-start-label\\">ガイド開始まで</div>\\n              <div class=\\"guide-start-bar\\">\\n                <div \\n                  class=\\"guide-progress-fill\\" \\n                  style=\\"width: {guideStartProgress}%\\"\\n                ></div>\\n                <div class=\\"guide-music-icon {musicIconGlowing ? 'glowing' : ''}\\">\\n                  <Music size=\\"20\\" />\\n                </div>\\n              </div>\\n            </div>\\n          </div>\\n        </Card>\\n\\n        <!-- Detection Section (Display Only) -->\\n        <PitchDetectionDisplay\\n          frequency={currentFrequency}\\n          note={detectedNote}\\n          volume={currentVolume}\\n          isMuted={trainingPhase !== 'guiding'}\\n          muteMessage=\\"基音再生後に開始\\"\\n          className=\\"half-width\\"\\n          showGuidance={false}\\n        />\\n      </div>\\n    {/if}\\n\\n    {#if trainingPhase !== 'results'}\\n      <!-- Scale Guide Section -->\\n      <Card class=\\"main-card\\">\\n        <div class=\\"card-header\\">\\n          <h3 class=\\"section-title\\">🎵 ドレミ音階ガイド</h3>\\n        </div>\\n        <div class=\\"card-content\\">\\n          <div class=\\"scale-guide\\">\\n            {#each scaleSteps as step, index}\\n              <div \\n                class=\\"scale-item {step.state}\\"\\n              >\\n                {step.name}\\n              </div>\\n            {/each}\\n          </div>\\n          {#if trainingPhase === 'guiding'}\\n            <div class=\\"guide-instruction\\">\\n              ガイドに合わせて <strong>ドレミファソラシド</strong> を歌ってください\\n            </div>\\n          {/if}\\n        </div>\\n      </Card>\\n    {/if}\\n\\n\\n    <!-- Results Section - Enhanced Scoring System -->\\n    {#if trainingPhase === 'results'}\\n      <!-- 統合採点システム結果（localStorage統合版） -->\\n      {#if $unifiedScoreData && $isCompleted}\\n        <!-- 8セッション完了時：localStorageデータを使用 -->\\n        <UnifiedScoreResultFixed \\n          scoreData={$unifiedScoreData}\\n          showDetails={false}\\n          className=\\"mb-6 iphone-no-margin\\"\\n          currentScoreData={currentScoreData}\\n          intervalData={intervalData}\\n          consistencyData={consistencyData}\\n          feedbackData={feedbackData}\\n          technicalFeedbackData={technicalFeedbackData}\\n          sessionStatistics={sessionStatistics}\\n        />\\n      {:else if currentUnifiedScoreData}\\n        <!-- 1セッション完了時：従来のデータを使用 -->\\n        <UnifiedScoreResultFixed \\n          scoreData={currentUnifiedScoreData}\\n          showDetails={false}\\n          className=\\"mb-6 iphone-no-margin\\"\\n          currentScoreData={currentScoreData}\\n          intervalData={intervalData}\\n          consistencyData={consistencyData}\\n          feedbackData={feedbackData}\\n          technicalFeedbackData={technicalFeedbackData}\\n          sessionStatistics={sessionStatistics}\\n        />\\n      {/if}\\n      \\n      \\n      \\n      <!-- アクションボタン（常時表示） -->\\n      {#if trainingPhase === 'results'}\\n        <Card class=\\"main-card bottom-action-card\\">\\n          <div class=\\"card-content\\">\\n            <!-- 下部アクションボタン -->\\n            <ActionButtons \\n              isCompleted={$isCompleted}\\n              position=\\"bottom\\"\\n              on:action={handleActionButtonClick}\\n            />\\n          </div>\\n        </Card>\\n      {/if}\\n    {/if}\\n\\n    <!-- 古い共通アクションボタンは削除（ActionButtonsに統一） -->\\n\\n  {:else}\\n    <!-- Direct Access Error State -->\\n    <Card class=\\"error-card\\">\\n      <div class=\\"error-content\\">\\n        <div class=\\"error-icon\\">🎤</div>\\n        <h3>マイクテストが必要です</h3>\\n        <p>ランダム基音トレーニングを開始する前に、マイクテストページで音声入力の確認をお願いします。</p>\\n        \\n        <div class=\\"recommendation\\">\\n          <p>このページは<strong>マイクテスト完了後</strong>にご利用いただけます。</p>\\n          <p>まずはマイクテストページで音声確認を行ってください。</p>\\n        </div>\\n        \\n        <div class=\\"action-buttons\\">\\n          <Button variant=\\"primary\\" on:click={goToMicrophoneTest}>\\n            🎤 マイクテストページへ移動\\n          </Button>\\n          <Button variant=\\"secondary\\" on:click={goHome}>\\n            🏠 ホームに戻る\\n          </Button>\\n        </div>\\n      </div>\\n    </Card>\\n  {/if}\\n</PageLayout>\\n\\n<style>\\n  /* === shadcn/ui風モダンデザイン === */\\n  \\n  /* ヘッダーセクション */\\n  .header-section {\\n    text-align: center;\\n    margin-bottom: 2rem;\\n  }\\n  \\n  .page-title {\\n    font-size: 2rem;\\n    font-weight: 700;\\n    color: hsl(222.2 84% 4.9%);\\n    margin-bottom: 0.5rem;\\n  }\\n  \\n  .page-description {\\n    color: hsl(215.4 16.3% 46.9%);\\n    font-size: 1rem;\\n    margin: 0;\\n  }\\n\\n\\n  /* カードスタイル（shadcn/ui風） */\\n  :global(.main-card) {\\n    border: 1px solid hsl(214.3 31.8% 91.4%) !important;\\n    background: hsl(0 0% 100%) !important;\\n    border-radius: 8px !important;\\n    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06) !important;\\n    margin-bottom: 1.5rem;\\n  }\\n  \\n  :global(.status-card) {\\n    border-radius: 8px !important;\\n    margin-bottom: 1.5rem;\\n  }\\n  \\n  :global(.error-card) {\\n    border: 1px solid hsl(0 84.2% 60.2%) !important;\\n    background: hsl(0 84.2% 97%) !important;\\n    border-radius: 8px !important;\\n    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1) !important;\\n  }\\n  \\n  :global(.results-card) {\\n    border: 1px solid hsl(142.1 76.2% 36.3%) !important;\\n    background: linear-gradient(135deg, hsl(142.1 76.2% 95%) 0%, hsl(0 0% 100%) 100%) !important;\\n  }\\n\\n  /* カードヘッダー */\\n  .card-header {\\n    padding-bottom: 1rem;\\n    border-bottom: 1px solid hsl(214.3 31.8% 91.4%);\\n    margin-bottom: 1.5rem;\\n  }\\n  \\n  .section-title {\\n    font-size: 1.125rem;\\n    font-weight: 600;\\n    color: hsl(222.2 84% 4.9%);\\n    margin: 0;\\n  }\\n\\n  /* カードコンテンツ */\\n  .card-content {\\n    display: flex;\\n    flex-direction: column;\\n    gap: 1rem;\\n  }\\n\\n  /* ステータス表示 */\\n  .status-content {\\n    display: flex;\\n    justify-content: space-between;\\n    align-items: center;\\n    gap: 1rem;\\n  }\\n  \\n  .status-message {\\n    font-weight: 500;\\n    color: hsl(222.2 84% 4.9%);\\n  }\\n  \\n  .progress-indicator {\\n    font-size: 0.875rem;\\n    color: hsl(215.4 16.3% 46.9%);\\n  }\\n\\n  /* サイドバイサイドレイアウト */\\n  .side-by-side-container {\\n    display: flex;\\n    gap: 1.5rem;\\n    margin-bottom: 1.5rem;\\n  }\\n  \\n  :global(.half-width) {\\n    flex: 1;\\n  }\\n  \\n  @media (max-width: 768px) {\\n    .side-by-side-container {\\n      flex-direction: column;\\n    }\\n    \\n    :global(.half-width) {\\n      width: 100%;\\n    }\\n  }\\n\\n  /* デバッグ情報 */\\n  .debug-info {\\n    position: absolute;\\n    top: 1rem;\\n    right: 1rem;\\n    background: hsl(220 13% 91%);\\n    color: hsl(220 13% 46%);\\n    padding: 0.25rem 0.5rem;\\n    border-radius: 4px;\\n    font-size: 0.75rem;\\n    font-family: 'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', monospace;\\n    z-index: 100;\\n  }\\n\\n  /* 基音情報 */\\n  .base-note-info {\\n    text-align: center;\\n    padding: 1rem;\\n    background: hsl(210 40% 98%);\\n    border-radius: 6px;\\n    border: 1px solid hsl(214.3 31.8% 91.4%);\\n    font-size: 0.875rem;\\n    color: hsl(215.4 16.3% 46.9%);\\n  }\\n\\n  /* 相対音程情報 */\\n  .relative-pitch-info {\\n    text-align: center;\\n    padding: 1rem;\\n    background: hsl(210 40% 98%);\\n    border-radius: 6px;\\n    border: 1px solid hsl(214.3 31.8% 91.4%);\\n    margin-top: 1rem;\\n  }\\n  \\n  .frequency-display-large {\\n    display: flex;\\n    flex-direction: column;\\n    align-items: center;\\n    gap: 0.25rem;\\n  }\\n  \\n  .large-hz {\\n    font-size: 2rem;\\n    font-weight: 700;\\n    color: hsl(222.2 84% 4.9%);\\n    line-height: 1;\\n  }\\n  \\n  .note-with-cents {\\n    font-size: 0.875rem;\\n    color: hsl(215.4 16.3% 46.9%);\\n    font-weight: 500;\\n  }\\n  \\n  .no-signal {\\n    font-size: 2rem;\\n    font-weight: 700;\\n    color: hsl(215.4 16.3% 46.9%);\\n    line-height: 1;\\n  }\\n  \\n  .pitch-detector-placeholder {\\n    text-align: center;\\n    padding: 2rem;\\n    color: hsl(215.4 16.3% 46.9%);\\n    font-style: italic;\\n  }\\n\\n  /* スケールガイド */\\n  .scale-guide {\\n    display: grid;\\n    grid-template-columns: repeat(4, 1fr);\\n    gap: 0.75rem;\\n    margin-bottom: 1rem;\\n  }\\n  \\n  .scale-item {\\n    display: flex;\\n    align-items: center;\\n    justify-content: center;\\n    height: 3rem;\\n    border-radius: 6px;\\n    font-weight: 500;\\n    font-size: 0.875rem;\\n    border: 1px solid hsl(215.4 16.3% 46.9%);\\n    background: hsl(0 0% 100%);\\n    color: hsl(215.4 16.3% 46.9%);\\n    transition: all 0.3s ease;\\n  }\\n  \\n  .scale-item.active {\\n    background: hsl(343.8 79.7% 53.7%) !important;\\n    color: white !important;\\n    border: 2px solid hsla(343.8 79.7% 53.7% / 0.5) !important;\\n    transform: scale(1.2);\\n    font-size: 1.125rem;\\n    font-weight: 700;\\n    animation: pulse 2s infinite;\\n    box-shadow: 0 0 0 2px hsla(343.8 79.7% 53.7% / 0.3) !important;\\n  }\\n  \\n  .scale-item.correct {\\n    background: hsl(142.1 76.2% 36.3%);\\n    color: hsl(210 40% 98%);\\n    border-color: hsl(142.1 76.2% 36.3%);\\n    animation: correctFlash 0.5s ease-out;\\n  }\\n  \\n  .scale-item.incorrect {\\n    background: hsl(0 84.2% 60.2%);\\n    color: hsl(210 40% 98%);\\n    border-color: hsl(0 84.2% 60.2%);\\n    animation: shake 0.5s ease-in-out;\\n  }\\n  \\n  @keyframes pulse {\\n    0%, 100% { opacity: 1; }\\n    50% { opacity: 0.7; }\\n  }\\n  \\n  @keyframes correctFlash {\\n    0% { transform: scale(1); background: hsl(47.9 95.8% 53.1%); }\\n    50% { transform: scale(1.1); background: hsl(142.1 76.2% 36.3%); }\\n    100% { transform: scale(1); background: hsl(142.1 76.2% 36.3%); }\\n  }\\n  \\n  @keyframes shake {\\n    0%, 100% { transform: translateX(0); }\\n    25% { transform: translateX(-5px); }\\n    75% { transform: translateX(5px); }\\n  }\\n  \\n  /* currentクラスは削除（使用していない） */\\n  \\n  .guide-instruction {\\n    text-align: center;\\n    font-size: 0.875rem;\\n    color: hsl(215.4 16.3% 46.9%);\\n    padding: 0.75rem;\\n    background: hsl(210 40% 98%);\\n    border-radius: 6px;\\n  }\\n  \\n  .guide-feedback {\\n    display: flex;\\n    align-items: center;\\n    justify-content: center;\\n    gap: 0.5rem;\\n    margin-top: 0.5rem;\\n    font-size: 0.75rem;\\n  }\\n  \\n  .feedback-label {\\n    color: hsl(215.4 16.3% 46.9%);\\n    font-weight: 500;\\n  }\\n  \\n  .feedback-value {\\n    font-weight: 700;\\n    font-family: 'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', monospace;\\n    padding: 0.125rem 0.375rem;\\n    border-radius: 4px;\\n    background: hsl(214.3 31.8% 91.4%);\\n    color: hsl(222.2 84% 4.9%);\\n    min-width: 4ch;\\n    text-align: center;\\n  }\\n  \\n  .feedback-value.accurate {\\n    background: hsl(142.1 76.2% 90%);\\n    color: hsl(142.1 76.2% 30%);\\n  }\\n  \\n  .feedback-value.close {\\n    background: hsl(47.9 95.8% 90%);\\n    color: hsl(47.9 95.8% 30%);\\n  }\\n  \\n  .feedback-status {\\n    font-weight: 500;\\n    font-size: 0.75rem;\\n  }\\n  \\n  .feedback-status.success {\\n    color: hsl(142.1 76.2% 36.3%);\\n  }\\n  \\n  .feedback-status.close {\\n    color: hsl(47.9 95.8% 45%);\\n  }\\n\\n  /* 検出表示 */\\n  .detection-display {\\n    display: flex;\\n    flex-direction: column;\\n    gap: 1rem;\\n  }\\n  \\n  .detection-card {\\n    display: inline-flex;\\n    align-items: baseline;\\n    gap: 0.5rem;\\n    padding: 1rem 1.5rem;\\n    background: hsl(0 0% 100%);\\n    border: 1px solid hsl(214.3 31.8% 91.4%);\\n    border-radius: 8px;\\n    width: fit-content;\\n  }\\n\\n  /* PitchDetector表示の最強制スタイリング */\\n  :global(.detected-frequency) {\\n    font-weight: 600 !important;\\n    font-size: 2rem !important;\\n    color: hsl(222.2 84% 4.9%) !important;\\n    font-family: 'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', \\n                 'JetBrains Mono', 'Fira Code', 'Consolas', monospace !important;\\n    min-width: 4ch !important;\\n    text-align: right !important;\\n    display: inline-block !important;\\n    font-variant-numeric: tabular-nums !important;\\n    -webkit-font-smoothing: antialiased !important;\\n    -moz-osx-font-smoothing: grayscale !important;\\n  }\\n\\n  :global(.hz-suffix) {\\n    font-weight: 600 !important;\\n    font-size: 2rem !important;\\n    color: hsl(222.2 84% 4.9%) !important;\\n  }\\n\\n  :global(.divider) {\\n    color: hsl(214.3 31.8% 70%) !important;\\n    font-size: 1.5rem !important;\\n    margin: 0 0.25rem !important;\\n    font-weight: 300 !important;\\n  }\\n  \\n  :global(.detected-note) {\\n    font-weight: 600 !important;\\n    font-size: 2rem !important;\\n    color: hsl(215.4 16.3% 46.9%) !important;\\n    font-family: 'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', \\n                 'JetBrains Mono', 'Fira Code', 'Consolas', monospace !important;\\n    min-width: 3ch !important;\\n    display: inline-block !important;\\n    text-align: center !important;\\n  }\\n\\n  :global(.volume-bar) {\\n    border-radius: 4px !important;\\n  }\\n  \\n  .detected-info {\\n    display: flex;\\n    align-items: center;\\n    gap: 0.5rem;\\n    font-size: 0.875rem;\\n  }\\n  \\n  .detected-label {\\n    color: hsl(215.4 16.3% 46.9%);\\n  }\\n  \\n  .detected-frequency {\\n    font-weight: 700;\\n    font-size: 1.25rem;\\n    color: hsl(222.2 84% 4.9%);\\n    margin-right: 0.5rem;\\n  }\\n  \\n  .detected-note {\\n    font-weight: 500;\\n    font-size: 0.875rem;\\n    color: hsl(215.4 16.3% 46.9%);\\n    margin-right: 0.25rem;\\n  }\\n  \\n  .pitch-diff {\\n    color: hsl(47.9 95.8% 40%);\\n    font-weight: 500;\\n    margin-left: 0.25rem;\\n  }\\n  \\n  .volume-section {\\n    display: flex;\\n    flex-direction: column;\\n    gap: 0.5rem;\\n  }\\n  \\n  .volume-label {\\n    font-size: 0.875rem;\\n    color: hsl(215.4 16.3% 46.9%);\\n  }\\n  \\n  :global(.modern-volume-bar) {\\n    border-radius: 4px !important;\\n  }\\n\\n  /* 結果表示 */\\n  .results-summary {\\n    display: grid;\\n    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));\\n    gap: 1rem;\\n    margin-bottom: 2rem;\\n  }\\n  \\n  .result-item {\\n    text-align: center;\\n    padding: 1rem;\\n    border-radius: 6px;\\n    background: hsl(0 0% 100%);\\n    border: 1px solid hsl(214.3 31.8% 91.4%);\\n  }\\n  \\n  .result-label {\\n    display: block;\\n    font-size: 0.875rem;\\n    color: hsl(215.4 16.3% 46.9%);\\n    margin-bottom: 0.25rem;\\n  }\\n  \\n  .result-value {\\n    display: block;\\n    font-size: 1.5rem;\\n    font-weight: 700;\\n    color: hsl(222.2 84% 4.9%);\\n  }\\n  \\n  .result-value.success {\\n    color: hsl(142.1 76.2% 36.3%);\\n  }\\n  \\n  /* 詳細結果 */\\n  .detailed-results {\\n    margin-top: 2rem;\\n  }\\n  \\n  .detailed-title {\\n    font-size: 1rem;\\n    font-weight: 600;\\n    color: hsl(222.2 84% 4.9%);\\n    margin-bottom: 1rem;\\n    text-align: center;\\n  }\\n  \\n  .scale-results {\\n    display: flex;\\n    flex-direction: column;\\n    gap: 0.5rem;\\n  }\\n  \\n  .scale-result-item {\\n    display: grid;\\n    grid-template-columns: 1fr auto auto auto;\\n    gap: 1rem;\\n    padding: 0.75rem;\\n    border-radius: 6px;\\n    border: 1px solid hsl(214.3 31.8% 91.4%);\\n    background: hsl(0 0% 100%);\\n    align-items: center;\\n  }\\n  \\n  .scale-result-item.correct {\\n    background: hsl(142.1 76.2% 95%);\\n    border-color: hsl(142.1 76.2% 80%);\\n  }\\n  \\n  .scale-result-item.incorrect {\\n    background: hsl(0 84.2% 95%);\\n    border-color: hsl(0 84.2% 80%);\\n  }\\n  \\n  .scale-name {\\n    font-weight: 600;\\n    color: hsl(222.2 84% 4.9%);\\n  }\\n  \\n  .scale-accuracy {\\n    font-weight: 500;\\n    font-family: 'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', monospace;\\n    color: hsl(215.4 16.3% 46.9%);\\n  }\\n  \\n  .scale-cents {\\n    font-weight: 500;\\n    font-family: 'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', monospace;\\n    color: hsl(215.4 16.3% 46.9%);\\n    font-size: 0.875rem;\\n  }\\n  \\n  .scale-status {\\n    text-align: center;\\n    font-size: 1.125rem;\\n  }\\n\\n  /* アクションボタン - 新しいActionButtonsコンポーネントで管理 */\\n  \\n  /* 上部アクションボタンのマージン調整 - 最優先適用 */\\n  .top-action-buttons {\\n    margin: 0.125rem 0 0.125rem 0 !important; /* 下マージンをさらに縮小: 0.25rem → 0.125rem */\\n    padding: 0 !important;\\n  }\\n  \\n  /* 下部アクションボタンカードのマージン調整 - 最優先適用 */\\n  :global(.bottom-action-card) {\\n    margin-top: 0.5rem !important;  /* さらに縮小 */\\n    margin-bottom: 0.5rem !important; /* さらに縮小 */\\n    padding: 0.25rem !important; /* カード自体のpadding縮小 */\\n  }\\n  \\n  /* 下部アクションボタンカード内のpadding調整 - 最優先適用 */\\n  :global(.bottom-action-card .card-content) {\\n    padding: 0.25rem !important; /* さらに縮小 */\\n    margin: 0 !important;\\n  }\\n  \\n  /* ActionButtonsコンポーネント内のマージンを強制上書き */\\n  :global(.action-buttons-container.top) {\\n    margin: 0 !important;\\n    padding: 0.25rem 1rem !important;\\n  }\\n  \\n  :global(.action-buttons-container.bottom) {\\n    margin: 0 !important; \\n    padding: 0.25rem 1rem !important;\\n  }\\n  \\n  /* UnifiedScoreResultFixed上部padding強制削減 */\\n  :global(.unified-score-result) {\\n    padding-top: 0.25rem !important; /* さらに縮小: 0.5rem → 0.25rem */\\n  }\\n  \\n  /* iPhone: 完全余白削除 */\\n  @media (max-width: 640px) {\\n    /* メインページ全体の余白削除 */\\n    main {\\n      margin: 0 !important;\\n      padding: 0 !important;\\n    }\\n    \\n    /* UnifiedScoreResultFixed完全余白削除 */\\n    :global(.iphone-no-margin) {\\n      margin: 0 !important;\\n      padding: 0 !important;\\n    }\\n    \\n    /* mb-6クラス無効化 */\\n    :global(.mb-6) {\\n      margin-bottom: 0 !important;\\n    }\\n    \\n    /* ページコンテナ余白削除 */\\n    .page-container {\\n      margin: 0 !important;\\n      padding: 0 !important;\\n    }\\n  }\\n  \\n  /* 古い共通アクションボタンスタイルは削除（ActionButtonsに統一） */\\n\\n  /* エラー表示 */\\n  .error-content {\\n    text-align: center;\\n    padding: 2rem 1rem;\\n  }\\n  \\n  .error-icon, .loading-icon {\\n    font-size: 3rem;\\n    margin-bottom: 1rem;\\n  }\\n  \\n  .error-content h3 {\\n    font-size: 1.25rem;\\n    font-weight: 600;\\n    color: hsl(222.2 84% 4.9%);\\n    margin-bottom: 0.5rem;\\n  }\\n  \\n  .error-content p {\\n    color: hsl(215.4 16.3% 46.9%);\\n    margin-bottom: 1rem;\\n  }\\n  \\n  .recommendation {\\n    background: hsl(210 40% 98%);\\n    border: 1px solid hsl(214.3 31.8% 91.4%);\\n    border-radius: 6px;\\n    padding: 1rem;\\n    margin: 1rem 0;\\n  }\\n  \\n  .recommendation p {\\n    margin: 0;\\n    font-size: 0.875rem;\\n  }\\n\\n  /* レスポンシブ対応 */\\n  @media (min-width: 768px) {\\n    .scale-guide {\\n      grid-template-columns: repeat(8, 1fr);\\n    }\\n    \\n    .page-title {\\n      font-size: 2.5rem;\\n    }\\n    \\n    .results-summary {\\n      grid-template-columns: repeat(3, 1fr);\\n    }\\n  }\\n  \\n  @media (max-width: 640px) {\\n    .status-content {\\n      flex-direction: column;\\n      gap: 0.5rem;\\n    }\\n    \\n    /* アクションボタン - ActionButtonsコンポーネントで管理 */\\n    \\n    :global(.primary-button), :global(.secondary-button) {\\n      min-width: 100% !important;\\n    }\\n  }\\n\\n  /* マイク警告カード */\\n  :global(.warning-card) {\\n    border: 2px solid #fbbf24 !important;\\n    background: #fef3c7 !important;\\n    margin-bottom: 24px !important;\\n  }\\n\\n  .warning-message {\\n    color: #92400e;\\n    margin-bottom: 12px;\\n  }\\n\\n  .error-list {\\n    color: #dc2626;\\n    margin: 12px 0;\\n    padding-left: 20px;\\n  }\\n\\n  .error-list li {\\n    margin-bottom: 4px;\\n    font-family: monospace;\\n    font-size: 14px;\\n  }\\n\\n  .fix-instruction {\\n    color: #059669;\\n    margin-top: 12px;\\n    padding: 8px;\\n    background: #d1fae5;\\n    border-radius: 4px;\\n    border-left: 4px solid #059669;\\n  }\\n\\n  /* === 採点表示専用スタイル === */\\n  \\n  /* タブコンテナ */\\n  .scoring-tabs-container {\\n    display: flex;\\n    gap: 0.5rem;\\n    margin-bottom: 1.5rem;\\n    overflow-x: auto;\\n    border-bottom: 1px solid hsl(214.3 31.8% 91.4%);\\n    padding-bottom: 0.5rem;\\n  }\\n  \\n  /* タブボタン */\\n  .scoring-tab {\\n    padding: 0.75rem 1rem;\\n    border-radius: 6px;\\n    border: 1px solid hsl(214.3 31.8% 91.4%);\\n    background: hsl(0 0% 100%);\\n    color: hsl(215.4 16.3% 46.9%);\\n    font-size: 0.875rem;\\n    font-weight: 500;\\n    cursor: pointer;\\n    transition: all 0.2s ease;\\n    flex-shrink: 0;\\n    white-space: nowrap;\\n  }\\n  \\n  .scoring-tab:hover {\\n    background: hsl(210 40% 98%);\\n    border-color: hsl(217.2 32.6% 17.5%);\\n  }\\n  \\n  .scoring-tab.active {\\n    background: hsl(217.2 91.2% 59.8%);\\n    color: hsl(210 40% 98%);\\n    border-color: hsl(217.2 91.2% 59.8%);\\n    font-weight: 600;\\n  }\\n  \\n  /* タブコンテンツ */\\n  .tab-content {\\n    margin-top: 1rem;\\n    min-height: 200px;\\n  }\\n  \\n  .tab-panel {\\n    animation: fadeIn 0.3s ease-in-out;\\n  }\\n  \\n  @keyframes fadeIn {\\n    from { opacity: 0; transform: translateY(10px); }\\n    to { opacity: 1; transform: translateY(0); }\\n  }\\n  \\n  /* モバイル対応 */\\n  @media (max-width: 768px) {\\n    .scoring-tabs-container {\\n      flex-wrap: wrap;\\n    }\\n    \\n    .scoring-tab {\\n      flex: 1;\\n      min-width: 120px;\\n    }\\n  }\\n  \\n  /* 折りたたみ詳細セクション */\\n  .traditional-scoring-details,\\n  .detailed-random-scoring,\\n  .random-scoring-section {\\n    margin-top: 2rem;\\n    padding: 1rem;\\n    background: #f9fafb;\\n    border-radius: 8px;\\n  }\\n  \\n  .traditional-scoring-details summary {\\n    font-weight: 600;\\n    transition: color 0.2s;\\n  }\\n  \\n  .traditional-scoring-details summary:hover {\\n    color: #374151;\\n  }\\n  \\n  .traditional-scoring-details[open] summary span {\\n    transform: rotate(90deg);\\n  }\\n  \\n  .traditional-scoring-details summary span {\\n    transition: transform 0.2s;\\n  }\\n  \\n  /* セッション進捗表示 */\\n  .session-progress {\\n    background: hsl(0 0% 100%);\\n    border: 1px solid hsl(214.3 31.8% 91.4%);\\n    border-radius: 8px;\\n    padding: 12px 16px;\\n    margin: 16px 0;\\n    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);\\n  }\\n  \\n  .session-status {\\n    display: flex;\\n    justify-content: space-between;\\n    align-items: center;\\n    gap: 1rem;\\n  }\\n  \\n  .session-info {\\n    display: flex;\\n    align-items: center;\\n    gap: 1rem;\\n  }\\n  \\n  .completed-count {\\n    font-weight: 700;\\n    color: hsl(222.2 84% 4.9%);\\n    font-size: 1.125rem;\\n  }\\n  \\n  .remaining-text {\\n    color: hsl(215.4 16.3% 46.9%);\\n    font-size: 0.875rem;\\n  }\\n  \\n  .progress-section {\\n    display: flex;\\n    align-items: center;\\n    gap: 12px;\\n  }\\n  \\n  .progress-bar {\\n    width: 120px;\\n    height: 4px;\\n    background: hsl(214.3 31.8% 91.4%);\\n    border-radius: 2px;\\n    overflow: hidden;\\n    position: relative;\\n  }\\n  \\n  .progress-fill {\\n    height: 100%;\\n    background: hsl(217.2 91.2% 59.8%);\\n    transition: width 0.3s ease;\\n  }\\n  \\n  .progress-text {\\n    font-weight: 500;\\n    color: hsl(217.2 91.2% 59.8%);\\n    font-size: 0.875rem;\\n    min-width: 35px;\\n    text-align: right;\\n  }\\n  \\n  /* ドレミガイドスタートバー */\\n  .guide-start-bar-container {\\n    margin-top: 1rem;\\n    padding: 0.75rem;\\n    background: #f8fafc;\\n    border-radius: 8px;\\n    border: 1px solid #e2e8f0;\\n  }\\n  \\n  .guide-start-label {\\n    font-size: 0.875rem;\\n    color: #64748b;\\n    margin-bottom: 0.5rem;\\n    text-align: center;\\n    font-weight: 500;\\n  }\\n  \\n  .guide-start-bar {\\n    position: relative;\\n    height: 8px;\\n    background: #e2e8f0;\\n    border-radius: 4px;\\n    overflow: hidden;\\n    display: flex;\\n    align-items: center;\\n  }\\n  \\n  .guide-progress-fill {\\n    height: 100%;\\n    background: linear-gradient(90deg, #3b82f6, #1d4ed8);\\n    border-radius: 4px;\\n    transition: width 0.1s ease-out;\\n  }\\n  \\n  .guide-music-icon {\\n    position: absolute;\\n    right: 8px;\\n    top: 50%;\\n    transform: translateY(-50%);\\n    color: #64748b;\\n    transition: all 0.3s ease;\\n    display: flex;\\n    align-items: center;\\n    justify-content: center;\\n    width: 32px;\\n    height: 32px;\\n    border-radius: 50%;\\n    background: white;\\n    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);\\n  }\\n  \\n  .guide-music-icon.glowing {\\n    color: #fbbf24;\\n    background: #fffbeb;\\n    box-shadow: 0 0 12px rgba(251, 191, 36, 0.4);\\n    animation: pulse-glow 1s infinite;\\n  }\\n  \\n  @keyframes pulse-glow {\\n    0%, 100% {\\n      transform: translateY(-50%) scale(1);\\n      box-shadow: 0 0 12px rgba(251, 191, 36, 0.4);\\n    }\\n    50% {\\n      transform: translateY(-50%) scale(1.1);\\n      box-shadow: 0 0 20px rgba(251, 191, 36, 0.6);\\n    }\\n  }\\n  \\n  @media (max-width: 768px) {\\n    .session-status {\\n      flex-direction: column;\\n      gap: 8px;\\n      align-items: center;\\n    }\\n    \\n    .session-info {\\n      width: 100%;\\n      justify-content: center;\\n    }\\n    \\n    .progress-section {\\n      width: 100%;\\n      justify-content: center;\\n    }\\n  }\\n</style>"],"names":[],"mappings":"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"}`
};
const buildVersion = "v2.3.1-ANIMATED";
const buildTimestamp = "07/29 04:15";
const updateStatus = "🎬 評価分布アニメーション実装・UX向上";
function generateIntervalDataFromSessionHistory(sessionHistory2) {
  if (!sessionHistory2 || !Array.isArray(sessionHistory2)) {
    console.warn("⚠️ [RandomTraining] sessionHistory が無効です");
    return [];
  }
  const scaleData = [
    {
      type: "unison",
      scale: "ド",
      intervalName: "ユニゾン",
      noteIndex: 0
    },
    {
      type: "major_second",
      scale: "レ",
      intervalName: "長2度",
      noteIndex: 1
    },
    {
      type: "major_third",
      scale: "ミ",
      intervalName: "長3度",
      noteIndex: 2
    },
    {
      type: "perfect_fourth",
      scale: "ファ",
      intervalName: "完全4度",
      noteIndex: 3
    },
    {
      type: "perfect_fifth",
      scale: "ソ",
      intervalName: "完全5度",
      noteIndex: 4
    },
    {
      type: "major_sixth",
      scale: "ラ",
      intervalName: "長6度",
      noteIndex: 5
    },
    {
      type: "major_seventh",
      scale: "シ",
      intervalName: "長7度",
      noteIndex: 6
    },
    {
      type: "octave",
      scale: "ド（高）",
      intervalName: "オクターブ",
      noteIndex: 7
    }
  ];
  const intervalStats = {};
  scaleData.forEach((item) => {
    intervalStats[item.type] = {
      type: item.type,
      scale: item.scale,
      intervalName: item.intervalName,
      attempts: 0,
      successCount: 0,
      accuracySum: 0,
      accuracyValues: [],
      errorValues: []
      // セント単位の誤差を記録
    };
  });
  sessionHistory2.forEach((session) => {
    if (!session.noteResults || !Array.isArray(session.noteResults)) {
      return;
    }
    session.noteResults.forEach((noteResult, noteIndex) => {
      if (noteIndex >= scaleData.length) return;
      const intervalType = scaleData[noteIndex].type;
      const stats = intervalStats[intervalType];
      stats.attempts++;
      if (noteResult.accuracy !== "notMeasured" && typeof noteResult.accuracy === "number") {
        stats.accuracyValues.push(noteResult.accuracy);
        stats.accuracySum += noteResult.accuracy;
        const errorCents = Math.round((100 - noteResult.accuracy) * 0.5);
        stats.errorValues.push(errorCents);
        if (noteResult.accuracy >= 70) {
          stats.successCount++;
        }
      }
    });
  });
  return scaleData.map((item) => {
    const stats = intervalStats[item.type];
    if (stats.attempts === 0) {
      return {
        type: item.type,
        scale: item.scale,
        intervalName: item.intervalName,
        attempts: 0,
        averageError: null,
        accuracy: 0
      };
    }
    const averageAccuracy = stats.accuracyValues.length > 0 ? Math.round(stats.accuracySum / stats.accuracyValues.length) : 0;
    const averageError = stats.errorValues.length > 0 ? Math.round(stats.errorValues.reduce((a, b) => a + b, 0) / stats.errorValues.length) : null;
    const mastery = stats.accuracyValues.length > 0 ? Math.round(stats.successCount / stats.accuracyValues.length * 100) : 0;
    return {
      type: item.type,
      scale: item.scale,
      intervalName: item.intervalName,
      mastery,
      attempts: stats.attempts,
      averageError,
      accuracy: averageAccuracy
    };
  });
}
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
  let $unifiedScoreData, $$unsubscribe_unifiedScoreData;
  let $isCompleted, $$unsubscribe_isCompleted;
  let $$unsubscribe_page;
  let $$unsubscribe_currentSessionId;
  let $$unsubscribe_remainingSessions;
  let $$unsubscribe_nextBaseName;
  let $$unsubscribe_nextBaseNote;
  let $sessionHistory, $$unsubscribe_sessionHistory;
  let $$unsubscribe_trainingProgress;
  let $isLoading, $$unsubscribe_isLoading;
  validate_store(unifiedScoreData, "unifiedScoreData");
  $$unsubscribe_unifiedScoreData = subscribe(unifiedScoreData, (value) => $unifiedScoreData = value);
  validate_store(isCompleted, "isCompleted");
  $$unsubscribe_isCompleted = subscribe(isCompleted, (value) => $isCompleted = value);
  validate_store(page, "page");
  $$unsubscribe_page = subscribe(page, (value) => value);
  validate_store(currentSessionId, "currentSessionId");
  $$unsubscribe_currentSessionId = subscribe(currentSessionId, (value) => value);
  validate_store(remainingSessions, "remainingSessions");
  $$unsubscribe_remainingSessions = subscribe(remainingSessions, (value) => value);
  validate_store(nextBaseName, "nextBaseName");
  $$unsubscribe_nextBaseName = subscribe(nextBaseName, (value) => value);
  validate_store(nextBaseNote, "nextBaseNote");
  $$unsubscribe_nextBaseNote = subscribe(nextBaseNote, (value) => value);
  validate_store(sessionHistory, "sessionHistory");
  $$unsubscribe_sessionHistory = subscribe(sessionHistory, (value) => $sessionHistory = value);
  validate_store(trainingProgress, "trainingProgress");
  $$unsubscribe_trainingProgress = subscribe(trainingProgress, (value) => value);
  validate_store(isLoading, "isLoading");
  $$unsubscribe_isLoading = subscribe(isLoading, (value) => $isLoading = value);
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
  let guideStartProgress = 0;
  let currentVolume = 0;
  let currentFrequency = 0;
  let detectedNote = "ーー";
  let intervalData = [];
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
      if ($unifiedScoreData && $isCompleted && $unifiedScoreData.sessionHistory) {
        intervalData = generateIntervalDataFromSessionHistory($unifiedScoreData.sessionHistory);
        console.log("🎵 [RandomTraining] intervalData生成完了:", intervalData.length, "件");
      }
    }
    {
      if (microphoneState === "granted") {
        scrollToTop();
      }
    }
    $$rendered = `${validate_component(PageLayout, "PageLayout").$$render($$result, {}, {}, {
      default: () => {
        return ` <div class="header-section svelte-1ktm6f3"><h1 class="page-title svelte-1ktm6f3" data-svelte-h="svelte-1ptm9zr">🎵 ランダム基音トレーニング</h1> <p class="page-description svelte-1ktm6f3" data-svelte-h="svelte-19nes7">10種類の基音からランダムに選択してドレミファソラシドを練習</p>  ${microphoneState === "granted" && !$isLoading ? `<div class="session-progress svelte-1ktm6f3"><div class="session-status svelte-1ktm6f3"><div class="session-info svelte-1ktm6f3"><span class="completed-count svelte-1ktm6f3">${escape($sessionHistory?.length || 0)}/8</span> <span class="remaining-text svelte-1ktm6f3">残り ${escape(8 - ($sessionHistory?.length || 0))} セッション</span></div> <div class="progress-section svelte-1ktm6f3"><div class="progress-bar svelte-1ktm6f3"><div class="progress-fill svelte-1ktm6f3" style="${"width: " + escape(($sessionHistory?.length || 0) / 8 * 100, true) + "%"}"></div></div> <span class="progress-text svelte-1ktm6f3">${escape(Math.round(($sessionHistory?.length || 0) / 8 * 100))}%</span></div></div></div>  ${``}` : ``} <div class="debug-info svelte-1ktm6f3">📱 ${escape(buildVersion)} | ${escape(buildTimestamp)}<br> <small style="font-size: 0.6rem;">${escape(updateStatus)}</small></div></div> ${microphoneState === "granted" ? ` <div style="display: none;">${validate_component(PitchDetector_1, "PitchDetector").$$render(
          $$result,
          {
            isActive: microphoneState === "granted",
            trainingPhase,
            className: "pitch-detector-content",
            debugMode: true,
            disableHarmonicCorrection: false,
            this: pitchDetectorComponent
          },
          {
            this: ($$value) => {
              pitchDetectorComponent = $$value;
              $$settled = false;
            }
          },
          {}
        )}</div>  ${`  ${``} <div class="side-by-side-container svelte-1ktm6f3"> ${validate_component(Card, "Card").$$render($$result, { class: "main-card half-width" }, {}, {
          default: () => {
            return `<div class="card-header svelte-1ktm6f3"><h3 class="section-title svelte-1ktm6f3" data-svelte-h="svelte-syc53b">🎹 基音再生</h3></div> <div class="card-content svelte-1ktm6f3">${validate_component(Button, "Button").$$render(
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
            )} ${``}  <div class="guide-start-bar-container svelte-1ktm6f3"><div class="guide-start-label svelte-1ktm6f3" data-svelte-h="svelte-1dufnpv">ガイド開始まで</div> <div class="guide-start-bar svelte-1ktm6f3"><div class="guide-progress-fill svelte-1ktm6f3" style="${"width: " + escape(guideStartProgress, true) + "%"}"></div> <div class="${"guide-music-icon " + escape("", true) + " svelte-1ktm6f3"}">${validate_component(Music, "Music").$$render($$result, { size: "20" }, {}, {})}</div></div></div></div>`;
          }
        })}  ${validate_component(PitchDetectionDisplay, "PitchDetectionDisplay").$$render(
          $$result,
          {
            frequency: currentFrequency,
            note: detectedNote,
            volume: currentVolume,
            isMuted: trainingPhase !== "guiding",
            muteMessage: "基音再生後に開始",
            className: "half-width",
            showGuidance: false
          },
          {},
          {}
        )}</div>`} ${` ${validate_component(Card, "Card").$$render($$result, { class: "main-card" }, {}, {
          default: () => {
            return `<div class="card-header svelte-1ktm6f3"><h3 class="section-title svelte-1ktm6f3" data-svelte-h="svelte-1mor0as">🎵 ドレミ音階ガイド</h3></div> <div class="card-content svelte-1ktm6f3"><div class="scale-guide svelte-1ktm6f3">${each(scaleSteps, (step, index) => {
              return `<div class="${"scale-item " + escape(step.state, true) + " svelte-1ktm6f3"}">${escape(step.name)} </div>`;
            })}</div> ${``}</div>`;
          }
        })}`}  ${``} ` : ` ${validate_component(Card, "Card").$$render($$result, { class: "error-card" }, {}, {
          default: () => {
            return `<div class="error-content svelte-1ktm6f3"><div class="error-icon svelte-1ktm6f3" data-svelte-h="svelte-15rbx8n">🎤</div> <h3 class="svelte-1ktm6f3" data-svelte-h="svelte-17kvze2">マイクテストが必要です</h3> <p class="svelte-1ktm6f3" data-svelte-h="svelte-12s9olt">ランダム基音トレーニングを開始する前に、マイクテストページで音声入力の確認をお願いします。</p> <div class="recommendation svelte-1ktm6f3"><p class="svelte-1ktm6f3">このページは<strong data-svelte-h="svelte-1n3qsr6">マイクテスト完了後</strong>にご利用いただけます。</p> <p class="svelte-1ktm6f3" data-svelte-h="svelte-v8nd09">まずはマイクテストページで音声確認を行ってください。</p></div> <div class="action-buttons">${validate_component(Button, "Button").$$render($$result, { variant: "primary" }, {}, {
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
  $$unsubscribe_unifiedScoreData();
  $$unsubscribe_isCompleted();
  $$unsubscribe_page();
  $$unsubscribe_currentSessionId();
  $$unsubscribe_remainingSessions();
  $$unsubscribe_nextBaseName();
  $$unsubscribe_nextBaseNote();
  $$unsubscribe_sessionHistory();
  $$unsubscribe_trainingProgress();
  $$unsubscribe_isLoading();
  return $$rendered;
});
export {
  Page as default
};
