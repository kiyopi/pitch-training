<script lang="ts">
  import Card from '$lib/components/Card.svelte';
  import Button from '$lib/components/Button.svelte';
  import PageLayout from '$lib/components/PageLayout.svelte';
</script>

<PageLayout title="Pitch Training App">
  <div class="homepage">
    <div class="hero">
      <h1 class="hero-title">相対音感トレーニング</h1>
      <p class="hero-description">
        ドレミファソラシドの音程関係を正確に聞き分ける力を鍛えましょう
      </p>
    </div>
    
    <div class="modes-grid">
      <Card variant="primary" padding="lg" interactive={true}>
        <div class="mode-card">
          <h3 class="mode-title">ランダムモード</h3>
          <p class="mode-description">
            基音がランダムに変わる中で、相対音程を鍛える基本モード
          </p>
          <Button href="#" variant="primary" size="lg" fullWidth>
            始める（準備中）
          </Button>
        </div>
      </Card>
      
      <Card variant="default" padding="lg" interactive={true}>
        <div class="mode-card">
          <h3 class="mode-title">連続チャレンジ</h3>
          <p class="mode-description">
            制限時間内に連続で正解を目指す集中トレーニング
          </p>
          <Button href="#" variant="primary" size="lg" fullWidth>
            始める（準備中）
          </Button>
        </div>
      </Card>
      
      <Card variant="default" padding="lg" interactive={true}>
        <div class="mode-card">
          <h3 class="mode-title">12音階モード</h3>
          <p class="mode-description">
            半音階も含めた12音階での高度な音感トレーニング
          </p>
          <Button href="#" variant="primary" size="lg" fullWidth>
            始める（準備中）
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
</style>