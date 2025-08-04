<!--
TrainingCore.svelte - トレーニング共通コンポーネント
3モード（ランダム・連続・12音階）の統合基盤

設計方針:
- 既存ランダムモードからの共通部分抽出
- プロパティベース動作制御
- 基音再生システムの完全保護
- 評価システムの統合継承
-->

<script>
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import { ChevronRight, Music } from 'lucide-svelte';
  
  // UI コンポーネント
  import Card from '$lib/components/Card.svelte';
  import Button from '$lib/components/Button.svelte';
  import VolumeBar from '$lib/components/VolumeBar.svelte';
  import PitchDisplay from '$lib/components/PitchDisplay.svelte';
  import PitchDetector from '$lib/components/PitchDetector.svelte';
  import PitchDetectionDisplay from '$lib/components/PitchDetectionDisplay.svelte';
  import PageLayout from '$lib/components/PageLayout.svelte';
  
  // 音声処理
  import * as Tone from 'tone';
  import { audioManager } from '$lib/audio/AudioManager.js';
  import { harmonicCorrection } from '$lib/audio/HarmonicCorrection.js';
  import { logger } from '$lib/utils/debugUtils.js';
  
  // 採点システム
  import UnifiedScoreResultFixed from '$lib/components/scoring/UnifiedScoreResultFixed.svelte';
  import ActionButtons from '$lib/components/ActionButtons.svelte';
  import { EvaluationEngine } from '$lib/evaluation/EvaluationEngine';
  
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

  // =============================================================================
  // プロパティ設定（外部から制御）
  // =============================================================================
  
  export let mode = 'random';                    // 'random' | 'continuous' | 'chromatic'
  export let autoPlay = false;                   // 自動再生モード（連続モード用）
  export let sessionCount = 8;                   // セッション数
  export let baseNote = null;                    // 12音階モード用基音指定
  export let direction = 'asc';                  // 'asc' | 'desc' (12音階モード用)
  export let useLocalStorage = true;             // localStorage使用フラグ
  export let sessionKey = 'random-training-progress'; // localStorage キー
  
  // コールバック関数
  export let onSessionComplete = null;           // セッション完了時
  export let onAllComplete = null;               // 全完了時
  export let onMicrophoneError = null;           // マイクエラー時
  export let onStorageError = null;              // ストレージエラー時

  // =============================================================================
  // モード別設定
  // =============================================================================
  
  // 音階設定
  $: currentScale = mode === 'chromatic' 
    ? (direction === 'asc' 
        ? ['ド', 'ド#', 'レ', 'レ#', 'ミ', 'ファ', 'ファ#', 'ソ', 'ソ#', 'ラ', 'ラ#', 'シ']
        : ['シ', 'ラ#', 'ラ', 'ソ#', 'ソ', 'ファ#', 'ファ', 'ミ', 'レ#', 'レ', 'ド#', 'ド'])
    : ['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ', 'ド（高）'];

  // 基音プール（モード別）
  $: baseNotePool = mode === 'continuous'
    ? ['Bb3', 'B3', 'Db4', 'Eb4', 'F#4', 'G#4', 'Bb4', 'C#5', 'Eb5', 'F#5'] // 中級向け
    : ['C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'Gb4', 'Ab4', 'Bb3', 'B3'];     // 初級向け

  // =============================================================================
  // 状態管理
  // =============================================================================
  
  // マイク・音声システム
  let microphoneState = 'checking';              // 'checking' | 'granted' | 'denied' | 'error'
  let mediaStream = null;
  let audioContext = null;
  let sourceNode = null;
  let pitchDetectorComponent = null;
  
  // 基音再生システム（既存ロジック完全保護）
  let sampler = null;
  let isSamplerLoading = false;
  let isPlaying = false;
  
  // ガイドアニメーション
  let scaleSteps = [];
  let guideStartProgress = 0;
  let musicIconGlowing = false;
  let trainingPhase = 'waiting';
  
  // 音程検出
  let currentVolume = 0;
  let currentFrequency = 0;
  let detectedNote = 'ーー';
  let noteResults = [];
  let sessionStartTime = null;
  
  // UI状態
  let showScoreResult = false;
  let currentUnifiedScoreData = null;

  // =============================================================================
  // 初期化処理
  // =============================================================================
  
  onMount(async () => {
    console.log(`🚀 [TrainingCore] ${mode}モード初期化開始`);
    
    try {
      // localStorage初期化（useLocalStorageがtrueの場合のみ）
      if (useLocalStorage) {
        await loadProgress();
        console.log(`✅ [TrainingCore] localStorage初期化完了: セッション${$currentSessionId}/8`);
      }
      
      // マイク初期化
      await initializeMicrophone();
      
      // 基音再生システム初期化
      await initializeBaseNotePlaying();
      
      // ガイドシステム初期化
      initializeGuideSystem();
      
      console.log(`✅ [TrainingCore] ${mode}モード初期化完了`);
      
    } catch (error) {
      console.error(`❌ [TrainingCore] 初期化エラー:`, error);
      if (onMicrophoneError) onMicrophoneError(error.message);
    }
  });

  onDestroy(() => {
    if (sampler) {
      sampler.dispose();
    }
  });

  // =============================================================================
  // マイク制御（既存ロジック継承）
  // =============================================================================
  
  async function initializeMicrophone() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('from') === 'microphone-test') {
      microphoneState = 'granted';
      console.log('✅ [TrainingCore] マイクテスト経由でアクセス - 許可済み');
    } else {
      await checkExistingMicrophonePermission();
    }
    
    if (microphoneState === 'granted') {
      await checkMicrophonePermission();
    }
  }
  
  async function checkExistingMicrophonePermission() {
    try {
      const permissionStatus = await navigator.permissions.query({name: 'microphone'});
      if (permissionStatus.state === 'granted') {
        await checkMicrophonePermission();
      } else {
        microphoneState = 'denied';
        console.log('⚠️ [TrainingCore] マイク許可が必要です');
      }
    } catch (error) {
      console.error('❌ [TrainingCore] マイク許可確認エラー:', error);
      microphoneState = 'error';
    }
  }
  
  async function checkMicrophonePermission() {
    try {
      const resources = await audioManager.initialize();
      audioContext = resources.audioContext;
      mediaStream = resources.mediaStream;
      sourceNode = resources.sourceNode;
      microphoneState = 'granted';
      
      console.log('✅ [TrainingCore] AudioManager初期化完了');
      
    } catch (error) {
      console.error('❌ [TrainingCore] AudioManager初期化エラー:', error);
      microphoneState = 'error';
      if (onMicrophoneError) onMicrophoneError(error.message);
    }
  }

  // =============================================================================
  // 基音再生システム（既存ロジック完全保護）
  // =============================================================================
  
  async function initializeBaseNotePlaying() {
    try {
      isSamplerLoading = true;
      console.log('🎹 [TrainingCore] Salamander Grand Piano 読み込み開始');
      
      sampler = new Tone.Sampler({
        urls: { "C4": "C4.mp3" },
        baseUrl: "https://tonejs.github.io/audio/salamander/",
        release: 1.5
      }).toDestination();
      
      // Salamander Grand Piano 読み込み完了まで待機
      await Tone.loaded();
      isSamplerLoading = false;
      
      console.log('✅ [TrainingCore] Salamander Grand Piano 読み込み完了');
      
    } catch (error) {
      console.error('❌ [TrainingCore] 基音再生初期化エラー:', error);
      isSamplerLoading = false;
    }
  }
  
  async function playBaseNote() {
    if (isPlaying || !sampler || isSamplerLoading) return;
    
    try {
      // Tone.js AudioContext 開始確認
      if (Tone.context.state !== 'running') {
        await Tone.start();
        console.log('🔊 [TrainingCore] Tone.js AudioContext 開始');
      }
      
      isPlaying = true;
      const currentBaseNote = baseNote || $nextBaseNote;
      const volume = getVolumeForDevice();
      
      sampler.volume.value = volume;
      
      console.log(`🎹 [TrainingCore] 基音再生: ${currentBaseNote} (${volume}dB)`);
      sampler.triggerAttackRelease(currentBaseNote, '2n');
      
      // ガイドアニメーション開始
      startGuideAnimation();
      
      setTimeout(() => {
        isPlaying = false;
      }, 3000);
      
    } catch (error) {
      console.error('❌ [TrainingCore] 基音再生エラー:', error);
      isPlaying = false;
    }
  }
  
  // デバイス依存音量設定（既存ロジック）
  function getVolumeForDevice() {
    const isIPhone = /iPhone/.test(navigator.userAgent);
    const isIPad = /iPad/.test(navigator.userAgent);
    const isIPadOS = /Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;
    const isIOS = isIPhone || isIPad || isIPadOS;
    
    return isIOS ? 35 : -6;
  }

  // =============================================================================
  // ガイドシステム（ドレミガイドスタートバー含む）
  // =============================================================================
  
  function initializeGuideSystem() {
    scaleSteps = currentScale.map(() => ({ state: 'inactive' }));
    console.log(`🎵 [TrainingCore] ガイドシステム初期化: ${currentScale.length}音階`);
  }
  
  function startGuideAnimation() {
    trainingPhase = 'guiding';
    
    // ガイドスタートバーアニメーション
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 2;
      guideStartProgress = progress;
      
      if (progress >= 100) {
        clearInterval(progressInterval);
        musicIconGlowing = true;
        
        // 2秒後にガイド実行
        setTimeout(() => {
          executeGuideSequence();
        }, 2000);
      }
    }, 40);
  }
  
  function executeGuideSequence() {
    console.log('🎵 [TrainingCore] ガイドシーケンス開始');
    
    let currentIndex = 0;
    const guideInterval = setInterval(() => {
      if (currentIndex < scaleSteps.length) {
        scaleSteps[currentIndex].state = 'active';
        currentIndex++;
        scaleSteps = [...scaleSteps];
      } else {
        clearInterval(guideInterval);
        trainingPhase = 'listening';
        
        // セッション開始
        sessionStartTime = Date.now();
        noteResults = currentScale.map(name => ({ 
          name, 
          cents: null, 
          targetFreq: 0, 
          detectedFreq: 0, 
          diff: 0, 
          accuracy: 0 
        }));
        
        console.log('🎤 [TrainingCore] リスニングフェーズ開始');
      }
    }, 500);
  }

  // =============================================================================
  // セッション完了処理
  // =============================================================================
  
  async function completeSession() {
    if (!sessionStartTime) return;
    
    const duration = Math.round((Date.now() - sessionStartTime) / 1000);
    const currentBaseNote = baseNote || $nextBaseNote;
    const currentBaseName = $nextBaseName;
    
    console.log(`✅ [TrainingCore] セッション完了: ${duration}秒`);
    
    if (useLocalStorage) {
      // localStorage保存
      const success = await saveSessionResult(noteResults, duration, currentBaseNote, currentBaseName);
      if (success) {
        console.log('✅ [TrainingCore] セッション結果保存完了');
        
        // 統合採点データ生成
        currentUnifiedScoreData = $unifiedScoreData;
        showScoreResult = true;
        
        // コールバック実行
        if (onSessionComplete) onSessionComplete();
        
        // 8セッション完了確認
        if ($isCompleted && onAllComplete) {
          onAllComplete();
        }
      }
    } else {
      // 12音階モード等：一時的な結果表示
      currentUnifiedScoreData = {
        mode: mode,
        sessionHistory: [{
          sessionId: 1,
          grade: EvaluationEngine.evaluateSession(noteResults),
          accuracy: EvaluationEngine.calculateAccuracy(noteResults),
          baseNote: currentBaseNote,
          baseName: currentBaseName,
          noteResults: noteResults,
          completedAt: new Date().toISOString()
        }],
        isCompleted: true,
        totalSessions: 1,
        targetSessions: 1
      };
      showScoreResult = true;
      
      if (onSessionComplete) onSessionComplete();
    }
  }

  // =============================================================================
  // PitchDetector イベントハンドラ
  // =============================================================================
  
  function handlePitchUpdate(event) {
    const { frequency, note, volume } = event.detail;
    currentFrequency = frequency;
    detectedNote = note;
    currentVolume = volume;
    
    // 音程検出結果を記録（実装は既存ロジックから移植）
    // TODO: 詳細な音程評価ロジックを実装
  }
  
  function handlePitchDetectorError(event) {
    console.error('❌ [TrainingCore] PitchDetectorエラー:', event.detail);
    if (onMicrophoneError) onMicrophoneError(event.detail.error);
  }

  // =============================================================================
  // アクションボタン
  // =============================================================================
  
  function handleRestart() {
    showScoreResult = false;
    trainingPhase = 'waiting';
    guideStartProgress = 0;
    musicIconGlowing = false;
    initializeGuideSystem();
  }
  
  function handleNextSession() {
    handleRestart();
    // 自動モードの場合は自動的に次のセッションを開始
    if (autoPlay && !$isCompleted) {
      setTimeout(() => playBaseNote(), 1000);
    }
  }
  
  function handleBackToHome() {
    goto(`${base}/`);
  }
</script>

<!-- HTML テンプレート -->
<div class="training-core">
  
  {#if microphoneState !== 'granted'}
    <!-- マイク許可待ち -->
    <Card class="main-card">
      <div class="card-content text-center">
        <h3>マイク許可が必要です</h3>
        <p>マイクテストページから開始してください</p>
        <Button variant="primary" on:click={handleBackToHome}>
          ホームに戻る
        </Button>
      </div>
    </Card>
    
  {:else if showScoreResult && currentUnifiedScoreData}
    <!-- セッション結果表示 -->
    <UnifiedScoreResultFixed 
      currentScoreData={currentUnifiedScoreData}
      intervalData={[]}
      consistencyData={[]}
      feedbackData={null}
      technicalFeedbackData={null}
    />
    
    <ActionButtons
      showRestart={!$isCompleted}
      showNext={!$isCompleted}
      showHome={true}
      on:restart={handleRestart}
      on:next={handleNextSession}
      on:home={handleBackToHome}
    />
    
  {:else}
    <!-- メイントレーニング画面 -->
    
    <!-- 進捗表示 -->
    {#if useLocalStorage}
      <Card class="main-card">
        <div class="card-header">
          <h3 class="section-title">📊 進捗状況</h3>
        </div>
        <div class="card-content">
          <div class="progress-info">
            <div class="session-counter">
              セッション {$currentSessionId} / {sessionCount}
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: {$progressPercentage}%"></div>
            </div>
          </div>
        </div>
      </Card>
    {/if}
    
    <!-- 基音再生エリア -->
    <div class="side-by-side-container">
      <Card class="main-card half-width">
        <div class="card-header">
          <h3 class="section-title">🎹 基音再生</h3>
        </div>
        <div class="card-content">
          <Button 
            variant="primary"
            disabled={isPlaying || isSamplerLoading || (autoPlay && trainingPhase === 'guiding')}
            on:click={playBaseNote}
          >
            {#if isPlaying}
              🎵 再生中...
            {:else if isSamplerLoading}
              ⏳ 読み込み中...
            {:else if autoPlay}
              🔄 自動再生モード
            {:else}
              🎹 基音再生
            {/if}
          </Button>
          
          <!-- ドレミガイドスタートバー（常時表示） -->
          <div class="guide-start-bar-container">
            <div class="guide-start-label">ガイド開始まで</div>
            <div class="guide-start-bar">
              <div class="guide-progress-fill" style="width: {guideStartProgress}%"></div>
              <div class="guide-music-icon {musicIconGlowing ? 'glowing' : ''}">
                <Music size="20" />
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      <!-- リアルタイム検出エリア -->
      <Card class="main-card half-width">
        <div class="card-header">
          <h3 class="section-title">🎤 リアルタイム検出</h3>
        </div>
        <div class="card-content">
          <PitchDetectionDisplay
            frequency={currentFrequency}
            note={detectedNote}
            volume={currentVolume}
            isMuted={false}
          />
        </div>
      </Card>
    </div>
    
    <!-- ガイド表示 -->
    <Card class="main-card">
      <div class="card-header">
        <h3 class="section-title">🎵 {mode === 'chromatic' ? '12' : '8'}音階ガイド</h3>
      </div>
      <div class="card-content">
        <div class="scale-guide">
          {#each currentScale as step, index}
            <div class="scale-item {scaleSteps[index]?.state || 'inactive'}">
              {step}
            </div>
          {/each}
        </div>
      </div>
    </Card>
    
    <!-- PitchDetector（非表示・検出処理のみ） -->
    <div style="display: none;">
      <PitchDetector
        bind:this={pitchDetectorComponent}
        isActive={microphoneState === 'granted' && trainingPhase === 'listening'}
        on:pitchUpdate={handlePitchUpdate}
        on:error={handlePitchDetectorError}
        debugMode={false}
      />
    </div>
    
  {/if}
</div>

<style>
  .training-core {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .side-by-side-container {
    display: flex;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .half-width {
    flex: 1;
    min-width: 300px;
  }

  .progress-info {
    text-align: center;
  }

  .session-counter {
    font-size: var(--text-lg);
    font-weight: 600;
    margin-bottom: var(--space-3);
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    background-color: var(--color-gray-200);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background-color: var(--color-green-500);
    transition: width 0.3s ease;
  }

  /* ドレミガイドスタートバー */
  .guide-start-bar-container {
    margin-top: var(--space-4);
    text-align: center;
  }

  .guide-start-label {
    font-size: var(--text-sm);
    color: var(--color-gray-600);
    margin-bottom: var(--space-2);
  }

  .guide-start-bar {
    position: relative;
    width: 100%;
    height: 24px;
    background-color: var(--color-gray-200);
    border-radius: 12px;
    overflow: hidden;
  }

  .guide-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #1d4ed8);
    transition: width 0.1s linear;
  }

  .guide-music-icon {
    position: absolute;
    top: 50%;
    right: 8px;
    transform: translateY(-50%);
    color: white;
    transition: all 0.3s ease;
  }

  .guide-music-icon.glowing {
    animation: pulse-glow 1s infinite alternate;
    filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.8));
  }

  @keyframes pulse-glow {
    0% { transform: translateY(-50%) scale(1); }
    100% { transform: translateY(-50%) scale(1.2); }
  }

  /* ガイド表示 */
  .scale-guide {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    justify-content: center;
  }

  .scale-item {
    padding: var(--space-2) var(--space-3);
    border-radius: 6px;
    font-weight: 600;
    font-size: var(--text-sm);
    transition: all 0.3s ease;
  }

  .scale-item.inactive {
    background-color: var(--color-gray-200);
    color: var(--color-gray-600);
  }

  .scale-item.active {
    background-color: var(--color-blue-500);
    color: white;
    transform: scale(1.1);
  }

  /* カードスタイル */
  .card-header .section-title {
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0;
  }

  .card-content {
    padding: var(--space-4);
  }

  /* レスポンシブ */
  @media (max-width: 768px) {
    .side-by-side-container {
      flex-direction: column;
    }
    
    .half-width {
      min-width: unset;
    }
  }
</style>