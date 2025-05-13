document.addEventListener("DOMContentLoaded", () => {
  // DOM 요소 참조
  const startButton = document.getElementById("startButton");
  const stopButton = document.getElementById("stopButton");
  const statusMessage = document.getElementById("statusMessage");
  const detectedNote = document.getElementById("detectedNote");
  const detectedFrequency = document.getElementById("detectedFrequency");
  const waveformCanvas = document.getElementById("waveform");
  const frequencyBarsCanvas = document.getElementById("frequencyBars");

  // 오디오 컨텍스트 및 변수 초기화
  let audioContext;
  let analyser;
  let microphone;
  let animationId;
  let dataArray;
  let bufferLength;
  let timeDataArray;
  let lastDetectedNotes = [];

  // 베이스 기타 현 정의 - 각 현의 정보
  const bassStrings = [
    {
      note: "E0",
      frequency: 20.6,
      color: "#800080",
      description: "E0 (초저음)",
    },
    { note: "F0", frequency: 21.83, color: "#9932CC", description: "F0" },
    { note: "F#0", frequency: 23.12, color: "#9400D3", description: "F#0" },
    { note: "G0", frequency: 24.5, color: "#8A2BE2", description: "G0" },
    { note: "G#0", frequency: 25.96, color: "#4B0082", description: "G#0" },
    { note: "A0", frequency: 27.5, color: "#483D8B", description: "A0" },
    { note: "A#0", frequency: 29.14, color: "#6A5ACD", description: "A#0" },
    { note: "B0", frequency: 30.87, color: "#7B68EE", description: "B0" },
    { note: "C1", frequency: 32.7, color: "#8470FF", description: "C1" },
    { note: "C#1", frequency: 34.65, color: "#A865DB", description: "C#1" },
    { note: "D1", frequency: 36.71, color: "#9B59BC", description: "D1" },
    { note: "D#1", frequency: 38.89, color: "#8E44AD", description: "D#1" },
    { note: "E1", frequency: 41.2, color: "#FF5252", description: "E (낮음)" },
    { note: "F1", frequency: 43.65, color: "#FF4530", description: "F1" },
    { note: "F#1", frequency: 46.25, color: "#FF6347", description: "F#1" },
    { note: "G1", frequency: 49.0, color: "#FFA500", description: "G1" },
    { note: "G#1", frequency: 51.91, color: "#FFB733", description: "G#1" },
    { note: "A1", frequency: 55.0, color: "#FFD740", description: "A" },
    { note: "A#1", frequency: 58.27, color: "#FFEB3B", description: "A#1" },
    { note: "B1", frequency: 61.74, color: "#C1DC43", description: "B1" },
    { note: "C2", frequency: 65.41, color: "#90EE90", description: "C2" },
    { note: "C#2", frequency: 69.3, color: "#74D97E", description: "C#2" },
    { note: "D2", frequency: 73.42, color: "#64FFDA", description: "D" },
    { note: "D#2", frequency: 77.78, color: "#00CED1", description: "D#2" },
    { note: "E2", frequency: 82.41, color: "#63B8FF", description: "E2" },
    { note: "F2", frequency: 87.31, color: "#5591F5", description: "F2" },
    { note: "F#2", frequency: 92.5, color: "#4169E1", description: "F#2" },
    { note: "G2", frequency: 98.0, color: "#448AFF", description: "G" },
    { note: "G#2", frequency: 103.83, color: "#0000CD", description: "G#2" },
    { note: "A2", frequency: 110.0, color: "#3D59AB", description: "A2" },
    { note: "A#2", frequency: 116.54, color: "#4682B4", description: "A#2" },
    { note: "B2", frequency: 123.47, color: "#5F9EA0", description: "B2" },
    { note: "C3", frequency: 130.81, color: "#008B8B", description: "C3" },
  ];

  // 베이스 주파수 감지 범위 설정 - 더 넓은 범위로 조정 (반음 간격)
  const bassFrequencyRanges = {
    E0: { min: 19.45, max: 21.2, target: 20.6 },
    F0: { min: 21.21, max: 22.45, target: 21.83 },
    "F#0": { min: 22.46, max: 23.8, target: 23.12 },
    G0: { min: 23.81, max: 25.2, target: 24.5 },
    "G#0": { min: 25.21, max: 26.7, target: 25.96 },
    A0: { min: 26.71, max: 28.3, target: 27.5 },
    "A#0": { min: 28.31, max: 30.0, target: 29.14 },
    B0: { min: 30.01, max: 31.75, target: 30.87 },
    C1: { min: 31.76, max: 33.65, target: 32.7 },
    "C#1": { min: 33.66, max: 35.65, target: 34.65 },
    D1: { min: 35.66, max: 37.75, target: 36.71 },
    "D#1": { min: 37.76, max: 40.0, target: 38.89 },
    E1: { min: 40.01, max: 42.4, target: 41.2 },
    F1: { min: 42.41, max: 44.95, target: 43.65 },
    "F#1": { min: 44.96, max: 47.6, target: 46.25 },
    G1: { min: 47.61, max: 50.4, target: 49.0 },
    "G#1": { min: 50.41, max: 53.4, target: 51.91 },
    A1: { min: 53.41, max: 56.6, target: 55.0 },
    "A#1": { min: 56.61, max: 59.95, target: 58.27 },
    B1: { min: 59.96, max: 63.5, target: 61.74 },
    C2: { min: 63.51, max: 67.3, target: 65.41 },
    "C#2": { min: 67.31, max: 71.3, target: 69.3 },
    D2: { min: 71.31, max: 75.55, target: 73.42 },
    "D#2": { min: 75.56, max: 80.0, target: 77.78 },
    E2: { min: 80.01, max: 84.8, target: 82.41 },
    F2: { min: 84.81, max: 89.85, target: 87.31 },
    "F#2": { min: 89.86, max: 95.2, target: 92.5 },
    G2: { min: 95.21, max: 100.85, target: 98.0 },
    "G#2": { min: 100.86, max: 106.85, target: 103.83 },
    A2: { min: 106.86, max: 113.2, target: 110.0 },
    "A#2": { min: 113.21, max: 119.95, target: 116.54 },
    B2: { min: 119.96, max: 127.0, target: 123.47 },
    C3: { min: 127.01, max: 134.5, target: 130.81 },
  };

  // 캔버스 컨텍스트 초기화
  const waveformCtx = waveformCanvas.getContext("2d");
  const frequencyBarsCtx = frequencyBarsCanvas.getContext("2d");

  // 캔버스 크기 설정
  function setupCanvas() {
    waveformCanvas.width = waveformCanvas.offsetWidth;
    waveformCanvas.height = waveformCanvas.offsetHeight;
    frequencyBarsCanvas.width = frequencyBarsCanvas.offsetWidth;
    frequencyBarsCanvas.height = frequencyBarsCanvas.offsetHeight;
  }

  // 브라우저가 Safari인지 확인
  function isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }

  // 사파리 브라우저 감지
  const isSafariBrowser = isSafari();

  // 확장된 음들을 포함한 모든 음 요소 참조를 저장할 배열
  let allNoteElements = [];

  // 마이크 접근 시작
  startButton.addEventListener("click", async () => {
    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log(
          "오디오 컨텍스트 생성됨, 샘플링 레이트:",
          audioContext.sampleRate
        );
      }

      // 오디오 컨텍스트 상태 확인 및 재개
      if (audioContext.state !== "running") {
        await audioContext.resume();
        console.log("오디오 컨텍스트 재개됨");
      }

      // 오디오 품질 향상을 위한 설정
      const constraints = {
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
      microphone = audioContext.createMediaStreamSource(stream);
      console.log("마이크 소스 생성됨");

      // 주파수 분석을 위한 설정
      analyser = audioContext.createAnalyser();

      // Safari에서는 더 작은 FFT 크기 사용 (성능 문제 방지)
      analyser.fftSize = isSafariBrowser ? 8192 : 16384;
      analyser.smoothingTimeConstant = isSafariBrowser ? 0.9 : 0.85; // Safari에서 더 많은 스무딩

      bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);

      // 시간 도메인 데이터용 배열 (음 감지용)
      timeDataArray = new Float32Array(analyser.fftSize);

      const frequencyResolution = audioContext.sampleRate / analyser.fftSize;
      console.log(
        "분석기 생성됨, FFT 크기:",
        analyser.fftSize,
        "주파수 해상도:",
        frequencyResolution.toFixed(3),
        "Hz",
        "Safari 브라우저:",
        isSafariBrowser ? "예" : "아니오"
      );

      // 오디오 처리 연결
      microphone.connect(analyser);
      console.log("오디오 연결 완료");

      // UI 업데이트
      startButton.disabled = true;
      stopButton.disabled = false;
      statusMessage.textContent = "마이크 연결됨. 베이스 음 감지 중...";

      // 캔버스 설정
      setupCanvas();

      // 분석 시작
      visualize();
      detectBassNote();
    } catch (error) {
      statusMessage.textContent = `마이크 접근 오류: ${error.message}`;
      console.error("마이크 접근 오류:", error);
    }
  });

  // 정지 버튼
  stopButton.addEventListener("click", () => {
    stopAudioProcessing();
  });

  // 오디오 처리 중지
  function stopAudioProcessing() {
    if (microphone) {
      microphone.disconnect();
      microphone = null;
      console.log("마이크 연결 해제됨");
    }

    if (analyser) {
      analyser = null;
      console.log("분석기 해제됨");
    }

    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }

    // UI 업데이트
    startButton.disabled = false;
    stopButton.disabled = true;
    detectedNote.textContent = "-";
    detectedFrequency.textContent = "0 Hz";
    statusMessage.textContent = "마이크가 꺼졌습니다.";

    // 캔버스 초기화
    clearCanvases();
  }

  // 캔버스 초기화
  function clearCanvases() {
    waveformCtx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
    frequencyBarsCtx.clearRect(
      0,
      0,
      frequencyBarsCanvas.width,
      frequencyBarsCanvas.height
    );
  }

  // 개선된 자기상관(YIN algorithm 기반) 음 감지 함수
  function detectPitch() {
    if (!analyser || !audioContext) return null;

    // 시간 도메인 데이터 가져오기
    analyser.getFloatTimeDomainData(timeDataArray);

    // 신호 강도 확인 (침묵 감지)
    let signalSum = 0;
    for (let i = 0; i < timeDataArray.length; i++) {
      signalSum += Math.abs(timeDataArray[i]);
    }

    const signalAverage = signalSum / timeDataArray.length;

    // 신호가 너무 약하면 무시 (임계값을 매우 낮게 설정)
    // Safari에서는 더 낮은 임계값 사용
    const minSignalThreshold = isSafariBrowser ? 0.000005 : 0.00001;
    if (signalAverage < minSignalThreshold) {
      console.log("신호가 너무 약함:", signalAverage);
      return null;
    }

    // 입력 신호 정규화 - 더 정확한 상관관계 계산을 위해
    const normalizedSignal = new Float32Array(timeDataArray.length);
    for (let i = 0; i < timeDataArray.length; i++) {
      normalizedSignal[i] = timeDataArray[i] / signalAverage;
    }

    const bufferSize = normalizedSignal.length;
    const sampleRate = audioContext.sampleRate;

    // 베이스 기타 주파수 범위에 해당하는 지연 계산 (더 넓은 범위)
    const minPeriod = Math.floor(sampleRate / 140); // G2보다 약간 높은 주파수의 주기
    const maxPeriod = Math.ceil(sampleRate / 20); // E1보다 약간 낮은 주파수의 주기

    // YIN 알고리즘 사용 (저주파수 감지에 효과적)
    const yinBuffer = new Float32Array(maxPeriod);

    // YIN 알고리즘의 첫 번째 단계: 자기 차이 함수
    for (let tau = 0; tau < maxPeriod; tau++) {
      yinBuffer[tau] = 0;

      // 초기 샘플을 적당히 건너뛰어 계산 (중요한 범위만 계산)
      const startSample = Math.floor(bufferSize * 0.1); // 앞의 10%만 건너뜀

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
    const thresholdYIN = isSafariBrowser ? 0.05 : 0.1; // Safari에서는 더 낮은 임계값

    // minPeriod 이후부터 첫 번째 dip 검색 (임계값 이하)
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
    if (tau == maxPeriod || yinBuffer[tau] >= 0.5) {
      console.log("유효한 주기를 찾지 못함");
      return null;
    }

    // 보간을 사용하여 더 정확한 주기 추정
    let betterTau;
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

    // 베이스 기타 주파수 범위 외의 주파수는 무시 (더 넓은 범위)
    if (fundamentalFrequency < 19 || fundamentalFrequency > 135) {
      console.log(
        "베이스 범위 밖의 주파수:",
        fundamentalFrequency.toFixed(2),
        "Hz"
      );
      return null;
    }

    console.log(
      "감지된 주파수:",
      fundamentalFrequency.toFixed(2),
      "Hz (신뢰도:",
      (1 - yinBuffer[tau]).toFixed(4),
      ")"
    );
    return fundamentalFrequency;
  }

  // 개선된 베이스 기타 음 감지 (메인 함수)
  function detectBassNote() {
    if (!analyser || !audioContext) {
      console.log("분석기 또는 오디오 컨텍스트가 없어 감지를 중단합니다.");
      return;
    }

    try {
      // 개선된 YIN 알고리즘 기반 주파수 감지
      const detectedFreq = detectPitch();

      if (detectedFreq === null) {
        // 충분한 소리가 감지되지 않은 경우
        detectedNote.textContent = "-";
        detectedFrequency.textContent = "0 Hz";

        // 다음 프레임에서 재호출
        setTimeout(() => detectBassNote(), 100);
        return;
      }

      console.log("감지된 주파수:", detectedFreq.toFixed(2), "Hz");

      // 베이스 기타 음 결정 (배음 분석 포함)
      let matchedNote = null;
      let matchSource = "";

      // 1. 먼저 현의 기본 주파수 범위에 있는지 확인 (가장 높은 우선순위)
      for (const string of bassStrings) {
        const note = string.note;
        const targetFreq = string.frequency;
        const range = bassFrequencyRanges[note];

        // 주파수가 현의 허용 범위 내에 있는 경우
        if (detectedFreq >= range.min && detectedFreq <= range.max) {
          matchedNote = note;
          matchSource = "기본음";
          console.log(
            `${note} 현의 기본 범위 내에 있음 (${targetFreq.toFixed(2)}Hz)`
          );
          break;
        }
      }

      // 2. 기본 주파수에서 매칭되지 않았다면 배음 검사 (더 정확한 배음 검출)
      if (!matchedNote) {
        let bestMatch = null;
        let bestMatchScore = 0;

        for (const string of bassStrings) {
          const note = string.note;
          const targetFreq = string.frequency;

          // 분수 관계 확인 - 배음 관계를 더 정확하게 확인
          // (감지된 주파수가 기본 주파수의 정수 배에 가까운지)
          const ratio = detectedFreq / targetFreq;
          const nearestHarmonic = Math.round(ratio);

          // 유효한 배음 관계인지 확인 (2-5배음만 확인)
          if (nearestHarmonic >= 2 && nearestHarmonic <= 5) {
            // 얼마나 정확히 배음 관계에 있는지 계산 (1.0이 완벽한 배음)
            const harmonicAccuracy =
              1.0 - Math.abs(ratio - nearestHarmonic) / nearestHarmonic;

            // 최소 90% 이상 정확도가 있어야 함
            if (harmonicAccuracy > 0.9 && harmonicAccuracy > bestMatchScore) {
              bestMatch = note;
              bestMatchScore = harmonicAccuracy;
              matchSource = `${nearestHarmonic}배음`;
            }
          }
        }

        if (bestMatch) {
          matchedNote = bestMatch;
          console.log(
            `${matchedNote}의 ${matchSource} 감지됨 (정확도: ${(
              bestMatchScore * 100
            ).toFixed(1)}%)`
          );
        }
      }

      // 3. 여전히 매치가 없으면, 역배음 관계 확인 (기본 주파수보다 낮은 경우)
      if (!matchedNote) {
        for (const string of bassStrings) {
          const note = string.note;
          const targetFreq = string.frequency;

          // 베이스 현의 주파수가 감지된 주파수의 배음인지 확인
          // (감지된 주파수가 베이스 현의 1/2, 1/3, 1/4 등인 경우)
          for (let denominator = 2; denominator <= 3; denominator++) {
            const subharmonicFreq = targetFreq / denominator;
            // 허용 오차 범위
            const tolerance = subharmonicFreq * 0.06; // 6% 오차 허용

            if (Math.abs(detectedFreq - subharmonicFreq) <= tolerance) {
              matchedNote = note;
              matchSource = `역배음 1/${denominator}`;
              console.log(
                `${note}의 역배음 관계 감지 (1/${denominator}, ${subharmonicFreq.toFixed(
                  2
                )}Hz)`
              );
              break;
            }
          }

          if (matchedNote) break;
        }
      }

      // 4. 마지막으로 가장 가까운 현 찾기 (배음 관계가 아닌 경우)
      if (!matchedNote) {
        let closestNote = null;
        let minDistance = Infinity;
        let percentDiff = Infinity;

        for (const string of bassStrings) {
          const note = string.note;
          const targetFreq = string.frequency;
          // 거리 계산 (로그 스케일로 계산하여 더 정확하게)
          const distance = Math.abs(
            Math.log2(detectedFreq) - Math.log2(targetFreq)
          );

          if (distance < minDistance) {
            minDistance = distance;
            closestNote = note;
            percentDiff = (Math.pow(2, distance) - 1) * 100;
          }
        }

        // 오차 범위가 25% 이내인 경우에만 매치로 인정
        if (percentDiff <= 25) {
          matchedNote = closestNote;
          matchSource = "근접";
          console.log(
            `가장 가까운 현: ${closestNote} (차이: ${percentDiff.toFixed(2)}%)`
          );
        } else {
          console.log(
            `베이스 범위 밖의 주파수: ${detectedFreq.toFixed(
              2
            )}Hz (가장 가까운 현과의 차이: ${percentDiff.toFixed(2)}%)`
          );
        }
      }

      // 최종 결과 안정화 (히스토리 기반)
      if (matchedNote) {
        lastDetectedNotes.push(matchedNote);
        if (lastDetectedNotes.length > 8) {
          // 히스토리 길이 증가
          lastDetectedNotes.shift();
        }

        // 가장 빈번하게 나타난 음 선택 (최소 2번 이상 나타난 경우만)
        const noteCounts = {};
        let maxCount = 0;
        let mostFrequentNote = matchedNote;

        for (const note of lastDetectedNotes) {
          noteCounts[note] = (noteCounts[note] || 0) + 1;
          if (noteCounts[note] > maxCount) {
            maxCount = noteCounts[note];
            mostFrequentNote = note;
          }
        }

        // 최종 선택된 음과 해당 주파수
        const finalNote = mostFrequentNote;

        // UI 업데이트
        detectedNote.textContent = finalNote;
        detectedFrequency.textContent = `${detectedFreq.toFixed(
          2
        )} Hz (${matchSource})`;

        console.log(`최종 선택된 음: ${finalNote} (${matchSource})`);
      } else {
        // 베이스 기타 범위 밖의 주파수인 경우
        detectedNote.textContent = "-";
        detectedFrequency.textContent = `${detectedFreq.toFixed(
          2
        )} Hz (범위 외)`;
      }
    } catch (error) {
      console.error("베이스 음 감지 오류:", error);
    }

    // 다음 프레임에서 재호출 (약간 빠르게 호출하여 응답성 향상)
    setTimeout(() => detectBassNote(), 80);
  }

  // 오디오 시각화
  function visualize() {
    if (!analyser) return;

    // 캔버스 크기 확인 및 조정
    if (waveformCanvas.width !== waveformCanvas.offsetWidth) {
      setupCanvas();
    }

    // 애니메이션 프레임 요청
    animationId = requestAnimationFrame(visualize);

    // 파형 그리기
    drawWaveform();

    // 주파수 바 그리기
    drawFrequencyBars();
  }

  // 파형 그리기
  function drawWaveform() {
    if (!analyser) return;

    try {
      // 시간 도메인 데이터 가져오기
      analyser.getByteTimeDomainData(dataArray);

      // 캔버스 초기화
      waveformCtx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);

      // 파형 스타일 설정
      waveformCtx.lineWidth = 2;
      waveformCtx.strokeStyle = "#4fc3f7";
      waveformCtx.beginPath();

      // 각 데이터 포인트마다 선 그리기
      const sliceWidth = waveformCanvas.width / (bufferLength - 1);
      let x = 0;

      // 성능 향상을 위해 일부 데이터만 사용
      const step = 2;

      for (let i = 0; i < bufferLength; i += step) {
        const v = dataArray[i] / 128.0; // 0-255 범위를 0-2 범위로 변환
        const y = (v * waveformCanvas.height) / 2;

        if (i === 0) {
          waveformCtx.moveTo(x, y);
        } else {
          waveformCtx.lineTo(x, y);
        }

        x += sliceWidth * step;
      }

      waveformCtx.lineTo(waveformCanvas.width, waveformCanvas.height / 2);
      waveformCtx.stroke();
    } catch (error) {
      console.error("파형 그리기 오류:", error);
    }
  }

  // 베이스 주파수에 집중한 주파수 바 그리기
  function drawFrequencyBars() {
    if (!analyser) return;

    // 주파수 데이터 가져오기
    analyser.getByteFrequencyData(dataArray);

    // 캔버스 초기화
    frequencyBarsCtx.clearRect(
      0,
      0,
      frequencyBarsCanvas.width,
      frequencyBarsCanvas.height
    );

    // 베이스 기타 주파수 범위 강조 표시
    const sampleRate = audioContext.sampleRate;
    const binSize = sampleRate / analyser.fftSize;

    // 바 그리기
    const barWidth = 8; // 고정된 너비의 바
    const barSpacing = 1; // 바 사이 간격
    const lowFreqLimit = 200; // 저주파 한계 (베이스 기타 범위)

    // 특정 주파수 범위만 표시 (베이스 기타 관련 주파수)
    const maxBin = Math.floor(lowFreqLimit / binSize);
    const barCount = Math.min(40, maxBin); // 최대 40개 바만 표시

    // 바 사이 간격을 포함한 총 너비 계산
    const totalBarWidth = (barWidth + barSpacing) * barCount;
    const startX = (frequencyBarsCanvas.width - totalBarWidth) / 2;

    // 각 베이스 현의 주파수에 해당하는 빈(bin) 인덱스 계산
    const stringBins = bassStrings.map((string) => {
      return {
        note: string.note,
        bin: Math.round(string.frequency / binSize),
        color: string.color,
      };
    }); // 주파수 바 그리기
    for (let i = 0; i < barCount; i++) {
      // 해당 주파수 계산
      const frequency = i * binSize;

      // 바의 높이 계산 (로그 스케일로 변환하여 저주파수 더 보이게)
      const barHeight = dataArray[i] * 2.0;

      // 바 색상 설정 (해당 주파수가 베이스 현과 일치하는지 확인)
      let barColor = `hsl(${180 + (i / barCount) * 180}, 80%, 60%)`;

      // 베이스 현 주파수와 가까운 경우 해당 현의 색상으로 표시
      const relevantStringBins = stringBins; // 항상 모든 음 사용

      for (const stringBin of relevantStringBins) {
        if (Math.abs(i - stringBin.bin) <= 1) {
          barColor = stringBin.color;
          break;
        }
      }

      // 바 그리기
      frequencyBarsCtx.fillStyle = barColor;
      frequencyBarsCtx.fillRect(
        startX + i * (barWidth + barSpacing),
        frequencyBarsCanvas.height - barHeight,
        barWidth,
        barHeight
      );

      // 베이스 현 주파수 위치에 라벨 표시
      relevantStringBins.forEach((stringBin) => {
        if (i === stringBin.bin) {
          frequencyBarsCtx.fillStyle = "#ffffff";
          frequencyBarsCtx.textAlign = "center";
          frequencyBarsCtx.font = "10px Arial";
          frequencyBarsCtx.fillText(
            stringBin.note,
            startX + i * (barWidth + barSpacing) + barWidth / 2,
            frequencyBarsCanvas.height - barHeight - 5
          );
        }
      });
    }
  }

  // 창 크기 변경 시 캔버스 리사이징
  window.addEventListener("resize", setupCanvas);

  // 오류 처리
  window.addEventListener("error", (event) => {
    statusMessage.textContent = `오류 발생: ${event.message}`;
    console.error("오류 발생:", event);
  });
});
