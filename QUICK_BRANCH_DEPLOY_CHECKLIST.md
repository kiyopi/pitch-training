# ⚡ 作業ブランチデプロイ - クイックチェックリスト

**これを見れば5秒で確認完了**

---

## 🚀 新規ブランチ作成前の3秒チェック

```bash
# 1. ワークフロー確認（environment設定がないこと）
grep -n "environment:" .github/workflows/pages.yml
# → 何も表示されなければOK ✅

# 2. ブランチパターン確認
grep -A 10 "branches:" .github/workflows/pages.yml
# → あなたのパターンが含まれていればOK ✅
```

---

## 📝 ブランチ名テンプレート（コピペ用）

```bash
# 機能開発
git switch -c feature-[機能名]-001

# デプロイ調整
git switch -c deployment-[目的]-001

# ランダムトレーニング
git switch -c random-training-[目的]-001

# テスト
git switch -c test-[目的]-001

# バグ修正
git switch -c bugfix-[問題]-001
```

---

## ❌ NG例（これだとデプロイされない）

```
my-feature          # パターン外
feature_xxx_001     # アンダースコア
Feature-xxx-001     # 大文字開始
feature/xxx/001     # スラッシュ区切り
```

---

## ✅ 成功確認URL

プッシュ後にここを確認:
1. **GitHub Actions**: https://github.com/kiyopi/pitch-training/actions
2. **エラーなし**: "Deploy to GitHub Pages (Unified)" が緑色 ✅
3. **環境エラーなし**: "environment protection rules" が出ていない

---

**このチェックリストで何十時間もの無駄を防げます**