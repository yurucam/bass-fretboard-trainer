// 브라우저가 Safari인지 확인
function isSafari(): boolean {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

// WebKit AudioContext 타입 정의
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

// YIN 알고리즘을 사용한 음 감지 클래스
export class AudioPitchDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private timeDataArray: Float32Array | null = null;
  private animationId: number | null = null;
  private isSafariBrowser: boolean;

  constructor() {
    this.isSafariBrowser = isSafari();
  }

  // 오디오 컨텍스트 초기화
  async initialize(): Promise<void> {
    try {
      // 오디오 컨텍스트 생성
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      console.log(
        "오디오 컨텍스트 생성됨, 샘플링 레이트:",
        this.audioContext.sampleRate
      );

      // 오디오 컨텍스트 상태 확인 및 재개
      if (this.audioContext.state !== "running") {
        await this.audioContext.resume();
        console.log("오디오 컨텍스트 재개됨");
      }

      // 오디오 품질 향상을 위한 설정
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      };

      console.log("오디오 스트림 요청 중...");
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("오디오 스트림 획득 성공");

      // 마이크 소스 생성
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      console.log("마이크 소스 생성됨");

      // 주파수 분석을 위한 설정
      this.analyser = this.audioContext.createAnalyser();

      // Safari에서는 더 작은 FFT 크기 사용 (성능 문제 방지)
      this.analyser.fftSize = this.isSafariBrowser ? 8192 : 16384;
      this.analyser.smoothingTimeConstant = this.isSafariBrowser ? 0.9 : 0.85;

      // 시간 도메인 데이터용 배열 (음 감지용)
      this.timeDataArray = new Float32Array(this.analyser.fftSize);

      const frequencyResolution =
        this.audioContext.sampleRate / this.analyser.fftSize;
      console.log(
        "분석기 생성됨, FFT 크기:",
        this.analyser.fftSize,
        "주파수 해상도:",
        frequencyResolution.toFixed(3),
        "Hz",
        "Safari 브라우저:",
        this.isSafariBrowser ? "예" : "아니오"
      );

      // 오디오 처리 연결
      this.microphone.connect(this.analyser);
      console.log("오디오 연결 완료");
    } catch (error) {
      console.error("오디오 초기화 오류:", error);
      throw error;
    }
  }

  // YIN 알고리즘을 사용한 음 감지
  detectPitch(): number | null {
    if (!this.analyser || !this.audioContext || !this.timeDataArray) {
      return null;
    }

    try {
      // 시간 도메인 데이터 가져오기
      this.analyser.getFloatTimeDomainData(this.timeDataArray);

      // 신호 강도 확인 (침묵 감지)
      let signalSum = 0;
      for (let i = 0; i < this.timeDataArray.length; i++) {
        signalSum += Math.abs(this.timeDataArray[i]);
      }

      const signalAverage = signalSum / this.timeDataArray.length;

      // 신호가 너무 약하면 무시 (임계값을 매우 낮게 설정)
      // Safari에서는 더 낮은 임계값 사용
      const minSignalThreshold = this.isSafariBrowser ? 0.000005 : 0.00001;
      if (signalAverage < minSignalThreshold) {
        return null;
      }

      // 입력 신호 정규화 - 더 정확한 상관관계 계산을 위해
      const normalizedSignal = new Float32Array(this.timeDataArray.length);
      for (let i = 0; i < this.timeDataArray.length; i++) {
        normalizedSignal[i] = this.timeDataArray[i] / signalAverage;
      }

      const bufferSize = normalizedSignal.length;
      const sampleRate = this.audioContext.sampleRate;

      // 베이스 기타 주파수 범위에 해당하는 지연 계산
      const minPeriod = Math.floor(sampleRate / 140);
      const maxPeriod = Math.ceil(sampleRate / 20);

      // YIN 알고리즘 사용
      const yinBuffer = new Float32Array(maxPeriod);

      // YIN 알고리즘의 첫 번째 단계: 자기 차이 함수
      for (let tau = 0; tau < maxPeriod; tau++) {
        yinBuffer[tau] = 0;

        // 초기 샘플을 적당히 건너뛰어 계산
        const startSample = Math.floor(bufferSize * 0.1);

        for (let i = startSample; i < bufferSize - tau; i++) {
          const delta = normalizedSignal[i] - normalizedSignal[i + tau];
          yinBuffer[tau] += delta * delta;
        }
      }

      // 누적 평균 정규화
      yinBuffer[0] = 1;
      let runningSum = yinBuffer[0];
      for (let tau = 1; tau < maxPeriod; tau++) {
        runningSum += yinBuffer[tau];
        yinBuffer[tau] *= tau / runningSum;
      }

      // 임계값을 사용하여 주기 검출
      let tau = 0;
      const thresholdYIN = this.isSafariBrowser ? 0.05 : 0.1;

      // minPeriod 이후부터 첫 번째 dip 검색
      for (tau = minPeriod; tau < maxPeriod; tau++) {
        if (yinBuffer[tau] < thresholdYIN) {
          // 국소 최솟값 찾기
          while (tau + 1 < maxPeriod && yinBuffer[tau + 1] < yinBuffer[tau]) {
            tau++;
          }
          break;
        }
      }

      // 유효한 주기를 찾지 못한 경우
      if (tau === maxPeriod || yinBuffer[tau] >= 0.5) {
        return null;
      }

      // 보간을 사용하여 더 정확한 주기 추정
      let betterTau: number;
      if (tau > 0 && tau < maxPeriod - 1) {
        const s0 = yinBuffer[tau - 1];
        const s1 = yinBuffer[tau];
        const s2 = yinBuffer[tau + 1];

        // 포물선 보간을 사용해 최소값 위치를 더 정확하게 추정
        const adjustment = (s2 - s0) / (2 * (2 * s1 - s2 - s0));

        if (Math.abs(adjustment) < 1) {
          betterTau = tau + adjustment;
        } else {
          betterTau = tau;
        }
      } else {
        betterTau = tau;
      }

      // 주파수 계산
      const fundamentalFrequency = sampleRate / betterTau;

      // 베이스 기타 주파수 범위 외의 주파수는 무시
      if (fundamentalFrequency < 40 || fundamentalFrequency > 135) {
        return null;
      }

      return fundamentalFrequency;
    } catch (error) {
      console.error("베이스 음 감지 오류:", error);
      return null;
    }
  }

  // 연속 음 감지 시작
  startDetection(callback: (frequency: number | null) => void): void {
    const detect = () => {
      const frequency = this.detectPitch();
      callback(frequency);
      this.animationId = requestAnimationFrame(detect);
    };

    detect();
  }

  // 음 감지 중지
  stopDetection(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  // 리소스 정리
  cleanup(): void {
    this.stopDetection();

    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
      console.log("마이크 연결 해제됨");
    }

    if (this.analyser) {
      this.analyser = null;
      console.log("분석기 해제됨");
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      console.log("오디오 컨텍스트 해제됨");
    }

    this.timeDataArray = null;
  }

  // 오디오 컨텍스트 상태 확인
  get isInitialized(): boolean {
    return this.audioContext !== null && this.analyser !== null;
  }

  // 오디오 컨텍스트 상태 반환
  get audioContextState(): AudioContextState | null {
    return this.audioContext?.state || null;
  }
}
