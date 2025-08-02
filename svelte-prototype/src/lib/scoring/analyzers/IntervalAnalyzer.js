/**
 * IntervalAnalyzer - 音程種別分析・習得度管理システム
 * 
 * 目的: 相対音感向上のための音程分析
 * - 13種類の音程を正確に分類
 * - 各音程の習得度を継続追跡
 * - 音程特性に基づく学習指導
 */

export class IntervalAnalyzer {
  constructor() {
    // 音程定義（相対音感トレーニング用）
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
        importance: 1.0,
        description: "全音上（ドレ）",
        difficulty: "基本",
        commonErrors: ["短2度との混同"]
      },
      minorThird: { 
        name: "短3度", 
        semitones: 3, 
        importance: 1.0,
        description: "短調の3度（ドミ♭）",
        difficulty: "中",
        commonErrors: ["長3度との混同"]
      },
      majorThird: { 
        name: "長3度", 
        semitones: 4, 
        importance: 1.0,
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
    
    // 習得度データ（LocalStorage連携予定）
    this.masteryData = new Map();
    
    // 分析履歴（セッション内）
    this.analysisHistory = [];
    this.maxHistoryLength = 100;
    
    // デバッグモード
    this.debugMode = import.meta.env.DEV;
    
    // 初期化
    this.initializeMasteryData();
    
    this.log('🎵 IntervalAnalyzer初期化完了', {
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
      // 1. 目標音程の特定
      const targetSemitones = this.calculateSemitones(baseFreq, targetFreq);
      const targetInterval = this.identifyInterval(targetSemitones);
      
      // 2. 検出音程の特定
      const detectedSemitones = this.calculateSemitones(baseFreq, detectedFreq);
      const detectedInterval = this.identifyInterval(detectedSemitones);
      
      // 3. 音程精度の評価
      const accuracy = this.calculateIntervalAccuracy(targetSemitones, detectedSemitones);
      
      // 4. 習得度の更新・取得
      this.updateMastery(targetInterval.key, accuracy);
      const mastery = this.getMastery(targetInterval.key);
      
      // 5. 分析結果の構築
      const analysis = {
        targetInterval,
        detectedInterval,
        targetSemitones,
        detectedSemitones,
        accuracy,
        mastery,
        masteryLevels: Object.fromEntries(this.masteryData), // EnhancedScoringEngine互換性のため追加
        isCorrectInterval: targetInterval.key === detectedInterval.key,
        feedback: this.generateIntervalFeedback(targetInterval, detectedInterval, accuracy),
        timestamp: Date.now()
      };
      
      // 6. 履歴記録
      this.recordAnalysis(analysis);
      
      // 7. デバッグログ
      if (this.debugMode) {
        this.logAnalysisDetails(analysis);
      }
      
      return analysis;
      
    } catch (error) {
      console.error('❌ [IntervalAnalyzer] 分析エラー:', error);
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
    
    // オクターブ正規化（±12セミトーン範囲に収める）
    const normalizedSemitones = ((semitones % 12) + 12) % 12;
    
    return normalizedSemitones;
  }
  
  /**
   * セミトーン数から音程を特定
   * @param {number} semitones - セミトーン数
   * @returns {Object} - 音程情報
   */
  identifyInterval(semitones) {
    // 最も近い音程を検索
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
    
    // セミトーン差に基づく精度計算
    // 0.1セミトーン以内: 100点
    // 0.5セミトーン以内: 80点
    // 1.0セミトーン以内: 60点
    // 2.0セミトーン以内: 40点
    const accuracy = Math.max(0, 100 - (semitoneDiff * 50));
    
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
        trend: 'stable'
      });
    }
    
    const mastery = this.masteryData.get(intervalKey);
    
    // 統計更新
    mastery.attempts++;
    mastery.totalAccuracy += accuracy;
    mastery.averageAccuracy = mastery.totalAccuracy / mastery.attempts;
    mastery.bestAccuracy = Math.max(mastery.bestAccuracy, accuracy);
    mastery.lastAttempt = Date.now();
    
    // 直近の試行履歴（最大10回）
    mastery.recentAttempts.push(accuracy);
    if (mastery.recentAttempts.length > 10) {
      mastery.recentAttempts.shift();
    }
    
    // トレンド分析
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
        level: 'beginner',
        progress: 0
      };
    }
    
    // 習得レベルの判定
    const level = this.determineMasteryLevel(mastery.averageAccuracy, mastery.attempts);
    
    // 進捗率の計算（0-100%）
    const progress = Math.min(100, (mastery.averageAccuracy * mastery.attempts) / 500);
    
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
    if (attempts < 3) return 'beginner';
    if (averageAccuracy >= 90 && attempts >= 10) return 'master';
    if (averageAccuracy >= 80 && attempts >= 7) return 'advanced';
    if (averageAccuracy >= 70 && attempts >= 5) return 'intermediate';
    if (averageAccuracy >= 50) return 'novice';
    return 'beginner';
  }
  
  /**
   * トレンド分析
   * @param {Array} recentAttempts - 直近の試行結果
   * @returns {string} - トレンド ('improving' | 'stable' | 'declining')
   */
  calculateTrend(recentAttempts) {
    if (recentAttempts.length < 3) return 'stable';
    
    const recent = recentAttempts.slice(-3);
    const earlier = recentAttempts.slice(-6, -3);
    
    if (earlier.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, val) => sum + val, 0) / earlier.length;
    
    const improvement = recentAvg - earlierAvg;
    
    if (improvement > 5) return 'improving';
    if (improvement < -5) return 'declining';
    return 'stable';
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
    
    // 間違った音程の場合
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
      return semitoneDiff > 0 ? '少し高めに歌っています。' : '少し低めに歌っています。';
    }
    
    if (Math.abs(semitoneDiff) <= 2) {
      return '音程幅の調整が必要です。';
    }
    
    if (Math.abs(semitoneDiff) >= 6) {
      return 'オクターブ関係の可能性があります。';
    }
    
    return '音程の特徴を意識してみてください。';
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
    const masteryList = Object.entries(this.getAllMasteryData())
      .filter(([key, data]) => data.mastery.attempts >= 2)
      .sort((a, b) => a[1].mastery.averageAccuracy - b[1].mastery.averageAccuracy)
      .slice(0, limit);
    
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
    const masteryList = Object.entries(this.getAllMasteryData())
      .filter(([key, data]) => data.mastery.attempts >= 3)
      .sort((a, b) => b[1].mastery.averageAccuracy - a[1].mastery.averageAccuracy)
      .slice(0, limit);
    
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
    
    if (mastery.trend === 'improving') {
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
    
    if (mastery.trend === 'improving') {
      return `${interval.name}の理解が急速に向上しています。`;
    }
    
    return `${interval.name}の認識が安定しています。`;
  }
  
  /**
   * 習得度データの初期化
   */
  initializeMasteryData() {
    // 将来的にLocalStorageから読み込み予定
    // 現在はセッション内でのみ保持
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
      targetInterval: { name: '不明', key: 'unknown' },
      detectedInterval: { name: '不明', key: 'unknown' },
      accuracy: 0,
      mastery: { level: 'beginner', progress: 0 },
      masteryLevels: Object.fromEntries(this.masteryData), // EnhancedScoringEngine互換性のため追加
      isCorrectInterval: false,
      feedback: '音程分析でエラーが発生しました。',
      error: true
    };
  }
  
  /**
   * 詳細分析ログ出力
   * @param {Object} analysis - 分析結果
   */
  logAnalysisDetails(analysis) {
    console.group(`🎵 [IntervalAnalyzer] ${analysis.targetInterval.name}分析結果`);
    
    console.log('🎯 音程分析:', {
      目標: `${analysis.targetInterval.name} (${analysis.targetSemitones.toFixed(1)}セミトーン)`,
      検出: `${analysis.detectedInterval.name} (${analysis.detectedSemitones.toFixed(1)}セミトーン)`,
      正解: analysis.isCorrectInterval ? '✅' : '❌',
      精度: `${analysis.accuracy.toFixed(1)}%`
    });
    
    console.log('📊 習得状況:', {
      レベル: analysis.mastery.level,
      試行回数: analysis.mastery.attempts,
      平均精度: `${analysis.mastery.averageAccuracy?.toFixed(1) || 0}%`,
      進捗: `${analysis.mastery.progress}%`,
      トレンド: analysis.mastery.trend
    });
    
    console.log('💬 フィードバック:', analysis.feedback);
    
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
    
    this.log('🔄 IntervalAnalyzer リセット完了');
  }
}

// デバッグ用グローバル露出（開発時のみ）
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.IntervalAnalyzer = IntervalAnalyzer;
}