<!--
ランダム基音トレーニングページ - TrainingCore統合版
既存機能を完全に保護しながらTrainingCoreを使用
-->

<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import PageLayout from '$lib/components/PageLayout.svelte';
  import TrainingCore from '$lib/components/TrainingCore.svelte';

  // マイクテスト完了確認
  let micTestCompleted = false;
  let isClient = false;
  
  onMount(() => {
    // クライアント側でのみ実行
    isClient = true;
    
    // マイクテスト完了フラグ確認
    if (typeof localStorage !== 'undefined') {
      micTestCompleted = localStorage.getItem('mic-test-completed') === 'true';
      console.log('🎤 [RandomTraining] マイクテスト完了フラグ:', micTestCompleted);
    }
  });

  // TrainingCore エラーハンドラ
  function handleMicrophoneError(error) {
    console.error('🚨 [RandomTraining] マイクロフォンエラー:', error);
    // マイクエラー時はマイクテストページに誘導
    goto(`${base}/microphone-test?mode=random`);
  }

  function handleStorageError(error) {
    console.error('🚨 [RandomTraining] ストレージエラー:', error);
  }

  // TrainingCore コールバック
  function handleSessionComplete() {
    console.log('✅ [RandomTraining] セッション完了');
  }

  function handleAllComplete() {
    console.log('🎉 [RandomTraining] 8セッション完了！');
  }
</script>

<svelte:head>
  <title>ランダム基音トレーニング - 相対音感トレーニング</title>
</svelte:head>

<PageLayout showBackButton={true}>
  <div class="random-training-page">
    
    <!-- ページヘッダー -->
    <div class="page-header">
      <h1 class="page-title">🎲 ランダム基音トレーニング</h1>
      <p class="page-description">
        10種類の基音からランダムに選択して、8音階の相対音感を鍛えます
      </p>
    </div>

    <!-- マイクテスト未完了の場合は誘導 -->
    {#if isClient && !micTestCompleted}
      <div class="mic-test-required">
        <div class="warning-card">
          <div class="warning-icon">⚠️</div>
          <div class="warning-content">
            <h3>マイクテストが必要です</h3>
            <p>トレーニングを開始する前に、マイクの動作確認を行ってください。</p>
            <button 
              class="mic-test-button"
              on:click={() => goto(`${base}/microphone-test?mode=random`)}
            >
              マイクテストを開始
            </button>
          </div>
        </div>
      </div>
    {:else if isClient && micTestCompleted}
      <!-- TrainingCore統合 -->
      <TrainingCore
        mode="random"
        autoPlay={false}
        sessionCount={8}
        useLocalStorage={true}
        sessionKey="random-training-progress"
        onMicrophoneError={handleMicrophoneError}
        onStorageError={handleStorageError}
        onSessionComplete={handleSessionComplete}
        onAllComplete={handleAllComplete}
      />
    {:else if !isClient}
      <!-- サーバーサイドレンダリング中の仮表示 -->
      <div class="loading-placeholder">
        <div class="loading-spinner">🎲</div>
        <p>読み込み中...</p>
      </div>
    {/if}

  </div>
</PageLayout>

<style>
  .random-training-page {
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
  }
</style>