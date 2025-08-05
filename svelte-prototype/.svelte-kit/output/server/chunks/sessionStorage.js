import { c as create_ssr_component, f as compute_rest_props, g as spread, d as each, h as escape_object, i as escape_attribute_value, v as validate_component } from "./ssr.js";
import { d as derived, w as writable } from "./index.js";
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
