# Svelte版デザインシステム仕様書

作成日: 2025-01-25  
最終更新: 2025-07-25  
ステータス: **shadcn/ui準拠完了**

## 🎨 デザインシステム基盤

### **shadcn/ui完全準拠**
本Svelteプロトタイプは、Next.jsで使用していたshadcn/uiデザインシステムに完全準拠します。

**shadcn/ui互換性**:
- ✅ 同一カラーパレット
- ✅ 同一スペーシングシステム  
- ✅ 同一タイポグラフィ
- ✅ 同一コンポーネント構造
- ✅ 同一レスポンシブ戦略

**実装方針**:
- **目標**: Next.jsと視覚的に100%同等
- **手法**: CSS Variables + Svelte コンポーネント
- **検証**: 並列表示での完全一致確認

## 🎨 デザイン原則

### **1. シンプル**
- 音感練習に集中できるUI
- 不要な装飾は一切排除
- 認知負荷を最小限に

### **2. 一貫性**
- 全ページで統一されたUX
- 同じ操作パターンの維持
- 予測可能なインタラクション

### **3. レスポンシブ**
- モバイルファースト設計
- iPhone Safari完全対応
- タッチ操作最適化

### **4. 高速**
- 60fps維持
- 即座のフィードバック
- 遅延のない応答

## 🎨 カラーパレット（固定）

### **メインカラー**
```css
:root {
  /* Primary - エメラルドグリーン系 */
  --color-primary: #059669;
  --color-primary-hover: #047857;
  --color-primary-light: #10b981;
  --color-primary-pale: #d1fae5;
  
  /* Grayscale */
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-600: #6b7280;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;
  
  /* Semantic */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
  
  /* Background */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f9fafb;
}
```

### **使用制限**
- **禁止**: 上記以外の色の使用
- **禁止**: グラデーション（音響UI除く）
- **禁止**: 複雑な配色

## 📐 スペーシングシステム

```css
:root {
  --space-1: 4px;   /* xs */
  --space-2: 8px;   /* sm */
  --space-3: 12px;
  --space-4: 16px;  /* md - 基本単位 */
  --space-6: 24px;  /* lg */
  --space-8: 32px;  /* xl */
  --space-12: 48px; /* 2xl */
  --space-16: 64px; /* 3xl */
}
```

## 🖋️ タイポグラフィ

### **フォント**
```css
:root {
  --font-family: system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif;
  --font-mono: 'SF Mono', Monaco, 'Cascadia Code', monospace;
}
```

### **サイズスケール**
```css
:root {
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;  /* 基本サイズ */
  --text-lg: 18px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-3xl: 30px;
  --text-4xl: 36px;
}
```

## 🧱 基本コンポーネント

### **1. Card.svelte**
```svelte
<script>
  export let variant = 'default'; // default, primary, success, warning
  export let padding = 'md';      // sm, md, lg
</script>

<div class="card card-{variant} card-padding-{padding}">
  <slot />
</div>

<style>
  .card {
    background: var(--color-bg-primary);
    border: 1px solid var(--color-gray-200);
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: box-shadow 0.2s ease;
  }
  
  .card:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .card-primary {
    border-color: var(--color-primary-light);
    background: linear-gradient(to bottom right, 
      var(--color-primary-pale), 
      var(--color-bg-primary));
  }
  
  .card-padding-sm { padding: var(--space-4); }
  .card-padding-md { padding: var(--space-6); }
  .card-padding-lg { padding: var(--space-8); }
</style>
```

### **2. Button.svelte**
```svelte
<script>
  export let variant = 'primary';  // primary, secondary, ghost
  export let size = 'md';          // sm, md, lg
  export let disabled = false;
</script>

<button 
  class="btn btn-{variant} btn-{size}"
  {disabled}
  on:click
>
  <slot />
</button>

<style>
  .btn {
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
  }
  
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  /* Variants */
  .btn-primary {
    background: var(--color-primary);
    color: white;
  }
  .btn-primary:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }
  
  .btn-secondary {
    background: var(--color-gray-100);
    color: var(--color-gray-800);
  }
  
  .btn-ghost {
    background: transparent;
    color: var(--color-primary);
    border: 2px solid var(--color-primary);
  }
  
  /* Sizes */
  .btn-sm { padding: var(--space-2) var(--space-4); font-size: var(--text-sm); }
  .btn-md { padding: var(--space-3) var(--space-6); font-size: var(--text-base); }
  .btn-lg { padding: var(--space-4) var(--space-8); font-size: var(--text-lg); }
</style>
```

## 🎵 音響専用コンポーネント

### **1. VolumeBar.svelte（重要）**
```svelte
<script>
  export let volume = 0;        // 0-100
  export let isActive = false;
  
  let barElement;
  
  // DOM直接操作（必須）
  $: if (barElement && typeof volume === 'number') {
    barElement.style.width = `${Math.max(0, Math.min(100, volume))}%`;
  }
</script>

<div class="volume-container" class:active={isActive}>
  <div class="volume-track">
    <div 
      bind:this={barElement} 
      class="volume-bar"
    />
  </div>
  <span class="volume-text">{Math.round(volume)}%</span>
</div>

<style>
  .volume-container {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }
  
  .volume-track {
    flex: 1;
    height: 12px;
    background: var(--color-gray-200);
    border-radius: 6px;
    overflow: hidden;
  }
  
  .volume-bar {
    height: 100%;
    background: linear-gradient(to right, var(--color-primary), var(--color-primary-light));
    transition: none; /* DOM操作のため無効 */
  }
  
  .active .volume-bar {
    animation: pulse 1s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
</style>
```

### **2. PitchDisplay.svelte**
```svelte
<script>
  export let note = '';           // C4, D#4, etc.
  export let cents = 0;           // -50 to +50
  export let isActive = false;
  
  $: isInTune = Math.abs(cents) < 10;
  $: centClass = cents > 0 ? 'sharp' : 'flat';
</script>

<div class="pitch-display" class:in-tune={isInTune} class:active={isActive}>
  <div class="note-name">{note || '---'}</div>
  <div class="cents {centClass}">
    {cents > 0 ? '+' : ''}{cents} cents
  </div>
  <div class="tune-indicator">
    <div class="indicator-bar" style="transform: translateX({cents * 2}%)" />
  </div>
</div>

<style>
  .pitch-display {
    text-align: center;
    padding: var(--space-6);
    border-radius: 16px;
    background: var(--color-gray-50);
    border: 2px solid var(--color-gray-200);
    transition: all 0.3s ease;
  }
  
  .pitch-display.in-tune {
    background: var(--color-primary-pale);
    border-color: var(--color-primary-light);
  }
  
  .note-name {
    font-size: var(--text-4xl);
    font-weight: bold;
    color: var(--color-gray-800);
    margin-bottom: var(--space-2);
  }
  
  .cents {
    font-size: var(--text-lg);
    font-weight: 600;
    margin-bottom: var(--space-4);
  }
  
  .cents.sharp { color: var(--color-error); }
  .cents.flat { color: var(--color-info); }
  
  .tune-indicator {
    position: relative;
    height: 4px;
    background: var(--color-gray-200);
    border-radius: 2px;
    overflow: hidden;
  }
  
  .indicator-bar {
    position: absolute;
    top: 0;
    left: 50%;
    width: 20px;
    height: 100%;
    background: var(--color-primary);
    border-radius: 2px;
    transform-origin: center;
    transition: transform 0.1s ease;
  }
</style>
```

## 📱 レスポンシブ戦略

### **ブレークポイント**
```css
/* モバイルファースト */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
```

### **レスポンシブルール**
1. **モバイル**: 単一カラム、大きなタッチターゲット
2. **タブレット**: 2カラム、最適化されたレイアウト
3. **デスクトップ**: 3カラム、ホバー効果

## 🚫 禁止事項

### **スタイリング**
- ❌ インラインstyle属性の使用（音響UI除く）
- ❌ !important の使用
- ❌ 固定ピクセル値（rem/em使用）
- ❌ 独自カラーの追加

### **コンポーネント**
- ❌ 基本コンポーネント以外の作成
- ❌ 複雑な状態管理
- ❌ 重いアニメーション

### **パフォーマンス**
- ❌ 60fps以下のアニメーション
- ❌ 500ms以上の応答時間

## ✅ 品質チェックリスト

### **デザイン準拠**
- [ ] 指定カラーパレット使用
- [ ] スペーシングシステム準拠
- [ ] レスポンシブ対応

### **パフォーマンス**
- [ ] 60fps維持
- [ ] 音響UI遅延なし
- [ ] モバイル最適化

### **アクセシビリティ**
- [ ] キーボード操作対応
- [ ] 適切なコントラスト比
- [ ] スクリーンリーダー対応

---

**このデザインシステムは、統一性と品質を保証する絶対的な基準です。**  
**すべてのUI実装は、この仕様に厳密に従って行われます。**