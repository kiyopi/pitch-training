# GitHub Actions 自動デプロイワークフロー仕様書 v1.0

## 📋 概要

### 目的
作業ブランチでの開発→GitHub Actions自動ビルド→GitHub Pages自動デプロイの確実な実行

### 作成日
2025-07-18

### 適用プロジェクト
Next.js 15.4.1 + TypeScript + Tailwind CSS

---

## 🚀 ワークフロー全体図

### 1. 開発フロー
```
ローカル開発 → コミット → プッシュ → GitHub Actions → GitHub Pages
```

### 2. 問題解決の経緯
1. **ローカルサーバー接続問題**: GitHub Pages設定がローカル開発を阻害
2. **GitHub Pages 404エラー**: パスエイリアス問題
3. **GitHub Actions権限エラー**: 権限設定不足
4. **重複ワークフロー**: 2つのワークフローが並行実行

### 3. 最終的な解決策
GitHub Actions自動デプロイによる確実なテスト環境構築

---

## 🔧 GitHub Actions設定

### ワークフローファイル
**場所**: `.github/workflows/deploy.yml`

**内容**:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [pitch-training-nextjs-v2-impl-001]
  pull_request:
    branches: [pitch-training-nextjs-v2-impl-001]

# GitHub Pages用の権限設定
permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      env:
        NODE_ENV: production
        
    - name: Setup Pages
      uses: actions/configure-pages@v5
      
    - name: Upload artifact
      uses: actions/upload-pages-artifact@v3
      with:
        path: ./out
        
    - name: Deploy to GitHub Pages
      id: deployment
      uses: actions/deploy-pages@v4
```

### 重要な設定ポイント

#### 1. 権限設定
```yaml
permissions:
  contents: read    # コードの読み取り
  pages: write      # GitHub Pages書き込み
  id-token: write   # 認証トークン
```

#### 2. 公式推奨アクション使用
- `actions/configure-pages@v5`: GitHub Pages設定
- `actions/upload-pages-artifact@v3`: アーティファクトアップロード
- `actions/deploy-pages@v4`: 公式デプロイアクション

#### 3. 環境変数設定
```yaml
env:
  NODE_ENV: production  # 本番環境ビルド
```

---

## 🔄 Next.js設定の修正

### 環境別設定の実装
**場所**: `next.config.ts`

```typescript
import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = isDevelopment ? {
  // 開発専用設定：GitHub Pages設定を完全に無効化
  output: undefined,
  basePath: '',
  assetPrefix: '',
  trailingSlash: false,
  
  images: {
    unoptimized: true,
  },
  
  experimental: {
    esmExternals: true,
  },
} : {
  // 本番専用設定：GitHub Pages対応
  output: 'export',
  
  images: {
    unoptimized: true,
  },
  
  basePath: '/pitch-training',
  assetPrefix: '/pitch-training',
  trailingSlash: true,
  
  experimental: {
    esmExternals: true,
  },
};

export default nextConfig;
```

### 重要なポイント
1. **開発環境**: GitHub Pages設定を完全無効化
2. **本番環境**: GitHub Pages対応設定を有効化
3. **環境変数による自動切り替え**

---

## 🚨 解決済み問題

### 1. ローカルサーバー接続問題
**原因**: GitHub Pages設定がローカル開発を阻害
**解決**: 環境別設定分離

### 2. GitHub Pages 404エラー
**原因**: パスエイリアス `@/hooks/` が解決されない
**解決**: 相対パス `../../../hooks/` に変更

### 3. GitHub Actions権限エラー
**原因**: git exit code 128エラー（権限不足）
**解決**: 公式推奨方式採用

### 4. 重複ワークフロー
**原因**: `nextjs.yml` と `deploy.yml` が並行実行
**解決**: 不要な `nextjs.yml` を削除

---

## 📋 使用手順

### 1. 開発作業
```bash
# 作業ブランチで開発
git checkout pitch-training-nextjs-v2-impl-001

# 実装・修正
# ...

# コミット
git add .
git commit -m "実装内容の説明"
```

### 2. GitHub Actions実行
```bash
# プッシュで自動実行
git push origin pitch-training-nextjs-v2-impl-001
```

### 3. デプロイ確認
1. GitHubリポジトリのActionsタブで実行状況確認
2. 完了後、GitHub Pagesでテスト実行

### 4. テストURL
```
https://kiyopi.github.io/pitch-training/test/microphone/
```

---

## 🎯 メリット

### 1. 確実性
- ローカル環境の問題に依存しない
- 一貫したビルド環境
- 自動的なエラー検出

### 2. 効率性
- 手動デプロイ不要
- 即座のテスト環境更新
- 作業時間の大幅短縮

### 3. 安全性
- 権限管理の自動化
- 公式推奨方式の使用
- セキュリティ問題の回避

---

## 🔍 トラブルシューティング

### GitHub Actions失敗時
1. Actionsタブでエラーログ確認
2. 権限設定の確認
3. Node.js/npm バージョンの確認
4. 依存関係の問題確認

### GitHub Pages表示されない時
1. GitHub Pages設定確認
2. ビルド成果物の確認
3. URL構成の確認
4. ブラウザキャッシュクリア

---

## 📊 実行時間

### 典型的な実行時間
- **Setup Node.js**: 5-10秒
- **Install dependencies**: 20-30秒
- **Build**: 10-20秒
- **Deploy**: 5-10秒
- **合計**: 約1-2分

### 最適化のポイント
- npm cache有効化
- 依存関係最小化
- 静的サイト生成の活用

---

**作成日**: 2025-07-18  
**作成者**: Claude Code Assistant  
**対象**: Next.js + GitHub Actions + GitHub Pages

**重要**: このワークフローにより、ローカルサーバー問題を回避し、確実なテスト環境を構築できます。