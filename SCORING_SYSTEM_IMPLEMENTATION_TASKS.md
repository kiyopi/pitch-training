# 統一採点システム実装タスクリスト

**作成日**: 2025-07-28  
**対象**: 3モード統一採点システム実装  
**実装期間**: 4週間（Phase 1-4）  
**技術基盤**: SvelteKit + HarmonicCorrection + 統一音響処理

---

## 📋 **実装タスク全体概要**

### **タスク管理方針**
- ✅ **段階的実装**: 4フェーズ × 週次で確実な進行
- ✅ **品質重視**: 各タスク完了時の動作確認必須
- ✅ **既存資産活用**: HarmonicCorrection等の最大活用
- ✅ **継続的デプロイ**: GitHub Pages展開での実機確認

### **完了基準**
- **機能完了**: 仕様書記載の全機能実装
- **品質確保**: エラーなし・パフォーマンス基準クリア
- **動作確認**: ローカル・GitHub Pages両環境での確認
- **文書化**: 実装内容・使用方法の記録

---

## 🚀 **Phase 1: 共通採点エンジン構築（週1）**

### **Phase 1目標**
HarmonicCorrection統合による統一採点エンジンの完成

### **Task 1.1: ScoringEngine.js 基本実装**
**優先度**: 🔴 High  
**見積工数**: 6時間  
**担当**: 統一採点ロジック実装

#### **実装内容**
- [ ] **基本クラス構造作成**
  - ScoringEngineクラス定義
  - constructor（mode, config）実装
  - モード識別・設定管理システム

- [ ] **HarmonicCorrection統合**
  - 既存harmonicCorrectionインスタンス活用
  - correctHarmonic()メソッド呼び出し統合
  - デバッグログ連携（開発時のみ）

- [ ] **コア計算メソッド実装**
  - calculateScore()メインメソッド
  - calculateCentsDifference()セント差計算
  - calculateAccuracyScore()精度スコア
  - calculateTimeScore()反応時間スコア
  - calculateTotalScore()総合スコア

#### **成果物**
```
/src/lib/scoring/ScoringEngine.js
├── class ScoringEngine
├── calculateScore() メインメソッド
├── HarmonicCorrection統合
├── モード別設定システム
└── デバッグ・ログ機能
```

#### **完了基準**
- [ ] TypeScript型エラーなし
- [ ] ESLintエラーなし
- [ ] 基本的な採点計算が動作
- [ ] HarmonicCorrection連携確認
- [ ] コンソールログでデバッグ情報出力

---

### **Task 1.2: ScoreManager.js 実装**
**優先度**: 🔴 High  
**見積工数**: 5時間  
**担当**: モード別スコア管理システム

#### **実装内容**
- [ ] **BaseScoreManager基底クラス**
  - 共通インターフェース定義
  - addScore()基本メソッド
  - 抽象メソッド定義（オーバーライド用）

- [ ] **RandomScoreManager実装**
  - 即座表示システム
  - セッション統計管理
  - 3秒間表示→待機状態遷移

- [ ] **ContinuousScoreManager実装**
  - 5回分履歴保持システム
  - 進捗表示機能
  - チャレンジ完了判定

- [ ] **ChromaticScoreManager実装**
  - 12音×上下マトリックス管理
  - Map構造でのスコア保存
  - 完了率計算・表示データ生成

- [ ] **ScoreManagerFactory実装**
  - ファクトリーパターン適用
  - モード別インスタンス生成
  - オプション設定対応

#### **成果物**
```
/src/lib/scoring/ScoreManager.js
├── BaseScoreManager（基底クラス）
├── RandomScoreManager（即座表示）
├── ContinuousScoreManager（5回保持）
├── ChromaticScoreManager（マトリックス）
└── ScoreManagerFactory（ファクトリー）
```

#### **完了基準**
- [ ] 3つのManager全て実装完了
- [ ] Factory パターン動作確認
- [ ] モード別設定の切り替え確認
- [ ] スコア履歴管理の動作確認
- [ ] 表示データ生成の確認

---

### **Task 1.3: 設定・ユーティリティ実装**
**優先度**: 🟡 Medium  
**見積工数**: 3時間  
**担当**: 設定管理・補助機能

#### **実装内容**
- [ ] **モード別デフォルト設定**
  - Random: 精度重視（accuracy 0.7, time 0.3）
  - Continuous: より精度重視（accuracy 0.8, time 0.2）
  - Chromatic: 最高精度（accuracy 0.9, time 0.1）

- [ ] **評価ランク定義**
  - Perfect/Excellent/Good/Fair/Poor/Miss
  - 色分け・メッセージ設定
  - 閾値・条件設定

- [ ] **フィードバック生成システム**
  - 音程フィードバック（高め・低め）
  - 精度フィードバック（完璧・良好・要改善）
  - 反応時間フィードバック（早い・遅い）

- [ ] **統計・履歴管理**
  - セッション統計初期化
  - スコア履歴管理
  - 統計計算メソッド

#### **成果物**
```
/src/lib/scoring/
├── config/
│   ├── modeConfig.js     # モード別設定
│   ├── rankConfig.js     # ランク・評価設定
│   └── feedbackConfig.js # フィードバック設定
└── utils/
    ├── statistics.js     # 統計計算
    └── formatting.js     # 表示用フォーマット
```

#### **完了基準**
- [ ] 全モード設定の動作確認
- [ ] ランク判定の正確性確認
- [ ] フィードバック生成の確認
- [ ] 統計計算の精度確認
- [ ] 設定変更の反映確認

---

### **Task 1.4: テストページ作成・動作確認**
**優先度**: 🔴 High  
**見積工数**: 4時間  
**担当**: エンジン単体テスト環境

#### **実装内容**
- [ ] **テストページ基本構造**
  - `/src/routes/test/scoring-engine/+page.svelte`
  - ScoringEngine・ScoreManager読み込み
  - HarmonicCorrection連携確認

- [ ] **インタラクティブテスト機能**
  - モード切り替えUI
  - 手動スコア入力フォーム
  - リアルタイム採点結果表示

- [ ] **自動テストシナリオ**
  - 既知の周波数値での採点テスト
  - HarmonicCorrection効果確認
  - モード別設定の差異確認

- [ ] **デバッグ・ログ表示**
  - 詳細採点ログ表示
  - HarmonicCorrection補正ログ
  - 設定値・計算過程の可視化

#### **成果物**
```
/src/routes/test/scoring-engine/
├── +page.svelte          # テストページメイン
├── TestControls.svelte   # テスト操作UI
├── ScoreDisplay.svelte   # 結果表示
└── DebugPanel.svelte     # デバッグ情報
```

#### **完了基準**
- [ ] 3モード全ての動作確認
- [ ] HarmonicCorrection連携確認
- [ ] 手動・自動テスト両方実行
- [ ] GitHub Pagesでの動作確認
- [ ] iPhone実機での動作確認

---

### **Phase 1完了チェックリスト**
- [ ] **ScoringEngine.js**: 完全実装・動作確認
- [ ] **ScoreManager.js**: 3マネージャー実装・動作確認
- [ ] **設定システム**: モード別設定・ランク・フィードバック
- [ ] **テストページ**: 単体テスト環境・自動テスト
- [ ] **GitHub Pages**: 展開・実機確認
- [ ] **文書化**: 実装内容・使用方法記録

---

## 🎨 **Phase 2: 表示コンポーネント開発（週2）**

### **Phase 2目標**
統一表示システム・shadcn/ui風デザインの完成

### **Task 2.1: ScoreDisplay.svelte メイン実装**
**優先度**: 🔴 High  
**見積工数**: 6時間  
**担当**: 統一表示コンポーネント

#### **実装内容**
- [ ] **メインコンポーネント構造**
  - ScoreDisplay.svelteファイル作成
  - props定義（mode, scoreData, options）
  - モード別表示切り替えロジック

- [ ] **レイアウトシステム**
  - shadcn/ui風CSS設計
  - レスポンシブ対応（Mobile/Desktop）
  - モード別色分け（Random: 青, Continuous: 緑, Chromatic: 紫）

- [ ] **状態管理**
  - displayState制御（waiting/active/completed）
  - 表示/非表示切り替え
  - アニメーション対応準備

- [ ] **子コンポーネント統合**
  - SingleScoreDisplay統合
  - ContinuousScoreDisplay統合
  - ChromaticGridDisplay統合
  - OverallStatsDisplay統合

#### **成果物**
```
/src/lib/components/scoring/ScoreDisplay.svelte
├── メイン表示コンポーネント
├── モード別切り替えロジック
├── shadcn/ui風レイアウト
├── レスポンシブ対応
└── 子コンポーネント統合
```

#### **完了基準**
- [ ] 3モード表示切り替え動作
- [ ] レスポンシブ確認（iPhone/PC）
- [ ] shadcn/ui風デザイン実装
- [ ] 状態遷移の確認
- [ ] 子コンポーネント正常表示

---

### **Task 2.2: SingleScoreDisplay.svelte 実装**
**優先度**: 🔴 High  
**見積工数**: 4時間  
**担当**: Random Mode専用表示

#### **実装内容**
- [ ] **スコア表示レイアウト**
  - 大きな総合スコア表示（中央寄せ）
  - ランクバッジ表示（色分け）
  - フィードバックメッセージ

- [ ] **詳細スコア表示**
  - 精度スコア（セント差付き）
  - 反応時間スコア（秒数付き）
  - グリッドレイアウト

- [ ] **アニメーション効果**
  - スコア表示時のフェードイン
  - ランクバッジのスケールアニメーション
  - 数値カウントアップ効果

- [ ] **カスタマイズオプション**
  - 詳細表示切り替え
  - フィードバック表示制御
  - サイズ・色調整

#### **成果物**
```
/src/lib/components/scoring/SingleScoreDisplay.svelte
├── メインスコア表示
├── 詳細スコア表示
├── ランクバッジ・フィードバック
├── アニメーション効果
└── カスタマイズオプション
```

#### **完了基準**
- [ ] スコア表示の視認性確認
- [ ] ランク別色分け動作
- [ ] アニメーション効果確認
- [ ] Mobile/Desktop両対応
- [ ] カスタマイズオプション動作

---

### **Task 2.3: ContinuousScoreDisplay.svelte 実装**
**優先度**: 🔴 High  
**見積工数**: 5時間  
**担当**: Continuous Mode専用表示

#### **実装内容**
- [ ] **プログレス表示**
  - 進捗バー（5回中の現在位置）
  - 進捗率パーセント表示
  - 色分け（進行中・完了）

- [ ] **試行結果グリッド**
  - 5つのボックス配置
  - 各試行のスコア・ランク表示
  - 現在・完了・未実行の状態表示

- [ ] **総合結果表示**
  - 平均スコア計算・表示
  - 合計スコア表示
  - チャレンジ完了時の特別表示

- [ ] **詳細情報表示**
  - 各試行の詳細（精度・時間）
  - 最高・最低スコア強調
  - 改善提案表示

#### **成果物**
```
/src/lib/components/scoring/ContinuousScoreDisplay.svelte
├── プログレス表示システム
├── 5試行結果グリッド
├── 総合結果表示
├── 詳細情報・統計
└── チャレンジ完了UI
```

#### **完了基準**
- [ ] プログレス表示の正確性
- [ ] 5試行グリッドの動作
- [ ] 総合結果計算の確認
- [ ] 詳細情報表示の確認
- [ ] 完了時UI表示確認

---

### **Task 2.4: ChromaticGridDisplay.svelte 実装**
**優先度**: 🔴 High  
**見積工数**: 6時間  
**担当**: Chromatic Mode専用表示

#### **実装内容**
- [ ] **12音階マトリックス表示**
  - 12行×3列のグリッド（音名・上行・下行）
  - 音名表示（C, C#, D...）
  - スコア表示セル

- [ ] **マトリックス状態管理**
  - 完了・未完了の視覚的区別
  - スコア・ランクの色分け表示
  - 進捗率計算・表示

- [ ] **詳細情報表示**
  - セル内の精度・セント差表示
  - ホバー・クリックでの詳細表示
  - 音名・方向の明確表示

- [ ] **総合統計**
  - 24音完了率表示
  - 平均スコア計算
  - 最終完了時の祝福表示

#### **成果物**
```
/src/lib/components/scoring/ChromaticGridDisplay.svelte
├── 12音階マトリックス
├── 上行・下行スコア表示
├── 進捗率・完了状態
├── 詳細情報表示
└── 総合統計・完了UI
```

#### **完了基準**
- [ ] 12×3マトリックス正常表示
- [ ] スコア・ランク色分け確認
- [ ] 進捗率計算の正確性
- [ ] 詳細情報表示の確認
- [ ] 総合統計・完了UI確認

---

### **Task 2.5: OverallStatsDisplay.svelte 実装**
**優先度**: 🟡 Medium  
**見積工数**: 3時間  
**担当**: 共通統計表示

#### **実装内容**
- [ ] **セッション統計表示**
  - 総試行回数・平均スコア
  - 最高スコア・最高ランク
  - セッション時間

- [ ] **ランク分布表示**
  - 各ランクの取得回数
  - 円グラフ・棒グラフ表示
  - 改善傾向の可視化

- [ ] **進歩追跡**
  - スコア推移グラフ
  - 直近の成績変化
  - 目標達成状況

- [ ] **コンパクト表示**
  - 必要最小限の情報表示
  - 折りたたみ・展開機能
  - モード別最適化

#### **成果物**
```
/src/lib/components/scoring/OverallStatsDisplay.svelte
├── セッション統計
├── ランク分布表示
├── 進歩追跡グラフ
├── コンパクト表示
└── モード別最適化
```

#### **完了基準**
- [ ] 統計計算の正確性確認
- [ ] グラフ表示の動作確認
- [ ] 折りたたみ機能の動作
- [ ] モード別表示の確認
- [ ] パフォーマンス確認

---

### **Task 2.6: スタイル・アニメーション実装**
**優先度**: 🟡 Medium  
**見積工数**: 4時間  
**担当**: UI/UX向上

#### **実装内容**
- [ ] **CSS統一システム**
  - :global()での共通スタイル
  - CSS変数での色分け管理
  - レスポンシブ設計

- [ ] **アニメーション実装**
  - スコア表示のフェード・スケール
  - プログレスバーの滑らかな変化
  - ランクバッジのパルス効果

- [ ] **インタラクション強化**
  - ホバー効果
  - クリック・タップ反応
  - フォーカス状態の明示

- [ ] **アクセシビリティ対応**
  - 色覚異常対応
  - スクリーンリーダー対応
  - キーボードナビゲーション

#### **成果物**
```
/src/lib/components/scoring/styles/
├── common.css        # 共通スタイル
├── animations.css    # アニメーション
├── responsive.css    # レスポンシブ
└── accessibility.css # アクセシビリティ
```

#### **完了基準**
- [ ] 統一スタイル適用確認
- [ ] アニメーション動作確認
- [ ] インタラクション確認
- [ ] アクセシビリティ確認
- [ ] 各デバイスでの表示確認

---

### **Phase 2完了チェックリスト**
- [ ] **ScoreDisplay**: メイン表示コンポーネント完成
- [ ] **SingleScore**: Random Mode表示完成
- [ ] **ContinuousScore**: Continuous Mode表示完成
- [ ] **ChromaticGrid**: Chromatic Mode表示完成
- [ ] **OverallStats**: 共通統計表示完成
- [ ] **スタイル**: 統一デザイン・アニメーション完成
- [ ] **テスト**: 全コンポーネント動作確認
- [ ] **実機確認**: iPhone/PC両環境での表示確認

---

## ⚡ **Phase 3: Random Mode統合（週3）**

### **Phase 3目標**
既存Random Modeページへの採点システム完全統合

### **Task 3.1: 既存ページ統合準備**
**優先度**: 🔴 High  
**見積工数**: 3時間  
**担当**: 統合環境準備

#### **実装内容**
- [ ] **現在実装の分析**
  - `/src/routes/training/random/+page.svelte`現状確認
  - 既存の採点・表示ロジック特定
  - 置換対象コードの洗い出し

- [ ] **import文統合**
  - ScoringEngine・ScoreManagerインポート
  - ScoreDisplayコンポーネントインポート
  - 不要インポートの削除

- [ ] **状態管理統合**
  - scoringEngineRef・scoreManagerRef追加
  - 既存state変数との整理
  - 初期化ロジックの統合

- [ ] **バックアップ作成**
  - 既存実装のバックアップファイル作成
  - 段階的移行のためのフラグ準備
  - ロールバック手順の準備

#### **成果物**
```
/src/routes/training/random/
├── +page.svelte          # 統合後メインページ
├── +page.svelte.backup   # 既存実装バックアップ
└── migration-plan.md     # 移行計画・手順書
```

#### **完了基準**
- [ ] 既存実装の完全理解
- [ ] 統合ポイントの特定
- [ ] バックアップ作成完了
- [ ] 段階的移行計画確定
- [ ] ロールバック手順確認

---

### **Task 3.2: 採点システム置換**
**優先度**: 🔴 High  
**見積工数**: 6時間  
**担当**: コア機能統合

#### **実装内容**
- [ ] **ScoringEngine初期化**
  - randomモードでのエンジン初期化
  - HarmonicCorrection連携確認
  - 設定値の適用確認

- [ ] **ScoreManager統合**
  - RandomScoreManager初期化
  - 既存統計ロジックとの置換
  - 表示状態管理の統合

- [ ] **採点トリガー統合**
  - 音程検出完了時の採点実行
  - detectedFreq・targetFreqの受け渡し
  - responseTime計測の統合

- [ ] **結果表示置換**
  - 既存結果表示の削除
  - ScoreDisplayコンポーネント統合
  - 表示タイミング・状態管理

#### **実装例**
```svelte
<!-- Random Mode統合後の実装 -->
<script>
  import { ScoringEngine } from '$lib/scoring/ScoringEngine.js';
  import { ScoreManagerFactory } from '$lib/scoring/ScoreManager.js';
  import ScoreDisplay from '$lib/components/scoring/ScoreDisplay.svelte';
  
  // 採点システム初期化
  let scoringEngine = null;
  let scoreManager = null;
  let scoreData = null;
  
  onMount(() => {
    scoringEngine = new ScoringEngine('random');
    scoreManager = ScoreManagerFactory.create('random', scoringEngine);
  });
  
  // 音程検出完了時の採点
  function handlePitchDetected(detectedFreq, responseTime) {
    if (!scoringEngine || !targetFrequency) return;
    
    const result = scoreManager.addScore({
      detectedFrequency: detectedFreq,
      targetFrequency: targetFrequency,
      responseTime: responseTime,
      contextData: {
        baseFrequency: currentBaseFreq,
        currentScale: scales[currentScaleIndex],
        targetFrequency: targetFrequency
      }
    });
    
    scoreData = scoreManager.getDisplayData();
  }
</script>

<!-- 統合後の表示 -->
<ScoreDisplay 
  mode="random" 
  {scoreData}
  showStats={true}
  showDetails={true}
/>
```

#### **完了基準**
- [ ] ScoringEngine正常初期化
- [ ] 採点計算の正確性確認
- [ ] HarmonicCorrection連携確認
- [ ] 結果表示の置換完了
- [ ] 既存機能の動作維持

---

### **Task 3.3: UI/UX調整・最適化**
**優先度**: 🟡 Medium  
**見積工数**: 4時間  
**担当**: ユーザー体験向上

#### **実装内容**
- [ ] **レイアウト調整**
  - ScoreDisplayの配置最適化
  - 既存UI要素との調和
  - レスポンシブ対応確認

- [ ] **表示タイミング調整**
  - スコア表示のタイミング最適化
  - アニメーション効果の調整
  - ユーザーフィードバックの改善

- [ ] **統計表示統合**
  - セッション統計の適切な表示
  - 進捗追跡の実装
  - リセット機能の統合

- [ ] **エラーハンドリング**
  - 採点エラー時の適切な処理
  - フォールバック表示の実装
  - ユーザー向けエラーメッセージ

#### **成果物**
```
Random Mode統合後のUI改善
├── 最適化されたレイアウト
├── 滑らかなアニメーション
├── 統合された統計表示
├── 改善されたエラーハンドリング
└── 一貫したユーザー体験
```

#### **完了基準**
- [ ] レイアウトの視認性確認
- [ ] アニメーション効果確認
- [ ] 統計表示の正確性確認
- [ ] エラーハンドリング動作確認
- [ ] 全体的UX向上確認

---

### **Task 3.4: テスト・デバッグ・調整**
**優先度**: 🔴 High  
**見積工数**: 5時間  
**担当**: 品質保証

#### **実装内容**
- [ ] **機能テスト**
  - 全ての採点機能の動作確認
  - HarmonicCorrection効果確認
  - エッジケース・境界値テスト

- [ ] **パフォーマンステスト**
  - 採点処理時間測定
  - メモリ使用量確認
  - UI応答性確認

- [ ] **統合テスト**
  - 既存機能との連携確認
  - 音程検出→採点→表示フロー
  - エラー処理・復旧テスト

- [ ] **実機テスト**
  - iPhone Safari実機テスト
  - Android Chrome実機テスト
  - PC各ブラウザテスト

#### **テスト項目**
```
機能テスト:
□ 正確な採点計算
□ HarmonicCorrection効果
□ ランク判定の正確性
□ フィードバック内容

パフォーマンステスト:
□ 採点処理 < 100ms
□ メモリ使用 < 50MB
□ UI応答性 60FPS維持
□ バッテリー影響最小

統合テスト:
□ 音程検出連携
□ 表示システム連携
□ エラーハンドリング
□ 統計機能連携

実機テスト:
□ iPhone Safari
□ Android Chrome
□ PC Chrome/Firefox
□ レスポンシブ表示
```

#### **完了基準**
- [ ] 全機能テスト合格
- [ ] パフォーマンス基準クリア
- [ ] 統合テスト合格
- [ ] 実機テスト合格
- [ ] バグ修正完了

---

### **Task 3.5: GitHub Pages展開・最終確認**
**優先度**: 🔴 High  
**見積工数**: 2時間  
**担当**: 本番環境展開

#### **実装内容**
- [ ] **ビルド確認**
  - `npm run build`エラーなし確認
  - TypeScript型チェック通過
  - ESLint・Prettier確認

- [ ] **コミット・プッシュ**
  - 変更内容のコミット
  - GitHub Pages用プッシュ
  - GitHub Actions実行確認

- [ ] **本番環境確認**
  - GitHub Pages URL確認
  - 全機能の本番動作確認
  - iPhone実機での最終確認

- [ ] **文書化・引き継ぎ**
  - 実装内容の文書化
  - 使用方法・設定の記録
  - 次フェーズへの引き継ぎ準備

#### **成果物**
```
GitHub Pages本番環境
├── Random Mode統一採点システム
├── HarmonicCorrection統合済み
├── 高精度採点・表示システム
├── iPhone/PC両対応
└── 次フェーズ準備完了
```

#### **完了基準**
- [ ] ビルド成功・エラーなし
- [ ] GitHub Actions成功
- [ ] 本番環境正常動作
- [ ] iPhone実機確認完了
- [ ] 文書化・引き継ぎ完了

---

### **Phase 3完了チェックリスト**
- [ ] **統合準備**: 既存分析・バックアップ・計画
- [ ] **採点システム**: ScoringEngine・ScoreManager統合
- [ ] **UI/UX**: レイアウト・アニメーション・統計表示
- [ ] **テスト**: 機能・パフォーマンス・統合・実機テスト
- [ ] **本番展開**: GitHub Pages・最終確認・文書化

---

## 🎯 **Phase 4: 他モード展開（週4）**

### **Phase 4目標**
Continuous・Chromaticモードの完全実装・統合システム完成

### **Task 4.1: Continuous Mode実装**
**優先度**: 🔴 High  
**見積工数**: 8時間  
**担当**: 連続チャレンジモード開発

#### **実装内容**
- [ ] **ページ基本構造作成**
  - `/src/routes/training/continuous/+page.svelte`新規作成
  - Random Modeベースの構造活用
  - Continuous専用設定・状態管理

- [ ] **5回連続システム実装**
  - ContinuousScoreManager統合
  - 5回分の履歴管理
  - 進捗表示・完了判定

- [ ] **チャレンジフロー実装**
  - 開始→5回連続→完了の流れ
  - 各試行間の適切な間隔
  - リセット・再開機能

- [ ] **連続性評価システム**
  - 5回分の一貫性評価
  - 改善傾向の追跡
  - 平均・最高・最低スコア表示

#### **実装例**
```svelte
<!-- Continuous Mode実装例 -->
<script>
  import { ScoringEngine } from '$lib/scoring/ScoringEngine.js';
  import { ScoreManagerFactory } from '$lib/scoring/ScoreManager.js';
  import ScoreDisplay from '$lib/components/scoring/ScoreDisplay.svelte';
  
  // Continuousモード専用設定
  let scoringEngine = new ScoringEngine('continuous');
  let scoreManager = ScoreManagerFactory.create('continuous', scoringEngine, {
    maxAttempts: 5
  });
  
  let currentAttempt = 0;
  let challengeActive = false;
  let challengeComplete = false;
  
  function startChallenge() {
    scoreManager.reset();
    currentAttempt = 0;
    challengeActive = true;
    challengeComplete = false;
    
    // 最初の基音再生
    playNextBaseTone();
  }
  
  function handleAttemptComplete(detectedFreq, responseTime) {
    const result = scoreManager.addScore({
      detectedFrequency: detectedFreq,
      targetFrequency: targetFrequency,
      responseTime: responseTime,
      contextData: { attempt: currentAttempt + 1 }
    });
    
    currentAttempt++;
    
    if (currentAttempt >= 5) {
      challengeComplete = true;
      challengeActive = false;
    } else {
      // 次の基音へ
      setTimeout(playNextBaseTone, 2000);
    }
    
    scoreData = scoreManager.getDisplayData();
  }
</script>

<ScoreDisplay 
  mode="continuous" 
  {scoreData}
  showStats={true}
  showDetails={true}
/>
```

#### **完了基準**
- [ ] 5回連続システム動作確認
- [ ] 進捗表示の正確性確認
- [ ] チャレンジフロー確認
- [ ] 連続性評価の確認
- [ ] ContinuousScoreDisplay表示確認

---

### **Task 4.2: Chromatic Mode実装**
**優先度**: 🔴 High  
**見積工数**: 10時間  
**担当**: 12音階モード開発

#### **実装内容**
- [ ] **ページ基本構造作成**
  - `/src/routes/training/chromatic/+page.svelte`新規作成
  - 12音階専用UI設計
  - マトリックス表示システム

- [ ] **12音階×上下システム**
  - ChromaticScoreManager統合
  - 24音の進捗管理システム
  - 音名・方向の明確な表示

- [ ] **音階選択・進行システム**
  - ユーザー選択式 or 自動進行
  - 完了・未完了の視覚管理
  - ランダム順序・系統的順序選択

- [ ] **高精度評価システム**
  - より厳密な採点基準
  - 微細な音程差の評価
  - 上級者向けフィードバック

#### **実装例**
```svelte
<!-- Chromatic Mode実装例 -->
<script>
  import { ScoringEngine } from '$lib/scoring/ScoringEngine.js';
  import { ScoreManagerFactory } from '$lib/scoring/ScoreManager.js';
  import ScoreDisplay from '$lib/components/scoring/ScoreDisplay.svelte';
  
  // Chromaticモード専用設定
  let scoringEngine = new ScoringEngine('chromatic');
  let scoreManager = ScoreManagerFactory.create('chromatic', scoringEngine);
  
  // 12音階定義
  const chromaticNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const directions = ['up', 'down'];
  
  let currentNote = 'C';
  let currentDirection = 'up';
  let selectionMode = 'manual'; // 'manual' | 'sequential' | 'random'
  
  function selectNote(note, direction) {
    currentNote = note;
    currentDirection = direction;
    
    // 該当する基音・目標音の計算
    calculateTargetFrequency(note, direction);
    
    // 基音再生開始
    playBaseTone(baseFrequency);
  }
  
  function handleChromaticComplete(detectedFreq, responseTime) {
    const result = scoreManager.addScore({
      detectedFrequency: detectedFreq,
      targetFrequency: targetFrequency,
      responseTime: responseTime,
      contextData: {
        note: currentNote,
        direction: currentDirection
      }
    }, {
      note: currentNote,
      direction: currentDirection
    });
    
    scoreData = scoreManager.getDisplayData();
    
    // 自動進行の場合は次の音階へ
    if (selectionMode === 'sequential') {
      selectNextNote();
    }
  }
</script>

<ScoreDisplay 
  mode="chromatic" 
  {scoreData}
  showStats={true}
  showDetails={true}
/>
```

#### **完了基準**
- [ ] 12音階×上下=24音の管理確認
- [ ] マトリックス表示の正確性確認
- [ ] 音階選択システム動作確認
- [ ] 高精度評価システム確認
- [ ] ChromaticGridDisplay表示確認

---

### **Task 4.3: モード間ナビゲーション実装**
**優先度**: 🟡 Medium  
**見積工数**: 3時間  
**担当**: ユーザビリティ向上

#### **実装内容**
- [ ] **共通ナビゲーション**
  - 3モード間の切り替えUI
  - 現在モードの明示
  - 進捗保持・引き継ぎ

- [ ] **モード説明・ガイド**
  - 各モードの特徴説明
  - 難易度・推奨順序の表示
  - 初回訪問時のガイダンス

- [ ] **設定・カスタマイズ**
  - モード別設定の調整
  - ユーザー設定の保存
  - デフォルト値のリセット

- [ ] **統一ヘッダー・フッター**
  - 3モード共通のレイアウト
  - 一貫したブランディング
  - 適切な情報階層

#### **成果物**
```
共通ナビゲーションシステム
├── モード切り替えUI
├── 進捗・設定保持
├── ガイダンスシステム
├── 統一レイアウト
└── ユーザビリティ向上
```

#### **完了基準**
- [ ] 3モード切り替え動作確認
- [ ] 進捗保持の確認
- [ ] ガイダンス表示確認
- [ ] 設定保存・復元確認
- [ ] 統一レイアウト確認

---

### **Task 4.4: 最終統合テスト・最適化**
**優先度**: 🔴 High  
**見積工数**: 6時間  
**担当**: 品質保証・最適化

#### **実装内容**
- [ ] **3モード統合テスト**
  - Random・Continuous・Chromatic全テスト
  - モード切り替え時の動作確認
  - データ保持・リセットの確認

- [ ] **パフォーマンス最適化**
  - バンドルサイズ最適化
  - メモリ使用量削減
  - ローディング時間短縮

- [ ] **クロスブラウザテスト**
  - Chrome・Firefox・Safari・Edge
  - iPhone・Android実機テスト
  - 古いブラウザでの動作確認

- [ ] **ユーザビリティテスト**
  - 新規ユーザーでの操作テスト
  - 学習効果の確認
  - フィードバック改善

#### **テスト項目**
```
統合テスト:
□ 3モード個別動作
□ モード切り替え
□ データ整合性
□ エラーハンドリング

パフォーマンステスト:
□ バンドルサイズ < +10KB
□ 初期ローディング < 3秒
□ メモリ使用量 < 50MB
□ CPU使用率最適化

クロスブラウザテスト:
□ Chrome (PC/Mobile)
□ Firefox (PC/Mobile)  
□ Safari (Mac/iPhone)
□ Edge (PC)

ユーザビリティテスト:
□ 直感的操作性
□ 学習効果確認
□ エラー時対応
□ アクセシビリティ
```

#### **完了基準**
- [ ] 全統合テスト合格
- [ ] パフォーマンス基準クリア
- [ ] クロスブラウザ動作確認
- [ ] ユーザビリティ確認
- [ ] 最適化完了

---

### **Task 4.5: 文書化・引き継ぎ完了**
**優先度**: 🟡 Medium  
**見積工数**: 4時間  
**担当**: プロジェクト完了

#### **実装内容**
- [ ] **技術文書作成**
  - アーキテクチャ設計書
  - APIリファレンス
  - 保守・拡張ガイド

- [ ] **ユーザーガイド作成**
  - 使用方法説明
  - トラブルシューティング
  - FAQ・よくある質問

- [ ] **開発者向け文書**
  - 新機能追加ガイド
  - カスタマイズ方法
  - テスト手順

- [ ] **プロジェクト完了報告**
  - 実装成果まとめ
  - 品質指標達成確認
  - 今後の拡張計画

#### **成果物**
```
/docs/
├── ARCHITECTURE.md       # アーキテクチャ設計書
├── API_REFERENCE.md      # APIリファレンス
├── USER_GUIDE.md         # ユーザーガイド
├── DEVELOPER_GUIDE.md    # 開発者ガイド
├── TROUBLESHOOTING.md    # トラブルシューティング
└── PROJECT_COMPLETION.md # プロジェクト完了報告
```

#### **完了基準**
- [ ] 技術文書完成
- [ ] ユーザーガイド完成
- [ ] 開発者向け文書完成
- [ ] プロジェクト完了報告書完成
- [ ] 全ドキュメントレビュー完了

---

### **Phase 4完了チェックリスト**
- [ ] **Continuous Mode**: 5回連続システム完全実装
- [ ] **Chromatic Mode**: 12音階×上下システム完全実装
- [ ] **ナビゲーション**: 3モード統合UI完成
- [ ] **最終テスト**: 統合・パフォーマンス・ユーザビリティテスト
- [ ] **文書化**: 技術・ユーザー・開発者向け文書完成

---

## ✅ **プロジェクト完了基準**

### **機能完成度**
- [ ] **Random Mode**: 即座採点・総合評価システム
- [ ] **Continuous Mode**: 5回連続・進捗管理システム
- [ ] **Chromatic Mode**: 12音階マトリックス・高精度評価
- [ ] **統一採点**: HarmonicCorrection統合・高精度補正
- [ ] **統一表示**: 3モード対応・shadcn/ui風デザイン

### **品質基準達成**
- [ ] **採点精度**: ±5セント以内での正確な評価
- [ ] **処理時間**: 100ms以内での採点完了
- [ ] **メモリ効率**: 50MB以内での動作
- [ ] **UI応答性**: 60FPS維持での表示更新
- [ ] **クロスブラウザ**: iPhone/PC両環境対応

### **技術的成果**
- [ ] **HarmonicCorrection活用**: 既存資産最大活用
- [ ] **統一アーキテクチャ**: 80%コード重複削減
- [ ] **保守性向上**: 中央集権的管理システム
- [ ] **拡張性確保**: 新モード追加フレームワーク
- [ ] **パフォーマンス**: 最適化・軽量化完了

### **ユーザー体験**
- [ ] **一貫性**: 全モード統一UI/UX
- [ ] **学習効果**: 段階的スキル向上支援
- [ ] **使いやすさ**: 直感的操作・明確フィードバック
- [ ] **信頼性**: 安定動作・エラー最小化
- [ ] **アクセシビリティ**: 包括的ユーザー対応

### **文書化・引き継ぎ**
- [ ] **技術仕様書**: 完全・正確・保守可能
- [ ] **実装ガイド**: 新機能追加・カスタマイズ対応
- [ ] **ユーザーガイド**: 使用方法・トラブルシューティング
- [ ] **プロジェクト成果**: 定量・定性成果まとめ
- [ ] **将来計画**: 拡張・改善の方向性

---

## 📊 **進捗管理・品質保証**

### **週次進捗確認**
```
Week 1 (Phase 1): 共通採点エンジン
□ ScoringEngine.js実装完了
□ ScoreManager.js実装完了
□ テストページ動作確認
□ HarmonicCorrection統合確認

Week 2 (Phase 2): 表示コンポーネント
□ ScoreDisplay.svelte実装完了
□ 3モード子コンポーネント完了
□ デザイン・アニメーション完了
□ レスポンシブ対応完了

Week 3 (Phase 3): Random Mode統合
□ 既存ページ統合完了
□ 採点システム置換完了
□ UI/UX最適化完了
□ GitHub Pages展開完了

Week 4 (Phase 4): 他モード展開
□ Continuous Mode実装完了
□ Chromatic Mode実装完了
□ 統合テスト・最適化完了
□ 文書化・引き継ぎ完了
```

### **品質管理指標**
```
技術品質:
□ TypeScriptエラー 0件
□ ESLintエラー 0件
□ ビルド警告最小化
□ テストカバレッジ 80%以上

パフォーマンス:
□ バンドルサイズ +10KB以内
□ 初期ローディング 3秒以内
□ 採点処理時間 100ms以内
□ メモリ使用量 50MB以内

ユーザビリティ:
□ タスク完了率 90%以上
□ ユーザー満足度 4.5/5.0以上
□ エラー発生率 1%以下
□ アクセシビリティ WCAG 2.1 AA準拠
```

### **リスク管理**
```
技術リスク:
□ HarmonicCorrection統合複雑性
□ パフォーマンス要件達成
□ クロスブラウザ互換性
□ モバイルデバイス最適化

スケジュールリスク:
□ 4週間期限厳守
□ 週次マイルストーン達成
□ 並行作業効率化
□ バッファ時間確保

品質リスク:
□ 採点精度要件達成
□ ユーザビリティ基準
□ セキュリティ・プライバシー
□ 長期保守性確保
```

---

**この詳細タスクリストにより、4週間での統一採点システム完全実装を確実に達成し、3モードで一貫した高品質な相対音感トレーニング体験を提供します。**

**作成日**: 2025-07-28  
**実装期間**: 4週間（2025-07-29 ～ 2025-08-25）  
**品質基準**: 高精度・高パフォーマンス・高ユーザビリティ  
**成功指標**: 技術・品質・体験の3要素完全達成