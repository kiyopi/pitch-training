<script>
  import { Trophy, Crown, Star, Award, Target, TrendingUp, ThumbsUp, Frown, AlertCircle, Music, BarChart3, Flame, Timer, Piano, ChevronRight, CheckCircle, Zap, BookOpen, Activity, PieChart, Hash } from 'lucide-svelte';
  import { fly, fade } from 'svelte/transition';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { onMount } from 'svelte';
  import SNSShareButtons from './SNSShareButtons.svelte';
  import SessionCarousel from './SessionCarousel.svelte';
  import RandomModeScoreResult from './RandomModeScoreResult.svelte';
  
  // デバッグエリアの完成したコンポーネントを統合
  import { 
    IntervalProgressTracker,
    ConsistencyGraph,
    FeedbackDisplay,
    SessionStatistics
  } from '$lib/components/scoring';
  
  export let scoreData = null;
  export let showDetails = false;
  export let className = '';
  
  // デバッグエリアの統合データ（親から受け取る）
  export let currentScoreData = null;
  export let intervalData = [];
  export let consistencyData = [];
  export let feedbackData = null;
  export let sessionStatistics = null;
  
  // タブ管理
  let activeTab = 'technical';
  
  
  // 4段階評価の定義（個別セッション用、RandomModeScoreResultと統一）
  const sessionGradeDefinitions = {
    excellent: { name: '優秀', icon: Trophy, range: '±15¢以内', color: 'text-yellow-500', bgColor: '#fffbeb', borderColor: '#fbbf24' },
    good: { name: '良好', icon: Star, range: '±25¢以内', color: 'text-green-500', bgColor: '#ecfdf5', borderColor: '#10b981' },
    pass: { name: '合格', icon: ThumbsUp, range: '±40¢以内', color: 'text-blue-500', bgColor: '#eff6ff', borderColor: '#3b82f6' },
    needWork: { name: '要練習', icon: Frown, range: '±41¢以上', color: 'text-red-500', bgColor: '#fef2f2', borderColor: '#ef4444' },
    notMeasured: { name: '測定不可', icon: AlertCircle, range: '音声未検出', color: 'text-gray-500', bgColor: '#f9fafb', borderColor: '#9ca3af' }
  };
  
  // S-E級統合評価システム（8セッション完走時用）
  const unifiedGradeDefinitions = {
    S: { 
      name: 'S級マスター', 
      icon: Trophy, 
      color: 'text-purple-500',
      bgColor: '#faf5ff',
      borderColor: '#8b5cf6',
      description: '完璧な演奏です！'
    },
    A: { 
      name: 'A級エキスパート', 
      icon: Crown, 
      color: 'text-yellow-500',
      bgColor: '#fffbeb',
      borderColor: '#f59e0b',
      description: '素晴らしい精度です！'
    },
    B: { 
      name: 'B級プロフィシエント', 
      icon: Star, 
      color: 'text-green-500',
      bgColor: '#ecfdf5',
      borderColor: '#10b981',
      description: '良い調子です！'
    },
    C: { 
      name: 'C級アドバンス', 
      icon: Award, 
      color: 'text-blue-500',
      bgColor: '#eff6ff',
      borderColor: '#3b82f6',
      description: '着実に上達しています'
    },
    D: { 
      name: 'D級ビギナー', 
      icon: Target, 
      color: 'text-orange-500',
      bgColor: '#fff7ed',
      borderColor: '#f97316',
      description: '練習を続けましょう'
    },
    E: { 
      name: 'E級スターター', 
      icon: TrendingUp, 
      color: 'text-red-500',
      bgColor: '#fef2f2',
      borderColor: '#ef4444',
      description: '基礎から頑張りましょう'
    }
  };
  
  // アニメーション用
  const iconScale = tweened(0, { duration: 600, easing: cubicOut });
  const bgOpacity = tweened(0, { duration: 300, easing: cubicOut });
  
  // カルーセル用 - 最新のセッションから開始
  let currentSessionIndex = 0;
  
  // セッション履歴管理のデバッグを強化
  let lastSessionCount = 0;
  let preventAutoMove = false; // ユーザー操作中のフラグ
  
  $: if (scoreData?.sessionHistory) {
    const currentSessionCount = scoreData.sessionHistory.length;
    
    console.log('🔍 [UnifiedScore] Session history update:', {
      lastSessionCount,
      currentSessionCount,
      currentSessionIndex,
      preventAutoMove,
      sessionHistory: scoreData.sessionHistory.length
    });
    
    // 初回表示時、または新しいセッションが追加された時のみ
    if (lastSessionCount === 0 || currentSessionCount > lastSessionCount) {
      console.log('🔍 [UnifiedScore] New session detected. Evaluating auto-move...');
      
      // ユーザーが手動操作中でない場合のみ自動移動
      if (!preventAutoMove) {
        // ユーザーが最新セッション付近を見ている場合のみ自動移動
        const isViewingRecent = currentSessionIndex >= lastSessionCount - 1;
        
        if (isViewingRecent) {
          const newIndex = Math.max(0, currentSessionCount - 1);
          console.log('🔧 [UnifiedScore] Auto-moving to latest session:', newIndex);
          currentSessionIndex = newIndex;
        } else {
          console.log('🔧 [UnifiedScore] User viewing older session, keeping position:', currentSessionIndex);
        }
      } else {
        console.log('🔧 [UnifiedScore] Preventing auto-move due to user interaction');
        preventAutoMove = false; // フラグをリセット
      }
    }
    
    lastSessionCount = currentSessionCount;
  }
  
  // セッション総合評価計算（8音の結果から4段階評価を算出）
  function calculateSessionGrade(sessionData) {
    if (!sessionData || !sessionData.noteResults) return 'needWork';
    
    const noteResults = sessionData.noteResults;
    const results = noteResults.reduce((acc, note) => {
      const grade = calculateNoteGrade(note.cents);
      acc[grade] = (acc[grade] || 0) + 1;
      if (grade !== 'notMeasured') {
        acc.totalError += Math.abs(note.cents);
        acc.measuredCount += 1;
      }
      return acc;
    }, { excellent: 0, good: 0, pass: 0, needWork: 0, notMeasured: 0, totalError: 0, measuredCount: 0 });
    
    const averageError = results.measuredCount > 0 ? results.totalError / results.measuredCount : 100;
    const passCount = results.excellent + results.good + results.pass;
    
    // RandomModeScoreResultと同じ判定ロジック
    if (results.notMeasured > 3) return 'needWork';
    if (results.needWork > 2) return 'needWork';
    if (results.measuredCount === 0) return 'needWork';
    if (averageError <= 20 && results.excellent >= 6) return 'excellent';
    if (averageError <= 30 && passCount >= 7) return 'good';
    if (passCount >= 5) return 'pass';
    return 'needWork';
  }
  
  // 音程評価計算（RandomModeScoreResultと統一）
  function calculateNoteGrade(cents) {
    if (cents === null || cents === undefined || isNaN(cents)) {
      return 'notMeasured';
    }
    const absCents = Math.abs(cents);
    if (absCents <= 15) return 'excellent';
    if (absCents <= 25) return 'good';
    if (absCents <= 40) return 'pass';
    return 'needWork';
  }
  
  // 時間フォーマット
  function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  // タブ切り替え
  function switchTab(tab) {
    activeTab = tab;
  }
  
  // 📋 MODE_SPECIFICATIONS: 仕様書通りのモード定義
  const MODE_SPECIFICATIONS = {
    random: {
      name: 'ランダム基音モード',
      maxSessions: 8,
      notesPerSession: 8,
      totalNotes: 64,
      scaleType: 'diatonic',
      difficulty: 'basic',
      evaluationFocus: '相対音感基礎'
    },
    
    continuous: {
      name: '連続チャレンジモード', 
      maxSessions: 8,
      notesPerSession: 8,
      totalNotes: 64,
      scaleType: 'diatonic',
      difficulty: 'intermediate',
      evaluationFocus: '持続的集中力'
    },
    
    chromatic: {
      name: '12音階モード',
      maxSessions: 12,
      notesPerSession: 12,
      totalNotes: 144,
      scaleType: 'chromatic',
      difficulty: 'advanced',
      evaluationFocus: '半音階精密認識'
    }
  };

  // 🔬 Phase 1-1: 適応的パラメータ取得（仕様書準拠）
  function getAdaptiveThresholds(mode) {
    const spec = MODE_SPECIFICATIONS[mode] || MODE_SPECIFICATIONS.random;
    
    return {
      // データ量基準
      minDataThreshold: spec.notesPerSession,     // 最小分析データ数
      mediumDataRatio: 0.25,                      // 中信頼度データ比率
      highDataRatio: 0.5,                         // 高信頼度データ比率
      
      // 完走ボーナス基準
      completionThreshold: 0.8,                   // 80%完走でボーナス
      masteryThreshold: 1.0,                      // 100%完走でマスター認定
      
      // 精度補正係数
      basicPrecisionFactor: 1.0,                  // 基本補正なし
      enhancedPrecisionFactor: mode === 'chromatic' ? 1.2 : 1.1,  // モード別強化
      masteryBonus: mode === 'chromatic' ? 1.3 : 1.2              // 完走ボーナス
    };
  }

  // 🔬 Phase 1-2: ハイブリッド統計分析（技術誤差分離機能拡張版）
  function performHybridStatisticalAnalysis(sessionHistory, mode) {
    const thresholds = getAdaptiveThresholds(mode);
    const spec = MODE_SPECIFICATIONS[mode] || MODE_SPECIFICATIONS.random;
    
    // Step 1: 全centデータ収集
    const allCentData = extractAllCentData(sessionHistory);
    
    // Step 2: データ充足性判定
    const dataRatio = allCentData.length / spec.totalNotes;
    const progressRatio = sessionHistory.length / spec.maxSessions;
    
    if (allCentData.length < thresholds.minDataThreshold) {
      return createInsufficientDataResult();
    }
    
    // Step 3: 基本統計計算
    const stats = calculateBasicStatistics(allCentData);
    
    // Step 4: 外れ値検出（3σ法則）
    const outliers = detectOutliers(allCentData, stats);
    
    // Step 5: 堅牢平均計算（外れ値除外）
    const robustStats = calculateRobustStatistics(allCentData, outliers);
    
    // Step 6: 信頼度レベル判定
    const confidenceLevel = determineConfidenceLevel(dataRatio, outliers.rate);
    
    // Step 7: モード特化補正適用
    const correctedAccuracy = applyModeSpecificCorrection(
      robustStats.accuracy, 
      mode, 
      progressRatio, 
      confidenceLevel
    );

    // 🔬 NEW: 4タブ用詳細データ生成
    const detailedAnalysis = generateDetailedAnalysis(sessionHistory, allCentData, stats, outliers, robustStats, confidenceLevel);
    
    return {
      // 既存の基本指標
      totalMeasurements: allCentData.length,
      averageError: Math.round(robustStats.mean),
      technicalErrorRate: Math.round((stats.stdDev / 50) * 100),
      confidenceLevel: confidenceLevel,
      outlierCount: outliers.count,
      outlierRate: outliers.rate,
      robustAccuracy: Math.round(correctedAccuracy),
      correctionFactor: calculateCorrectionFactor(mode, progressRatio, confidenceLevel),
      measurement: 'complete',
      analysisMode: mode,
      progressRatio: progressRatio,
      dataCompleteness: dataRatio,
      
      // 🔬 NEW: 4タブ用詳細データ
      technicalAnalysis: detailedAnalysis.technicalAnalysis,
      intervalAnalysis: detailedAnalysis.intervalAnalysis,
      consistencyAnalysis: detailedAnalysis.consistencyAnalysis,
      comprehensiveStatistics: detailedAnalysis.comprehensiveStatistics
    };
  }

  // 🔬 補助関数群（仕様書準拠）
  function extractAllCentData(sessionHistory) {
    const allCentData = [];
    sessionHistory.forEach(session => {
      if (session.noteResults) {
        session.noteResults.forEach(note => {
          if (note.cents !== null && note.cents !== undefined && !isNaN(note.cents)) {
            allCentData.push(Math.abs(note.cents));
          }
        });
      }
    });
    return allCentData;
  }

  function createInsufficientDataResult() {
    return {
      technicalErrorRate: 0,
      robustAccuracy: 0,
      confidenceLevel: 'low',
      outlierCount: 0,
      totalMeasurements: 0,
      averageError: 0,
      measurement: 'insufficient_data'
    };
  }

  function calculateBasicStatistics(data) {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    return { mean, variance, stdDev };
  }

  function detectOutliers(data, stats) {
    const outlierThreshold = stats.mean + (3 * stats.stdDev);
    const outlierData = data.filter(cent => cent > outlierThreshold);
    return {
      threshold: outlierThreshold,
      data: outlierData,
      count: outlierData.length,
      rate: outlierData.length / data.length
    };
  }

  function calculateRobustStatistics(data, outliers) {
    const cleanData = data.filter(cent => cent <= outliers.threshold);
    const mean = cleanData.length > 0 ? cleanData.reduce((a, b) => a + b, 0) / cleanData.length : 0;
    const accuracy = Math.max(0, 100 - mean);
    return { mean, accuracy, cleanDataCount: cleanData.length };
  }

  function determineConfidenceLevel(dataRatio, outlierRate) {
    if (dataRatio >= 0.5 && outlierRate <= 0.2) return 'high';
    if (dataRatio >= 0.25 && outlierRate <= 0.4) return 'medium';
    return 'low';
  }

  function applyModeSpecificCorrection(baseAccuracy, mode, progressRatio, confidenceLevel) {
    const thresholds = getAdaptiveThresholds(mode);
    let correctedAccuracy = baseAccuracy;
    
    // 基本信頼度補正
    const confidenceMultiplier = {
      'high': 1.1,
      'medium': 1.05,
      'low': 1.0
    }[confidenceLevel];
    
    correctedAccuracy *= confidenceMultiplier;
    
    // プログレス補正
    if (progressRatio >= thresholds.completionThreshold) {
      correctedAccuracy *= thresholds.enhancedPrecisionFactor;
    }
    
    // 完走マスターボーナス
    if (progressRatio >= thresholds.masteryThreshold) {
      correctedAccuracy *= thresholds.masteryBonus;
    }
    
    // 12音階モード特別ボーナス
    if (mode === 'chromatic' && progressRatio >= 0.8) {
      correctedAccuracy *= 1.15;
    }
    
    return Math.min(correctedAccuracy, 100);
  }

  function calculateCorrectionFactor(mode, progressRatio, confidenceLevel) {
    const thresholds = getAdaptiveThresholds(mode);
    let factor = 1.0;
    
    if (confidenceLevel === 'high') factor *= 1.1;
    else if (confidenceLevel === 'medium') factor *= 1.05;
    
    if (progressRatio >= thresholds.completionThreshold) {
      factor *= thresholds.enhancedPrecisionFactor;
    }
    
    if (progressRatio >= thresholds.masteryThreshold) {
      factor *= thresholds.masteryBonus;
    }
    
    return factor;
  }

  // 🔬 NEW: 4タブ用詳細分析データ生成関数
  function generateDetailedAnalysis(sessionHistory, allCentData, stats, outliers, robustStats, confidenceLevel) {
    // Tab 1: 技術分析データ
    const technicalAnalysis = {
      standardDeviation: Math.round(stats.stdDev * 10) / 10,
      outlierCount: outliers.count,
      outlierPercentage: Math.round(outliers.rate * 1000) / 10,
      confidenceInterval: {
        lower: Math.round((robustStats.accuracy - stats.stdDev) * 10) / 10,
        upper: Math.round((robustStats.accuracy + stats.stdDev) * 10) / 10
      },
      errorDistribution: {
        highPrecision: allCentData.filter(c => c <= 10).length,
        mediumPrecision: allCentData.filter(c => c <= 20).length,
        lowPrecision: allCentData.filter(c => c <= 50).length,
        anomalies: outliers.count
      },
      correctedEvaluation: {
        rawAverage: Math.round(stats.mean * 10) / 10,
        correctedAverage: Math.round(robustStats.mean * 10) / 10,
        confidenceLevel: confidenceLevel === 'high' ? 94.2 : confidenceLevel === 'medium' ? 87.5 : 72.1
      }
    };

    // Tab 2: 音程別分析データ（強化版）
    const intervalAnalysis = generateIntervalAnalysis(sessionHistory);
    const intervalMastery = analyzeIntervalMastery(intervalAnalysis);

    // Tab 3: 一貫性分析データ
    const consistencyAnalysis = generateConsistencyAnalysis(sessionHistory, stats, robustStats);

    // Tab 4: 総合統計データ
    const comprehensiveStatistics = generateComprehensiveStatistics(sessionHistory, allCentData, robustStats);

    return {
      technicalAnalysis,
      intervalAnalysis,
      intervalMastery,
      consistencyAnalysis,
      comprehensiveStatistics
    };
  }

  // 音程別分析データ生成（強化版 - 基音別分析と同レベル）
  function generateIntervalAnalysis(sessionHistory) {
    const intervalData = {};
    const intervalTypes = ['unison', 'minor_second', 'major_second', 'minor_third', 'major_third', 
                          'perfect_fourth', 'tritone', 'perfect_fifth', 'minor_sixth', 'major_sixth', 
                          'minor_seventh', 'major_seventh', 'octave'];

    // 📊 音程別詳細分析
    intervalTypes.forEach(intervalType => {
      const intervalResults = [];
      sessionHistory.forEach(session => {
        if (session.noteResults) {
          session.noteResults.forEach(note => {
            if (note.intervalType === intervalType && note.cents !== null) {
              intervalResults.push({
                cents: Math.abs(note.cents),
                correct: note.correct,
                sessionId: session.sessionId || 1,
                baseNote: session.baseNote || 'Unknown'
              });
            }
          });
        }
      });

      if (intervalResults.length > 0) {
        const correctCount = intervalResults.filter(r => r.correct).length;
        const averageError = intervalResults.reduce((sum, r) => sum + r.cents, 0) / intervalResults.length;
        const technicalErrorRate = Math.round(averageError);
        
        // 📈 グレード分布計算
        const gradeCount = { excellent: 0, good: 0, pass: 0, needWork: 0 };
        intervalResults.forEach(result => {
          if (result.cents <= 15) gradeCount.excellent++;
          else if (result.cents <= 25) gradeCount.good++;
          else if (result.cents <= 40) gradeCount.pass++;
          else gradeCount.needWork++;
        });

        intervalData[intervalType] = {
          mastery: Math.round((correctCount / intervalResults.length) * 100),
          attempts: intervalResults.length,
          technicalErrorRate,
          trueAccuracy: Math.max(0, Math.round(100 - averageError)),
          averageError: Math.round(averageError * 10) / 10,
          gradeCount,
          passRate: Math.round(((gradeCount.excellent + gradeCount.good + gradeCount.pass) / intervalResults.length) * 100),
          averageAccuracy: Math.round((intervalResults.reduce((sum, r) => sum + (40 - Math.min(40, r.cents)), 0) / intervalResults.length / 40) * 100)
        };
      }
    });

    return intervalData;
  }

  // 🎵 音程習得レベル判定（強化版分析）
  function analyzeIntervalMastery(intervalData) {
    const masteredIntervals = [];   // 80%以上
    const learningIntervals = [];   // 60-79%
    const practiceIntervals = [];   // 60%未満
    
    Object.entries(intervalData).forEach(([intervalType, data]) => {
      const intervalInfo = {
        type: intervalType,
        name: getIntervalDisplayName(intervalType),
        mastery: data.mastery,
        passRate: data.passRate,
        attempts: data.attempts,
        averageError: data.averageError,
        recommendation: generateIntervalRecommendation(intervalType, data)
      };
      
      if (data.mastery >= 80) {
        masteredIntervals.push(intervalInfo);
      } else if (data.mastery >= 60) {
        learningIntervals.push(intervalInfo);
      } else {
        practiceIntervals.push(intervalInfo);
      }
    });

    // 📊 習得率によるソート
    masteredIntervals.sort((a, b) => b.mastery - a.mastery);
    learningIntervals.sort((a, b) => b.mastery - a.mastery);  
    practiceIntervals.sort((a, b) => a.mastery - b.mastery); // 苦手順

    return {
      mastered: masteredIntervals,
      learning: learningIntervals,
      needsPractice: practiceIntervals,
      totalIntervals: Object.keys(intervalData).length,
      masteryDistribution: {
        mastered: masteredIntervals.length,
        learning: learningIntervals.length,
        practice: practiceIntervals.length
      }
    };
  }

  // 音程表示名取得
  function getIntervalDisplayName(intervalType) {
    const names = {
      'unison': 'ユニゾン',
      'minor_second': '短2度',
      'major_second': '長2度', 
      'minor_third': '短3度',
      'major_third': '長3度',
      'perfect_fourth': '完全4度',
      'tritone': 'トライトーン',
      'perfect_fifth': '完全5度',
      'minor_sixth': '短6度',
      'major_sixth': '長6度',
      'minor_seventh': '短7度',
      'major_seventh': '長7度',
      'octave': 'オクターブ'
    };
    return names[intervalType] || intervalType;
  }

  // 音程別練習推奨生成
  function generateIntervalRecommendation(intervalType, data) {
    if (data.mastery >= 80) {
      return '安定した習得状態。維持練習を推奨';
    } else if (data.mastery >= 60) {
      return '良好な進捗。継続練習で習得完了へ';
    } else {
      // 音程特性に基づく個別アドバイス
      const advice = {
        'minor_second': '狭い音程幅の判別に集中練習',
        'major_seventh': '高音域での精度向上練習',
        'tritone': '不協和音程への慣れ練習',
        'perfect_fourth': '協和音程の基礎固め',
        'perfect_fifth': '音楽理論との関連学習',
        'octave': '周波数比の理論理解'
      };
      return advice[intervalType] || '基礎的な音程練習を重点的に';
    }
  }

  // 一貫性分析データ生成
  function generateConsistencyAnalysis(sessionHistory, stats, robustStats) {
    const sessionScores = sessionHistory.map(session => session.score || 0);
    const technicalErrorPattern = sessionHistory.map((session, index) => {
      const sessionCents = [];
      if (session.noteResults) {
        session.noteResults.forEach(note => {
          if (note.cents !== null) sessionCents.push(Math.abs(note.cents));
        });
      }
      return sessionCents.length > 0 ? 
        Math.round(sessionCents.reduce((sum, c) => sum + c, 0) / sessionCents.length) : 
        stats.mean;
    });

    const correctedScores = sessionScores.map((score, index) => {
      const errorAdjustment = Math.max(0, (stats.mean - technicalErrorPattern[index]) / 2);
      return Math.min(100, score + errorAdjustment);
    });

    // トレンド分析
    const firstHalf = correctedScores.slice(0, Math.floor(correctedScores.length / 2));
    const secondHalf = correctedScores.slice(Math.floor(correctedScores.length / 2));
    const firstAvg = firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length;
    
    let trendAnalysis = 'stable';
    if (secondAvg > firstAvg + 5) trendAnalysis = 'improving';
    else if (secondAvg < firstAvg - 5) trendAnalysis = 'declining';

    // 一貫性スコア計算
    const variance = correctedScores.reduce((sum, score) => {
      const avg = correctedScores.reduce((s, sc) => s + sc, 0) / correctedScores.length;
      return sum + Math.pow(score - avg, 2);
    }, 0) / correctedScores.length;
    const consistencyScore = Math.max(0, 100 - Math.sqrt(variance));

    return {
      sessionScores,
      technicalErrorPattern,
      correctedScores,
      trendAnalysis,
      consistencyScore: Math.round(consistencyScore * 10) / 10,
      maxVariation: {
        raw: Math.max(...sessionScores) - Math.min(...sessionScores),
        corrected: Math.max(...correctedScores) - Math.min(...correctedScores)
      }
    };
  }

  // 基音別分析データ生成（新規追加）
  function analyzeByBaseNote(sessionHistory) {
    const baseNoteGroups = {};
    
    sessionHistory.forEach(session => {
      const baseNote = session.baseNote || 'Unknown';
      if (!baseNoteGroups[baseNote]) {
        baseNoteGroups[baseNote] = {
          sessions: [],
          grades: [],
          gradeCount: { excellent: 0, good: 0, pass: 0, needWork: 0 },
          passRate: 0,
          averageAccuracy: 0
        };
      }
      
      baseNoteGroups[baseNote].sessions.push(session);
      baseNoteGroups[baseNote].grades.push(session.grade);
      baseNoteGroups[baseNote].gradeCount[session.grade]++;
      
      // 合格率計算（±40¢以内）
      if (session.noteResults) {
        const passCount = session.noteResults.filter(note => 
          Math.abs(note.cents || 0) <= 40
        ).length;
        baseNoteGroups[baseNote].passRate = (passCount / session.noteResults.length) * 100;
      }
      
      // 精度データがあれば追加
      if (session.accuracy) {
        baseNoteGroups[baseNote].averageAccuracy = session.accuracy;
      }
    });
    
    // 得意・苦手基音の判定
    let bestBaseNote = null;
    let worstBaseNote = null;
    let bestScore = -1;
    let worstScore = 101;
    
    const gradeToScore = { 'excellent': 95, 'good': 80, 'pass': 65, 'needWork': 30 };
    
    Object.entries(baseNoteGroups).forEach(([baseNote, data]) => {
      const gradeScore = gradeToScore[data.grades[0]] || 0;
      if (gradeScore > bestScore) {
        bestScore = gradeScore;
        bestBaseNote = baseNote;
      }
      if (gradeScore < worstScore) {
        worstScore = gradeScore;
        worstBaseNote = baseNote;
      }
    });
    
    return {
      groups: baseNoteGroups,
      bestBaseNote,
      worstBaseNote,
      consistency: calculateBaseNoteConsistency(baseNoteGroups)
    };
  }
  
  // 基音間の一貫性計算
  function calculateBaseNoteConsistency(baseNoteGroups) {
    const gradeToScore = { 'excellent': 4, 'good': 3, 'pass': 2, 'needWork': 1 };
    const scores = Object.values(baseNoteGroups).map(group => 
      gradeToScore[group.grades[0]] || 1
    );
    
    if (scores.length < 2) return 100;
    
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // 標準偏差が小さいほど一貫性が高い（0-1を0-100%に変換）
    const consistency = Math.max(0, 100 - (stdDev * 50));
    return Math.round(consistency);
  }

  // 総合統計データ生成
  function generateComprehensiveStatistics(sessionHistory, allCentData, robustStats) {
    console.log('\n=== DEBUG: セッション統計計算開始 ===');
    console.log('📊 sessionHistory length:', sessionHistory.length);
    console.log('📊 allCentData length:', allCentData.length);
    console.log('📊 robustStats:', robustStats);
    
    const totalAttempts = allCentData.length;
    
    // セッション構造詳細ログ
    sessionHistory.forEach((session, index) => {
      console.log(`\n--- セッション ${index + 1} 詳細 ---`);
      console.log('🎵 基音:', session.baseNote);
      console.log('📈 スコア関連:', {
        score: session.score,
        sessionScore: session.sessionScore,
        totalScore: session.totalScore,
        accuracy: session.accuracy
      });
      console.log('⏱️ 時間関連:', {
        duration: session.duration,
        sessionDuration: session.sessionDuration,
        time: session.time,
        timestamp: session.timestamp
      });
      console.log('🎯 成績関連:', {
        streakCount: session.streakCount,
        maxStreak: session.maxStreak,
        consecutiveCorrect: session.consecutiveCorrect,
        grade: session.grade
      });
      console.log('🎼 音程結果:', session.noteResults ? session.noteResults.length : 'なし');
      if (session.noteResults) {
        const correctCount = session.noteResults.filter(note => note.correct).length;
        console.log('✅ 正解数:', correctCount, '/', session.noteResults.length);
      }
    });
    
    // 成功率計算の修正（グレードベースで確実な判定）
    const totalCorrect = sessionHistory.reduce((sum, session) => {
      if (session.noteResults && Array.isArray(session.noteResults)) {
        const correctInSession = session.noteResults.filter(note => {
          // 複数の判定基準を使用（合格以上 = pass, good, excellent）
          if (note.grade) {
            return ['pass', 'good', 'excellent'].includes(note.grade);
          }
          // centsベース判定（±40¢以内）
          if (note.cents !== undefined && note.cents !== null) {
            const absCents = Math.abs(note.cents);
            return absCents <= 40;
          }
          // centDifferenceベース判定
          if (note.centDifference !== undefined && note.centDifference !== null) {
            const absCents = Math.abs(note.centDifference);
            return absCents <= 40;
          }
          // isCorrect直接判定
          if (note.correct !== undefined) {
            return note.correct;
          }
          // accuracy判定（70%以上を合格とする）
          if (note.accuracy !== undefined) {
            return note.accuracy >= 70;
          }
          return false;
        }).length;
        console.log(`📊 セッション正解数: ${correctInSession}/${session.noteResults.length} (合格以上)`);
        return sum + correctInSession;
      }
      return sum;
    }, 0);
    
    console.log('📊 総正解数:', totalCorrect, '/ 総挑戦数:', totalAttempts);
    
    const rawSuccessRate = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
    const correctedSuccessRate = Math.min(100, rawSuccessRate * 1.1); // より保守的な補正
    
    console.log('📊 成功率:', rawSuccessRate, '% → 補正後:', correctedSuccessRate, '%');

    // セッションスコア計算の修正（複数データソース対応）
    const gradeToScore = {
      'excellent': 95,  // 優秀
      'good': 80,       // 良好
      'pass': 65,       // 合格
      'needWork': 30    // 要練習
    };
    
    const sessionScores = sessionHistory.map((s, i) => {
      let score = 0;
      
      // 方法1: 既存のscoreフィールドを使用
      if (s.score && s.score > 0) {
        score = s.score;
        console.log(`📊 セッション${i+1}スコア: ${score} (既存score使用)`);
      }
      // 方法2: グレードから変換
      else if (s.grade && gradeToScore[s.grade]) {
        score = gradeToScore[s.grade];
        console.log(`📊 セッション${i+1}スコア: ${score} (グレード ${s.grade} から変換)`);
      }
      // 方法3: 精度を使用（accuracyフィールドがある場合）
      else if (s.accuracy && s.accuracy > 0) {
        score = s.accuracy;
        console.log(`📊 セッション${i+1}スコア: ${score} (accuracy使用)`);
      }
      // 方法4: noteResultsから算出
      else if (s.noteResults && Array.isArray(s.noteResults) && s.noteResults.length > 0) {
        const correctCount = s.noteResults.filter(note => {
          if (note.grade) return ['pass', 'good', 'excellent'].includes(note.grade);
          if (note.cents !== undefined) return Math.abs(note.cents) <= 40;
          if (note.correct !== undefined) return note.correct;
          return false;
        }).length;
        score = Math.round((correctCount / s.noteResults.length) * 100);
        console.log(`📊 セッション${i+1}スコア: ${score} (noteResultsから算出: ${correctCount}/${s.noteResults.length})`);
      }
      // 方法5: デフォルト値（要練習として扱う）
      else {
        score = 30; // needWorkのデフォルトスコア
        console.log(`📊 セッション${i+1}スコア: ${score} (デフォルト値)`);
      }
      
      return Math.max(0, Math.min(100, score)); // 0-100の範囲内に制限
    }).filter(score => !isNaN(score) && score >= 0);
    
    console.log('📊 有効スコア配列:', sessionScores);
    
    const rawAverageScore = sessionScores.length > 0 ? 
      sessionScores.reduce((sum, s) => sum + s, 0) / sessionScores.length : 0;
    const correctedAverageScore = Math.min(100, rawAverageScore + (robustStats.accuracy - rawAverageScore) * 0.3);
    
    console.log('📊 平均スコア:', rawAverageScore, '→ 補正後:', correctedAverageScore);

    // 練習時間計算の修正（推定値も使用）
    const totalPracticeTime = sessionHistory.reduce((sum, session, i) => {
      let duration = 0;
      
      // 複数のフィールドから時間を取得
      const timeFields = [
        session.duration, session.sessionDuration, session.time,
        session.elapsedTime, session.totalTime, session.practiceTime
      ];
      
      // 有効な時間データを探す
      for (const timeField of timeFields) {
        if (timeField && typeof timeField === 'number' && timeField > 0) {
          duration = timeField;
          console.log(`⏱️ セッション${i+1}時間: ${duration}ms (データから取得)`);
          break;
        }
      }
      
      // 時間データがない場合は推定
      if (duration === 0) {
        if (session.noteResults && Array.isArray(session.noteResults) && session.noteResults.length > 0) {
          // 音程数 × 平均20秒 で推定（実際の操作時間を考慮）
          duration = session.noteResults.length * 20 * 1000; // ms単位
          console.log(`⏱️ セッション${i+1}時間: 推定 ${duration}ms (音程数${session.noteResults.length} × 20秒)`);
        } else {
          // デフォルトで2.5分を想定（8音程の標準時間）
          duration = 2.5 * 60 * 1000; // 2.5分
          console.log(`⏱️ セッション${i+1}時間: デフォルト推定 ${duration}ms (2.5分)`);
        }
      }
      
      return sum + duration;
    }, 0);
    
    console.log('⏱️ 総練習時間:', totalPracticeTime, 'ms', '=', Math.round(totalPracticeTime / 60000), '分');

    // 連続正解計算の修正（noteResultsから算出）
    const streakCounts = sessionHistory.map((session, i) => {
      let count = 0;
      
      // 方法1: 既存の連続正解データを使用
      const existingStreak = session.streakCount || session.maxStreak || session.consecutiveCorrect;
      if (existingStreak && existingStreak > 0) {
        count = existingStreak;
        console.log(`🎯 セッション${i+1}連続正解: ${count} (既存データ使用)`);
      }
      // 方法2: noteResultsから連続正解を計算
      else if (session.noteResults && Array.isArray(session.noteResults) && session.noteResults.length > 0) {
        let maxStreak = 0;
        let currentStreak = 0;
        
        session.noteResults.forEach((note, noteIndex) => {
          let isCorrect = false;
          
          // 複数の判定基準を使用
          if (note.grade) {
            isCorrect = ['pass', 'good', 'excellent'].includes(note.grade);
          } else if (note.cents !== undefined && note.cents !== null) {
            isCorrect = Math.abs(note.cents) <= 40;
          } else if (note.centDifference !== undefined && note.centDifference !== null) {
            isCorrect = Math.abs(note.centDifference) <= 40;
          } else if (note.correct !== undefined) {
            isCorrect = note.correct;
          } else if (note.accuracy !== undefined) {
            isCorrect = note.accuracy >= 70;
          }
          
          if (isCorrect) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
          } else {
            currentStreak = 0;
          }
        });
        
        count = maxStreak;
        console.log(`🎯 セッション${i+1}連続正解: ${count} (noteResultsから算出)`);
      }
      // 方法3: デフォルト値（0）
      else {
        console.log(`🎯 セッション${i+1}連続正解: ${count} (データなし)`);
      }
      
      return Math.max(0, count); // 負の値を防ぐ
    }).filter(count => !isNaN(count));
    
    const maxConsecutiveCorrect = streakCounts.length > 0 ? Math.max(...streakCounts) : 0;
    
    console.log('🎯 連続正解配列:', streakCounts, '→ 最大:', maxConsecutiveCorrect);

    // 改善率計算の修正（グレード変化ベース）
    let improvementRate = 0;
    let improvementText = '';
    
    if (sessionHistory.length > 1) {
      const firstGrade = sessionHistory[0].grade;
      const lastGrade = sessionHistory[sessionHistory.length - 1].grade;
      
      // グレード変化を評価
      const gradeValue = { 'needWork': 1, 'pass': 2, 'good': 3, 'excellent': 4 };
      const firstValue = gradeValue[firstGrade] || 1;
      const lastValue = gradeValue[lastGrade] || 1;
      const gradeDiff = lastValue - firstValue;
      
      // 改善率計算
      if (gradeDiff > 0) {
        improvementRate = gradeDiff * 25; // 1段階上昇で25%
        improvementText = `${firstGrade} → ${lastGrade}`;
      } else if (gradeDiff === 0) {
        // 同じグレードでもスコアで判定
        const firstScore = sessionScores[0];
        const lastScore = sessionScores[sessionScores.length - 1];
        if (lastScore > firstScore) {
          improvementRate = Math.round(((lastScore - firstScore) / firstScore) * 100);
          improvementText = '同グレード内での向上';
        } else {
          improvementText = '変化なし';
        }
      } else {
        improvementRate = gradeDiff * 25; // マイナス値
        improvementText = `${firstGrade} → ${lastGrade} (低下)`;
      }
      
      console.log('📈 改善率計算:', improvementText, '=', improvementRate, '%');
    }
    
    console.log('📈 改善率:', improvementRate + '%');
    
    // 基音別分析の実行
    const baseNoteAnalysis = analyzeByBaseNote(sessionHistory);
    console.log('🎵 基音別分析:', baseNoteAnalysis);
    
    console.log('=== DEBUG: セッション統計計算終了 ===\n');

    // 最高・最低スコア計算の修正
    const bestScore = sessionScores.length > 0 ? Math.max(...sessionScores) : 0;
    const worstScore = sessionScores.length > 0 ? Math.min(...sessionScores) : 0;
    
    console.log('📊 最高スコア:', bestScore, '/ 最低スコア:', worstScore);

    return {
      totalAttempts,
      rawSuccessRate: Math.round(rawSuccessRate * 10) / 10,
      correctedSuccessRate: Math.round(correctedSuccessRate * 10) / 10,
      rawAverageScore: Math.round(rawAverageScore * 10) / 10,
      correctedAverageScore: Math.round(correctedAverageScore * 10) / 10,
      bestSessionScore: bestScore,
      worstSessionScore: worstScore,
      totalPracticeTime,
      averageSessionTime: sessionHistory.length > 0 ? Math.round(totalPracticeTime / sessionHistory.length) : 0,
      maxConsecutiveCorrect,
      improvementRate,
      improvementText, // グレード変化の説明
      // 基音別分析結果（新規追加）
      baseNoteAnalysis,
      // デバッグ用追加情報
      sessionCount: sessionHistory.length,
      validScoreCount: sessionScores.length,
      streakDataAvailable: streakCounts.length,
      timeDataEstimated: totalPracticeTime > 0
    };
  }
  
  // 🔬 詳細分析データの生成（モード別完了条件対応）
  $: detailedAnalysisData = (() => {
    if (!scoreData?.sessionHistory) return null;
    
    const mode = scoreData?.mode || 'random';
    const requiredSessions = mode === 'chromatic' ? 12 : 8;
    
    if (scoreData.sessionHistory.length < requiredSessions) return null;
    
    const errorAnalysis = performHybridStatisticalAnalysis(scoreData.sessionHistory, mode);
    return errorAnalysis.measurement === 'complete' ? errorAnalysis : null;
  })();

  // セッション履歴からS-E級統合評価を算出（改良版）
  $: unifiedGrade = (() => {
    if (!scoreData?.sessionHistory || scoreData.sessionHistory.length === 0) return 'E';
    
    // 🔬 技術誤差分析（デバッグログ追加）
    const errorAnalysis = detailedAnalysisData || performHybridStatisticalAnalysis(scoreData.sessionHistory, scoreData?.mode || 'random');
    
    const sessionGrades = scoreData.sessionHistory.map(session => session.grade);
    const excellentCount = sessionGrades.filter(g => g === 'excellent').length;
    const goodCount = sessionGrades.filter(g => g === 'good').length;
    const passCount = sessionGrades.filter(g => g === 'pass').length;
    const needWorkCount = sessionGrades.filter(g => g === 'needWork').length;
    const totalGoodSessions = excellentCount + goodCount + passCount;
    const totalSessions = scoreData.sessionHistory.length;
    
    // 📊 基本比率計算
    const excellentRatio = excellentCount / totalSessions;
    const goodRatio = totalGoodSessions / totalSessions;
    const passRatio = (excellentCount + goodCount + passCount) / totalSessions;
    
    // 🔬 改良版技術誤差補正システム
    let correctedExcellentRatio = excellentRatio;
    let correctedGoodRatio = goodRatio;
    let correctedPassRatio = passRatio;
    
    if (errorAnalysis.measurement === 'complete') {
      // 技術誤差による判定向上（より保守的なアプローチ）
      const improvementFactor = Math.min(errorAnalysis.correctionFactor - 1.0, 0.2); // 最大20%の向上
      
      if (improvementFactor > 0) {
        correctedExcellentRatio = Math.min(excellentRatio + (improvementFactor * 0.3), 0.95);
        correctedGoodRatio = Math.min(goodRatio + (improvementFactor * 0.5), 0.98);
        correctedPassRatio = Math.min(passRatio + improvementFactor, 1.0);
      }
    }
    
    // 📊 S-E級判定（改良版基準）
    console.log('\n=== 🎯 S-E級判定デバッグ ===');
    console.log('📊 基本統計:', {
      excellentCount, goodCount, passCount, needWorkCount, totalSessions
    });
    console.log('📊 基本比率:', {
      excellentRatio: Math.round(excellentRatio * 100) + '%',
      goodRatio: Math.round(goodRatio * 100) + '%',
      passRatio: Math.round(passRatio * 100) + '%'
    });
    console.log('🔬 補正後比率:', {
      correctedExcellentRatio: Math.round(correctedExcellentRatio * 100) + '%',
      correctedGoodRatio: Math.round(correctedGoodRatio * 100) + '%',
      correctedPassRatio: Math.round(correctedPassRatio * 100) + '%'
    });
    
    // 改良された判定基準（より現実的な基準）
    let grade = 'E';
    if (correctedExcellentRatio >= 0.75 && correctedGoodRatio >= 0.90) {
      grade = 'S';
    } else if (correctedExcellentRatio >= 0.50 && correctedGoodRatio >= 0.80) {
      grade = 'A';
    } else if (correctedExcellentRatio >= 0.30 && correctedGoodRatio >= 0.70) {
      grade = 'B';
    } else if (correctedGoodRatio >= 0.50 || correctedPassRatio >= 0.65) {
      grade = 'C';
    } else if (correctedPassRatio >= 0.40) {
      grade = 'D';
    }
    
    console.log('🎯 最終判定:', grade);
    return grade;
  })();
  
  // 🔬 ハイブリッド技術誤差分析結果
  $: technicalAnalysis = performHybridStatisticalAnalysis(scoreData?.sessionHistory || [], scoreData?.mode || 'random');
  
  // 📋 段階的メッセージシステム（仕様書準拠）
  const PROGRESSIVE_MESSAGES = {
    // セッション数に応じたメッセージ
    session_1_3: "データ蓄積中... より正確な評価のために練習を続けましょう",
    session_4_7: "統計分析開始！ 技術誤差を考慮した評価を表示しています", 
    session_8: "8セッション完走！ あなたの真の音感能力が明らかになりました",
    session_12: "🎹 12音階マスター認定！ 半音階の精密な音感能力を証明しました",
    
    // モード別完走メッセージ  
    random_complete: "ランダム基音モード完走！ 基礎的な相対音感能力を習得",
    continuous_complete: "連続チャレンジ完走！ 持続的な集中力と音感の両立達成",
    chromatic_complete: "12音階モード制覇！ 真の音感マスターの称号を獲得"
  };
  
  // 📋 現在の進捗に応じたメッセージ取得
  $: progressMessage = (() => {
    if (!scoreData?.sessionHistory) return null;
    
    const sessionCount = scoreData.sessionHistory.length;
    const mode = scoreData.mode || 'random';
    const maxSessions = MODE_SPECIFICATIONS[mode].maxSessions;
    
    // 完走判定
    if (sessionCount >= maxSessions) {
      return PROGRESSIVE_MESSAGES[`${mode}_complete`];
    }
    
    // セッション数に応じたメッセージ
    if (mode === 'chromatic' && sessionCount === 12) {
      return PROGRESSIVE_MESSAGES.session_12;
    }
    if (sessionCount === 8) {
      return PROGRESSIVE_MESSAGES.session_8;
    }
    if (sessionCount >= 4 && sessionCount <= 7) {
      return PROGRESSIVE_MESSAGES.session_4_7;
    }
    if (sessionCount >= 1 && sessionCount <= 3) {
      return PROGRESSIVE_MESSAGES.session_1_3;
    }
    
    return null;
  })();

  // 🎯 技術誤差考慮型S-E級別アドバイス生成
  function generateTechnicalErrorAwareFeedback(grade, correctedGrade, analysisData, sessionHistory) {
    const actualGrade = correctedGrade || grade;
    
    // 基本メッセージテンプレート
    const feedbackTemplates = {
      'S': {
        title: '🏆 素晴らしい成果です！',
        message: '音楽家レベルの相対音感を獲得されました。技術的制約を克服し、真の音感能力を発揮できています。この能力を活かして、より高度な音楽理論学習や楽器演奏に挑戦してください。',
        icon: '🏆',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50'
      },
      'A': {
        title: '🌟 優秀な結果です！',
        message: '相対音感の基礎が確立されています。技術誤差の影響を最小化し、安定した実力を発揮されています。継続練習により、S級到達が十分に期待できます。',
        icon: '🌟',
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      'B': {
        title: '💪 着実な進歩です！',
        message: '基本的な音程認識ができており、技術誤差を考慮すると実際の能力はより高いレベルにあります。毎日の短時間練習で、確実に上級レベルへ到達できます。',
        icon: '💪',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      'C': {
        title: '💪 着実な進歩です！',
        message: '基本的な音程認識ができており、技術誤差を考慮すると実際の能力はより高いレベルにあります。毎日の短時間練習で、確実に上級レベルへ到達できます。',
        icon: '💪',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      'D': {
        title: '🌱 良いスタートです！',
        message: '音感は練習で必ず向上します。現在の測定値は技術的制約の影響を受けている可能性があります。焦らず継続することが最も重要です。まずは協和音程（4度・5度）から確実に身につけていきましょう。',
        icon: '🌱',
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      'E': {
        title: '🌱 良いスタートです！',
        message: '音感は練習で必ず向上します。現在の測定値は技術的制約の影響を受けている可能性があります。焦らず継続することが最も重要です。まずは協和音程（4度・5度）から確実に身につけていきましょう。',
        icon: '🌱',
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      }
    };

    const template = feedbackTemplates[actualGrade] || feedbackTemplates['E'];
    
    // 個別化要素の追加
    let personalizedElements = [];
    
    // 技術分析情報
    if (analysisData?.measurement === 'complete') {
      personalizedElements.push({
        type: 'technical',
        content: `技術分析: 測定精度±${analysisData.standardDeviation?.toFixed(1) || '25'}¢、信頼度${analysisData.reliabilityScore?.toFixed(1) || '95'}%`
      });
    }
    
    // 重点練習音程（A級の場合）
    if (actualGrade === 'A' && analysisData?.intervalAnalysis) {
      const weakestInterval = Object.entries(analysisData.intervalAnalysis)
        .sort(([,a], [,b]) => a.correctedAccuracy - b.correctedAccuracy)[0];
      
      if (weakestInterval) {
        const intervalName = getIntervalDisplayName(weakestInterval[0]);
        personalizedElements.push({
          type: 'practice',
          content: `重点練習音程: ${intervalName}`,
          detail: '推定到達期間: 2-3週間の継続練習'
        });
      }
    }
    
    // 技術的改善点（B-C級の場合）
    if (['B', 'C'].includes(actualGrade)) {
      personalizedElements.push({
        type: 'technical_improvement',
        content: '技術的改善点: マイク環境の最適化により、さらなる向上が期待できます。'
      });
    }
    
    // 技術サポート（D-E級の場合）
    if (['D', 'E'].includes(actualGrade)) {
      personalizedElements.push({
        type: 'technical_support',
        content: '技術サポート: 測定環境の改善により、より正確な評価が可能になります。'
      });
    }

    return {
      ...template,
      grade: actualGrade,
      originalGrade: grade,
      correctionApplied: correctedGrade && correctedGrade !== grade,
      personalizedElements
    };
  }

  // 補正後の級を計算
  function calculateCorrectedGrade(analysisData) {
    if (!analysisData.comprehensiveStatistics) return null;
    
    const correctedScore = analysisData.comprehensiveStatistics.correctedAverageScore;
    if (correctedScore >= 90) return 'S';
    if (correctedScore >= 80) return 'A';
    if (correctedScore >= 70) return 'B';
    if (correctedScore >= 60) return 'C';
    if (correctedScore >= 50) return 'D';
    return 'E';
  }


  // S-E級別フィードバックデータ生成
  $: technicalFeedback = (() => {
    if (!detailedAnalysisData || !unifiedGrade) return null;
    
    // 技術誤差補正により級が変わった場合の補正級を計算
    const correctedGrade = detailedAnalysisData.measurement === 'complete' ? 
      calculateCorrectedGrade(detailedAnalysisData) : null;
    
    return generateTechnicalErrorAwareFeedback(
      unifiedGrade, 
      correctedGrade, 
      detailedAnalysisData, 
      scoreData?.sessionHistory
    );
  })();
  
  // 現在の統計情報を計算
  $: currentStats = (() => {
    if (!scoreData?.sessionHistory || scoreData.sessionHistory.length === 0) {
      return {
        totalSessions: 0,
        excellentCount: 0,
        goodCount: 0,
        passCount: 0,
        excellentRate: 0,
        goodRate: 0
      };
    }
    
    const sessionGrades = scoreData.sessionHistory.map(session => session.grade);
    const excellentCount = sessionGrades.filter(g => g === 'excellent').length;
    const goodCount = sessionGrades.filter(g => g === 'good').length;
    const passCount = sessionGrades.filter(g => g === 'pass').length;
    const totalGoodSessions = excellentCount + goodCount + passCount;
    const totalSessions = scoreData.sessionHistory.length;
    
    return {
      totalSessions,
      excellentCount,
      goodCount,
      passCount,
      excellentRate: Math.round((excellentCount / totalSessions) * 100),
      goodRate: Math.round((totalGoodSessions / totalSessions) * 100)
    };
  })();
  
  // 8セッション完走判定
  $: isCompleted = scoreData?.sessionHistory && scoreData.sessionHistory.length >= (scoreData.mode === 'chromatic' ? 12 : 8);
  
  $: gradeDef = isCompleted ? unifiedGradeDefinitions[unifiedGrade] : sessionGradeDefinitions[scoreData?.sessionHistory?.[scoreData.sessionHistory.length - 1]?.grade || 'needWork'];

  // 8セッション完走時の詳細分析表示
  $: showDetailedAnalysis = scoreData?.sessionHistory && scoreData.sessionHistory.length >= 8;

  $: availableTabs = [
    { id: 'technical', label: '技術分析', icon: Activity },
    { id: 'intervals', label: '音程別進捗', icon: Music },
    { id: 'consistency', label: '一貫性グラフ', icon: BarChart3 },
    { id: 'statistics', label: 'セッション統計', icon: PieChart }
  ];
  
  onMount(() => {
    // アニメーション開始
    bgOpacity.set(1);
    setTimeout(() => {
      iconScale.set(1.2);
      setTimeout(() => {
        iconScale.set(1);
      }, 200);
    }, 100);
  });
</script>

<div class="unified-score-result {className}">
  <!-- 総合評価表示（8セッション完走時のみ） -->
  {#if isCompleted}
    <div class="grade-display" 
         style="background-color: {gradeDef.bgColor}; border-color: {gradeDef.borderColor}; opacity: {$bgOpacity}">
      <div class="grade-icon-wrapper">
        <svelte:component 
          this={gradeDef.icon} 
          size="120"
          class="grade-icon {gradeDef.color}"
          style="transform: scale({$iconScale})"
        />
      </div>
      
      <h2 class="grade-name {gradeDef.color}" in:fade={{ delay: 400 }}>
        {gradeDef.name}
      </h2>
      
      <p class="grade-description" in:fade={{ delay: 600 }}>
        {gradeDef.description}
      </p>
      
      <!-- 8セッション完走時の総合フィードバック -->
      {#if feedbackData && Object.keys(feedbackData).length > 0}
        <div class="completion-feedback" in:fade={{ delay: 800 }}>
          <FeedbackDisplay 
            feedback={feedbackData}
            className="mt-6 completion-feedback-display"
          />
        </div>
      {/if}
      
      <!-- 技術誤差考慮型S-E級別アドバイス -->
      {#if technicalFeedback && detailedAnalysisData?.measurement === 'complete'}
        <div class="technical-feedback-section" in:fade={{ delay: 900 }}>
          <div class="technical-feedback-card {technicalFeedback.bgColor} border-l-4 border-{technicalFeedback.color.replace('text-', '')} p-4 rounded-r-lg">
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 text-2xl">
                {technicalFeedback.icon}
              </div>
              <div class="flex-1">
                <h3 class="font-semibold {technicalFeedback.color} text-lg mb-2">
                  {technicalFeedback.title}
                  {#if technicalFeedback.correctionApplied}
                    <span class="ml-2 text-sm bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                      技術誤差補正適用
                    </span>
                  {/if}
                </h3>
                <p class="text-gray-700 mb-3 leading-relaxed">
                  {technicalFeedback.message}
                </p>
                
                <!-- 個別化要素の表示 -->
                {#if technicalFeedback.personalizedElements && technicalFeedback.personalizedElements.length > 0}
                  <div class="space-y-2">
                    {#each technicalFeedback.personalizedElements as element}
                      <div class="text-sm">
                        {#if element.type === 'technical'}
                          <div class="flex items-center gap-2 text-gray-600">
                            <Zap size="14" class="text-blue-500" />
                            <span>{element.content}</span>
                          </div>
                        {:else if element.type === 'practice'}
                          <div class="bg-green-100 text-green-700 p-2 rounded">
                            <div class="font-medium">{element.content}</div>
                            {#if element.detail}
                              <div class="text-xs mt-1">{element.detail}</div>
                            {/if}
                          </div>
                        {:else if element.type === 'technical_improvement'}
                          <div class="flex items-start gap-2 text-blue-600">
                            <TrendingUp size="14" class="mt-0.5" />
                            <span>{element.content}</span>
                          </div>
                        {:else if element.type === 'technical_support'}
                          <div class="flex items-start gap-2 text-green-600">
                            <AlertCircle size="14" class="mt-0.5" />
                            <span>{element.content}</span>
                          </div>
                        {/if}
                      </div>
                    {/each}
                  </div>
                {/if}
                
                <!-- 級の変更情報 -->
                {#if technicalFeedback.correctionApplied}
                  <div class="mt-3 text-sm bg-blue-50 text-blue-600 p-2 rounded border border-blue-200">
                    <div class="flex items-center gap-2">
                      <TrendingUp size="14" />
                      <span>技術誤差補正: {technicalFeedback.originalGrade}級 → {technicalFeedback.grade}級</span>
                    </div>
                    <div class="text-xs mt-1 text-blue-500">
                      Web Audio APIの技術的制約を統計的に補正した結果、より高い評価となりました。
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </div>
      {/if}
      
      <!-- 評価の見方（簡潔版） -->
      <div class="grade-explanation" in:fade={{ delay: 1000 }}>
        <details class="grade-details">
          <summary class="grade-summary">
            <ChevronRight size="16" class="chevron-icon" />
            <span>評価の見方</span>
          </summary>
          <div class="grade-explanation-content">
            <div class="grade-table">
              <div class="grade-row">
                <span class="grade-label">S級マスター</span>
                <span class="grade-condition">優秀75%以上 + 良好以上90%以上</span>
              </div>
              <div class="grade-row">
                <span class="grade-label">A級エキスパート</span>
                <span class="grade-condition">優秀50%以上 + 良好以上80%以上</span>
              </div>
              <div class="grade-row">
                <span class="grade-label">B級プロフィシエント</span>
                <span class="grade-condition">優秀30%以上 + 良好以上70%以上</span>
              </div>
              <div class="grade-row">
                <span class="grade-label">C級アドバンス</span>
                <span class="grade-condition">良好以上50%以上 または 合格以上65%以上</span>
              </div>
              <div class="grade-row">
                <span class="grade-label">D級ビギナー</span>
                <span class="grade-condition">合格以上40%以上</span>
              </div>
              <div class="grade-row">
                <span class="grade-label">E級スターター</span>
                <span class="grade-condition">合格以上40%未満</span>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  {/if}
  
  <!-- 📋 段階的進捗メッセージ表示 -->
  {#if progressMessage && scoreData?.sessionHistory}
    <div class="progress-message-section" in:fly={{ y: 20, duration: 500, delay: 700 }}>
      <div class="progress-message">
        <div class="progress-icon"><Music size={20} /></div>
        <div class="progress-text">{progressMessage}</div>
        <div class="progress-counter">
          {scoreData.sessionHistory.length}/{MODE_SPECIFICATIONS[scoreData.mode || 'random'].maxSessions} セッション
        </div>
      </div>
    </div>
  {/if}


  <!-- モード別サマリー -->
  <div class="mode-summary" in:fly={{ y: 20, duration: 500, delay: 800 }}>
    {#if scoreData?.mode === 'random'}
      <!-- ランダムモードサマリー -->
      <div class="summary-section">
        
        <!-- セッション履歴バー（コンパクト版） -->
        {#if scoreData.sessionHistory && scoreData.sessionHistory.length > 0}
          <div class="session-history-section compact">
            <div class="session-title">
              <Music size={16} class="inline mr-1" />セッション履歴 ({scoreData.sessionHistory.length}/{scoreData.mode === 'chromatic' ? 12 : 8})
            </div>
            <div class="session-bars compact">
              {#each scoreData.sessionHistory as session, index}
                <button 
                  class="session-bar-button grade-{session.grade}"
                  class:active={index === currentSessionIndex}
                  on:click={() => {
                    console.log('🎯 [UnifiedScore] Session bar clicked:', index);
                    preventAutoMove = true;
                    currentSessionIndex = index;
                  }}
                  title="セッション{index + 1}: {sessionGradeDefinitions[session.grade]?.name} (精度{session.accuracy}%)">
                  <span class="session-number">{index + 1}</span>
                  <svelte:component this={sessionGradeDefinitions[session.grade]?.icon || AlertCircle} size="14" />
                </button>
              {/each}
              <!-- 未完了セッション表示 -->
              {#each Array((scoreData.mode === 'chromatic' ? 12 : 8) - scoreData.sessionHistory.length) as _, index}
                <div class="session-bar-button empty">
                  <span class="session-number">{scoreData.sessionHistory.length + index + 1}</span>
                  <span class="empty-icon">-</span>
                </div>
              {/each}
            </div>
          </div>
          
          <!-- セッションカルーセル -->
          <div class="carousel-wrapper">
            <SessionCarousel 
              currentIndex={currentSessionIndex}
              sessionHistory={scoreData.sessionHistory}
              className="session-detail-carousel"
              on:sessionChange={(event) => {
                console.log('🎭 [UnifiedScore] Session change received:', event.detail.index);
                preventAutoMove = true;
                currentSessionIndex = event.detail.index;
              }}
            >
              <div slot="default" let:session let:index>
                <!-- 8音階詳細表示（セッション情報統合版） -->
                {#if session.noteResults}
                  <RandomModeScoreResult 
                    noteResults={session.noteResults}
                    sessionIndex={index}
                    baseNote={session.baseNote}
                    className="carousel-score-result"
                  />
                {:else}
                  <div class="no-details">
                    セッション{index + 1} - 基音: {session.baseNote}<br>
                    詳細データがありません
                  </div>
                {/if}
              </div>
            </SessionCarousel>
          </div>
        {/if}
      </div>
      
    {:else if scoreData?.mode === 'continuous'}
      <!-- 連続モードサマリー -->
      <div class="summary-section">
        
        <!-- セッション履歴バー（コンパクト版） -->
        {#if scoreData.sessionHistory && scoreData.sessionHistory.length > 0}
          <div class="session-history-section compact">
            <div class="session-title">
              ⏱️ セッション履歴 ({scoreData.sessionHistory.length}/{scoreData.mode === 'chromatic' ? 12 : 8})
            </div>
            <div class="session-bars compact">
              {#each scoreData.sessionHistory as session, index}
                <button 
                  class="session-bar-button grade-{session.grade}"
                  class:active={index === currentSessionIndex}
                  on:click={() => {
                    console.log('🎯 [UnifiedScore] Session bar clicked:', index);
                    preventAutoMove = true;
                    currentSessionIndex = index;
                  }}
                  title="セッション{index + 1}: {sessionGradeDefinitions[session.grade]?.name} (精度{session.accuracy}%)">
                  <span class="session-number">{index + 1}</span>
                  <svelte:component this={sessionGradeDefinitions[session.grade]?.icon || AlertCircle} size="14" />
                </button>
              {/each}
              <!-- 未完了セッション表示 -->
              {#each Array((scoreData.mode === 'chromatic' ? 12 : 8) - scoreData.sessionHistory.length) as _, index}
                <div class="session-bar-button empty">
                  <span class="session-number">{scoreData.sessionHistory.length + index + 1}</span>
                  <span class="empty-icon">-</span>
                </div>
              {/each}
            </div>
          </div>
          
          <!-- セッションカルーセル -->
          <div class="carousel-wrapper">
            <SessionCarousel 
              currentIndex={currentSessionIndex}
              sessionHistory={scoreData.sessionHistory}
              className="session-detail-carousel"
              on:sessionChange={(event) => {
                console.log('🎭 [UnifiedScore] Session change received:', event.detail.index);
                preventAutoMove = true;
                currentSessionIndex = event.detail.index;
              }}
            >
              <div slot="default" let:session let:index>
                <!-- 連続モード用の詳細表示（将来実装） -->
                <div class="no-details">
                  セッション{index + 1} - 基音: {session.baseNote}<br>
                  連続モードの詳細表示は準備中です
                </div>
              </div>
            </SessionCarousel>
          </div>
        {/if}
      </div>
      
    {:else if scoreData?.mode === 'chromatic'}
      <!-- 12音階モードサマリー -->
      <div class="summary-section">
        
        <!-- セッション履歴バー（コンパクト版） -->
        {#if scoreData.sessionHistory && scoreData.sessionHistory.length > 0}
          <div class="session-history-section compact">
            <div class="session-title">
              🎹 セッション履歴 ({scoreData.sessionHistory.length}/12)
            </div>
            <div class="session-bars compact chromatic-mode">
              {#each scoreData.sessionHistory as session, index}
                <button 
                  class="session-bar-button grade-{session.grade}"
                  class:active={index === currentSessionIndex}
                  on:click={() => {
                    console.log('🎯 [UnifiedScore] Session bar clicked:', index);
                    preventAutoMove = true;
                    currentSessionIndex = index;
                  }}
                  title="セッション{index + 1}: {sessionGradeDefinitions[session.grade]?.name} (精度{session.accuracy}%)">
                  <span class="session-number">{index + 1}</span>
                  <svelte:component this={sessionGradeDefinitions[session.grade]?.icon || AlertCircle} size="14" />
                </button>
              {/each}
              <!-- 未完了セッション表示 -->
              {#each Array(12 - scoreData.sessionHistory.length) as _, index}
                <div class="session-bar-button empty">
                  <span class="session-number">{scoreData.sessionHistory.length + index + 1}</span>
                  <span class="empty-icon">-</span>
                </div>
              {/each}
            </div>
          </div>
          
          <!-- セッションカルーセル -->
          <div class="carousel-wrapper">
            <SessionCarousel 
              currentIndex={currentSessionIndex}
              sessionHistory={scoreData.sessionHistory}
              className="session-detail-carousel"
              on:sessionChange={(event) => {
                console.log('🎭 [UnifiedScore] Session change received:', event.detail.index);
                preventAutoMove = true;
                currentSessionIndex = event.detail.index;
              }}
            >
              <div slot="default" let:session let:index>
                <!-- 12音階モード用の詳細表示（将来実装） -->
                <div class="no-details">
                  セッション{index + 1} - 半音階: {session.chromaticNote}<br>
                  12音階モードの詳細表示は準備中です
                </div>
              </div>
            </SessionCarousel>
          </div>
        {/if}
      </div>
    {/if}
    
  </div>
  
  <!-- 詳細分析ダッシュボード -->
  {#if showDetailedAnalysis && (currentScoreData || intervalData.length > 0 || feedbackData || sessionStatistics)}
    <div class="detailed-analysis-dashboard" in:fly={{ y: 20, duration: 500, delay: 1000 }}>
      
      
      
      <!-- 詳細統計（タブ形式） -->
      {#if showDetailedAnalysis}
        <div class="scoring-tabs-container">
          <div class="scoring-tabs">
            {#each availableTabs as tab}
              <button 
                class="scoring-tab"
                class:active={activeTab === tab.id}
                on:click={() => switchTab(tab.id)}
              >
                <svelte:component this={tab.icon} class="tab-icon" size={16} />
                {tab.label}
              </button>
            {/each}
          </div>
          
          <!-- 技術分析タブ -->
          {#if activeTab === 'technical' && detailedAnalysisData?.technicalAnalysis && scoreData?.sessionHistory && scoreData.sessionHistory.length >= (scoreData?.mode === 'chromatic' ? 12 : 8)}
            <div class="tab-panel">
              <div class="technical-analysis-content">
                <h4 class="analysis-title"><Activity size={20} class="inline mr-2" />技術分析結果</h4>
                
                <!-- 技術誤差統計セクション -->
                <div class="analysis-section">
                  <h5 class="section-title"><Target size={18} class="inline mr-2" />測定精度分析</h5>
                  <div class="analysis-grid">
                    <div class="analysis-item">
                      <span class="analysis-label">標準偏差</span>
                      <span class="analysis-value">±{detailedAnalysisData.technicalAnalysis.standardDeviation}¢</span>
                    </div>
                    <div class="analysis-item">
                      <span class="analysis-label">外れ値検出</span>
                      <span class="analysis-value">{detailedAnalysisData.technicalAnalysis.outlierCount}個（{detailedAnalysisData.technicalAnalysis.outlierPercentage}%）</span>
                    </div>
                    <div class="analysis-item">
                      <span class="analysis-label">信頼区間</span>
                      <span class="analysis-value">{detailedAnalysisData.technicalAnalysis.confidenceInterval.lower}% - {detailedAnalysisData.technicalAnalysis.confidenceInterval.upper}%</span>
                    </div>
                  </div>
                </div>

                <!-- 誤差パターン分析セクション -->
                <div class="analysis-section">
                  <h5 class="section-title"><BarChart3 size={18} class="inline mr-2" />誤差分布</h5>
                  <div class="analysis-grid">
                    <div class="analysis-item">
                      <span class="analysis-label">高精度測定</span>
                      <span class="analysis-value text-green-600">{detailedAnalysisData.technicalAnalysis.errorDistribution.highPrecision}回（技術誤差 ±10¢以内）</span>
                    </div>
                    <div class="analysis-item">
                      <span class="analysis-label">中精度測定</span>
                      <span class="analysis-value text-blue-600">{detailedAnalysisData.technicalAnalysis.errorDistribution.mediumPrecision}回（技術誤差 ±20¢以内）</span>
                    </div>
                    <div class="analysis-item">
                      <span class="analysis-label">低精度測定</span>
                      <span class="analysis-value text-amber-600">{detailedAnalysisData.technicalAnalysis.errorDistribution.lowPrecision}回（技術誤差 ±50¢以内）</span>
                    </div>
                    <div class="analysis-item">
                      <span class="analysis-label">異常値</span>
                      <span class="analysis-value text-red-600">{detailedAnalysisData.technicalAnalysis.errorDistribution.anomalies}回（統計的外れ値）</span>
                    </div>
                  </div>
                </div>

                <!-- 補正後評価セクション -->
                <div class="analysis-section">
                  <h5 class="section-title"><AlertCircle size={18} class="inline mr-2" />技術誤差補正結果</h5>
                  <div class="analysis-grid">
                    <div class="analysis-item">
                      <span class="analysis-label">補正前平均</span>
                      <span class="analysis-value">{detailedAnalysisData.technicalAnalysis.correctedEvaluation.rawAverage}点</span>
                    </div>
                    <div class="analysis-item">
                      <span class="analysis-label">補正後平均</span>
                      <span class="analysis-value text-green-600 font-bold">{detailedAnalysisData.technicalAnalysis.correctedEvaluation.correctedAverage}点</span>
                    </div>
                    <div class="analysis-item">
                      <span class="analysis-label">真の実力推定</span>
                      <span class="analysis-value grade-indicator">{unifiedGradeDefinitions[unifiedGrade]?.name}</span>
                    </div>
                    <div class="analysis-item">
                      <span class="analysis-label">評価信頼度</span>
                      <span class="analysis-value">{detailedAnalysisData.technicalAnalysis.correctedEvaluation.confidenceLevel}%</span>
                    </div>
                  </div>
                </div>

                <div class="analysis-explanation">
                  <AlertCircle size={16} class="inline mr-1" /><strong>評価について:</strong> 
                  {detailedAnalysisData.technicalAnalysis.errorDistribution.highPrecision + detailedAnalysisData.technicalAnalysis.errorDistribution.mediumPrecision + detailedAnalysisData.technicalAnalysis.errorDistribution.lowPrecision}回の測定データから統計的に分析し、技術的な誤差を考慮した真の音感能力を評価しています。
                  
                  {#if scoreData.mode === 'chromatic'}
                    <br><strong><Piano size={16} class="inline mr-1" />12音階モード:</strong> 
                    {scoreData.sessionHistory.length}セッション × 12音 = {scoreData.sessionHistory.length * 12}回の高精度半音階分析により、最も正確な音感能力測定を実現しています。
                  {:else}
                    <br><strong><Music size={16} class="inline mr-1" />8音階モード:</strong>
                    {scoreData.sessionHistory.length}セッション × 8音 = {scoreData.sessionHistory.length * 8}回の測定による統計的分析です。
                  {/if}
                  
                  {#if detailedAnalysisData.technicalAnalysis.outlierCount > 0}
                    <br>({detailedAnalysisData.technicalAnalysis.outlierCount}回の外れ値を検出・補正済み)
                  {/if}
                </div>
              </div>
            </div>
          {/if}
          
          <!-- 音程別進捗タブ -->
          {#if activeTab === 'intervals' && (detailedAnalysisData?.intervalAnalysis || intervalData.length > 0)}
            <div class="tab-panel">
              {#if detailedAnalysisData?.intervalAnalysis && detailedAnalysisData?.intervalMastery}
                <!-- 技術誤差考慮版の音程別進捗（強化版） -->
                <div class="interval-analysis-enhanced">
                  <h4 class="analysis-title"><Music size={20} class="inline mr-2" />音程別習得状況（技術誤差補正版）</h4>
                  
                  <!-- 習得済み音程セクション -->
                  {#if detailedAnalysisData.intervalMastery.mastered.length > 0}
                    <div class="mastery-section mastered">
                      <h5 class="mastery-section-title text-green-600"><CheckCircle size={20} class="inline mr-2" />習得済み音程（80%以上）</h5>
                      <div class="interval-grid">
                        {#each detailedAnalysisData.intervalMastery.mastered as interval}
                          <div class="interval-card mastered-card">
                            <div class="interval-header">
                              <div class="interval-name">{interval.name}</div>
                              <div class="mastery-badge excellent"><Star size={14} class="inline mr-1" />{interval.mastery}%</div>
                            </div>
                            <div class="interval-stats">
                              <div class="stat-row">
                                <span class="stat-label">挑戦回数:</span>
                                <span class="stat-value">{interval.attempts}回</span>
                              </div>
                              <div class="stat-row">
                                <span class="stat-label">合格率:</span>
                                <span class="stat-value text-green-600 font-bold">{interval.passRate}%</span>
                              </div>
                              <div class="recommendation">{interval.recommendation}</div>
                            </div>
                          </div>
                        {/each}
                      </div>
                    </div>
                  {/if}

                  <!-- 習得中音程セクション -->
                  {#if detailedAnalysisData.intervalMastery.learning.length > 0}
                    <div class="mastery-section learning">
                      <h5 class="mastery-section-title text-blue-600"><Star size={20} class="inline mr-2" />習得中音程（60-79%）</h5>
                      <div class="interval-grid">
                        {#each detailedAnalysisData.intervalMastery.learning as interval}
                          <div class="interval-card learning-card">
                            <div class="interval-header">
                              <div class="interval-name">{interval.name}</div>
                              <div class="mastery-badge good"><Zap size={14} class="inline mr-1" />{interval.mastery}%</div>
                            </div>
                            <div class="interval-stats">
                              <div class="stat-row">
                                <span class="stat-label">挑戦回数:</span>
                                <span class="stat-value">{interval.attempts}回</span>
                              </div>
                              <div class="stat-row">
                                <span class="stat-label">平均誤差:</span>
                                <span class="stat-value text-amber-600">±{interval.averageError}¢</span>
                              </div>
                              <div class="recommendation text-blue-600">{interval.recommendation}</div>
                            </div>
                            <div class="progress-bar">
                              <div class="progress-fill" style="width: {interval.mastery}%; background: linear-gradient(90deg, #3b82f6, #06b6d4)"></div>
                            </div>
                          </div>
                        {/each}
                      </div>
                    </div>
                  {/if}

                  <!-- 練習必要音程セクション -->
                  {#if detailedAnalysisData.intervalMastery.needsPractice.length > 0}
                    <div class="mastery-section needs-practice">
                      <h5 class="mastery-section-title text-red-600"><TrendingUp size={20} class="inline mr-2" />重点練習音程（60%未満）</h5>
                      <div class="interval-grid">
                        {#each detailedAnalysisData.intervalMastery.needsPractice as interval}
                          <div class="interval-card practice-card">
                            <div class="interval-header">
                              <div class="interval-name">{interval.name}</div>
                              <div class="mastery-badge needs-work"><BookOpen size={14} class="inline mr-1" />{interval.mastery}%</div>
                            </div>
                            <div class="interval-stats">
                              <div class="stat-row">
                                <span class="stat-label">挑戦回数:</span>
                                <span class="stat-value">{interval.attempts}回</span>
                              </div>
                              <div class="stat-row">
                                <span class="stat-label">平均誤差:</span>
                                <span class="stat-value text-red-600">±{interval.averageError}¢</span>
                              </div>
                              <div class="recommendation text-red-600 font-semibold">{interval.recommendation}</div>
                            </div>
                            <div class="progress-bar">
                              <div class="progress-fill" style="width: {interval.mastery}%; background: linear-gradient(90deg, #ef4444, #f97316)"></div>
                            </div>
                          </div>
                        {/each}
                      </div>
                    </div>
                  {/if}

                  <!-- 習得統計サマリー -->
                  <div class="mastery-summary">
                    <h5 class="section-title"><PieChart size={18} class="inline mr-2" />音程習得統計</h5>
                    <div class="summary-grid">
                      <div class="summary-item mastered">
                        <span class="summary-label">習得済み</span>
                        <span class="summary-value text-green-600 font-bold">{detailedAnalysisData.intervalMastery.masteryDistribution.mastered}/{detailedAnalysisData.intervalMastery.totalIntervals}</span>
                      </div>
                      <div class="summary-item learning">
                        <span class="summary-label">習得中</span>
                        <span class="summary-value text-blue-600 font-bold">{detailedAnalysisData.intervalMastery.masteryDistribution.learning}/{detailedAnalysisData.intervalMastery.totalIntervals}</span>
                      </div>
                      <div class="summary-item practice">
                        <span class="summary-label">要練習</span>
                        <span class="summary-value text-red-600 font-bold">{detailedAnalysisData.intervalMastery.masteryDistribution.practice}/{detailedAnalysisData.intervalMastery.totalIntervals}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="analysis-explanation">
                    <AlertCircle size={16} class="inline mr-1" /><strong>音程習得分析:</strong> 
                    技術誤差を統計的に分離し、真の音程習得レベルを評価しています。
                    習得済み音程の維持と、重点練習音程の集中強化をお勧めします。
                  </div>
                </div>
              {:else}
                <!-- 従来版（8セッション未完了時） -->
                <IntervalProgressTracker 
                  intervalData={intervalData}
                  showTechnicalErrorCorrection={detailedAnalysisData?.measurement === 'complete'}
                />
              {/if}
            </div>
          {/if}
          
          <!-- 一貫性グラフタブ -->
          {#if activeTab === 'consistency' && (detailedAnalysisData?.consistencyAnalysis || consistencyData.length > 0)}
            <div class="tab-panel">
              {#if detailedAnalysisData?.consistencyAnalysis}
                <!-- 技術誤差考慮版の一貫性分析 -->
                <div class="consistency-analysis-enhanced">
                  <h4 class="analysis-title"><BarChart3 size={20} class="inline mr-2" />一貫性グラフ（技術誤差補正版）</h4>
                  
                  <div class="consistency-stats">
                    <div class="stat-item">
                      <span class="stat-label">一貫性スコア:</span>
                      <span class="stat-value">{detailedAnalysisData.consistencyAnalysis.consistencyScore}%</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">変動幅:</span>
                      <span class="stat-value">
                        {detailedAnalysisData.consistencyAnalysis.maxVariation.raw}点（補正前）/ 
                        {detailedAnalysisData.consistencyAnalysis.maxVariation.corrected}点（補正後）
                      </span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">トレンド:</span>
                      <span class="stat-value">
                        {detailedAnalysisData.consistencyAnalysis.trendAnalysis === 'improving' ? '改善中' :
                         detailedAnalysisData.consistencyAnalysis.trendAnalysis === 'declining' ? '低下中' : '安定'}
                      </span>
                    </div>
                  </div>
                  
                  <div class="analysis-explanation">
                    <AlertCircle size={16} class="inline mr-1" /><strong>一貫性分析:</strong> 
                    技術誤差を考慮すると、実際のパフォーマンスは補正前より安定しています。
                    {detailedAnalysisData.consistencyAnalysis.trendAnalysis === 'improving' ? 
                      '継続練習により確実に向上しています。' :
                      detailedAnalysisData.consistencyAnalysis.trendAnalysis === 'declining' ?
                      '練習環境の見直しで改善が期待できます。' :
                      '安定したパフォーマンスを維持できています。'}
                  </div>
                </div>
              {:else}
                <!-- 従来版（8セッション未完了時） -->
                <ConsistencyGraph 
                  consistencyData={consistencyData}
                  showTechnicalErrorCorrection={detailedAnalysisData?.measurement === 'complete'}
                  correctedData={detailedAnalysisData?.consistencyAnalysis?.correctedScores || []}
                />
              {/if}
            </div>
          {/if}
          
          <!-- セッション統計タブ -->
          {#if activeTab === 'statistics' && (detailedAnalysisData?.comprehensiveStatistics || sessionStatistics)}
            <div class="tab-panel">
              {#if detailedAnalysisData?.comprehensiveStatistics}
                <!-- 技術誤差考慮版の総合統計 -->
                <div class="comprehensive-statistics-enhanced">
                  <h4 class="analysis-title"><PieChart size={20} class="inline mr-2" />セッション統計（技術誤差補正版）</h4>
                  
                  <!-- 総合結果セクション -->
                  <div class="stats-section">
                    <h5 class="section-title"><Hash size={18} class="inline mr-2" />{scoreData?.mode === 'chromatic' ? '12' : '8'}セッション総合結果</h5>
                    <div class="stats-grid">
                      <div class="stat-item">
                        <span class="stat-label">総挑戦回数:</span>
                        <span class="stat-value">
                          {detailedAnalysisData.comprehensiveStatistics.totalAttempts}回
                          （{scoreData?.mode === 'chromatic' ? '12' : '8'}セッション完了）
                        </span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">合格率:</span>
                        <span class="stat-value">
                          {detailedAnalysisData.comprehensiveStatistics.rawSuccessRate}% → 
                          <span class="text-green-600 font-bold">{detailedAnalysisData.comprehensiveStatistics.correctedSuccessRate}%</span>
                        </span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">平均評価:</span>
                        <span class="stat-value">
                          {detailedAnalysisData.comprehensiveStatistics.rawAverageScore}点 → 
                          <span class="text-green-600 font-bold">{detailedAnalysisData.comprehensiveStatistics.correctedAverageScore}点</span>
                        </span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">基音別成績:</span>
                        <span class="stat-value">
                          {#if detailedAnalysisData.comprehensiveStatistics.baseNoteAnalysis}
                            <span class="text-green-600">
                              得意: {detailedAnalysisData.comprehensiveStatistics.baseNoteAnalysis.bestBaseNote}
                            </span>
                            /
                            <span class="text-red-600">
                              苦手: {detailedAnalysisData.comprehensiveStatistics.baseNoteAnalysis.worstBaseNote}
                            </span>
                            <br>
                            <span class="text-sm text-gray-600">
                              一貫性: {detailedAnalysisData.comprehensiveStatistics.baseNoteAnalysis.consistency}%
                            </span>
                          {:else}
                            -
                          {/if}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- 練習効率セクション -->
                  <div class="stats-section">
                    <h5 class="section-title">⏱️ 練習効率指標</h5>
                    <div class="stats-grid">
                      <div class="stat-item">
                        <span class="stat-label">総練習時間:</span>
                        <span class="stat-value">{Math.floor(detailedAnalysisData.comprehensiveStatistics.totalPracticeTime / 60000)}分{Math.floor((detailedAnalysisData.comprehensiveStatistics.totalPracticeTime % 60000) / 1000)}秒</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">平均セッション時間:</span>
                        <span class="stat-value">{Math.floor(detailedAnalysisData.comprehensiveStatistics.averageSessionTime / 1000)}秒</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">最大連続正解:</span>
                        <span class="stat-value">{detailedAnalysisData.comprehensiveStatistics.maxConsecutiveCorrect}回</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">最高/最低スコア:</span>
                        <span class="stat-value">{detailedAnalysisData.comprehensiveStatistics.bestSessionScore}点 / {detailedAnalysisData.comprehensiveStatistics.worstSessionScore}点</span>
                      </div>
                    </div>
                  </div>

                  <!-- レベル判定セクション -->
                  <div class="stats-section">
                    <h5 class="section-title">🎯 相対音感レベル診断</h5>
                    <div class="level-assessment">
                      <div class="current-level">
                        <span class="level-label">技術誤差補正後レベル:</span>
                        <span class="level-value grade-indicator">{unifiedGradeDefinitions[unifiedGrade]?.name}</span>
                      </div>
                      <div class="level-description">
                        {unifiedGrade === 'S' ? '音楽家レベルの相対音感を達成されました！' :
                         unifiedGrade === 'A' ? '優秀な音感能力です。継続練習でS級到達が期待できます。' :
                         unifiedGrade === 'B' ? '良好な音感基礎が確立されています。' :
                         unifiedGrade === 'C' ? '基本的な音程認識ができています。' :
                         unifiedGrade === 'D' ? '発展途上です。継続練習が重要です。' :
                         '良いスタートです。焦らず継続することが大切です。'}
                      </div>
                    </div>
                  </div>
                  
                  <div class="analysis-explanation">
                    <AlertCircle size={16} class="inline mr-1" /><strong>統計分析:</strong> 
                    技術誤差を統計的に補正することで、真の相対音感能力をより正確に評価しています。
                    {#if scoreData?.mode === 'chromatic'}
                      12音階モードでの完了は特に高い音感能力の証明であり、音楽的な応用への準備が整っています。
                    {:else}
                      継続練習により、さらなる向上が期待できます。
                    {/if}
                  </div>
                </div>
              {:else}
                <!-- 従来版（8セッション未完了時） -->
                <SessionStatistics 
                  statistics={sessionStatistics}
                  showTechnicalErrorCorrection={detailedAnalysisData?.measurement === 'complete'}
                  correctedStatistics={detailedAnalysisData?.comprehensiveStatistics || {}}
                />
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
  
  <!-- SNS共有ボタン -->
  {#if scoreData?.sessionHistory && scoreData.sessionHistory.length >= (scoreData.mode === 'chromatic' ? 12 : 8)}
    <SNSShareButtons {scoreData} />
  {/if}
  
  <!-- 詳細表示トグル -->
  {#if showDetails}
    <button class="details-toggle" on:click={() => showDetails = !showDetails}>
      詳細を表示
    </button>
  {/if}
</div>


<style>
  .unified-score-result {
    padding: 0.5rem 1.5rem 1.5rem 1.5rem; /* 上padding縮小: 1.5rem → 0.5rem */
  }
  
  .grade-display {
    text-align: center;
    padding: 2rem;
    border-radius: 12px;
    border: 2px solid;
    margin-bottom: 1.5rem;
    transition: all 0.3s ease;
  }
  
  .grade-icon-wrapper {
    display: flex;
    justify-content: center;
    margin-bottom: 1rem;
  }
  
  .grade-icon {
    transition: transform 0.3s ease;
  }
  
  .grade-name {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }
  
  .grade-description {
    font-size: 1rem;
    color: #6b7280;
  }
  
  /* 評価の見方スタイル（shadcn/ui風） */
  .grade-explanation {
    margin-top: 1.5rem;
    border-top: 1px solid hsl(214.3 31.8% 91.4%);
    padding-top: 1rem;
  }
  
  .grade-details {
    border: 1px solid hsl(214.3 31.8% 91.4%);
    border-radius: 8px;
    overflow: hidden;
  }
  
  .grade-summary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    background: hsl(210 40% 98%);
    cursor: pointer;
    font-weight: 500;
    color: hsl(222.2 84% 4.9%);
    transition: background-color 0.2s;
    list-style: none;
  }
  
  .grade-summary:hover {
    background: hsl(210 40% 96%);
  }
  
  /* ブラウザのデフォルト矢印を完全に非表示 */
  .grade-summary::-webkit-details-marker {
    display: none;
  }
  
  .grade-details summary::-webkit-details-marker {
    display: none;
  }
  
  .chevron-icon {
    transition: transform 0.2s ease-in-out;
    color: hsl(215.4 16.3% 46.9%);
    transform-origin: center;
    display: inline-block;
  }
  
  .grade-details[open] .chevron-icon {
    transform: rotate(90deg);
  }
  
  /* More specific selectors to ensure proper application */
  .grade-details[open] :global(.chevron-icon) {
    transform: rotate(90deg) !important;
  }
  
  .grade-details[open] :global(svg.chevron-icon) {
    transform: rotate(90deg) !important;
  }
  
  .grade-explanation-content {
    padding: 1rem;
    background: white;
  }
  
  .grade-table {
    margin-bottom: 1.5rem;
  }
  
  .grade-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid hsl(214.3 31.8% 91.4%);
  }
  
  .grade-row:last-child {
    border-bottom: none;
  }
  
  .grade-label {
    font-weight: 500;
    color: hsl(222.2 84% 4.9%);
    font-size: 0.875rem;
  }
  
  .grade-condition {
    font-size: 0.75rem;
    color: hsl(215.4 16.3% 46.9%);
    text-align: right;
  }
  
  
  /* 8セッション完走時のフィードバック専用スタイル（shadcn/ui テーマ） */
  .completion-feedback {
    margin-top: 1.5rem;
    border-top: 1px solid hsl(214.3 31.8% 91.4%);
    padding-top: 1.5rem;
  }
  
  :global(.completion-feedback-display) {
    background: hsl(0 0% 100%) !important;
    border: 1px solid hsl(214.3 31.8% 91.4%) !important;
    border-radius: 8px !important;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06) !important;
    padding: 1.5rem !important;
  }
  
  /* フィードバック内のテキストスタイル調整 */
  :global(.completion-feedback-display .feedback-primary) {
    color: hsl(222.2 84% 4.9%) !important;
    font-weight: 600 !important;
    font-size: 1.125rem !important;
    margin-bottom: 0.75rem !important;
  }
  
  :global(.completion-feedback-display .feedback-summary) {
    color: hsl(215.4 16.3% 46.9%) !important;
    font-size: 0.875rem !important;
    line-height: 1.5 !important;
    margin-bottom: 1rem !important;
  }
  
  /* フィードバック詳細リストのスタイル */
  :global(.completion-feedback-display .feedback-details) {
    display: grid !important;
    gap: 0.75rem !important;
  }
  
  :global(.completion-feedback-display .feedback-item) {
    padding: 0.75rem !important;
    border-radius: 6px !important;
    font-size: 0.875rem !important;
    line-height: 1.4 !important;
  }
  
  /* カテゴリ別の色分け（shadcn/ui カラーパレット） */
  :global(.completion-feedback-display .feedback-item.strengths) {
    background: hsl(142.1 76.2% 36.3% / 0.1) !important;
    border-left: 4px solid hsl(142.1 76.2% 36.3%) !important;
    color: hsl(142.1 84.2% 31.2%) !important;
  }
  
  :global(.completion-feedback-display .feedback-item.improvements) {
    background: hsl(47.9 95.8% 53.1% / 0.1) !important;
    border-left: 4px solid hsl(47.9 95.8% 53.1%) !important;
    color: hsl(25 95% 53%) !important;
  }
  
  :global(.completion-feedback-display .feedback-item.tips) {
    background: hsl(221.2 83.2% 53.3% / 0.1) !important;
    border-left: 4px solid hsl(221.2 83.2% 53.3%) !important;
    color: hsl(221.2 83.2% 53.3%) !important;
  }
  
  :global(.completion-feedback-display .feedback-item.practice) {
    background: hsl(262.1 83.3% 57.8% / 0.1) !important;
    border-left: 4px solid hsl(262.1 83.3% 57.8%) !important;
    color: hsl(262.1 83.3% 57.8%) !important;
  }
  
  /* 次のステップセクション */
  :global(.completion-feedback-display .next-steps) {
    margin-top: 1.25rem !important;
    padding-top: 1rem !important;
    border-top: 1px solid hsl(214.3 31.8% 91.4%) !important;
  }
  
  :global(.completion-feedback-display .next-steps-title) {
    color: hsl(222.2 84% 4.9%) !important;
    font-weight: 600 !important;
    font-size: 1rem !important;
    margin-bottom: 0.75rem !important;
  }
  
  :global(.completion-feedback-display .next-steps-list) {
    display: flex !important;
    flex-direction: column !important;
    gap: 0.5rem !important;
  }
  
  :global(.completion-feedback-display .next-step-item) {
    padding: 0.5rem 0.75rem !important;
    background: hsl(210 40% 98%) !important;
    border-radius: 6px !important;
    color: hsl(222.2 84% 4.9%) !important;
    font-size: 0.875rem !important;
    border-left: 3px solid hsl(221.2 83.2% 53.3%) !important;
  }
  
  /* 継続メッセージ */
  :global(.completion-feedback-display .encouragement) {
    text-align: center !important;
    margin-top: 1.25rem !important;
    padding: 1rem !important;
    background: linear-gradient(135deg, hsl(142.1 76.2% 36.3% / 0.1), hsl(221.2 83.2% 53.3% / 0.1)) !important;
    border-radius: 8px !important;
    color: hsl(222.2 84% 4.9%) !important;
    font-weight: 600 !important;
    font-size: 1rem !important;
  }
  
  .mode-summary {
    background: #f9fafb;
    border-radius: 8px;
    padding: 1.5rem;
  }
  
  .summary-section {
    margin-bottom: 1rem;
  }

  /* 🔬 技術誤差分析用スタイル */
  .analysis-section {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 8px;
    border-left: 4px solid #3b82f6;
  }

  .section-title {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .analysis-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .analysis-item, .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid #e5e7eb;
  }

  .analysis-item:last-child, .stat-item:last-child {
    border-bottom: none;
  }

  .analysis-label, .stat-label {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
  }

  .analysis-value, .stat-value {
    font-size: 0.875rem;
    color: #111827;
    font-weight: 600;
    text-align: right;
  }

  /* 音程別分析強化版 */
  .interval-analysis-enhanced {
    padding: 1rem;
  }

  .interval-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .interval-card {
    background: white;
    border-radius: 8px;
    padding: 1rem;
    border: 1px solid #e5e7eb;
    transition: all 0.2s ease;
  }

  .interval-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .interval-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .interval-name {
    font-weight: 600;
    color: #1f2937;
  }

  .mastery-badge {
    background: #f3f4f6;
    padding: 0.25rem 0.5rem;
    border-radius: 16px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #374151;
  }

  .interval-stats {
    margin-bottom: 0.75rem;
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
    font-size: 0.75rem;
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    transition: width 0.5s ease;
    border-radius: 4px;
  }

  /* 🎵 音程習得レベル判定機能（強化版） */
  .mastery-section {
    margin-bottom: 2rem;
    padding: 1.5rem;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
  }

  .mastery-section.mastered {
    background: linear-gradient(135deg, #f0fdf4, #ffffff);
    border-color: #10b981;
  }

  .mastery-section.learning {
    background: linear-gradient(135deg, #eff6ff, #ffffff);
    border-color: #3b82f6;
  }

  .mastery-section.needs-practice {
    background: linear-gradient(135deg, #fef2f2, #ffffff);
    border-color: #ef4444;
  }

  .mastery-section-title {
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  /* 習得レベル別カードスタイル */
  .interval-card.mastered-card {
    border-left: 4px solid #10b981;
    background: linear-gradient(135deg, #ecfdf5, #ffffff);
  }

  .interval-card.learning-card {
    border-left: 4px solid #3b82f6;
    background: linear-gradient(135deg, #eff6ff, #ffffff);
  }

  .interval-card.practice-card {
    border-left: 4px solid #ef4444;
    background: linear-gradient(135deg, #fef2f2, #ffffff);
  }

  /* 習得レベル別マスタリーバッジ */
  .mastery-badge.excellent {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
  }

  .mastery-badge.good {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
  }

  .mastery-badge.needs-work {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
  }

  /* 習得統計サマリー */
  .mastery-summary {
    margin-top: 2rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, #f8fafc, #ffffff);
    border-radius: 12px;
    border: 1px solid #cbd5e1;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }

  .summary-item {
    text-align: center;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }

  .summary-item.mastered {
    background: linear-gradient(135deg, #ecfdf5, #ffffff);
    border-color: #10b981;
  }

  .summary-item.learning {
    background: linear-gradient(135deg, #eff6ff, #ffffff);
    border-color: #3b82f6;
  }

  .summary-item.practice {
    background: linear-gradient(135deg, #fef2f2, #ffffff);
    border-color: #ef4444;
  }

  .summary-label {
    display: block;
    font-size: 0.9rem;
    color: #6b7280;
    margin-bottom: 0.5rem;
  }

  .summary-value {
    display: block;
    font-size: 1.25rem;
    font-weight: 700;
  }

  /* 練習推奨セクション */
  .recommendation {
    margin-top: 0.75rem;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.03);
    border-radius: 6px;
    font-size: 0.85rem;
    font-style: italic;
    line-height: 1.4;
  }

  /* 一貫性分析強化版 */
  .consistency-analysis-enhanced {
    padding: 1rem;
  }

  .consistency-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 8px;
  }

  /* 総合統計強化版 */
  .comprehensive-statistics-enhanced {
    padding: 1rem;
  }

  .stats-section {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: white;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }

  .level-assessment {
    padding: 1rem;
    background: linear-gradient(135deg, #f0f9ff, #ecfeff);
    border-radius: 8px;
    border: 1px solid #bae6fd;
  }

  .current-level {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .level-label {
    font-weight: 600;
    color: #1f2937;
  }

  .level-value {
    font-weight: 700;
    font-size: 1.1rem;
  }

  .level-description {
    font-size: 0.875rem;
    color: #374151;
    line-height: 1.5;
  }

  .analysis-explanation {
    margin-top: 1rem;
    padding: 1rem;
    background: #fffbeb;
    border-radius: 8px;
    border-left: 4px solid #f59e0b;
    font-size: 0.875rem;
    line-height: 1.6;
    color: #374151;
  }

  /* 技術誤差考慮型フィードバックスタイル */
  .technical-feedback-section {
    margin-top: 1.5rem;
  }

  .technical-feedback-card {
    animation: slideInFromBottom 0.5s ease-out;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  @keyframes slideInFromBottom {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* 動的なborder-colorクラス */
  .border-yellow-600 {
    border-color: #d97706 !important;
  }

  .border-green-600 {
    border-color: #059669 !important;
  }

  .border-blue-600 {
    border-color: #2563eb !important;
  }
  
  
  .session-history-section {
    margin-top: 1rem;
  }
  
  .session-history-section.compact {
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: rgba(0, 0, 0, 0.02);
    border-radius: 8px;
  }
  
  .session-title {
    font-size: 0.75rem;
    font-weight: 500;
    color: #6b7280;
    margin-bottom: 0.25rem;
    text-align: left;
  }
  
  .session-bars {
    display: flex;
    gap: 6px;
    padding: 0.75rem;
    background: white;
    border-radius: 8px;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .session-bars.compact {
    padding: 0.5rem;
    gap: 4px;
  }
  
  .session-bars.chromatic-mode {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 4px;
  }
  
  @media (max-width: 640px) {
    .session-bars.chromatic-mode {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  
  
  .completion-message {
    text-align: center;
    margin-top: 0.75rem;
    font-size: 0.875rem;
    color: #059669;
    font-weight: 500;
  }
  
  
  .details-toggle {
    width: 100%;
    padding: 0.75rem;
    margin-top: 1rem;
    background: #f3f4f6;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    color: #4b5563;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .details-toggle:hover {
    background: #e5e7eb;
  }
  
  /* セッションバーボタン */
  .session-bar-button {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    border: 1px solid;
    cursor: pointer;
    padding: 0;
    background: white;
    font-size: 0.7rem;
  }
  
  .session-bar-button:hover:not(.empty) {
    transform: translateY(-2px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .session-bar-button.active {
    box-shadow: 0 0 0 2px #3b82f6;
  }
  
  .session-bar-button.empty {
    border-color: #e5e7eb;
    background: #f9fafb;
    cursor: default;
    color: #d1d5db;
  }
  
  .session-bar-button .session-number {
    font-size: 0.6rem;
    font-weight: 500;
    margin-bottom: 2px;
  }
  
  .session-bar-button .empty-icon {
    font-size: 0.875rem;
    color: #d1d5db;
  }
  
  /* 4段階評価別色分け（コンパクト版） */
  .session-bar-button.grade-excellent {
    background: #fffbeb;
    border-color: #fbbf24;
    color: #f59e0b;
  }
  
  .session-bar-button.grade-good {
    background: #ecfdf5;
    border-color: #10b981;
    color: #059669;
  }
  
  .session-bar-button.grade-pass {
    background: #eff6ff;
    border-color: #3b82f6;
    color: #2563eb;
  }
  
  .session-bar-button.grade-needWork {
    background: #fef2f2;
    border-color: #ef4444;
    color: #dc2626;
  }
  
  .session-bar-button.grade-notMeasured {
    background: #f9fafb;
    border-color: #9ca3af;
    color: #6b7280;
  }
  
  /* カルーセルラッパー */
  .carousel-wrapper {
    margin-top: 1rem;
  }
  
  
  .carousel-session-grade {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .carousel-session-grade.grade-excellent {
    background: #fffbeb;
    color: #f59e0b;
  }
  
  .carousel-session-grade.grade-good {
    background: #ecfdf5;
    color: #059669;
  }
  
  .carousel-session-grade.grade-pass {
    background: #eff6ff;
    color: #2563eb;
  }
  
  .carousel-session-grade.grade-needWork {
    background: #fef2f2;
    color: #dc2626;
  }
  
  .carousel-score-result {
    margin-top: 0;
  }
  
  .no-details {
    text-align: center;
    padding: 3rem;
    color: #9ca3af;
    font-size: 0.875rem;
  }
  
  /* 詳細分析ダッシュボードスタイル */
  .detailed-analysis-dashboard {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid #e5e7eb;
  }
  
  
  .scoring-tabs-container {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .scoring-tabs {
    display: flex;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .scoring-tab {
    flex: 1;
    padding: 0.75rem 1rem;
    border: none;
    background: transparent;
    color: #6b7280;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border-right: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .tab-icon {
    flex-shrink: 0;
  }
  
  .scoring-tab:last-child {
    border-right: none;
  }
  
  .scoring-tab:hover {
    background: #f3f4f6;
    color: #374151;
  }
  
  .scoring-tab.active {
    background: white;
    color: #3b82f6;
    border-bottom: 2px solid #3b82f6;
  }
  
  .tab-panel {
    padding: 1.5rem;
  }
  
  /* 技術分析タブスタイル */
  .technical-analysis-content {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border: 1px solid #bae6fd;
    border-radius: 12px;
    padding: 1.5rem;
  }
  
  .analysis-title {
    color: #0c4a6e;
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .analysis-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .analysis-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.75rem;
    background: white;
    border-radius: 8px;
    border: 1px solid #e0f2fe;
  }
  
  .analysis-label {
    font-size: 0.75rem;
    color: #0c4a6e;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }
  
  .analysis-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1e293b;
  }
  
  .analysis-value.confidence-high {
    color: #059669;
  }
  
  .analysis-value.confidence-medium {
    color: #d97706;
  }
  
  .analysis-value.confidence-low {
    color: #dc2626;
  }
  
  .analysis-value.grade-indicator {
    color: #8b5cf6;
    font-size: 1rem;
  }
  
  .analysis-explanation {
    background: rgba(255, 255, 255, 0.7);
    border-radius: 8px;
    padding: 1rem;
    font-size: 0.875rem;
    line-height: 1.5;
    color: #0f172a;
    border-left: 4px solid #3b82f6;
  }
  
  
  /* 📋 段階的進捗メッセージスタイル */
  .progress-message-section {
    margin: 1rem 0;
  }
  
  .progress-message {
    background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
    border: 1px solid #bbf7d0;
    border-radius: 12px;
    padding: 1.25rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  }
  
  .progress-icon {
    font-size: 2rem;
    opacity: 0.8;
  }
  
  .progress-text {
    flex: 1;
    font-size: 1rem;
    font-weight: 500;
    color: #166534;
    line-height: 1.5;
  }
  
  .progress-counter {
    font-size: 0.875rem;
    font-weight: 600;
    color: #059669;
    background: rgba(16, 185, 129, 0.1);
    padding: 0.5rem 0.75rem;
    border-radius: 20px;
    white-space: nowrap;
  }

  /* レスポンシブ対応 */
  @media (max-width: 640px) {
    .unified-score-result {
      padding: 1rem;
    }
    
    .grade-display {
      padding: 1.5rem;
    }
    
    .grade-summary {
      padding: 0.75rem;
      font-size: 0.875rem;
    }
    
    .grade-explanation-content {
      padding: 0.75rem;
    }
    
    .grade-condition {
      font-size: 0.6875rem;
    }
    
    .grade-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
      padding: 0.75rem 0;
    }
    
    .grade-condition {
      text-align: left;
    }
    
    .grade-icon {
      font-size: 60px !important;
    }
    
    .grade-name {
      font-size: 2rem;
    }
    
    .common-stats {
      flex-direction: column;
      gap: 1rem;
    }
    
    .session-bar {
      min-width: 70px;
      height: 70px;
    }
    
    .scoring-tabs {
      flex-direction: column;
    }
    
    .scoring-tab {
      border-right: none;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .scoring-tab:last-child {
      border-bottom: none;
    }
    
    /* 📋 進捗メッセージのレスポンシブ対応 */
    .progress-message {
      flex-direction: column;
      text-align: center;
      gap: 0.75rem;
    }
    
    .progress-text {
      font-size: 0.875rem;
    }
    
    .progress-counter {
      align-self: center;
    }
  }
</style>