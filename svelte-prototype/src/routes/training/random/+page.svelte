<script>
  import { onMount, onDestroy } from 'svelte';
  import { base } from '$app/paths';
  import Card from '$lib/components/Card.svelte';
  import Button from '$lib/components/Button.svelte';
  import VolumeBar from '$lib/components/VolumeBar.svelte';
  import PitchDisplay from '$lib/components/PitchDisplay.svelte';
  import PitchDetector from '$lib/components/PitchDetector.svelte';
  import PageLayout from '$lib/components/PageLayout.svelte';
  import * as Tone from 'tone';

  // 基本状態管理
  let trainingPhase = 'setup'; // 'setup' | 'listening' | 'waiting' | 'guiding' | 'results'
  let microphoneState = 'checking'; // 'checking' | 'granted' | 'denied' | 'error'
  
  // コンポーネント状態管理（改訂版）
  let audioEngineState = 'initializing'; // 'initializing' | 'ready' | 'error'
  let pitchDetectorState = 'uninitialized'; // 'uninitialized' | 'initializing' | 'ready' | 'detecting' | 'error'
  let isRestarting = false; // 再挑戦処理中フラグ
  let systemErrors = []; // エラー履歴
  
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
  let mediaStream = null;

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

  // マイクロフォン許可チェック（コンポーネント統合版）
  async function checkMicrophonePermission() {
    microphoneState = 'checking';
    
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        microphoneState = 'error';
        return;
      }
      
      // マイクストリームを取得
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      microphoneState = 'granted';
      trainingPhase = 'setup';
      console.log('マイク許可取得成功');
      
      // PitchDetectorコンポーネントがマウントされるまで待機してから初期化
      setTimeout(async () => {
        if (pitchDetectorComponent) {
          await pitchDetectorComponent.initialize(mediaStream);
          console.log('PitchDetectorコンポーネント初期化完了');
        } else {
          console.error('PitchDetectorコンポーネントが見つかりません');
        }
      }, 200);
    } catch (error) {
      console.error('マイク許可エラー:', error);
      microphoneState = (error && error.name === 'NotAllowedError') ? 'denied' : 'error';
    }
  }

  // ランダム基音選択
  function selectRandomBaseNote() {
    const randomIndex = Math.floor(Math.random() * baseNotes.length);
    const selectedNote = baseNotes[randomIndex];
    currentBaseNote = selectedNote.name;
    currentBaseFrequency = selectedNote.frequency;
    console.log('選択された基音:', currentBaseNote, currentBaseFrequency + 'Hz');
  }

  // 基音再生（最適化版）
  async function playBaseNote() {
    if (isPlaying || !sampler || isLoading) return;
    
    isPlaying = true;
    trainingPhase = 'listening';
    selectRandomBaseNote();
    
    try {
      // Tone.jsのコンテキストを確実に開始
      if (Tone.context.state !== 'running') {
        await Tone.start();
        console.log('AudioContext起動完了');
      }
      
      // 選択された基音を即座再生（最適化設定）
      const note = baseNotes.find(n => n.name === currentBaseNote).note;
      
      // 即座再生のための最適化
      const now = Tone.now();
      sampler.triggerAttackRelease(note, 2, now, 0.7); // 音量0.7で即座再生
      
      console.log('基音再生:', currentBaseNote, currentBaseFrequency + 'Hz', '音程:', note);
      
      // 2秒後に0.5秒待機してからガイドアニメーション開始
      setTimeout(() => {
        isPlaying = false;
        trainingPhase = 'waiting';
        console.log('基音再生完了 - 0.5秒待機中...');
        
        // 0.5秒後にガイドアニメーション開始
        setTimeout(() => {
          startGuideAnimation();
        }, 500);
      }, 2000);
    } catch (error) {
      console.error('基音再生エラー:', error);
      isPlaying = false;
      trainingPhase = 'setup';
    }
  }

  // ガイドアニメーション開始（改訂版）
  function startGuideAnimation() {
    trainingPhase = 'guiding';
    currentScaleIndex = 0;
    isGuideAnimationActive = true;
    scaleEvaluations = [];
    
    // コンポーネント状態確認（手動startDetectionは削除）
    if (!pitchDetectorComponent || !mediaStream || pitchDetectorState !== 'ready') {
      console.error('❌ 音程検出開始失敗 - コンポーネント未準備:', {
        hasComponent: !!pitchDetectorComponent,
        hasMediaStream: !!mediaStream,
        pitchDetectorState
      });
      trainingPhase = 'setup';
      return;
    }
    
    console.log('🎵 ガイドアニメーション開始 - isActiveによる自動検出開始');
    
    // 各ステップを順次ハイライト（1秒間隔）
    function animateNextStep() {
      if (currentScaleIndex < scaleSteps.length) {
        // 前のステップを非アクティブに
        if (currentScaleIndex > 0) {
          scaleSteps[currentScaleIndex - 1].state = 'inactive';
        }
        
        // 現在のステップをアクティブに
        scaleSteps[currentScaleIndex].state = 'active';
        console.log(`🎵 ${scaleSteps[currentScaleIndex].name} ハイライト中`);
        
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
    
    // 最後のステップも非アクティブに
    if (scaleSteps.length > 0) {
      scaleSteps[scaleSteps.length - 1].state = 'inactive';
    }
    
    // 音程検出停止
    if (pitchDetectorComponent) {
      pitchDetectorComponent.stopDetection();
    }
    
    // 採点結果を計算して表示
    calculateFinalResults();
    trainingPhase = 'results';
    
    console.log('🎉 ガイドアニメーション完了 - 採点結果表示');
  }
  
  // 最終採点結果計算
  function calculateFinalResults() {
    let correctCount = 0;
    let totalAccuracy = 0;
    
    console.log('📊 評価データ数:', scaleEvaluations.length);
    console.log('📊 評価データ詳細:', scaleEvaluations);
    
    scaleEvaluations.forEach(evaluation => {
      if (evaluation.isCorrect) {
        correctCount++;
      }
      totalAccuracy += evaluation.accuracy;
    });
    
    sessionResults = {
      correctCount: correctCount,
      totalCount: scaleSteps.length,
      averageAccuracy: scaleEvaluations.length > 0 ? Math.round(totalAccuracy / scaleEvaluations.length) : 0,
      averageTime: 0, // 今回は時間測定なし
      isCompleted: true
    };
    
    // 前回の結果として保存（再挑戦時表示用）
    if (scaleEvaluations.length > 0) {
      previousEvaluations = [...scaleEvaluations];
    }
    
    console.log('📊 最終採点結果:', sessionResults);
  }

  // ステータスメッセージ取得
  function getStatusMessage() {
    console.log('🔄 ステータス確認 - trainingPhase:', trainingPhase, 'isLoading:', isLoading, 'sampler:', !!sampler);
    
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

  // マイクテストページへの誘導
  function goToMicrophoneTest() {
    window.location.href = '/microphone-test?mode=random';
  }

  // ホームページに戻る
  function goHome() {
    window.location.href = '/';
  }

  // Tone.jsサンプラー初期化（Salamander Grand Piano - 最適化版）
  async function initializeSampler() {
    try {
      isLoading = true;
      
      // AudioContextは初回再生時に起動（安全なアプローチ）
      console.log('AudioContext状態:', Tone.context.state);
      
      // Salamander Grand Piano C4音源からピッチシフト（最適化設定）
      sampler = new Tone.Sampler({
        urls: {
          'C4': 'C4.mp3',
        },
        baseUrl: `${base}/audio/piano/`,
        release: 1.5, // リリース時間最適化
        onload: () => {
          console.log('✅ Salamander Grand Piano C4音源読み込み完了');
          isLoading = false;
          audioEngineState = 'ready';
        },
        onerror: (error) => {
          console.error('❌ Salamander Piano音源読み込みエラー:', error);
          isLoading = false;
          audioEngineState = 'error';
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
        console.log('✅ マイク許可済み - ストリーム取得');
        await checkMicrophonePermission();
      } else {
        // 未許可の場合はエラー画面表示
        console.log('❌ マイク未許可 - エラー画面表示');
        microphoneState = 'denied';
      }
    } catch (error) {
      // Permissions API 未対応の場合は従来の方法
      console.log('⚠️ Permissions API未対応 - エラー画面表示');
      microphoneState = 'denied';
    }
  }

  // 初期化
  onMount(async () => {
    // 状態一貫性チェック開始
    stateCheckInterval = setInterval(() => {
      const issues = validateSystemState();
      if (issues.length > 0) {
        console.warn('⚠️ 状態一貫性問題:', issues);
      }
    }, 5000);
    
    // 音源初期化
    initializeSampler();
    
    // コンポーネントマウント完了を少し待ってからマイク許可状態確認
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
    if (!frequency || frequency <= 0 || !currentBaseFrequency || !isGuideAnimationActive) {
      return;
    }
    
    // 現在ハイライト中のステップを取得（currentScaleIndex - 1が実際にハイライト中）
    const activeStepIndex = currentScaleIndex - 1;
    if (activeStepIndex < 0 || activeStepIndex >= scaleSteps.length) {
      return;
    }
    
    // 期待される周波数を計算（基音からの相対音程）
    const scaleIntervals = [0, 2, 4, 5, 7, 9, 11, 12]; // ドレミファソラシド（半音）
    const expectedInterval = scaleIntervals[activeStepIndex] * 100; // セント
    const expectedFrequency = currentBaseFrequency * Math.pow(2, expectedInterval / 1200);
    
    // 音程差を計算（セント）
    const centDifference = Math.round(1200 * Math.log2(frequency / expectedFrequency));
    
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
      
      // デバッグログ（サイレント蓄積）
      console.log(`📊 評価蓄積: ${evaluation.stepName} (${evaluation.detectedFrequency}Hz, ${centDifference >= 0 ? '+' : ''}${centDifference}セント, 精度:${accuracy}%)`);
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
    
    console.log('🎉 セッション完了!', sessionResults);
  }
  
  // セッション再開始（改訂版）
  async function restartSession() {
    if (isRestarting) {
      console.log('⚠️ 既に再開始処理中です');
      return;
    }
    
    try {
      isRestarting = true;
      console.log('🔄 セッション再開始処理開始');
      
      // 1. 現在のセッションを安全に停止
      if (guideAnimationTimer) {
        clearTimeout(guideAnimationTimer);
        guideAnimationTimer = null;
      }
      
      if (pitchDetectorComponent && pitchDetectorComponent.stopDetection) {
        pitchDetectorComponent.stopDetection();
      }
      
      // 2. セッション状態をリセット（前回結果は保持）
      resetSessionState();
      
      // 3. コンポーネント状態確認・修復（エラー時は単純化）
      try {
        await ensureComponentsReady();
      } catch (componentError) {
        console.warn('⚠️ コンポーネント確認でエラー - 単純再開:', componentError.message);
        // エラーが発生した場合は単純に待機してセットアップモードに移行
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // 4. 新セッション開始準備完了
      trainingPhase = 'setup';
      
      console.log('✅ セッション再開始準備完了');
      
    } catch (error) {
      console.error('❌ セッション再開始エラー:', error);
      // 無限ループを防ぐため、エラー回復は呼ばずに直接セットアップモードに
      trainingPhase = 'setup';
      isGuideAnimationActive = false;
      console.log('🔧 強制セットアップモード移行');
    } finally {
      isRestarting = false;
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
    
    console.log('✅ セッション状態リセット完了');
  }
  
  // コンポーネント状態確認・修復（改訂版）
  async function ensureComponentsReady() {
    console.log('🔍 コンポーネント状態確認開始');
    
    try {
      // 1. マイク状態確認
      if (!mediaStream || mediaStream.getTracks().some(track => track.readyState !== 'live')) {
        console.log('🎤 マイク再初期化が必要');
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        microphoneState = 'granted';
      }
      
      // 2. PitchDetectorコンポーネント存在確認と再初期化
      let retryCount = 0;
      const maxRetries = 15; // リトライ回数を増加
      let componentFound = false;
      
      while (retryCount < maxRetries && !componentFound) {
        if (pitchDetectorComponent && pitchDetectorComponent.getIsInitialized) {
          console.log('✅ PitchDetectorコンポーネント発見');
          componentFound = true;
          
          // 初期化状態をチェック
          if (!pitchDetectorComponent.getIsInitialized()) {
            console.log('🎙️ PitchDetector再初期化が必要');
            pitchDetectorState = 'initializing';
            try {
              await pitchDetectorComponent.reinitialize(mediaStream);
              pitchDetectorState = 'ready';
              console.log('✅ PitchDetector再初期化完了');
            } catch (reinitError) {
              console.error('❌ PitchDetector再初期化エラー:', reinitError);
              pitchDetectorState = 'error';
            }
          } else {
            console.log('✅ PitchDetector既に初期化済み');
          }
        } else {
          // コンポーネント参照が無効な場合、再取得を試行
          console.log(`🔄 PitchDetectorコンポーネント再取得試行 ${retryCount + 1}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, 150)); // 待機時間を延長
          retryCount++;
        }
      }
      
      if (!componentFound) {
        console.warn('⚠️ PitchDetectorコンポーネント取得タイムアウト - DOM再構築を待機');
        // DOM再構築のための長い待機
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 最後にもう一度確認
        if (pitchDetectorComponent && pitchDetectorComponent.getIsInitialized) {
          console.log('🔄 DOM再構築後にPitchDetectorコンポーネント発見');
          if (!pitchDetectorComponent.getIsInitialized()) {
            console.log('🎙️ 最終再初期化試行');
            try {
              pitchDetectorState = 'initializing';
              await pitchDetectorComponent.reinitialize(mediaStream);
              pitchDetectorState = 'ready';
              console.log('✅ 最終再初期化完了');
            } catch (error) {
              console.error('❌ 最終再初期化失敗:', error);
              pitchDetectorState = 'error';
            }
          }
        }
      }
      
      // 3. 音源状態確認
      if (!sampler || isLoading) {
        console.log('🎹 音源再初期化が必要');
        audioEngineState = 'initializing';
        await initializeSampler();
        audioEngineState = 'ready';
      }
      
      console.log('✅ 全コンポーネント正常確認完了');
      
    } catch (error) {
      console.error('❌ コンポーネント確認・修復エラー:', error);
      throw error;
    }
  }
  
  // エラー記録・回復機能（新規追加）
  async function recordAndRecover(error, context) {
    const systemError = {
      type: classifyError(error),
      message: error.message,
      context,
      timestamp: Date.now(),
      recoverable: true,
      recovered: false
    };
    
    systemErrors.push(systemError);
    console.error(`🚨 システムエラー [${context}]:`, error);
    
    try {
      // エラー種別による回復戦略
      switch (systemError.type) {
        case 'microphone-lost':
          mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          await pitchDetectorComponent?.reinitialize(mediaStream);
          break;
          
        case 'pitchdetector-failed':
          await pitchDetectorComponent?.cleanup();
          await pitchDetectorComponent?.reinitialize(mediaStream);
          break;
          
        case 'audio-context-suspended':
          if (audioContext && audioContext.state === 'suspended') {
            await audioContext.resume();
          }
          break;
          
        case 'sampler-error':
          sampler?.dispose();
          await initializeSampler();
          break;
          
        default:
          // 完全再初期化
          await fullReinitialize();
          break;
      }
      
      systemError.recovered = true;
      console.log('✅ エラー回復成功');
      
    } catch (recoveryError) {
      systemError.recoverable = false;
      console.error('❌ エラー回復失敗:', recoveryError);
      await fullReinitialize();
    }
  }
  
  // エラー分類
  function classifyError(error) {
    if (error.message.includes('MediaStream') || error.message.includes('microphone')) {
      return 'microphone-lost';
    } else if (error.message.includes('PitchDetector') || error.message.includes('detection')) {
      return 'pitchdetector-failed';
    } else if (error.message.includes('AudioContext') || error.message.includes('suspended')) {
      return 'audio-context-suspended';
    } else if (error.message.includes('sampler') || error.message.includes('audio')) {
      return 'sampler-error';
    }
    return 'unknown';
  }
  
  // 完全再初期化（最終手段）
  async function fullReinitialize() {
    console.log('🔄 完全再初期化開始');
    
    try {
      // 全リソースクリーンアップ
      if (pitchDetectorComponent) {
        pitchDetectorComponent.cleanup();
      }
      if (sampler) {
        sampler.dispose();
        sampler = null;
      }
      
      // 状態リセット
      microphoneState = 'checking';
      audioEngineState = 'initializing';
      pitchDetectorState = 'uninitialized';
      
      // 再初期化実行
      await checkMicrophonePermission();
      
      console.log('✅ 完全再初期化完了');
      
    } catch (error) {
      console.error('❌ 完全再初期化失敗:', error);
      microphoneState = 'error';
      audioEngineState = 'error';
      pitchDetectorState = 'error';
    }
  }

  // 状態一貫性チェック機能（改訂版）
  let lastAutoRepairTime = 0;
  const AUTO_REPAIR_COOLDOWN = 30000; // 30秒のクールダウン
  
  function validateSystemState() {
    const issues = [];
    const now = Date.now();
    
    if (trainingPhase === 'guiding' && pitchDetectorState !== 'detecting') {
      issues.push('Training in guiding phase but PitchDetector not detecting');
    }
    
    if (microphoneState === 'granted' && (!mediaStream || mediaStream.getTracks().some(track => track.readyState !== 'live'))) {
      issues.push('Microphone granted but MediaStream invalid');
      
      // 自動修復のクールダウンチェック
      if (now - lastAutoRepairTime > AUTO_REPAIR_COOLDOWN && !isRestarting) {
        lastAutoRepairTime = now;
        setTimeout(async () => {
          try {
            console.log('🔧 MediaStream自動修復開始');
            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (pitchDetectorComponent && pitchDetectorComponent.reinitialize) {
              await pitchDetectorComponent.reinitialize(mediaStream);
            }
            console.log('✅ MediaStream自動修復完了');
          } catch (error) {
            console.error('❌ MediaStream自動修復失敗:', error);
          }
        }, 1000);
      }
    }
    
    if (audioEngineState === 'ready' && (!sampler || isLoading)) {
      issues.push('Audio engine ready but sampler not available');
    }
    
    if (pitchDetectorState === 'ready' && pitchDetectorComponent?.getIsInitialized && !pitchDetectorComponent.getIsInitialized()) {
      issues.push('PitchDetector ready but not initialized');
      
      // 自動修復: 未初期化のPitchDetectorを再初期化
      if (now - lastAutoRepairTime > AUTO_REPAIR_COOLDOWN && !isRestarting && mediaStream) {
        lastAutoRepairTime = now;
        setTimeout(async () => {
          try {
            console.log('🔧 PitchDetector自動再初期化開始');
            pitchDetectorState = 'initializing';
            await pitchDetectorComponent.reinitialize(mediaStream);
            pitchDetectorState = 'ready';
            console.log('✅ PitchDetector自動再初期化完了');
          } catch (error) {
            console.error('❌ PitchDetector自動再初期化失敗:', error);
            pitchDetectorState = 'error';
          }
        }, 500);
      }
    }
    
    return issues;
  }
  
  // Svelteリアクティブシステムによる状態同期
  $: canStartTraining = microphoneState === 'granted' && 
                       audioEngineState === 'ready' && 
                       pitchDetectorState === 'ready' && 
                       !isRestarting;

  $: canRestartSession = trainingPhase === 'results' && !isRestarting;

  // 定期的な状態一貫性チェック
  let stateCheckInterval;

  // PitchDetectorイベントハンドラー（新規追加）
  function handlePitchDetectorStateChange(event) {
    pitchDetectorState = event.detail.state;
    console.log(`🔄 PitchDetector状態変更: ${pitchDetectorState}`);
    
    // 状態変更後の一貫性チェック
    setTimeout(() => {
      const issues = validateSystemState();
      if (issues.length > 0) {
        console.warn('⚠️ 状態変更後の一貫性問題:', issues);
      }
    }, 100);
  }
  
  function handlePitchDetectorError(event) {
    console.error('❌ PitchDetectorエラー:', event.detail);
    recordAndRecover(event.detail.error, event.detail.context);
  }

  // クリーンアップ
  onDestroy(() => {
    // 状態チェック停止
    if (stateCheckInterval) {
      clearInterval(stateCheckInterval);
    }
    
    // コンポーネントクリーンアップ
    if (pitchDetectorComponent) {
      pitchDetectorComponent.cleanup();
    }
    
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
    <!-- メイントレーニングインターフェース -->
    
    {#if trainingPhase !== 'results'}
      <!-- Base Tone and Detection Side by Side -->
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
              {:else if trainingPhase === 'setup'}
                🎹 ランダム基音再生
              {:else}
                🔄 再生
              {/if}
            </Button>
            
            {#if currentBaseNote}
              <div class="base-note-info">
                現在の基音: <strong>{currentBaseNote}</strong> ({currentBaseFrequency.toFixed(1)}Hz)
              </div>
            {/if}
          </div>
        </Card>

        <!-- Detection Section (Always Visible) -->
        <Card class="main-card half-width">
          <div class="card-header">
            <h3 class="section-title">🎙️ リアルタイム音程検出</h3>
          </div>
          <div class="card-content">
            {#if mediaStream}
              <PitchDetector
                bind:this={pitchDetectorComponent}
                isActive={trainingPhase === 'guiding'}
                on:pitchUpdate={handlePitchUpdate}
                on:stateChange={handlePitchDetectorStateChange}
                on:error={handlePitchDetectorError}
                className="pitch-detector-content"
              />
            {:else}
              <div class="pitch-detector-placeholder">
                マイク許可待ち...
              </div>
            {/if}
            
          </div>
        </Card>
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
              class="primary-button" 
              disabled={!canRestartSession}
              on:click={restartSession}
            >
              {#if isRestarting}
                🔄 準備中...
              {:else}
                🔄 再挑戦
              {/if}
            </Button>
            <Button class="secondary-button">
              🎊 SNS共有
            </Button>
            <Button class="secondary-button" on:click={goHome}>
              🏠 ホーム
            </Button>
          </div>
        </div>
      </Card>
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
    gap: 1.5rem;
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
</style>