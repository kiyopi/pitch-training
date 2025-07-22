# SESSION_RECOVERY_GUIDE.md - セッション復帰手順書

## 🚨 緊急復帰プロトコル（5分で完全復帰）

### **VSCodeクラッシュ・セッション中断時の即座復帰手順**

---

## 📋 Step 1: 現在状況確認（2分）

### **1-1: 全体状況確認（30秒）**
```bash
# プロジェクト進捗一覧確認
cat PROJECT_PROGRESS_TRACKER.md | grep -A 5 "現在状況"

# 前回セッション詳細確認  
tail -20 WORK_LOG.md
```

### **1-2: Git状態確認（30秒）**
```bash
# 現在ブランチ・最新コミット確認
git branch --show-current
git log --oneline -5

# 作業中ファイル・変更状況確認
git status
```

### **1-3: 作業対象特定（1分）**
```bash
# 進行中Step確認
grep -A 10 "🔄\|進行中" STEP_COMPLETION_CHECKLIST.md

# 最後の作業内容確認
grep -A 5 "次回継続\|中断理由" WORK_LOG.md
```

---

## 🔧 Step 2: 環境復帰（3分）

### **2-1: Git環境確認（1分）**
```bash
# 正しいブランチ確認・切り替え
git checkout pitch-training-nextjs-v2-impl-001

# 最新状態同期（必要に応じて）
git pull origin pitch-training-nextjs-v2-impl-001

# 未コミット変更確認
git diff --name-only
```

### **2-2: Node.js環境確認（1分）**
```bash
# 依存関係確認
npm install

# ビルド状態確認  
unset NODE_ENV && npm run build
```

### **2-3: VSCode環境最適化（1分）**
```bash
# VSCode再起動（軽量モード）
code . --disable-extensions

# 必要最小限拡張のみ有効化：
# - TypeScript and JavaScript Language Features
# - Prettier - Code formatter
```

---

## 🎯 Step 3: 作業継続準備（即座）

### **3-1: 未完了項目確認（30秒）**
```bash
# 現在Step未完了項目確認
grep -A 20 "⏸️\|in_progress" STEP_COMPLETION_CHECKLIST.md

# 具体的な次回作業確認
grep -A 3 "次回作業\|次回継続" PROJECT_PROGRESS_TRACKER.md
```

### **3-2: 作業再開（即座）**
1. **ファイル開く**: 前回作業中ファイルをVSCodeで開く
2. **進捗更新開始**: 30分タイマー設定
3. **作業ログ開始**: WORK_LOG.mdに復帰記録

---

## 🔄 復帰パターン別対応

### **パターンA: 正常復帰（80%のケース）**
```
VSCodeクラッシュ → 環境確認 → 問題なし → 作業継続
```
#### **対応**
1. Step 1-3実行→Step 2-2実行→Step 3-2実行
2. 所要時間：3分
3. リスク：低

### **パターンB: Git状態異常（15%のケース）**
```
VSCodeクラッシュ → 未コミット変更あり → 状況判断必要
```
#### **対応**
```bash
# 変更内容確認
git diff

# 有用な変更の場合：コミット
git add .
git commit -m "復帰前保存: [内容説明]"

# 不要な変更の場合：破棄
git checkout -- .
```

### **パターンC: 環境問題（5%のケース）**
```
VSCodeクラッシュ → ビルドエラー → 環境修復必要
```
#### **対応**
```bash
# Node.js環境リセット
rm -rf node_modules package-lock.json
npm install

# TypeScript キャッシュクリア
rm -rf .next
npm run build

# 最終手段：安全な状態に巻き戻し
git checkout 1e44e2e  # 安定版v1.2.0
```

---

## 📊 復帰判断フローチャート

```
VSCodeクラッシュ発生
        ↓
Step 1: 状況確認実行
        ↓
Git状態正常？ → No → パターンB対応 → 環境修復
        ↓ Yes
npm build成功？ → No → パターンC対応 → 環境修復  
        ↓ Yes
前回作業明確？ → No → WORK_LOG詳細確認 → 作業特定
        ↓ Yes
パターンA: 即座作業継続
```

---

## 🛠️ 復帰後の必須アクション

### **復帰直後（5分以内）**
1. **WORK_LOG.md更新**: 復帰状況・復帰時刻記録
2. **30分タイマー設定**: 次回進捗更新時刻設定
3. **作業内容確認**: 具体的な次のタスク明確化

### **復帰後30分**
1. **初回進捗更新**: 復帰後作業内容記録
2. **問題なし確認**: 正常に作業継続できているか確認
3. **次回中断対策**: 更なる中断に備えた準備

---

## 🚨 緊急時コマンド集

### **即座確認コマンド**
```bash
# プロジェクト状況1行表示
grep "現在Phase\|現在Step\|進捗率" PROJECT_PROGRESS_TRACKER.md

# 最新作業3行表示
tail -3 WORK_LOG.md

# Git状況1行表示
git branch --show-current && git log --oneline -1
```

### **安全復帰コマンド**
```bash
# 安全な状態に即座復帰
git checkout 1e44e2e && npm install && npm run build

# 現在ブランチの最新安全コミットに復帰
git log --oneline | head -5  # 安全なコミット特定
git checkout [安全なコミットハッシュ]
```

### **環境リセットコマンド**
```bash
# 完全環境リセット（最終手段）
git checkout pitch-training-nextjs-v2-impl-001
git reset --hard origin/pitch-training-nextjs-v2-impl-001
rm -rf node_modules .next
npm install && npm run build
```

---

## 📝 復帰ログテンプレート

### **WORK_LOG.md追記用**
```markdown
### 🔄 復帰セッション 2025-07-22 HH:MM

#### **復帰状況**
- **中断理由**: VSCodeクラッシュ
- **復帰時刻**: HH:MM
- **復帰パターン**: A/B/C
- **復帰所要時間**: X分

#### **確認結果**
- **Git状態**: 正常/異常
- **ビルド状態**: 成功/失敗  
- **前回作業**: [Step X-Y: 作業内容]

#### **継続作業**
- **現在Step**: Step X-Y
- **次回作業**: [具体的なタスク]
- **目標時間**: XX分
```

---

## ⚡ クイックリファレンス

### **1分復帰（最速）**
```bash
cat PROJECT_PROGRESS_TRACKER.md | grep "現在Step"
tail -5 WORK_LOG.md
git status
code .
```

### **3分復帰（標準）**
```bash
# Step 1: 状況確認
grep -A 5 "現在状況" PROJECT_PROGRESS_TRACKER.md
git log --oneline -3

# Step 2: 環境確認
npm run build

# Step 3: 作業継続
grep "次回継続" WORK_LOG.md
```

### **5分復帰（完全）**
- 上記3分 + 詳細チェック + 進捗更新

---

**作成日**: 2025-07-22  
**用途**: VSCodeクラッシュ・セッション中断対応  
**目標**: 5分以内での完全復帰  
**維持管理**: 復帰パターン・頻度に応じて手順最適化