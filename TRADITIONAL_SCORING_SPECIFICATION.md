# ランダムモード従来採点システム仕様書

## 概要

RandomModeScoreResultコンポーネントによる、1セッション8音階の詳細採点システム。統合採点システムと区別され、個別セッションの詳細分析に特化。

## 技術仕様

### コンポーネント
- **ファイル**: `/src/lib/components/scoring/RandomModeScoreResult.svelte`
- **用途**: 1セッション完了時の詳細採点結果表示
- **データ**: `noteResults` 配列（8音階の結果）

### 入力データ構造
```typescript
interface NoteResult {
  name: string;           // 音名（ド、レ、ミ...）
  targetFreq: number;     // 目標周波数（Hz）
  detectedFreq: number;   // 検出周波数（Hz）
  diff: number;          // 周波数差（Hz）
  cents: number;         // セント誤差（¢）
}

// 使用例
noteResults = [
  { name: "ド", targetFreq: 261.63, detectedFreq: 265.2, diff: 3.57, cents: 23 },
  // ... 8音階分
];
```

## レイアウト構造

### 1. 総合評価セクション（上部）
```svelte
<div class="overall-score-section">
  <div class="grade-display-enhanced">
    <!-- 中央大型アイコン（120px） -->
    <div class="simple-grade-icon">
      <Icon size="120" class="grade-icon-simple {color}" />
    </div>
    
    <!-- 評価名 -->
    <h2 class="grade-title {color}">{評価名}</h2>
    
    <!-- 平均誤差 -->
    <p class="grade-subtitle">平均誤差: {averageError}¢</p>
    
    <!-- 外れ値ペナルティ（該当時のみ） -->
    {#if penalty > 0}
      <p class="penalty-notice">外れ値ペナルティ: -{penalty}点</p>
    {/if}
  </div>
</div>
```

### 2. 評価分布セクション（中央）
```svelte
<div class="rating-distribution">
  <h3 class="section-title">評価分布</h3>
  
  <div class="distribution-bars">
    {#each gradeDefinitions as [key, def]}
      <div class="distribution-row">
        <!-- 評価ラベル -->
        <div class="grade-label">
          <Icon class="{def.color}" />
          <span>{def.name}</span>
        </div>
        
        <!-- アニメーション付き進捗バー -->
        <div class="bar-container">
          <div class="distribution-bar" style="width: {percentage}%"></div>
        </div>
        
        <!-- カウント表示 -->
        <div class="count-display">
          <span>{count}/8</span>
          {#if key === 'needWork' && count > 0}
            <AlertCircle class="animate-pulse text-red-500" />
          {/if}
        </div>
      </div>
    {/each}
  </div>
  
  <!-- サマリーメッセージ -->
  <div class="distribution-summary">
    <!-- 状況に応じた励ましメッセージ -->
  </div>
</div>
```

### 3. 各音程の詳細結果（メイン）
```svelte
<div class="note-details">
  <h3 class="section-title">
    <Music />
    各音程の詳細結果
  </h3>
  
  {#each noteResults as note}
    <div class="note-result {grade}">
      <!-- 色分けヘッダー -->
      <div class="simple-header {grade}">
        <div class="simple-info">
          <Icon class="{gradeColor}" />
          <span class="note-name-simple">{note.name}（{note.targetFreq}Hz）</span>
          
          {#if grade !== 'notMeasured'}
            <span class="detection-result">
              あなた: {note.detectedFreq}Hz ({note.diff > 0 ? '+' : ''}{note.diff}Hz) 
              {note.cents > 0 ? '+' : ''}{note.cents}¢
            </span>
            
            {#if isOutlier}
              <span class="outlier-badge-simple">
                {Math.abs(note.cents) > 100 ? '重大' : '注意'}
              </span>
            {/if}
          {:else}
            <span class="detection-failed">測定できませんでした</span>
          {/if}
        </div>
      </div>
      
      <!-- 精度バー（測定成功時のみ） -->
      {#if grade !== 'notMeasured'}
        <div class="accuracy-bar">
          <div class="bar-track">
            <!-- 中央線（正確位置） -->
            <div class="center-line-enhanced">
              <div class="center-marker"></div>
              <span class="center-label">正確</span>
            </div>
            
            <!-- 精度インジケーター -->
            <div class="accuracy-indicator {grade}" 
                 style="left: {50 + (note.cents / 100) * 50}%">
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/each}
</div>
```

### 4. 外れ値検出セクション（該当時のみ）
```svelte
{#if outliers.length > 0}
  <div class="outlier-section">
    <h4>
      <AlertTriangle class="text-red-500" />
      外れ値検出
    </h4>
    
    <div class="outlier-list">
      {#each outliers as outlier}
        <div class="outlier-item">
          <span class="note-badge">{outlier.name}</span>
          <span class="cents-value">{outlier.cents > 0 ? '+' : ''}{outlier.cents}¢</span>
          <span class="severity-badge {severity}">
            {Math.abs(outlier.cents) > 100 ? '重大' : '注意'}
          </span>
        </div>
      {/each}
    </div>
  </div>
{/if}
```

### 5. 改善アドバイスセクション
```svelte
<div class="advice-section">
  <h4>
    <Lightbulb class="text-yellow-500" />
    改善アドバイス
  </h4>
  
  <div class="advice-content">
    {#if needWorkNotes.length > 0}
      <p>
        <Target class="text-red-500" />
        重点練習: {needWorkNotes.join('、')}の精度向上
      </p>
    {/if}
    
    <!-- 平均誤差に応じたアドバイス -->
    {#if averageError > 200}
      <p><Flame />基礎練習: 音程感覚の根本的な見直しが必要</p>
    {:else if averageError < 20}
      <p><Trophy />素晴らしい精度です！この調子を維持しましょう</p>
    {:else}
      <p><TrendingUp />良い調子です！継続的な練習で更なる向上を</p>
    {/if}
  </div>
</div>
```

### 6. 判定基準（折りたたみ）
```svelte
<details class="criteria-section">
  <summary>
    <Info />
    判定結果の見方
    <ChevronDown class="chevron-icon" />
  </summary>
  
  <div class="criteria-content">
    {#each gradeDefinitions as [key, def]}
      <div class="criteria-item">
        <Icon class="{def.color}" />
        <strong>{def.name}:</strong> {def.range}
      </div>
    {/each}
    
    <div class="info-note">
      <p>¢（セント）: 音程の精度単位。100¢ = 半音1つ分</p>
      <p>外れ値ペナルティ: ±50セント超の大きな外れがあると評価が下がります</p>
    </div>
  </div>
</details>
```

## 評価システム

### 4段階評価定義
```typescript
const gradeDefinitions = {
  excellent: { name: '優秀', icon: Trophy, range: '±15¢以内', color: 'text-yellow-500' },
  good: { name: '良好', icon: Star, range: '±25¢以内', color: 'text-green-500' },
  pass: { name: '合格', icon: ThumbsUp, range: '±40¢以内', color: 'text-blue-500' },
  needWork: { name: '要練習', icon: Frown, range: '±41¢以上', color: 'text-red-500' },
  notMeasured: { name: '測定不可', icon: AlertCircle, range: '音声未検出', color: 'text-gray-500' }
};
```

### 総合グレード判定ロジック
```typescript
function calculateOverallGrade(results, averageError, outliers) {
  // 測定不可が多い場合は要練習
  if (results.notMeasured > 3) return 'needWork';
  if (results.needWork > 2) return 'needWork';
  if (results.needWork > 0 && outliers.length > 0) return 'needWork';
  
  // 測定できた音のみで評価
  if (results.measuredCount === 0) return 'needWork';
  if (averageError <= 20 && results.excellent >= 6) return 'excellent';
  if (averageError <= 30 && passCount >= 7) return 'good';
  if (passCount >= 5) return 'pass';
  return 'needWork';
}
```

### 外れ値ペナルティ
```typescript
const penalty = outliers.reduce((sum, note) => {
  const severity = Math.abs(note.cents) > 100 ? 16 : 8;
  return sum + severity;
}, 0);
```

## デザイン特徴

### カラーパレット
- **優秀（excellent）**: 金色系（#eab308）
- **良好（good）**: 緑色系（#10b981） 
- **合格（pass）**: 青色系（#3b82f6）
- **要練習（needWork）**: 赤色系（#ef4444）
- **測定不可（notMeasured）**: グレー系（#6b7280）

### アニメーション
- **総合評価**: `fly` エフェクト（上から下へ）
- **分布バー**: 段階的アニメーション（優秀→良好→合格→要練習→測定不可）
- **詳細項目**: `fly` エフェクト（左から右へ、50msずつ遅延）
- **精度インジケーター**: 0.5秒のスムーズ移動

### レスポンシブ対応
- **モバイル**: アイコン60px、縦並びレイアウト
- **タブレット**: 中間サイズ調整
- **デスクトップ**: 標準120pxアイコン、横並びレイアウト

## 使用場面

### 統合採点システムとの使い分け
- **従来システム（RandomModeScoreResult）**: 1セッション完了直後の詳細分析
- **統合システム（UnifiedScoreResultFixed）**: 複数セッション履歴とS-E級評価

### データフロー
```
実際のトレーニング完了
↓
noteResultsForDisplay（8音階データ）生成
↓
RandomModeScoreResult表示（従来採点）
↓
（同時に）UnifiedScoreResultFixed表示（統合採点）
```

### 重複表示問題
現在の実装では両システムが同時表示される問題があり、以下の対応が必要：

1. **表示条件の明確化**
2. **ユーザー選択による切り替え**
3. **データ構造の統一**

## 技術制約

### 必須データ
- `noteResults` 配列（8要素必須）
- 各要素に `name`, `targetFreq`, `detectedFreq`, `diff`, `cents` が必要

### パフォーマンス
- アニメーション処理: `tweened` ストア使用
- DOM更新: Svelteのリアクティブ更新
- 大型アイコン: SVGベクター形式

### ブラウザ対応
- モダンブラウザ対応（ES2020+）
- CSS Grid/Flexbox使用
- Web Audio API依存

---

*このドキュメントは従来採点システムの完全な再現と統合採点システムとの適切な使い分けを目的として作成されました。*