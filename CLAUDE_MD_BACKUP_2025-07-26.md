# CLAUDE.md緊急修正内容バックアップ（2025-07-26）

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

## 📋 修正された環境情報

#### **現在の開発環境（絶対確認）**
**GitHubリポジトリ**: `https://github.com/kiyopi/pitch-training.git`  
**GitHub Pages URL**: `https://kiyopi.github.io/pitch-training/`  
**現在のブランチ**: `random-training-tonejs-fixed-001`
**開発技術**: **SvelteKit + TypeScript + Tone.js**
**作業ディレクトリ**: `/Users/isao/Documents/pitch-training`

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

#### **確認パス（必須）**
**ローカル確認**: `http://localhost:5173/[ページパス]`  
**GitHub Pages確認**: `https://kiyopi.github.io/pitch-training/[ページパス]`

### 現在の状況（2025-07-26移行決定後更新）
- **安定版**: 1e44e2e (v1.2.0 OutlierPenalty-Enhanced) 
- **現在のブランチ**: random-training-tonejs-fixed-001
- **開発環境**: SvelteKit本格開発（/svelte-prototype → メイン開発）
- **対象ファイル**: /src/routes/training/random/+page.svelte
- **技術スタック**: SvelteKit + Tone.js + Salamander Grand Piano
- **デプロイ状況**: GitHub Pages (https://kiyopi.github.io/pitch-training/training/random)
- **開発ステータス**: ✅ SvelteKit本格開発に完全移行

---

**このバックアップは、ロールバック後にCLAUDE.mdを正しい情報に復元するためのものです。**