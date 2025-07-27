<script>
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
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
  
  // シンプルな状態管理
  
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

  // マイク許可確認（簡素版）
  async function checkMicrophonePermission() {
    microphoneState = 'checking';
    
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        microphoneState = 'error';
        return;
      }
      
      // マイクストリーム取得（一度のみ）
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneState = 'granted';
      trainingPhase = 'setup';
      
      // PitchDetector初期化（一度のみ）
      setTimeout(async () => {
        if (pitchDetectorComponent && mediaStream) {
          await pitchDetectorComponent.initialize(mediaStream);
        }
      }, 200);
    } catch (error) {
      console.error('❌ マイク許可エラー:', error);
      microphoneState = (error?.name === 'NotAllowedError') ? 'denied' : 'error';
    }
  }

  // ランダム基音選択
  function selectRandomBaseNote() {
    const randomIndex = Math.floor(Math.random() * baseNotes.length);
    const selectedNote = baseNotes[randomIndex];
    currentBaseNote = selectedNote.name;
    currentBaseFrequency = selectedNote.frequency;
  }

  // ランダム基音再生（新しい基音を選択）
  function playRandomBaseNote() {
    if (isPlaying || !sampler || isLoading) return;
    
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
  function playCurrentBaseNote() {
    if (isPlaying || !sampler || isLoading || !currentBaseNote) return;
    
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

  // ガイドアニメーション開始（簡素版）
  function startGuideAnimation() {
    // シンプルな状態変更のみ
    trainingPhase = 'guiding';
    currentScaleIndex = 0;
    isGuideAnimationActive = true;
    scaleEvaluations = [];
    
    // 各ステップを順次ハイライト（1秒間隔）
    function animateNextStep() {
      if (currentScaleIndex < scaleSteps.length) {
        // 前のステップを非アクティブに
        if (currentScaleIndex > 0) {
          scaleSteps[currentScaleIndex - 1].state = 'inactive';
        }
        
        // 現在のステップをアクティブに
        scaleSteps[currentScaleIndex].state = 'active';
        
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
  }
  
  // 最終採点結果計算
  function calculateFinalResults() {
    let correctCount = 0;
    let totalAccuracy = 0;
    
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
      
      // デバッグログ削除（サイレント蓄積）
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
    
    // 4. セッション状態リセット（基音は保持）
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
    
    // 5. セッション状態リセット
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
  $: canStartTraining = microphoneState === 'granted' && !isLoading && sampler;
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

  // クリーンアップ
  onDestroy(() => {
    // PitchDetectorは使い回しのためcleanupしない
    // セッション間でMediaStreamとAudioContextを保持
    
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
        isActive={trainingPhase === 'guiding'}
        on:pitchUpdate={handlePitchUpdate}
        on:stateChange={handlePitchDetectorStateChange}
        on:error={handlePitchDetectorError}
        className="pitch-detector-content"
      />
    </div>

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
        <Card class="main-card half-width">
          <div class="card-header">
            <h3 class="section-title">🎙️ リアルタイム音程検出</h3>
          </div>
          <div class="card-content">
            <!-- データ表示のみ（実際のPitchDetectorは上に隠して配置） -->
            <div class="pitch-detector">
              <div class="detection-display">
                <div class="detection-card">
                  <span class="detected-frequency">{currentFrequency > 0 ? Math.round(currentFrequency) : '---'}</span>
                  <span class="hz-suffix">Hz</span>
                  <span class="divider">|</span>
                  <span class="detected-note">{detectedNote}</span>
                </div>
                
                <VolumeBar volume={currentFrequency > 0 ? currentVolume : 0} className="volume-bar" />
              </div>
            </div>
            
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
</style>