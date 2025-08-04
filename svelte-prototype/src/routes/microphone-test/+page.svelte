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
    
    // 既存の音域データを確認
    checkExistingVocalRange();
  });
  
  // 既存音域データ確認
  function checkExistingVocalRange() {
    if (typeof localStorage !== 'undefined') {
      const savedRange = localStorage.getItem('vocal-range');
      if (savedRange) {
        try {
          existingVocalRange = JSON.parse(savedRange);
          console.log('既存音域データ発見:', existingVocalRange);
        } catch (error) {
          console.error('音域データ解析エラー:', error);
          existingVocalRange = null;
        }
      }
    }
  }

  // マイクテスト状態管理（シンプル版）
  let micPermission = 'initial'; // 'initial' | 'pending' | 'granted' | 'denied'

  // 音程検出
  let currentVolume = 0;
  let currentFrequency = 0;
  let detectedNote = 'ーー';
  let pitchDetectorComponent = null;

  // 音域測定状態
  let showVocalRangeTest = false;
  let vocalRangeStep = 'intro'; // 'intro' | 'low' | 'high' | 'complete'
  let lowestNote = null;
  let lowestFrequency = null;
  let highestNote = null;
  let highestFrequency = null;
  let isRecording = false;
  let recordingCountdown = 0;
  
  // 既存音域データ
  let existingVocalRange = null;

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

  // 音域測定開始
  function startVocalRangeTest() {
    showVocalRangeTest = true;
    vocalRangeStep = 'intro';
  }


  // 低音測定開始
  function startLowNoteTest() {
    vocalRangeStep = 'low';
    startRecording();
  }

  // 高音測定開始
  function startHighNoteTest() {
    vocalRangeStep = 'high';
    startRecording();
  }

  // 録音開始
  function startRecording() {
    isRecording = true;
    recordingCountdown = 3;
    
    // カウントダウン
    const interval = setInterval(() => {
      recordingCountdown--;
      if (recordingCountdown <= 0) {
        clearInterval(interval);
        // 3秒間録音
        setTimeout(() => {
          stopRecording();
        }, 3000);
      }
    }, 1000);
  }

  // 録音停止と結果処理
  function stopRecording() {
    isRecording = false;
    
    if (vocalRangeStep === 'low') {
      // 最低音を記録（有効な音程が検出された場合のみ）
      if (detectedNote !== 'ーー' && currentFrequency > 50) {
        lowestNote = detectedNote;
        lowestFrequency = currentFrequency;
        console.log('最低音記録:', lowestNote, lowestFrequency);
      } else {
        // 音程が検出されなかった場合は再試行
        console.log('最低音が検出されませんでした。もう一度お試しください。');
        // 再度録音開始
        setTimeout(() => {
          startRecording();
        }, 1000);
      }
    } else if (vocalRangeStep === 'high') {
      // 最高音を記録
      if (detectedNote !== 'ーー' && currentFrequency > 50) {
        highestNote = detectedNote;
        highestFrequency = currentFrequency;
        console.log('最高音記録:', highestNote, highestFrequency);
        
        // 両方記録できたら完了
        if (lowestNote && highestNote) {
          vocalRangeStep = 'complete';
          saveVocalRange();
        }
      } else {
        // 音程が検出されなかった場合は再試行
        console.log('最高音が検出されませんでした。もう一度お試しください。');
        setTimeout(() => {
          startRecording();
        }, 1000);
      }
    }
  }

  // 音域データ保存
  function saveVocalRange() {
    const vocalRangeData = {
      measured: true,
      measuredAt: new Date().toISOString(),
      lowestNote,
      lowestFrequency,
      highestNote,
      highestFrequency,
      range: `${lowestNote}-${highestNote}`
    };
    
    localStorage.setItem('vocal-range', JSON.stringify(vocalRangeData));
    console.log('音域データ保存:', vocalRangeData);
  }

  // 音域測定完了
  function completeVocalRangeTest() {
    showVocalRangeTest = false;
    // 最新データを読み込み直し
    checkExistingVocalRange();
  }
  
  // 音域再測定
  function retestVocalRange() {
    // 既存データをクリア
    existingVocalRange = null;
    lowestNote = null;
    lowestFrequency = null;
    highestNote = null;
    highestFrequency = null;
    
    // 測定開始
    startVocalRangeTest();
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
            
            {#if !showVocalRangeTest}
              {#if existingVocalRange}
                <!-- 既存音域データ表示 -->
                <div class="existing-vocal-range">
                  <div class="existing-range-header">
                    <div class="range-icon">🎵</div>
                    <div class="range-info">
                      <h4 class="range-title">音域データ保存済み</h4>
                      <p class="range-value">{existingVocalRange.range}</p>
                      <p class="range-date">測定日: {new Date(existingVocalRange.measuredAt).toLocaleDateString('ja-JP')}</p>
                    </div>
                  </div>
                  <div class="range-actions">
                    <button class="button-ghost small" on:click={retestVocalRange}>
                      再測定
                    </button>
                  </div>
                </div>
              {:else}
                <!-- 音域測定オプション -->
                <div class="vocal-range-option">
                  <p class="vocal-range-prompt">音域を測定しますか？（推奨・約1分）</p>
                  <div class="button-group">
                    <button class="button-secondary" on:click={startVocalRangeTest}>
                      音域を測定する
                    </button>
                  </div>
                </div>
              {/if}
              
              <div class="training-start-button-area">
                <button class="training-start-button enabled" on:click={startTraining}>
                  トレーニング開始
                </button>
              </div>
            {/if}
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
  
  <!-- 音域測定モーダル -->
  {#if showVocalRangeTest}
    <div class="vocal-range-modal-overlay">
      <div class="vocal-range-modal">
        <Card variant="default" padding="xl">
          {#if vocalRangeStep === 'intro'}
            <!-- 説明画面 -->
            <div class="vocal-range-content">
              <h2 class="vocal-range-title">音域測定</h2>
              <p class="vocal-range-description">
                あなたの音域を測定します。<br>
                最低音と最高音を記録することで、<br>
                最適なトレーニングを提供します。
              </p>
              <div class="vocal-range-steps">
                <div class="step">
                  <div class="step-number">1</div>
                  <div class="step-text">できるだけ低い声で「アー」と歌う</div>
                </div>
                <div class="step">
                  <div class="step-number">2</div>
                  <div class="step-text">できるだけ高い声で「アー」と歌う</div>
                </div>
              </div>
              <button class="button-primary" on:click={startLowNoteTest}>
                測定を開始
              </button>
            </div>
          {:else if vocalRangeStep === 'low'}
            <!-- 低音測定 -->
            <div class="vocal-range-content">
              <h2 class="vocal-range-title">最低音の測定</h2>
              <p class="vocal-range-instruction">
                できるだけ低い声で「アー」と3秒間歌ってください
              </p>
              
              {#if recordingCountdown > 0}
                <div class="countdown">{recordingCountdown}</div>
              {:else if isRecording}
                <div class="recording-indicator">
                  <div class="recording-dot"></div>
                  <span>録音中...</span>
                </div>
              {/if}
              
              <div class="current-note-display {detectedNote !== 'ーー' && isRecording ? 'detecting' : ''}">
                <div class="note-label">検出音程</div>
                <div class="note-value">{detectedNote}</div>
                <div class="frequency-value">{currentFrequency.toFixed(1)} Hz</div>
                {#if isRecording && detectedNote !== 'ーー'}
                  <div class="detecting-indicator">音程を検出中...</div>
                {/if}
              </div>
              
              {#if lowestNote && !isRecording}
                <div class="result-display success">
                  <div class="success-icon">✓</div>
                  <p class="success-message">最低音を記録しました: <strong>{lowestNote}</strong></p>
                  <button class="button-primary" on:click={startHighNoteTest}>
                    次へ（最高音測定）
                  </button>
                </div>
              {:else if !isRecording && !recordingCountdown}
                <div class="retry-message">
                  <p>音程が検出されませんでした。再度録音します...</p>
                </div>
              {/if}
            </div>
          {:else if vocalRangeStep === 'high'}
            <!-- 高音測定 -->
            <div class="vocal-range-content">
              <h2 class="vocal-range-title">最高音の測定</h2>
              <p class="vocal-range-instruction">
                できるだけ高い声で「アー」と3秒間歌ってください
              </p>
              
              {#if recordingCountdown > 0}
                <div class="countdown">{recordingCountdown}</div>
              {:else if isRecording}
                <div class="recording-indicator">
                  <div class="recording-dot"></div>
                  <span>録音中...</span>
                </div>
              {/if}
              
              <div class="current-note-display {detectedNote !== 'ーー' && isRecording ? 'detecting' : ''}">
                <div class="note-label">検出音程</div>
                <div class="note-value">{detectedNote}</div>
                <div class="frequency-value">{currentFrequency.toFixed(1)} Hz</div>
                {#if isRecording && detectedNote !== 'ーー'}
                  <div class="detecting-indicator">音程を検出中...</div>
                {/if}
              </div>
              
              {#if highestNote && !isRecording}
                <div class="result-display">
                  <p>最高音: {highestNote}</p>
                </div>
              {/if}
            </div>
          {:else if vocalRangeStep === 'complete'}
            <!-- 測定完了 -->
            <div class="vocal-range-content">
              <h2 class="vocal-range-title">測定完了</h2>
              <div class="vocal-range-result">
                <div class="result-item">
                  <span class="result-label">あなたの音域</span>
                  <span class="result-value">{lowestNote} - {highestNote}</span>
                </div>
              </div>
              <p class="vocal-range-complete-message">
                音域データを保存しました。<br>
                各トレーニングモードで最適な基音が選択されます。
              </p>
              <div class="data-persistence-info">
                <p class="info-title">📁 データ保存について</p>
                <ul>
                  <li>ブラウザのlocalStorageに保存されます</li>
                  <li>ブラウザのデータをクリアするまで保持されます</li>
                  <li>マイクテストページから再測定可能です</li>
                </ul>
              </div>
              <button class="button-primary" on:click={completeVocalRangeTest}>
                完了
              </button>
            </div>
          {/if}
        </Card>
      </div>
    </div>
  {/if}
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

  /* 音域測定関連のスタイル */
  .vocal-range-option {
    margin: var(--space-6) 0;
    text-align: center;
  }

  .vocal-range-prompt {
    font-size: var(--text-base);
    color: var(--color-gray-600);
    margin-bottom: var(--space-4);
  }

  .button-group {
    display: flex;
    gap: var(--space-3);
    justify-content: center;
  }

  /* shadcn/ui風ボタン */
  .button-primary {
    background-color: hsl(222.2 47.4% 11.2%);
    color: hsl(210 40% 98%);
    padding: 10px 16px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .button-primary:hover {
    opacity: 0.9;
  }

  .button-secondary {
    background-color: hsl(210 40% 96.1%);
    color: hsl(222.2 47.4% 11.2%);
    padding: 10px 16px;
    border: 1px solid hsl(214.3 31.8% 91.4%);
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .button-secondary:hover {
    background-color: hsl(214.3 31.8% 91.4%);
  }

  .button-ghost {
    background-color: transparent;
    color: hsl(222.2 47.4% 11.2%);
    padding: 10px 16px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .button-ghost:hover {
    background-color: hsl(210 40% 96.1%);
  }

  /* モーダル */
  .vocal-range-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .vocal-range-modal {
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  }

  .vocal-range-content {
    text-align: center;
    padding: var(--space-4);
  }

  .vocal-range-title {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-4) 0;
  }

  .vocal-range-description {
    font-size: var(--text-base);
    color: var(--color-gray-600);
    line-height: 1.6;
    margin-bottom: var(--space-6);
  }

  .vocal-range-steps {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    margin: var(--space-6) 0;
  }

  .step {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    background-color: hsl(210 40% 96.1%);
    padding: var(--space-4);
    border-radius: 8px;
  }

  .step-number {
    width: 32px;
    height: 32px;
    background-color: hsl(222.2 47.4% 11.2%);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
  }

  .step-text {
    flex: 1;
    text-align: left;
    color: var(--color-gray-700);
  }

  .vocal-range-instruction {
    font-size: var(--text-lg);
    color: var(--color-gray-700);
    margin-bottom: var(--space-6);
  }

  .countdown {
    font-size: 64px;
    font-weight: 700;
    color: hsl(222.2 47.4% 11.2%);
    margin: var(--space-8) 0;
  }

  .recording-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    margin: var(--space-6) 0;
    font-size: var(--text-lg);
    color: #dc2626;
  }

  .recording-dot {
    width: 12px;
    height: 12px;
    background-color: #dc2626;
    border-radius: 50%;
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.1);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  .current-note-display {
    background-color: hsl(210 40% 96.1%);
    padding: var(--space-6);
    border-radius: 12px;
    margin: var(--space-6) 0;
    transition: all 0.3s ease;
    border: 2px solid transparent;
  }

  .current-note-display.detecting {
    background-color: hsl(142 71% 45% / 0.05);
    border-color: hsl(142 71% 45% / 0.3);
  }

  .note-label {
    font-size: var(--text-sm);
    color: var(--color-gray-600);
    margin-bottom: var(--space-2);
  }

  .note-value {
    font-size: 48px;
    font-weight: 700;
    color: hsl(222.2 47.4% 11.2%);
    margin-bottom: var(--space-2);
  }

  .frequency-value {
    font-size: var(--text-base);
    color: var(--color-gray-600);
  }

  .result-display {
    margin-top: var(--space-6);
  }

  .result-display p {
    font-size: var(--text-lg);
    color: var(--color-gray-700);
    margin-bottom: var(--space-4);
  }

  .vocal-range-result {
    background-color: hsl(210 40% 96.1%);
    padding: var(--space-6);
    border-radius: 12px;
    margin: var(--space-6) 0;
  }

  .result-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .result-label {
    font-size: var(--text-sm);
    color: var(--color-gray-600);
  }

  .result-value {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: hsl(222.2 47.4% 11.2%);
  }

  .vocal-range-complete-message {
    font-size: var(--text-base);
    color: var(--color-gray-600);
    line-height: 1.6;
    margin-bottom: var(--space-6);
  }

  /* 成功表示 */
  .result-display.success {
    background-color: hsl(142 71% 45% / 0.1);
    border: 1px solid hsl(142 71% 45% / 0.3);
    padding: var(--space-4);
    border-radius: 8px;
    margin-top: var(--space-4);
  }

  .success-icon {
    font-size: 32px;
    color: hsl(142 71% 45%);
    margin-bottom: var(--space-2);
  }

  .success-message {
    color: hsl(142 71% 35%);
    font-size: var(--text-base);
    margin-bottom: var(--space-4);
  }

  .success-message strong {
    font-weight: 700;
    font-size: var(--text-lg);
  }

  /* 再試行メッセージ */
  .retry-message {
    background-color: hsl(48 96% 89%);
    border: 1px solid hsl(48 96% 89% / 0.5);
    padding: var(--space-3);
    border-radius: 8px;
    margin-top: var(--space-4);
  }

  .retry-message p {
    color: hsl(45 93% 25%);
    font-size: var(--text-sm);
    margin: 0;
  }

  /* データ保存情報 */
  .data-persistence-info {
    background-color: hsl(210 40% 96.1%);
    padding: var(--space-4);
    border-radius: 8px;
    margin: var(--space-4) 0;
    text-align: left;
  }

  .info-title {
    font-weight: 600;
    color: var(--color-gray-900);
    margin-bottom: var(--space-2);
  }

  .data-persistence-info ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .data-persistence-info li {
    font-size: var(--text-sm);
    color: var(--color-gray-600);
    padding-left: var(--space-4);
    position: relative;
    margin-bottom: var(--space-1);
  }

  .data-persistence-info li:before {
    content: "•";
    position: absolute;
    left: 0;
    color: var(--color-gray-400);
  }

  /* 検出中インジケーター */
  .detecting-indicator {
    font-size: var(--text-sm);
    color: hsl(142 71% 45%);
    margin-top: var(--space-2);
    font-weight: 500;
  }

  /* 既存音域データ表示 */
  .existing-vocal-range {
    background-color: hsl(210 40% 96.1%);
    border: 1px solid hsl(214.3 31.8% 91.4%);
    border-radius: 12px;
    padding: var(--space-4);
    margin: var(--space-4) 0;
  }

  .existing-range-header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
  }

  .range-icon {
    font-size: 24px;
    flex-shrink: 0;
  }

  .range-info {
    flex: 1;
    text-align: left;
  }

  .range-title {
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-1) 0;
  }

  .range-value {
    font-size: var(--text-lg);
    font-weight: 700;
    color: hsl(222.2 47.4% 11.2%);
    margin: 0 0 var(--space-1) 0;
  }

  .range-date {
    font-size: var(--text-sm);
    color: var(--color-gray-600);
    margin: 0;
  }

  .range-actions {
    display: flex;
    justify-content: flex-end;
  }

  .button-ghost.small {
    padding: 6px 12px;
    font-size: var(--text-sm);
  }
</style>