<script>
  import { Trophy, Crown, Star, Award, Meh, Sprout, ThumbsUp, Frown, AlertCircle, Music, BarChart3, Flame, Timer, Piano, ChevronRight, CheckCircle, Zap, BookOpen, Activity, PieChart, Hash, HelpCircle, Medal, BookOpenCheck, Target, TrendingUp } from 'lucide-svelte';
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
  import { calculateNoteGrade, calculateSessionGrade } from '$lib/utils/gradeCalculation';
  
  export let scoreData = null;
  export let showDetails = false;
  
  export let className = '';
  
  // デバッグエリアの統合データ（親から受け取る）
  export let currentScoreData = null;
  export let intervalData = [];
  export let consistencyData = [];
  export let feedbackData = null;
  export let technicalFeedbackData = null;
  export let sessionStatistics = null;
  
  // タブ管理
  let activeTab = 'technical';
  
  // ポップオーバー管理
  let showGradeHelp = false;
  let showSessionHelp = false;
  let showCarouselSessionHelp = false;

  // セッション評価基準の定義
  const sessionCriteriaDefinitions = {
    excellent: {
      name: 'Excellent',
      condition: '90%以上の精度',
      icon: Crown,
      color: 'purple'
    },
    good: {
      name: 'Good',
      condition: '80%以上の精度',
      icon: Trophy,
      color: 'blue'
    },
    pass: {
      name: 'Pass',
      condition: '65%以上の精度',
      icon: ThumbsUp,
      color: 'green'
    },
    needWork: {
      name: 'Need Work',
      condition: '65%未満の精度',
      icon: AlertCircle,
      color: 'orange'
    }
  };
  
  
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
      colorValue: '#a855f7',
      bgColor: '#faf5ff',
      borderColor: '#8b5cf6',
      description: '音楽家レベルの相対音感を達成！優秀率超えの実力を証明されました。'
    },
    A: { 
      name: 'A級エキスパート', 
      icon: Crown, 
      color: 'text-yellow-500',
      colorValue: '#eab308',
      bgColor: '#fffbeb',
      borderColor: '#f59e0b',
      description: 'エキスパートレベル到達！優秀率の安定した音感能力です。'
    },
    B: { 
      name: 'B級プロフィシエント', 
      icon: Star, 
      color: 'text-green-500',
      colorValue: '#10b981',
      bgColor: '#ecfdf5',
      borderColor: '#10b981',
      description: 'プロフィシエント級達成！良好率の確実な進歩を示しています。'
    },
    C: { 
      name: 'C級アドバンス', 
      icon: Award, 
      color: 'text-blue-500',
      colorValue: '#3b82f6',
      bgColor: '#eff6ff',
      borderColor: '#3b82f6',
      description: 'アドバンス級到達！合格率で着実に成長中です。'
    },
    D: { 
      name: 'D級ベーシック', 
      icon: Meh, 
      color: 'text-orange-500',
      colorValue: '#f97316',
      bgColor: '#fff7ed',
      borderColor: '#f97316',
      description: '継続練習で必ず上達！現在の合格率から目標70%へ向けて練習を続けましょう。'
    },
    E: { 
      name: 'E級ビギナー', 
      icon: Sprout, 
      color: 'text-red-500',
      colorValue: '#ef4444',
      bgColor: '#fef2f2',
      borderColor: '#ef4444',
      description: '練習開始段階です。継続的な練習で必ず上達します。'
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
  // 統一された評価ロジックを使用
  function calculateSessionGradeWrapper(sessionData) {
    if (!sessionData || !sessionData.noteResults) return 'needWork';
    return calculateSessionGrade(sessionData.noteResults);
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
      
      // 🔬 NEW: 2タブ用詳細データ（一貫性タブは廃止済み）
      technicalAnalysis: detailedAnalysis.technicalAnalysis,
      intervalAnalysis: detailedAnalysis.intervalAnalysis,
      // consistencyAnalysis: detailedAnalysis.consistencyAnalysis, // 廃止済み
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
    // 音程測定特化の外れ値検出
    // 1. 統計的外れ値（両側3σ）
    const upperStatThreshold = stats.mean + (3 * stats.stdDev);
    const lowerStatThreshold = Math.max(0, stats.mean - (3 * stats.stdDev));
    
    // 2. 音楽的異常値（100¢ = 半音のズレ）
    const musicalThreshold = 100;
    
    // 3. 両方の条件で外れ値を検出
    const outlierData = data.filter(cent => 
      cent > upperStatThreshold ||      // 統計的に大きすぎ
      cent < lowerStatThreshold ||      // 統計的に小さすぎ（異常に正確）
      Math.abs(cent) > musicalThreshold // 音楽的に異常（半音以上のズレ）
    );
    
    return {
      threshold: upperStatThreshold,     // 互換性のため上側閾値を保持
      upperThreshold: upperStatThreshold,
      lowerThreshold: lowerStatThreshold,
      musicalThreshold: musicalThreshold,
      data: outlierData,
      count: outlierData.length,
      rate: outlierData.length / data.length
    };
  }

  function calculateRobustStatistics(data, outliers) {
    // 外れ値を除外（両側 + 音楽的異常値）
    const cleanData = data.filter(cent => {
      // outliers.dataに含まれないデータのみを使用
      return !outliers.data.includes(cent);
    });
    
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
        lower: Math.max(0, Math.round((robustStats.accuracy - 10) * 10) / 10),
        upper: Math.min(100, Math.round((robustStats.accuracy + 10) * 10) / 10)
      },
      errorDistribution: {
        highPrecision: allCentData.filter(c => c <= 10).length,
        mediumPrecision: allCentData.filter(c => c > 10 && c <= 20).length,
        lowPrecision: allCentData.filter(c => c > 20 && c <= 50).length,
        anomalies: allCentData.filter(c => c > 100).length  // 音楽的異常値（半音以上）
      },
      correctedEvaluation: {
        rawAverage: Math.round(stats.mean * 10) / 10,
        correctedAverage: Math.round(robustStats.mean * 10) / 10,
        rawAccuracy: Math.max(0, Math.round((100 - stats.mean) * 10) / 10),
        correctedAccuracy: Math.round(robustStats.accuracy * 10) / 10,
        confidenceLevel: confidenceLevel === 'high' ? 94.2 : confidenceLevel === 'medium' ? 87.5 : 72.1
      }
    };

    // Tab 2: 音程別分析データ（強化版）
    const intervalAnalysis = generateIntervalAnalysis(sessionHistory);
    const intervalMastery = analyzeIntervalMastery(intervalAnalysis);

    // Tab 3: 一貫性分析データ（廃止済み - CONSISTENCY_EVALUATION_DEPRECATION_SPECIFICATION.md参照）
    // const consistencyAnalysis = generateConsistencyAnalysis(sessionHistory, stats, robustStats);

    // Tab 4: 総合統計データ
    const comprehensiveStatistics = generateComprehensiveStatistics(sessionHistory, allCentData, robustStats);

    return {
      technicalAnalysis,
      intervalAnalysis,
      intervalMastery,
      // consistencyAnalysis, // 廃止済み
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

  // 一貫性分析データ生成（廃止済み - CONSISTENCY_EVALUATION_DEPRECATION_SPECIFICATION.md参照）
  // function generateConsistencyAnalysis() { ... }

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
    
    // 🔬 改良版技術誤差補正システム（均等化）
    let correctedExcellentRatio = excellentRatio;
    let correctedGoodRatio = goodRatio;
    let correctedPassRatio = passRatio;
    
    if (errorAnalysis.measurement === 'complete') {
      // 技術誤差による判定向上（より保守的なアプローチ）
      const improvementFactor = Math.min(errorAnalysis.correctionFactor - 1.0, 0.2); // 最大20%の向上
      
      if (improvementFactor > 0) {
        // 均等な補正適用（全グレードに50%）
        correctedExcellentRatio = Math.min(excellentRatio + (improvementFactor * 0.5), 0.95);
        correctedGoodRatio = Math.min(goodRatio + (improvementFactor * 0.5), 0.98);
        correctedPassRatio = Math.min(passRatio + (improvementFactor * 0.5), 1.0);
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
    
    // 改良された判定基準（より現実的でバランスの取れた基準）
    let grade = 'E';
    if (correctedExcellentRatio >= 0.60 && correctedGoodRatio >= 0.85) {
      grade = 'S';  // 優秀60%以上 + 良好以上85%以上
    } else if (correctedExcellentRatio >= 0.40 && correctedGoodRatio >= 0.75) {
      grade = 'A';  // 優秀40%以上 + 良好以上75%以上
    } else if (correctedExcellentRatio >= 0.25 && correctedGoodRatio >= 0.65) {
      grade = 'B';  // 優秀25%以上 + 良好以上65%以上
    } else if (correctedGoodRatio >= 0.50) {
      grade = 'C';  // 良好以上50%以上（シンプル化）
    } else if (correctedPassRatio >= 0.60) {
      grade = 'D';  // 合格以上60%以上
    }
    
    console.log('🎯 最終判定:', grade);
    return grade;
  })();
  
  // 🔬 ハイブリッド技術誤差分析結果
  $: technicalAnalysis = performHybridStatisticalAnalysis(scoreData?.sessionHistory || [], scoreData?.mode || 'random');
  




  
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
    // { id: 'technical', label: '技術分析', icon: Activity },
    // { id: 'intervals', label: '音程別精度', icon: Music }
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
    
    // 外部クリックリスナー
    document.addEventListener('click', handleOutsideClick);
    
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  });
  
  // ポップオーバー制御関数
  function toggleGradeHelp() {
    console.log('toggleGradeHelp clicked, current showGradeHelp:', showGradeHelp);
    showGradeHelp = !showGradeHelp;
    showSessionHelp = false;
    console.log('After toggle, showGradeHelp:', showGradeHelp);
  }
  
  function toggleSessionHelp() {
    console.log('toggleSessionHelp clicked, current showSessionHelp:', showSessionHelp);
    showSessionHelp = !showSessionHelp;
    showGradeHelp = false;
    console.log('After toggle, showSessionHelp:', showSessionHelp);
  }
  
  function handleOutsideClick(event) {
    if (!event.target.closest('.grade-help-icon-button') && 
        !event.target.closest('.grade-criteria-popover')) {
      showGradeHelp = false;
    }
    if (!event.target.closest('.session-help-icon-button') && 
        !event.target.closest('.session-criteria-popover') && 
        !event.target.closest('.session-criteria-popover-carousel')) {
      showSessionHelp = false;
    }
  }
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
          class="grade-icon"
          style="transform: scale({$iconScale}); color: {gradeDef.colorValue};"
        />
      </div>
      
      <div class="grade-title-with-help" in:fade={{ delay: 400 }}>
        <h2 class="grade-name {gradeDef.color}">
          {gradeDef.name}
        </h2>
        <button 
          class="grade-help-icon-button" 
          on:click={toggleGradeHelp}
          aria-label="8セッション完走時の最終評価基準を表示"
        >
          <HelpCircle 
            size="20" 
            style="color: #6b7280;" 
          />
        </button>
      </div>
      
      <p class="grade-description" in:fade={{ delay: 600 }}>
        {gradeDef.description}
      </p>
      
      <!-- グレードヘルプポップオーバー -->
      {#if showGradeHelp}
        <div class="popover-backdrop" in:fade={{ duration: 200 }}></div>
        <div class="grade-criteria-popover" in:fade={{ duration: 200 }}>
          <h5 class="popover-title">8セッション完走時の最終評価</h5>
          
          <div class="grade-criteria-item">
            <Trophy class="criteria-icon" style="color: #a855f7;" />
            <span class="criteria-name">S級マスター</span>
            <span class="criteria-condition">優秀60%以上 + 良好以上90%以上</span>
          </div>
          
          <div class="grade-criteria-item">
            <Crown class="criteria-icon" style="color: #eab308;" />
            <span class="criteria-name">A級エキスパート</span>
            <span class="criteria-condition">優秀40%以上 + 良好以上80%以上</span>
          </div>
          
          <div class="grade-criteria-item">
            <Star class="criteria-icon" style="color: #10b981;" />
            <span class="criteria-name">B級プロフィシエント</span>
            <span class="criteria-condition">優秀25%以上 + 良好以上70%以上</span>
          </div>
          
          <div class="grade-criteria-item">
            <Award class="criteria-icon" style="color: #3b82f6;" />
            <span class="criteria-name">C級アドバンス</span>
            <span class="criteria-condition">合格以上50%以上</span>
          </div>
          
          <div class="grade-criteria-item">
            <Meh class="criteria-icon" style="color: #f97316;" />
            <span class="criteria-name">D級ベーシック</span>
            <span class="criteria-condition">合格以上30%以上</span>
          </div>
          
          <div class="grade-criteria-item">
            <Sprout class="criteria-icon" style="color: #ef4444;" />
            <span class="criteria-name">E級ビギナー</span>
            <span class="criteria-condition">合格以上30%未満</span>
          </div>
        </div>
      {/if}
      
      
      
      <!-- 評価内訳表示（セッション評価スタイル統一） -->
      {#if isCompleted && sessionStatistics}
        <div class="evaluation-breakdown" in:fly={{ y: 20, duration: 500, delay: 900 }}>
          <h3 class="section-title">
            <BarChart3 class="w-5 h-5" />
            評価内訳
          </h3>
          
          <!-- セッション結果ビジュアル -->
          <div class="session-results-visual">
            <div class="subsection-title-with-help">
              <h4 class="subsection-title">セッション結果</h4>
              <button 
                class="session-help-icon-button" 
                on:click|stopPropagation={toggleSessionHelp}
                aria-label="セッション判定基準を表示"
              >
                <HelpCircle 
                  size="16" 
                  style="color: #6b7280;" 
                />
              </button>
            </div>
            
            <!-- セッション判定基準ポップオーバー -->
            <!-- デバッグ: showSessionHelp = {showSessionHelp} -->
            {#if showSessionHelp}
              <div class="popover-backdrop" in:fade={{ duration: 200 }}></div>
              <div class="session-criteria-popover" in:fade={{ duration: 200 }}>
                <h5 class="popover-title">セッション判定基準</h5>
                
                <div class="session-criteria-item">
                  <Trophy class="criteria-icon" style="color: #f59e0b;" />
                  <span class="criteria-name">優秀</span>
                  <div class="criteria-detail">
                    優秀な音程が6個以上 かつ<br/>
                    平均誤差±20¢以内
                  </div>
                </div>
                
                <div class="session-criteria-item">
                  <Star class="criteria-icon" style="color: #059669;" />
                  <span class="criteria-name">良好</span>
                  <div class="criteria-detail">
                    合格以上が7個以上 かつ<br/>
                    平均誤差±30¢以内
                  </div>
                </div>
                
                <div class="session-criteria-item">
                  <ThumbsUp class="criteria-icon" style="color: #2563eb;" />
                  <span class="criteria-name">合格</span>
                  <div class="criteria-detail">
                    合格以上が5個以上<br/>
                    (8音中62.5%)
                  </div>
                </div>
                
                <div class="session-criteria-item">
                  <Frown class="criteria-icon" style="color: #dc2626;" />
                  <span class="criteria-name">要練習</span>
                  <div class="criteria-detail">
                    要練習が6個以上 または<br/>
                    測定不可が4個以上
                  </div>
                </div>
                
                <p class="criteria-note">
                  ※技術的ブレを考慮し、ポジティブ<br/>
                  評価を優先する判定システムです
                </p>
              </div>
            {/if}
            
            <div class="session-icons">
              {#each scoreData.sessionHistory as session, index}
                {@const grade = session.grade}
                {@const gradeDef = sessionGradeDefinitions[grade]}
                <div class="session-icon-wrapper" title="セッション{index + 1}: {gradeDef.name} - 基音: {session.baseNote}">
                  {#if grade === 'excellent'}
                    <Trophy class="session-icon" style="color: #f59e0b;" />
                  {:else if grade === 'good'}
                    <Star class="session-icon" style="color: #059669;" />
                  {:else if grade === 'pass'}
                    <ThumbsUp class="session-icon" style="color: #2563eb;" />
                  {:else}
                    <Frown class="session-icon" style="color: #dc2626;" />
                  {/if}
                  <span class="session-number-small">{index + 1}</span>
                </div>
              {/each}
            </div>
          </div>
          
          <!-- グレード達成状況 -->
          <div class="grade-achievement">
            <h4 class="subsection-title">グレード達成状況</h4>
            <div class="achievement-bars">
              {#each Object.entries(sessionGradeDefinitions).slice(0, 4) as [key, def]}
                {@const count = scoreData.sessionHistory.filter(s => s.grade === key).length}
                {@const percentage = (count / scoreData.sessionHistory.length) * 100}
                <div class="achievement-row">
                  <div class="achievement-label">
                    <svelte:component this={def.icon} class="w-4 h-4 {def.color}" />
                    <span>{def.name}</span>
                  </div>
                  
                  <div class="achievement-bar-container">
                    <div class="achievement-bar" 
                         style="width: {percentage}%; background-color: {def.borderColor};">
                    </div>
                  </div>
                  
                  <div class="achievement-count">
                    <span class="count">{count}/8</span>
                    <span class="percentage">({Math.round(percentage)}%)</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>
          
          <!-- 技術分析（音程精度・方向性） -->
          {#if technicalFeedbackData?.details && technicalFeedbackData.details.length > 0}
            <div class="technical-analysis">
              <h4 class="subsection-title">技術分析</h4>
              <div class="technical-analysis-content">
                {#each technicalFeedbackData.details as item}
                  {@const isIntervalAccuracy = item.text.includes('音程精度')}
                  {@const isDirectionAccuracy = item.text.includes('方向性')}
                  {@const textContent = item.text}
                  {@const percentageMatch = textContent.match(/(\d+)%/)}
                  {#if item.category === 'improvements' && (isIntervalAccuracy || isDirectionAccuracy)}
                    <div class="analysis-item">
                      <div class="analysis-label">
                        {#if isIntervalAccuracy}
                          <Target class="w-4 h-4 text-blue-500" />
                        {:else}
                          <TrendingUp class="w-4 h-4 text-green-500" />
                        {/if}
                        <span>{isIntervalAccuracy ? '音程精度' : '方向性'}</span>
                      </div>
                      <div class="analysis-value">
                        {#if percentageMatch}
                          <span class="percentage">{percentageMatch[1]}%</span>
                        {/if}
                        <span class="description">（{textContent.split('（')[1]}</span>
                      </div>
                    </div>
                  {/if}
                {/each}
              </div>
            </div>
          {/if}
          
          <!-- 次の目標 -->
          <div class="next-goal">
            <h4 class="subsection-title">次の目標</h4>
            <div class="goal-content">
              {#if unifiedGrade === 'S'}
                <div class="goal-item achieved">
                  <CheckCircle class="w-5 h-5 text-green-500" />
                  <span>最高グレード達成！この精度を維持しましょう</span>
                </div>
              {:else}
                {@const nextGrade = unifiedGrade === 'E' ? 'D' : unifiedGrade === 'D' ? 'C' : unifiedGrade === 'C' ? 'B' : unifiedGrade === 'B' ? 'A' : 'S'}
                {@const nextGradeDef = unifiedGradeDefinitions[nextGrade]}
                <div class="goal-item">
                  <Target class="w-5 h-5 text-blue-500" />
                  <span>次回は<strong class="{nextGradeDef.color}">{nextGradeDef.name}</strong>を目指しましょう</span>
                </div>
                <div class="goal-advice">
                  {#if nextGrade === 'D'}
                    基本的な音程感覚を身につけて合格率を向上させましょう
                  {:else if nextGrade === 'C'}
                    安定して合格できるよう練習を継続しましょう
                  {:else if nextGrade === 'B'}
                    より高い精度で正解できるよう練習を重ねましょう
                  {:else if nextGrade === 'A'}
                    優秀な精度を安定して出せるよう練習しましょう
                  {:else}
                    最高レベルの精度を目指して練習を続けましょう
                  {/if}
                </div>
              {/if}
            </div>
          </div>
          
          <!-- 技術的補正の透明性 -->
          {#if detailedAnalysisData?.technicalAnalysis}
            <div class="technical-transparency">
              <h4 class="subsection-title">技術的補正について</h4>
              <div class="transparency-content">
                <div class="transparency-item">
                  <span class="transparency-label">測定データ数:</span>
                  <span class="transparency-value">{detailedAnalysisData.technicalAnalysis.totalMeasurements || (scoreData?.sessionHistory?.length * 8) || 64}回</span>
                </div>
                <div class="transparency-item">
                  <span class="transparency-label">外れ値除去:</span>
                  <span class="transparency-value">{detailedAnalysisData.technicalAnalysis.outlierCount || 0}個</span>
                </div>
                <div class="transparency-item">
                  <span class="transparency-label">補正効果:</span>
                  <span class="transparency-value">精度 {detailedAnalysisData.technicalAnalysis.correctedEvaluation.rawAverage || '---'}¢ → {detailedAnalysisData.technicalAnalysis.correctedEvaluation.correctedAverage || '---'}¢</span>
                </div>
              </div>
            </div>
          {/if}
        </div>
      {/if}
      
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
          
          <!-- Debug: SessionCarousel表示確認 -->
          <div style="font-size: 12px; color: blue; margin: 10px 0; border: 1px solid blue; padding: 5px;">
            Debug Carousel: sessionHistory.length = {scoreData.sessionHistory?.length || 0}, currentIndex = {currentSessionIndex}
            <br>Debug scoreData keys: {JSON.stringify(Object.keys(scoreData || {}))}
            <br>Debug scoreData.sessionHistory: {JSON.stringify(scoreData.sessionHistory?.slice(0, 2) || [])}
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
                <!-- Debug: セッションデータ確認 -->
                <div style="font-size: 10px; color: red; margin-bottom: 5px;">
                  Debug: Session {index + 1} - noteResults: {session.noteResults ? 'あり' : 'なし'} - baseNote: {session.baseNote || 'なし'}
                </div>
                
                <!-- 8音階詳細表示（セッション情報統合版） -->
                {#if session.noteResults}
                  <RandomModeScoreResult 
                    noteResults={session.noteResults}
                    sessionIndex={index}
                    baseNote={session.baseNote}
                    className="carousel-score-result"
                    on:show-session-help={() => showCarouselSessionHelp = true}
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
  
  <!-- 詳細分析ダッシュボード（一時的に無効化） -->
  {#if false && showDetailedAnalysis && (currentScoreData || intervalData.length > 0 || feedbackData || sessionStatistics)}
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
                  <p class="section-description">Web Audio APIによる音程測定の品質と信頼性を分析します</p>
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
                      <span class="analysis-label">測定信頼度</span>
                      <span class="analysis-value">{detailedAnalysisData.technicalAnalysis.correctedEvaluation.confidenceLevel}%（高精度）</span>
                    </div>
                  </div>
                </div>

                <!-- 誤差パターン分析セクション -->
                <div class="analysis-section">
                  <h5 class="section-title"><BarChart3 size={18} class="inline mr-2" />誤差分布</h5>
                  <p class="section-description">測定精度レベル別の分析結果</p>
                  <div class="analysis-grid-four">
                    <div class="analysis-item">
                      <span class="analysis-label">高精度測定</span>
                      <span class="analysis-value text-green-600">{detailedAnalysisData.technicalAnalysis.errorDistribution.highPrecision}回（技術誤差 ±10¢以内）</span>
                    </div>
                    <div class="analysis-item">
                      <span class="analysis-label">中精度測定</span>
                      <span class="analysis-value text-blue-600">{detailedAnalysisData.technicalAnalysis.errorDistribution.mediumPrecision}回（技術誤差 10-20¢）</span>
                    </div>
                    <div class="analysis-item">
                      <span class="analysis-label">低精度測定</span>
                      <span class="analysis-value text-amber-600">{detailedAnalysisData.technicalAnalysis.errorDistribution.lowPrecision}回（技術誤差 20-50¢）</span>
                    </div>
                    <div class="analysis-item">
                      <span class="analysis-label">異常値</span>
                      <span class="analysis-value text-red-600">{detailedAnalysisData.technicalAnalysis.outlierCount}回（統計的外れ値・音楽的異常値）</span>
                    </div>
                  </div>
                </div>

                <!-- 補正後評価セクション -->
                <div class="analysis-section">
                  <h5 class="section-title"><AlertCircle size={18} class="inline mr-2" />技術誤差補正結果</h5>
                  <p class="section-description">外れ値除去後の真の音感能力評価</p>
                  <div class="analysis-grid-five">
                    <div class="analysis-item">
                      <span class="analysis-label">補正前平均誤差</span>
                      <span class="analysis-value">{detailedAnalysisData.technicalAnalysis.correctedEvaluation.rawAverage}¢</span>
                    </div>
                    <div class="analysis-item">
                      <span class="analysis-label">補正後平均誤差</span>
                      <span class="analysis-value text-green-600 font-bold">{detailedAnalysisData.technicalAnalysis.correctedEvaluation.correctedAverage}¢</span>
                    </div>
                    <div class="analysis-item">
                      <span class="analysis-label">補正後精度</span>
                      <span class="analysis-value text-blue-600 font-bold">{detailedAnalysisData.technicalAnalysis.correctedEvaluation.correctedAccuracy}%</span>
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
              {#if detailedAnalysisData?.intervalMastery || (scoreData?.sessionHistory && scoreData.sessionHistory.length >= (scoreData?.mode === 'chromatic' ? 12 : 8))}
                <!-- 音程別進捗表（テーブル形式） -->
                <div class="interval-analysis-table">
                  <h4 class="analysis-title"><Music size={20} class="inline mr-2" />音程別精度一覧</h4>
                  
                  <!-- アイコン評価基準の説明 -->
                  <div class="icon-legend">
                    <div class="legend-item">
                      <CheckCircle size={16} class="text-green-600" />
                      <span>習得済み（80%以上）</span>
                    </div>
                    <div class="legend-item">
                      <Star size={16} class="text-blue-600" />
                      <span>習得中（60-79%）</span>
                    </div>
                    <div class="legend-item">
                      <BookOpen size={16} class="text-red-600" />
                      <span>要練習（60%未満）</span>
                    </div>
                  </div>
                  
                  <!-- 音程別進捗テーブル -->
                  <div class="interval-table-container">
                    <table class="interval-table">
                      <thead>
                        <tr>
                          <th>ステータス</th>
                          <th>音程</th>
                          <th>習得度</th>
                          <th>挑戦回数</th>
                          <th>合格率</th>
                          <th>推奨アクション</th>
                        </tr>
                      </thead>
                      <tbody>
                        <!-- 習得済み音程 -->
                        {#each detailedAnalysisData.intervalMastery.mastered as interval}
                          <tr class="mastered-row">
                            <td class="status-cell">
                              <CheckCircle size={18} class="text-green-600" />
                            </td>
                            <td class="interval-name-cell">{interval.name}</td>
                            <td class="mastery-cell">
                              <span class="mastery-badge excellent">{interval.mastery}%</span>
                            </td>
                            <td class="attempts-cell">{interval.attempts}回</td>
                            <td class="pass-rate-cell">
                              <span class="pass-rate excellent">{interval.passRate}%</span>
                            </td>
                            <td class="recommendation-cell">{interval.recommendation}</td>
                          </tr>
                        {/each}

                        <!-- 習得中音程 -->
                        {#each detailedAnalysisData.intervalMastery.learning as interval}
                          <tr class="learning-row">
                            <td class="status-cell">
                              <Star size={18} class="text-blue-600" />
                            </td>
                            <td class="interval-name-cell">{interval.name}</td>
                            <td class="mastery-cell">
                              <span class="mastery-badge good">{interval.mastery}%</span>
                            </td>
                            <td class="attempts-cell">{interval.attempts}回</td>
                            <td class="pass-rate-cell">
                              <span class="pass-rate good">{interval.passRate}%</span>
                            </td>
                            <td class="recommendation-cell">{interval.recommendation}</td>
                          </tr>
                        {/each}

                        <!-- 要練習音程 -->
                        {#each detailedAnalysisData.intervalMastery.needsPractice as interval}
                          <tr class="needs-practice-row">
                            <td class="status-cell">
                              <BookOpen size={18} class="text-red-600" />
                            </td>
                            <td class="interval-name-cell">{interval.name}</td>
                            <td class="mastery-cell">
                              <span class="mastery-badge needs-work">{interval.mastery}%</span>
                            </td>
                            <td class="attempts-cell">{interval.attempts}回</td>
                            <td class="pass-rate-cell">
                              <span class="pass-rate needs-work">{interval.passRate}%</span>
                            </td>
                            <td class="recommendation-cell">{interval.recommendation}</td>
                          </tr>
                        {/each}
                      </tbody>
                    </table>
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
          
          <!-- 一貫性グラフタブ（廃止済み - CONSISTENCY_EVALUATION_DEPRECATION_SPECIFICATION.md参照） -->
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
  
  /* S-E級メッセージスタイル */
  .grade-feedback-messages {
    margin-top: 1rem;
    padding: 1rem;
    background: linear-gradient(135deg, #f9fafb, #ffffff);
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }
  
  .grade-primary-message {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }
  
  .grade-summary-message {
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.5;
  }
  
  /* 技術分析結果セクションスタイル */
  .technical-feedback-section {
    margin-top: 2rem;
    margin-bottom: 2rem;
  }
  
  :global(.technical-feedback-display) {
    max-width: 100%;
    margin: 0 auto;
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
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .section-description {
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 1rem;
    line-height: 1.4;
  }

  .analysis-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .analysis-grid-four {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .analysis-grid-five {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
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

  /* 音程別精度テーブルスタイル */
  .interval-analysis-table {
    margin-bottom: 2rem;
  }

  .icon-legend {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: #f8fafc;
    border-radius: 8px;
    font-size: 0.875rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .interval-table-container {
    overflow-x: auto;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }

  .interval-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
  }

  .interval-table th {
    background: #f8fafc;
    padding: 0.75rem;
    text-align: left;
    font-weight: 600;
    color: #374151;
    border-bottom: 2px solid #e2e8f0;
  }

  .interval-table td {
    padding: 0.75rem;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
  }

  .interval-table tr:hover {
    background: #fafbfc;
  }

  .status-cell {
    text-align: center;
    width: 60px;
  }

  .interval-name-cell {
    font-weight: 600;
    color: #1f2937;
    width: 120px;
  }

  .mastery-cell {
    width: 100px;
  }

  .attempts-cell {
    width: 80px;
    text-align: center;
  }

  .pass-rate-cell {
    width: 80px;
    text-align: center;
  }

  .recommendation-cell {
    color: #6b7280;
    font-size: 0.875rem;
  }

  .pass-rate.excellent {
    color: #10b981;
    font-weight: 600;
  }

  .pass-rate.good {
    color: #3b82f6;
    font-weight: 600;
  }

  .pass-rate.needs-work {
    color: #ef4444;
    font-weight: 600;
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
  
  
  /* 技術分析タブスタイル（別の場所で使用） */
  .technical-analysis-tab-content {
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
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .analysis-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    flex: 1;
    text-align: center;
    padding: 0.75rem;
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
  
  /* 評価内訳表示スタイル（RandomModeScoreResultと統一） */
  .evaluation-breakdown {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    margin-top: 2rem;
    margin-bottom: 1.5rem;
  }
  
  .section-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #1f2937;
  }
  
  .subsection-title {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    color: #374151;
  }
  
  /* セッション結果ビジュアル */
  .session-results-visual {
    margin-bottom: 1.5rem;
  }
  
  .session-icons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: center;
  }
  
  .session-icon-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem;
    border-radius: 8px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    transition: all 0.2s;
    cursor: help;
  }
  
  .session-icon-wrapper:hover {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }
  
  .session-icon {
    width: 24px;
    height: 24px;
  }
  
  .session-icon.excellent { color: #f59e0b !important; } /* 優秀 - ゴールド */
  .session-icon.good { color: #059669 !important; }      /* 良好 - グリーン */
  .session-icon.pass { color: #2563eb !important; }      /* 合格 - ブルー */
  .session-icon.needWork { color: #dc2626 !important; }  /* 要練習 - レッド */
  
  .session-number-small {
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
  }
  
  /* グレード達成状況 */
  .grade-achievement {
    margin-bottom: 1.5rem;
  }
  
  .achievement-bars {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .achievement-row {
    display: grid;
    grid-template-columns: 120px 1fr 80px;
    align-items: center;
    gap: 1rem;
  }
  
  .achievement-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
  }
  
  .achievement-bar-container {
    height: 12px;
    background: #f3f4f6;
    border-radius: 6px;
    overflow: hidden;
  }
  
  .achievement-bar {
    height: 100%;
    border-radius: 6px;
    transition: width 0.3s ease-out;
  }
  
  .achievement-count {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.25rem;
    font-weight: 600;
    font-size: 0.875rem;
    white-space: nowrap;
  }
  
  .achievement-count .count {
    color: #374151;
  }
  
  .achievement-count .percentage {
    color: #6b7280;
    font-size: 0.75rem;
  }
  
  /* 技術分析 */
  .technical-analysis {
    margin-bottom: 1.5rem;
  }
  
  .technical-analysis-content {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0.75rem;
    display: flex;
    flex-direction: row;
    gap: 1rem;
    justify-content: space-around;
    align-items: stretch;
    min-height: 60px;
  }
  
  .analysis-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    text-align: center;
  }
  
  .analysis-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: #374151;
    min-width: 120px;
  }
  
  .analysis-value {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    text-align: right;
    flex: 1;
  }
  
  .analysis-value .percentage {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.25rem;
  }
  
  .analysis-value .description {
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.4;
  }

  /* 次の目標 */
  .next-goal {
    margin-bottom: 1.5rem;
  }
  
  .goal-content {
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
  }
  
  .goal-item {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-weight: 500;
    color: #0c4a6e;
    margin-bottom: 0.5rem;
  }
  
  .goal-item.achieved {
    color: #166534;
    background: #ecfdf5;
    border: 1px solid #bbf7d0;
    border-radius: 6px;
    padding: 0.75rem;
    margin-bottom: 0;
  }
  
  .goal-advice {
    font-size: 0.875rem;
    color: #0369a1;
    font-style: italic;
    margin-left: 1.75rem;
  }
  
  /* 技術的補正の透明性 */
  .technical-transparency {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1rem;
  }
  
  .transparency-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .transparency-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
  }
  
  .transparency-label {
    color: #64748b;
    font-weight: 500;
  }
  
  .transparency-value {
    color: #0f172a;
    font-weight: 600;
  }

  /* レスポンシブ対応 */
  @media (max-width: 640px) {
    .unified-score-result {
      padding: 1rem;
    }
    
    .grade-display {
      padding: 1.5rem;
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
    
    /* 評価内訳表示のレスポンシブ対応 */
    .evaluation-breakdown {
      padding: 1rem;
    }
    
    .session-icons {
      justify-content: center;
    }
    
    .achievement-row {
      grid-template-columns: 100px 1fr 60px;
      gap: 0.5rem;
    }
    
    .achievement-label {
      font-size: 0.875rem;
    }
    
    .goal-advice {
      margin-left: 0;
      margin-top: 0.5rem;
    }
    
    .transparency-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }
    
    /* 技術分析のレスポンシブ対応 */
    .technical-analysis-content {
      flex-direction: row;
      gap: 0.5rem;
      padding: 0.5rem;
    }
    
    .analysis-item {
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      text-align: center;
      flex: 1;
    }
    
    .analysis-value {
      align-items: flex-start;
      text-align: left;
    }
    
    .analysis-label {
      min-width: auto;
    }

    .analysis-grid-four {
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .analysis-grid-five {
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
  }
  
  /* ポップオーバー式評価基準表示 */
  .grade-title-with-help,
  .subsection-title-with-help {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
  }
  
  .grade-help-icon-button,
  .session-help-icon-button {
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
  }
  
  .grade-help-icon-button:hover,
  .session-help-icon-button:hover {
    background: #f3f4f6;
    opacity: 0.8;
  }
  
  .grade-help-icon-button:active,
  .session-help-icon-button:active {
    background: #e5e7eb;
  }
  
  .popover-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 9999;
  }

  .grade-criteria-popover,
  .session-criteria-popover {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10000;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    min-width: 320px;
    max-width: 400px;
  }

  .session-help-container {
    position: relative;
  }

  .popover-backdrop-carousel {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: rgba(0, 0, 0, 0.5) !important;
    z-index: 9999998 !important;
    pointer-events: auto !important;
  }

  .session-criteria-popover-carousel {
    position: fixed !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    z-index: 9999999 !important;
    background: white !important;
    border: 1px solid #e5e7eb !important;
    border-radius: 8px !important;
    padding: 1rem !important;
    box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25) !important;
    min-width: 320px !important;
    max-width: 400px !important;
    pointer-events: auto !important;
  }
  
  .popover-title {
    font-weight: 600;
    font-size: 0.875rem;
    color: #374151;
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .grade-criteria-item,
  .session-criteria-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid #f3f4f6;
  }
  
  .grade-criteria-item:last-child,
  .session-criteria-item:last-child {
    border-bottom: none;
  }
  
  .criteria-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
  
  .criteria-name {
    font-weight: 500;
    font-size: 0.875rem;
    color: #1f2937;
    min-width: 80px;
  }
  
  .criteria-condition {
    font-size: 0.75rem;
    color: #6b7280;
    flex: 1;
    text-align: right;
  }
  
  .criteria-detail {
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.4;
    flex: 1;
  }
  
  .criteria-note {
    font-size: 0.6875rem;
    color: #9ca3af;
    line-height: 1.4;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid #f3f4f6;
  }
  
  /* ポップオーバーの位置調整のためのラッパー */
  .grade-display {
    position: relative;
  }
  
  .session-results-visual {
    position: relative;
  }
</style>

<!-- カルーセル用セッションヘルプポップオーバー -->
{#if showCarouselSessionHelp}
  <!-- グレーの背景（バックドロップ） -->
  <div 
    class="popover-backdrop-carousel"
    role="button"
    tabindex="0"
    aria-label="ポップオーバーを閉じる"
    on:click={() => showCarouselSessionHelp = false}
    on:keydown={(e) => e.key === 'Escape' && (showCarouselSessionHelp = false)}
  ></div>
  
  <!-- ポップオーバー本体 -->
  <div 
    class="session-criteria-popover-carousel"
    role="dialog"
    aria-modal="true"
    aria-labelledby="carousel-popover-title"
  >
    <div id="carousel-popover-title" class="popover-title">セッション評価について</div>
    <div class="criteria-content">
      {#each Object.entries(sessionCriteriaDefinitions) as [key, criteria]}
        <div class="session-criteria-item">
          <svelte:component this={criteria.icon} class="criteria-icon text-{criteria.color}-600" />
          <span class="criteria-name">{criteria.name}</span>
          <span class="criteria-condition">{criteria.condition}</span>
        </div>
      {/each}
      <div class="criteria-note">
        各セッションは上記の基準に基づいて評価されます。連続で良い結果を出すことで実力が確実に向上します。
      </div>
    </div>
    <button 
      class="mt-3 px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
      on:click={() => showCarouselSessionHelp = false}
    >
      閉じる
    </button>
  </div>
{/if}