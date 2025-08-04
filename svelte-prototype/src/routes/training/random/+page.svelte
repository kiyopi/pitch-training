<script>
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import { ChevronRight } from 'lucide-svelte';
  import Card from '$lib/components/Card.svelte';
  import Button from '$lib/components/Button.svelte';
  import VolumeBar from '$lib/components/VolumeBar.svelte';
  import PitchDisplay from '$lib/components/PitchDisplay.svelte';
  import PitchDetector from '$lib/components/PitchDetector.svelte';
  import PitchDetectionDisplay from '$lib/components/PitchDetectionDisplay.svelte';
  import PageLayout from '$lib/components/PageLayout.svelte';
  import * as Tone from 'tone';
  import { audioManager } from '$lib/audio/AudioManager.js';
  import { harmonicCorrection } from '$lib/audio/HarmonicCorrection.js';
  import { logger } from '$lib/utils/debugUtils.js';
  
  // 採点システムコンポーネント
  import { 
    ScoreResultPanel,
    IntervalProgressTracker,
    ConsistencyGraph,
    FeedbackDisplay,
    SessionStatistics
  } from '$lib/components/scoring';
  import UnifiedScoreResultFixed from '$lib/components/scoring/UnifiedScoreResultFixed.svelte';
  import ActionButtons from '$lib/components/ActionButtons.svelte';
  import { calculateNoteGrade, calculateSessionGrade, calculateGradeDistribution } from '$lib/utils/gradeCalculation';
  
  // 採点エンジン
  import { EnhancedScoringEngine } from '$lib/scoring/EnhancedScoringEngine.js';
  
  // localStorage セッション管理
  import {
    trainingProgress,
    currentSessionId,
    nextBaseNote,
    nextBaseName,
    isLoading,
    storageError,
    isCompleted,
    sessionHistory,
    overallGrade,
    overallAccuracy,
    progressPercentage,
    remainingSessions,
    latestSessionResult,
    unifiedScoreData,
    loadProgress,
    saveSessionResult,
    resetProgress,
    createNewProgress,
    startNewCycleIfCompleted
  } from '$lib/stores/sessionStorage';
  
  // Force GitHub Actions trigger: 2025-07-29 06:30
  
  // 統合グレード計算関数
  function calculateUnifiedGrade(sessionHistory) {
    if (!sessionHistory || sessionHistory.length === 0) return 'E';
    
    const sessionGrades = sessionHistory.map(session => session.grade);
    const excellentCount = sessionGrades.filter(g => g === 'excellent').length;
    const goodCount = sessionGrades.filter(g => g === 'good').length;
    const passCount = sessionGrades.filter(g => g === 'pass').length;
    const totalGoodSessions = excellentCount + goodCount + passCount;
    const totalSessions = sessionHistory.length;
    
    // 基本比率計算
    const excellentRatio = excellentCount / totalSessions;
    const goodRatio = totalGoodSessions / totalSessions;
    const passRatio = (excellentCount + goodCount + passCount) / totalSessions;
    
    // S-E級判定（簡略版）
    if (excellentRatio >= 0.6 && goodRatio >= 0.9) return 'S';
    if (excellentRatio >= 0.4 && goodRatio >= 0.8) return 'A';  
    if (excellentRatio >= 0.25 && goodRatio >= 0.7) return 'B';
    if (passRatio >= 0.5) return 'C';
    if (passRatio >= 0.3) return 'D';
    return 'E';
  }
  
  // テスト用ダミーデータ生成（正しい4段階評価システム）
  function generateTestUnifiedScoreData() {
    return {
      mode: 'random',
      timestamp: new Date(),
      duration: 480, // 8セッション × 60秒
      totalNotes: 64, // 8セッション × 8音
      measuredNotes: 59, // 8セッション総計
      averageAccuracy: 79, // 8セッション全体平均
      baseNote: 'C5', // 最終セッションの基音
      baseFrequency: 523.25,
      sessionHistory: [
        { 
          grade: 'excellent', 
          accuracy: 92, 
          baseNote: 'C4',
          baseFrequency: 261.63,
          timestamp: new Date(Date.now() - 7 * 60000),
          measuredNotes: 8,
          noteResults: [
            { name: 'ド', note: 'ド', frequency: 262, detectedFrequency: 264, cents: 13, grade: 'excellent' },
            { name: 'レ', note: 'レ', frequency: 294, detectedFrequency: 291, cents: -18, grade: 'good' },
            { name: 'ミ', note: 'ミ', frequency: 330, detectedFrequency: 335, cents: 26, grade: 'pass' },
            { name: 'ファ', note: 'ファ', frequency: 349, detectedFrequency: 346, cents: -15, grade: 'excellent' },
            { name: 'ソ', note: 'ソ', frequency: 392, detectedFrequency: 388, cents: -18, grade: 'good' },
            { name: 'ラ', note: 'ラ', frequency: 440, detectedFrequency: 444, cents: 16, grade: 'good' },
            { name: 'シ', note: 'シ', frequency: 494, detectedFrequency: 499, cents: 17, grade: 'good' },
            { name: 'ド（高）', note: 'ド（高）', frequency: 523, detectedFrequency: 520, cents: -10, grade: 'excellent' }
          ]
        },
        { 
          grade: 'good', 
          accuracy: 78, 
          baseNote: 'D4',
          baseFrequency: 293.66,
          timestamp: new Date(Date.now() - 6 * 60000),
          measuredNotes: 7,
          noteResults: [
            { name: 'ド', note: 'ド', frequency: 294, detectedFrequency: 290, cents: -23, grade: 'good' },
            { name: 'レ', note: 'レ', frequency: 330, detectedFrequency: 340, cents: 53, grade: 'needWork' },
            { name: 'ミ', note: 'ミ', frequency: 370, detectedFrequency: 375, cents: 23, grade: 'good' },
            { name: 'ファ', note: 'ファ', frequency: 392, detectedFrequency: 385, cents: -31, grade: 'pass' },
            { name: 'ソ', note: 'ソ', frequency: 440, detectedFrequency: 432, cents: -31, grade: 'pass' },
            { name: 'ラ', note: 'ラ', frequency: 494, detectedFrequency: 510, cents: 56, grade: 'needWork' },
            { name: 'シ', note: 'シ', frequency: 554, detectedFrequency: null, cents: null, grade: 'notMeasured' },
            { name: 'ド（高）', note: 'ド（高）', frequency: 587, detectedFrequency: 580, cents: -21, grade: 'good' }
          ]
        },
        { 
          grade: 'excellent', 
          accuracy: 95, 
          baseNote: 'E4',
          baseFrequency: 329.63,
          timestamp: new Date(Date.now() - 5 * 60000),
          measuredNotes: 8,
          noteResults: [
            { name: 'ド', note: 'ド', frequency: 330, detectedFrequency: 332, cents: 10, grade: 'excellent' },
            { name: 'レ', note: 'レ', frequency: 370, detectedFrequency: 368, cents: -9, grade: 'excellent' },
            { name: 'ミ', note: 'ミ', frequency: 415, detectedFrequency: 418, cents: 12, grade: 'excellent' },
            { name: 'ファ', note: 'ファ', frequency: 440, detectedFrequency: 436, cents: -16, grade: 'good' },
            { name: 'ソ', note: 'ソ', frequency: 494, detectedFrequency: 497, cents: 11, grade: 'excellent' },
            { name: 'ラ', note: 'ラ', frequency: 554, detectedFrequency: 551, cents: -9, grade: 'excellent' },
            { name: 'シ', note: 'シ', frequency: 622, detectedFrequency: 625, cents: 8, grade: 'excellent' },
            { name: 'ド（高）', note: 'ド（高）', frequency: 659, detectedFrequency: 655, cents: -10, grade: 'excellent' }
          ]
        },
        { 
          grade: 'needWork', 
          accuracy: 45, 
          baseNote: 'F4',
          baseFrequency: 349.23,
          timestamp: new Date(Date.now() - 4 * 60000),
          measuredNotes: 6,
          noteResults: [
            { name: 'ド', note: 'ド', frequency: 349, detectedFrequency: 345, cents: -20, grade: 'good' },
            { name: 'レ', note: 'レ', frequency: 392, detectedFrequency: 420, cents: 124, grade: 'needWork' }, // 外れ値1
            { name: 'ミ', note: 'ミ', frequency: 440, detectedFrequency: 435, cents: -20, grade: 'good' },
            { name: 'ファ', note: 'ファ', frequency: 466, detectedFrequency: 520, cents: 195, grade: 'needWork' }, // 外れ値2
            { name: 'ソ', note: 'ソ', frequency: 523, detectedFrequency: 410, cents: -455, grade: 'needWork' }, // 外れ値3
            { name: 'ラ', note: 'ラ', frequency: 587, detectedFrequency: null, cents: null, grade: 'notMeasured' },
            { name: 'シ', note: 'シ', frequency: 659, detectedFrequency: 650, cents: -24, grade: 'good' },
            { name: 'ド（高）', note: 'ド（高）', frequency: 698, detectedFrequency: null, cents: null, grade: 'notMeasured' }
          ]
        },
        // === 追加セッション 5-8 ===
        { 
          grade: 'good', 
          accuracy: 85, 
          baseNote: 'G4',
          baseFrequency: 392.00,
          timestamp: new Date(Date.now() - 3 * 60000),
          measuredNotes: 8,
          noteResults: [
            { name: 'ド', note: 'ド', frequency: 392, detectedFrequency: 395, cents: 13, grade: 'excellent' },
            { name: 'レ', note: 'レ', frequency: 440, detectedFrequency: 438, cents: -8, grade: 'excellent' },
            { name: 'ミ', note: 'ミ', frequency: 494, detectedFrequency: 500, cents: 21, grade: 'good' },
            { name: 'ファ', note: 'ファ', frequency: 523, detectedFrequency: 520, cents: -10, grade: 'excellent' },
            { name: 'ソ', note: 'ソ', frequency: 587, detectedFrequency: 595, cents: 24, grade: 'good' },
            { name: 'ラ', note: 'ラ', frequency: 659, detectedFrequency: 665, cents: 16, grade: 'good' },
            { name: 'シ', note: 'シ', frequency: 740, detectedFrequency: 755, cents: 35, grade: 'pass' },
            { name: 'ド（高）', note: 'ド（高）', frequency: 784, detectedFrequency: 780, cents: -9, grade: 'excellent' }
          ]
        },
        { 
          grade: 'excellent', 
          accuracy: 94, 
          baseNote: 'A4',
          baseFrequency: 440.00,
          timestamp: new Date(Date.now() - 2 * 60000),
          measuredNotes: 8,
          noteResults: [
            { name: 'ド', note: 'ド', frequency: 440, detectedFrequency: 442, cents: 8, grade: 'excellent' },
            { name: 'レ', note: 'レ', frequency: 494, detectedFrequency: 492, cents: -7, grade: 'excellent' },
            { name: 'ミ', note: 'ミ', frequency: 554, detectedFrequency: 558, cents: 12, grade: 'excellent' },
            { name: 'ファ', note: 'ファ', frequency: 587, detectedFrequency: 585, cents: -6, grade: 'excellent' },
            { name: 'ソ', note: 'ソ', frequency: 659, detectedFrequency: 665, cents: 16, grade: 'good' },
            { name: 'ラ', note: 'ラ', frequency: 740, detectedFrequency: 738, cents: -5, grade: 'excellent' },
            { name: 'シ', note: 'シ', frequency: 831, detectedFrequency: 840, cents: 19, grade: 'good' },
            { name: 'ド（高）', note: 'ド（高）', frequency: 880, detectedFrequency: 882, cents: 4, grade: 'excellent' }
          ]
        },
        { 
          grade: 'pass', 
          accuracy: 68, 
          baseNote: 'Bb4',
          baseFrequency: 466.16,
          timestamp: new Date(Date.now() - 1 * 60000),
          measuredNotes: 7,
          noteResults: [
            { name: 'ド', note: 'ド', frequency: 466, detectedFrequency: 470, cents: 15, grade: 'excellent' },
            { name: 'レ', note: 'レ', frequency: 523, detectedFrequency: 535, cents: 39, grade: 'pass' },
            { name: 'ミ', note: 'ミ', frequency: 587, detectedFrequency: 600, cents: 38, grade: 'pass' },
            { name: 'ファ', note: 'ファ', frequency: 622, detectedFrequency: 615, cents: -19, grade: 'good' },
            { name: 'ソ', note: 'ソ', frequency: 698, detectedFrequency: 720, cents: 54, grade: 'needWork' },
            { name: 'ラ', note: 'ラ', frequency: 784, detectedFrequency: null, cents: null, grade: 'notMeasured' },
            { name: 'シ', note: 'シ', frequency: 880, detectedFrequency: 895, cents: 29, grade: 'pass' },
            { name: 'ド（高）', note: 'ド（高）', frequency: 932, detectedFrequency: 925, cents: -13, grade: 'excellent' }
          ]
        },
        { 
          grade: 'good', 
          accuracy: 82, 
          baseNote: 'C5',
          baseFrequency: 523.25,
          timestamp: new Date(),
          measuredNotes: 8,
          noteResults: [
            { name: 'ド', note: 'ド', frequency: 523, detectedFrequency: 526, cents: 10, grade: 'excellent' },
            { name: 'レ', note: 'レ', frequency: 587, detectedFrequency: 584, cents: -9, grade: 'excellent' },
            { name: 'ミ', note: 'ミ', frequency: 659, detectedFrequency: 665, cents: 16, grade: 'good' },
            { name: 'ファ', note: 'ファ', frequency: 698, detectedFrequency: 692, cents: -15, grade: 'excellent' },
            { name: 'ソ', note: 'ソ', frequency: 784, detectedFrequency: 795, cents: 24, grade: 'good' },
            { name: 'ラ', note: 'ラ', frequency: 880, detectedFrequency: 890, cents: 19, grade: 'good' },
            { name: 'シ', note: 'シ', frequency: 988, detectedFrequency: 1010, cents: 38, grade: 'pass' },
            { name: 'ド（高）', note: 'ド（高）', frequency: 1047, detectedFrequency: 1042, cents: -8, grade: 'excellent' }
          ]
        }
      ]
    };
  }

  // 基本状態管理
  let trainingPhase = 'setup'; // 'setup' | 'listening' | 'waiting' | 'guiding' | 'results'
  
  
  // マイクテストページからの遷移を早期検出
  let microphoneState = (() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('from') === 'microphone-test') {
        logger.info('[RandomTraining] マイクテストページからの遷移を検出');
        return 'granted';
      } else {
        logger.info('[RandomTraining] ダイレクトアクセスを検出');
        return 'checking';
      }
    }
    return 'checking';
  })(); // 'checking' | 'granted' | 'denied' | 'error'
  
  // シンプルな状態管理
  let microphoneHealthy = true; // マイク健康状態
  let microphoneErrors = []; // マイクエラー詳細
  
  // デバッグ情報（強制更新）
  const buildVersion = "v2.3.1-ANIMATED";
  const buildTimestamp = "07/29 04:15";
  const updateStatus = "🎬 評価分布アニメーション実装・UX向上";
  
  // 統一音階表記（相対音程表記）
  const SCALE_NAMES = ['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ', 'ド（高）'];
  
  // 基音関連
  let currentBaseNote = '';
  let currentBaseFrequency = 0;
  let isPlaying = false;
  
  // 音程ガイド
  let currentScaleIndex = 0;
  let scaleSteps = SCALE_NAMES.map(name => ({
    name,
    state: 'inactive',
    completed: false
  }));
  
  // ガイドアニメーション制御
  let guideAnimationTimer = null;
  let isGuideAnimationActive = false;
  
  // 裏での評価蓄積
  let scaleEvaluations = [];
  
  // 前回の結果保持（再挑戦時表示用）
  let previousEvaluations = [];
  
  // 音程検出
  let currentVolume = 0;
  let currentFrequency = 0;
  let detectedNote = 'ーー';
  let pitchDifference = 0;
  
  // セッション結果
  let sessionResults = {
    correctCount: 0,
    totalCount: 8,
    averageAccuracy: 0,
    averageTime: 0,
    isCompleted: false
  };
  
  // 採点システム関連
  let scoringEngine = null;

  // 表示は常に評価システムと同じ処理を使用
  let currentScoreData = {
    totalScore: 0,
    grade: 'C',
    componentScores: {
      pitchAccuracy: 0,
      recognitionSpeed: 0,
      intervalMastery: 0,
      directionAccuracy: 0,
      consistency: 0
    }
  };
  let intervalData = [];
  let consistencyData = [];
  let feedbackData = {};
  let technicalFeedbackData = {};
  let sessionStatistics = {
    totalAttempts: 0,
    successRate: 0,
    averageScore: 0,
    bestScore: 0,
    sessionDuration: 0,
    streakCount: 0,
    fatigueLevel: 'fresh',
    mostDifficultInterval: '-',
    mostSuccessfulInterval: '-',
    averageResponseTime: 0,
    sessionStart: Date.now()
  };
  let activeTab = 'intervals'; // 'intervals' | 'consistency' | 'statistics'
  
  // ランダムモード用の8音階評価データ
  let noteResultsForDisplay = [];
  
  // 統合採点システム用データ（従来の1セッション用）
  let currentUnifiedScoreData = null;
  
  // Tone.jsサンプラー
  let sampler = null;
  let isSamplerLoading = true;
  
  // 音程検出コンポーネント
  let pitchDetectorComponent = null;
  
  // AudioManager対応変数
  let mediaStream = null;   // AudioManagerから取得
  let audioContext = null;  // AudioManagerから取得
  let sourceNode = null;    // AudioManagerから取得
  
  // セッション時刻管理
  let sessionStartTime = null;

  // 基音候補（存在する音源ファイルに合わせた10種類）
  const baseNotes = [
    { note: 'C4', name: 'ド（中）', frequency: 261.63, semitonesFromC: 0 },
    { note: 'Db4', name: 'ド#（中）', frequency: 277.18, semitonesFromC: 1 },
    { note: 'D4', name: 'レ（中）', frequency: 293.66, semitonesFromC: 2 },
    { note: 'Eb4', name: 'レ#（中）', frequency: 311.13, semitonesFromC: 3 },
    { note: 'E4', name: 'ミ（中）', frequency: 329.63, semitonesFromC: 4 },
    { note: 'F4', name: 'ファ（中）', frequency: 349.23, semitonesFromC: 5 },
    { note: 'Gb4', name: 'ファ#（中）', frequency: 369.99, semitonesFromC: 6 },
    { note: 'Ab4', name: 'ラb（中）', frequency: 415.30, semitonesFromC: 8 },
    { note: 'Bb3', name: 'シb（低）', frequency: 233.08, semitonesFromC: -2 },
    { note: 'B3', name: 'シ（低）', frequency: 246.94, semitonesFromC: -1 }
  ];

  // マイク許可確認（AudioManager対応版）
  async function checkMicrophonePermission() {
    microphoneState = 'checking';
    
    try {
      console.log('🎤 [RandomTraining] AudioManager経由でマイク許可確認開始');
      
      if (!navigator.mediaDevices?.getUserMedia) {
        microphoneState = 'error';
        return;
      }
      
      // AudioManagerから共有リソースを取得（重複取得は安全）
      const resources = await audioManager.initialize();
      audioContext = resources.audioContext;
      mediaStream = resources.mediaStream;
      sourceNode = resources.sourceNode;
      
      console.log('✅ [RandomTraining] AudioManager リソース取得完了');
      
      microphoneState = 'granted';
      trainingPhase = 'setup';
      
      // PitchDetector初期化（外部AudioContext方式）
      setTimeout(async () => {
        if (pitchDetectorComponent) {
          logger.audio('[RandomTraining] PitchDetector初期化開始');
          
          // iPad対応: AudioManager強制初期化
          try {
            console.log('🎤 [RandomTraining] AudioManager再初期化開始（iPad対応）');
            await audioManager.initialize();
            console.log('✅ [RandomTraining] AudioManager再初期化完了');
          } catch (error) {
            console.warn('⚠️ AudioManager再初期化エラー:', error);
          }
          
          await pitchDetectorComponent.initialize();
          logger.audio('[RandomTraining] PitchDetector初期化完了');
        }
      }, 200);
      
    } catch (error) {
      logger.error('[RandomTraining] マイク許可エラー:', error);
      microphoneState = (error?.name === 'NotAllowedError') ? 'denied' : 'error';
    }
  }

  // ランダム基音選択
  function selectRandomBaseNote() {
    // localStorageから次の基音を取得
    const nextNote = $nextBaseNote;
    const nextName = $nextBaseName;
    
    // baseNotesから対応する情報を検索
    const selectedNote = baseNotes.find(note => note.note === nextNote) || 
                        baseNotes.find(note => note.name === nextName) ||
                        baseNotes[0]; // フォールバック
    
    currentBaseNote = selectedNote.name;
    currentBaseFrequency = selectedNote.frequency;
    
    // 基音周波数設定確認ログ
    logger.info(`[BaseNote] 基音設定（localStorage連携）: ${currentBaseNote} = ${currentBaseFrequency}Hz`);
    logger.info(`[BaseNote] localStorage基音情報: note=${nextNote}, name=${nextName}`);
    
    // 基音周波数が正常に設定されたことを確認
    if (!currentBaseFrequency || currentBaseFrequency <= 0) {
      logger.error('[BaseNote] 基音周波数設定エラー:', selectedNote);
      throw new Error(`Invalid base frequency: ${currentBaseFrequency}`);
    }
  }

  // ランダム基音再生（新しい基音を選択）
  async function playRandomBaseNote() {
    if (isPlaying || !sampler || isSamplerLoading) return;
    
    // マイク許可が未取得の場合は先に許可を取得
    if (microphoneState !== 'granted') {
      console.log('🎤 [RandomTraining] マイク許可が必要です。許可取得を開始...');
      try {
        await checkMicrophonePermission();
        console.log('🎤 [RandomTraining] マイク許可取得完了');
      } catch (error) {
        console.error('❌ マイク許可エラー:', error);
        return;
      }
    }
    
    // AudioManagerリソースが初期化されていない場合のみ初期化
    if (!mediaStream && microphoneState === 'granted') {
      console.log('🎤 [RandomTraining] AudioManagerリソース未初期化のため取得します');
      try {
        await checkMicrophonePermission();
      } catch (error) {
        console.error('❌ AudioManagerリソース初期化エラー:', error);
        return;
      }
    } else if (mediaStream) {
      console.log('🎤 [RandomTraining] AudioManagerリソース既存のため再利用');
    }
    
    // 即座に状態変更
    isPlaying = true;
    trainingPhase = 'listening';
    sessionStartTime = Date.now(); // セッション開始時刻を記録
    selectRandomBaseNote(); // 新しいランダム基音を選択
    
    // 音声再生
    const note = baseNotes.find(n => n.name === currentBaseNote).note;
    sampler.triggerAttackRelease(note, 2, Tone.now(), 0.7);
    
    // 2.5秒後にガイドアニメーション開始
    setTimeout(() => {
      isPlaying = false;
      trainingPhase = 'waiting';
      setTimeout(() => startGuideAnimation(), 500);
    }, 2000);
  }

  // 現在の基音再生（既存の基音を再利用）
  async function playCurrentBaseNote() {
    if (isPlaying || !sampler || $isLoading || !currentBaseNote) return;
    
    // マイク許可が未取得の場合は先に許可を取得
    if (microphoneState !== 'granted') {
      console.log('🎤 [RandomTraining] マイク許可が必要です。許可取得を開始...');
      try {
        await checkMicrophonePermission();
        console.log('🎤 [RandomTraining] マイク許可取得完了');
      } catch (error) {
        console.error('❌ マイク許可エラー:', error);
        return;
      }
    }
    
    // AudioManagerリソースが初期化されていない場合のみ初期化
    if (!mediaStream && microphoneState === 'granted') {
      console.log('🎤 [RandomTraining] AudioManagerリソース未初期化のため取得します');
      try {
        await checkMicrophonePermission();
      } catch (error) {
        console.error('❌ AudioManagerリソース初期化エラー:', error);
        return;
      }
    } else if (mediaStream) {
      console.log('🎤 [RandomTraining] AudioManagerリソース既存のため再利用');
    }
    
    // 即座に状態変更
    isPlaying = true;
    trainingPhase = 'listening';
    sessionStartTime = Date.now(); // セッション開始時刻を記録
    // selectRandomBaseNote() は呼ばない - 既存の基音を保持
    
    // AudioContext状態確認・再開
    if (typeof window !== 'undefined' && window.Tone) {
      const context = window.Tone.context || window.Tone.getContext();
      if (context && context.state === 'suspended') {
        console.log('🔄 [RandomTraining] AudioContext suspended検出 - 再開中...');
        await context.resume();
        console.log('✅ [RandomTraining] AudioContext再開完了');
      }
    }

    // 音声再生
    const note = baseNotes.find(n => n.name === currentBaseNote).note;
    sampler.triggerAttackRelease(note, 2, Tone.now(), 0.7);
    
    // 2.5秒後にガイドアニメーション開始
    setTimeout(() => {
      isPlaying = false;
      trainingPhase = 'waiting';
      setTimeout(() => startGuideAnimation(), 500);
    }, 2000);
  }

  // 基音のみ再生（再挑戦ボタン専用 - トレーニング開始なし）
  async function playBaseNoteOnly() {
    if (isPlaying || !sampler || $isLoading || !currentBaseNote) {
      console.log('🔄 [BaseNoteOnly] 再生条件未満: isPlaying:', isPlaying, 'sampler:', !!sampler, 'isLoading:', $isLoading, 'currentBaseNote:', currentBaseNote);
      return;
    }
    
    console.log('🎵 [BaseNoteOnly] 基音のみ再生開始:', currentBaseNote);
    
    // AudioContext状態確認・再開
    if (typeof window !== 'undefined' && window.Tone) {
      const context = window.Tone.context || window.Tone.getContext();
      if (context && context.state === 'suspended') {
        console.log('🔄 [BaseNoteOnly] AudioContext suspended検出 - 再開中...');
        await context.resume();
        console.log('✅ [BaseNoteOnly] AudioContext再開完了');
      }
    }

    // 基音のみ再生（状態変更なし）
    const note = baseNotes.find(n => n.name === currentBaseNote).note;
    sampler.triggerAttackRelease(note, 1.5, Tone.now(), 0.7);
    
    console.log('🎵 [BaseNoteOnly] 基音再生完了:', note);
  }

  // 基音再生（統合関数 - 状況に応じて適切な関数を呼び分け）
  function playBaseNote() {
    if (currentBaseNote && currentBaseFrequency > 0) {
      // 既に基音が設定されている場合は既存の基音を再生
      playCurrentBaseNote();
    } else {
      // 基音が未設定の場合は新しいランダム基音を選択
      playRandomBaseNote();
    }
  }

  // 【新】プロトタイプ式のシンプルで正確な周波数計算
  function calculateExpectedFrequency(baseFreq, scaleIndex) {
    // ドレミファソラシドの固定間隔（半音） - プロトタイプと同一
    const diatonicIntervals = [0, 2, 4, 5, 7, 9, 11, 12];
    const semitones = diatonicIntervals[scaleIndex];
    const targetFreq = baseFreq * Math.pow(2, semitones / 12);
    
    logger.debug(`[calculateExpectedFrequency] ${scaleSteps[scaleIndex].name}: 基音${baseFreq.toFixed(1)}Hz + ${semitones}半音 = ${targetFreq.toFixed(1)}Hz`);
    
    return targetFreq;
  }

  // 目標周波数計算（ドレミファソラシド）- プロトタイプ式に統一
  function calculateTargetFrequency(baseFreq, scaleIndex) {
    // 【統一】新しいシンプルで正確な計算を使用
    return calculateExpectedFrequency(baseFreq, scaleIndex);
  }

  // ガイドアニメーション開始（簡素版）
  function startGuideAnimation() {
    // シンプルな状態変更のみ
    trainingPhase = 'guiding';
    currentScaleIndex = 0;
    isGuideAnimationActive = true;
    scaleEvaluations = [];
    
    console.log(`🎬 ガイド開始: ${currentBaseNote} (${currentBaseFrequency.toFixed(1)}Hz)`);
    
    // 各ステップを順次ハイライト（1秒間隔）
    function animateNextStep() {
      if (currentScaleIndex < scaleSteps.length) {
        // 前のステップを非アクティブに
        if (currentScaleIndex > 0) {
          scaleSteps[currentScaleIndex - 1].state = 'inactive';
        }
        
        // 現在のステップをアクティブに
        scaleSteps[currentScaleIndex].state = 'active';
        
        // 倍音補正モジュールに音階コンテキストを設定
        const targetFreq = calculateTargetFrequency(currentBaseFrequency, currentScaleIndex);
        harmonicCorrection.setScaleContext({
          baseFrequency: currentBaseFrequency,
          currentScale: scaleSteps[currentScaleIndex].name,
          targetFrequency: targetFreq
        });
        
        // 【音階コンテキストログ】軽量版
        console.log(`🎵 [Scale] 基音:${currentBaseNote}(${currentBaseFrequency.toFixed(0)}Hz) 現在:${scaleSteps[currentScaleIndex].name} 目標:${targetFreq.toFixed(0)}Hz`);
        
        // 【緊急デバッグ】ガイドアニメーション中の基音状態監視
        if (currentScaleIndex >= 4) { // ソ以降で強化ログ
          console.log(`🔍 [デバッグ] Step ${currentScaleIndex}: currentBaseFrequency=${currentBaseFrequency}, currentBaseNote='${currentBaseNote}'`);
        }
        
        // ガイドログ削除（パフォーマンス優先）
        
        currentScaleIndex++;
        
        // 0.6秒後に次のステップ（テンポアップ）
        guideAnimationTimer = setTimeout(() => {
          animateNextStep();
        }, 600);
      } else {
        // アニメーション完了
        finishGuideAnimation();
      }
    }
    
    animateNextStep();
  }
  
  // ガイドアニメーション完了
  function finishGuideAnimation() {
    isGuideAnimationActive = false;
    
    console.log(`🏁 ガイド完了: ${scaleEvaluations.length}/${scaleSteps.length}ステップ評価`);
    
    // 最後のステップも非アクティブに
    if (scaleSteps.length > 0) {
      scaleSteps[scaleSteps.length - 1].state = 'inactive';
    }
    
    // 音程検出停止
    if (pitchDetectorComponent) {
      pitchDetectorComponent.stopDetection();
    }
    
    // 倍音補正モジュールのコンテキストをクリア
    harmonicCorrection.clearContext();
    
    // 採点結果を計算して表示
    calculateFinalResults();
    
    // 強化採点エンジンの結果生成
    generateFinalScoring();
    
    // 8音階評価データを新コンポーネント用に変換
    // 全8音階を固定表示（測定できなかった音も含む）
    noteResultsForDisplay = SCALE_NAMES.map(noteName => {
      const evaluation = scaleEvaluations.find(evaluation => evaluation.stepName === noteName);
      
      if (evaluation) {
        // 測定できた音
        return {
          name: evaluation.stepName,
          cents: evaluation.adjustedFrequency ? Math.round(evaluation.centDifference) : null,
          targetFreq: evaluation.expectedFrequency,
          detectedFreq: evaluation.adjustedFrequency || null,
          diff: evaluation.adjustedFrequency ? evaluation.adjustedFrequency - evaluation.expectedFrequency : null,
          accuracy: evaluation.accuracy
        };
      } else {
        // 測定できなかった音
        return {
          name: noteName,
          cents: null,
          targetFreq: null,
          detectedFreq: null,
          diff: null,
          accuracy: 'notMeasured'
        };
      }
    });
    
    // 統合採点システムデータを生成
    generateUnifiedScoreData();
    
    // 完全版表示用の追加データ生成（バックグラウンド処理）
    generateEnhancedScoringData();
    
    trainingPhase = 'results';
  }
  
  // 最終採点結果計算
  function calculateFinalResults() {
    let correctCount = 0;
    let totalAccuracy = 0;
    
    scaleEvaluations.forEach((evaluation, index) => {
      if (evaluation.isCorrect) {
        correctCount++;
      }
      totalAccuracy += evaluation.accuracy;
    });
    
    const averageAccuracy = scaleEvaluations.length > 0 ? Math.round(totalAccuracy / scaleEvaluations.length) : 0;
    const correctRate = Math.round((correctCount / scaleSteps.length) * 100);
    
    sessionResults = {
      correctCount: correctCount,
      totalCount: scaleSteps.length,
      averageAccuracy: averageAccuracy,
      averageTime: 0, // 今回は時間測定なし
      isCompleted: true
    };
    
    // 最小限の結果ログ
    console.log(`🎯 結果: ${correctCount}/${scaleSteps.length}正解 (${correctRate}%) 平均精度${averageAccuracy}%`);
    
    // 前回の結果として保存（再挑戦時表示用）
    if (scaleEvaluations.length > 0) {
      previousEvaluations = [...scaleEvaluations];
    }
  }

  // ステータスメッセージ取得
  function getStatusMessage() {
    switch (trainingPhase) {
      case 'setup':
        if (isSamplerLoading || !sampler) {
          return '🎵 音源読み込み中...';
        } else {
          return '🎤 マイク準備完了 - トレーニング開始可能';
        }
      case 'listening':
        return '🎵 基音再生中...';
      case 'waiting':
        return '⏳ 間もなく開始...';
      case 'guiding':
        return '🎙️ ガイドに合わせてドレミファソラシドを歌ってください';
      case 'results':
        return '🎉 採点結果';
      default:
        return '🔄 準備中...';
    }
  }

  // 表示用の評価データを取得
  function getDisplayEvaluations() {
    // 現在のセッションに評価データがある場合は現在のデータを表示
    if (scaleEvaluations.length > 0) {
      return scaleEvaluations;
    }
    // 現在のセッションにデータがない場合は前回の結果を表示
    if (previousEvaluations.length > 0) {
      return previousEvaluations;
    }
    return [];
  }

  // マイクテストページへの誘導（SvelteKit goto使用）
  function goToMicrophoneTest() {
    goto(`${base}/microphone-test`);
  }

  // ホームページに戻る（SvelteKit goto使用）
  function goHome() {
    goto(`${base}/`);
  }

  // Tone.jsサンプラー初期化（Salamander Grand Piano - 最適化版）
  async function initializeSampler() {
    try {
      isSamplerLoading = true;
      
      // AudioContextは初回再生時に起動（安全なアプローチ）
      
      // Salamander Grand Piano C4音源からピッチシフト（最適化設定）
      sampler = new Tone.Sampler({
        urls: {
          'C4': 'C4.mp3',
        },
        baseUrl: `${base}/audio/piano/`,
        release: 1.5, // リリース時間最適化
        volume: 20, // テスト用: 極端に大きい値で変化を確認
        onload: () => {
          isSamplerLoading = false;
        },
        onerror: (error) => {
          console.error('❌ Salamander Piano音源読み込みエラー:', error);
          isSamplerLoading = false;
        }
      }).toDestination();
      
      // デバイス判定（調査用）
      const isIPhone = /iPhone/.test(navigator.userAgent);
      const isIPad = /iPad/.test(navigator.userAgent);
      const isIOS = isIPhone || isIPad;
      
      // デバイス情報ログ出力
      if (isIPad) {
        console.log('🔍 [RandomTraining] iPad検出:', navigator.userAgent);
      } else if (isIPhone) {
        console.log('🔍 [RandomTraining] iPhone検出:', navigator.userAgent);
      } else {
        console.log('🔍 [RandomTraining] その他デバイス検出:', navigator.userAgent);
      }
      
      // 標準音量設定（全デバイス共通）
      // sampler.volume.value = -6; // 標準: -6dB ← コメントアウト: 初期化時の volume: 20 を維持
      console.log('🔊 [RandomTraining] 音量設定維持: 20dB');
      
    } catch (error) {
      console.error('サンプラー初期化エラー:', error);
      isSamplerLoading = false;
    }
  }
  
  // マイク許可状態確認（取得はしない）
  async function checkExistingMicrophonePermission() {
    try {
      // Permissions API でマイク許可状態を確認（ダイアログは出ない）
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
      
      if (permissionStatus.state === 'granted') {
        // 既に許可済みの場合のみストリーム取得
        await checkMicrophonePermission();
      } else {
        // 未許可の場合はエラー画面表示
        microphoneState = 'denied';
      }
    } catch (error) {
      // Permissions API 未対応の場合は従来の方法
      microphoneState = 'denied';
    }
  }

  // 採点エンジン初期化
  function initializeScoringEngine() {
    try {
      scoringEngine = new EnhancedScoringEngine();
      logger.info('[RandomTraining] 採点エンジン初期化完了');
    } catch (error) {
      logger.error('[RandomTraining] 採点エンジン初期化エラー:', error);
    }
  }
  
  // 採点エンジンにデータを送信
  function updateScoringEngine(frequency, note) {
    if (!scoringEngine || !isGuideAnimationActive) return;
    
    const activeStepIndex = currentScaleIndex - 1;
    if (activeStepIndex < 0 || activeStepIndex >= scaleSteps.length) return;
    
    const expectedFrequency = calculateExpectedFrequency(currentBaseFrequency, activeStepIndex);
    
    // 採点エンジンに音程データを送信
    const attemptData = {
      baseFrequency: currentBaseFrequency,
      targetFrequency: expectedFrequency,
      detectedFrequency: frequency,
      detectedNote: note,
      volume: currentVolume,
      timestamp: Date.now(),
      scaleIndex: activeStepIndex,
      scaleName: scaleSteps[activeStepIndex].name
    };
    
    try {
      scoringEngine.processAttempt(attemptData);
    } catch (error) {
      logger.error('[RandomTraining] 採点エンジンエラー:', error);
    }
  }
  
  // 最終採点結果を取得
  function generateFinalScoring() {
    if (!scoringEngine) {
      logger.error('[RandomTraining] 採点エンジンが初期化されていません');
      // フォールバック: テストデータで表示
      generateTestScoreData();
      return;
    }
    
    try {
      const results = scoringEngine.generateDetailedReport();
      
      // スコアデータ更新
      currentScoreData = {
        totalScore: results.totalScore,
        grade: results.grade,
        componentScores: results.componentScores
      };
      
      // 音程データ更新（安全な参照）
      if (results.intervalAnalysis && results.intervalAnalysis.masteryLevels) {
        intervalData = Object.entries(results.intervalAnalysis.masteryLevels).map(([type, mastery]) => ({
          type,
          mastery: Math.round(mastery),
          attempts: results.intervalAnalysis.attemptCounts?.[type] || 0,
          accuracy: results.intervalAnalysis.accuracyRates?.[type] || 0
        }));
      } else {
        console.warn('⚠️ [RandomTraining] intervalAnalysis.masteryLevels が未定義です');
        intervalData = [];
      }
      
      // 一貫性データ更新（安全な参照）
      if (results.consistencyHistory && Array.isArray(results.consistencyHistory)) {
        consistencyData = results.consistencyHistory.map((score, index) => ({
          score: Math.round(score),
          timestamp: Date.now() - (results.consistencyHistory.length - index) * 1000
        }));
      } else {
        console.warn('⚠️ [RandomTraining] consistencyHistory が未定義または配列ではありません');
        consistencyData = [];
      }
      
      // フィードバックデータ更新（安全な参照）
      feedbackData = results.feedback || {
        primary: '採点結果を生成中です...',
        detailed: [],
        suggestions: []
      };
      
      // セッション統計更新（安全な参照）
      sessionStatistics = {
        totalAttempts: results.totalAttempts || 0,
        successRate: results.successRate || 0,
        averageScore: results.totalScore || 0,
        bestScore: Math.max(results.totalScore || 0, sessionStatistics.bestScore || 0),
        sessionDuration: Math.round((Date.now() - sessionStatistics.sessionStart) / 60000) || 0,
        streakCount: results.streak || 0,
        fatigueLevel: results.fatigueLevel || 'normal',
        mostDifficultInterval: results.mostDifficultInterval || '-',
        mostSuccessfulInterval: results.mostSuccessfulInterval || '-',
        averageResponseTime: results.averageResponseTime || 0
      };
      
      logger.info('[RandomTraining] 採点結果生成完了:', currentScoreData);
      
    } catch (error) {
      logger.error('[RandomTraining] 採点結果生成エラー:', error);
    }
  }
  
  // テストデータ生成（フォールバック）
  function generateTestScoreData() {
    logger.info('[RandomTraining] テストデータで採点結果を生成');
    
    // テストスコアデータ
    currentScoreData = {
      totalScore: 78,
      grade: 'B+',
      componentScores: {
        pitchAccuracy: 82,
        recognitionSpeed: 75,
        intervalMastery: 80,
        directionAccuracy: 85,
        consistency: 70
      }
    };
    
    // テスト音程データ
    intervalData = [
      { type: 'unison', mastery: 95, attempts: 8, accuracy: 98 },
      { type: 'major_second', mastery: 82, attempts: 8, accuracy: 85 },
      { type: 'major_third', mastery: 78, attempts: 8, accuracy: 80 },
      { type: 'perfect_fourth', mastery: 65, attempts: 8, accuracy: 68 },
      { type: 'perfect_fifth', mastery: 88, attempts: 8, accuracy: 90 },
      { type: 'major_sixth', mastery: 72, attempts: 8, accuracy: 75 },
      { type: 'major_seventh', mastery: 58, attempts: 8, accuracy: 62 },
      { type: 'octave', mastery: 92, attempts: 8, accuracy: 94 }
    ];
    
    // テスト一貫性データ
    consistencyData = [
      { score: 65, timestamp: Date.now() - 420000 },
      { score: 72, timestamp: Date.now() - 360000 },
      { score: 68, timestamp: Date.now() - 300000 },
      { score: 75, timestamp: Date.now() - 240000 },
      { score: 78, timestamp: Date.now() - 180000 },
      { score: 82, timestamp: Date.now() - 120000 },
      { score: 80, timestamp: Date.now() - 60000 },
      { score: 85, timestamp: Date.now() }
    ];
    
    // テストフィードバックデータ
    feedbackData = {
      type: 'improvement',
      primary: '良い進歩が見られます！',
      summary: '音程の認識精度が向上しています。特に完全5度とオクターブの習得度が高く、基本的な音感が身についてきています。',
      details: [
        { category: 'strengths', text: 'ユニゾンとオクターブの認識がほぼ完璧です' },
        { category: 'strengths', text: '完全5度の安定性が優秀です' },
        { category: 'improvements', text: '完全4度の練習をもう少し増やしましょう' },
        { category: 'improvements', text: '長7度の認識精度を向上させましょう' },
        { category: 'tips', text: '4度は「ソーファー」の音程です' },
        { category: 'practice', text: '毎日15分の継続練習を心がけましょう' }
      ],
      nextSteps: [
        '完全4度の集中練習を行いましょう',
        '連続チャレンジモードで実践練習を',
        '1日15分の継続練習を心がけましょう'
      ],
      motivation: '継続は力なり！あなたの相対音感は確実に向上しています！'
    };
    
    // テストセッション統計
    sessionStatistics = {
      totalAttempts: 32,
      successRate: 68.8,
      averageScore: 78,
      bestScore: 85,
      sessionDuration: 8,
      streakCount: 4,
      fatigueLevel: 'normal',
      mostDifficultInterval: '完全4度',
      mostSuccessfulInterval: 'ユニゾン',
      averageResponseTime: 2.1,
      sessionStart: Date.now() - 480000 // 8分前
    };
    
    logger.info('[RandomTraining] テスト採点結果生成完了');
  }
  
  // タブ切り替え
  function switchTab(tab) {
    activeTab = tab;
  }
  
  // 統合採点データ生成（完全版・デバッグエリア品質適用）
  function generateUnifiedScoreData() {
    if (!noteResultsForDisplay || noteResultsForDisplay.length === 0) {
      console.warn('[UnifiedScore] noteResultsForDisplay が空です');
      return;
    }
    
    // 測定成功率計算
    const measuredNotes = noteResultsForDisplay.filter(note => note.accuracy !== 'notMeasured').length;
    const totalNotes = noteResultsForDisplay.length;
    
    // 平均精度計算
    const validAccuracies = noteResultsForDisplay
      .filter(note => note.accuracy !== 'notMeasured' && typeof note.accuracy === 'number')
      .map(note => note.accuracy);
    const averageAccuracy = validAccuracies.length > 0 
      ? Math.round(validAccuracies.reduce((sum, acc) => sum + acc, 0) / validAccuracies.length)
      : 0;
    
    // 基音情報
    const baseNote = currentBaseNote || 'Unknown';
    const baseFrequency = currentBaseFrequency || 0;

    // noteResultsForDisplayを正しい形式に変換
    const convertedNoteResults = noteResultsForDisplay.map(note => ({
      name: note.name,
      note: note.note || note.name,
      frequency: note.targetFreq || note.expectedFrequency,
      detectedFrequency: note.detectedFreq,
      cents: note.cents,
      grade: calculateNoteGrade(note.cents),
      targetFreq: note.targetFreq,
      diff: note.diff
    }));
    
    // localStorage から既存のセッション履歴を取得
    const currentProgress = $trainingProgress;
    const allSessionHistory = currentProgress?.sessionHistory || [];
    
    // 現在のセッション結果を追加
    const currentSessionResult = {
      timestamp: new Date(),
      baseNote: baseNote,
      baseFrequency: baseFrequency,
      noteResults: convertedNoteResults,
      measuredNotes: measuredNotes,
      accuracy: averageAccuracy,
      grade: calculateSessionGrade(noteResultsForDisplay)
    };
    
    // 統合スコアデータを作成（localStorage履歴 + 現在セッション）
    const sessionHistory = [...allSessionHistory, currentSessionResult];
    currentUnifiedScoreData = {
      mode: 'random',
      timestamp: new Date(),
      duration: 60, // 1セッション約60秒想定
      totalNotes: totalNotes,
      measuredNotes: measuredNotes,
      averageAccuracy: averageAccuracy,
      baseNote: baseNote,
      baseFrequency: baseFrequency,
      noteResults: convertedNoteResults,
      distribution: calculateGradeDistribution(noteResultsForDisplay),
      // セッション履歴：既存履歴 + 現在のセッション
      sessionHistory: sessionHistory,
      // 統合グレード算出
      unifiedGrade: calculateUnifiedGrade(sessionHistory)
    };
    
    console.log('[UnifiedScore] 統合採点データ生成完了（完全版）:', currentUnifiedScoreData);
    
    // localStorage にセッション結果を保存
    saveSessionToStorage();
  }
  
  // セッション結果をlocalStorageに保存
  async function saveSessionToStorage() {
    if (!noteResultsForDisplay || noteResultsForDisplay.length === 0) {
      console.warn('📊 [SessionStorage] 保存データなし');
      return;
    }
    
    try {
      console.log('📊 [SessionStorage] セッション結果保存開始');
      
      // noteResultsForDisplayを正しい形式に変換
      const convertedNoteResults = noteResultsForDisplay.map(note => ({
        name: note.name,
        cents: note.cents,
        targetFreq: note.targetFreq || note.expectedFrequency,
        detectedFreq: note.detectedFreq,
        diff: note.diff,
        accuracy: typeof note.accuracy === 'number' ? note.accuracy : 0
      }));
      
      // セッション継続時間を計算（開始時刻からの経過時間）
      const duration = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1000) : 60;
      
      // 基音情報
      const baseNote = $nextBaseNote; // 次の基音ストアから取得
      const baseName = $nextBaseName; // 次の基音名ストアから取得
      
      // saveSessionResult に渡す
      const success = await saveSessionResult(
        convertedNoteResults,
        duration,
        baseNote,
        baseName
      );
      
      if (success) {
        console.log('📊 [SessionStorage] セッション結果保存完了');
        console.log('📊 [SessionStorage] 保存後の状況:', {
          currentSession: $currentSessionId,
          totalSessions: $sessionHistory.length,
          isCompleted: $isCompleted,
          nextBaseNote: $nextBaseNote,
          nextBaseName: $nextBaseName
        });
      } else {
        console.error('📊 [SessionStorage] セッション結果保存失敗');
      }
    } catch (error) {
      console.error('📊 [SessionStorage] セッション保存エラー:', error);
    }
  }

  // 実際のトレーニングデータから追加採点データを生成
  async function generateEnhancedScoringData() {
    try {
      // EnhancedScoringEngine を使用してスコアデータを生成
      if (scoringEngine) {
        // sessionHistoryデータをEnhancedScoringEngineに渡す
        const currentSessionHistory = $sessionHistory || [];
        
        // 各セッションの各音程データをanalyzePerformanceで処理
        for (const [sessionIndex, session] of currentSessionHistory.entries()) {
          if (session.noteResults && session.noteResults.length > 0) {
            
            const baseFreq = session.baseFrequency || 262;
            
            // 各音程データを個別に分析
            for (const note of session.noteResults) {
              if (note.detectedFreq && note.targetFreq) {
                await scoringEngine.analyzePerformance({
                  baseFreq: baseFreq,
                  targetFreq: note.targetFreq,
                  detectedFreq: note.detectedFreq,
                  responseTime: 2000, // デフォルト反応時間
                  volume: 50,
                  harmonicCorrection: null
                });
              }
            }
          }
        }
        
        const results = scoringEngine.generateDetailedReport();
        
        // スコアデータ更新
        currentScoreData = {
          totalScore: results.totalScore || 0,
          grade: results.grade || 'C',
          componentScores: results.componentScores || {
            accuracy: 0,
            speed: 0,
            consistency: 0
          }
        };
        
        // 音程データ更新（安全な参照）
        if (results.intervalAnalysis && results.intervalAnalysis.masteryLevels) {
          intervalData = Object.entries(results.intervalAnalysis.masteryLevels).map(([type, mastery]) => ({
            type,
            mastery: Math.round(mastery),
            attempts: results.intervalAnalysis.attemptCounts?.[type] || 0,
            accuracy: Math.round(mastery * 0.9) // masteryから精度を推定
          }));
        } else {
          // 実際のトレーニングデータから音程分析を生成
          intervalData = generateIntervalDataFromResults(noteResultsForDisplay);
        }
        
        // 一貫性データ更新
        if (results.consistencyHistory && Array.isArray(results.consistencyHistory)) {
          consistencyData = results.consistencyHistory.map((score, index) => ({
            score: Math.round(score),
            timestamp: Date.now() - (results.consistencyHistory.length - index) * 1000
          }));
        } else {
          // 実際のデータから一貫性履歴を生成
          consistencyData = generateConsistencyDataFromResults(noteResultsForDisplay);
        }
        
        // フィードバックデータ更新（8セッション完了時はカスタムメッセージを優先）
        feedbackData = generateFeedbackFromResults(noteResultsForDisplay) || results.feedback;
        
        // 技術分析結果データ更新（8セッション完了時のみ）
        console.log('🎯 [generateEnhancedScoringData] 技術分析結果生成を開始');
        console.log('🎯 [generateEnhancedScoringData] results:', results);
        technicalFeedbackData = generateTechnicalFeedbackFromEnhancedEngine(results);
        console.log('🎯 [generateEnhancedScoringData] technicalFeedbackData結果:', technicalFeedbackData);
        
        // セッション統計更新
        sessionStatistics = {
          totalAttempts: results.totalAttempts || noteResultsForDisplay.length,
          successRate: results.successRate || (noteResultsForDisplay.filter(n => n.accuracy !== 'notMeasured').length / noteResultsForDisplay.length * 100),
          averageScore: results.totalScore || currentUnifiedScoreData?.averageAccuracy || 0,
          bestScore: Math.max(results.totalScore || 0, sessionStatistics.bestScore || 0),
          sessionDuration: Math.round(60), // 1セッション約60秒
          streakCount: results.streak || 0,
          fatigueLevel: results.fatigueLevel || 'normal',
          mostDifficultInterval: results.mostDifficultInterval || '未特定',
          mostSuccessfulInterval: results.mostSuccessfulInterval || '未特定',
          averageResponseTime: results.averageResponseTime || 2.5,
          sessionStart: Date.now() - 60000 // 1分前開始と仮定
        };
        
      } else {
        // scoringEngine が無い場合は実際のデータから生成
        generateFallbackEnhancedData();
      }
      
      console.log('[EnhancedScoring] 追加採点データ生成完了');
      
    } catch (error) {
      console.error('[EnhancedScoring] データ生成エラー:', error);
      generateFallbackEnhancedData();
    }
  }

  // フォールバック用簡易データ生成
  function generateFallbackEnhancedData() {
    const measuredNotes = noteResultsForDisplay.filter(n => n.accuracy !== 'notMeasured');
    const averageAccuracy = currentUnifiedScoreData?.averageAccuracy || 0;
    
    // 簡易スコアデータ
    currentScoreData = {
      totalScore: Math.round(averageAccuracy * 0.8), // 精度ベース
      grade: averageAccuracy >= 90 ? 'A' : averageAccuracy >= 80 ? 'B' : averageAccuracy >= 70 ? 'C' : 'D',
      componentScores: {
        accuracy: averageAccuracy,
        speed: 85, // 固定値
        consistency: Math.max(60, averageAccuracy - 10)
      }
    };

    // 簡易音程データ
    intervalData = generateIntervalDataFromResults(noteResultsForDisplay);
    
    // 簡易一貫性データ
    consistencyData = generateConsistencyDataFromResults(noteResultsForDisplay);
    
    // 簡易フィードバック
    feedbackData = generateFeedbackFromResults(noteResultsForDisplay);
    
    // 簡易統計
    sessionStatistics = {
      totalAttempts: noteResultsForDisplay.length,
      successRate: (measuredNotes.length / noteResultsForDisplay.length) * 100,
      averageScore: averageAccuracy,
      bestScore: averageAccuracy,
      sessionDuration: 60,
      streakCount: 0,
      fatigueLevel: 'normal',
      mostDifficultInterval: '未分析',
      mostSuccessfulInterval: '未分析',
      averageResponseTime: 2.5,
      sessionStart: Date.now() - 60000
    };
  }

  // 実際のトレーニング結果から音階別データを生成
  function generateIntervalDataFromResults(results) {
    // 音階名と音程名の対応
    const scaleData = [
      { scale: 'ド', interval: 'unison', intervalName: 'ユニゾン' },
      { scale: 'レ', interval: 'major_second', intervalName: '長2度' },
      { scale: 'ミ', interval: 'major_third', intervalName: '長3度' },
      { scale: 'ファ', interval: 'perfect_fourth', intervalName: '完全4度' },
      { scale: 'ソ', interval: 'perfect_fifth', intervalName: '完全5度' },
      { scale: 'ラ', interval: 'major_sixth', intervalName: '長6度' },
      { scale: 'シ', interval: 'major_seventh', intervalName: '長7度' },
      { scale: 'ド（高）', interval: 'octave', intervalName: 'オクターブ' }
    ];
    
    return scaleData.map((item, index) => {
      // 実際の結果から該当する音階のデータを取得
      const noteResult = results.find(r => r.targetNote && r.targetNote.includes(item.scale)) || results[index];
      
      if (noteResult && noteResult.accuracy !== 'notMeasured') {
        // 実際の誤差をセント単位で計算（精度から逆算）
        const accuracyValue = parseFloat(noteResult.accuracy) || 0;
        const errorCents = Math.round((100 - accuracyValue) * 0.5); // 簡易的な変換
        
        return {
          type: item.interval,
          scale: item.scale,
          intervalName: item.intervalName,
          attempts: 1, // 1セッションでは1回
          averageError: errorCents,
          accuracy: accuracyValue
        };
      } else {
        // 測定できなかった場合
        return {
          type: item.interval,
          scale: item.scale,
          intervalName: item.intervalName,
          attempts: 0,
          averageError: null,
          accuracy: 0
        };
      }
    });
  }

  // localStorage セッション履歴から音階別データを生成（8セッション完了時用）
  function generateIntervalDataFromSessionHistory(sessionHistory) {
    if (!sessionHistory || !Array.isArray(sessionHistory)) {
      console.warn('⚠️ [RandomTraining] sessionHistory が無効です');
      return [];
    }

    // 音階データの定義（ドレミファソラシド↑の8音階）
    const scaleData = [
      { type: 'unison', scale: 'ド', intervalName: 'ユニゾン', noteIndex: 0 },
      { type: 'major_second', scale: 'レ', intervalName: '長2度', noteIndex: 1 },
      { type: 'major_third', scale: 'ミ', intervalName: '長3度', noteIndex: 2 },
      { type: 'perfect_fourth', scale: 'ファ', intervalName: '完全4度', noteIndex: 3 },
      { type: 'perfect_fifth', scale: 'ソ', intervalName: '完全5度', noteIndex: 4 },
      { type: 'major_sixth', scale: 'ラ', intervalName: '長6度', noteIndex: 5 },
      { type: 'major_seventh', scale: 'シ', intervalName: '長7度', noteIndex: 6 },
      { type: 'octave', scale: 'ド（高）', intervalName: 'オクターブ', noteIndex: 7 }
    ];

    const intervalStats = {};

    // 各音階の統計を初期化
    scaleData.forEach(item => {
      intervalStats[item.type] = {
        type: item.type,
        scale: item.scale,
        intervalName: item.intervalName,
        attempts: 0,
        successCount: 0,
        accuracySum: 0,
        accuracyValues: [],
        errorValues: []  // セント単位の誤差を記録
      };
    });

    // セッション履歴を解析
    sessionHistory.forEach(session => {
      if (!session.noteResults || !Array.isArray(session.noteResults)) {
        return;
      }

      session.noteResults.forEach((noteResult, noteIndex) => {
        if (noteIndex >= scaleData.length) return;

        const intervalType = scaleData[noteIndex].type;
        const stats = intervalStats[intervalType];

        stats.attempts++;

        if (noteResult.accuracy !== 'notMeasured' && typeof noteResult.accuracy === 'number') {
          stats.accuracyValues.push(noteResult.accuracy);
          stats.accuracySum += noteResult.accuracy;
          
          // 精度から誤差セントを計算（簡易的な変換）
          const errorCents = Math.round((100 - noteResult.accuracy) * 0.5);
          stats.errorValues.push(errorCents);
          
          // 70%以上を成功とみなす
          if (noteResult.accuracy >= 70) {
            stats.successCount++;
          }
        }
      });
    });

    // 統計からintervalDataを生成
    return scaleData.map(item => {
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

      const averageAccuracy = stats.accuracyValues.length > 0 
        ? Math.round(stats.accuracySum / stats.accuracyValues.length)
        : 0;
      
      const averageError = stats.errorValues.length > 0
        ? Math.round(stats.errorValues.reduce((a, b) => a + b, 0) / stats.errorValues.length)
        : null;
      
      const mastery = stats.accuracyValues.length > 0
        ? Math.round((stats.successCount / stats.accuracyValues.length) * 100)
        : 0;

      return {
        type: item.type,
        scale: item.scale,
        intervalName: item.intervalName,
        mastery: mastery,
        attempts: stats.attempts,
        averageError: averageError,
        accuracy: averageAccuracy
      };
    });
  }

  // 実際のトレーニング結果から一貫性データを生成
  function generateConsistencyDataFromResults(results) {
    const baseScore = currentUnifiedScoreData?.averageAccuracy || 70;
    return Array.from({length: 8}, (_, i) => ({
      score: Math.max(30, Math.min(100, baseScore + (Math.random() - 0.5) * 20)),
      timestamp: Date.now() - (8 - i) * 7500 // 7.5秒間隔
    }));
  }

  // 実際のトレーニング結果からフィードバックを生成
  function generateFeedbackFromResults(results) {
    const measuredCount = results.filter(n => n.accuracy !== 'notMeasured').length;
    const averageAccuracy = currentUnifiedScoreData?.averageAccuracy || 0;
    
    // モード別完了判定
    const mode = 'random'; // 現在はランダムモード固定、将来的にはpropsから取得
    const requiredSessions = mode === 'chromatic' ? 12 : 8;
    const currentSessionHistory = $sessionHistory || [];
    const completedSessions = currentSessionHistory.length;
    
    // 基本オブジェクトを常に生成（1442行の条件文を満たすため）
    const baseFeedback = {
      type: 'info',
      categories: [
        {
          name: '音程精度',
          icon: 'Target',
          score: averageAccuracy,
          message: `${averageAccuracy}%の精度で音程を捉えています`
        },
        {
          name: '測定成功率',
          icon: 'Mic',
          score: Math.round((measuredCount / results.length) * 100),
          message: `${results.length}音中${measuredCount}音を正常に測定`
        }
      ]
    };
    
    // セッション完了前はS-E級メッセージなしの基本オブジェクトのみ
    if (completedSessions < requiredSessions) {
      return baseFeedback;
    }
    
    // S-E級判定に基づいたメッセージ生成（完了後のみ）
    let type, primary, summary, icon;
    
    // unifiedGradeから適切なメッセージを生成（統計値を含む）
    const grade = currentUnifiedScoreData?.unifiedGrade || 'E';
    const totalSessions = currentSessionHistory.length;
    
    // 統計値の計算
    let excellentCount = 0, goodCount = 0, passCount = 0;
    currentSessionHistory.forEach(session => {
      if (session.grade === 'excellent') excellentCount++;
      else if (session.grade === 'good') goodCount++;
      else if (session.grade === 'pass') passCount++;
    });
    
    const excellentRate = totalSessions > 0 ? Math.round((excellentCount / totalSessions) * 100) : 0;
    const goodRate = totalSessions > 0 ? Math.round(((excellentCount + goodCount + passCount) / totalSessions) * 100) : 0;
    const passRate = totalSessions > 0 ? Math.round(((excellentCount + goodCount + passCount) / totalSessions) * 100) : 0;
    
    switch (grade) {
      case 'S':
        type = 'excellent';
        primary = '音楽家レベルの相対音感を達成！';
        summary = `優秀率${excellentRate}%超えの実力を証明されました。`;
        icon = 'Trophy';
        break;
      case 'A':
        type = 'excellent';
        primary = 'エキスパートレベル到達！';
        summary = `優秀率${excellentRate}%の安定した音感能力です。`;
        icon = 'Crown';
        break;
      case 'B':
        type = 'improvement';
        primary = 'プロフィシエント級達成！';
        summary = `良好率${goodRate}%の確実な進歩を示しています。`;
        icon = 'Star';
        break;
      case 'C':
        type = 'improvement';
        primary = 'アドバンス級到達！';
        summary = `合格率${passRate}%で着実に成長中です。`;
        icon = 'Award';
        break;
      case 'D':
        type = 'practice';
        primary = '継続練習で必ず上達！';
        summary = `現在の合格率${passRate}%から目標70%へ向けて練習を続けましょう。`;
        icon = 'Target';
        break;
      case 'E':
      default:
        type = 'encouragement';
        primary = 'E級ビギナー';
        summary = '練習開始段階です。継続的な練習で必ず上達します。';
        icon = 'TrendingUp';
        break;
    }
    
    // 完了時：baseFeedbackにS-E級メッセージを追加
    return {
      ...baseFeedback,
      type,
      primary,
      summary
    };
  }
  
  // 技術分析結果用のフィードバック生成（8セッション完了時のみ）
  function generateTechnicalFeedbackFromEnhancedEngine(enhancedResults) {
    // モード別完了判定
    const mode = 'random'; // 現在はランダムモード固定、将来的にはpropsから取得
    const requiredSessions = mode === 'chromatic' ? 12 : 8;
    const currentSessionHistory = $sessionHistory || [];
    const completedSessions = currentSessionHistory.length;
    
    // セッション完了前は技術分析結果なし
    if (completedSessions < requiredSessions || !enhancedResults) {
      return null;
    }
    
    // EnhancedScoringEngineの実装済みimprovements配列を活用
    const improvements = enhancedResults.improvements || [];
    const statistics = enhancedResults.detailed?.statistics || {};
    
    // 技術分析データを整理（アイコン度合い表示）
    const technicalAnalysis = [];
    
    // 正しいフィールドを使用して値を取得
    let intervalAccuracy = 0;
    let directionAccuracy = 0;
    
    if (enhancedResults.detailed?.intervals) {
      // 音程精度: 平均精度を計算
      const intervalsData = enhancedResults.detailed.intervals;
      if (intervalsData.totalAnalyses > 0) {
        let totalAccuracy = 0;
        let totalAttempts = 0;
        
        for (const [intervalType, data] of Object.entries(intervalsData.masteryLevels)) {
          if (data.attempts > 0) {
            totalAccuracy += data.averageAccuracy * data.attempts;
            totalAttempts += data.attempts;
          }
        }
        
        intervalAccuracy = totalAttempts > 0 ? (totalAccuracy / totalAttempts) : 0;
      }
    }
    
    if (enhancedResults.detailed?.directions) {
      // 方向性精度: 平均精度を計算
      const directionsData = enhancedResults.detailed.directions;
      if (directionsData.totalAnalyses > 0) {
        let totalAccuracy = 0;
        let totalAttempts = 0;
        
        for (const [directionType, data] of Object.entries(directionsData.masteryData)) {
          if (data.attempts > 0) {
            totalAccuracy += data.averageAccuracy * data.attempts;
            totalAttempts += data.attempts;
          }
        }
        
        directionAccuracy = totalAttempts > 0 ? (totalAccuracy / totalAttempts) : 0;
      }
    }
    
    const isIntervalGood = intervalAccuracy >= 70;
    const isDirectionGood = directionAccuracy >= 80;
    
    // 技術分析結果のフォーマット（基準値と説明付き）
    technicalAnalysis.push({
      category: 'improvements',
      text: `音程精度: ${Math.round(intervalAccuracy)}%　（音の高さを捉える正確性　目標基準：70〜85%）`
    });
    
    technicalAnalysis.push({
      category: 'improvements',
      text: `方向性: ${Math.round(directionAccuracy)}%　（音程の上下判断の精度　目標基準：80〜90%）`
    });
    
    // 📝 一貫性評価について
    // 従来の一貫性評価（セッション間比較）は以下の理由で削除：
    // 1. 基音変更により同一音程でも絶対周波数が異なる
    // 2. 相対音感では基音との関係性が重要（異なる基音=別タスク）
    // 3. 技術誤差と真のパフォーマンス変動が区別できない
    // 
    // 将来実装予定: 3タブ統合評価（技術分析・音程別精度・一貫性グラフ）
    
    // アドバイス（改善提案のメッセージ部分）
    const adviceItems = improvements.map(imp => ({
      category: 'tips',
      text: imp.message
    }));
    
    // 練習提案（改善提案のアクション部分）
    const practiceItems = improvements.flatMap(imp => 
      (imp.actions || []).map(action => ({
        category: 'practice',
        text: action
      }))
    );
    
    const finalDetails = [...technicalAnalysis, ...adviceItems, ...practiceItems];
    
    return {
      type: 'info',
      primary: '詳細分析結果',
      summary: '音程精度・一貫性・方向性の総合分析',
      details: technicalAnalysis  // アドバイスと練習提案を除外し、技術分析のみ表示
    };
  }
  
  // 評価関数は統一されたユーティリティからインポートして使用
  

  // 初期化
  onMount(async () => {
    // **最優先**: マイクテスト完了フラグ確認（localStorage作成前）
    const micTestCompleted = localStorage.getItem('mic-test-completed');
    
    if (!micTestCompleted) {
      // マイクテスト未完了 → 準備画面表示（localStorage作成しない）
      console.log('🚫 [RandomTraining] マイクテスト未完了 - 準備画面表示');
      checkExistingMicrophonePermission();
      return;
    }
    
    // localStorage 初期化（マイクテスト完了時のみ）
    console.log('📊 [SessionStorage] セッション管理初期化開始');
    try {
      const success = await loadProgress();
      if (success) {
        console.log('📊 [SessionStorage] セッション進行状況の読み込み完了');
        console.log('📊 [SessionStorage] 現在のセッション:', $currentSessionId, '/ 8');
        console.log('📊 [SessionStorage] 次の基音:', $nextBaseNote, '(', $nextBaseName, ')');
        console.log('📊 [SessionStorage] 完了状況:', $isCompleted ? '8セッション完了' : `残り${$remainingSessions}セッション`);
        
        // **8セッション完了後の新サイクル自動開始チェック**
        if ($isCompleted) {
          console.log('🔄 [SessionStorage] 8セッション完了検出 - 新サイクル開始処理');
          const newCycleStarted = await startNewCycleIfCompleted();
          if (newCycleStarted) {
            console.log('✅ [SessionStorage] 新サイクル開始完了 - セッション1/8から再開');
          } else {
            console.warn('⚠️ [SessionStorage] 新サイクル開始処理が失敗');
          }
        }
        
        // **リロード検出・セッション中断対応**: セッション進行中のリロードを検出
        if ($currentSessionId > 1 && !$isCompleted) {
          console.warn('🔄 [SessionStorage] セッション途中でのリロード検出 - セッション1から再開');
          console.warn('🔄 [SessionStorage] 現在:', $currentSessionId, 'セッション目 → ダイレクトアクセス誘導');
          
          // localStorage完全リセット（セッション中断扱い）
          const { SessionStorageManager } = await import('$lib/utils/SessionStorageManager.ts');
          const manager = SessionStorageManager.getInstance();
          
          // localStorage削除
          localStorage.removeItem('random-training-progress');
          localStorage.removeItem('random-training-progress-backup');
          
          // ストア状態もリセット
          const { resetProgress } = await import('$lib/stores/sessionStorage.ts');
          await resetProgress();
          
          console.log('🔄 [SessionStorage] localStorage + ストア状態完全リセット完了');
          
          // ダイレクトアクセス状態に強制設定（マイクテスト誘導）
          checkExistingMicrophonePermission();
          return; // マイクテスト誘導のため処理終了
        }
      } else {
        console.log('📊 [SessionStorage] 新規セッション開始');
      }
    } catch (error) {
      console.error('📊 [SessionStorage] 初期化エラー:', error);
    }
    
    // 音源初期化
    initializeSampler();
    
    // 採点エンジン初期化
    initializeScoringEngine();
    
    // マイクテストページから来た場合は許可済みとして扱う
    if ($page.url.searchParams.get('from') === 'microphone-test') {
      console.log('🎤 [RandomTraining] マイクテストページからの遷移を検出');
      
      // URLパラメータを削除（お気に入り登録時の問題回避）
      const url = new URL(window.location);
      url.searchParams.delete('from');
      window.history.replaceState({}, '', url);
      
      // マイクテストページから来た場合は許可済みとして扱い、ストリームを準備
      microphoneState = 'granted';
      trainingPhase = 'setup';
      console.log('🎤 [RandomTraining] microphoneState="granted", trainingPhase="setup" に設定');
      
      // AudioManagerリソースの即座取得（基音再生のため）
      if (!mediaStream) {
        console.log('🎤 [RandomTraining] AudioManagerリソース取得開始');
        try {
          const resources = await audioManager.initialize();
          audioContext = resources.audioContext;
          mediaStream = resources.mediaStream;
          sourceNode = resources.sourceNode;
          console.log('🎤 [RandomTraining] AudioManagerリソース取得完了');
        } catch (error) {
          console.warn('⚠️ AudioManagerリソース取得失敗（後で再試行）:', error);
        }
      }
      
      // PitchDetectorの明示的初期化（マイクテスト経由時）
      await new Promise(resolve => setTimeout(resolve, 300)); // DOM更新・参照取得待ち
      if (pitchDetectorComponent && pitchDetectorComponent.getIsInitialized && !pitchDetectorComponent.getIsInitialized()) {
        try {
          console.log('🎙️ [RandomTraining] PitchDetector初期化開始');
          
          // iPad対応: AudioManager健康チェック&再初期化
          const status = audioManager.getStatus();
          console.log('🔍 [RandomTraining] AudioManager状態:', status);
          
          if (!status.isInitialized || !status.mediaStreamActive) {
            console.log('🔄 [RandomTraining] AudioManager状態不良 - 再初期化実行');
            await audioManager.initialize();
          }
          
          await pitchDetectorComponent.initialize();
          console.log('✅ [RandomTraining] PitchDetector初期化完了');
        } catch (error) {
          console.warn('⚠️ PitchDetector初期化失敗:', error);
        }
      }
      
      // returnを削除 - PitchDetectorコンポーネントのレンダリングを許可
    } else {
      // ダイレクトアクセス時のみマイク許可状態確認
      await new Promise(resolve => setTimeout(resolve, 100));
      checkExistingMicrophonePermission();
    }
  });
  
  // PitchDetectorコンポーネントからのイベントハンドラー
  function handlePitchUpdate(event) {
    const { frequency, note, volume, rawVolume, clarity } = event.detail;
    
    // 初期値設定（生の値）
    let displayFrequency = frequency;
    let displayNote = note;
    
    // 表示は常に評価システムと同じ補正を適用
    if (trainingPhase === 'guiding' && isGuideAnimationActive && currentBaseFrequency > 0 && frequency > 0) {
      const correctedResult = getEvaluationCorrectedFrequency(frequency);
      if (correctedResult) {
        displayFrequency = correctedResult.frequency;
        displayNote = correctedResult.note;
      }
    }
    
    currentFrequency = displayFrequency;
    detectedNote = displayNote;
    currentVolume = volume;
    
    // 基音との相対音程を計算（補正後の値で）
    if (currentBaseFrequency > 0 && displayFrequency > 0) {
      pitchDifference = Math.round(1200 * Math.log2(displayFrequency / currentBaseFrequency));
    } else {
      pitchDifference = 0;
    }
    
    // ガイドアニメーション中の評価蓄積（元の周波数で実行）
    evaluateScaleStep(frequency, note);
    
    // 採点エンジンへのデータ送信
    if (scoringEngine && frequency > 0 && currentBaseFrequency > 0) {
      updateScoringEngine(frequency, note);
    }
  }

  // 評価システムと同じ補正を周波数表示に適用する関数
  function getEvaluationCorrectedFrequency(frequency) {
    if (!frequency || frequency <= 0 || !isGuideAnimationActive || !currentBaseFrequency) {
      return null;
    }
    
    // 【統一】音量チェック（評価システムと同じ）
    const minVolumeForDisplay = 25;
    if (currentVolume < minVolumeForDisplay) {
      return null; // ノイズ除外
    }
    
    // 現在ハイライト中のステップを取得
    const activeStepIndex = currentScaleIndex - 1;
    if (activeStepIndex < 0 || activeStepIndex >= scaleSteps.length) {
      return null;
    }
    
    // 期待周波数を計算
    const expectedFrequency = calculateExpectedFrequency(currentBaseFrequency, activeStepIndex);
    if (!expectedFrequency || expectedFrequency <= 0) {
      return null;
    }
    
    // 多段階オクターブ補正を適用
    const correctionResult = multiStageOctaveCorrection(frequency, expectedFrequency);
    const adjustedFrequency = correctionResult.correctedFrequency;
    
    // 周波数から音程名に変換
    const adjustedNote = frequencyToNote(adjustedFrequency);
    
    return {
      frequency: Math.round(adjustedFrequency),
      note: adjustedNote
    };
  }

  // 周波数から音程名に変換（PitchDetectorと同じロジック）
  function frequencyToNote(frequency) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const A4 = 440;
    
    if (frequency <= 0) return 'ーー';
    
    const semitonesFromA4 = Math.round(12 * Math.log2(frequency / A4));
    const noteIndex = (semitonesFromA4 + 9 + 120) % 12;
    const octave = Math.floor((semitonesFromA4 + 9) / 12) + 4;
    
    return noteNames[noteIndex] + octave;
  }
  
  // 【プロトタイプ式】多段階オクターブ補正関数
  function multiStageOctaveCorrection(detectedFreq, targetFreq) {
    // 複数の補正候補を生成（プロトタイプと同じ係数）
    const candidates = [
      { factor: 3, freq: detectedFreq * 3, description: "1.5オクターブ上" },    // 1.5オクターブ上
      { factor: 2, freq: detectedFreq * 2, description: "1オクターブ上" },      // 1オクターブ上
      { factor: 1.5, freq: detectedFreq * 1.5, description: "0.5オクターブ上" }, // 0.5オクターブ上
      { factor: 1, freq: detectedFreq, description: "補正なし" },              // 補正なし
      { factor: 0.67, freq: detectedFreq * 0.67, description: "0.5オクターブ下" }, // 0.5オクターブ下
      { factor: 0.5, freq: detectedFreq * 0.5, description: "1オクターブ下" },  // 1オクターブ下
      { factor: 0.33, freq: detectedFreq * 0.33, description: "1.5オクターブ下" } // 1.5オクターブ下
    ];
    
    // 目標周波数範囲の定義（±30%の範囲で妥当性をチェック）
    const targetMin = targetFreq * 0.7;
    const targetMax = targetFreq * 1.3;
    
    // 範囲内の候補のみフィルタリング
    const validCandidates = candidates.filter(candidate => 
      candidate.freq >= targetMin && candidate.freq <= targetMax
    );
    
    // 有効な候補がない場合は補正なし
    if (validCandidates.length === 0) {
      return {
        correctedFrequency: detectedFreq,
        factor: 1,
        description: "補正なし（有効候補なし）",
        error: Math.abs(detectedFreq - targetFreq)
      };
    }
    
    // 最小誤差の候補を選択
    let bestCandidate = validCandidates[0];
    let minError = Math.abs(bestCandidate.freq - targetFreq);
    
    for (const candidate of validCandidates) {
      const error = Math.abs(candidate.freq - targetFreq);
      if (error < minError) {
        minError = error;
        bestCandidate = candidate;
      }
    }
    
    return {
      correctedFrequency: bestCandidate.freq,
      factor: bestCandidate.factor,
      description: bestCandidate.description,
      error: minError
    };
  }

  // 裏での評価蓄積（ガイドアニメーション中）- プロトタイプ式多段階補正版
  function evaluateScaleStep(frequency, note) {
    if (!frequency || frequency <= 0 || !isGuideAnimationActive) {
      return;
    }
    
    // 【緊急修正】基音周波数の有効性チェック
    if (!currentBaseFrequency || currentBaseFrequency <= 0) {
      console.error(`❌ [採点エラー] 基音周波数が無効: ${currentBaseFrequency}Hz`);
      console.error(`❌ [採点エラー] 基音名: ${currentBaseNote}`);
      console.error(`❌ [採点エラー] activeStepIndex: ${currentScaleIndex - 1}`);
      console.error(`❌ [採点エラー] trainingPhase: ${trainingPhase}`);
      console.error(`❌ [採点エラー] isGuideAnimationActive: ${isGuideAnimationActive}`);
      return;
    }
    
    // 【音量チェック】環境音を除外
    const minVolumeForScoring = 25; // 採点用の最低音量しきい値（20→25に引き上げ）
    if (currentVolume < minVolumeForScoring) {
      // 音量不足の場合は採点をスキップ（環境音の可能性）
      return;
    }
    
    // 現在ハイライト中のステップを取得（currentScaleIndex - 1が実際にハイライト中）
    const activeStepIndex = currentScaleIndex - 1;
    if (activeStepIndex < 0 || activeStepIndex >= scaleSteps.length) {
      return;
    }
    
    // 【緊急デバッグ】音階インデックスと基音状態監視
    if (activeStepIndex >= 4) { // ソ以降で強化ログ
      logger.debug(`[採点デバッグ] activeStepIndex=${activeStepIndex} (${scaleSteps[activeStepIndex].name}), currentBaseFrequency=${currentBaseFrequency}Hz`);
    }
    
    // 【修正】プロトタイプ式のシンプルで正確な周波数計算を使用
    const expectedFrequency = calculateExpectedFrequency(currentBaseFrequency, activeStepIndex);
    
    // 【デバッグ】音程計算の詳細ログ（修正版）
    if (activeStepIndex >= 0) { // 全音程でログ出力して修正確認
      logger.debug(`[音程計算修正版] ${scaleSteps[activeStepIndex].name}: 期待周波数 ${expectedFrequency.toFixed(1)}Hz`);
    }
    
    // 【緊急修正】期待周波数の有効性チェック
    if (!expectedFrequency || expectedFrequency <= 0 || !isFinite(expectedFrequency)) {
      console.error(`❌ [採点エラー] 期待周波数計算エラー:`);
      console.error(`   基音周波数: ${currentBaseFrequency}Hz`);
      console.error(`   音階インデックス: ${activeStepIndex}`);
      console.error(`   期待周波数: ${expectedFrequency}Hz`);
      return;
    }
    
    // 【プロトタイプ式】多段階オクターブ補正を適用
    const correctionResult = multiStageOctaveCorrection(frequency, expectedFrequency);
    const adjustedFrequency = correctionResult.correctedFrequency;
    const correctionFactor = correctionResult.factor;
    
    // 音程差を計算（セント）
    const centDifference = Math.round(1200 * Math.log2(adjustedFrequency / expectedFrequency));
    
    // 【デバッグ】プロトタイプ式補正結果の詳細ログ
    if (Math.abs(centDifference) > 200 || correctionFactor !== 1) {
      logger.debug(`[プロトタイプ式補正] ${scaleSteps[activeStepIndex].name}:`);
      console.warn(`   検出周波数: ${frequency.toFixed(1)}Hz`);
      console.warn(`   補正後周波数: ${adjustedFrequency.toFixed(1)}Hz`);
      console.warn(`   期待周波数: ${expectedFrequency.toFixed(1)}Hz`);
      console.warn(`   セント差: ${centDifference}¢`);
      console.warn(`   補正係数: ${correctionFactor} (${correctionResult.description})`);
      console.warn(`   基音: ${currentBaseNote} (${currentBaseFrequency.toFixed(1)}Hz)`);
    }
    
    // 【緊急修正】セント計算の有効性チェック
    if (!isFinite(centDifference)) {
      console.error(`❌ [採点エラー] セント計算エラー:`);
      console.error(`   検出周波数: ${frequency}Hz`);
      console.error(`   期待周波数: ${expectedFrequency}Hz`);
      console.error(`   セント差: ${centDifference}`);
      return;
    }
    
    // 判定基準（±50セント以内で正解）
    const tolerance = 50;
    const isCorrect = Math.abs(centDifference) <= tolerance;
    
    // 最低音量基準（ノイズ除外）
    const minVolumeForDetection = 15;
    const hasEnoughVolume = currentVolume >= minVolumeForDetection;
    
    if (hasEnoughVolume) {
      // 精度計算（100 - |centDifference|の割合）
      const accuracy = Math.max(0, Math.round(100 - Math.abs(centDifference)));
      
      // 評価を蓄積（上書きして最新の評価を保持）
      const existingIndex = scaleEvaluations.findIndex(evaluation => evaluation.stepIndex === activeStepIndex);
      const evaluation = {
        stepIndex: activeStepIndex,
        stepName: scaleSteps[activeStepIndex].name,
        expectedFrequency: Math.round(expectedFrequency),
        detectedFrequency: Math.round(frequency),
        adjustedFrequency: Math.round(adjustedFrequency),
        centDifference: centDifference,
        accuracy: accuracy,
        isCorrect: isCorrect,
        correctionFactor: correctionFactor,
        correctionDescription: correctionResult.description,
        timestamp: Date.now()
      };
      
      if (existingIndex >= 0) {
        scaleEvaluations[existingIndex] = evaluation;
      } else {
        scaleEvaluations.push(evaluation);
      }
      
      // 簡素化デバッグログ（重要な情報のみ）
      if (scaleEvaluations.length % 4 === 0) { // 4ステップごとに進捗表示
        logger.realtime(`採点進捗: ${scaleEvaluations.length}/${scaleSteps.length}ステップ完了`);
      }
    }
  }
  
  
  // セッション完了処理
  function completeSession() {
    trainingPhase = 'completed';
    sessionResults.isCompleted = true;
    sessionResults.averageAccuracy = Math.round((sessionResults.correctCount / sessionResults.totalCount) * 100);
    
    // 音程検出停止
    if (pitchDetectorComponent) {
      pitchDetectorComponent.stopDetection();
    }
  }
  
  // 同じ基音で再挑戦
  async function restartSameBaseNote() {
    // **8セッション完了状態チェック（重要）**
    if ($isCompleted) {
      console.warn('🚫 [RestartSame] 8セッション完了状態では再挑戦不可 - 新サイクル開始が必要');
      
      // 新サイクル開始を実行
      const newCycleStarted = await startNewCycleIfCompleted();
      if (newCycleStarted) {
        console.log('✅ [RestartSame] 新サイクル開始完了 - セッション1/8から再開');
        // ページリロードして新サイクル状態を反映
        window.location.reload();
      } else {
        console.error('❌ [RestartSame] 新サイクル開始失敗');
      }
      return;
    }
    
    // 1. ページトップにスクロール（強化版）
    scrollToTop();
    
    // 2. UI状態のみ変更（即座画面遷移）
    trainingPhase = 'setup';
    
    // 3. 最小限のクリーンアップ
    if (guideAnimationTimer) {
      clearTimeout(guideAnimationTimer);
      guideAnimationTimer = null;
    }
    
    // 4. PitchDetectorの表示状態をリセット
    if (pitchDetectorComponent && pitchDetectorComponent.resetDisplayState) {
      pitchDetectorComponent.resetDisplayState();
    }
    
    // 5. セッション状態リセット（基音は保持）
    resetSessionState();
    // 注意: currentBaseNote と currentBaseFrequency は保持される
    
    // 6. 基音情報保持（再生はユーザー操作まで待機）
    console.log('🔄 [RestartSame] 同じ基音で再挑戦:', currentBaseNote, currentBaseFrequency + 'Hz');
    console.log('🔄 [RestartSame] 基音情報保持完了 - ユーザー操作待機');
    // 注意: 基音は自動再生せず、ユーザーが「基音を聞く」ボタンを押すまで待機
  }
  
  // 違う基音で開始
  async function restartDifferentBaseNote() {
    // **8セッション完了状態チェック（重要）**
    if ($isCompleted) {
      console.warn('🚫 [RestartDifferent] 8セッション完了状態では再挑戦不可 - 新サイクル開始が必要');
      
      // 新サイクル開始を実行
      const newCycleStarted = await startNewCycleIfCompleted();
      if (newCycleStarted) {
        console.log('✅ [RestartDifferent] 新サイクル開始完了 - セッション1/8から再開');
        // ページリロードして新サイクル状態を反映
        window.location.reload();
      } else {
        console.error('❌ [RestartDifferent] 新サイクル開始失敗');
      }
      return;
    }
    
    // 1. ページトップにスクロール（強化版）
    scrollToTop();
    
    // 2. UI状態のみ変更（即座画面遷移）
    trainingPhase = 'setup';
    
    // 3. 最小限のクリーンアップ
    if (guideAnimationTimer) {
      clearTimeout(guideAnimationTimer);
      guideAnimationTimer = null;
    }
    
    // 4. 基音情報もリセット
    currentBaseNote = '';
    currentBaseFrequency = 0;
    
    // 【緊急デバッグ】基音リセットログ
    console.log('🔄 [restartDifferentBaseNote] 基音情報をリセットしました');
    
    // 5. PitchDetectorの表示状態をリセット
    if (pitchDetectorComponent && pitchDetectorComponent.resetDisplayState) {
      pitchDetectorComponent.resetDisplayState();
    }
    
    // 6. セッション状態リセット
    resetSessionState();
  }
  
  // 強化版スクロール関数（ブラウザ互換性対応）
  function scrollToTop() {
    try {
      // 方法 1: モダンブラウザのスムーススクロール
      if ('scrollTo' in window && 'behavior' in document.documentElement.style) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // 方法 2: 古いブラウザの即座スクロール
        window.scrollTo(0, 0);
      }
      
      // 方法 3: document.body と documentElement のフォールバック
      if (document.body) {
        document.body.scrollTop = 0;
      }
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
      
      // 方法 4: ページ内のスクロールコンテナ対応
      const scrollContainers = document.querySelectorAll('[data-scroll-container], .scroll-container, main');
      scrollContainers.forEach(container => {
        if (container.scrollTo) {
          container.scrollTo(0, 0);
        } else {
          container.scrollTop = 0;
        }
      });
      
    } catch (error) {
      console.warn('スクロールエラー:', error);
      // 最後の手段: 強制的なリロードを避けて基本的なスクロール
      try {
        window.scroll(0, 0);
      } catch (fallbackError) {
        console.error('スクロール完全失敗:', fallbackError);
      }
    }
  }

  // セッション状態リセット
  function resetSessionState() {
    currentScaleIndex = 0;
    isGuideAnimationActive = false;
    scaleEvaluations = []; // 現在のセッション評価はクリア
    // previousEvaluations は保持（前回の結果を残す）
    
    // スケールガイドリセット
    scaleSteps = scaleSteps.map(step => ({
      ...step,
      state: 'inactive',
      completed: false
    }));
    
  }
  
  // 新サイクル開始（8セッション完了後の「最初から挑戦」ボタン用）
  async function startNewCycle() {
    console.log('🚀 [StartNewCycle] 8セッション完了後の最初から挑戦開始');
    
    try {
      // 新サイクル開始処理
      const newCycleStarted = await startNewCycleIfCompleted();
      
      if (newCycleStarted) {
        console.log('✅ [StartNewCycle] 新サイクル開始完了');
        
        // マイクテスト完了フラグが存在することを確認
        const micTestCompleted = localStorage.getItem('mic-test-completed');
        if (micTestCompleted) {
          console.log('✅ [StartNewCycle] マイクテスト完了フラグ確認 - リロードなしで状態リセット');
          
          // リロードせずに状態をリセット（マイクテスト経由と同じ状態に）
          // 1. ページトップにスクロール
          scrollToTop();
          
          // 2. sessionStorageストアを更新（リアクティブに反映）
          await loadProgress(); // 新しいセッション状態を読み込み
          
          // 3. UI状態をsetupに戻す
          trainingPhase = 'setup';
          
          // 4. セッション状態をリセット
          resetSessionState();
          
          // 5. 新しい基音を選択
          selectRandomBaseNote();
          
          console.log('✅ [StartNewCycle] 状態リセット完了 - セッション1/8から再開');
        } else {
          // フラグがない場合は通常のリロード（ダイレクトアクセス扱い）
          window.location.reload();
        }
      } else {
        console.error('❌ [StartNewCycle] 新サイクル開始失敗');
        // 失敗時はホームに戻る
        goHome();
      }
    } catch (error) {
      console.error('❌ [StartNewCycle] 新サイクル開始エラー:', error);
      // エラー時もホームに戻る
      goHome();
    }
  }

  // ActionButtons統一イベントハンドラ
  function handleActionButtonClick(event) {
    const { type } = event.detail;
    
    switch (type) {
      case 'same':
        restartSameBaseNote();
        break;
      case 'different':
        restartDifferentBaseNote();
        break;
      case 'restart':
        startNewCycle();
        break;
      case 'home':
        goHome();
        break;
      default:
        console.warn('🚫 [ActionButtons] 未知のアクションタイプ:', type);
    }
  }

  
  // リアクティブシステム
  $: canStartTraining = microphoneState === 'granted' && !isSamplerLoading && sampler && microphoneHealthy;
  $: canRestartSession = trainingPhase === 'results';

  // 8セッション完了時：localStorageデータから音程別データを生成
  $: if ($unifiedScoreData && $isCompleted && $unifiedScoreData.sessionHistory) {
    intervalData = generateIntervalDataFromSessionHistory($unifiedScoreData.sessionHistory);
    console.log('🎵 [RandomTraining] intervalData生成完了:', intervalData.length, '件');
  }
  
  // 状態変化時の自動スクロール（ダイレクトアクセス、マイク許可後の画面遷移時）
  $: if (trainingPhase === 'setup' && microphoneState === 'granted') {
    scrollToTop();
  }


  // PitchDetectorイベントハンドラー（簡素版）
  function handlePitchDetectorStateChange(event) {
    // ログ削除
  }
  
  function handlePitchDetectorError(event) {
    console.error('❌ PitchDetectorエラー:', event.detail);
  }
  
  // マイク健康状態変化ハンドラー
  function handleMicrophoneHealthChange(event) {
    const { healthy, errors, details } = event.detail;
    microphoneHealthy = healthy;
    microphoneErrors = errors;
    
    if (!healthy) {
      console.warn('⚠️ マイクの健康状態が悪化:', errors);
      // 深刻な問題の場合はトレーニングを停止
      if (trainingPhase === 'guiding') {
        trainingPhase = 'setup';
        console.warn('🛑 マイク問題によりトレーニングを停止');
      }
    }
  }

  // クリーンアップ
  onDestroy(() => {
    console.log('🔄 [RandomTraining] onDestroy - AudioManagerリソースは保持');
    
    // PitchDetectorは使い回しのためcleanupしない
    // AudioManagerがリソースを管理するため、ここでは解放しない
    
    if (sampler) {
      sampler.dispose();
      sampler = null;
    }
  });
</script>

<PageLayout>
  <!-- Header -->
  <div class="header-section">
    <h1 class="page-title">🎵 ランダム基音トレーニング</h1>
    <p class="page-description">10種類の基音からランダムに選択してドレミファソラシドを練習</p>
    
    
    <!-- セッション進捗表示 -->
    {#if microphoneState === 'granted' && !$isLoading}
      <div class="session-progress">
        <div class="session-status">
          <div class="session-info">
            <span class="completed-count">{$sessionHistory?.length || 0}/8</span>
            <span class="remaining-text">残り {8 - ($sessionHistory?.length || 0)} セッション</span>
          </div>
          <div class="progress-section">
            <div class="progress-bar">
              <div class="progress-fill" style="width: {(($sessionHistory?.length || 0) / 8 * 100)}%"></div>
            </div>
            <span class="progress-text">{Math.round(($sessionHistory?.length || 0) / 8 * 100)}%</span>
          </div>
        </div>
        
      </div>
      
      <!-- 上部アクションボタン（基音再生画面では非表示） -->
      {#if trainingPhase === 'results'}
        <div class="top-action-buttons">
          <ActionButtons 
            isCompleted={$isCompleted}
            position="top"
            on:action={handleActionButtonClick}
          />
        </div>
      {/if}
    {/if}
    
    <div class="debug-info">
      📱 {buildVersion} | {buildTimestamp}<br/>
      <small style="font-size: 0.6rem;">{updateStatus}</small>
    </div>
  </div>


  {#if microphoneState === 'granted'}
    <!-- PitchDetector: 常に存在（セッション間で破棄されない） -->
    <div style="display: none;">
      <PitchDetector
        bind:this={pitchDetectorComponent}
        isActive={microphoneState === 'granted'}
        trainingPhase={trainingPhase}
        on:pitchUpdate={handlePitchUpdate}
        on:stateChange={handlePitchDetectorStateChange}
        on:error={handlePitchDetectorError}
        on:microphoneHealthChange={handleMicrophoneHealthChange}
        className="pitch-detector-content"
        debugMode={true}
        disableHarmonicCorrection={false}
      />
    </div>

    <!-- メイントレーニングインターフェース -->
    
    {#if trainingPhase !== 'results'}
      <!-- Base Tone and Detection Side by Side -->
      <!-- マイク健康状態警告（問題がある場合のみ表示） -->
      {#if !microphoneHealthy && microphoneErrors.length > 0}
        <Card class="warning-card">
          <div class="card-header">
            <h3 class="section-title">⚠️ マイク接続に問題があります</h3>
          </div>
          <div class="card-content">
            <p class="warning-message">マイクが正常に動作していません。以下の問題が検出されました：</p>
            <ul class="error-list">
              {#each microphoneErrors as error}
                <li>{error}</li>
              {/each}
            </ul>
            <p class="fix-instruction">
              <strong>解決方法:</strong> ページを再読み込みしてマイク許可を再度取得してください。
            </p>
          </div>
        </Card>
      {/if}

      <div class="side-by-side-container">
        <!-- Base Tone Section -->
        <Card class="main-card half-width">
          <div class="card-header">
            <h3 class="section-title">🎹 基音再生</h3>
          </div>
          <div class="card-content">
            <Button 
              variant="primary"
              disabled={isPlaying || trainingPhase === 'guiding' || trainingPhase === 'waiting'}
              on:click={playBaseNote}
            >
              {#if isPlaying}
                🎵 再生中...
              {:else if currentBaseNote && currentBaseFrequency > 0}
                🔄 {currentBaseNote} 再生
              {:else}
                🎹 ランダム基音再生
              {/if}
            </Button>
            
            {#if currentBaseNote}
              <div class="base-note-info">
                現在の基音: <strong>{currentBaseNote}</strong> ({currentBaseFrequency.toFixed(1)}Hz)
              </div>
            {/if}
          </div>
        </Card>

        <!-- Detection Section (Display Only) -->
        <PitchDetectionDisplay
          frequency={currentFrequency}
          note={detectedNote}
          volume={currentVolume}
          isMuted={trainingPhase !== 'guiding'}
          muteMessage="基音再生後に開始"
          className="half-width"
        />
      </div>
    {/if}

    {#if trainingPhase !== 'results'}
      <!-- Scale Guide Section -->
      <Card class="main-card">
        <div class="card-header">
          <h3 class="section-title">🎵 ドレミ音階ガイド</h3>
        </div>
        <div class="card-content">
          <div class="scale-guide">
            {#each scaleSteps as step, index}
              <div 
                class="scale-item {step.state}"
              >
                {step.name}
              </div>
            {/each}
          </div>
          {#if trainingPhase === 'guiding'}
            <div class="guide-instruction">
              ガイドに合わせて <strong>ドレミファソラシド</strong> を歌ってください
            </div>
          {/if}
        </div>
      </Card>
    {/if}


    <!-- Results Section - Enhanced Scoring System -->
    {#if trainingPhase === 'results'}
      <!-- 統合採点システム結果（localStorage統合版） -->
      {#if $unifiedScoreData && $isCompleted}
        <!-- 8セッション完了時：localStorageデータを使用 -->
        <UnifiedScoreResultFixed 
          scoreData={$unifiedScoreData}
          showDetails={false}
          className="mb-6 iphone-no-margin"
          currentScoreData={currentScoreData}
          intervalData={intervalData}
          consistencyData={consistencyData}
          feedbackData={feedbackData}
          technicalFeedbackData={technicalFeedbackData}
          sessionStatistics={sessionStatistics}
        />
      {:else if currentUnifiedScoreData}
        <!-- 1セッション完了時：従来のデータを使用 -->
        <UnifiedScoreResultFixed 
          scoreData={currentUnifiedScoreData}
          showDetails={false}
          className="mb-6 iphone-no-margin"
          currentScoreData={currentScoreData}
          intervalData={intervalData}
          consistencyData={consistencyData}
          feedbackData={feedbackData}
          technicalFeedbackData={technicalFeedbackData}
          sessionStatistics={sessionStatistics}
        />
      {/if}
      
      
      
      <!-- アクションボタン（常時表示） -->
      {#if trainingPhase === 'results'}
        <Card class="main-card bottom-action-card">
          <div class="card-content">
            <!-- 下部アクションボタン -->
            <ActionButtons 
              isCompleted={$isCompleted}
              position="bottom"
              on:action={handleActionButtonClick}
            />
          </div>
        </Card>
      {/if}
    {/if}

    <!-- 古い共通アクションボタンは削除（ActionButtonsに統一） -->

  {:else}
    <!-- Direct Access Error State -->
    <Card class="error-card">
      <div class="error-content">
        <div class="error-icon">🎤</div>
        <h3>マイクテストが必要です</h3>
        <p>ランダム基音トレーニングを開始する前に、マイクテストページで音声入力の確認をお願いします。</p>
        
        <div class="recommendation">
          <p>このページは<strong>マイクテスト完了後</strong>にご利用いただけます。</p>
          <p>まずはマイクテストページで音声確認を行ってください。</p>
        </div>
        
        <div class="action-buttons">
          <Button variant="primary" on:click={goToMicrophoneTest}>
            🎤 マイクテストページへ移動
          </Button>
          <Button variant="secondary" on:click={goHome}>
            🏠 ホームに戻る
          </Button>
        </div>
      </div>
    </Card>
  {/if}
</PageLayout>

<style>
  /* === shadcn/ui風モダンデザイン === */
  
  /* ヘッダーセクション */
  .header-section {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .page-title {
    font-size: 2rem;
    font-weight: 700;
    color: hsl(222.2 84% 4.9%);
    margin-bottom: 0.5rem;
  }
  
  .page-description {
    color: hsl(215.4 16.3% 46.9%);
    font-size: 1rem;
    margin: 0;
  }


  /* カードスタイル（shadcn/ui風） */
  :global(.main-card) {
    border: 1px solid hsl(214.3 31.8% 91.4%) !important;
    background: hsl(0 0% 100%) !important;
    border-radius: 8px !important;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06) !important;
    margin-bottom: 1.5rem;
  }
  
  :global(.status-card) {
    border-radius: 8px !important;
    margin-bottom: 1.5rem;
  }
  
  :global(.error-card) {
    border: 1px solid hsl(0 84.2% 60.2%) !important;
    background: hsl(0 84.2% 97%) !important;
    border-radius: 8px !important;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1) !important;
  }
  
  :global(.results-card) {
    border: 1px solid hsl(142.1 76.2% 36.3%) !important;
    background: linear-gradient(135deg, hsl(142.1 76.2% 95%) 0%, hsl(0 0% 100%) 100%) !important;
  }

  /* カードヘッダー */
  .card-header {
    padding-bottom: 1rem;
    border-bottom: 1px solid hsl(214.3 31.8% 91.4%);
    margin-bottom: 1.5rem;
  }
  
  .section-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: hsl(222.2 84% 4.9%);
    margin: 0;
  }

  /* カードコンテンツ */
  .card-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* ステータス表示 */
  .status-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }
  
  .status-message {
    font-weight: 500;
    color: hsl(222.2 84% 4.9%);
  }
  
  .progress-indicator {
    font-size: 0.875rem;
    color: hsl(215.4 16.3% 46.9%);
  }

  /* サイドバイサイドレイアウト */
  .side-by-side-container {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  :global(.half-width) {
    flex: 1;
  }
  
  @media (max-width: 768px) {
    .side-by-side-container {
      flex-direction: column;
    }
    
    :global(.half-width) {
      width: 100%;
    }
  }

  /* デバッグ情報 */
  .debug-info {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: hsl(220 13% 91%);
    color: hsl(220 13% 46%);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-family: 'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', monospace;
    z-index: 100;
  }

  /* 基音情報 */
  .base-note-info {
    text-align: center;
    padding: 1rem;
    background: hsl(210 40% 98%);
    border-radius: 6px;
    border: 1px solid hsl(214.3 31.8% 91.4%);
    font-size: 0.875rem;
    color: hsl(215.4 16.3% 46.9%);
  }

  /* 相対音程情報 */
  .relative-pitch-info {
    text-align: center;
    padding: 1rem;
    background: hsl(210 40% 98%);
    border-radius: 6px;
    border: 1px solid hsl(214.3 31.8% 91.4%);
    margin-top: 1rem;
  }
  
  .frequency-display-large {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }
  
  .large-hz {
    font-size: 2rem;
    font-weight: 700;
    color: hsl(222.2 84% 4.9%);
    line-height: 1;
  }
  
  .note-with-cents {
    font-size: 0.875rem;
    color: hsl(215.4 16.3% 46.9%);
    font-weight: 500;
  }
  
  .no-signal {
    font-size: 2rem;
    font-weight: 700;
    color: hsl(215.4 16.3% 46.9%);
    line-height: 1;
  }
  
  .pitch-detector-placeholder {
    text-align: center;
    padding: 2rem;
    color: hsl(215.4 16.3% 46.9%);
    font-style: italic;
  }

  /* スケールガイド */
  .scale-guide {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .scale-item {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 3rem;
    border-radius: 6px;
    font-weight: 500;
    font-size: 0.875rem;
    border: 1px solid hsl(215.4 16.3% 46.9%);
    background: hsl(0 0% 100%);
    color: hsl(215.4 16.3% 46.9%);
    transition: all 0.3s ease;
  }
  
  .scale-item.active {
    background: hsl(343.8 79.7% 53.7%) !important;
    color: white !important;
    border: 2px solid hsla(343.8 79.7% 53.7% / 0.5) !important;
    transform: scale(1.2);
    font-size: 1.125rem;
    font-weight: 700;
    animation: pulse 2s infinite;
    box-shadow: 0 0 0 2px hsla(343.8 79.7% 53.7% / 0.3) !important;
  }
  
  .scale-item.correct {
    background: hsl(142.1 76.2% 36.3%);
    color: hsl(210 40% 98%);
    border-color: hsl(142.1 76.2% 36.3%);
    animation: correctFlash 0.5s ease-out;
  }
  
  .scale-item.incorrect {
    background: hsl(0 84.2% 60.2%);
    color: hsl(210 40% 98%);
    border-color: hsl(0 84.2% 60.2%);
    animation: shake 0.5s ease-in-out;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  @keyframes correctFlash {
    0% { transform: scale(1); background: hsl(47.9 95.8% 53.1%); }
    50% { transform: scale(1.1); background: hsl(142.1 76.2% 36.3%); }
    100% { transform: scale(1); background: hsl(142.1 76.2% 36.3%); }
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
  
  /* currentクラスは削除（使用していない） */
  
  .guide-instruction {
    text-align: center;
    font-size: 0.875rem;
    color: hsl(215.4 16.3% 46.9%);
    padding: 0.75rem;
    background: hsl(210 40% 98%);
    border-radius: 6px;
  }
  
  .guide-feedback {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
    font-size: 0.75rem;
  }
  
  .feedback-label {
    color: hsl(215.4 16.3% 46.9%);
    font-weight: 500;
  }
  
  .feedback-value {
    font-weight: 700;
    font-family: 'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', monospace;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    background: hsl(214.3 31.8% 91.4%);
    color: hsl(222.2 84% 4.9%);
    min-width: 4ch;
    text-align: center;
  }
  
  .feedback-value.accurate {
    background: hsl(142.1 76.2% 90%);
    color: hsl(142.1 76.2% 30%);
  }
  
  .feedback-value.close {
    background: hsl(47.9 95.8% 90%);
    color: hsl(47.9 95.8% 30%);
  }
  
  .feedback-status {
    font-weight: 500;
    font-size: 0.75rem;
  }
  
  .feedback-status.success {
    color: hsl(142.1 76.2% 36.3%);
  }
  
  .feedback-status.close {
    color: hsl(47.9 95.8% 45%);
  }

  /* 検出表示 */
  .detection-display {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .detection-card {
    display: inline-flex;
    align-items: baseline;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    background: hsl(0 0% 100%);
    border: 1px solid hsl(214.3 31.8% 91.4%);
    border-radius: 8px;
    width: fit-content;
  }

  /* PitchDetector表示の最強制スタイリング */
  :global(.detected-frequency) {
    font-weight: 600 !important;
    font-size: 2rem !important;
    color: hsl(222.2 84% 4.9%) !important;
    font-family: 'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', 
                 'JetBrains Mono', 'Fira Code', 'Consolas', monospace !important;
    min-width: 4ch !important;
    text-align: right !important;
    display: inline-block !important;
    font-variant-numeric: tabular-nums !important;
    -webkit-font-smoothing: antialiased !important;
    -moz-osx-font-smoothing: grayscale !important;
  }

  :global(.hz-suffix) {
    font-weight: 600 !important;
    font-size: 2rem !important;
    color: hsl(222.2 84% 4.9%) !important;
  }

  :global(.divider) {
    color: hsl(214.3 31.8% 70%) !important;
    font-size: 1.5rem !important;
    margin: 0 0.25rem !important;
    font-weight: 300 !important;
  }
  
  :global(.detected-note) {
    font-weight: 600 !important;
    font-size: 2rem !important;
    color: hsl(215.4 16.3% 46.9%) !important;
    font-family: 'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', 
                 'JetBrains Mono', 'Fira Code', 'Consolas', monospace !important;
    min-width: 3ch !important;
    display: inline-block !important;
    text-align: center !important;
  }

  :global(.volume-bar) {
    border-radius: 4px !important;
  }
  
  .detected-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }
  
  .detected-label {
    color: hsl(215.4 16.3% 46.9%);
  }
  
  .detected-frequency {
    font-weight: 700;
    font-size: 1.25rem;
    color: hsl(222.2 84% 4.9%);
    margin-right: 0.5rem;
  }
  
  .detected-note {
    font-weight: 500;
    font-size: 0.875rem;
    color: hsl(215.4 16.3% 46.9%);
    margin-right: 0.25rem;
  }
  
  .pitch-diff {
    color: hsl(47.9 95.8% 40%);
    font-weight: 500;
    margin-left: 0.25rem;
  }
  
  .volume-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .volume-label {
    font-size: 0.875rem;
    color: hsl(215.4 16.3% 46.9%);
  }
  
  :global(.modern-volume-bar) {
    border-radius: 4px !important;
  }

  /* 結果表示 */
  .results-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }
  
  .result-item {
    text-align: center;
    padding: 1rem;
    border-radius: 6px;
    background: hsl(0 0% 100%);
    border: 1px solid hsl(214.3 31.8% 91.4%);
  }
  
  .result-label {
    display: block;
    font-size: 0.875rem;
    color: hsl(215.4 16.3% 46.9%);
    margin-bottom: 0.25rem;
  }
  
  .result-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: hsl(222.2 84% 4.9%);
  }
  
  .result-value.success {
    color: hsl(142.1 76.2% 36.3%);
  }
  
  /* 詳細結果 */
  .detailed-results {
    margin-top: 2rem;
  }
  
  .detailed-title {
    font-size: 1rem;
    font-weight: 600;
    color: hsl(222.2 84% 4.9%);
    margin-bottom: 1rem;
    text-align: center;
  }
  
  .scale-results {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .scale-result-item {
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    gap: 1rem;
    padding: 0.75rem;
    border-radius: 6px;
    border: 1px solid hsl(214.3 31.8% 91.4%);
    background: hsl(0 0% 100%);
    align-items: center;
  }
  
  .scale-result-item.correct {
    background: hsl(142.1 76.2% 95%);
    border-color: hsl(142.1 76.2% 80%);
  }
  
  .scale-result-item.incorrect {
    background: hsl(0 84.2% 95%);
    border-color: hsl(0 84.2% 80%);
  }
  
  .scale-name {
    font-weight: 600;
    color: hsl(222.2 84% 4.9%);
  }
  
  .scale-accuracy {
    font-weight: 500;
    font-family: 'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', monospace;
    color: hsl(215.4 16.3% 46.9%);
  }
  
  .scale-cents {
    font-weight: 500;
    font-family: 'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', monospace;
    color: hsl(215.4 16.3% 46.9%);
    font-size: 0.875rem;
  }
  
  .scale-status {
    text-align: center;
    font-size: 1.125rem;
  }

  /* アクションボタン - 新しいActionButtonsコンポーネントで管理 */
  
  /* 上部アクションボタンのマージン調整 - 最優先適用 */
  .top-action-buttons {
    margin: 0.125rem 0 0.125rem 0 !important; /* 下マージンをさらに縮小: 0.25rem → 0.125rem */
    padding: 0 !important;
  }
  
  /* 下部アクションボタンカードのマージン調整 - 最優先適用 */
  :global(.bottom-action-card) {
    margin-top: 0.5rem !important;  /* さらに縮小 */
    margin-bottom: 0.5rem !important; /* さらに縮小 */
    padding: 0.25rem !important; /* カード自体のpadding縮小 */
  }
  
  /* 下部アクションボタンカード内のpadding調整 - 最優先適用 */
  :global(.bottom-action-card .card-content) {
    padding: 0.25rem !important; /* さらに縮小 */
    margin: 0 !important;
  }
  
  /* ActionButtonsコンポーネント内のマージンを強制上書き */
  :global(.action-buttons-container.top) {
    margin: 0 !important;
    padding: 0.25rem 1rem !important;
  }
  
  :global(.action-buttons-container.bottom) {
    margin: 0 !important; 
    padding: 0.25rem 1rem !important;
  }
  
  /* UnifiedScoreResultFixed上部padding強制削減 */
  :global(.unified-score-result) {
    padding-top: 0.25rem !important; /* さらに縮小: 0.5rem → 0.25rem */
  }
  
  /* iPhone: 完全余白削除 */
  @media (max-width: 640px) {
    /* メインページ全体の余白削除 */
    main {
      margin: 0 !important;
      padding: 0 !important;
    }
    
    /* UnifiedScoreResultFixed完全余白削除 */
    :global(.iphone-no-margin) {
      margin: 0 !important;
      padding: 0 !important;
    }
    
    /* mb-6クラス無効化 */
    :global(.mb-6) {
      margin-bottom: 0 !important;
    }
    
    /* ページコンテナ余白削除 */
    .page-container {
      margin: 0 !important;
      padding: 0 !important;
    }
  }
  
  /* 古い共通アクションボタンスタイルは削除（ActionButtonsに統一） */

  /* エラー表示 */
  .error-content {
    text-align: center;
    padding: 2rem 1rem;
  }
  
  .error-icon, .loading-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  .error-content h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: hsl(222.2 84% 4.9%);
    margin-bottom: 0.5rem;
  }
  
  .error-content p {
    color: hsl(215.4 16.3% 46.9%);
    margin-bottom: 1rem;
  }
  
  .recommendation {
    background: hsl(210 40% 98%);
    border: 1px solid hsl(214.3 31.8% 91.4%);
    border-radius: 6px;
    padding: 1rem;
    margin: 1rem 0;
  }
  
  .recommendation p {
    margin: 0;
    font-size: 0.875rem;
  }

  /* レスポンシブ対応 */
  @media (min-width: 768px) {
    .scale-guide {
      grid-template-columns: repeat(8, 1fr);
    }
    
    .page-title {
      font-size: 2.5rem;
    }
    
    .results-summary {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  
  @media (max-width: 640px) {
    .status-content {
      flex-direction: column;
      gap: 0.5rem;
    }
    
    /* アクションボタン - ActionButtonsコンポーネントで管理 */
    
    :global(.primary-button), :global(.secondary-button) {
      min-width: 100% !important;
    }
  }

  /* マイク警告カード */
  :global(.warning-card) {
    border: 2px solid #fbbf24 !important;
    background: #fef3c7 !important;
    margin-bottom: 24px !important;
  }

  .warning-message {
    color: #92400e;
    margin-bottom: 12px;
  }

  .error-list {
    color: #dc2626;
    margin: 12px 0;
    padding-left: 20px;
  }

  .error-list li {
    margin-bottom: 4px;
    font-family: monospace;
    font-size: 14px;
  }

  .fix-instruction {
    color: #059669;
    margin-top: 12px;
    padding: 8px;
    background: #d1fae5;
    border-radius: 4px;
    border-left: 4px solid #059669;
  }

  /* === 採点表示専用スタイル === */
  
  /* タブコンテナ */
  .scoring-tabs-container {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    overflow-x: auto;
    border-bottom: 1px solid hsl(214.3 31.8% 91.4%);
    padding-bottom: 0.5rem;
  }
  
  /* タブボタン */
  .scoring-tab {
    padding: 0.75rem 1rem;
    border-radius: 6px;
    border: 1px solid hsl(214.3 31.8% 91.4%);
    background: hsl(0 0% 100%);
    color: hsl(215.4 16.3% 46.9%);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
    white-space: nowrap;
  }
  
  .scoring-tab:hover {
    background: hsl(210 40% 98%);
    border-color: hsl(217.2 32.6% 17.5%);
  }
  
  .scoring-tab.active {
    background: hsl(217.2 91.2% 59.8%);
    color: hsl(210 40% 98%);
    border-color: hsl(217.2 91.2% 59.8%);
    font-weight: 600;
  }
  
  /* タブコンテンツ */
  .tab-content {
    margin-top: 1rem;
    min-height: 200px;
  }
  
  .tab-panel {
    animation: fadeIn 0.3s ease-in-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  /* モバイル対応 */
  @media (max-width: 768px) {
    .scoring-tabs-container {
      flex-wrap: wrap;
    }
    
    .scoring-tab {
      flex: 1;
      min-width: 120px;
    }
  }
  
  /* 折りたたみ詳細セクション */
  .traditional-scoring-details,
  .detailed-random-scoring,
  .random-scoring-section {
    margin-top: 2rem;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 8px;
  }
  
  .traditional-scoring-details summary {
    font-weight: 600;
    transition: color 0.2s;
  }
  
  .traditional-scoring-details summary:hover {
    color: #374151;
  }
  
  .traditional-scoring-details[open] summary span {
    transform: rotate(90deg);
  }
  
  .traditional-scoring-details summary span {
    transition: transform 0.2s;
  }
  
  /* セッション進捗表示 */
  .session-progress {
    background: hsl(0 0% 100%);
    border: 1px solid hsl(214.3 31.8% 91.4%);
    border-radius: 8px;
    padding: 12px 16px;
    margin: 16px 0;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  }
  
  .session-status {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }
  
  .session-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .completed-count {
    font-weight: 700;
    color: hsl(222.2 84% 4.9%);
    font-size: 1.125rem;
  }
  
  .remaining-text {
    color: hsl(215.4 16.3% 46.9%);
    font-size: 0.875rem;
  }
  
  .progress-section {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .progress-bar {
    width: 120px;
    height: 4px;
    background: hsl(214.3 31.8% 91.4%);
    border-radius: 2px;
    overflow: hidden;
    position: relative;
  }
  
  .progress-fill {
    height: 100%;
    background: hsl(217.2 91.2% 59.8%);
    transition: width 0.3s ease;
  }
  
  .progress-text {
    font-weight: 500;
    color: hsl(217.2 91.2% 59.8%);
    font-size: 0.875rem;
    min-width: 35px;
    text-align: right;
  }
  
  
  
  @media (max-width: 768px) {
    .session-status {
      flex-direction: column;
      gap: 8px;
      align-items: center;
    }
    
    .session-info {
      width: 100%;
      justify-content: center;
    }
    
    .progress-section {
      width: 100%;
      justify-content: center;
    }
  }
</style>