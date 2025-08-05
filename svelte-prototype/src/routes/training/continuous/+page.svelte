<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { AlertTriangle, Mic, Volume2 } from 'lucide-svelte';
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
          <div class="warning-icon">
            <AlertTriangle size={48} />
          </div>
          <div class="warning-content">
            <h3>マイクテストが必要です</h3>
            <p>連続チャレンジを開始する前に、マイクの動作確認を行ってください。</p>
            <button 
              class="mic-test-button"
              on:click={() => goto(`${base}/microphone-test?mode=continuous`)}
            >
              <Mic size={20} />
              マイクテストを開始
            </button>
          </div>
        </div>
      </div>
    {:else if isClient && micTestCompleted}
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
        <div class="loading-spinner">
          <Volume2 size={48} />
        </div>
        <p>読み込み中...</p>
      </div>
    {/if}

  </div>
</PageLayout>

<style>
  /* ====================================================================== */
  /* 連続チャレンジモード専用スタイル - shadcn/ui テーマ統一設計 */
  /* ====================================================================== */

  /* ----- メインコンテナ ----- */
  .continuous-training-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  /* ----- ページヘッダー ----- */
  .page-header {
    text-align: center;
    margin-bottom: 32px;
  }

  .page-title {
    font-size: 36px;
    font-weight: 700;
    color: hsl(222.2 84% 4.9%);
    margin: 0 0 16px 0;
    letter-spacing: -0.025em;
  }

  .page-description {
    font-size: 18px;
    color: hsl(215.4 16.3% 46.9%);
    margin: 0 auto;
    max-width: 600px;
    line-height: 1.6;
  }

  /* ----- マイクテスト必須警告カード（shadcn/ui Alert風） ----- */
  .mic-test-required {
    display: flex;
    justify-content: center;
    margin: 32px 0;
  }

  .warning-card {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 24px;
    max-width: 600px;
    width: 100%;
    background: hsl(54 91% 95%);
    border: 1px solid hsl(54 91% 83%);
    border-radius: 8px;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06);
  }

  .warning-icon {
    flex-shrink: 0;
    color: hsl(54 84% 35%);
    margin-top: 2px;
  }

  .warning-content {
    flex: 1;
  }

  .warning-content h3 {
    font-size: 16px;
    font-weight: 600;
    color: hsl(54 84% 35%);
    margin: 0 0 8px 0;
  }

  .warning-content p {
    font-size: 14px;
    color: hsl(54 84% 35%);
    margin: 0 0 16px 0;
    line-height: 1.5;
  }

  /* ----- ボタン（shadcn/ui Button風） ----- */
  .mic-test-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    color: hsl(210 40% 98%);
    background: hsl(222.2 47.4% 11.2%);
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .mic-test-button:hover {
    background: hsl(222.2 47.4% 11.2% / 0.9);
  }

  .mic-test-button:active {
    transform: scale(0.98);
  }

  /* ----- 読み込み中プレースホルダー ----- */
  .loading-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 32px;
    text-align: center;
    background: hsl(210 40% 98%);
    border: 1px solid hsl(214.3 31.8% 91.4%);
    border-radius: 8px;
    margin: 32px 0;
  }

  .loading-spinner {
    margin-bottom: 16px;
    color: hsl(215.4 16.3% 46.9%);
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .loading-placeholder p {
    color: hsl(215.4 16.3% 46.9%);
    font-size: 16px;
    font-weight: 500;
    margin: 0;
  }

  /* ----- TrainingCore統合スタイル（shadcn/ui テーマ） ----- */
  :global(.training-core) {
    max-width: 1200px !important;
    margin: 0 auto !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 24px !important;
  }

  /* プログレス表示エリア - shadcn/ui Card風 */
  :global(.training-core .progress-info) {
    background: hsl(0 0% 100%) !important;
    border: 1px solid hsl(214.3 31.8% 91.4%) !important;
    border-radius: 8px !important;
    padding: 24px !important;
    text-align: center !important;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06) !important;
  }

  :global(.training-core .session-counter) {
    font-size: 20px !important;
    font-weight: 600 !important;
    color: hsl(222.2 84% 4.9%) !important;
    margin-bottom: 16px !important;
  }

  :global(.training-core .progress-bar) {
    width: 100% !important;
    height: 8px !important;
    background-color: hsl(210 40% 96%) !important;
    border-radius: 4px !important;
    overflow: hidden !important;
  }

  :global(.training-core .progress-fill) {
    height: 100% !important;
    background: hsl(222.2 47.4% 11.2%) !important;
    transition: width 0.3s ease !important;
  }

  /* サイドバイサイドレイアウト */
  :global(.training-core .side-by-side-container) {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 24px !important;
  }

  :global(.training-core .half-width) {
    background: hsl(0 0% 100%) !important;
    border: 1px solid hsl(214.3 31.8% 91.4%) !important;
    border-radius: 8px !important;
    padding: 24px !important;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06) !important;
    transition: border-color 0.2s ease !important;
  }

  :global(.training-core .half-width:hover) {
    border-color: hsl(215.4 16.3% 56.9%) !important;
  }

  /* カードヘッダー */
  :global(.training-core .card-header .section-title) {
    font-size: 18px !important;
    font-weight: 600 !important;
    color: hsl(222.2 84% 4.9%) !important;
    margin: 0 0 16px 0 !important;
    text-align: center !important;
  }

  :global(.training-core .card-content) {
    padding: 0 !important;
  }

  /* ガイドシステム */
  :global(.training-core .guide-start-bar-container) {
    margin-top: 16px !important;
    padding: 16px !important;
    background: hsl(210 40% 98%) !important;
    border: 1px solid hsl(214.3 31.8% 91.4%) !important;
    border-radius: 8px !important;
  }

  :global(.training-core .guide-start-label) {
    font-size: 14px !important;
    color: hsl(215.4 16.3% 46.9%) !important;
    margin-bottom: 8px !important;
    text-align: center !important;
    font-weight: 500 !important;
  }

  :global(.training-core .guide-start-bar) {
    position: relative !important;
    width: 100% !important;
    height: 24px !important;
    background: hsl(210 40% 96%) !important;
    border-radius: 12px !important;
    overflow: hidden !important;
  }

  :global(.training-core .guide-progress-fill) {
    height: 100% !important;
    background: hsl(221.2 83.2% 53.3%) !important;
    transition: width 0.2s ease !important;
  }

  :global(.training-core .guide-music-icon) {
    position: absolute !important;
    top: 50% !important;
    right: 8px !important;
    transform: translateY(-50%) !important;
    color: hsl(210 40% 98%) !important;
    transition: all 0.3s ease !important;
  }

  :global(.training-core .guide-music-icon.glowing) {
    animation: icon-glow 1s ease-in-out infinite alternate !important;
    filter: drop-shadow(0 0 8px hsl(221.2 83.2% 53.3%)) !important;
  }

  @keyframes icon-glow {
    0% { transform: translateY(-50%) scale(1); }
    100% { transform: translateY(-50%) scale(1.2); }
  }

  /* 音階ガイド */
  :global(.training-core .scale-guide) {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 8px !important;
    justify-content: center !important;
    padding: 24px !important;
    background: hsl(210 40% 98%) !important;
    border: 1px solid hsl(214.3 31.8% 91.4%) !important;
    border-radius: 8px !important;
  }

  :global(.training-core .scale-item) {
    padding: 8px 12px !important;
    border-radius: 6px !important;
    font-weight: 600 !important;
    font-size: 14px !important;
    text-align: center !important;
    min-width: 60px !important;
    transition: all 0.3s ease !important;
  }

  :global(.training-core .scale-item.inactive) {
    background: hsl(210 40% 96%) !important;
    color: hsl(215.4 16.3% 46.9%) !important;
    border: 1px solid hsl(214.3 31.8% 91.4%) !important;
  }

  :global(.training-core .scale-item.active) {
    background: hsl(221.2 83.2% 53.3%) !important;
    color: hsl(210 40% 98%) !important;
    border: 1px solid hsl(221.2 83.2% 53.3%) !important;
    transform: scale(1.1) !important;
    box-shadow: 0 2px 8px hsl(221.2 83.2% 53.3% / 0.3) !important;
  }

  /* ----- レスポンシブ対応 ----- */
  @media (max-width: 768px) {
    .continuous-training-page {
      padding: 16px;
      gap: 20px;
    }

    .page-title {
      font-size: 30px;
    }
    
    .page-description {
      font-size: 16px;
    }
    
    .warning-card {
      flex-direction: column;
      text-align: center;
      gap: 12px;
    }
    
    .warning-icon {
      margin-top: 0;
    }

    :global(.training-core .side-by-side-container) {
      grid-template-columns: 1fr !important;
      gap: 16px !important;
    }

    :global(.training-core .scale-guide) {
      gap: 6px !important;
      padding: 16px !important;
    }

    :global(.training-core .scale-item) {
      padding: 6px 8px !important;
      font-size: 12px !important;
      min-width: 50px !important;
    }
  }

  @media (max-width: 480px) {
    .continuous-training-page {
      padding: 12px;
    }

    .page-title {
      font-size: 24px;
    }

    .warning-card {
      margin: 16px 0;
      padding: 16px;
    }
  }
</style>