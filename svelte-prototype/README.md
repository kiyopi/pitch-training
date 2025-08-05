# 相対音感トレーニングアプリ - SvelteKit版

## 概要

相対音感（音程の相対的な関係を聞き分ける能力）を効果的に鍛えるWebアプリケーションです。

## 主な機能

- **3つのトレーニングモード**
  - 🎲 ランダム基音モード: 様々な基音で8音階練習
  - ⚡ 連続チャレンジモード: 中級者向け連続練習
  - 🎹 12音階モード: クロマチック音階での高度練習

- **高精度音程検出**
  - Pitchy ライブラリによる McLeod Pitch Method 実装
  - 動的オクターブ補正システム
  - 3段階ノイズリダクション

- **統合評価システム**
  - 音程精度・認識速度・方向性認識等の多面評価
  - セッション進捗管理
  - 詳細フィードバック表示

## 技術スタック

- **Frontend**: SvelteKit + TypeScript
- **音響処理**: Tone.js + Salamander Grand Piano
- **音程検出**: Pitchy (McLeod Pitch Method)
- **デプロイ**: GitHub Pages + GitHub Actions

## 開発環境

### 必要要件
- Node.js 18以上
- npm

### ローカル開発

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview
```

### デプロイ

GitHub Actionsによる自動デプロイが設定されています。
- プッシュ対象ブランチ: `main`, `feature-complete-implementation`, `volume-fix-clean-start`

## プロジェクト構成

```
src/
├── lib/
│   ├── components/          # Svelteコンポーネント
│   ├── audio/              # 音響処理
│   ├── stores/             # 状態管理
│   └── utils/              # ユーティリティ
├── routes/                 # ページルート
│   ├── microphone-test/    # マイクテストページ
│   └── training/           # トレーニングページ
└── static/                 # 静的ファイル
```

## ライセンス

MIT License

## 開発履歴

- 2025-01: SvelteKit完全移行
- TrainingCore統合基盤完成
- 機能優先開発フェーズ開始