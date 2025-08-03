# 後回し課題リスト

このドキュメントは重要性が低いため後回しにした技術課題をまとめています。

---

## 🔄 カルーセル2段階移動問題（2025-07-31 後回し決定）

### **問題の概要**
**症状**: セッション3以降でカルーセルが2回スライドする異常動作
- セッション4→5移動時に実際は4→5→6の2段階移動が発生
- セッション5→6移動時も5→6→7の2段階移動が発生
- セッション3から顕著に現れる

### **影響範囲**
- **UI/UX**: カルーセルナビゲーションの違和感
- **機能性**: 期待するセッションと異なるセッションが表示される
- **重要度**: **低** - 基本機能に影響なし、表示上の問題のみ

### **技術的な根本原因（推定）**
#### 1. 複数SessionCarousel同期問題
- UnifiedScoreResultFixed.svelte内に3つのSessionCarouselが存在
- 同一の`currentSessionIndex`変数を共有
- 1つのcarouselの変更が他のcarouselに波及し連鎖更新を引き起こす

#### 2. Reactive Statement無限ループ
```javascript
// 問題のあるコード (UnifiedScoreResultFixed.svelte:106-140)
$: if (scoreData?.sessionHistory) {
  // lastSessionCount が毎回0にリセットされる問題
  if (lastSessionCount === 0 || currentSessionCount > lastSessionCount) {
    // 自動移動ロジックが繰り返し実行される
  }
}
```

#### 3. SessionCarouselのReactive対応
```javascript
// 問題のあるコード (SessionCarousel.svelte:49-51)
$: if (currentIndex >= 0 && currentIndex < sessionHistory.length) {
  slidePosition.set(-currentIndex * 100);
  // この処理が連鎖的なイベント発火を引き起こす可能性
}
```

### **試行した修正と結果**
#### 修正1: 連鎖更新防止フラグ実装
```javascript
let isUpdatingIndex = false;
on:sessionChange={(event) => {
  if (isUpdatingIndex) return;
  isUpdatingIndex = true;
  // ... 処理
  setTimeout(() => { isUpdatingIndex = false; }, 10);
}}
```
**結果**: ❌ 悪化（セッション3から2回スライドに変化）

#### 修正2: Reactive Statement簡素化
```javascript
$: if (scoreData?.sessionHistory && currentSessionIndex === 0 && !preventAutoMove) {
  // 初回のみ自動移動の実装
}
```
**結果**: ❌ 効果なし

### **問題の特徴**
- **発生タイミング**: セッション3以降の自動移動時
- **ログ出力**: `lastSessionCount: 0`が毎回表示（変数保持問題）
- **コンポーネント再初期化**: reactive変数が正しく保持されない

### **今後のアプローチ候補**
1. **SessionCarouselの分離**: 各モード用に独立したcarouselインデックス変数を使用
2. **イベント防御**: sessionChangeイベントのデバウンス実装
3. **状態管理見直し**: Svelteストアを使用した状態管理への移行
4. **コンポーネント設計変更**: 単一SessionCarouselでのモード切り替え実装

### **現在の対処状況**
- **緊急度**: 低（基本機能に影響なし）
- **ユーザー体験**: 軽微な違和感のみ
- **開発優先度**: 他の重要機能実装を優先
- **一時対処**: デバッグログを保持し、将来的な分析に活用

---

## 📝 後回し決定理由

### **重要性評価**
- **機能性**: ✅ セッション評価・音程検出等の核心機能は正常動作
- **安定性**: ✅ アプリクラッシュや重大エラーは発生しない
- **ユーザビリティ**: △ 軽微な操作違和感のみ

### **開発リソース配分**
- **高優先度**: 新機能実装、パフォーマンス改善
- **中優先度**: UI/UX向上、ユーザビリティ改善
- **低優先度**: 軽微な表示問題、非クリティカルバグ

### **技術債務としての管理**
- **カテゴリ**: UI/UXの軽微な問題
- **影響度**: 限定的（カルーセル操作時のみ）
- **解決複雑度**: 中〜高（複数コンポーネント間の状態管理問題）

---

## 🔄 将来の対応予定

### **対応タイミング**
- **フェーズ1**: 核心機能完成後
- **フェーズ2**: 全体的なUI/UX見直し時期
- **フェーズ3**: コードリファクタリング時期

### **関連する改善機会**
- SessionCarouselコンポーネントの全体的な見直し
- 状態管理パターンの統一
- 複数コンポーネント間のデータフロー最適化

---

**最終更新**: 2025-07-31  
**ステータス**: 後回し決定  
**次回レビュー予定**: 核心機能完成後