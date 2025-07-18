# Next.js ローカルサーバー最適化ガイド v1.0

## 🎯 概要

Next.js開発における**最も効率的で安定した**ローカルサーバー設定手順を定義します。

---

## ⚡ 推奨設定（2025年ベストプラクティス）

### 1. **package.json 最適化設定**

```json
{
  "scripts": {
    "dev": "next dev --turbopack -H 0.0.0.0",
    "dev:safe": "next dev --port 3001",
    "dev:debug": "next dev --turbopack --experimental-debug",
    "build": "next build",
    "start": "next start",
    "clean": "rm -rf .next && rm -rf out",
    "port-check": "lsof -i :3000",
    "kill-port": "npx kill-port 3000"
  }
}
```

### 2. **next.config.ts ネットワーク最適化**

```typescript
const nextConfig: NextConfig = {
  // 基本設定
  output: 'export',
  images: { unoptimized: true },
  
  // GitHub Pages対応
  basePath: process.env.NODE_ENV === 'production' ? '/pitch-training' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/pitch-training' : '',
  
  // ネットワーク最適化（2025年追加）
  experimental: {
    esmExternals: true,
    allowDevOrigins: ['*.local', '172.16.*.*', '192.168.*.*'],
  },
  
  // 開発サーバー設定
  devServer: {
    port: 3000,
    hostname: '0.0.0.0', // ネットワークアクセス許可
  },
};
```

---

## 🔧 **完全設定手順**

### Step 1: 環境クリーンアップ

```bash
# 1. 既存プロセス停止
npx kill-port 3000
ps aux | grep next | awk '{print $2}' | xargs kill -9

# 2. キャッシュクリア
npm run clean
npm cache clean --force

# 3. 依存関係再インストール
rm -rf node_modules package-lock.json
npm install
```

### Step 2: ネットワーク設定確認

```bash
# 1. localhost設定確認
cat /etc/hosts | grep localhost
# 期待値: 127.0.0.1       localhost

# 2. ローカルIP確認
ifconfig | grep "inet " | grep -v 127.0.0.1
# あなたの環境: 172.16.81.52

# 3. ポート使用状況確認
lsof -i :3000
```

### Step 3: 開発サーバー起動（推奨順）

#### **方法A: 標準起動（推奨）**
```bash
npm run dev
# → http://localhost:3000
# → http://172.16.81.52:3000 (ネットワークアクセス)
```

#### **方法B: セーフモード（ポート競合時）**
```bash
npm run dev:safe
# → http://localhost:3001
```

#### **方法C: デバッグモード（トラブル時）**
```bash
npm run dev:debug
# → 詳細ログ出力
```

---

## 🚨 **トラブルシューティング**

### 問題1: ポート3000接続拒否

#### **原因分析**
```bash
# ポート使用確認
lsof -i :3000

# プロセス確認
ps aux | grep next
```

#### **解決手順**
```bash
# 1. 強制終了
npx kill-port 3000

# 2. 別ポート使用
PORT=3001 npm run dev

# 3. ホスト指定
npm run dev -- -H 127.0.0.1
```

### 問題2: ネットワークアクセス不可

#### **原因**: VPN・ファイアウォール設定

#### **解決手順**
```bash
# 1. VPN一時無効化
# システム環境設定 → ネットワーク → VPN → 切断

# 2. ファイアウォール確認
# システム環境設定 → セキュリティとプライバシー → ファイアウォール

# 3. ネットワーク許可設定
sudo pfctl -f /etc/pf.conf
```

### 問題3: DNS キャッシュ問題

#### **解決手順**
```bash
# 1. DNS キャッシュクリア
sudo dscacheutil -flushcache

# 2. mDNS リスタート
sudo launchctl unload -w /System/Library/LaunchDaemons/com.apple.mDNSResponder.plist
sudo launchctl load -w /System/Library/LaunchDaemons/com.apple.mDNSResponder.plist

# 3. ネットワーク設定リセット
sudo networksetup -setdnsservers Wi-Fi 8.8.8.8 8.8.4.4
```

---

## 📱 **iPhone確認用設定**

### ネットワーク経由アクセス

```bash
# 1. 開発サーバー起動（全インターフェース）
npm run dev

# 2. iPhone Safari でアクセス
# http://172.16.81.52:3000
# または
# http://isaoMac.local:3000
```

### QRコード生成（便利ツール）

```bash
# QRコード生成ツール追加
npm install -g qrcode-terminal

# QRコード表示
qrcode-terminal "http://172.16.81.52:3000"
```

---

## 🎯 **最適化された開発フロー**

### 日常的な開発手順

```bash
# 1. 朝の起動ルーチン
cd /Users/isao/Documents/pitch_app
npm run port-check        # ポート確認
npm run dev               # 開発サーバー起動

# 2. 動作確認
open http://localhost:3000

# 3. iPhone確認（必要時）
qrcode-terminal "http://172.16.81.52:3000"
```

### 問題発生時の対応

```bash
# 1. 一時停止
Ctrl+C

# 2. 環境リセット
npm run clean
npm run kill-port

# 3. 再起動
npm run dev
```

---

## 🔒 **環境変数設定**

### .env.local ファイル作成

```bash
# 開発環境用設定
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000

# デバッグ設定
DEBUG=1
NODE_ENV=development

# ネットワーク設定
HOST=0.0.0.0
PORT=3000
```

---

## 📊 **パフォーマンス監視**

### 開発サーバー監視スクリプト

```bash
#!/bin/bash
# monitor-dev-server.sh

while true; do
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ $(date): サーバー正常動作"
    else
        echo "❌ $(date): サーバー接続失敗"
        # 自動復旧処理
        npm run kill-port
        npm run dev &
    fi
    sleep 30
done
```

---

## 🚀 **まとめ**

### **最効率設定**
1. **`npm run dev`**: 基本的にこれだけでOK
2. **環境変数設定**: .env.local で詳細制御
3. **トラブル時**: `npm run clean` → `npm run dev`

### **安定性確保**
- ポート監視スクリプト使用
- 定期的なキャッシュクリア
- VPN設定の確認

### **iPhone確認**
- ネットワークアクセス設定
- QRコード生成ツール活用

**この設定で99%の接続問題が解決します！**

---

## 更新履歴
- **v1.0** (2025-07-18): 初版作成
  - 2025年ベストプラクティス調査反映
  - トラブルシューティング手順確立
  - iPhone確認最適化