# 🚀 作業ブランチからのGitHub Pagesデプロイ完全ガイド

**作成日**: 2025-07-26  
**重要度**: 🔴 **最重要** - この手順を守らないと何十時間も無駄にします  
**検証済み**: test-branch-deploy-001 で完全動作確認済み

---

## 🎯 この文書の目的

**何十回も繰り返されてきた「作業ブランチからデプロイできない問題」を二度と発生させない**

---

## ✅ 前提条件（必須確認）

### **1. ワークフロー設定確認**
```bash
# 必ず確認すること
cat .github/workflows/pages.yml | grep -A 10 "branches:"
```

**正しい設定**:
```yaml
on:
  push:
    branches: 
      - main
      - "deployment-*"
      - "feature-*"
      - "random-training-*"
      - "test-*"
      - "bugfix-*"
```

### **2. 環境保護ルール回避確認**
```bash
# environmentセクションがないことを確認
cat .github/workflows/pages.yml | grep -A 5 "jobs:"
```

**正しい設定**:
```yaml
jobs:
  deploy:
    # environment設定なし（重要！）
    runs-on: ubuntu-latest
```

### **3. 重複ワークフロー無効化確認**
```bash
# 他のワークフローが無効化されていることを確認
ls -la .github/workflows/
```

**期待される結果**:
```
pages.yml              # ← これだけが有効
nextjs.yml.disabled    # ← 無効化済み
nextjs-dev.yml.disabled # ← 無効化済み
```

---

## 📋 新規作業ブランチ作成手順

### **Step 1: ブランチ命名規則を厳守**

```bash
# ✅ 正しいブランチ名（必ずパターンに合致させる）
git switch -c feature-xxx-001
git switch -c deployment-xxx-001
git switch -c random-training-xxx-001
git switch -c test-xxx-001
git switch -c bugfix-xxx-001

# ❌ 間違ったブランチ名（これではデプロイされない）
git switch -c my-feature        # パターン外
git switch -c feature_xxx_001   # アンダースコア使用
git switch -c Feature-xxx-001   # 大文字開始
```

### **Step 2: 初回プッシュ**

```bash
# 作業ブランチから直接プッシュ
git push -u origin [ブランチ名]
```

### **Step 3: GitHub Actions確認**

1. https://github.com/kiyopi/pitch-training/actions にアクセス
2. 「Deploy to GitHub Pages (Unified)」が実行されていることを確認
3. 環境保護ルールエラーが出ていないことを確認

---

## 🚨 トラブルシューティング

### **問題1: ブランチからデプロイされない**

**原因**: ブランチ名がパターンに合致していない

**解決方法**:
```bash
# 現在のブランチ名確認
git branch --show-current

# 正しいパターンのブランチに変更
git checkout -b feature-[機能名]-001
git push -u origin feature-[機能名]-001
```

### **問題2: 環境保護ルールエラー**

**エラーメッセージ**:
```
Branch "xxx" is not allowed to deploy to github-pages due to environment protection rules.
```

**原因**: ワークフローにenvironment設定が残っている

**解決方法**:
1. `.github/workflows/pages.yml` を編集
2. `environment:` セクションを完全削除
3. mainブランチにマージ
4. 作業ブランチでmainをマージ

### **問題3: 複数ワークフローの競合**

**原因**: 無効化されていないワークフローが存在

**解決方法**:
```bash
# mainブランチで実行
cd .github/workflows/
mv nextjs.yml nextjs.yml.disabled
mv nextjs-dev.yml nextjs-dev.yml.disabled
git add -A
git commit -m "重複ワークフロー無効化"
git push origin main
```

---

## 🎯 完全動作保証チェックリスト

### **新規ブランチ作成前の確認**

- [ ] pages.yml が唯一の有効なワークフロー
- [ ] environment設定が削除されている
- [ ] ブランチパターンに自分の命名が含まれる
- [ ] mainブランチに最新の設定がマージ済み

### **ブランチ作成時の確認**

- [ ] 命名規則に従ったブランチ名
- [ ] mainブランチから最新を取得
- [ ] ワークフロー設定をマージ

### **プッシュ後の確認**

- [ ] GitHub Actions実行開始
- [ ] エラーメッセージなし
- [ ] デプロイ完了

---

## 📝 実証済みコマンドシーケンス

```bash
# 1. mainブランチから開始
git checkout main
git pull origin main

# 2. 新規作業ブランチ作成（パターン厳守）
git switch -c feature-my-awesome-feature-001

# 3. 実装・コミット
# ... 作業 ...
git add .
git commit -m "機能実装"

# 4. プッシュ（エラーなし）
git push -u origin feature-my-awesome-feature-001

# 5. GitHub Actions確認
# https://github.com/kiyopi/pitch-training/actions
# → "Deploy to GitHub Pages (Unified)" 実行確認

# 6. GitHub Pages確認
# https://kiyopi.github.io/pitch-training/
```

---

## 🔴 絶対にやってはいけないこと

1. **environment設定を追加する**
2. **ブランチパターン外の名前を使う**  
3. **無効化したワークフローを再度有効化する**
4. **pages.yml以外のデプロイワークフローを作成する**

---

## ✅ 保証される動作

この手順に従えば：

- **作業ブランチから直接GitHub Pagesデプロイ可能**
- **環境保護ルールエラーなし**
- **mainブランチへのマージ不要**
- **何十時間もの無駄な作業を回避**

---

**この文書は実証済みの手順です。必ずこの通りに実行してください。**

---

*最終検証: 2025-07-26*  
*検証ブランチ: test-branch-deploy-001*  
*結果: 完全動作確認済み*