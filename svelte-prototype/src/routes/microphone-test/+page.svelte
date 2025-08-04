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
  
  // 基音テスト状態管理
  let baseToneTestState = 'idle'; // 'idle' | 'playing' | 'detecting' | 'success'
  let baseToneTestTimer = null;
  let c3DetectionCount = 0;

  // 音程検出
  let currentVolume = 0;
  let currentFrequency = 0;
  let detectedNote = 'ーー';
  let pitchDetectorComponent = null;

  // 音量調整機能
  let baseToneVolume = 0; // -20dB ～ +10dB
  let micSensitivity = 1.0; // 0.1x ～ 10.0x
  let sampler = null;
  let isBaseTonePlaying = false;

  // デバイス検出（AudioManager統一版）
  let deviceInfo = '';
  let platformSpecs = null;
  
  onMount(() => {
    // localStorage状態デバッグ（最優先）
    console.log('🔍 [MicTest-Debug] localStorage完全状態確認開始');
    console.log('🔍 [MicTest-Debug] localStorage使用可能:', typeof Storage !== "undefined");
    console.log('🔍 [MicTest-Debug] localStorage.length:', localStorage.length);
    
    // 全localStorage内容を表示
    console.log('🔍 [MicTest-Debug] localStorage全内容:');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      console.log(`   ${key}: ${value}`);
    }
    
    // 対象キーの状態確認
    const targetKey = 'pitch-training-audio-settings';
    const stored = localStorage.getItem(targetKey);
    console.log(`🔍 [MicTest-Debug] 対象キー '${targetKey}' 存在:`, stored !== null);
    console.log(`🔍 [MicTest-Debug] 対象キー内容:`, stored);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log(`🔍 [MicTest-Debug] パース済み内容:`, parsed);
        console.log(`🔍 [MicTest-Debug] baseToneVolume値:`, parsed.baseToneVolume);
      } catch (error) {
        console.error('🔍 [MicTest-Debug] JSON パースエラー:', error);
      }
    }

    // AudioManagerから統一設定を取得
    platformSpecs = audioManager.getPlatformSpecs();
    deviceInfo = `${platformSpecs.deviceType}検出`;
    
    // 保存済み基音音量を読み込み（デフォルト値は自動適用）
    try {
      baseToneVolume = audioManager.getBaseToneVolume();
      console.log(`📖 [MicTest] 保存済み基音音量読み込み: ${baseToneVolume}dB`);
    } catch (error) {
      console.warn('⚠️ [MicTest] 基音音量読み込みエラー - デフォルト使用:', error);
      baseToneVolume = platformSpecs.isIOS ? 0 : -6;
    }
    
    console.log(`🔍 [MicTest] デバイス情報: ${deviceInfo}`, navigator.userAgent);
    console.log(`🔍 [MicTest] タッチサポート: ${'ontouchend' in document}`);
    console.log(`📊 [MicTest] プラットフォーム仕様適用: divisor=${platformSpecs.divisor}, gain=${platformSpecs.gainCompensation}`);
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
        
        // AudioContext状態確認・再開（マイク・基音両方に必要）
        await ensureAudioContextRunning();
        
        // 基音テスト初期化
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
    console.log(`✅ [MicTest] マイクテスト完了フラグ保存（基音音量は既に${baseToneVolume}dBで保存済み）`);
    goto(`${base}${selectedMode.path}?from=microphone-test`);
  }

  // PitchDetectorコンポーネントからのイベントハンドラー
  function handlePitchUpdate(event) {
    const { frequency, note, volume, rawVolume, clarity } = event.detail;
    
    currentFrequency = frequency;
    detectedNote = note;
    currentVolume = volume;
    
    // 基音テスト中のC3検出チェック
    if (frequency > 0) {
      checkC3Detection(frequency);
    }
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

  // 基音テスト機能
  async function initializeBaseToneTest() {
    try {
      console.log('🎹 [MicTest] 基音テスト初期化開始');
      
      // Tone.js動的読み込み
      if (typeof window !== 'undefined') {
        if (!window.Tone) {
          console.log('📦 [MicTest] Tone.js動的読み込み開始');
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/tone@latest/build/Tone.js';
          document.head.appendChild(script);
          
          // Tone.js読み込み完了を待機
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
          });
          console.log('✅ [MicTest] Tone.js読み込み完了');
        }
        
        await window.Tone.start();
        
        // Salamander Grand Piano サンプラー
        sampler = new window.Tone.Sampler({
          urls: { "C4": "C4.mp3" },
          baseUrl: "https://tonejs.github.io/audio/salamander/",
          release: 1.5,
          onload: () => {
            console.log('✅ [MicTest] 基音サンプラー読み込み完了');
          },
          onerror: (error) => {
            console.error('❌ [MicTest] 基音サンプラー読み込みエラー:', error);
          }
        }).toDestination();
        
        // 初期音量設定
        updateBaseToneVolume();
        
      } else {
        console.warn('⚠️ [MicTest] window未定義 - 基音テスト無効');
      }
    } catch (error) {
      console.error('❌ [MicTest] 基音テスト初期化エラー:', error);
    }
  }

  // 基音音量更新（AudioManager統合版）
  function updateBaseToneVolume() {
    console.log(`🔊 [MicTest-Debug] 基音音量更新開始: ${baseToneVolume}dB`);
    
    if (sampler) {
      sampler.volume.value = baseToneVolume;
      console.log(`🔊 [MicTest] Tone.js Sampler音量設定: ${baseToneVolume}dB`);
    }
    
    // AudioManagerに設定を保存（スライダー調整時即座に保存）
    try {
      console.log(`🔍 [MicTest-Debug] AudioManager保存前のlocalStorage状態確認`);
      const beforeSave = localStorage.getItem('pitch-training-audio-settings');
      console.log(`🔍 [MicTest-Debug] 保存前データ:`, beforeSave);
      
      const success = audioManager.setBaseToneVolume(baseToneVolume);
      
      console.log(`🔍 [MicTest-Debug] AudioManager保存後のlocalStorage状態確認`);
      const afterSave = localStorage.getItem('pitch-training-audio-settings');
      console.log(`🔍 [MicTest-Debug] 保存後データ:`, afterSave);
      
      if (success) {
        console.log(`✅ [MicTest] 基音音量をlocalStorageに保存成功: ${baseToneVolume}dB`);
        
        // 保存直後の検証読み込み
        const verification = audioManager.getBaseToneVolume();
        console.log(`🔍 [MicTest-Debug] 保存直後検証読み込み: ${verification}dB`);
        
      } else {
        console.warn(`⚠️ [MicTest] 基音音量保存失敗: ${baseToneVolume}dB`);
      }
    } catch (error) {
      console.error('❌ [MicTest] AudioManager基音音量保存エラー:', error);
    }
  }

  // AudioContext状態確認・再開処理
  async function ensureAudioContextRunning() {
    if (typeof window !== 'undefined' && window.Tone) {
      const context = window.Tone.context || window.Tone.getContext();
      if (context && context.state === 'suspended') {
        console.log('🔄 [MicTest] AudioContext suspended検出 - 再開中...');
        await context.resume();
        console.log('✅ [MicTest] AudioContext再開完了');
        return true; // 再開実行
      }
    }
    return false; // 再開不要
  }

  // 基音再生テスト
  async function playBaseTone() {
    if (!sampler || isBaseTonePlaying) return;
    
    try {
      isBaseTonePlaying = true;
      console.log('🎵 [MicTest] 基音再生開始: C4');
      
      // AudioContext状態確認・再開
      const wasResumed = await ensureAudioContextRunning();
      if (wasResumed) {
        console.log('🔊 [MicTest] AudioContext再開後に基音再生実行');
      }
      
      await sampler.triggerAttackRelease('C4', 2, window.Tone.now(), 0.7);
      
      // 2秒後に再生状態をリセット
      setTimeout(() => {
        isBaseTonePlaying = false;
        console.log('✅ [MicTest] 基音再生完了');
      }, 2000);
      
    } catch (error) {
      console.error('❌ [MicTest] 基音再生エラー:', error);
      isBaseTonePlaying = false;
    }
  }
  
  // 基音テスト用C3再生（130.81Hz）
  async function startBaseToneTest() {
    if (!sampler || baseToneTestState !== 'idle') return;
    
    try {
      // 状態をplayingに設定
      baseToneTestState = 'playing';
      c3DetectionCount = 0;
      console.log('🎵 [BaseToneTest] C3基音テスト開始');
      
      // AudioContext状態確認・再開
      await ensureAudioContextRunning();
      
      // C3を3秒間再生
      await sampler.triggerAttackRelease('C3', 3, window.Tone.now(), 0.8);
      
      // 再生後、検出モードに移行
      setTimeout(() => {
        if (baseToneTestState === 'playing') {
          baseToneTestState = 'detecting';
          console.log('🎤 [BaseToneTest] C3検出モード開始');
          
          // 10秒間検出を試みる
          baseToneTestTimer = setTimeout(() => {
            if (baseToneTestState === 'detecting') {
              baseToneTestState = 'idle';
              console.log('⏱️ [BaseToneTest] タイムアウト - 再試行してください');
            }
          }, 10000);
        }
      }, 3000);
      
    } catch (error) {
      console.error('❌ [BaseToneTest] エラー:', error);
      baseToneTestState = 'idle';
    }
  }
  
  // C3周波数検出チェック（130.81Hz ± 10Hz）
  function checkC3Detection(frequency) {
    if (baseToneTestState !== 'detecting') return;
    
    const C3_FREQUENCY = 130.81;
    const TOLERANCE = 10; // ±10Hz許容
    
    if (Math.abs(frequency - C3_FREQUENCY) <= TOLERANCE) {
      c3DetectionCount++;
      console.log(`🎯 [BaseToneTest] C3検出カウント: ${c3DetectionCount}`);
      
      // 5回連続で検出したら成功
      if (c3DetectionCount >= 5) {
        baseToneTestState = 'success';
        if (baseToneTestTimer) {
          clearTimeout(baseToneTestTimer);
          baseToneTestTimer = null;
        }
        console.log('✅ [BaseToneTest] C3検出成功！');
      }
    } else {
      // 範囲外の場合はカウントリセット
      c3DetectionCount = 0;
    }
  }

  // マイク感度調整
  function updateMicSensitivity() {
    try {
      // AudioManagerの感度調整
      audioManager.setSensitivity(micSensitivity);
      console.log(`🎤 [MicTest] マイク感度更新完了: ${micSensitivity}x`);
    } catch (error) {
      console.error('❌ [MicTest] マイク感度調整エラー:', error);
    }
  }

  // プリセット適用機能（仕様書準拠）
  function applyPreset(presetType) {
    // AudioManagerから仕様書準拠の設定を取得
    const platformSpecs = audioManager.getPlatformSpecs();
    
    switch (presetType) {
      case 'ipad-high':
        // 仕様書準拠 + 高感度設定
        baseToneVolume = 3; // +3dB（適度なブースト）
        // 仕様書のgainCompensation (1.5) + ユーザー調整 (2.0) = 3.0x
        micSensitivity = platformSpecs.gainCompensation * 2.0; // 3.0x
        break;
      case 'ipad-extreme':
        // 仕様書準拠 + 超高感度設定
        baseToneVolume = 7; // +7dB（強力ブースト）
        // 仕様書のgainCompensation (1.5) + 極限調整 (4.0) = 6.0x
        micSensitivity = platformSpecs.gainCompensation * 4.0; // 6.0x
        break;
      default:
        return;
    }
    
    // 設定を即座に適用
    updateBaseToneVolume();
    updateMicSensitivity();
    
    console.log(`🎯 [MicTest] ${presetType} プリセット適用: 基音${baseToneVolume}dB, マイク${micSensitivity}x`);
    console.log(`📊 [MicTest] プラットフォーム仕様: divisor=${platformSpecs.divisor}, gainCompensation=${platformSpecs.gainCompensation}, デバイス=${platformSpecs.deviceType}`);
  }

  // マイク許可完了時の処理を拡張
  async function onMicrophoneGranted() {
    // 基音テスト初期化
    await initializeBaseToneTest();
    
    // AudioManagerから現在のマイク感度を取得
    try {
      micSensitivity = audioManager.getSensitivity();
      console.log(`🎤 [MicTest] 現在のマイク感度取得: ${micSensitivity}x`);
    } catch (error) {
      console.warn('⚠️ [MicTest] マイク感度取得エラー:', error);
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
            <!-- マイク許可完了 - 音量調整エリア -->
            <h3 class="ready-title">マイク準備完了</h3>
            <p class="ready-description">音量を調整してからトレーニングを開始してください</p>
            
            <!-- デバイス情報表示（調査用） -->
            <div class="device-info">
              <span class="device-label">{deviceInfo}</span>
            </div>
            
            <!-- デバイス専用プリセットボタン -->
            {#if platformSpecs && (platformSpecs.isIOS || deviceInfo.includes('その他'))}
              <div class="preset-section">
                <h4 class="preset-title">
                  {platformSpecs.isIOS ? `${platformSpecs.deviceType}専用設定` : '高感度設定（テスト用）'}
                </h4>
                <div class="preset-buttons">
                  <button class="preset-button" on:click={() => applyPreset('ipad-high')}>
                    高感度設定
                  </button>
                  <button class="preset-button" on:click={() => applyPreset('ipad-extreme')}>
                    超高感度設定
                  </button>
                </div>
                <div class="preset-specs">
                  <small>仕様書準拠: divisor={platformSpecs?.divisor}, gain={platformSpecs?.gainCompensation}x</small>
                </div>
              </div>
            {/if}
            
            <!-- 音量調整コントロール -->
            <div class="volume-controls">
              <!-- 基音音量調整 -->
              <div class="volume-control-section">
                <label class="volume-label">
                  基音音量: {baseToneVolume}dB
                </label>
                <div class="volume-slider-container">
                  <span class="slider-min">-20dB</span>
                  <input 
                    type="range" 
                    min="-20" 
                    max="10" 
                    step="1"
                    bind:value={baseToneVolume}
                    on:input={updateBaseToneVolume}
                    class="volume-slider"
                  />
                  <span class="slider-max">+10dB</span>
                </div>
                <button 
                  class="base-tone-test-button"
                  on:click={playBaseTone}
                  disabled={isBaseTonePlaying}
                >
                  {isBaseTonePlaying ? '再生中...' : 'ド(C4)を再生'}
                </button>
              </div>
              
              <!-- マイク感度調整 -->
              <div class="volume-control-section">
                <label class="volume-label">
                  マイク感度: {micSensitivity.toFixed(1)}x
                </label>
                <div class="volume-slider-container">
                  <span class="slider-min">0.1x</span>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="10.0" 
                    step="0.1"
                    bind:value={micSensitivity}
                    on:input={updateMicSensitivity}
                    class="volume-slider"
                  />
                  <span class="slider-max">10.0x</span>
                </div>
              </div>
            </div>
            
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

  /* 音量調整機能のスタイル */
  .device-info {
    text-align: center;
    margin-bottom: var(--space-4);
  }

  .device-label {
    background-color: #dbeafe;
    color: #1e40af;
    padding: 4px 12px;
    border-radius: 16px;
    font-size: var(--text-sm);
    font-weight: 500;
  }

  .volume-controls {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: var(--space-4);
    margin: var(--space-4) 0;
  }

  .volume-control-section {
    margin-bottom: var(--space-4);
  }

  .volume-control-section:last-child {
    margin-bottom: 0;
  }

  .volume-label {
    display: block;
    font-size: var(--text-sm);
    font-weight: 600;
    color: #374151;
    margin-bottom: var(--space-2);
    text-align: center;
  }

  .volume-slider-container {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }

  .slider-min,
  .slider-max {
    font-size: var(--text-xs);
    color: #6b7280;
    min-width: 32px;
    text-align: center;
  }

  .volume-slider {
    flex: 1;
    -webkit-appearance: none;
    appearance: none;
    height: 6px;
    background: #e5e7eb;
    border-radius: 3px;
    outline: none;
  }

  .volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    background: #3b82f6;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  .volume-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: #3b82f6;
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  .base-tone-test-button {
    width: 100%;
    padding: var(--space-2) var(--space-4);
    background-color: #059669;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: var(--text-sm);
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .base-tone-test-button:hover:not(:disabled) {
    background-color: #047857;
  }

  .base-tone-test-button:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
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

  /* プリセット機能のスタイル */
  .preset-section {
    background-color: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 8px;
    padding: var(--space-4);
    margin: var(--space-4) 0;
    text-align: center;
  }

  .preset-title {
    font-size: var(--text-sm);
    font-weight: 600;
    color: #92400e;
    margin: 0 0 var(--space-3) 0;
  }

  .preset-buttons {
    display: flex;
    gap: var(--space-3);
    justify-content: center;
  }

  .preset-button {
    padding: var(--space-2) var(--space-3);
    background-color: #f59e0b;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: var(--text-sm);
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .preset-button:hover {
    background-color: #d97706;
  }

  .preset-button:active {
    background-color: #b45309;
  }

  .preset-specs {
    margin-top: var(--space-2);
    text-align: center;
  }

  .preset-specs small {
    color: #92400e;
    font-size: var(--text-xs);
    font-family: monospace;
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