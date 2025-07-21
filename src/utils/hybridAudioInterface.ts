/**
 * Hybrid Audio Interface - DOM直接操作による高速音声可視化システム
 * React stateを回避した60FPS音量・周波数表示
 */

export interface AudioDisplayElements {
  volumeBar: HTMLElement | null;
  volumeText: HTMLElement | null;
  volumeStatus: HTMLElement | null;
  frequencyDisplay: HTMLElement | null;
  noteDisplay: HTMLElement | null;
  clarityDisplay: HTMLElement | null;
  debugLog: HTMLElement | null;
}

export interface AudioDisplayData {
  volume: number;
  frequency: number;
  note: string;
  octave: number;
  clarity: number;
  isValidSound: boolean;
}

/**
 * DOM直接操作による高速音声可視化クラス
 */
export class HybridAudioInterface {
  private elements: AudioDisplayElements;
  private animationFrameId: number | null = null;
  private updateCallback: (() => AudioDisplayData) | null = null;
  private isRunning: boolean = false;
  private debugMessages: string[] = [];
  private maxDebugMessages: number = 5;

  constructor(elements: AudioDisplayElements) {
    this.elements = { ...elements };
  }

  /**
   * DOM要素を更新（セッター）
   */
  updateElements(elements: Partial<AudioDisplayElements>): void {
    Object.assign(this.elements, elements);
  }

  /**
   * 音量バー表示更新（iPhone Safari対応）
   */
  private updateVolumeBar(volume: number): void {
    if (!this.elements.volumeBar) return;

    const clampedVolume = Math.max(0, Math.min(100, volume));
    
    // iPhone Safari対応: 強制的なスタイル更新
    this.elements.volumeBar.style.width = `${clampedVolume}%`;
    this.elements.volumeBar.style.minWidth = clampedVolume > 0 ? '2px' : '0px';
    
    // 音量レベル別の動的色変更
    let backgroundClass = '';
    if (volume > 40) {
      backgroundClass = 'bg-gradient-to-r from-green-400 to-green-600';
    } else if (volume > 20) {
      backgroundClass = 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    } else if (volume > 5) {
      backgroundClass = 'bg-gradient-to-r from-orange-400 to-orange-600';
    } else {
      backgroundClass = 'bg-gradient-to-r from-red-400 to-red-600';
    }
    
    // 既存クラスを削除して新しいクラスを追加
    this.elements.volumeBar.className = this.elements.volumeBar.className
      .replace(/bg-gradient-to-r from-\w+-\d+ to-\w+-\d+/g, '')
      .trim();
    this.elements.volumeBar.className += ` ${backgroundClass}`;
  }

  /**
   * 音量テキスト表示更新
   */
  private updateVolumeText(volume: number): void {
    if (!this.elements.volumeText) return;
    
    this.elements.volumeText.textContent = `${volume.toFixed(1)}%`;
  }

  /**
   * 音量ステータス表示更新
   */
  private updateVolumeStatus(volume: number, isValidSound: boolean): void {
    if (!this.elements.volumeStatus) return;
    
    let status = '';
    let statusClass = '';
    
    if (!isValidSound) {
      status = '🔇 音声が検出されていません';
      statusClass = 'text-gray-500';
    } else if (volume > 30) {
      status = '✅ 音量レベル良好';
      statusClass = 'text-green-600 font-semibold';
    } else if (volume > 15) {
      status = '⚠️ やや小さい音量';
      statusClass = 'text-yellow-600';
    } else if (volume > 5) {
      status = '🔶 小さめの音量';
      statusClass = 'text-orange-600';
    } else {
      status = '❌ 音量が小さすぎます';
      statusClass = 'text-red-600';
    }
    
    this.elements.volumeStatus.textContent = status;
    this.elements.volumeStatus.className = `text-sm ${statusClass}`;
  }

  /**
   * 周波数表示更新
   */
  private updateFrequencyDisplay(frequency: number, clarity: number): void {
    if (!this.elements.frequencyDisplay) return;
    
    let displayText = '';
    let displayClass = '';
    
    if (frequency > 0 && clarity > 0.3) {
      displayText = `🎵 ${frequency.toFixed(1)} Hz`;
      displayClass = 'text-blue-600 font-semibold';
    } else if (frequency > 0) {
      displayText = `🎵 ${frequency.toFixed(1)} Hz (不安定)`;
      displayClass = 'text-gray-500';
    } else {
      displayText = '🎤 音声を検出中...';
      displayClass = 'text-gray-400';
    }
    
    this.elements.frequencyDisplay.textContent = displayText;
    this.elements.frequencyDisplay.className = `text-lg ${displayClass}`;
  }

  /**
   * 音名表示更新
   */
  private updateNoteDisplay(note: string, octave: number, clarity: number): void {
    if (!this.elements.noteDisplay) return;
    
    if (note && clarity > 0.3) {
      const fullNote = `${note}${octave}`;
      this.elements.noteDisplay.textContent = `♪ ${fullNote}`;
      this.elements.noteDisplay.className = 'text-xl font-bold text-purple-600';
    } else if (note) {
      const fullNote = `${note}${octave}`;
      this.elements.noteDisplay.textContent = `♪ ${fullNote} (不安定)`;
      this.elements.noteDisplay.className = 'text-lg text-gray-500';
    } else {
      this.elements.noteDisplay.textContent = '♪ ---';
      this.elements.noteDisplay.className = 'text-lg text-gray-400';
    }
  }

  /**
   * 音程クラリティ表示更新
   */
  private updateClarityDisplay(clarity: number): void {
    if (!this.elements.clarityDisplay) return;
    
    const clarityPercent = Math.round(clarity * 100);
    let statusText = '';
    let statusClass = '';
    
    if (clarity > 0.8) {
      statusText = `🎯 精度: ${clarityPercent}% (非常に良好)`;
      statusClass = 'text-green-600 font-semibold';
    } else if (clarity > 0.6) {
      statusText = `🎯 精度: ${clarityPercent}% (良好)`;
      statusClass = 'text-blue-600';
    } else if (clarity > 0.4) {
      statusText = `🎯 精度: ${clarityPercent}% (やや不安定)`;
      statusClass = 'text-yellow-600';
    } else if (clarity > 0.1) {
      statusText = `🎯 精度: ${clarityPercent}% (不安定)`;
      statusClass = 'text-orange-600';
    } else {
      statusText = '🎯 精度: --- (検出中)';
      statusClass = 'text-gray-500';
    }
    
    this.elements.clarityDisplay.textContent = statusText;
    this.elements.clarityDisplay.className = `text-sm ${statusClass}`;
  }

  /**
   * デバッグログ表示更新
   */
  private updateDebugLog(message?: string): void {
    if (!this.elements.debugLog) return;
    
    // 新しいメッセージを追加
    if (message) {
      const timestamp = new Date().toLocaleTimeString('ja-JP', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
      const logEntry = `[${timestamp}] ${message}`;
      
      this.debugMessages.unshift(logEntry);
      
      // 最大件数制限
      if (this.debugMessages.length > this.maxDebugMessages) {
        this.debugMessages = this.debugMessages.slice(0, this.maxDebugMessages);
      }
    }
    
    // HTML更新
    if (this.debugMessages.length > 0) {
      const logHtml = this.debugMessages
        .map(msg => `<div class="text-xs text-gray-600 font-mono">${msg}</div>`)
        .join('');
      this.elements.debugLog.innerHTML = logHtml;
    } else {
      this.elements.debugLog.innerHTML = '<div class="text-xs text-gray-400">デバッグログなし</div>';
    }
  }

  /**
   * 全表示要素を一括更新（60FPS対応）
   */
  private updateAllDisplays(data: AudioDisplayData): void {
    // 音量表示更新
    this.updateVolumeBar(data.volume);
    this.updateVolumeText(data.volume);
    this.updateVolumeStatus(data.volume, data.isValidSound);
    
    // 周波数・音名表示更新
    this.updateFrequencyDisplay(data.frequency, data.clarity);
    this.updateNoteDisplay(data.note, data.octave, data.clarity);
    this.updateClarityDisplay(data.clarity);
  }

  /**
   * 60FPSアニメーションループ開始
   */
  start(updateCallback: () => AudioDisplayData): void {
    if (this.isRunning) {
      console.warn('HybridAudioInterface: 既に実行中');
      return;
    }
    
    this.updateCallback = updateCallback;
    this.isRunning = true;
    
    console.log('🚀 HybridAudioInterface: 60FPS更新開始');
    this.updateDebugLog('60FPS音声可視化開始');
    
    // アニメーションループ開始
    const animate = () => {
      if (!this.isRunning || !this.updateCallback) {
        return;
      }
      
      try {
        // 音声データ取得
        const audioData = this.updateCallback();
        
        // DOM直接更新（React state回避）
        this.updateAllDisplays(audioData);
        
        // 次のフレーム
        this.animationFrameId = requestAnimationFrame(animate);
        
      } catch (error) {
        console.error('HybridAudioInterface: 更新エラー:', error);
        this.updateDebugLog(`更新エラー: ${error}`);
        this.stop();
      }
    };
    
    // 初回実行
    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * 60FPSアニメーションループ停止
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    this.updateCallback = null;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    console.log('⏹️ HybridAudioInterface: 60FPS更新停止');
    this.updateDebugLog('60FPS音声可視化停止');
  }

  /**
   * 手動デバッグメッセージ追加
   */
  addDebugMessage(message: string): void {
    this.updateDebugLog(message);
  }

  /**
   * デバッグログクリア
   */
  clearDebugLog(): void {
    this.debugMessages = [];
    this.updateDebugLog();
  }

  /**
   * 実行状態確認
   */
  get running(): boolean {
    return this.isRunning;
  }

  /**
   * リソース解放
   */
  dispose(): void {
    this.stop();
    this.clearDebugLog();
    
    // 要素参照クリア
    Object.keys(this.elements).forEach(key => {
      (this.elements as unknown as Record<string, HTMLElement | null>)[key] = null;
    });
    
    console.log('🗑️ HybridAudioInterface: リソース解放完了');
  }
}

/**
 * DOM要素ID群から HybridAudioInterface を作成
 */
export function createHybridAudioInterface(elementIds: {
  volumeBarId?: string;
  volumeTextId?: string;
  volumeStatusId?: string;
  frequencyDisplayId?: string;
  noteDisplayId?: string;
  clarityDisplayId?: string;
  debugLogId?: string;
}): HybridAudioInterface {
  
  const elements: AudioDisplayElements = {
    volumeBar: elementIds.volumeBarId ? document.getElementById(elementIds.volumeBarId) : null,
    volumeText: elementIds.volumeTextId ? document.getElementById(elementIds.volumeTextId) : null,
    volumeStatus: elementIds.volumeStatusId ? document.getElementById(elementIds.volumeStatusId) : null,
    frequencyDisplay: elementIds.frequencyDisplayId ? document.getElementById(elementIds.frequencyDisplayId) : null,
    noteDisplay: elementIds.noteDisplayId ? document.getElementById(elementIds.noteDisplayId) : null,
    clarityDisplay: elementIds.clarityDisplayId ? document.getElementById(elementIds.clarityDisplayId) : null,
    debugLog: elementIds.debugLogId ? document.getElementById(elementIds.debugLogId) : null
  };
  
  return new HybridAudioInterface(elements);
}

/**
 * ReactコンポーネントのuseRefから HybridAudioInterface を作成
 */
export function createHybridAudioInterfaceFromRefs(refs: {
  volumeBarRef?: React.RefObject<HTMLDivElement | null>;
  volumeTextRef?: React.RefObject<HTMLSpanElement | null>;
  volumeStatusRef?: React.RefObject<HTMLDivElement | null>;
  frequencyDisplayRef?: React.RefObject<HTMLDivElement | null>;
  noteDisplayRef?: React.RefObject<HTMLDivElement | null>;
  clarityDisplayRef?: React.RefObject<HTMLDivElement | null>;
  debugLogRef?: React.RefObject<HTMLDivElement | null>;
}): HybridAudioInterface {
  
  const elements: AudioDisplayElements = {
    volumeBar: refs.volumeBarRef?.current || null,
    volumeText: refs.volumeTextRef?.current || null,
    volumeStatus: refs.volumeStatusRef?.current || null,
    frequencyDisplay: refs.frequencyDisplayRef?.current || null,
    noteDisplay: refs.noteDisplayRef?.current || null,
    clarityDisplay: refs.clarityDisplayRef?.current || null,
    debugLog: refs.debugLogRef?.current || null
  };
  
  return new HybridAudioInterface(elements);
}