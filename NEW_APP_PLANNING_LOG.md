# 新アプリ計画作業ログ

**作成日**: 2025-08-07  
**作業内容**: Vanilla TypeScript新アプリの企画・設計フェーズ

---

## 🎯 作業概要

### **背景・目的**
- 既存のSvelteKit音感トレーニングアプリの優秀な技術を活用
- Next.js・SvelteKitでの複雑さを回避し、Vanilla TypeScriptで新アプリ構築
- 収益化を後回しにして最高のユーザー体験に集中

### **新リポジトリ**: `/Users/isao/Documents/Relative-pitch-app`
- **技術スタック**: Vanilla TypeScript + Vite
- **開発方針**: Pure App Development（収益化なし）
- **移植戦略**: 既存優秀機能の効率的活用

---

## 📋 完成した設計文書

### 1. **CLAUDE.md** - 新リポジトリ開発ガイドライン
- 基本方針：Vanilla TypeScript + Vite確定
- 技術スタック：Web Audio API + Pitchy + Tone.js
- プロジェクト概要：相対音感トレーニングアプリ

### 2. **APP_SPECIFICATION.md** - アプリケーション仕様書（v1.3.0）
- 画面遷移：ホーム → マイクテスト → トレーニング
- 3つのモード：ランダム・連続・12音階
- SNS共有機能：Twitter/X、Facebook、LINE、Instagram

### 3. **REQUIREMENTS_SPECIFICATION.md** - 要件定義書（v1.0.0）
- システム要件・機能要件・非機能要件
- UI/UX要件・技術要件・制約事項
- 将来拡張計画・受入基準

### 4. **TECHNICAL_SPECIFICATIONS.md** - 技術仕様書（v1.0.0）
- Pitchy v4音程検出技術
- 3段階ノイズフィルタリング
- 動的倍音補正システム
- データ永続化・SNS共有仕様

### 5. **RELEASE_AND_MONETIZATION_PLAN.md** - リリース計画・収益化戦略書（v1.0.0）
- 4段階リリース戦略（MVP → PWA → 収益化 → 最適化）
- フリーミアム＋広告収益モデル
- 12ヶ月後収益予測：¥269,000/月

### 6. **PURE_APP_DEVELOPMENT_SPECIFICATION.md** - Pure App開発仕様
- 収益化機能一切なし完全機能版
- 最高ユーザー体験に集中
- バイラル成長重視のSNS共有強化
- 5週間完成計画

### 7. **EXISTING_FEATURES_INVENTORY.md** - 既存機能インベントリ
- SvelteKit既存機能の完成度・実用性・移植価値評価
- S級必須移植～C級参考のみまで分類
- Phase別移植戦略（4段階・5週間計画）

---

## 🎵 既存アプリの優秀な資産評価

### **S級：必須移植（そのまま使える）**
1. **Pitchy音程検出**: 5セント精度の実証済みアルゴリズム
2. **AudioManager**: 複数AudioContext問題の根本解決
3. **基音再生システム**: Tone.js + Salamander Piano統合
4. **SessionStorage設計**: 実用的なデータ構造

### **A級：高価値移植（アルゴリズム活用）**
1. **動的倍音補正**: オクターブ補正システム
2. **音域選択システム**: 4種類×8基音、重複回避
3. **EvaluationEngine**: S-E級統合評価
4. **shadcn/ui CSS**: デザインシステム

### **B級：要再設計（ロジック参考）**
1. **TrainingCore**: 3モード統合基盤（UI部分要再設計）
2. **統合採点表示**: デザインパターン参考
3. **PitchDetectionDisplay**: リアルタイム表示パターン

### **C級：不要・参考のみ**
1. **VolumeBar DOM操作**: フレームワーク制約回避（Vanilla TSでは不要）
2. **Svelte リアクティビティ**: フレームワーク依存機能

---

## 🚀 次のステップ

### **immediate Next Actions**
1. **Vanilla TypeScript移植計画書**作成
   - 具体的な移植手順とコード変換方法
   - UI Components設計（Web Components vs TypeScript Class）
   - パフォーマンス最適化戦略

2. **プロジェクトセットアップ**
   - Vite + TypeScript環境構築
   - フォルダ構成設計
   - 基本的なビルド・デプロイ設定

3. **Phase 1実装開始**
   - Core Algorithm移植（Pitchy、AudioManager等）
   - 音響処理基盤構築
   - 基本的なUI骨格

### **Timeline Estimation**
- **設計完了**: +1週間（移植計画書完成）
- **Phase 1-2**: +2週間（コア機能移植）
- **Phase 3**: +1-2週間（UI再設計）
- **Phase 4**: +1週間（統合・最適化）
- **Total**: 約5-6週間で高品質な新アプリ完成

---

## 💡 重要な決定・学習

### **技術選択の合理性**
- **Vanilla TypeScript**: フレームワークの複雑さ回避、保守性向上
- **収益化後回し**: ユーザー体験最優先、成長基盤構築
- **既存資産活用**: 実証済み技術の効率的移植

### **既存アプリから学んだこと**
- **音響処理技術**: 5セント精度達成の実証
- **デバイス対応**: iPhone WebKit等の実機対応知見
- **UI/UX設計**: フレームワーク制約と最適解の発見

### **新アプリの競争優位性**
- **技術的優位**: 実証済み高精度音程検出
- **体験優位**: 制限なし・広告なしの完全機能
- **成長戦略**: バイラルSNS共有による自然拡散

---

**この作業ログは、既存の優秀な技術資産を最大活用し、シンプルで高品質な新アプリを構築するための完全な設計基盤を記録しています。**

**作成日**: 2025-08-07  
**ステータス**: 設計フェーズ完了、実装準備完了  
**次回作業**: Vanilla TypeScript移植計画書作成