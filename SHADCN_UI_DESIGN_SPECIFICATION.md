# shadcn/ui デザイン仕様書

## 概要

本仕様書は、相対音感トレーニングアプリにおける shadcn/ui デザインシステムの実装仕様を定義します。
GitHub Pages での CSS 読み込み問題を回避するため、完全インラインスタイル実装を採用しています。

## 🎨 デザイン原則

### 1. ミニマルデザイン
- **シンプルさ優先**: 過度な装飾を排除
- **機能性重視**: ユーザビリティを最優先
- **空白の活用**: 適切な余白で視認性向上

### 2. 一貫性
- **統一されたスタイル**: 全ページで同じデザイン言語
- **予測可能な動作**: 同じ要素は同じ挙動
- **標準化されたコンポーネント**: 再利用可能な設計

### 3. アクセシビリティ
- **高コントラスト**: 読みやすい色彩設計
- **適切なフォントサイズ**: 最小14px以上
- **タッチターゲット**: モバイル対応サイズ

## 🎯 基本レイアウト仕様

### コンテナ構造
```typescript
// 外側コンテナ（全ページ共通）
{
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '0 16px',
  backgroundColor: '#ffffff',
  color: '#1a1a1a',
  fontFamily: 'system-ui, -apple-system, sans-serif'
}
```

### ヘッダー仕様
```typescript
// ヘッダーコンテナ
{
  borderBottom: '1px solid #e5e7eb',
  // 内部要素
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '24px 0'
}
```

### メインコンテンツ
```typescript
// mainタグで囲む
<main style={{ padding: '32px 0' }}>
  // コンテンツ
</main>
```

### フッター仕様
```typescript
{
  borderTop: '1px solid #e5e7eb',
  paddingTop: '24px',
  marginTop: '48px'
}
```

## 🎨 カラーパレット

### 基本色
| 用途 | 色コード | 使用箇所 |
|-----|---------|---------|
| 背景色 | `#ffffff` | ページ背景、カード背景 |
| テキスト色 | `#1a1a1a` | 見出し、本文 |
| サブテキスト | `#6b7280` | 説明文、補助情報 |
| ボーダー | `#e5e7eb` | 区切り線、カード枠 |
| 背景（薄） | `#f9fafb` | セクション背景 |
| 背景（グレー） | `#f3f4f6` | 非アクティブ要素 |

### アクセント色
| 用途 | 色コード | 使用箇所 |
|-----|---------|---------|
| プライマリ | `#2563eb` | メインボタン、リンク |
| 成功 | `#059669` | 成功状態、確認ボタン |
| エラー | `#dc2626` | エラー表示、警告 |
| 警告 | `#d97706` | 注意喚起 |

### モード別カラー
| モード | 背景色 | アイコン色 |
|--------|--------|-----------|
| ランダム基音 | `#d1fae5` | `#059669` |
| 連続チャレンジ | `#fed7aa` | `#ea580c` |
| 12音階 | `#e9d5ff` | `#9333ea` |

## 📐 タイポグラフィ

### フォントサイズ
```typescript
const FONT_SIZES = {
  xs: '12px',    // 補足情報
  sm: '14px',    // 通常テキスト
  base: '16px',  // 本文
  lg: '18px',    // 小見出し
  xl: '20px',    // 中見出し
  '2xl': '24px', // 大見出し
  '3xl': '32px'  // ページタイトル（使用控えめ）
}
```

### フォントウェイト
```typescript
const FONT_WEIGHTS = {
  normal: '400',  // 通常テキスト
  medium: '500',  // やや強調
  semibold: '600', // 準太字
  bold: '700'     // 太字（見出し）
}
```

### 行高
```typescript
const LINE_HEIGHTS = {
  tight: '1.25',   // コンパクト表示
  normal: '1.5',   // 通常
  relaxed: '1.6'   // 読みやすさ重視
}
```

## 🔲 コンポーネント仕様

### カード
```typescript
{
  backgroundColor: 'white',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
}
```

### ボタン

#### プライマリボタン
```typescript
{
  backgroundColor: '#2563eb',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  padding: '12px 24px',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease-in-out'
}
```

#### セカンダリボタン
```typescript
{
  backgroundColor: 'white',
  color: '#1a1a1a',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '8px 16px',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease-in-out'
}
```

#### 無効化ボタン
```typescript
{
  backgroundColor: '#d1d5db',
  color: '#6b7280',
  border: '2px solid #e5e7eb',
  borderRadius: '8px',
  padding: '12px 32px',
  fontSize: '18px',
  fontWeight: 'bold',
  cursor: 'not-allowed'
}
```

### 入力フィールド（将来実装用）
```typescript
{
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  fontSize: '14px',
  backgroundColor: 'white',
  transition: 'border-color 0.2s ease-in-out'
}
```

## 📏 スペーシング

### 基本単位
```typescript
const SPACING = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px'
}
```

### 使用ガイドライン
- **要素間**: 8px, 16px, 24px
- **セクション間**: 32px, 48px
- **ページパディング**: 16px（モバイル）, 24px（デスクトップ）

## 🎭 シャドウ

### 標準シャドウ
```typescript
const SHADOWS = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
}
```

### 使用基準
- **カード**: `base`
- **ボタン**: `sm`
- **モーダル**: `lg`
- **ホバー時**: 1段階上のシャドウ

## 🔄 アニメーション

### トランジション
```typescript
const TRANSITIONS = {
  fast: '0.1s ease-out',      // 音量バーなど
  normal: '0.2s ease-in-out', // ボタンホバー
  slow: '0.3s ease-in-out'    // ページ遷移
}
```

### 使用箇所
- **ホバー効果**: `transition: 'background-color 0.2s ease-in-out'`
- **リアルタイム更新**: `transition: 'all 0.1s ease-out'`
- **展開/折りたたみ**: `transition: 'height 0.3s ease-in-out'`

## 📱 レスポンシブ対応

### ブレークポイント
```typescript
const BREAKPOINTS = {
  sm: '640px',   // スマートフォン
  md: '768px',   // タブレット
  lg: '1024px',  // デスクトップ
  xl: '1280px'   // 大画面
}
```

### グリッドシステム
```typescript
// レスポンシブグリッド
{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '24px'
}
```

## 🚨 実装上の注意事項

### GitHub Pages 対応
1. **完全インラインスタイル**: CSS クラスに依存しない
2. **style 属性で直接指定**: 全スタイルを JavaScript オブジェクトで定義
3. **CSS 変数非使用**: 直接的な色指定

### iPhone Safari 対応
1. **初期 style 属性を避ける**: JavaScript での初期化推奨
2. **動的更新の統一**: DOM 直接操作で一貫性確保
3. **transition 指定必須**: スムーズな UI 更新

### パフォーマンス考慮
1. **不要な再レンダリング回避**: React.memo の活用
2. **インラインスタイルの最適化**: 共通スタイルの定数化
3. **アニメーション制限**: 必要最小限に留める

## 📝 実装例

### 基本的なページ構造
```typescript
export default function Page() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      color: '#1a1a1a',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 16px'
      }}>
        {/* ヘッダー */}
        <header style={{ borderBottom: '1px solid #e5e7eb' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 0'
          }}>
            {/* ヘッダーコンテンツ */}
          </div>
        </header>
        
        {/* メインコンテンツ */}
        <main style={{ padding: '32px 0' }}>
          {/* ページコンテンツ */}
        </main>
        
        {/* フッター */}
        <footer style={{
          borderTop: '1px solid #e5e7eb',
          paddingTop: '24px',
          marginTop: '48px'
        }}>
          {/* フッターコンテンツ */}
        </footer>
      </div>
    </div>
  );
}
```

## 🔍 検証チェックリスト

- [ ] 全ページで最大幅 1200px が適用されている
- [ ] ヘッダー・フッターのスタイルが統一されている
- [ ] カラーパレットが仕様通り使用されている
- [ ] フォントサイズ・ウェイトが規定値内
- [ ] ボタンスタイルが統一されている
- [ ] レスポンシブ対応が適切
- [ ] インラインスタイルで実装されている
- [ ] iPhone Safari で正常表示

---

**最終更新日**: 2025年1月23日
**バージョン**: 1.0.0