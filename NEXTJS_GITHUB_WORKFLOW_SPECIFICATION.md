# Next.js GitHub運用仕様書 v1.0

## 📋 概要

### プロジェクト情報
- **アプリケーション**: 相対音感トレーニングアプリ
- **技術スタック**: Next.js 15.4.1 + TypeScript + Tailwind CSS
- **デプロイ先**: GitHub Pages
- **リポジトリ**: https://github.com/kiyopi/pitch-training

### 目的
Next.jsプロジェクトでのGitHub運用における安全で効率的な開発ワークフローを定義する。

---

## 🏗️ プロジェクト構成

### ディレクトリ構造
```
pitch-training/
├── .github/workflows/
│   └── nextjs.yml           # GitHub Actions（自動デプロイ）
├── src/app/
│   ├── page.tsx            # トップページ
│   └── training/
│       └── random/
│           └── page.tsx    # ランダム基音モードページ
├── src/hooks/              # Reactフック
├── next.config.ts          # Next.js設定（GitHub Pages対応）
├── package.json            # 依存関係・スクリプト
└── CLAUDE.md              # 開発ガイドライン
```

### 重要設定ファイル

#### next.config.ts
```typescript
const nextConfig: NextConfig = {
  output: 'export',                    // 静的サイト出力
  images: { unoptimized: true },       // 画像最適化無効化
  basePath: process.env.NODE_ENV === 'production' ? '/pitch-training' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/pitch-training' : '',
  trailingSlash: true,
};
```

#### package.json（重要スクリプト）
```json
{
  "scripts": {
    "dev": "next dev --turbopack",           // 開発サーバー
    "build": "next build",                   // 本番ビルド
    "start": "next start",                   // 本番サーバー
    "lint": "next lint",                     // コード品質チェック
    "github-pages": "npm run build && touch out/.nojekyll"
  }
}
```

---

## 🔄 開発ワークフロー

### 1. ブランチ戦略

#### **メインブランチ**
- **`main`**: プロダクション環境（GitHub Pages自動デプロイ対象）
- **絶対保護**: 直接プッシュ禁止、プルリクエスト必須

#### **開発ブランチ命名規則**
```
[機能名]-v[版数]-impl-[番号]
例:
  random-training-v1-impl-001
  microphone-fix-v2-impl-001
  ui-improvement-v1-impl-001
```

### 2. 開発フロー

#### **新機能開発**
```bash
# 1. 最新のmainから開始
git checkout main
git pull origin main

# 2. 機能ブランチ作成
git switch -c random-training-v1-impl-001

# 3. 開発作業
# コード実装...

# 4. ローカル確認
npm run dev                    # 開発環境確認
npm run build                  # 本番ビルド確認

# 5. コミット・プッシュ
git add .
git commit -m "機能実装: ランダム基音モード追加

🤖 Generated with [Claude Code](https://claude.ai/code)
Co-Authored-By: Claude <noreply@anthropic.com>"

git push -u origin random-training-v1-impl-001
```

#### **プルリクエスト作成**
```bash
gh pr create --title "ランダム基音モード実装" --body "$(cat <<'EOF'
## Summary
・Next.jsページコンポーネント実装
・既存Reactフックとの統合
・レスポンシブデザイン対応

## Test plan
- [ ] ローカル開発環境での動作確認完了
- [ ] 本番ビルドエラーなし
- [ ] iPhone Safari対応確認
- [ ] 既存機能への影響なし

🤖 Generated with [Claude Code](https://claude.ai/code)
EOF
)"
```

---

## 🚀 デプロイメント

### GitHub Actions設定

#### **自動デプロイ条件**
- **トリガー**: `main`ブランチへのプッシュ
- **開発ブランチ**: 作業ブランチも追加可能（テスト目的）
- **手動実行**: GitHub UI からworkflow_dispatch
- **デプロイ先**: https://kiyopi.github.io/pitch-training/

#### **ワークフロー概要**
```yaml
# .github/workflows/nextjs.yml
on:
  push:
    branches: ["main", "作業ブランチ名"]  # 作業ブランチも追加可能
  workflow_dispatch:

jobs:
  build:
    - Checkout コード
    - Node.js 20 セットアップ
    - 依存関係インストール
    - Next.js ビルド実行
    - 静的ファイルアップロード
  
  deploy:
    - GitHub Pages デプロイ
```

#### **🚨 重要: 作業ブランチでのテスト手順**
```bash
# 1. 作業ブランチをワークフローに追加
# .github/workflows/nextjs.yml を編集:
# branches: ["main", "pitch-training-nextjs-v2-impl-001"]

# 2. 修正をコミット・プッシュ
git add .github/workflows/nextjs.yml
git commit -m "GitHub Actions: 作業ブランチでのテスト有効化"
git push origin [作業ブランチ名]

# 3. GitHub Actions実行確認
# https://github.com/kiyopi/pitch-training/actions

# 4. デプロイ完了後テスト
# https://kiyopi.github.io/pitch-training/
```

### デプロイ確認方法

#### **1. GitHub Actions状況確認**
```bash
# ブラウザで確認
https://github.com/kiyopi/pitch-training/actions

# CLI確認
gh run list
```

#### **2. デプロイ完了確認**
- **URL**: https://kiyopi.github.io/pitch-training/
- **タイムスタンプ**: 右上の時刻表示で更新確認
- **機能確認**: 全ページの動作テスト

---

## 🔧 ローカル開発環境

### 開発サーバー起動
```bash
# 1. 依存関係インストール
npm install

# 2. 開発サーバー起動
npm run dev
# → http://localhost:3000 でアクセス

# 3. 本番環境シミュレート
npm run build
npx http-server out -p 8080
# → http://localhost:8080 でGitHub Pages環境再現
```

### 事前確認チェックリスト

#### **開発段階**
- [ ] `npm run dev` でローカル動作確認
- [ ] 新機能の動作テスト
- [ ] 既存機能への影響確認
- [ ] コンソールエラーなし

#### **プッシュ前**
- [ ] `npm run build` でビルドエラーなし
- [ ] `npm run lint` でコード品質確認
- [ ] レスポンシブデザイン確認
- [ ] iPhone Safari想定テスト

---

## 🚨 ロールバック戦略

### 1. Git Revert（推奨・安全）

#### **問題発生時の対応**
```bash
# 1. 問題コミット特定
git log --oneline -10

# 2. リバート実行
git revert <commit-hash> -m "緊急ロールバック: [問題内容]"

# 3. プッシュ
git push origin main
# → GitHub Actions自動実行でロールバック完了
```

### 2. プルリクエストリバート

#### **GitHub UI操作**
1. 問題のあるPRページを開く
2. "Revert" ボタンクリック
3. 自動生成されるリバートPRをマージ
4. 自動的にロールバック完了

### 3. 緊急時対応

#### **即座復旧（CLAUDE.md準拠）**
```bash
# 安定版への緊急復帰
git checkout 1e44e2e  # 真の安定版
git switch -c emergency-rollback
git push -u origin emergency-rollback

# 一時的にGitHub Pages設定変更
# Settings → Pages → Source を emergency-rollback に変更
```

---

## 📊 品質管理

### コード品質基準

#### **必須チェック項目**
- [ ] TypeScript型エラーなし
- [ ] ESLint警告解決
- [ ] コンソールエラーなし
- [ ] レスポンシブデザイン対応

#### **パフォーマンス確認**
- [ ] ページ読み込み速度
- [ ] 音声再生レスポンス
- [ ] モバイル動作確認

### テスト項目

#### **基本機能**
- [ ] トップページ表示
- [ ] ナビゲーション動作
- [ ] 各トレーニングモードアクセス

#### **音声機能**
- [ ] マイク許可プロセス
- [ ] ピアノ音源再生
- [ ] 音程検出精度

#### **UI/UX**
- [ ] デザイン一貫性
- [ ] エラーハンドリング
- [ ] ローディング状態

---

## 🔒 セキュリティ・運用規則

### アクセス制限
- **mainブランチ**: プルリクエスト必須
- **機密情報**: 環境変数使用、コミット禁止
- **依存関係**: 定期的な脆弱性チェック

### 緊急時連絡
- **GitHub Issues**: バグ報告・機能要求
- **GitHub Discussions**: 設計相談・質問
- **セキュリティ**: GitHub Security Advisories

---

## 📚 参考資料

### 技術文書
- [Next.js Documentation](https://nextjs.org/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)

### プロジェクト固有
- `CLAUDE.md`: 開発ガイドライン
- `WORK_LOG.md`: 作業履歴
- `ERROR_LOG.md`: エラー記録

---

**この仕様書に従って安全で効率的なNext.js開発を進めてください。**

## 更新履歴
- **v1.0** (2025-07-18): 初版作成
  - 基本ワークフロー定義
  - デプロイメント手順確立
  - ロールバック戦略策定
- **v1.1** (2025-07-18): 作業ブランチでのテスト手順追加
  - GitHub Actions ワークフローでの作業ブランチ追加方法
  - ビルドエラー回避のための事前チェック手順
  - デプロイテストの安全な実行方法