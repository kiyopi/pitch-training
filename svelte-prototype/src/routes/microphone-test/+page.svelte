<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import Card from '$lib/components/Card.svelte';
  import Button from '$lib/components/Button.svelte';
  import PageLayout from '$lib/components/PageLayout.svelte';
  import PitchDetector from '$lib/components/PitchDetector.svelte';
  import PitchDetectionDisplay from '$lib/components/PitchDetectionDisplay.svelte';
  import VolumeBar from '$lib/components/VolumeBar.svelte';
  import { audioManager } from '$lib/audio/AudioManager.js';
  
  // URL パラメータから mode を取得
  let mode = 'random';
  
  onMount(() => {
    if ($page.url.searchParams.has('mode')) {
      mode = $page.url.searchParams.get('mode') || 'random';
    }
  });

  // マイクテスト状態管理（シンプル版）
  let micPermission = 'initial'; // 'initial' | 'pending' | 'granted' | 'denied'

  // 音程検出
  let currentVolume = 0;
  let currentFrequency = 0;
  let detectedNote = 'ーー';
  let pitchDetectorComponent = null;

  // デバイス検出（AudioManager統一版）
  let platformSpecs = null;
  
  onMount(() => {
    // AudioManagerから統一設定を取得
    platformSpecs = audioManager.getPlatformSpecs();
  });

  // トレーニングモード設定
  const trainingModes = {
    random: {
      name: 'ランダム基音モード',
      description: '10種類の基音からランダムに選択してトレーニング',
      color: 'green',
      path: '/training/random'
    },
    continuous: {
      name: '連続チャレンジモード',
      description: '選択した回数だけ連続で実行し、総合評価を確認',
      color: 'orange',
      path: '/training/continuous'
    },
    chromatic: {
      name: '12音階モード',
      description: 'クロマチックスケールの上行・下行で完全制覇',
      color: 'purple',
      path: '/training/chromatic'
    }
  };

  const selectedMode = trainingModes[mode] || trainingModes.random;
  
  // マイク許可確認（シンプル版 - ランダム基音ページから移植）
  async function requestMicrophone() {
    micPermission = 'pending';
    
    try {
      console.log('🎤 [MicTest] マイク許可リクエスト開始');
      
      if (!navigator.mediaDevices?.getUserMedia) {
        micPermission = 'denied';
        console.error('❌ [MicTest] getUserMediaがサポートされていません');
        return;
      }
      
      // AudioManagerから共有リソースを取得（初回のみマイク許可ダイアログ表示）
      const resources = await audioManager.initialize();
      console.log('✅ [MicTest] AudioManager リソース取得完了');
      
      // マイク許可が取得できたことを確認
      if (resources.mediaStream && resources.audioContext) {
        micPermission = 'granted';
        console.log('✅ [MicTest] マイク許可完了');
        
        // iPadマイク安定化処理
        await onMicrophoneGranted();
        
        // PitchDetector初期化（マイク許可後）
        // Safari対応: より長い待機時間でMediaStream安定化
        setTimeout(async () => {
          if (pitchDetectorComponent) {
            console.log('🎙️ [MicTest] PitchDetector初期化開始');
            
            // PitchDetector初期化前にもAudioContext再開確認
            await ensureAudioContextRunning();
            
            await pitchDetectorComponent.initialize();
            console.log('✅ [MicTest] PitchDetector初期化完了');
            
            // リアクティブなisActiveで自動検出開始されるため手動呼び出し不要
            console.log('🎯 [MicTest] PitchDetector isActiveリアクティブで自動検出開始');
          }
        }, 1000);
      } else {
        throw new Error('リソース取得失敗');
      }
      
    } catch (error) {
      console.error('❌ [MicTest] マイク許可エラー:', error);
      micPermission = (error?.name === 'NotAllowedError') ? 'denied' : 'denied';
    }
  }
  
  // トレーニング開始関数
  function startTraining() {
    console.log('🚀 [MicTest] トレーニング開始 - ランダム基音モードへ遷移');
    // マイクテスト完了フラグを保存
    localStorage.setItem('mic-test-completed', 'true');
    console.log('✅ [MicTest] マイクテスト完了フラグを保存');
    goto(`${base}${selectedMode.path}?from=microphone-test`);
  }

  // PitchDetectorコンポーネントからのイベントハンドラー
  function handlePitchUpdate(event) {
    const { frequency, note, volume, rawVolume, clarity } = event.detail;
    
    currentFrequency = frequency;
    detectedNote = note;
    currentVolume = volume;
  }
  
  function handlePitchDetectorStateChange(event) {
    // ログ削除（シンプル版）
  }
  
  function handlePitchDetectorError(event) {
    console.error('❌ [MicTest] PitchDetectorエラー:', event.detail);
    
    const { error, reason, recovery } = event.detail;
    
    // MediaStream終了エラーの場合は自動復旧を試行
    if (reason === 'mediastream_ended' && recovery === 'restart_required') {
      console.log('🔄 [MicTest] MediaStream終了検出 - 自動復旧開始');
      
      // マイク許可状態をリセット
      micPermission = 'initial';
      
      // 検出データをリセット
      currentVolume = 0;
      currentFrequency = 0;
      detectedNote = 'ーー';
      
      // ユーザーに再許可を促すメッセージ（自動的に表示される）
      console.log('⚠️ [MicTest] マイク再許可が必要です');
    }
  }



  // マイク許可完了時の処理を拡張
  async function onMicrophoneGranted() {
    // iPadマイク安定化処理
    if (platformSpecs && (platformSpecs.deviceType === 'iPad')) {
      console.log('🔧 [MicTest] iPad検出 - マイク感度7.0x自動設定開始');
      
      // iPad専用: 7.0x感度で安定化
      audioManager.setSensitivity(7.0);
      
      console.log('✅ [MicTest] iPad マイク感度7.0x自動設定完了');
      
      // AudioManager再初期化でマイク接続安定化
      try {
        await audioManager.initialize();
        console.log('🔄 [MicTest] iPad用AudioManager再初期化完了');
      } catch (error) {
        console.warn('⚠️ [MicTest] AudioManager再初期化エラー:', error);
      }
    }
  }
</script>

<svelte:head>
  <title>マイクテスト - 相対音感トレーニング</title>
</svelte:head>

<PageLayout showBackButton={true}>
  <div class="microphone-test">
    <!-- ヘッダー -->
    <div class="header">
      <div class="mic-test-header">
        <div class="mic-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" x2="12" y1="19" y2="22"/>
            <line x1="8" x2="16" y1="22" y2="22"/>
          </svg>
        </div>
        <div>
          <h1 class="mic-test-title">マイクテスト</h1>
          <p class="mic-test-description">音感トレーニングを始める前に、マイクの動作を確認します</p>
        </div>
      </div>
    </div>

    <!-- トレーニングモード情報 -->
    <div class="training-mode-info">
      <Card variant="default" padding="lg">
        <div class="training-mode-content">
          {#if micPermission === 'granted'}
            <!-- マイク許可完了 -->
            <h3 class="ready-title">マイク準備完了</h3>
            <p class="ready-description">トレーニングを開始してください</p>
            
            <div class="training-start-button-area">
              <button class="training-start-button enabled" on:click={startTraining}>
                トレーニング開始
              </button>
            </div>
          {:else}
            <!-- マイクテスト説明 -->
            <h3 class="instructions-title">マイクのテストを開始します</h3>
            <p class="instructions-description">マイクテスト開始ボタンを押してマイクの使用を許可してください</p>
            
            {#if micPermission === 'pending'}
              <p class="status-text">マイク準備中...</p>
            {:else if micPermission === 'denied'}
              <div class="mic-test-button-area">
                <button class="mic-test-button retry" on:click={requestMicrophone}>
                  マイク許可を再試行
                </button>
              </div>
            {:else if micPermission === 'initial'}
              <div class="mic-test-button-area">
                <button class="mic-test-button start" on:click={requestMicrophone}>
                  マイクテストを開始
                </button>
              </div>
            {/if}
          {/if}
        </div>
      </Card>
    </div>

    <!-- リアルタイム音程検出エリア（常時表示） -->
    <PitchDetectionDisplay
      frequency={currentFrequency}
      note={detectedNote}
      volume={currentVolume}
      isMuted={micPermission !== 'granted'}
      muteMessage="マイク許可後に開始"
    />
    
    <!-- PitchDetectorコンポーネント（非表示・検出処理のみ） -->
    <div style="display: none;">
      <PitchDetector
        bind:this={pitchDetectorComponent}
        isActive={micPermission === 'granted'}
        on:pitchUpdate={handlePitchUpdate}
        on:stateChange={handlePitchDetectorStateChange}
        on:error={handlePitchDetectorError}
        className="pitch-detector-content"
        debugMode={false}
      />
    </div>

  </div>
</PageLayout>

<style>
  .microphone-test {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .header {
    text-align: center;
  }

  .mic-test-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
    margin-bottom: var(--space-4);
  }

  .mic-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background-color: #dbeafe;
    color: #2563eb;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .mic-test-title {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-2) 0;
  }

  .mic-test-description {
    font-size: var(--text-base);
    color: var(--color-gray-600);
    margin: 0;
  }

  .training-mode-info {
    margin-bottom: var(--space-6);
  }

  .training-mode-content {
    text-align: center;
  }

  .training-mode-title {
    font-size: var(--text-xl);
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-2) 0;
  }

  .training-mode-description {
    font-size: var(--text-base);
    color: var(--color-gray-600);
    margin: 0;
  }

  .mic-test-instructions {
    text-align: center;
    margin-bottom: var(--space-6);
  }

  .instructions-title {
    font-size: var(--text-xl);
    font-weight: 600;
    color: var(--color-gray-900);
    margin: var(--space-4) 0 var(--space-2) 0;
    text-align: center;
  }

  .instructions-description {
    font-size: var(--text-sm);
    color: var(--color-gray-600);
    margin: 0;
    text-align: center;
  }

  .status-text {
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--color-gray-900);
    margin: var(--space-6) 0;
    text-align: center;
  }

  .status-text.voice-instruction {
    color: #2563eb;
    font-size: var(--text-xl);
    font-weight: 700;
  }

  .ready-title {
    font-size: var(--text-xl);
    font-weight: 600;
    color: #2563eb;
    margin: var(--space-4) 0 var(--space-2) 0;
    text-align: center;
  }

  .ready-description {
    font-size: var(--text-sm);
    color: var(--color-gray-600);
    margin: 0 0 var(--space-6) 0;
    text-align: center;
  }

  .mic-test-button-area,
  .training-start-button-area {
    margin-top: var(--space-6);
    display: flex;
    justify-content: center;
  }

  .mic-test-button {
    max-width: 300px;
    width: 100%;
    padding: 12px 16px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .mic-test-button.start {
    background-color: #2563eb;
    color: white;
  }

  .mic-test-button.start:hover {
    background-color: #1d4ed8;
  }

  .mic-test-button.preparing {
    background-color: #f59e0b;
    color: white;
    cursor: not-allowed;
  }

  .mic-test-button.confirming {
    background-color: #8b5cf6;
    color: white;
    cursor: not-allowed;
  }

  .mic-test-button.retry {
    background-color: #dc2626;
    color: white;
  }

  .mic-test-button.retry:hover {
    background-color: #b91c1c;
  }

  .training-start-button {
    max-width: 300px;
    width: 100%;
    padding: 12px 16px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background-color: #059669;
    color: white;
  }

  .training-start-button.enabled:hover {
    background-color: #047857;
  }

  .mic-status-granted {
    margin-bottom: var(--space-4);
    text-align: center;
  }

  .status-indicator.success {
    background-color: #d1fae5;
    color: #065f46;
    border: 1px solid #34d399;
  }

  .mic-test-content {
    text-align: center;
  }

  .mic-status {
    margin-bottom: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .status-indicator {
    padding: var(--space-3);
    border-radius: 8px;
    font-weight: 600;
    font-size: var(--text-sm);
  }

  .status-indicator.pending {
    background-color: #fef3c7;
    color: #92400e;
    border: 1px solid #fcd34d;
  }


  .status-indicator.error {
    background-color: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
  }

  .start-button,
  .retry-button {
    max-width: 300px;
    width: 100%;
    margin: 0 auto;
    padding: 12px 16px;
    background-color: #2563eb;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .start-button:hover,
  .retry-button:hover {
    background-color: #1d4ed8;
  }

  .training-button {
    max-width: 300px;
    width: 100%;
    margin: 0 auto;
    padding: 12px 16px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .training-button.enabled {
    background-color: #059669;
    color: white;
  }

  .training-button.enabled:hover {
    background-color: #047857;
  }

  .training-button.disabled {
    background-color: #f3f4f6;
    color: #9ca3af;
    cursor: not-allowed;
  }

  .guidance-text {
    font-size: var(--text-sm);
    color: #2563eb;
    font-weight: 600;
    margin-bottom: var(--space-2);
    text-align: center;
  }


  .ready-title {
    color: #059669;
    font-size: var(--text-lg);
    font-weight: 600;
    text-align: center;
    margin-bottom: var(--space-2);
  }

  .ready-description {
    color: #6b7280;
    text-align: center;
    margin-bottom: var(--space-4);
  }


  @media (min-width: 768px) {
    .mic-test-header {
      flex-direction: row;
      text-align: left;
    }
  }

  /* カードスタイル（shadcn/ui風） */
  :global(.main-card) {
    border: 1px solid hsl(214.3 31.8% 91.4%) !important;
    background: hsl(0 0% 100%) !important;
    border-radius: 8px !important;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06) !important;
    margin-bottom: 1.5rem;
  }
</style>