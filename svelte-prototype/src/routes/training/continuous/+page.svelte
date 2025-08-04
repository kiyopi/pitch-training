<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import PageLayout from '$lib/components/PageLayout.svelte';
  import TrainingCore from '$lib/components/TrainingCore.svelte';

  // マイクテスト完了確認
  let micTestCompleted = false;
  let showStartScreen = true;
  let isClient = false;
  
  onMount(() => {
    // クライアント側でのみ実行
    isClient = true;
    
    // マイクテスト完了フラグ確認
    if (typeof localStorage !== 'undefined') {
      micTestCompleted = localStorage.getItem('mic-test-completed') === 'true';
      console.log('🎤 [ContinuousTraining] マイクテスト完了フラグ:', micTestCompleted);
    }
  });

  // TrainingCore エラーハンドラ
  function handleMicrophoneError(error) {
    console.error('🚨 [ContinuousTraining] マイクロフォンエラー:', error);
    // マイクエラー時はマイクテストページに誘導
    goto(`${base}/microphone-test?mode=continuous`);
  }

  function handleStorageError(error) {
    console.error('🚨 [ContinuousTraining] ストレージエラー:', error);
  }

  // TrainingCore コールバック
  function handleSessionComplete() {
    console.log('✅ [ContinuousTraining] セッション完了');
  }

  function handleAllComplete() {
    console.log('🎉 [ContinuousTraining] 8セッション完了！');
  }

  // チャレンジ開始
  function startChallenge() {
    showStartScreen = false;
  }
</script>

<svelte:head>
  <title>連続チャレンジモード - 相対音感トレーニング</title>
</svelte:head>

<PageLayout showBackButton={true}>
  <div class="continuous-training-page">
    
    <!-- ページヘッダー -->
    <div class="page-header">
      <h1 class="page-title">⚡ 連続チャレンジモード</h1>
      <p class="page-description">
        中級者向け：より難しい基音で8セッション連続挑戦
      </p>
    </div>

    <!-- マイクテスト未完了の場合は誘導 -->
    {#if isClient && !micTestCompleted}
      <div class="mic-test-required">
        <div class="warning-card">
          <div class="warning-icon">⚠️</div>
          <div class="warning-content">
            <h3>マイクテストが必要です</h3>
            <p>連続チャレンジを開始する前に、マイクの動作確認を行ってください。</p>
            <button 
              class="mic-test-button"
              on:click={() => goto(`${base}/microphone-test?mode=continuous`)}
            >
              マイクテストを開始
            </button>
          </div>
        </div>
      </div>
    {:else if isClient && micTestCompleted && showStartScreen}
      <!-- チャレンジ開始画面 -->
      <div class="start-screen">
        <div class="challenge-card">
          <div class="challenge-icon-wrapper">
            <div class="challenge-icon">⚡</div>
          </div>
          
          <div class="challenge-content">
            <h2 class="challenge-title">連続チャレンジモード</h2>
            
            <div class="challenge-features">
              <div class="feature-item">
                <div class="feature-icon">🎯</div>
                <div class="feature-text">
                  <strong>8セッション連続</strong><br>
                  途中で止まらない集中トレーニング
                </div>
              </div>
              
              <div class="feature-item">
                <div class="feature-icon">🔥</div>
                <div class="feature-text">
                  <strong>中級向け難易度</strong><br>
                  より難しい基音での挑戦
                </div>
              </div>
              
              <div class="feature-item">
                <div class="feature-icon">🚀</div>
                <div class="feature-text">
                  <strong>自動進行</strong><br>
                  セッション完了後に自動で次へ
                </div>
              </div>
            </div>
            
            <div class="difficulty-info">
              <h3>🎼 使用基音（中級レベル）</h3>
              <div class="base-notes-grid">
                <span class="base-note">Bb3</span>
                <span class="base-note">B3</span>
                <span class="base-note">Db4</span>
                <span class="base-note">Eb4</span>
                <span class="base-note">F#4</span>
                <span class="base-note">G#4</span>
                <span class="base-note">Bb4</span>
                <span class="base-note">C#5</span>
                <span class="base-note">Eb5</span>
                <span class="base-note">F#5</span>
              </div>
            </div>
            
            <button class="start-challenge-button" on:click={startChallenge}>
              🔥 チャレンジ開始！
            </button>
          </div>
        </div>
      </div>
    {:else if isClient && micTestCompleted && !showStartScreen}
      <!-- TrainingCore統合（自動進行モード） -->
      <TrainingCore
        mode="continuous"
        autoPlay={true}
        sessionCount={8}
        useLocalStorage={true}
        sessionKey="continuous-training-progress"
        onMicrophoneError={handleMicrophoneError}
        onStorageError={handleStorageError}
        onSessionComplete={handleSessionComplete}
        onAllComplete={handleAllComplete}
      />
    {:else if !isClient}
      <!-- サーバーサイドレンダリング中の仮表示 -->
      <div class="loading-placeholder">
        <div class="loading-spinner">⚡</div>
        <p>読み込み中...</p>
      </div>
    {/if}

  </div>
</PageLayout>

<style>
  .continuous-training-page {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .page-header {
    text-align: center;
    margin-bottom: var(--space-6);
  }

  .page-title {
    font-size: var(--text-3xl);
    font-weight: 700;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-3) 0;
  }

  .page-description {
    font-size: var(--text-lg);
    color: var(--color-gray-600);
    margin: 0;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }

  /* マイクテスト必須警告 */
  .mic-test-required {
    display: flex;
    justify-content: center;
    margin: var(--space-8) 0;
  }

  .warning-card {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-6);
    background-color: #fef3c7;
    border: 1px solid #fcd34d;
    border-radius: 12px;
    max-width: 500px;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  }

  .warning-icon {
    font-size: 3rem;
    flex-shrink: 0;
  }

  .warning-content h3 {
    font-size: var(--text-xl);
    font-weight: 600;
    color: #92400e;
    margin: 0 0 var(--space-2) 0;
  }

  .warning-content p {
    font-size: var(--text-base);
    color: #92400e;
    margin: 0 0 var(--space-4) 0;
    line-height: 1.5;
  }

  .mic-test-button {
    background-color: #f59e0b;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 12px 24px;
    font-size: var(--text-base);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .mic-test-button:hover {
    background-color: #d97706;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  /* チャレンジ開始画面 */
  .start-screen {
    display: flex;
    justify-content: center;
    margin: var(--space-8) 0;
  }

  .challenge-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20px;
    padding: var(--space-8);
    max-width: 600px;
    color: white;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    text-align: center;
  }

  .challenge-icon-wrapper {
    margin-bottom: var(--space-6);
  }

  .challenge-icon {
    font-size: 4rem;
    animation: pulse-glow 2s infinite alternate;
  }

  @keyframes pulse-glow {
    0% { 
      transform: scale(1);
      filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
    }
    100% { 
      transform: scale(1.1);
      filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.8));
    }
  }

  .challenge-title {
    font-size: var(--text-2xl);
    font-weight: 700;
    margin: 0 0 var(--space-6) 0;
  }

  .challenge-features {
    margin-bottom: var(--space-6);
  }

  .feature-item {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    margin-bottom: var(--space-4);
    text-align: left;
  }

  .feature-icon {
    font-size: 2rem;
    flex-shrink: 0;
  }

  .feature-text {
    font-size: var(--text-base);
    line-height: 1.4;
  }

  .feature-text strong {
    font-weight: 600;
    font-size: var(--text-lg);
  }

  .difficulty-info {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: var(--space-4);
    margin-bottom: var(--space-6);
  }

  .difficulty-info h3 {
    font-size: var(--text-lg);
    font-weight: 600;
    margin: 0 0 var(--space-3) 0;
    text-align: center;
  }

  .base-notes-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: var(--space-2);
    justify-items: center;
  }

  .base-note {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-sm);
    font-weight: 600;
    font-family: 'Courier New', monospace;
  }

  .start-challenge-button {
    background: linear-gradient(135deg, #ff6b6b, #ffd93d);
    color: #333;
    border: none;
    border-radius: 12px;
    padding: 16px 32px;
    font-size: var(--text-xl);
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }

  .start-challenge-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
  }

  .start-challenge-button:active {
    transform: translateY(0);
  }

  /* 読み込み中プレースホルダー */
  .loading-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-8);
    text-align: center;
    color: var(--color-gray-600);
  }

  .loading-spinner {
    font-size: 3rem;
    animation: spin 2s linear infinite;
    margin-bottom: var(--space-4);
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* レスポンシブ対応 */
  @media (max-width: 768px) {
    .page-title {
      font-size: var(--text-2xl);
    }
    
    .page-description {
      font-size: var(--text-base);
    }
    
    .warning-card {
      flex-direction: column;
      text-align: center;
      margin: 0 var(--space-4);
    }
    
    .warning-icon {
      font-size: 2rem;
    }

    .challenge-card {
      margin: 0 var(--space-4);
      padding: var(--space-6);
    }

    .challenge-icon {
      font-size: 3rem;
    }

    .challenge-title {
      font-size: var(--text-xl);
    }

    .feature-item {
      flex-direction: column;
      text-align: center;
      gap: var(--space-2);
    }

    .feature-icon {
      font-size: 1.5rem;
    }

    .base-notes-grid {
      grid-template-columns: repeat(3, 1fr);
    }

    .start-challenge-button {
      padding: 14px 28px;
      font-size: var(--text-lg);
    }
  }
</style>