<script>
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { page } from '$app/stores';
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

  // 基本状態管理
  let trainingPhase = 'setup'; // 'setup' | 'listening' | 'waiting' | 'guiding' | 'results'
  
  // マイクテストページからの遷移を早期検出
  let microphoneState = (() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('from') === 'microphone-test') {
        console.log('🎤 [RandomTraining] 早期検出: マイクテストページからの遷移');
        return 'granted';
      } else {
        console.log('🎤 [RandomTraining] ダイレクトアクセスを検出');
        return 'checking';
      }
    }
    return 'checking';
  })(); // 'checking' | 'granted' | 'denied' | 'error'
  
  // シンプルな状態管理
  let microphoneHealthy = true; // マイク健康状態
  let microphoneErrors = []; // マイクエラー詳細
  
  // デバッグ情報（強制更新）
  const buildVersion = "v1.3.2-FORCE";
  const buildTimestamp = "07/27 02:20";
  const updateStatus = "🔥 ROSE色修正・音源削除・評価改善";
  
  // 基音関連
  let currentBaseNote = '';
  let currentBaseFrequency = 0;
  let isPlaying = false;
  
  // 音程ガイド
  let currentScaleIndex = 0;
  let scaleSteps = [
    { name: 'ド', state: 'inactive', completed: false },
    { name: 'レ', state: 'inactive', completed: false },
    { name: 'ミ', state: 'inactive', completed: false },
    { name: 'ファ', state: 'inactive', completed: false },
    { name: 'ソ', state: 'inactive', completed: false },
    { name: 'ラ', state: 'inactive', completed: false },
    { name: 'シ', state: 'inactive', completed: false },
    { name: 'ド（高）', state: 'inactive', completed: false }
  ];
  
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
  
  // Tone.jsサンプラー
  let sampler = null;
  let isLoading = true;
  
  // 音程検出コンポーネント
  let pitchDetectorComponent = null;
  
  // AudioManager対応変数
  let mediaStream = null;   // AudioManagerから取得
  let audioContext = null;  // AudioManagerから取得
  let sourceNode = null;    // AudioManagerから取得

  // 基音候補（存在する音源ファイルに合わせた10種類）
  const baseNotes = [
    { note: 'C4', name: 'ド（中）', frequency: 261.63 },
    { note: 'Db4', name: 'ド#（中）', frequency: 277.18 },
    { note: 'D4', name: 'レ（中）', frequency: 293.66 },
    { note: 'Eb4', name: 'レ#（中）', frequency: 311.13 },
    { note: 'E4', name: 'ミ（中）', frequency: 329.63 },
    { note: 'F4', name: 'ファ（中）', frequency: 349.23 },
    { note: 'Gb4', name: 'ファ#（中）', frequency: 369.99 },
    { note: 'Ab4', name: 'ラb（中）', frequency: 415.30 },
    { note: 'Bb3', name: 'シb（低）', frequency: 233.08 },
    { note: 'B3', name: 'シ（低）', frequency: 246.94 }
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
          console.log('🎙️ [RandomTraining] PitchDetector初期化開始');
          await pitchDetectorComponent.initialize();
          console.log('✅ [RandomTraining] PitchDetector初期化完了');
        }
      }, 200);
      
    } catch (error) {
      console.error('❌ [RandomTraining] マイク許可エラー:', error);
      microphoneState = (error?.name === 'NotAllowedError') ? 'denied' : 'error';
    }
  }

  // ランダム基音選択
  function selectRandomBaseNote() {
    const randomIndex = Math.floor(Math.random() * baseNotes.length);
    const selectedNote = baseNotes[randomIndex];
    currentBaseNote = selectedNote.name;
    currentBaseFrequency = selectedNote.frequency;
    
    // 基音周波数設定確認ログ
    console.log(`🎵 [BaseNote] 基音設定: ${currentBaseNote} = ${currentBaseFrequency}Hz`);
    
    // 基音周波数が正常に設定されたことを確認
    if (!currentBaseFrequency || currentBaseFrequency <= 0) {
      console.error('❌ [BaseNote] 基音周波数設定エラー:', selectedNote);
      throw new Error(`Invalid base frequency: ${currentBaseFrequency}`);
    }
  }

  // ランダム基音再生（新しい基音を選択）
  async function playRandomBaseNote() {
    if (isPlaying || !sampler || isLoading) return;
    
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
    if (isPlaying || !sampler || isLoading || !currentBaseNote) return;
    
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
    // selectRandomBaseNote() は呼ばない - 既存の基音を保持
    
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

  // 目標周波数計算（ドレミファソラシド）
  function calculateTargetFrequency(baseFreq, scaleIndex) {
    // 音階の半音階段数（ドレミファソラシド）
    const semitonesFromBase = [0, 2, 4, 5, 7, 9, 11, 12];
    const semitones = semitonesFromBase[scaleIndex];
    return baseFreq * Math.pow(2, semitones / 12);
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
        guideAnimationTimer = setTimeout(animateNextStep, 600);
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
        if (isLoading || !sampler) {
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
      isLoading = true;
      
      // AudioContextは初回再生時に起動（安全なアプローチ）
      
      // Salamander Grand Piano C4音源からピッチシフト（最適化設定）
      sampler = new Tone.Sampler({
        urls: {
          'C4': 'C4.mp3',
        },
        baseUrl: `${base}/audio/piano/`,
        release: 1.5, // リリース時間最適化
        onload: () => {
          isLoading = false;
        },
        onerror: (error) => {
          console.error('❌ Salamander Piano音源読み込みエラー:', error);
          isLoading = false;
        }
      }).toDestination();
      
      // 音量調整
      sampler.volume.value = -6; // デフォルトより少し下げる
      
    } catch (error) {
      console.error('サンプラー初期化エラー:', error);
      isLoading = false;
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

  // 初期化
  onMount(async () => {
    // 音源初期化
    initializeSampler();
    
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
      
      // AudioManagerリソースの事前取得（スムーズな再生のため）
      setTimeout(async () => {
        if (!mediaStream) {
          console.log('🎤 [RandomTraining] 事前AudioManagerリソース取得開始');
          try {
            await checkMicrophonePermission();
            console.log('🎤 [RandomTraining] 事前AudioManagerリソース取得完了');
          } catch (error) {
            console.warn('⚠️ 事前AudioManagerリソース取得失敗（後で再試行）:', error);
          }
        }
      }, 100);
      return;
    }
    
    // ダイレクトアクセス時のみマイク許可状態確認
    await new Promise(resolve => setTimeout(resolve, 100));
    checkExistingMicrophonePermission();
  });
  
  // PitchDetectorコンポーネントからのイベントハンドラー
  function handlePitchUpdate(event) {
    const { frequency, note, volume, rawVolume, clarity } = event.detail;
    
    currentFrequency = frequency;
    detectedNote = note;
    currentVolume = volume;
    
    // 基音との相対音程を計算
    if (currentBaseFrequency > 0 && frequency > 0) {
      pitchDifference = Math.round(1200 * Math.log2(frequency / currentBaseFrequency));
    } else {
      pitchDifference = 0;
    }
    
    // ガイドアニメーション中の評価蓄積
    evaluateScaleStep(frequency, note);
  }
  
  // 裏での評価蓄積（ガイドアニメーション中）
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
    
    // 現在ハイライト中のステップを取得（currentScaleIndex - 1が実際にハイライト中）
    const activeStepIndex = currentScaleIndex - 1;
    if (activeStepIndex < 0 || activeStepIndex >= scaleSteps.length) {
      return;
    }
    
    // 【緊急デバッグ】音階インデックスと基音状態監視
    if (activeStepIndex >= 4) { // ソ以降で強化ログ
      console.log(`🔍 [採点デバッグ] activeStepIndex=${activeStepIndex} (${scaleSteps[activeStepIndex].name}), currentBaseFrequency=${currentBaseFrequency}Hz`);
    }
    
    // 期待される周波数を計算（基音からの相対音程）
    const scaleIntervals = [0, 2, 4, 5, 7, 9, 11, 12]; // ドレミファソラシド（半音）
    const expectedInterval = scaleIntervals[activeStepIndex] * 100; // セント
    const expectedFrequency = currentBaseFrequency * Math.pow(2, expectedInterval / 1200);
    
    // 【緊急修正】期待周波数の有効性チェック
    if (!expectedFrequency || expectedFrequency <= 0 || !isFinite(expectedFrequency)) {
      console.error(`❌ [採点エラー] 期待周波数計算エラー:`);
      console.error(`   基音周波数: ${currentBaseFrequency}Hz`);
      console.error(`   音程インターバル: ${expectedInterval}セント`);
      console.error(`   期待周波数: ${expectedFrequency}Hz`);
      return;
    }
    
    // 音程差を計算（セント）
    const centDifference = Math.round(1200 * Math.log2(frequency / expectedFrequency));
    
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
        centDifference: centDifference,
        accuracy: accuracy,
        isCorrect: isCorrect,
        timestamp: Date.now()
      };
      
      if (existingIndex >= 0) {
        scaleEvaluations[existingIndex] = evaluation;
      } else {
        scaleEvaluations.push(evaluation);
      }
      
      // 簡素化デバッグログ（重要な情報のみ）
      if (scaleEvaluations.length % 4 === 0) { // 4ステップごとに進捗表示
        console.log(`🎵 採点進捗: ${scaleEvaluations.length}/${scaleSteps.length}ステップ完了`);
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
  function restartSameBaseNote() {
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
  }
  
  // 違う基音で開始
  function restartDifferentBaseNote() {
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
  
  

  
  // リアクティブシステム
  $: canStartTraining = microphoneState === 'granted' && !isLoading && sampler && microphoneHealthy;
  $: canRestartSession = trainingPhase === 'results';
  
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


    <!-- Results Section -->
    {#if trainingPhase === 'results'}
      <Card class="main-card results-card">
        <div class="card-header">
          <h3 class="section-title">🎉 採点結果</h3>
        </div>
        <div class="card-content">
          <div class="results-summary">
            <div class="result-item">
              <span class="result-label">正解数</span>
              <span class="result-value success">{sessionResults.correctCount}/{sessionResults.totalCount}</span>
            </div>
            <div class="result-item">
              <span class="result-label">平均精度</span>
              <span class="result-value">{sessionResults.averageAccuracy}%</span>
            </div>
            <div class="result-item">
              <span class="result-label">正解率</span>
              <span class="result-value">{Math.round(sessionResults.correctCount / sessionResults.totalCount * 100)}%</span>
            </div>
          </div>
          
          <!-- 詳細結果 -->
          <div class="detailed-results">
            <h4 class="detailed-title">音階別結果</h4>
            {#if getDisplayEvaluations().length > 0}
              <div class="scale-results">
                {#each getDisplayEvaluations() as evaluation, index}
                  <div class="scale-result-item" class:correct={evaluation.isCorrect} class:incorrect={!evaluation.isCorrect}>
                    <span class="scale-name">{evaluation.stepName}</span>
                    <span class="scale-accuracy">{evaluation.accuracy}%</span>
                    <span class="scale-cents">{evaluation.centDifference >= 0 ? '+' : ''}{evaluation.centDifference}¢</span>
                    <span class="scale-status">{evaluation.isCorrect ? '✅' : '❌'}</span>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="no-evaluation-data">
                <p>評価データがありません。トレーニング中にマイクから十分な音声が検出されませんでした。</p>
              </div>
            {/if}
          </div>
          
          <div class="action-buttons">
            <Button 
              variant="primary"
              class="restart-button" 
              disabled={!canRestartSession}
              on:click={restartSameBaseNote}
            >
              同じ基音で再挑戦
            </Button>
            <Button 
              variant="primary"
              class="new-base-button" 
              disabled={!canRestartSession}
              on:click={restartDifferentBaseNote}
            >
              違う基音で開始
            </Button>
          </div>
        </div>
      </Card>
    {/if}

    <!-- 共通アクションボタン（採点結果エリア外） -->
    {#if trainingPhase === 'results'}
      <div class="common-actions">
        <Button class="secondary-button">
          🎊 SNS共有
        </Button>
        <Button class="secondary-button" on:click={goHome}>
          🏠 ホーム
        </Button>
      </div>
    {/if}

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
          <Button variant="secondary" on:click={checkMicrophonePermission}>
            🎙️ 直接マイク許可を取得
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

  /* アクションボタン */
  .action-buttons {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  /* 再挑戦系ボタンのスタイリング */
  :global(.restart-button), :global(.new-base-button) {
    min-width: 160px !important;
    font-weight: 500 !important;
  }
  
  /* 共通アクションボタン */
  .common-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 1.5rem;
  }

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
    
    .action-buttons {
      flex-direction: column;
    }
    
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
</style>