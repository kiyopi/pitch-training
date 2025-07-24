/**
 * プラットフォーム検出・設定モジュール (Platform Detection & Configuration)
 * 
 * 目的: プラットフォーム別音響処理パラメータの統一管理
 * 基準: マイクテストページのプラットフォーム検出ロジックに完全準拠
 * 対応: iOS Safari・PC Chrome・Firefox・Edge等
 */

/**
 * プラットフォーム設定インターフェース
 */
export interface PlatformConfig {
  isIOS: boolean;
  microphoneSpec: {
    divisor: number;
    gainCompensation: number;
    noiseThreshold: number;
    smoothingFactor: number;
  };
  filterConfig: {
    useThreeStageFilter: boolean;
    highPassFreq: number;
    lowPassFreq: number;
    notchFreq: number;
    highPassQ: number;
    lowPassQ: number;
    notchQ: number;
  };
  audioContextConfig: {
    sampleRate: number;
    fftSize: number;
    smoothingTimeConstant: number;
  };
  frequencyConfig: {
    minFrequency: number;
    maxFrequency: number;
    clarityThreshold: number;
  };
}

/**
 * プラットフォーム検出結果インターフェース
 */
export interface PlatformDetectionResult {
  platform: 'iOS' | 'Android' | 'Windows' | 'macOS' | 'Linux' | 'Unknown';
  browser: 'Safari' | 'Chrome' | 'Firefox' | 'Edge' | 'Unknown';
  isIOS: boolean;
  isMobile: boolean;
  supportsWebAudio: boolean;
  supportsMediaDevices: boolean;
  userAgent: string;
  capabilities: {
    webAudioAPI: boolean;
    mediaDevicesAPI: boolean;
    audioWorklet: boolean;
    webRTC: boolean;
  };
}

/**
 * プラットフォーム検出ユーティリティクラス
 */
export class PlatformDetector {
  /**
   * 詳細なプラットフォーム検出
   * @returns プラットフォーム検出結果
   */
  static detectPlatform(): PlatformDetectionResult {
    const userAgent = navigator.userAgent;
    
    // プラットフォーム検出
    const platform = this.detectOperatingSystem(userAgent);
    
    // ブラウザ検出
    const browser = this.detectBrowser(userAgent);
    
    // iOS判定（マイクテストページ準拠）
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    
    // モバイル判定
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    // API対応状況検出
    const capabilities = this.detectCapabilities();
    
    return {
      platform,
      browser,
      isIOS,
      isMobile,
      supportsWebAudio: capabilities.webAudioAPI,
      supportsMediaDevices: capabilities.mediaDevicesAPI,
      userAgent,
      capabilities
    };
  }

  /**
   * オペレーティングSystem検出
   */
  private static detectOperatingSystem(userAgent: string): PlatformDetectionResult['platform'] {
    if (/iPad|iPhone|iPod/.test(userAgent)) return 'iOS';
    if (/Android/.test(userAgent)) return 'Android';
    if (/Windows/.test(userAgent)) return 'Windows';
    if (/Mac OS X/.test(userAgent)) return 'macOS';
    if (/Linux/.test(userAgent)) return 'Linux';
    return 'Unknown';
  }

  /**
   * ブラウザ検出
   */
  private static detectBrowser(userAgent: string): PlatformDetectionResult['browser'] {
    if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) return 'Safari';
    if (/Chrome/.test(userAgent)) return 'Chrome';
    if (/Firefox/.test(userAgent)) return 'Firefox';
    if (/Edge/.test(userAgent)) return 'Edge';
    return 'Unknown';
  }

  /**
   * API対応状況検出
   */
  private static detectCapabilities(): PlatformDetectionResult['capabilities'] {
    const windowWithWebkit = window as typeof window & { webkitAudioContext?: typeof AudioContext };
    
    return {
      webAudioAPI: typeof window !== 'undefined' && 
                   (typeof AudioContext !== 'undefined' || 
                    typeof windowWithWebkit.webkitAudioContext !== 'undefined'),
      mediaDevicesAPI: typeof navigator !== 'undefined' && 
                       typeof navigator.mediaDevices !== 'undefined' &&
                       typeof navigator.mediaDevices.getUserMedia === 'function',
      audioWorklet: typeof window !== 'undefined' && 
                    typeof AudioWorkletNode !== 'undefined',
      webRTC: typeof window !== 'undefined' && 
              typeof RTCPeerConnection !== 'undefined'
    };
  }
}

/**
 * プラットフォーム設定生成関数（マイクテストページ準拠）
 */
export function detectPlatformConfig(): PlatformConfig {
  const detection = PlatformDetector.detectPlatform();
  const isIOS = detection.isIOS;

  return {
    isIOS,
    microphoneSpec: {
      // マイクテストページの値に完全準拠
      divisor: isIOS ? 4.0 : 6.0,
      gainCompensation: isIOS ? 1.5 : 1.0,
      noiseThreshold: isIOS ? 12 : 15,
      smoothingFactor: 0.2  // 全プラットフォーム共通
    },
    filterConfig: {
      // iOS: 軽量フィルター、PC: 3段階フィルター
      useThreeStageFilter: !isIOS,
      highPassFreq: isIOS ? 60 : 80,
      lowPassFreq: 4000,  // PC専用
      notchFreq: 60,      // PC専用（電源ノイズカット）
      highPassQ: isIOS ? 0.5 : 1.0,
      lowPassQ: 0.7,      // PC専用
      notchQ: 30          // PC専用
    },
    audioContextConfig: {
      sampleRate: 44100,
      fftSize: 2048,
      smoothingTimeConstant: 0.8
    },
    frequencyConfig: {
      minFrequency: 80,
      maxFrequency: 2000,
      clarityThreshold: 0.6
    }
  };
}

/**
 * 簡易プラットフォーム検出（マイクテストページ互換）
 */
export function isIOSDevice(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * マイクロフォン仕様取得（プラットフォーム別）
 */
export function getMicrophoneSpec(isIOS?: boolean) {
  const platformIsIOS = isIOS !== undefined ? isIOS : isIOSDevice();
  
  return {
    divisor: platformIsIOS ? 4.0 : 6.0,
    gainCompensation: platformIsIOS ? 1.5 : 1.0,
    noiseThreshold: platformIsIOS ? 12 : 15,
    smoothingFactor: 0.2
  };
}

/**
 * フィルター設定取得（プラットフォーム別）
 */
export function getFilterConfig(isIOS?: boolean) {
  const platformIsIOS = isIOS !== undefined ? isIOS : isIOSDevice();
  
  if (platformIsIOS) {
    // iOS: 軽量フィルター
    return {
      type: 'lightweight' as const,
      highPass: {
        frequency: 60,
        Q: 0.5
      }
    };
  } else {
    // PC: 3段階フィルター
    return {
      type: 'three-stage' as const,
      highPass: {
        frequency: 80,
        Q: 1.0
      },
      lowPass: {
        frequency: 4000,
        Q: 0.7
      },
      notch: {
        frequency: 60,
        Q: 30
      }
    };
  }
}

/**
 * プラットフォーム別最適化設定
 */
export interface OptimizationConfig {
  performance: {
    useAnimationFrame: boolean;
    processInterval: number;
    bufferSize: number;
  };
  memory: {
    enableGarbageCollection: boolean;
    cleanupInterval: number;
  };
  ui: {
    updateThrottleMs: number;
    enableTransitions: boolean;
  };
}

/**
 * プラットフォーム別最適化設定取得
 */
export function getOptimizationConfig(isIOS?: boolean): OptimizationConfig {
  const platformIsIOS = isIOS !== undefined ? isIOS : isIOSDevice();
  
  if (platformIsIOS) {
    // iOS: パフォーマンス重視設定
    return {
      performance: {
        useAnimationFrame: true,
        processInterval: 16, // 60fps
        bufferSize: 1024
      },
      memory: {
        enableGarbageCollection: true,
        cleanupInterval: 5000
      },
      ui: {
        updateThrottleMs: 16,
        enableTransitions: false // iOS WebKit制約対応
      }
    };
  } else {
    // PC: 品質重視設定
    return {
      performance: {
        useAnimationFrame: true,
        processInterval: 16,
        bufferSize: 2048
      },
      memory: {
        enableGarbageCollection: false,
        cleanupInterval: 10000
      },
      ui: {
        updateThrottleMs: 10,
        enableTransitions: true
      }
    };
  }
}

/**
 * プラットフォーム機能サポート確認
 */
export class PlatformCapabilityChecker {
  /**
   * Web Audio API対応確認
   */
  static checkWebAudioSupport(): {
    supported: boolean;
    AudioContext: typeof AudioContext | undefined;
    webkitAudioContext: typeof AudioContext | undefined;
  } {
    const windowWithWebkit = window as typeof window & { webkitAudioContext?: typeof AudioContext };
    const supported = typeof window !== 'undefined' && 
                      (typeof AudioContext !== 'undefined' || 
                       typeof windowWithWebkit.webkitAudioContext !== 'undefined');
    
    return {
      supported,
      AudioContext: typeof AudioContext !== 'undefined' ? AudioContext : undefined,
      webkitAudioContext: typeof windowWithWebkit.webkitAudioContext !== 'undefined' ? 
                           windowWithWebkit.webkitAudioContext : undefined
    };
  }

  /**
   * MediaDevices API対応確認
   */
  static checkMediaDevicesSupport(): {
    supported: boolean;
    getUserMedia: boolean;
    enumerateDevices: boolean;
  } {
    const supported = typeof navigator !== 'undefined' && 
                      typeof navigator.mediaDevices !== 'undefined';
    
    return {
      supported,
      getUserMedia: supported && typeof navigator.mediaDevices.getUserMedia === 'function',
      enumerateDevices: supported && typeof navigator.mediaDevices.enumerateDevices === 'function'
    };
  }

  /**
   * プラットフォーム制限事項確認
   */
  static checkPlatformLimitations(): {
    requiresUserInteraction: boolean;
    hasAutoplayRestrictions: boolean;
    hasWebAudioLimitations: boolean;
    hasFileAccessLimitations: boolean;
  } {
    const isIOS = isIOSDevice();
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    return {
      requiresUserInteraction: isIOS || isMobile,
      hasAutoplayRestrictions: isIOS,
      hasWebAudioLimitations: isIOS,
      hasFileAccessLimitations: isIOS
    };
  }
}

/**
 * デバッグ情報取得
 */
export function getPlatformDebugInfo(): {
  detection: PlatformDetectionResult;
  config: PlatformConfig;
  capabilities: ReturnType<typeof PlatformCapabilityChecker.checkWebAudioSupport> & 
                ReturnType<typeof PlatformCapabilityChecker.checkMediaDevicesSupport>;
  limitations: ReturnType<typeof PlatformCapabilityChecker.checkPlatformLimitations>;
} {
  return {
    detection: PlatformDetector.detectPlatform(),
    config: detectPlatformConfig(),
    capabilities: {
      ...PlatformCapabilityChecker.checkWebAudioSupport(),
      ...PlatformCapabilityChecker.checkMediaDevicesSupport()
    },
    limitations: PlatformCapabilityChecker.checkPlatformLimitations()
  };
}

/**
 * 使用例とベストプラクティス
 */

/*
// 基本的な使用例
const platformConfig = detectPlatformConfig();
const micSpec = getMicrophoneSpec();
const filterConfig = getFilterConfig();

// プラットフォーム判定
if (platformConfig.isIOS) {
  console.log('iOS Safari環境での軽量実装');
} else {
  console.log('PC環境での高機能実装');
}

// 機能サポート確認
const audioSupport = PlatformCapabilityChecker.checkWebAudioSupport();
if (!audioSupport.supported) {
  console.error('Web Audio API not supported');
}

// デバッグ情報出力
const debugInfo = getPlatformDebugInfo();
console.log('Platform Debug Info:', debugInfo);
*/