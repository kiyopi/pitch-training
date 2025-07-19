# GitHub Actions ワークフローチェックリスト v1.0

## 📋 概要

Next.jsプロジェクトでのGitHub Actions実行前の必須チェック項目

---

## 🚨 事前確認チェックリスト

### 1. **ワークフローファイル確認**
- [ ] `.github/workflows/nextjs.yml` の存在確認
- [ ] トリガーブランチ設定の確認
- [ ] 作業ブランチが`branches`リストに含まれているか

### 2. **ローカルビルドテスト**
```bash
# 必須実行コマンド
npm run build
```
- [ ] ビルドエラーなし
- [ ] 警告の内容確認
- [ ] `out/`ディレクトリの生成確認

### 3. **ワークフロー設定修正**
作業ブランチでテストする場合：
```yaml
# .github/workflows/nextjs.yml
on:
  push:
    branches: ["main", "作業ブランチ名"]
```

### 4. **プッシュ前の最終確認**
- [ ] コミットメッセージの適切性
- [ ] 不要なファイルの除外
- [ ] セキュリティ上の問題なし

---

## 🔧 トラブルシューティング

### よくあるエラーと解決方法

#### **エラー1: ワークフローが実行されない**
```bash
# 原因: 作業ブランチがトリガーに含まれていない
# 解決: .github/workflows/nextjs.yml を修正
```

#### **エラー2: ビルドエラー**
```bash
# 原因: TypeScriptエラー・依存関係の問題
# 解決: ローカルで npm run build 実行・エラー修正
```

#### **エラー3: デプロイエラー**
```bash
# 原因: 静的ファイル生成の問題
# 解決: next.config.ts の設定確認
```

---

## 🎯 成功確認手順

### 1. **GitHub Actions実行確認**
```bash
# URL: https://github.com/kiyopi/pitch-training/actions
# 確認項目:
# - ワークフローが開始されているか
# - ビルドジョブが成功しているか
# - デプロイジョブが完了しているか
```

### 2. **デプロイ完了確認**
```bash
# URL: https://kiyopi.github.io/pitch-training/
# 確認項目:
# - ページが正常に表示されるか
# - 新機能が反映されているか
# - 既存機能が正常に動作するか
```

### 3. **iPhone Safari確認**
```bash
# 確認項目:
# - 音声再生が正常に動作するか
# - レスポンシブデザインが適切か
# - エラーが発生していないか
```

---

## 🔄 緊急時対応

### ビルドエラーが発生した場合
1. **即座にローカルでビルドテスト**
2. **エラーログの確認・修正**
3. **修正後に再プッシュ**

### デプロイエラーが発生した場合
1. **GitHub Actions ログの詳細確認**
2. **next.config.ts の設定確認**
3. **必要に応じてリバート実行**

---

## 📚 参考情報

### 関連仕様書
- `NEXTJS_GITHUB_WORKFLOW_SPECIFICATION.md`
- `CLAUDE.md`
- `AUDIO_SOURCE_TEST_PHASE_LOG.md`

### 重要URL
- GitHub Actions: https://github.com/kiyopi/pitch-training/actions
- デプロイ先: https://kiyopi.github.io/pitch-training/
- ローカル開発: http://localhost:3000

---

**作成日**: 2025-07-18  
**作成者**: Claude Code Assistant  
**目的**: GitHub Actionsビルドエラー再発防止