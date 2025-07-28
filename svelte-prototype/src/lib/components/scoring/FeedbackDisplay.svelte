<script>
  export let feedback = {};
  export let className = '';
  
  // フィードバックタイプに応じたスタイル
  const feedbackStyles = {
    'excellent': {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: '🎆',
      iconBg: 'bg-green-100',
      titleColor: 'text-green-800',
      contentColor: 'text-green-700'
    },
    'good': {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: '👍',
      iconBg: 'bg-blue-100',
      titleColor: 'text-blue-800',
      contentColor: 'text-blue-700'
    },
    'improvement': {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: '💡',
      iconBg: 'bg-amber-100',
      titleColor: 'text-amber-800',
      contentColor: 'text-amber-700'
    },
    'warning': {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: '⚠️',
      iconBg: 'bg-red-100',
      titleColor: 'text-red-800',
      contentColor: 'text-red-700'
    },
    'info': {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      icon: 'ℹ️',
      iconBg: 'bg-gray-100',
      titleColor: 'text-gray-800',
      contentColor: 'text-gray-700'
    }
  };
  
  $: style = feedbackStyles[feedback.type] || feedbackStyles.info;
  
  // 詳細フィードバックをカテゴリ別に整理
  $: categorizedFeedback = categorizeFeedback(feedback.details || []);
  
  function categorizeFeedback(details) {
    const categories = {
      strengths: [],
      improvements: [],
      tips: [],
      practice: []
    };
    
    details.forEach(item => {
      if (item.category && categories[item.category]) {
        categories[item.category].push(item);
      }
    });
    
    return categories;
  }
  
  const categoryInfo = {
    strengths: { title: '優れている点', icon: '✨' },
    improvements: { title: '改善点', icon: '🎯' },
    tips: { title: 'アドバイス', icon: '📝' },
    practice: { title: '練習提案', icon: '🎹' }
  };
</script>

<div class="feedback-display {className} {style.bg} {style.border} border rounded-xl p-6">
  <!-- メインフィードバック -->
  <div class="flex items-start gap-4 mb-4">
    <div class="{style.iconBg} rounded-full p-3 flex-shrink-0">
      <span class="text-2xl">{style.icon}</span>
    </div>
    <div class="flex-1">
      <h3 class="{style.titleColor} font-semibold text-lg mb-2">
        {feedback.primary || 'フィードバック'}
      </h3>
      {#if feedback.summary}
        <p class="{style.contentColor}">
          {feedback.summary}
        </p>
      {/if}
    </div>
  </div>
  
  <!-- 詳細フィードバック -->
  {#if feedback.details && feedback.details.length > 0}
    <div class="space-y-4 mt-6">
      {#each Object.entries(categorizedFeedback) as [category, items]}
        {#if items.length > 0}
          <div class="category-section">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-lg">{categoryInfo[category].icon}</span>
              <h4 class="font-medium {style.titleColor}">
                {categoryInfo[category].title}
              </h4>
            </div>
            <ul class="space-y-2 ml-7">
              {#each items as item}
                <li class="flex items-start gap-2">
                  <span class="{style.contentColor} mt-1">•</span>
                  <span class="{style.contentColor} text-sm">
                    {item.text}
                  </span>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      {/each}
    </div>
  {/if}
  
  <!-- 次のステップ -->
  {#if feedback.nextSteps && feedback.nextSteps.length > 0}
    <div class="mt-6 pt-4 border-t {style.border}">
      <h4 class="font-medium {style.titleColor} mb-3">
        🚀 次のステップ
      </h4>
      <div class="grid gap-2">
        {#each feedback.nextSteps as step, i}
          <div class="flex items-center gap-3 bg-white bg-opacity-50 rounded-lg p-3">
            <div class="w-6 h-6 rounded-full {style.iconBg} flex items-center justify-center flex-shrink-0">
              <span class="text-xs font-bold {style.titleColor}">{i + 1}</span>
            </div>
            <span class="text-sm {style.contentColor}">{step}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
  
  <!-- モチベーションメッセージ -->
  {#if feedback.motivation}
    <div class="mt-4 text-center">
      <div class="inline-flex items-center gap-2 bg-white bg-opacity-50 rounded-full px-4 py-2">
        <span class="text-xl">🌟</span>
        <span class="font-medium {style.titleColor}">
          {feedback.motivation}
        </span>
      </div>
    </div>
  {/if}
</div>

<style>
  .feedback-display {
    transition: all 0.3s ease;
  }
  
  .feedback-display:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  .category-section {
    animation: fadeIn 0.5s ease;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>