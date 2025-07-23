# CLAUDE.md - 作業ルール・ガイドライン

## 🎵 プロジェクト概要

### 🚨 **開発環境認識 - 最重要確認事項**

#### **現在の開発環境（絶対確認）**
**GitHubリポジトリ**: `https://github.com/kiyopi/pitch-training.git`  
**GitHub Pages URL**: `https://kiyopi.github.io/pitch-training/`  
**現在のブランチ**: `pitch-training-nextjs-v2-impl-001`
**開発技術**: **Next.js 15.4.1 + TypeScript + React**
**作業ディレクトリ**: `/Users/isao/Documents/pitch_app` 

⚠️ **重要**: URLは必ず `pitch-training` リポジトリを使用すること

#### **🚨 環境認識エラー防止ルール**
1. **仕様書は古いプロトタイプ時代のもの**: 参考情報として活用のみ
2. **実際の開発は Next.js**: 新規ページ作成は `/src/app/` 以下
3. **デプロイはGitHub Actions**: 必ず `npm run build` + GitHub Pages
4. **テスト確認は2段階**: GitHub Pages + ローカル開発サーバー
5. **プロトタイプ手法禁止**: HTML直接作成・手動デプロイは一切禁止

#### **必須確認プロトコル**
```
仕様書確認時に必ず宣言:
"この仕様書は参考情報です。実際の開発は Next.js で実行します。"
"新規作成は /src/app/ 以下に作成し、GitHub Actions でデプロイします。"
```

### アプリケーションの目的
**相対音感トレーニングアプリ**
- **目標**: ユーザーの相対音感（音程の相対的な関係を聞き分ける能力）を効果的に鍛える
- **v3.0.0 フロー**: ホームページ → マイクテストページ → トレーニングページ
- **対象音階**: ドレミファソラシド（8音階）の相対音程
- **技術**: Web Audio API + Pitchy（McLeod Pitch Method）による高精度音程検出

### v3.0.0 マイクテスト経由フロー実装
1. **ホームページ** (`/`): shadcn/ui + 3モード選択
2. **マイクテストページ** (`/microphone-test`): マイク信頼性確保
   - マイク許可・リアルタイム周波数表示
   - ド発声確認・段階的ボタンアクティブ化
   - ユーザー手動操作で各モードへ遷移
3. **トレーニングページ**: マイク初期化済みで音感練習に集中
   - `/training/random`: ランダム基音モード
   - `/training/continuous`: 連続チャレンジモード  
   - `/training/chromatic`: 12音階モード

### 技術的特徴
- **高精度音程検出**: Pitchy ライブラリによる McLeod Pitch Method 実装
- **動的オクターブ補正**: 倍音誤検出の自動回避システム
- **3段階ノイズリダクション**: ハイパス・ローパス・ノッチフィルター
- **ランダム基音システム**: 10種類の基音からランダム選択
- **リアルタイム可視化**: 周波数・音量・進行状況の即座表示

### 🎹 基音再生仕様（最重要）
**⚠️ 必須**: 基音は**Tone.Sampler + Salamander Grand Piano**を使用すること
- **禁止**: Synth、PolySynth等の合成音源
- **理由**: ピアノ音源での相対音感トレーニングが本アプリの核心
- **参照実装**: `/src/app/test/accuracy-test-v2/page.tsx`
```typescript
// 正しい実装例
const sampler = new Tone.Sampler({
  urls: { "C4": "C4.mp3" },
  baseUrl: "https://tonejs.github.io/audio/salamander/",
  release: 1.5
}).toDestination();
```

### 🚨 **Next.js開発重要注意事項: iPhoneレンダリング問題**

#### **問題の概要**
**Next.js + iPhone WebKit環境でのCSSとJavaScriptスタイル競合問題**
- **症状**: 動的スタイル変更が正しく反映されない
- **影響**: 音量バー、プログレスバー等の動的UI要素
- **プラットフォーム**: iPhone Safariでのみ発生（PC Chromiumは正常）

#### **禁止パターン**
```typescript
// ❌ 絶対禁止: CSSとJavaScriptの混在
<div 
  ref={elementRef}
  className="h-3 rounded-full"  // CSSクラス
  style={{ width: '0%' }}      // 初期スタイル
/>

// JavaScriptで動的変更
elementRef.current.style.width = `${value}%`;  // 競合発生
```

#### **正しい実装パターン**
```typescript
// ✅ 推奨: 完全JavaScript制御
<div 
  ref={elementRef}
  className="transition-all duration-100"  // アニメーションのみ
  // style属性は一切設定しない
/>

// 初期化時に全スタイルをJavaScriptで設定
if (elementRef.current) {
  elementRef.current.style.width = '0%';
  elementRef.current.style.backgroundColor = '#10b981';
  elementRef.current.style.height = '12px';
  elementRef.current.style.borderRadius = '9999px';
}

// 動的更新も同じ方式で統一
elementRef.current.style.width = `${value}%`;
```

#### **必須ルール**
1. **統一制御**: CSS `className` と JavaScript `style` を混在させない
2. **完全初期化**: コンポーネントマウント時に全スタイル設定
3. **WebKit対応**: 初期`style`属性をHTMLで設定しない
4. **一貫性**: 全ての動的スタイル変更を同じ方式で実装

#### **対象コンポーネント**
- 音量バー、プログレスバー
- 動的幅変更が必要な要素
- リアルタイム更新UI要素

#### **デバッグ方法**
- iPhone Safariでの実機テスト必須
- Chrome DevToolsのiPhoneエミュレーターでは再現されない
- コンソールでのスタイル値確認: `console.log(elementRef.current.style.width)`

---

## 🎯 使い捨てブランチ運用（スマートロールバック対応）

### 基本概念

**問題**: 従来のブランチ運用では、ローカルロールバック後のリモート同期で強制プッシュが必要
**解決**: 使い捨てブランチ運用でGitHub履歴をクリーンに保つ

### 🏷️ 使い捨てブランチ命名規則

```
[機能名]-v[版数]-impl-[番号]
例: microphone-v2-impl-001
    microphone-v2-impl-002  # 失敗時の再実装
    microphone-v2-final     # 成功時の最終版
```

### 🔄 使い捨て運用フロー

#### **新機能開発開始時**
```bash
# 1. 安定版から開始
git checkout 1e44e2e  # 真の安定版 v1.2.0

# 2. 使い捨て作業ブランチ作成
git switch -c microphone-v2-impl-001

# 3. リモートにプッシュ
git push -u origin microphone-v2-impl-001
```

#### **失敗・ロールバック時（スマート対応）**
```bash
# 問題発生時: ブランチ削除して再作成（強制プッシュ不要）
git checkout 1e44e2e
git branch -D microphone-v2-impl-001
git push origin --delete microphone-v2-impl-001

# 新しい番号で再開
git switch -c microphone-v2-impl-002
git push -u origin microphone-v2-impl-002
```

#### **成功時の最終化**
```bash
# 実装成功時: 最終ブランチ作成
git switch -c microphone-v2-final
git push -u origin microphone-v2-final

# 作業ブランチ削除
git branch -D microphone-v2-impl-001
git push origin --delete microphone-v2-impl-001
```

### 🎯 メリット

- ✅ **強制プッシュ不要**: GitHub履歴が常にクリーン
- ✅ **失敗時のリスクゼロ**: ブランチ削除で完全リセット
- ✅ **並行実装可能**: 複数アプローチを同時試行
- ✅ **履歴の明確性**: 成功版のみが残る

## 🔒 安全な作業基準

### 🚨 安定版定義

```bash
# 真の安定版（複雑実装前のクリーン状態）
STABLE_BASE="1e44e2e"  # v1.2.0 OutlierPenalty-Enhanced

# 安全復帰コマンド
alias go-stable="git checkout 1e44e2e"
alias verify-stable="git log --oneline -1 && echo '期待値: 1e44e2e バージョンv1.2.0 OutlierPenalty-Enhancedに更新'"
```

### 🚨 実装前承認（厳守）

1. **作業ログ確認**: `WORK_LOG.md`で現在の作業状況を確認
2. **対象ファイル確認**: ブランチ仕様書で修正対象ファイルを必ず特定
3. **設計原則確認**: `SIMPLE_PITCH_TRAINING_DESIGN_PRINCIPLES.md`を必ず確認
4. **エラーダイアログ仕様確認**: `ERROR_DIALOG_SPECIFICATION.md`を必ず確認
5. **ユーザー対象確認**: 修正対象ファイルをユーザーに明示的に確認
6. **仕様書作成**: 詳細な技術仕様書を作成
7. **ユーザー承認**: 実装開始の明示的承認を取得
8. **作業ログ更新**: 作業開始をWORK_LOG.mdに記録
9. **使い捨てブランチ作成**: 安定版から新ブランチ
10. **GitHub Pages確認**: iPhone確認フロー完了
11. **エラー発生時対応**: 問題発生時は即座に作業停止、ERROR_LOG.mdに記録
12. **推測実行禁止**: 不明な点での推測による実行を絶対禁止
13. **完了時記録**: 作業完了時にWORK_LOG.mdに結果と次回引き継ぎを記録
14. **要件定義書確認義務**: 実装開始前にCOMPREHENSIVE_REQUIREMENTS_SPECIFICATION.mdで要件を確認
15. **技術仕様照合**: 該当する技術仕様書（PITCHY_SPECS.md等）との整合性確認
16. **設計原則適合**: 実装内容が設計原則・制約に準拠することを確認
17. **Direct DOM Audio System**: 音声UI更新はDOM直接操作（旧HYBRID権限システムとは別物）

⚠️ **絶対禁止**: ユーザー承認なしの実装開始
⚠️ **必須参照**: 修正時は必ず設計原則書を参照
⚠️ **エラー処理**: `ERROR_DIALOG_SPECIFICATION.md`の仕様に従う
⚠️ **仕様書確認義務**: ファイル修正前に必ず該当仕様書を読み込み、確認した仕様書名を明記
⚠️ **徹底確認プロセス**: 修正前に全関連仕様書をリスト表示し、各仕様書の確認ログを出力し、修正案提示後にユーザー許可を得てから実行
⚠️ **作業ログ確認義務**: 作業開始前にWORK_LOG.mdで現在状況を確認
⚠️ **対象ファイル確認義務**: ブランチ仕様書で修正対象ファイルを必ず特定
⚠️ **ユーザー確認強化**: 修正対象ファイルをユーザーに明示的に確認
⚠️ **作業ログ更新義務**: 各作業段階でWORK_LOG.mdを即座更新

## 🔄 段階的修正実行ワークフロー（強制）

### 📋 Step完了時の必須プロセス

#### **正しい段階的修正フロー（完全版）**
```
1. 実装完了宣言
2. ビルド確認実行（npm run build）
3. Git操作実行（add → commit → push）
4. GitHub Actions実行確認
5. 📋 詳細確認要求（テンプレート使用）
6. ⏸️ ユーザー確認作業待ち
7. ✅ ユーザーから「問題ない」確認取得
8. 🔄 次の段階に進む確認を表示
```

#### **🚨 各段階の必須実行内容**
```
Step 2: ビルド確認
- `unset NODE_ENV && npm run build` 実行
- エラーがないことを確認

Step 3: Git操作  
- `git add [変更ファイル]` 実行
- `git commit -m "Step X: [修正内容]"` 実行
- `git push origin [ブランチ名]` 実行

Step 4: GitHub Actions確認
- GitHub Actions実行開始の確認
- ビルド成功の確認
- デプロイ完了の確認（可能であれば）
```

#### **📋 Step完了時の必須確認テンプレート**
```
## 📋 Step X 実装内容の確認をお願いします

### **実装した内容**
- [具体的な修正内容を詳細に記載]

### **変更ファイル**  
- [ファイルパス] ([行番号])

### **期待される効果**
- [改善される点を明確に記載]

### **ビルド結果**
✅ 成功 / ❌ 失敗

### **Git操作結果**
- コミット: ✅ 完了 / ❌ 失敗
- プッシュ: ✅ 完了 / ❌ 失敗
- GitHub Actions: ✅ 実行中/成功 / ❌ 失敗

---

## ❓ Step X の確認作業

**Step X の実装内容をご確認ください。**

**問題がある場合**:
- 修正点をお教えください
- Step X を調整いたします

**問題がない場合**:
- 「問題ない」または「承認」とお答えください

**ユーザーから問題ないことを確認いただいた後に、Step Y への進行確認を表示いたします。**
```

#### **🚨 絶対禁止事項**
- ❌ ユーザー確認作業前の次Step提案
- ❌ 一方的な「よろしいですか？」での進行
- ❌ 実装→ビルド→次提案の直接フロー
- ❌ テンプレートを使わない簡易確認
- ❌ Git操作（コミット・プッシュ）の忘れ
- ❌ GitHub Actions確認の省略

#### **✅ 遵守事項**
- ✅ 必ずテンプレートを使用した詳細確認
- ✅ ユーザーからの明示的な「問題ない」確認待ち
- ✅ 承認後のみ次Step進行確認を表示
- ✅ 各Stepで強制停止してユーザー確認
- ✅ Git操作の必須実行（add → commit → push）
- ✅ GitHub Actions実行確認の必須実行

## 🚨 Claude確認強制プロトコル

### 🔴 **環境認識エラー防止プロトコル（最優先）**
**仕様書確認時・新規作成指示時に必ず実行:**

#### 1. 環境認識宣言（必須）
```
"確認: この仕様書は参考情報です。実際の開発は Next.js で実行します。"
"新規作成は /src/app/ 以下に作成し、GitHub Actions でデプロイします。"
"プロトタイプ手法（HTML直接作成・手動デプロイ）は一切使用しません。"
```

#### 2. 技術スタック確認
- **開発**: Next.js 15.4.1 + TypeScript + React
- **デプロイ**: GitHub Actions → GitHub Pages
- **テスト**: GitHub Pages + ローカル開発サーバー
- **禁止**: HTML直接作成、手動デプロイ、プロトタイプ手法

### 必須実行コマンド（例外なし）
**「CLAUDE.mdを確認して」の指示を受けた場合、以下を必ず実行:**

#### 1. 実装前承認項目をすべて読み上げ
```
CLAUDE.mdの実装前承認（厳守）の項目をすべて読み上げます：
[現在の全13項目を一字一句読み上げる]
```

#### 2. 現在状況の照合報告
```
現在の状況をCLAUDE.mdの情報と照合します：
- 現在ブランチ: [git branch --show-current実行結果]
- 対象ファイル: [ブランチ仕様書記載の対象ファイル]
- 作業内容: [ユーザー要求との照合結果]
- 確認済み仕様書: [該当仕様書名一覧]
```

#### 3. ルール遵守宣言
```
以下の手順で作業を進行します：
✅ ユーザーに対象ファイルを明示的に確認
✅ 修正案を提示してユーザー許可を取得
✅ 各段階でWORK_LOG.mdを即座更新
✅ 推測による判断を一切行わない
✅ エラー発生時は即座に作業停止
✅ 完了時に結果と引き継ぎ事項を記録
```

### ⚠️ Claude自己チェック義務
- **推測での実行は絶対禁止**: 不明な点は必ずユーザーに確認
- **確認不十分の場合は作業停止**: 曖昧な状況では実行しない  
- **ユーザー許可なしの実行は違反行為**: 必ず明示的承認を取得
- **エラー発生時は即座記録**: 問題をERROR_LOG.mdに詳細記録
- **完了時の責任**: 作業結果をWORK_LOG.mdに完全記録

### 🔄 強制プロトコル発動タイミング
1. **セッション開始時**: 「CLAUDE.mdを確認して」指示時
2. **作業再開時**: 中断後の再開時
3. **エラー発生後**: 問題解決後の作業再開時
4. **重要判断前**: 不明な点や判断に迷う場合

## 📱 GitHub Pages確認フロー

### ⚠️ 重要: Next.jsプロジェクトでのGitHub Pages確認

#### **事前必須チェック**
```bash
# 1. ローカルビルドテスト（必須）
npm run build
# エラーがないことを確認してからプッシュ

# 2. GitHub Actionsワークフロー設定確認
# .github/workflows/nextjs.yml のトリガーブランチ設定
# branches: ["main", "作業ブランチ名"]
```

### iPhone確認手順

```bash
# 1. 実装完了後プッシュ
git add . && git commit -m "実装完了"
git push origin microphone-v2-impl-001

# 2. Next.jsの場合（重要）
# GitHub → Settings → Pages → Source は「GitHub Actions」を選択
# （「Deploy from a branch」ではない）

# 3. GitHub Actions実行確認
# https://github.com/kiyopi/pitch-training/actions
# 緑のチェックマーク ✅ を確認

# 4. iPhone確認
# https://kiyopi.github.io/pitch-training/
# 右上タイムスタンプで更新確認（📱 HH:MM:SS）
```

### 更新確認デバッグ機能

**タイムスタンプ表示**: 
- index.html, full-scale-training.html の右上に時刻表示
- ページ読み込み時刻でGitHub Pages更新を確認
- iPhoneキャッシュ問題の解決

**8色ループシステム**:
- 修正のたびにタイムスタンプの色を変更（GitHub Pages更新確認用）
- 色順序: 青→緑→オレンジ→紫→赤→シアン→茶→グレー→（ループ）
- 場所: full-scale-training.html 1194行目 `colorIndex` 値
- ⚠️ **重要**: バージョンアップ時は必ずcolorIndexを次の番号に更新

## 🔒 メインブランチ保護

### 🚨 絶対禁止事項
```bash
# ❌ 絶対にやってはいけない
git checkout main && git merge [任意のブランチ]
git push origin main
```

### ✅ 正しいマージ手順
```bash
# 1. プルリクエスト作成
gh pr create --title "マイク許可最適化 v1.3.0"

# 2. ユーザー承認待ち（必須）
echo "⚠️ ユーザー承認なしにマージ禁止"

# 3. 承認後マージ（ユーザー指示後のみ）
```

## 📊 バージョン管理

### バージョンアップ基準
- **パッチ** (v1.2.0 → v1.2.1): バグ修正・微調整
- **マイナー** (v1.2.0 → v1.3.0): 新機能追加
- **メジャー** (v1.2.0 → v2.0.0): 大幅仕様変更

### 必須更新箇所（バージョンアップ時）
1. index.html フッター
2. full-scale-training.html フッター
3. full-scale-training.js constructor
4. about.html（存在する場合）
5. **タイムスタンプ色更新** (full-scale-training.html 1194行目 colorIndex)

---

## 📋 作業ステータス管理システム

### 🔄 作業ステータス更新ルール

#### **必須更新タイミング**
1. **作業開始時**: WORK_LOG.mdに開始記録、対象ファイル明記
2. **重要決定時**: DECISION_LOG.mdに決定内容と根拠を記録
3. **エラー発生時**: ERROR_LOG.mdにエラー内容と対策を即座記録
4. **ファイル修正時**: WORK_LOG.mdに修正ファイルと内容を詳細記録
5. **コミット時**: WORK_LOG.mdにコミットハッシュとメッセージを記録
6. **作業完了時**: WORK_LOG.mdに完了ステータスと次回引き継ぎ事項を記録

#### **記録必須項目**
- **対象ブランチ**: 現在作業中のブランチ名
- **対象ファイル**: 修正予定・修正済みファイル名
- **実行内容**: 具体的な作業内容
- **意思決定**: 判断した理由と根拠
- **発生問題**: エラー・問題とその解決策
- **次回作業**: 未完了項目と引き継ぎ事項

#### **更新頻度**
- **リアルタイム**: エラー発生時、重要決定時
- **作業単位**: ファイル修正、コミット毎
- **セッション単位**: 作業開始時、完了時

### 📋 作業記録

### 2025-07-22 **クリーンホームページ戦略開始**
- **重要決定**: トップページ完全作り直し + Phase 1技術債務解消
- **戦略文書作成**: CLEAN_HOMEPAGE_STRATEGY.md, TECHNICAL_DEBT_ANALYSIS.md
- **新ブランチ作成**: clean-homepage-v1-impl-001 での安全な作業開始
- **クラッシュ対策**: HOMEPAGE_REBUILD_DECISION.md作成（経緯記録）
- **技術債務解消**: Step A2完了 - ESLintエラー80%削減達成
- **重要な学習**: 統合ユーティリティ使用でビルドエラー多発→ローカル実装成功

### 2025-07-16 **Phase 2方針転換完了**
- **重要決定**: 統合システム → ローカル実装への戦略転換成功
- Random Training ページのローカル実装完全成功
- Phase 1技術債務の発見と隔離戦略確立
- ビルドエラー解消、TypeScript型安全性確保

### 2025-07-15 **Phase 1統合システム構築期**
- 使い捨てブランチ運用システム確立
- useAudioEngine, TrainingLayout等の高度統合実装
- 技術債務蓄積の開始（型不整合、依存関係複雑化）

### 現在の状況 (2025-07-22)
- **安定版**: 1e44e2e (v1.2.0 OutlierPenalty-Enhanced)
- **作業ブランチ**: clean-homepage-v1-impl-001 (作業中)
- **対象ファイル**: /src/app/page.tsx (トップページのみ作り直し)
- **次期作業**: Step B1（新トップページ作成）
- **技術債務状況**: Phase 1統合ファイルの段階的解消中（Step A2完了）

---

**このファイルは安全で効率的な開発のための重要なガイドラインです。**
**使い捨てブランチ運用により、ロールバック時の強制プッシュ問題を根本解決します。**