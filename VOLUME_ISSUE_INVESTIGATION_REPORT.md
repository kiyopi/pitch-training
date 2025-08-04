# 音量問題調査報告書

## 🚨 重要な発見: プロトタイプとSvelteKit版の音量差異

### **調査日時**: 2025-08-04
### **問題**: iPad/iPhoneで基音音量が低く、AudioManager設定が効果なし

## 🔍 根本原因の特定

### **1. Sampler初期化時のvolume設定差異**
```javascript
// プロトタイプ (random-training.html:180)
sampler = new Tone.Sampler({
    urls: {
        "C4": "C4.mp3",
        "D#4": "Ds4.mp3", 
        "F#4": "Fs4.mp3",
        "A4": "A4.mp3"
    },
    baseUrl: "https://tonejs.github.io/audio/salamander/",
    volume: 6  // ← +6dB設定！約2倍音量
}).toDestination();

// SvelteKit版 (修正前)
sampler = new window.Tone.Sampler({
    urls: { "C4": "C4.mp3" },
    baseUrl: "https://tonejs.github.io/audio/salamander/",
    // volume設定なし（デフォルト0dB）
    release: 1.5
}).toDestination();
```

### **2. 音量差の重大性**
- **プロトタイプ**: +6dB = 約2倍の音量
- **SvelteKit版**: 0dB = 基準音量
- **体感差**: ユーザーが「SvelteKit版が極端に小さい」と感じる原因

### **3. 404エラー問題**
**ファイル**: `/svelte-prototype/svelte.config.js:19`
```javascript
// 問題のコード
if (path.includes('favicon') || path.includes('microphone-test') || ...)
```
**原因**: マイクテストページがプリレンダリングから除外され、GitHub Pagesで404エラー

## 📊 試行した修正と結果

### **修正1**: AudioManagerデフォルト値強化
- iOS基音音量: 0dB → 6dB → 12dB
- iOS マイク感度: 1.5x → 3.0x → 5.0x
- **結果**: 効果なし（根本原因未解決）

### **修正2**: Sampler初期化volume設定追加
- マイクテストページ: `volume: 0` 追加
- トレーニングページ: `volume: 0` 追加
- **結果**: 効果なし（プロトタイプは6dB設定が必要）

### **修正3**: プロトタイプ準拠volume設定（未実装）
- `volume: 6` に設定する必要あり
- プリレンダリング除外問題の解決が必要

## 🎯 正しい解決策

### **1. Sampler初期化をプロトタイプ準拠に**
```javascript
sampler = new window.Tone.Sampler({
    urls: { "C4": "C4.mp3" },
    baseUrl: "https://tonejs.github.io/audio/salamander/",
    volume: 6, // プロトタイプと同じ+6dB設定
    release: 1.5
}).toDestination();
```

### **2. プリレンダリング設定修正**
```javascript
// svelte.config.js:19
if (path.includes('favicon') || path.includes('scoring-components-test') || path.includes('scoring-test')) {
    // microphone-testを除外リストから削除
}
```

## ⚠️ 注意事項

- AudioManagerのlocalStorage設定は補助的機能
- **真の問題はSampler初期化時のvolume設定差異**
- プロトタイプの「うるさすぎる」レベル = volume:6設定

## 📝 次回の安全な実装手順

1. 安全なコミットに戻る
2. プリレンダリング設定のみ修正
3. volume:6設定を実装
4. 段階的テスト実行

---
**調査担当**: Claude Code Assistant
**保存日時**: 2025-08-04 15:51