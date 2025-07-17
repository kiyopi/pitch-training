# 実装履歴 - 相対音感トレーニングアプリ

## 📋 プロジェクト概要

**相対音感トレーニングアプリ**
- 基音再生 → ユーザー歌唱 → リアルタイム音程検出 → 正解判定
- Web Audio API + Pitchy（McLeod Pitch Method）による高精度音程検出
- 対象音階：ドレミファソラシド（8音階）の相対音程

---

## 🔄 開発フロー変遷

### Phase 1: 安定版確立（～2025-07-15）
- **安定版**: `1e44e2e` (v1.2.0 OutlierPenalty-Enhanced)
- **実装済み機能**:
  - 高精度音程検出システム
  - 動的オクターブ補正
  - 3段階ノイズリダクション
  - ランダム基音システム（10種類）
  - 外れ値ペナルティ制採点システム

### Phase 2: Simple版改善（2025-07-16）
- **ブランチ**: `simple-pitch-impl-001`
- **対象ファイル**: `simple-pitch-training.js`, `simple-pitch-training.html`
- **実装完了項目**:
  - ✅ オクターブ補正システム無効化
  - ✅ 基音ピアノ音対応（Tone.Synth → Sampler）
  - ✅ 3段階ノイズリダクション実装
  - ✅ AudioContext状態管理修正
  - ✅ マイク許可ダイアログ修正
  - ✅ もう一度ボタン修正

- **未解決問題**:
  - ❌ 23-25Hz低周波ノイズ完全未解決
  - ❌ 2400コンソールメッセージ発生
  - ❌ ノイズリダクション効果なし

### Phase 3: Next.js版移行（2025-07-17）
- **ブランチ**: `nextjs-training-v3-impl-001`
- **実装完了項目**:
  - ✅ Next.js基盤構築・GitHub Pages対応
  - ✅ TypeScript音声処理フック4つ完全復旧
  - ✅ モダンデザイン洗練化

- **発生問題**:
  - ❌ ハイブリッドシステムの複雑化
  - ❌ `useTonePlayer.ts`の状態管理不安定
  - ❌ ピアノ音源の音が出ない問題

### Phase 3-2: ハイブリッドシステム失敗（2025-07-17）
- **試行内容**: 複雑なハイブリッドシステムの修正
- **失敗したアプローチ**:
  - ❌ 複雑な状態管理による音源制御
  - ❌ 複数のReactフック間の依存関係
  - ❌ AudioContextの状態管理競合
  - ❌ triggerAttack/triggerReleaseのタイミング制御失敗

- **具体的な失敗事例**:
  - **音割れ問題**: 複雑な音量制御により音質劣化
  - **音が途切れる問題**: タイミング制御の競合状態
  - **音が出ない問題**: 初期化フローの複雑化による失敗
  - **Claude Code強制終了**: 複雑すぎる修正による文字列マッチング失敗

- **根本原因分析**:
  - **過度な抽象化**: シンプルなHTMLで動作することが複雑なReactで失敗
  - **状態管理オーバーヘッド**: useCallback, useEffect, useRefの複雑な相互作用
  - **非同期処理の競合**: 複数の非同期処理による予期しない動作
  - **デバッグの困難性**: 複雑な状態により問題特定が困難

---

## 🚨 重要な発見・問題解決

### 2025-07-16: 重大ミス発生
- **問題**: 修正対象ファイル間違い（full-scale-training.html を修正すべきところを simple-pitch-training.html と間違えた）
- **原因**: ブランチ仕様書確認不足、思い込みによる判断
- **解決**: 作業ログシステム導入（WORK_LOG.md, ERROR_LOG.md, DECISION_LOG.md）

### 2025-07-17: Claude Code強制終了
- **原因**: Edit操作の文字列マッチング失敗
- **状況**: `useTonePlayer.ts`修正中にファイル内容不整合
- **エラー**: `Error: String not found in file. Failed to apply edit.`

### 2025-07-17: ピアノ音源動作確認
- **シンプルHTMLテスト**: `piano-test.html`で完全動作確認
- **結果**: ✅ マイク許可・ピアノ音源・タイミング制御すべて正常
- **判明事実**: シンプルHTMLでは動作、Next.js実装に問題あり

---

## 🎯 技術的発見

### 音源実装のベストプラクティス
```javascript
// 動作確認済み：Salamander Grand Piano設定
const sampler = new Tone.Sampler({
    urls: {
        "C4": "C4.mp3",
        "D#4": "Ds4.mp3", 
        "F#4": "Fs4.mp3",
        "A4": "A4.mp3"
    },
    baseUrl: "https://tonejs.github.io/audio/salamander/",
    volume: 6, // +6dB
    attack: 0.01,
    decay: 0.1,
    sustain: 0.8,
    release: 0.5
}).toDestination();
```

### 基音範囲仕様
```javascript
// 仕様書確認済み：Bb3-Ab4（10種類）
const baseTones = [
    { name: 'Bb3', note: 'シ♭3', frequency: 233.08, tonejs: 'Bb3' },
    { name: 'C4',  note: 'ド4',   frequency: 261.63, tonejs: 'C4' },
    { name: 'Db4', note: 'レ♭4', frequency: 277.18, tonejs: 'Db4' },
    { name: 'D4',  note: 'レ4',   frequency: 293.66, tonejs: 'D4' },
    { name: 'Eb4', note: 'ミ♭4', frequency: 311.13, tonejs: 'Eb4' },
    { name: 'E4',  note: 'ミ4',   frequency: 329.63, tonejs: 'E4' },
    { name: 'F4',  note: 'ファ4', frequency: 349.23, tonejs: 'F4' },
    { name: 'Gb4', note: 'ソ♭4', frequency: 369.99, tonejs: 'Gb4' },
    { name: 'G4',  note: 'ソ4',   frequency: 392.00, tonejs: 'G4' },
    { name: 'Ab4', note: 'ラ♭4', frequency: 415.30, tonejs: 'Ab4' }
];
```

### タイミング制御仕様
```javascript
// 仕様書通り：2.5秒タイムライン
// 0.0秒: triggerAttack（アタック開始）
sampler.triggerAttack(noteString, undefined, 0.8);

// 2.0秒: triggerRelease（フェードアウト開始）
setTimeout(() => {
    sampler.triggerRelease(noteString);
}, 2000);

// 2.5秒: 録音開始
setTimeout(() => {
    startRecording();
}, 2500);
```

---

## 🔧 開発システム改善

### 使い捨てブランチ運用
- **命名規則**: `[機能名]-v[版数]-impl-[番号]`
- **メリット**: 強制プッシュ不要、失敗時のリスクゼロ
- **スマートロールバック**: ブランチ削除で完全リセット

### 作業ログシステム
- **WORK_LOG.md**: リアルタイム作業記録
- **ERROR_LOG.md**: エラー詳細記録
- **DECISION_LOG.md**: 重要判断記録

### CLAUDE.md確認強制プロトコル
- **実装前承認（厳守）**: 13項目の必須確認
- **仕様書確認義務**: 修正前に関連仕様書を必ず確認
- **ユーザー確認強化**: 修正対象ファイルの明示的確認

---

## 🎵 現在の実装状況

### 安定動作確認済み
- ✅ `piano-test.html`: マイク許可・ピアノ音源・タイミング制御
- ✅ `full-scale-training.js`: 高精度音程検出・ノイズリダクション
- ✅ 基音範囲・音質設定・再生制御

### 問題のある実装
- ❌ `useTonePlayer.ts`: 状態管理複雑化、音が出ない
- ❌ `useMicrophoneManager.ts`: ハイブリッドシステム複雑化
- ❌ Next.js実装全般: 複雑な状態管理による不安定性

### ハイブリッドシステムの失敗教訓
- **複雑化の罠**: 「高機能＝高品質」の錯覚
- **抽象化の副作用**: シンプルな動作が複雑な実装で破綻
- **状態管理の限界**: React hooks の複雑な相互作用
- **デバッグの困難性**: 問題の原因特定が困難
- **実装時間の無駄**: 複雑な修正に時間を費やす

---

## 🚀 次期実装方針（Phase 4）

### B) Next.js Simple実装
- **方針**: ハイブリッドシステム完全削除
- **ベース**: 動作確認済み`piano-test.html`のロジック
- **目標**: シンプルなReact実装で確実な動作
- **対象**: 新しい使い捨てブランチで再構築

### 実装予定項目
1. ハイブリッドシステム削除
2. 動作するHTMLコードのReact移植
3. 状態管理最小化
4. 段階的な音程判定機能追加

---

## 📊 学習・改善事項

### 技術的学習
- Tone.js Samplerの正しい使用方法
- AudioContextの状態管理重要性
- シンプル実装の安定性優位性

### 開発プロセス改善
- 複雑化する前の動作確認の重要性
- 段階的実装の必要性
- 仕様書確認の徹底
- **シンプル実装の優位性**: 複雑な抽象化より動作する実装を優先
- **プロトタイプ駆動開発**: 最小限で動作確認してから拡張

### 品質管理
- 作業ログの重要性
- エラー記録の価値
- ユーザー確認の必須性

---

*最終更新: 2025-07-17*  
*次回更新: Phase 4実装開始時*