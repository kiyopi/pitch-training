/**
 * 音響DOM操作ヘルパーモジュール (Audio DOM Helpers)
 * 
 * 目的: 音響UI要素のDOM直接操作を統一
 * 基準: マイクテストページのDOM操作手法に完全準拠
 * 対応: iPhone Safari WebKit制約対応
 */

/**
 * 音響DOM制御クラス
 * Direct DOM Audio System (DDAS) による一貫したUI更新
 */
export class AudioDOMController {
  /**
   * 音量バー表示更新（iPhone対応済み）
   * @param element - 音量バー要素
   * @param volume - 音量値（0-100）
   */
  static updateVolumeDisplay(element: HTMLElement, volume: number): void {
    if (!element) return;

    const clampedVolume = Math.max(0, Math.min(100, volume));
    
    // iPhone Safari WebKit対応: JavaScript完全制御
    element.style.width = `${clampedVolume}%`;
    element.style.backgroundColor = '#10b981';
    element.style.height = '100%';
    element.style.borderRadius = '9999px';
    element.style.transition = 'width 0.1s ease-out';
  }

  /**
   * 周波数表示更新
   * @param element - 周波数表示要素
   * @param frequency - 周波数値（Hz）またはnull
   */
  static updateFrequencyDisplay(element: HTMLElement, frequency: number | null): void {
    if (!element) return;

    if (frequency !== null && frequency > 0) {
      element.textContent = `${frequency.toFixed(1)} Hz`;
    } else {
      element.textContent = '-- Hz';
    }
  }

  /**
   * 音名表示更新
   * @param element - 音名表示要素
   * @param noteName - 音名またはnull
   */
  static updateNoteDisplay(element: HTMLElement, noteName: string | null): void {
    if (!element) return;

    element.textContent = noteName || '--';
  }

  /**
   * 複合音響情報表示更新
   * @param elements - DOM要素オブジェクト
   * @param audioInfo - 音響情報
   */
  static updateAudioDisplay(
    elements: {
      volumeBar?: HTMLElement;
      frequency?: HTMLElement;
      note?: HTMLElement;
    },
    audioInfo: {
      volume?: number;
      frequency?: number | null;
      noteName?: string | null;
    }
  ): void {
    if (elements.volumeBar && audioInfo.volume !== undefined) {
      this.updateVolumeDisplay(elements.volumeBar, audioInfo.volume);
    }

    if (elements.frequency && audioInfo.frequency !== undefined) {
      this.updateFrequencyDisplay(elements.frequency, audioInfo.frequency);
    }

    if (elements.note && audioInfo.noteName !== undefined) {
      this.updateNoteDisplay(elements.note, audioInfo.noteName);
    }
  }

  /**
   * 音量バー初期化（iPhone対応）
   * @param element - 音量バー要素
   */
  static initializeVolumeBar(element: HTMLElement): void {
    if (!element) return;

    // iPhone Safari WebKit制約対応: 初期化時に全スタイルを設定
    element.style.width = '0%';
    element.style.backgroundColor = '#10b981';
    element.style.height = '100%';
    element.style.borderRadius = '9999px';
    element.style.transition = 'width 0.1s ease-out';
    element.style.transformOrigin = 'left center';
  }

  /**
   * 周波数表示要素初期化
   * @param element - 周波数表示要素
   */
  static initializeFrequencyDisplay(element: HTMLElement): void {
    if (!element) return;

    element.textContent = '-- Hz';
    element.style.fontFamily = 'monospace';
    element.style.textAlign = 'center';
  }

  /**
   * 音名表示要素初期化
   * @param element - 音名表示要素
   */
  static initializeNoteDisplay(element: HTMLElement): void {
    if (!element) return;

    element.textContent = '--';
    element.style.textAlign = 'center';
    element.style.fontWeight = 'bold';
  }

  /**
   * 音響表示エリア一括初期化
   * @param elements - DOM要素オブジェクト
   */
  static initializeAudioDisplayArea(elements: {
    volumeBar?: HTMLElement;
    frequency?: HTMLElement;
    note?: HTMLElement;
  }): void {
    if (elements.volumeBar) {
      this.initializeVolumeBar(elements.volumeBar);
    }

    if (elements.frequency) {
      this.initializeFrequencyDisplay(elements.frequency);
    }

    if (elements.note) {
      this.initializeNoteDisplay(elements.note);
    }
  }

  /**
   * 表示リセット（無音状態）
   * @param elements - DOM要素オブジェクト
   */
  static resetAudioDisplay(elements: {
    volumeBar?: HTMLElement;
    frequency?: HTMLElement;
    note?: HTMLElement;
  }): void {
    this.updateAudioDisplay(elements, {
      volume: 0,
      frequency: null,
      noteName: null
    });
  }

  /**
   * 待機中表示設定
   * @param element - 表示要素
   * @param message - 待機メッセージ（デフォルト: "待機中..."）
   */
  static setWaitingDisplay(element: HTMLElement, message: string = '待機中...'): void {
    if (!element) return;

    element.textContent = message;
    element.style.color = '#6b7280';
    element.style.fontStyle = 'italic';
  }

  /**
   * アクティブ表示設定
   * @param element - 表示要素
   */
  static setActiveDisplay(element: HTMLElement): void {
    if (!element) return;

    element.style.color = '#1f2937';
    element.style.fontStyle = 'normal';
  }

  /**
   * エラー表示設定
   * @param element - 表示要素
   * @param errorMessage - エラーメッセージ
   */
  static setErrorDisplay(element: HTMLElement, errorMessage: string): void {
    if (!element) return;

    element.textContent = errorMessage;
    element.style.color = '#dc2626';
    element.style.fontStyle = 'normal';
  }

  /**
   * 固定高さ表示エリア設定（レイアウトシフト防止）
   * @param element - 表示要素
   * @param height - 固定高さ（デフォルト: "60px"）
   */
  static setFixedHeightDisplay(element: HTMLElement, height: string = '60px'): void {
    if (!element) return;

    element.style.height = height;
    element.style.display = 'flex';
    element.style.alignItems = 'center';
    element.style.justifyContent = 'center';
    element.style.minHeight = height;
  }
}

/**
 * DOM要素取得ヘルパー
 */
export class AudioDOMUtils {
  /**
   * 音響表示要素を安全に取得
   * @param refs - React useRef オブジェクト
   * @returns DOM要素オブジェクト
   */
  static getAudioElements(refs: {
    volumeBar?: React.RefObject<HTMLElement>;
    frequency?: React.RefObject<HTMLElement>;
    note?: React.RefObject<HTMLElement>;
  }): {
    volumeBar?: HTMLElement;
    frequency?: HTMLElement;
    note?: HTMLElement;
  } {
    return {
      volumeBar: refs.volumeBar?.current || undefined,
      frequency: refs.frequency?.current || undefined,
      note: refs.note?.current || undefined
    };
  }

  /**
   * 要素存在チェック
   * @param element - チェック対象要素
   * @returns 要素が存在し使用可能かどうか
   */
  static isElementAvailable(element: HTMLElement | null | undefined): element is HTMLElement {
    return element !== null && element !== undefined && element instanceof HTMLElement;
  }

  /**
   * 複数要素存在チェック
   * @param elements - チェック対象要素配列
   * @returns 全要素が使用可能かどうか
   */
  static areElementsAvailable(elements: (HTMLElement | null | undefined)[]): boolean {
    return elements.every(element => this.isElementAvailable(element));
  }
}

/**
 * 音響DOM操作エラー
 */
export class AudioDOMError extends Error {
  constructor(message: string, public element?: HTMLElement, public operation?: string) {
    super(message);
    this.name = 'AudioDOMError';
  }
}

/**
 * 安全なDOM操作ラッパー
 */
export class SafeAudioDOM {
  /**
   * 安全な音量バー更新
   * @param element - 音量バー要素
   * @param volume - 音量値
   * @param onError - エラーハンドラー
   */
  static safeUpdateVolumeDisplay(
    element: HTMLElement | null,
    volume: number,
    onError?: (error: AudioDOMError) => void
  ): void {
    try {
      if (!AudioDOMUtils.isElementAvailable(element)) {
        throw new AudioDOMError('Volume bar element is not available', element || undefined, 'updateVolumeDisplay');
      }

      AudioDOMController.updateVolumeDisplay(element, volume);
    } catch (error) {
      const audioError = error instanceof AudioDOMError ? error : 
        new AudioDOMError(`DOM operation failed: ${error}`, element || undefined, 'updateVolumeDisplay');
      
      if (onError) {
        onError(audioError);
      } else {
        console.error('AudioDOM Error:', audioError);
      }
    }
  }

  /**
   * 安全な音響表示更新
   * @param elements - DOM要素オブジェクト
   * @param audioInfo - 音響情報
   * @param onError - エラーハンドラー
   */
  static safeUpdateAudioDisplay(
    elements: {
      volumeBar?: HTMLElement | null;
      frequency?: HTMLElement | null;
      note?: HTMLElement | null;
    },
    audioInfo: {
      volume?: number;
      frequency?: number | null;
      noteName?: string | null;
    },
    onError?: (error: AudioDOMError) => void
  ): void {
    try {
      const safeElements = {
        volumeBar: elements.volumeBar || undefined,
        frequency: elements.frequency || undefined,
        note: elements.note || undefined
      };

      AudioDOMController.updateAudioDisplay(safeElements, audioInfo);
    } catch (error) {
      const audioError = error instanceof AudioDOMError ? error : 
        new AudioDOMError(`Safe audio display update failed: ${error}`, undefined, 'safeUpdateAudioDisplay');
      
      if (onError) {
        onError(audioError);
      } else {
        console.error('SafeAudioDOM Error:', audioError);
      }
    }
  }
}

/**
 * 使用例とベストプラクティス
 */

/*
// 基本的な使用例
const volumeBarRef = useRef<HTMLDivElement>(null);
const frequencyRef = useRef<HTMLDivElement>(null);
const noteRef = useRef<HTMLDivElement>(null);

// 初期化
useEffect(() => {
  const elements = AudioDOMUtils.getAudioElements({
    volumeBar: volumeBarRef,
    frequency: frequencyRef,
    note: noteRef
  });
  
  AudioDOMController.initializeAudioDisplayArea(elements);
}, []);

// 音響情報更新
const updateDisplay = (volume: number, frequency: number | null, noteName: string | null) => {
  const elements = AudioDOMUtils.getAudioElements({
    volumeBar: volumeBarRef,
    frequency: frequencyRef,
    note: noteRef
  });
  
  AudioDOMController.updateAudioDisplay(elements, {
    volume,
    frequency,
    noteName
  });
};

// 安全な更新（エラーハンドリング付き）
const safeUpdateDisplay = (volume: number) => {
  SafeAudioDOM.safeUpdateVolumeDisplay(
    volumeBarRef.current,
    volume,
    (error) => console.error('Volume update failed:', error)
  );
};
*/