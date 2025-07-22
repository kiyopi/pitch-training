# TODO.md - プロジェクトタスク管理（クラッシュ対策用）

**作成日**: 2025-07-22  
**目的**: VSCodeクラッシュ対策・作業継続性確保  
**更新**: セッション毎に手動更新

---

## 🔄 現在進行中（CLAUDE.md承認プロセス）

### **デバッグ機能実装承認待ち:**
- [x] CLAUDE.md完全確認・実装前承認プロセス遵守 (high) - **完了**
- [x] WORK_LOG.md現在状況確認 (high) - **完了**  
- [x] ブランチ仕様書で対象ファイル特定 (high) - **進行中**
- [x] SIMPLE_PITCH_TRAINING_DESIGN_PRINCIPLES.md確認 (high) - **ファイル不存在確認済み**
- [x] ERROR_DIALOG_SPECIFICATION.md確認 (high) - **ファイル不存在確認済み**
- [x] COMPREHENSIVE_REQUIREMENTS_SPECIFICATION.md確認 (high) - **部分確認済み**
- [ ] 関連技術仕様書照合 (high)
- [ ] **ユーザー対象ファイル明示確認 (high) - 🚨 現在停止中・承認待ち**
- [ ] 全関連仕様書リスト表示 (high)
- [ ] 各仕様書確認ログ出力 (high)
- [ ] デバッグ機能詳細技術仕様書作成 (high)
- [ ] 具体的修正案ユーザー提示 (high)
- [ ] ユーザー実装開始明示承認取得 (high)

### **実装フェーズ（承認後実行）:**
- [ ] WORK_LOG.md作業開始記録 (high)
- [ ] 使い捨てブランチ作成（必要時） (medium)
- [ ] 設計原則適合確認 (high)
- [ ] GitHub Pages確認フロー (medium)
- [ ] WORK_LOG.md完了記録 (medium)

---

## ✅ 完了済み実装

### **🎵 倍音補正システム関連（実装完了）:**
- [x] iPhone音量問題の根本原因を詳細調査 (high)
- [x] iPhone音量問題調査結果仕様書作成 (high)
- [x] ユーザーフローに基づく対策案の検討 (high)
- [x] Step A: 基盤システム改修（AudioSystemPhase + 完全停止関数 + iPhone最適化） (high)
- [x] 倍音問題調査結果をSTEP4_PITCHY_INTEGRATION_SPECIFICATION.mdに追記 (high)
- [x] 倍音問題要件をCOMPREHENSIVE_REQUIREMENTS_SPECIFICATION.mdに追記 (medium)
- [x] Step B-1: フェーズ移行制御システム実装 (high)
- [x] Step B-0: マイク可用性チェックシステム実装（12種エラーケース対応） (high)
- [x] Step B-0: マイク可用性チェック仕様書作成（フロー図含む） (high)
- [x] Step B-1.5: フェーズシステムマイク対応統合 (high)
- [x] Step B-2': 基音再生専用フェーズ + マイク不在モード実装（複雑版・保持） (high)
- [x] 段階1: 新ファイル基盤環境作成（/src/app/test/harmonic-correction/） (high)
- [x] 段階2: ユーザー歌唱倍音補正実装（STEP4仕槕書2.1章） (high)
- [x] Step 1.1: インターフェース・設定定義 (high)
- [x] Step 1.2: ヘルパー関数実装 (high)
- [x] Step 2.1: correctHarmonicFrequency関数実装 (high)
- [x] Step 2.2: detectFrequency関数改修 (high)
- [x] Step 3.1: state管理統合 (medium)
- [x] Step 3.2: iPhone最適化 (medium)
- [x] Step 4.1: GitHub Pagesデプロイ・動作確認 (medium)

### **🔒 ロールバック・復旧関連（完了）:**
- [x] Step1: ロールバック対象コミット特定 (high)
- [x] Step2: 新規追加ファイル確認 (high)
- [x] Step3: 仕様書変更内容詳細確認 (high)
- [x] Step4: 仕様書関連コミット履歴確認 (high)
- [x] Step5: 重要仕様書個別確認 (high)
- [x] Step6: 保護対象仕様書バックアップ作成 (high)
- [x] ステップR1: ロールバックコミットにチェックアウト (high)
- [x] ステップR2: 新ブランチ作成 (high)
- [x] ステップR3: 重要仕様書再適用 (high)
- [x] ステップR4: シンプル状態動作確認 (high)
- [x] デプロイ失敗原因調査・修正 (high)
- [x] 環境保護ルール問題解決 (high)
- [x] 倍音補正システム詳細仕様書作成 (high)

---

## 🚨 ロールバック済み実装（違反処理）

### **デバッグ機能関連（CLAUDE.md違反のためロールバック済み）:**
- [x] デバッグ機能安全分離設計 (high) - **ロールバック済み**
- [x] 環境変数制御システム実装 (high) - **ロールバック済み**
- [x] HarmonicDebugPanelコンポーネント作成 (high) - **ロールバック済み**
- [x] 条件分岐デバッグUI統合 (high) - **ロールバック済み**
- [x] ビルド時除外設定実装 (medium) - **ロールバック済み**
- [x] ビルド後デバッグコード除去確認 (medium) - **ロールバック済み**

**ロールバック理由**: CLAUDE.md実装前承認プロセス（17項目）を無視して実装したため

---

## ⏳ 待機中・今後の実装予定

### **後続実装予定:**
- [ ] **Step B-3: 採点処理専用フェーズ実装** (medium) - **待機中**
- [ ] **Step B-4: 統合テスト・iPhone音量問題確認** (medium) - **待機中**

### **デバッグ機能実装（正しいプロセス）:**
- [ ] 関連技術仕様書照合完了
- [ ] デバッグ機能詳細技術仕様書作成
- [ ] ユーザー実装承認取得
- [ ] CLAUDE.md準拠の正しい実装実行

---

## 🎯 現在の状況サマリー

### **停止中の項目:**
**Step 8: ユーザー対象ファイル明示確認** - **承認待ち**

**提示済み修正対象ファイル:**
1. `/src/components/debug/HarmonicDebugPanel.tsx` (新規作成)
2. `/src/app/test/separated-audio/page.tsx` (デバッグUI統合)
3. `.env.local` (環境変数制御)
4. `next.config.ts` (ビルド時除外設定)

### **実装済み・稼働中:**
- ✅ **倍音補正システム**: Step 1.1-4.1 完全実装済み
- ✅ **GitHub Pages**: https://kiyopi.github.io/pitch-training/test/separated-audio/
- ✅ **コミット**: `e7ea510` - 倍音補正システム実装完了報告書作成

### **次回セッション継続ポイント:**
1. ユーザーからデバッグ機能実装承認取得
2. CLAUDE.md承認プロセス完了（Step 9-18）
3. Step B-3, B-4の後続実装検討

---

## 🛡️ クラッシュ復旧用重要情報

### **安定復帰ポイント:**
- **安定版コミット**: `e7ea510` (倍音補正システム実装完了)
- **ブランチ**: `pitch-training-nextjs-v2-impl-001`
- **対象ファイル**: `/src/app/test/separated-audio/page.tsx`

### **緊急時コマンド:**
```bash
# 安全復帰
git checkout e7ea510

# 現在ブランチ確認  
git branch --show-current

# 状況確認
git log --oneline -3
```

### **クラッシュ発生時の対応:**
1. このTODO.mdファイルを確認
2. WORK_LOG.mdで詳細状況確認
3. 安定版コミット `e7ea510` に復帰
4. CLAUDE.md実装前承認プロセスを最初から実行

---

**最終更新**: 2025-07-22（セッション継続中）  
**次回更新**: セッション完了時またはクラッシュ復旧時