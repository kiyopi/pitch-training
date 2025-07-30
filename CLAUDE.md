# CLAUDE.md - 作業ルール・ガイドライン

## ✅✅✅ SvelteKit本格開発移行決定 ✅✅✅

### **✅ SvelteKit本格開発移行決定（2025-07-26）**
**Next.js/Reactの制約により、SvelteKitへの完全移行を決定**

#### **移行決定の理由**
1. **実装の容易さ**: SvelteKitでの開発がNext.jsよりもはるかに実装しやすい
2. **音響処理最適化**: DOM直接操作がSvelteで自然に実装可能
3. **パフォーマンス優位**: リアルタイム音声処理での性能向上
4. **shadcn/ui問題解決**: CSS-in-JSの制約から解放

#### **移行完了作業**
- ✅ SvelteKitプロトタイプでの技術検証完了
- ✅ Tone.js + Salamander Grand Piano統合成功
- ✅ GitHub Pages デプロイ環境構築完了
- ✅ 音響処理パフォーマンス検証完了

#### **現在の開発方針**: 
**SvelteKit本格開発に完全移行**
Next.js関連の開発は終了し、SvelteKitでの機能実装を推進

### **SvelteKit開発 - 必須確認文書**
1. **WORK_LOG_UPDATE.md** - 最新のSvelteKit開発状況
2. **RANDOM_TRAINING_UNIFIED_SPECIFICATION.md** - ランダムトレーニング仕様
3. **TRAINING_MODES_COMMON_SPECIFICATION.md** - 3モード共通設計
4. **PITCHY_SPECS.md** - 音程検出技術仕様

---

## 🎵 プロジェクト概要

### 🚨 **開発環境認識 - 最重要確認事項**

#### **現在の開発環境（絶対確認）**
**GitHubリポジトリ**: `https://github.com/kiyopi/pitch-training.git`  
**GitHub Pages URL**: `https://kiyopi.github.io/pitch-training/`  
**現在のブランチ**: `random-training-tonejs-fixed-001`
**開発技術**: **SvelteKit + TypeScript + Tone.js**
**作業ディレクトリ**: `/Users/isao/Documents/pitch-training` 

⚠️ **重要**: URLは必ず `pitch-training` リポジトリを使用すること

#### **🚨 環境認識エラー防止ルール**
1. **SvelteKit完全移行**: Next.js関連の開発は完全終了
2. **実際の開発は SvelteKit**: 新規ページ作成は `/svelte-prototype/src/routes/` 以下
3. **デプロイはGitHub Actions**: 必ず `npm run build` + GitHub Pages (SvelteKit)
4. **テスト確認は2段階**: GitHub Pages + ローカル開発サーバー
5. **Next.js手法禁止**: Next.js関連の実装は一切禁止

#### **必須確認プロトコル**
```
仕様書確認時に必ず宣言:
"SvelteKit本格開発に完全移行済みです。実際の開発は SvelteKit で実行します。"
"新規作成は /svelte-prototype/src/routes/ 以下に作成し、GitHub Actions でデプロイします。"
```

### アプリケーションの目的
**相対音感トレーニングアプリ**
- **目標**: ユーザーの相対音感（音程の相対的な関係を聞き分ける能力）を効果的に鍛える
- **v3.0.0 フロー**: ホームページ → マイクテストページ → トレーニングページ
- **対象音階**: ドレミファソラシド（8音階）の相対音程
- **技術**: Web Audio API + Pitchy（McLeod Pitch Method）による高精度音程検出

### v3.0.0 マイクテスト経由フロー実装
1. **ホームページ** (`/`): shadcn/ui + 3モード選択
2. **マイクテストページ** (`/microphone-test`): **トレーニング準備最適化**
   - **マイク許可・リアルタイム周波数表示**
   - **音量・周波数感覚の事前習得**: ユーザーがトレーニング本番でスムーズに音程検出できるよう、適切な発声レベルを確認
   - **個人音域測定**: 12音モード用の最適開始キー決定（将来実装予定）
   - **モード別準備**: 連続モードでは感覚習得後に1フェーズ目を実行可能
   - ユーザー手動操作で各モードへ遷移
3. **トレーニングページ**: マイク初期化済みで音感練習に集中
   - `/training/random`: ランダム基音モード
   - `/training/continuous`: 連続チャレンジモード  
   - `/training/chromatic`: 12音階モード

### 🎤 **マイクテストページの設計思想（重要）**
**マイクテストは単なる許可取得ではなく、トレーニング成功のための重要な準備段階**

#### **目的と効果**
1. **音量・周波数感覚習得**: どれくらいの声の大きさでどれくらいの周波数が検出されるかを事前確認
2. **トレーニング成功率向上**: 本番でのスムーズな音程検出を実現
3. **個人最適化**: ユーザーの音域に合わせた設定（12音モード用）

#### **モード別の重要性**
- **ランダムモード**: 基本的な発声確認・音程検出システムとの相性確認
- **連続モード**: **特に重要** - この感覚をもって最初の1フェーズに臨める
- **12音モード**: 個人音域測定により最適な開始キーを決定（将来機能）

#### **ダイレクトアクセス時の対応方針**
- **推奨**: マイクテストページへの誘導（パターンA）
- **非推奨**: 直接マイク許可（パターンB）- 緊急避難的選択肢のみ
- **理由**: 準備不足によるトレーニング失敗率の増加を防止

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

## 🎉 SvelteKit開発成功事例（2025-07-26）

### **shadcn/ui CSS専用実装成功**

#### **問題**: 
- Next.jsではshadcn/uiが本番環境で動作不良
- Reactコンポーネントと音響処理の相性問題

#### **解決**: 
```svelte
<!-- CSS専用shadcn/ui風デザイン -->
<style>
  :global(.main-card) {
    border: 1px solid hsl(214.3 31.8% 91.4%) !important;
    background: hsl(0 0% 100%) !important;
    border-radius: 8px !important;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1) !important;
  }
</style>
```

#### **成果**:
- 既存コンポーネントとの競合回避
- チューニング済みVolumeBarの保護
- shadcn/uiのデザイン品質維持

### **コンポーネントclass propサポート**

```svelte
<script>
  // class propの適切な実装
  let className = '';
  export { className as class };
</script>

<div class="card {className}">
  <slot />
</div>
```

### **サイドバイサイドレイアウト成功**

```svelte
<div class="side-by-side-container">
  <Card class="main-card half-width">[基音再生]</Card>
  <Card class="main-card half-width">[リアルタイム検出]</Card>
</div>

<style>
  @media (max-width: 768px) {
    .side-by-side-container {
      flex-direction: column;
    }
  }
</style>
```

### **SvelteKit開発の利点**
- ✅ DOM直接操作が自然に実装可能
- ✅ 音響処理との親和性が高い
- ✅ shadcn/uiデザインをCSSで実現可能
- ✅ パフォーマンス優位

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
18. **アーキテクチャ一貫性確認**: 既存コンポーネント活用可能性を最優先で確認
19. **設計思想遵守**: AudioManager等の統一管理原則に従う実装
20. **重複実装禁止**: 同一機能の分散実装を避け、コンポーネント再利用を徹底

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

### **確認パス（必須）**
**ローカル確認**: `http://localhost:5173/[ページパス]`  
**GitHub Pages確認**: `https://kiyopi.github.io/pitch-training/[ページパス]`

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
- ✅ 確認パス（ローカル・GitHub Pages）の必須記載

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

## 🚨 設計思想・アーキテクチャ原則（最重要）

### **⚠️ 設計一貫性確保ルール（2025-07-27追加）**

#### **問題**: 場当たり的修正による設計破綻
**根本原因**: 表面的な問題解決に飛びつき、全体アーキテクチャを無視

#### **必須思考プロセス**
**問題発生時に必ず以下を確認:**
1. **既存コンポーネントの活用可能性** - 新規実装前に既存資産を確認
2. **アーキテクチャ設計思想との整合性** - AudioManager等の統一管理原則に従う
3. **将来の拡張計画との整合性** - コンポーネント化予定等を考慮
4. **コード重複の回避** - 同一機能の分散実装を禁止

#### **禁止パターン**
❌ **場当たり的修正**: 表面的な問題に個別対応  
❌ **重複実装**: 既存コンポーネントがあるのに独自実装  
❌ **設計無視**: アーキテクチャ原則を無視した修正  
❌ **短絡思考**: 「動けばよい」の一時的解決  

#### **推奨パターン**
✅ **全体設計確認**: まず既存アーキテクチャを把握  
✅ **コンポーネント活用**: 既存資産の最大活用  
✅ **統一管理**: AudioManager等の設計思想に従う  
✅ **将来性考慮**: 拡張計画を踏まえた実装  

#### **事例: 音声検出問題の正しいアプローチ**
**誤**: マイクテストページの独自音声解析ロジックを修正  
**正**: 既存PitchDetectorコンポーネントをマイクテストページでも使用

---

### 📋 作業記録

### 2025-07-30 **ダイレクトアクセス問題根本解決完了 - UX設計による技術的問題解決**

#### **🎯 問題分析フェーズ**
- **問題発生**: ユーザーから「まだリダイレクト画面でセッション 1/8が表示されている」「リダイレクト画面からマイク許可ボタンが削除されている」報告
- **根本原因発見**: 技術的バグではなくUX設計の問題 - 複雑な2パターン分岐による混乱
- **設計思想確認**: MICROPHONE_TEST_DESIGN_SPECIFICATION.md作成、マイクテストの価値を明確化

#### **🔄 戦略転換: 技術修正→UX再設計**
- **従来アプローチ**: localStorage競合・リロード処理等の技術的修正を繰り返し
- **新アプローチ**: パターンB（直接マイク許可）完全削除による設計簡素化
- **設計文書作成**: DIRECT_ACCESS_FIX_SPECIFICATION.md - 完全な実装仕様書

#### **🛠️ 実装フェーズ詳細**

**Step 1: UI完全再設計**
```svelte
<!-- 修正前: 2パターン分岐UI -->
<div class="action-buttons">
  <Button on:click={goToMicrophoneTest}>マイクテストページへ移動</Button>
  <Button on:click={checkMicrophonePermission}>直接マイク許可を取得</Button>  ← 削除対象
  <Button on:click={goHome}>ホームに戻る</Button>
</div>

<!-- 修正後: 単一誘導UI -->
<div class="preparation-benefits">
  <h4>📚 マイクテストでは以下を行います：</h4>
  <ul>
    <li>✓ 音量・周波数感覚の習得</li>
    <li>✓ 音程検出システムとの相性確認</li>  
    <li>✓ トレーニング成功率の向上</li>
  </ul>
</div>
<div class="preparation-actions">
  <Button size="lg" on:click={goToMicrophoneTest}>📚 マイクテストページで準備完了</Button>
  <Button variant="outline" on:click={goHome}>ホームに戻る</Button>
</div>
```

**Step 2: JavaScript関数完全削除**
- `checkMicrophonePermission()` 関数削除（36行のコード削除）
- 全呼び出し箇所（6箇所）をエラーログまたは削除に変更
- `checkExistingMicrophonePermission()` 簡素化（パターンB削除により常に準備画面表示）

**Step 3: CSS実装（shadcn/ui風デザイン）**
```css
.preparation-card { max-width: 600px; margin: 2rem auto; }
.preparation-benefits {
  background: #f0f9ff; border: 1px solid #0ea5e9;
  border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0;
}
.preparation-benefits h4 { color: #0369a1; }
.preparation-benefits li { color: #1e40af; }
```

**Step 4: マイクテストページ修正**
```javascript
// startTraining() 関数に追加
localStorage.setItem('mic-test-completed', 'true');
console.log('🔒 [MicTest] マイクテスト完了フラグ設定完了');
```

#### **📊 技術的成果**
- **コード削除**: 36行の複雑な許可取得ロジック削除
- **関数呼び出し削除**: 6箇所のcheckMicrophonePermission()呼び出し削除  
- **状態管理簡素化**: localStorage競合・リロード処理問題を根本解決
- **エラーハンドリング削除**: 複雑な分岐処理を排除

#### **🎨 UX成果** 
- **選択肢単純化**: 2パターン→1パターン（マイクテストページ必須経由）
- **価値提案明確化**: マイクテストの意義を具体的に説明（3つの利点明記）
- **混乱要因排除**: 「直接許可」選択肢削除により判断迷いを解消
- **デザイン向上**: preparation-benefits カードで視覚的に価値を伝達

#### **⚙️ 品質保証**
- **ビルド確認**: `npm run build` 成功（警告のみ、エラーなし）
- **Git管理**: rollback-clean-base-v001 ブランチでの安全な作業
- **GitHub Actions**: 自動デプロイ実行中
- **コミット内容**: 92ファイル変更、1722行追加、3360行削除

#### **🎯 期待効果**
1. **技術的安定性**: localStorage競合・リロード問題の完全解決
2. **UX向上**: 100%のユーザーがマイクテストで準備完了
3. **設計思想実現**: マイクテスト価値最大化・トレーニング成功率向上
4. **保守性向上**: 複雑な分岐ロジック削除によるコード品質向上

#### **📝 重要な学習**
- **問題解決アプローチ**: 技術的修正より設計思想の見直しが効果的
- **UX設計の重要性**: 選択肢が多いことが必ずしも良いUXではない
- **仕様書の価値**: 詳細な実装仕様により迷いなく実装可能
- **段階的修正の効果**: 小さな修正の積み重ねより根本設計変更が確実

### 2025-07-29 **統合採点システムクリーンアップ完了**
- **重要成果**: UI混乱要因の完全除去による統合採点システムの明確化
- **セッション結果表示修正**: RandomModeScoreResultのprop使用を修正、各音程の詳細結果・外れ値検出が正常表示
- **大規模クリーンアップ実施**: 「従来の採点詳細を見る」トグル、音程別進捗・一貫性グラフ・セッション統計タブ、5側面評価・フィードバック表示を削除
- **UI設計の最適化**: 🚀 v1.0統合採点結果（テスト表示）のみを残し、シンプルで分かりやすいインターフェースを実現
- **技術的改善**: UnifiedScoreResultFixedコンポーネントの正しい使用方法を確立、テストデータ構造の改善
- **重要な学習**: 複数の採点表示が混在することでユーザーの混乱を招くことを実体験、統合UIの重要性を確認

### 2025-07-27 **AudioManager実装とアーキテクチャ改善**
- **重要成果**: 複数AudioContext問題の根本解決
- **AudioManager実装**: グローバル音声リソース管理システム
- **アーキテクチャ統一**: PitchDetector外部AudioContext対応
- **重要な学習**: 場当たり的修正の危険性と設計一貫性の重要性
- **改善点**: 問題発生時にまず全体アーキテクチャを確認する習慣

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

### 現在の状況（2025-07-30更新）
- **安定版**: 1e44e2e (v1.2.0 OutlierPenalty-Enhanced) → rollback-clean-base-v001での作業継続
- **現在のブランチ**: rollback-clean-base-v001 (ダイレクトアクセス問題修正)
- **開発環境**: SvelteKit本格開発（/svelte-prototype → メイン開発）
- **対象ファイル**: /src/routes/training/random/+page.svelte, /src/routes/microphone-test/+page.svelte
- **技術スタック**: SvelteKit + Tone.js + Salamander Grand Piano
- **デプロイ状況**: GitHub Pages (https://kiyopi.github.io/pitch-training/training/random)
- **開発ステータス**: ✅ ダイレクトアクセス問題根本解決完了、パターンB削除による設計簡素化
- **直近のコミット**: 06df385 - 完全実装: ダイレクトアクセス問題修正 - パターンB削除・単一誘導フロー
- **作業完了**: UX設計による技術的問題解決、localStorage競合問題根本解決

---

**このファイルは安全で効率的な開発のための重要なガイドラインです。**
**使い捨てブランチ運用により、ロールバック時の強制プッシュ問題を根本解決します。**