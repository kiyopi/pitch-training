# ページテンプレート統一仕様書

## 📋 概要

Next.jsアプリケーション全体で使用する統一ページテンプレートの仕様定義。Header/Body/Footer構造の標準化とレスポンシブ対応。

**作成日**: 2025-01-24  
**対象**: 全トレーニングページ・テストページ  
**設計方針**: 左寄せレイアウト + 統一レスポンシブ設計

---

## 🏗️ 基本構造

### **HTML構造**
```html
<div className={styles.pageContainer}>
  <header className={styles.pageHeader}>
    <!-- ヘッダー内容 -->
  </header>
  
  <main className={styles.pageMain}>
    <!-- メインコンテンツ -->
  </main>
  
  <footer className={styles.pageFooter}>
    <!-- フッター内容 -->
  </footer>
</div>
```

---

## 📱 Header仕様

### **基本レイアウト**
```
┌─────────────────────────────────────────────────────────┐
│ [← ホーム]    ページタイトル                              │
├─────────────────────────────────────────────────────────┤
```

### **重要ルール**
- **左寄せ配置**: ヘッダー全体を左寄せ（center配置禁止）
- **戻るボタン**: 必ず左端に配置
- **ページタイトル**: 戻るボタンの右側に配置
- **右側余白**: 余計な要素は配置しない

### **実装仕様**
```tsx
<header className={styles.pageHeader}>
  <div className={styles.headerContent}>
    <Link href="/" className={styles.homeLink}>
      <ArrowLeft className="w-5 h-5 mr-2" />
      ホーム
    </Link>
    <h1 className={styles.pageTitle}>
      {pageTitle}
    </h1>
  </div>
</header>
```

### **CSS仕様**
```css
.pageHeader {
  border-bottom: 1px solid #e5e7eb;
  padding: 24px 0;
}

.headerContent {
  display: flex;
  align-items: center;
  gap: 24px;
  justify-content: flex-start; /* 左寄せ */
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.homeLink {
  display: flex;
  align-items: center;
  color: #6b7280;
  text-decoration: none;
  transition: color 0.3s ease;
  font-weight: 500;
}

.homeLink:hover {
  color: #374151;
}

.pageTitle {
  font-size: 20px;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
}
```

---

## 📄 Body仕様

### **基本レイアウト**
```
┌─────────────────────────────────────────────────────────┐
│                    メインコンテンツ                      │
│                                                        │
│  - 最大幅: 800px                                        │
│  - 中央寄せ                                             │
│  - 左右余白: 20px                                       │
│                                                        │
└─────────────────────────────────────────────────────────┘
```

### **実装仕様**
```tsx
<main className={styles.pageMain}>
  <div className={styles.mainContent}>
    {children}
  </div>
</main>
```

### **CSS仕様**
```css
.pageMain {
  flex: 1;
  padding: 32px 0;
  min-height: calc(100vh - 200px); /* Header + Footer分を除く */
}

.mainContent {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
  width: 100%;
}
```

---

## 📍 Footer仕様

### **基本レイアウト**
```
┌─────────────────────────────────────────────────────────┐
│          © 2024 相対音感トレーニング. All rights reserved.  │
│              Version 3.0 • Powered by Next.js           │
└─────────────────────────────────────────────────────────┘
```

### **実装仕様**
```tsx
<footer className={styles.pageFooter}>
  <div className={styles.footerContent}>
    <div className={styles.copyright}>
      © 2024 相対音感トレーニング. All rights reserved.
    </div>
    <div className={styles.version}>
      <span>Version 3.0</span>
      <span>•</span>
      <span>Powered by Next.js</span>
    </div>
  </div>
</footer>
```

### **CSS仕様**
```css
.pageFooter {
  border-top: 1px solid #e5e7eb;
  padding: 24px 0;
  margin-top: 48px;
}

.footerContent {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.copyright {
  font-size: 14px;
  color: #6b7280;
  text-align: center;
}

.version {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
  color: #6b7280;
}
```

---

## 📱 レスポンシブ対応

### **ブレークポイント**
- **PC**: 769px以上
- **タブレット**: 481px〜768px
- **モバイル**: 480px以下

### **PC表示**
```css
/* デフォルト（PC表示） */
.pageContainer {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
```

### **タブレット表示**
```css
@media (max-width: 768px) {
  .headerContent {
    padding: 0 16px;
    gap: 16px;
  }
  
  .pageTitle {
    font-size: 18px;
  }
  
  .mainContent {
    padding: 0 16px;
  }
  
  .footerContent {
    padding: 0 16px;
  }
}
```

### **モバイル表示**
```css
@media (max-width: 480px) {
  .headerContent {
    padding: 0 12px;
    gap: 12px;
  }
  
  .pageTitle {
    font-size: 16px;
  }
  
  .pageMain {
    padding: 24px 0;
  }
  
  .mainContent {
    padding: 0 12px;
  }
  
  .footerContent {
    padding: 0 12px;
  }
  
  .version {
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }
}
```

---

## 🎨 カラーパレット

### **基本色**
```css
:root {
  /* テキスト */
  --text-primary: #1f2937;      /* 見出し・重要テキスト */
  --text-secondary: #6b7280;    /* サブテキスト・ナビゲーション */
  --text-muted: #9ca3af;        /* 補助テキスト */
  
  /* 背景 */
  --bg-white: #ffffff;          /* メイン背景 */
  --bg-gray-50: #f9fafb;        /* セクション背景 */
  --bg-gray-100: #f3f4f6;       /* カード背景 */
  
  /* ボーダー */
  --border-light: #e5e7eb;      /* 境界線 */
  --border-medium: #d1d5db;     /* カード境界 */
  
  /* アクセント */
  --accent-blue: #3b82f6;       /* プライマリボタン */
  --accent-blue-hover: #2563eb; /* ホバー状態 */
}
```

---

## 🔧 実装チェックリスト

### **Header実装**
- [ ] 左寄せレイアウト（center配置禁止）
- [ ] 戻るボタン（ArrowLeft + "ホーム"）
- [ ] ページタイトル適切配置
- [ ] ホバーエフェクト実装
- [ ] レスポンシブ対応

### **Body実装**
- [ ] 最大幅800px制限
- [ ] 中央寄せ配置
- [ ] 適切なパディング設定
- [ ] 最小高さ確保
- [ ] レスポンシブ対応

### **Footer実装**
- [ ] 著作権表示
- [ ] バージョン情報表示
- [ ] 中央寄せ配置
- [ ] 境界線設定
- [ ] レスポンシブ対応

### **全体実装**
- [ ] CSS Modules使用
- [ ] 適切なセマンティックHTML
- [ ] アクセシビリティ配慮
- [ ] iPhone Safari対応
- [ ] パフォーマンス最適化

---

## 📋 適用ページ一覧

### **トレーニングページ**
- `/training/random` - ランダム基音トレーニング
- `/training/continuous` - 連続チャレンジ
- `/training/chromatic` - 12音階モード

### **テストページ**
- `/microphone-test` - マイクテスト
- `/test/*` - 各種テストページ

### **その他**
- エラーページ
- 404ページ

---

## ⚠️ 重要な禁止事項

### **Header禁止事項**
- ❌ `justifyContent: 'center'` の使用
- ❌ `textAlign: 'center'` の使用
- ❌ 3カラムレイアウト（左-中央-右）
- ❌ 右側への余計な要素配置

### **全体禁止事項**
- ❌ インラインスタイルの多用
- ❌ 固定幅の直書き
- ❌ レスポンシブ対応の省略
- ❌ セマンティックHTMLの無視

---

**この仕様書に基づき、全ページで統一されたレイアウトを実装します。**