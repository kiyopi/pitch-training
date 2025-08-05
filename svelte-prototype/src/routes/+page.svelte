<script>
  import Card from '$lib/components/Card.svelte';
  import Button from '$lib/components/Button.svelte';
  import PageLayout from '$lib/components/PageLayout.svelte';
</script>

<PageLayout>
  <div class="homepage">
    <div class="hero">
      <h1 class="hero-title">音程の相対的な関係を効果的に鍛える</h1>
      <p class="hero-description">
        高精度音程検出とピアノ音源による本格的な相対音感トレーニング
      </p>
    </div>
    
    <div class="modes-grid">
      <!-- ランダムモード（緑色テーマ） -->
      <Card variant="default" padding="lg" interactive={true}>
        <div class="mode-card">
          <div class="mode-icon green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
          <h3 class="mode-title">ランダム基音モード</h3>
          <p class="mode-description">
            10種類の基音からランダムに選択してトレーニング
          </p>
          <Button href="./microphone-test?mode=random" variant="success" size="lg" fullWidth>
            トレーニング開始
          </Button>
        </div>
      </Card>
      
      <!-- 連続チャレンジモード（オレンジ色テーマ） -->
      <Card variant="default" padding="lg" interactive={true}>
        <div class="mode-card">
          <div class="mode-icon orange">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="6"/>
              <circle cx="12" cy="12" r="2"/>
            </svg>
          </div>
          <h3 class="mode-title">連続チャレンジモード</h3>
          <p class="mode-description">
            選択した回数だけ連続で実行し、総合評価を確認
          </p>
          <Button href="./microphone-test?mode=continuous" variant="warning" size="lg" fullWidth>
            トレーニング開始
          </Button>
        </div>
      </Card>
      
      <!-- 12音階モード（紫色テーマ） -->
      <Card variant="default" padding="lg" interactive={true}>
        <div class="mode-card">
          <div class="mode-icon purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
              <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
            </svg>
          </div>
          <h3 class="mode-title">12音階モード（クロマチック）</h3>
          <p class="mode-description">
            基音を聞いて半音階12音すべてを相対音程で歌うトレーニング
          </p>
          <Button href="./microphone-test?mode=chromatic" variant="tertiary" size="lg" fullWidth>
            トレーニング開始
          </Button>
        </div>
      </Card>
    </div>
  </div>
</PageLayout>

<style>
  .homepage {
    max-width: 800px;
    margin: 0 auto;
  }
  
  .hero {
    text-align: center;
    margin-bottom: var(--space-12);
  }
  
  .hero-title {
    font-size: var(--text-4xl);
    font-weight: 700;
    color: var(--color-gray-900);
    margin-bottom: var(--space-4);
  }
  
  .hero-description {
    font-size: var(--text-lg);
    color: var(--color-gray-600);
    max-width: 600px;
    margin: 0 auto;
  }
  
  .modes-grid {
    display: grid;
    gap: var(--space-6);
    grid-template-columns: 1fr;
  }
  
  @media (min-width: 768px) {
    .modes-grid {
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    }
  }
  
  .mode-card {
    text-align: center;
  }
  
  .mode-title {
    font-size: var(--text-xl);
    font-weight: 600;
    color: var(--color-gray-900);
    margin-bottom: var(--space-3);
  }
  
  .mode-description {
    font-size: var(--text-base);
    color: var(--color-gray-600);
    margin-bottom: var(--space-6);
    line-height: 1.6;
  }
  
  .mode-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--space-4) auto;
  }
  
  .mode-icon.green {
    background-color: #d1fae5;
    color: #059669;
  }
  
  .mode-icon.orange {
    background-color: #fed7aa;
    color: #ea580c;
  }
  
  .mode-icon.purple {
    background-color: #e9d5ff;
    color: #9333ea;
  }
  
</style>