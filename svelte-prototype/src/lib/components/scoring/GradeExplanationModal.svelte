<script>
  import { createEventDispatcher } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { X, Trophy, Crown, Star, Award, Target, TrendingUp, HelpCircle, ArrowUp } from 'lucide-svelte';
  
  export let isOpen = false;
  export let currentGrade = 'C';
  export let currentStats = {};
  
  const dispatch = createEventDispatcher();
  
  // S-E級評価基準定義
  const gradeDefinitions = {
    S: { 
      name: 'S級マスター', 
      icon: Trophy, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      excellentRate: 90,
      goodRate: 95,
      description: '完璧な演奏レベル',
      advice: '素晴らしい！この調子で継続練習を続けましょう。'
    },
    A: { 
      name: 'A級エキスパート', 
      icon: Crown, 
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      excellentRate: 70,
      goodRate: 85,
      description: '上級者レベル',
      advice: 'S級を目指して、より精密な音程感覚を磨きましょう。'
    },
    B: { 
      name: 'B級プロフィシエント', 
      icon: Star, 
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      excellentRate: 50,
      goodRate: 75,
      description: '中級者レベル',
      advice: 'A級を目指して、優秀評価を増やすことを意識しましょう。'
    },
    C: { 
      name: 'C級アドバンス', 
      icon: Award, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      excellentRate: 0,
      goodRate: 65,
      description: '基礎が身についたレベル',
      advice: 'B級を目指して、音程精度の向上に取り組みましょう。'
    },
    D: { 
      name: 'D級ビギナー', 
      icon: Target, 
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      excellentRate: 0,
      goodRate: 50,
      description: '練習中レベル',
      advice: 'C級を目指して、基本的な音程練習を継続しましょう。'
    },
    E: { 
      name: 'E級スターター', 
      icon: TrendingUp, 
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      excellentRate: 0,
      goodRate: 0,
      description: 'スタートレベル',
      advice: 'まずは基礎練習から始めて、良好以上の評価を目指しましょう。'
    }
  };
  
  // 個別セッション評価基準
  const sessionGrades = [
    { name: '優秀', range: '±15¢以内', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { name: '良好', range: '±25¢以内', color: 'text-green-600', bgColor: 'bg-green-50' },
    { name: '合格', range: '±40¢以内', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { name: '要練習', range: '±41¢以上', color: 'text-red-600', bgColor: 'bg-red-50' }
  ];
  
  $: currentGradeDef = gradeDefinitions[currentGrade] || gradeDefinitions.C;
  
  // 次のランクアップまでの必要条件を計算
  $: nextGradeTarget = (() => {
    const grades = ['E', 'D', 'C', 'B', 'A', 'S'];
    const currentIndex = grades.indexOf(currentGrade);
    if (currentIndex === -1 || currentIndex === grades.length - 1) return null;
    
    const nextGrade = grades[currentIndex + 1];
    const nextDef = gradeDefinitions[nextGrade];
    
    return {
      grade: nextGrade,
      name: nextDef.name,
      excellentRate: nextDef.excellentRate,
      goodRate: nextDef.goodRate
    };
  })();
  
  function closeModal() {
    isOpen = false;
    dispatch('close');
  }
  
  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }
</script>

{#if isOpen}
  <!-- モーダル背景 -->
  <div 
    class="modal-backdrop" 
    on:click={handleBackdropClick}
    transition:fade={{ duration: 200 }}
  >
    <!-- モーダルコンテンツ -->
    <div 
      class="modal-content"
      transition:fly={{ y: 20, duration: 300 }}
    >
      <!-- ヘッダー -->
      <div class="modal-header">
        <div class="flex items-center gap-3">
          <HelpCircle size="24" class="text-blue-600" />
          <h2 class="modal-title">総合評価の見方</h2>
        </div>
        <button 
          class="close-button" 
          on:click={closeModal}
          aria-label="閉じる"
        >
          <X size="20" />
        </button>
      </div>
      
      <!-- コンテンツ -->
      <div class="modal-body">
        <!-- 現在の評価 -->
        <div class="current-grade-section">
          <h3 class="section-title">あなたの現在の評価</h3>
          <div class="current-grade-card {currentGradeDef.bgColor} {currentGradeDef.borderColor}">
            <div class="flex items-center gap-4">
              <div class="grade-icon-wrapper">
                <svelte:component this={currentGradeDef.icon} size="32" class="{currentGradeDef.color}" />
              </div>
              <div>
                <h4 class="grade-name {currentGradeDef.color}">{currentGradeDef.name}</h4>
                <p class="grade-description">{currentGradeDef.description}</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 評価基準表 -->
        <div class="grade-table-section">
          <h3 class="section-title">評価基準一覧</h3>
          <div class="grade-table">
            <div class="table-header">
              <div class="table-cell">ランク</div>
              <div class="table-cell">優秀率</div>
              <div class="table-cell">良好以上率</div>
              <div class="table-cell">説明</div>
            </div>
            {#each Object.entries(gradeDefinitions) as [grade, def]}
              <div class="table-row {grade === currentGrade ? 'current-row' : ''}">
                <div class="table-cell">
                  <div class="rank-cell">
                    <svelte:component this={def.icon} size="16" class="{def.color}" />
                    <span class="{def.color} font-medium">{def.name}</span>
                  </div>
                </div>
                <div class="table-cell">
                  {def.excellentRate > 0 ? `${def.excellentRate}%以上` : '制限なし'}
                </div>
                <div class="table-cell">
                  {def.goodRate > 0 ? `${def.goodRate}%以上` : '制限なし'}
                </div>
                <div class="table-cell text-sm">
                  {def.description}
                </div>
              </div>
            {/each}
          </div>
        </div>
        
        <!-- 個別セッション評価説明 -->
        <div class="session-grades-section">
          <h3 class="section-title">個別セッション評価基準</h3>
          <div class="session-grades-grid">
            {#each sessionGrades as grade}
              <div class="session-grade-card {grade.bgColor}">
                <div class="grade-name {grade.color}">{grade.name}</div>
                <div class="grade-range">{grade.range}</div>
              </div>
            {/each}
          </div>
        </div>
        
        <!-- 改善アドバイス -->
        {#if nextGradeTarget}
          <div class="improvement-section">
            <h3 class="section-title flex items-center gap-2">
              <ArrowUp size="20" class="text-blue-600" />
              次のランクアップまで
            </h3>
            <div class="improvement-card">
              <p class="improvement-target">
                <span class="font-semibold text-blue-600">{nextGradeTarget.name}</span>を目指しましょう！
              </p>
              <div class="improvement-requirements">
                <h4 class="requirements-title">必要な条件：</h4>
                <ul class="requirements-list">
                  {#if nextGradeTarget.excellentRate > 0}
                    <li>優秀評価: <span class="font-semibold">{nextGradeTarget.excellentRate}%以上</span></li>
                  {/if}
                  <li>良好以上評価: <span class="font-semibold">{nextGradeTarget.goodRate}%以上</span></li>
                </ul>
              </div>
              <p class="improvement-advice">{currentGradeDef.advice}</p>
            </div>
          </div>
        {/if}
      </div>
      
      <!-- フッター -->
      <div class="modal-footer">
        <p class="encouragement">継続は力なり！頑張って練習を続けましょう！</p>
        <button class="close-button-primary" on:click={closeModal}>
          理解しました
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }
  
  .modal-content {
    background: white;
    border-radius: 12px;
    box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
    max-width: 42rem;
    width: 100%;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid hsl(214.3 31.8% 91.4%);
    background: hsl(210 40% 98%);
  }
  
  .modal-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: hsl(222.2 84% 4.9%);
    margin: 0;
  }
  
  .close-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 6px;
    border: none;
    background: hsl(210 40% 96%);
    color: hsl(215.4 16.3% 46.9%);
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .close-button:hover {
    background: hsl(210 40% 94%);
    color: hsl(222.2 84% 4.9%);
  }
  
  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }
  
  .section-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: hsl(222.2 84% 4.9%);
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
  }
  
  .current-grade-section {
    margin-bottom: 2rem;
  }
  
  .current-grade-card {
    padding: 1.25rem;
    border-radius: 8px;
    border: 1px solid;
  }
  
  .grade-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    background: white;
  }
  
  .grade-name {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
  
  .grade-description {
    font-size: 0.875rem;
    color: hsl(215.4 16.3% 46.9%);
    margin: 0;
  }
  
  .grade-table-section {
    margin-bottom: 2rem;
  }
  
  .grade-table {
    border: 1px solid hsl(214.3 31.8% 91.4%);
    border-radius: 8px;
    overflow: hidden;
  }
  
  .table-header {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1.5fr;
    background: hsl(210 40% 98%);
    font-weight: 600;
    font-size: 0.875rem;
    color: hsl(222.2 84% 4.9%);
  }
  
  .table-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1.5fr;
    border-top: 1px solid hsl(214.3 31.8% 91.4%);
  }
  
  .table-row.current-row {
    background: hsl(221.2 83.2% 53.3% / 0.1);
  }
  
  .table-cell {
    padding: 0.75rem;
    font-size: 0.875rem;
    color: hsl(215.4 16.3% 46.9%);
    display: flex;
    align-items: center;
  }
  
  .rank-cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .session-grades-section {
    margin-bottom: 2rem;
  }
  
  .session-grades-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.75rem;
  }
  
  .session-grade-card {
    padding: 1rem;
    border-radius: 6px;
    text-align: center;
    border: 1px solid hsl(214.3 31.8% 91.4%);
  }
  
  .session-grade-card .grade-name {
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
  
  .session-grade-card .grade-range {
    font-size: 0.75rem;
    color: hsl(215.4 16.3% 46.9%);
  }
  
  .improvement-section {
    margin-bottom: 1.5rem;
  }
  
  .improvement-card {
    background: hsl(221.2 83.2% 53.3% / 0.1);
    border: 1px solid hsl(221.2 83.2% 53.3% / 0.2);
    border-radius: 8px;
    padding: 1.25rem;
  }
  
  .improvement-target {
    font-size: 1rem;
    margin-bottom: 1rem;
    color: hsl(222.2 84% 4.9%);
  }
  
  .requirements-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: hsl(222.2 84% 4.9%);
    margin-bottom: 0.5rem;
  }
  
  .requirements-list {
    list-style: none;
    padding: 0;
    margin: 0 0 1rem 0;
  }
  
  .requirements-list li {
    font-size: 0.875rem;
    color: hsl(215.4 16.3% 46.9%);
    padding: 0.25rem 0;
    padding-left: 1rem;
    position: relative;
  }
  
  .requirements-list li::before {
    content: '•';
    position: absolute;
    left: 0;
    color: hsl(221.2 83.2% 53.3%);
  }
  
  .improvement-advice {
    font-size: 0.875rem;
    color: hsl(215.4 16.3% 46.9%);
    font-style: italic;
    margin: 0;
  }
  
  .modal-footer {
    padding: 1.5rem;
    border-top: 1px solid hsl(214.3 31.8% 91.4%);
    background: hsl(210 40% 98%);
    text-align: center;
  }
  
  .encouragement {
    font-size: 0.875rem;
    color: hsl(215.4 16.3% 46.9%);
    margin-bottom: 1rem;
    font-weight: 500;
  }
  
  .close-button-primary {
    background: hsl(221.2 83.2% 53.3%);
    color: white;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .close-button-primary:hover {
    background: hsl(221.2 83.2% 48%);
  }
  
  /* レスポンシブ対応 */
  @media (max-width: 768px) {
    .modal-content {
      margin: 1rem;
      max-height: calc(100vh - 2rem);
    }
    
    .modal-header {
      padding: 1rem;
    }
    
    .modal-body {
      padding: 1rem;
    }
    
    .modal-footer {
      padding: 1rem;
    }
    
    .table-header,
    .table-row {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }
    
    .table-cell {
      padding: 0.5rem;
      border-bottom: 1px solid hsl(214.3 31.8% 91.4%);
    }
    
    .session-grades-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (max-width: 480px) {
    .modal-backdrop {
      padding: 0.5rem;
    }
    
    .session-grades-grid {
      grid-template-columns: 1fr;
    }
  }
</style>