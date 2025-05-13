document.addEventListener("DOMContentLoaded", () => {
  // DOM 요소 참조
  const startButton = document.getElementById("startButton");
  const stopButton = document.getElementById("stopButton");
  const detectedNote = document.getElementById("detectedNote");
  const detectedFrequency = document.getElementById("detectedFrequency");
  const targetNote = document.getElementById("targetNote");
  const scoreCount = document.getElementById("scoreCount");
  const timeDisplay = document.getElementById("timeDisplay");

  // 모달 관련 요소
  const resultModal = document.getElementById("resultModal");
  const closeBtn = document.querySelector(".close");
  const finalScore = document.getElementById("finalScore");
  const finalTime = document.getElementById("finalTime");
  const restartButton = document.getElementById("restartButton");

  // 오디오 컨텍스트 및 변수 초기화
  let audioContext;
  let analyser;
  let microphone;
  let animationId;
  let timeDataArray;
  let lastDetectedNotes = [];
  let lastTargetNote = null; // 이전 목표음 저장 변수

  // 게임 변수
  let score = 0;
  let gameActive = false;
  let gameStartTime;
  let currentTargetNote;
  let waitingForNextNote = false;
  let noteSuccessTimer = null;
  let consecutiveCorrectDetections = 0;
  let requiredConsecutiveDetections = 3; // 인식 문제를 고려해 여러 번 연속 인식되어야 성공으로 처리
  let toleranceTimer = null;

  // 애니메이션 관련 변수
  let successAnimationActive = false;
  let isFirstNoteAfterStart = true; // 게임 시작 후 첫 번째 음표 표시 여부 확인용

  // 베이스 기타 음 정의 - 기본 4줄만 사용
  const bassNotes = [
    {
      note: "E1",
      frequency: 41.2,
      description: "4번줄 개방",
      string: 4,
      fret: 0,
    },
    {
      note: "F1",
      frequency: 43.65,
      description: "4번줄 1프렛",
      string: 4,
      fret: 1,
    },
    {
      note: "F#1",
      frequency: 46.25,
      description: "4번줄 2프렛",
      string: 4,
      fret: 2,
    },
    {
      note: "G1",
      frequency: 49.0,
      description: "4번줄 3프렛",
      string: 4,
      fret: 3,
    },
    {
      note: "G#1",
      frequency: 51.91,
      description: "4번줄 4프렛",
      string: 4,
      fret: 4,
    },
    {
      note: "A1",
      frequency: 55.0,
      description: "3번줄 개방",
      string: 3,
      fret: 0,
    },
    {
      note: "A#1",
      frequency: 58.27,
      description: "3번줄 1프렛",
      string: 3,
      fret: 1,
    },
    {
      note: "B1",
      frequency: 61.74,
      description: "3번줄 2프렛",
      string: 3,
      fret: 2,
    },
    {
      note: "C2",
      frequency: 65.41,
      description: "3번줄 3프렛",
      string: 3,
      fret: 3,
    },
    {
      note: "C#2",
      frequency: 69.3,
      description: "3번줄 4프렛",
      string: 3,
      fret: 4,
    },
    {
      note: "D2",
      frequency: 73.42,
      description: "2번줄 개방",
      string: 2,
      fret: 0,
    },
    {
      note: "D#2",
      frequency: 77.78,
      description: "2번줄 1프렛",
      string: 2,
      fret: 1,
    },
    {
      note: "E2",
      frequency: 82.41,
      description: "2번줄 2프렛",
      string: 2,
      fret: 2,
    },
    {
      note: "F2",
      frequency: 87.31,
      description: "2번줄 3프렛",
      string: 2,
      fret: 3,
    },
    {
      note: "F#2",
      frequency: 92.5,
      description: "2번줄 4프렛",
      string: 2,
      fret: 4,
    },
    {
      note: "G2",
      frequency: 98.0,
      description: "1번줄 개방",
      string: 1,
      fret: 0,
    },
    {
      note: "G#2",
      frequency: 103.83,
      description: "1번줄 1프렛",
      string: 1,
      fret: 1,
    },
    {
      note: "A2",
      frequency: 110.0,
      description: "1번줄 2프렛",
      string: 1,
      fret: 2,
    },
    {
      note: "A#2",
      frequency: 116.54,
      description: "1번줄 3프렛",
      string: 1,
      fret: 3,
    },
    {
      note: "B2",
      frequency: 123.47,
      description: "1번줄 4프렛",
      string: 1,
      fret: 4,
    },
    {
      note: "C3",
      frequency: 130.81,
      description: "1번줄 5프렛",
      string: 1,
      fret: 5,
    },
  ];

  // 베이스 주파수 감지 범위 설정 - 더 넓은 범위로 조정 (반음 간격)
  const bassFrequencyRanges = {
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

  // 브라우저가 Safari인지 확인
  function isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }

  // 사파리 브라우저 감지
  const isSafariBrowser = isSafari();

  // 게임 시작 버튼
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

      // 게임 시작
      startGame();

      // UI 업데이트
      startButton.disabled = true;
      stopButton.disabled = false;
    } catch (error) {
      console.error("마이크 접근 오류:", error);
    }
  });

  // 정지 버튼
  stopButton.addEventListener("click", () => {
    endGame();
  });

  // 게임 시작 함수
  function startGame() {
    // 게임 변수 초기화
    gameActive = true;
    score = 0;
    gameStartTime = Date.now();
    scoreCount.textContent = "0";
    waitingForNextNote = false;
    consecutiveCorrectDetections = 0;
    lastTargetNote = null;
    successAnimationActive = false;
    isFirstNoteAfterStart = true; // 게임 시작 후 첫 번째 음표 설정임을 표시

    // 이전 타이머가 있다면 모두 제거
    if (noteSuccessTimer) {
      clearTimeout(noteSuccessTimer);
      noteSuccessTimer = null;
    }
    if (toleranceTimer) {
      clearTimeout(toleranceTimer);
      toleranceTimer = null;
    }

    // 애니메이션 클래스들 제거
    targetNote.classList.remove("success-animation", "fade-in");

    // 타이머와 게임 로직 시작
    updateTimer();
    generateNewTargetNote(); // 직접 새 목표음 생성 함수 호출
    detectBassNote();

    // 타이머 시작 (게임 시간 업데이트용)
    const timerInterval = setInterval(() => {
      if (!gameActive) {
        clearInterval(timerInterval); // 게임이 종료되면 타이머도 종료
        return;
      }
      updateTimer();
    }, 1000);
  }

  // 게임 종료 함수
  function endGame() {
    gameActive = false;

    // 진행 중인 타이머 제거
    if (noteSuccessTimer) {
      clearTimeout(noteSuccessTimer);
      noteSuccessTimer = null;
    }

    if (toleranceTimer) {
      clearTimeout(toleranceTimer);
      toleranceTimer = null;
    }

    stopAudioProcessing();

    // UI 초기화
    targetNote.textContent = "-";
    targetNote.dataset.description = "";

    // 버튼 상태 업데이트
    startButton.disabled = false;
    stopButton.disabled = true;

    // 결과 모달창 표시
    showResultModal();
  }

  // 타이머 업데이트 함수
  function updateTimer() {
    if (!gameActive) return;

    const elapsedTime = Math.floor((Date.now() - gameStartTime) / 1000);
    const minutes = Math.floor(elapsedTime / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (elapsedTime % 60).toString().padStart(2, "0");
    timeDisplay.textContent = `${minutes}:${seconds}`;
  } // 다음 목표 음 설정 - 플래그 관리 담당

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
    detectedNote.textContent = "-";
    detectedFrequency.textContent = "0 Hz";
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
    const thresholdYIN = isSafariBrowser ? 0.05 : 0.1;

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
    if (tau == maxPeriod || yinBuffer[tau] >= 0.5) {
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

    // 베이스 기타 주파수 범위 외의 주파수는 무시
    if (fundamentalFrequency < 40 || fundamentalFrequency > 135) {
      return null;
    }

    return fundamentalFrequency;
  }

  // 음이 목표 음과 일치하는지 확인하는 함수
  function checkNoteMatch(detectedNote) {
    if (!gameActive || waitingForNextNote || successAnimationActive) return;

    if (detectedNote === currentTargetNote) {
      consecutiveCorrectDetections++;

      // 인식 문제를 고려해 여러 번 연속 인식되어야 성공으로 처리

      // 필요한 횟수만큼 연속 인식되면 성공으로 처리
      if (consecutiveCorrectDetections >= requiredConsecutiveDetections) {
        noteSuccess();
      }
    } else {
      // 틀린 음을 연주한 경우
      consecutiveCorrectDetections = 0;

      // 틀려도 목표음이 바뀌지 않게 타이머 로직 제거
      // 이전에 설정된 타이머가 있다면 제거
      if (toleranceTimer) {
        clearTimeout(toleranceTimer);
        toleranceTimer = null;
      }
    }
  }

  // 음을 성공적으로 맞췄을 때의 처리
  function noteSuccess() {
    if (!gameActive) return; // 게임이 활성화된 상태일 때만 처리
    if (waitingForNextNote) return; // 이미 대기 중이면 중복 처리 방지

    console.log("성공! 타이머 초기화 및 점수 증가");

    // 진행 중인 타이머 제거
    if (toleranceTimer) {
      clearTimeout(toleranceTimer);
      toleranceTimer = null;
    }

    // 점수 증가
    score++;
    scoreCount.textContent = score.toString();

    // 상태 업데이트 - 다음 목표음으로 전환 중임을 표시
    waitingForNextNote = true;
    successAnimationActive = true;

    // 게임 시작 직후 첫 음표가 아닐 때만 Confetti 효과 실행
    if (!isFirstNoteAfterStart) {
      console.log("Confetti 효과 실행 시도...");
      try {
        // 기존 confetti 함수 실행
        confetti({
          particleCount: 300,
          spread: 100,
          origin: { y: 0.5 },
          colors: ["#4caf50", "#00bcd4", "#ff9800", "#f44336", "#9c27b0"],
          disableForReducedMotion: true, // 접근성 고려
          zIndex: 9999, // 앞쪽에 표시
        });

        // 전역 도우미 함수도 실행 (있는 경우)
        if (typeof window.showSuccessConfetti === "function") {
          window.showSuccessConfetti();
        }

        console.log("Confetti 효과 실행 성공!");
      } catch (error) {
        console.error("Confetti 효과 실행 중 오류:", error);
      }
    } else {
      console.log("게임 시작 후 첫 음표 설정 - Confetti 효과 생략");
    }

    // 현재 음에 성공 애니메이션 적용
    targetNote.classList.add("success-animation");

    // 이전 타이머가 있다면 제거
    if (noteSuccessTimer) {
      clearTimeout(noteSuccessTimer);
      noteSuccessTimer = null;
    }

    // 일정 시간 후 다음 문제로 - 직접 목표음 변경 함수 호출
    console.log("성공! 1.5초 후 다음 목표음으로 전환");
    noteSuccessTimer = setTimeout(function () {
      if (gameActive) {
        console.log("다음 목표음으로 전환 시작");
        // 목표음 변경 처리를 위한 플래그 재설정
        waitingForNextNote = false;
        successAnimationActive = false;

        // 애니메이션 클래스 제거
        targetNote.classList.remove("success-animation");

        // 이전 목표음을 현재 목표음으로 저장
        lastTargetNote = currentTargetNote;

        // 현재 목표음 초기화하여 강제로 새 음 선택하게 함
        currentTargetNote = "";

        // 다음 목표음 설정 직접 호출
        generateNewTargetNote();
      }
    }, 1500);
  }

  // 새로운 목표음 생성 함수 - setNextTargetNote와 분리하여 로직 단순화
  function generateNewTargetNote() {
    console.log("새로운 목표음 생성 중...");

    // 랜덤하게 다음 음 선택 (현재 음과 이전 음과 다른 음으로)
    let randomIndex;
    let attempts = 0;
    const maxAttempts = 10; // 무한 루프 방지를 위한 최대 시도 횟수

    do {
      randomIndex = Math.floor(Math.random() * bassNotes.length);
      attempts++;

      // 음의 수가 2개 이하인 경우 무한 루프 방지
      if (bassNotes.length <= 2 || attempts >= maxAttempts) {
        break;
      }
    } while (
      bassNotes[randomIndex].note === currentTargetNote || // 현재 목표음과 같은 경우
      bassNotes[randomIndex].note === lastTargetNote // 이전 목표음과 같은 경우
    );

    currentTargetNote = bassNotes[randomIndex].note;
    console.log("새 목표음 설정 완료:", currentTargetNote);

    // UI 업데이트
    targetNote.textContent = currentTargetNote;
    targetNote.dataset.description = bassNotes[randomIndex].description;
    targetNote.setAttribute("title", bassNotes[randomIndex].description);

    // 목표음에 fade-in 애니메이션 적용
    targetNote.classList.add("fade-in");
    setTimeout(() => {
      targetNote.classList.remove("fade-in");
    }, 700);

    // 상태 업데이트
    consecutiveCorrectDetections = 0;

    // 첫 음표 설정 후 플래그를 false로 변경
    if (isFirstNoteAfterStart) {
      isFirstNoteAfterStart = false;
    }
  }

  // 개선된 베이스 기타 음 감지 (메인 함수)
  function detectBassNote() {
    if (!analyser || !audioContext || !gameActive) {
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
        animationId = requestAnimationFrame(detectBassNote);
        return;
      }

      // 베이스 기타 음 결정
      let matchedNote = null;
      let matchSource = "";

      // 현의 기본 주파수 범위에 있는지 확인
      for (const bassNote of bassNotes) {
        const note = bassNote.note;
        const range = bassFrequencyRanges[note];

        // 주파수가 현의 허용 범위 내에 있는 경우
        if (detectedFreq >= range.min && detectedFreq <= range.max) {
          matchedNote = note;
          matchSource = "기본음";
          break;
        }
      }

      // 배음 검사
      if (!matchedNote) {
        let bestMatch = null;
        let bestMatchScore = 0;

        for (const bassNote of bassNotes) {
          const note = bassNote.note;
          const targetFreq = bassNote.frequency;

          // 분수 관계 확인 - 배음 관계
          const ratio = detectedFreq / targetFreq;
          const nearestHarmonic = Math.round(ratio);

          // 유효한 배음 관계인지 확인 (2-5배음만 확인)
          if (nearestHarmonic >= 2 && nearestHarmonic <= 5) {
            // 얼마나 정확히 배음 관계에 있는지 계산
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
        }
      }

      // 최종 결과 안정화 (히스토리 기반)
      if (matchedNote) {
        lastDetectedNotes.push(matchedNote);
        if (lastDetectedNotes.length > 5) {
          lastDetectedNotes.shift();
        }

        // 가장 빈번하게 나타난 음 선택
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

        // 최종 선택된 음
        const finalNote = mostFrequentNote;

        // UI 업데이트
        detectedNote.textContent = finalNote;
        detectedFrequency.textContent = `${detectedFreq.toFixed(2)} Hz`;

        // 게임 로직 - 음이 목표 음과 일치하는지 확인
        checkNoteMatch(finalNote);
      } else {
        // 범위 밖의 주파수인 경우
        detectedNote.textContent = "-";
        detectedFrequency.textContent = `${detectedFreq.toFixed(
          2
        )} Hz (범위 외)`;
      }
    } catch (error) {
      console.error("베이스 음 감지 오류:", error);
    }

    // 다음 프레임에서 재호출
    animationId = requestAnimationFrame(detectBassNote);
  }

  // 오류 처리
  window.addEventListener("error", (event) => {
    console.error("오류 발생:", event);
  });

  // 결과 모달창 표시 함수
  function showResultModal() {
    // 결과 데이터 업데이트
    const totalScore = score;
    const totalTime = timeDisplay.textContent;

    finalScore.textContent = totalScore;
    finalTime.textContent = totalTime;

    // 높은 점수에는 축하 confetti
    if (totalScore >= 20) {
      try {
        confetti({
          particleCount: 200,
          spread: 160,
          origin: { y: 0.3 },
          colors: ["#4caf50", "#00bcd4", "#ff9800", "#f44336", "#9c27b0"],
        });
      } catch (error) {
        console.error("Confetti 효과 실행 중 오류:", error);
      }
    }

    // 모달창 표시 (애니메이션 효과와 함께)
    resultModal.style.display = "block";
    setTimeout(() => {
      resultModal.classList.add("show");
    }, 10);
  }

  // 모달창 닫기
  closeBtn.addEventListener("click", () => {
    resultModal.classList.remove("show");
    setTimeout(() => {
      resultModal.style.display = "none";
    }, 300);
  });

  // 모달창 바깥 클릭 시 닫기
  window.addEventListener("click", (event) => {
    if (event.target === resultModal) {
      resultModal.classList.remove("show");
      setTimeout(() => {
        resultModal.style.display = "none";
      }, 300);
    }
  });

  // 다시 시작 버튼
  restartButton.addEventListener("click", () => {
    resultModal.classList.remove("show");
    setTimeout(() => {
      resultModal.style.display = "none";
      startButton.click(); // 게임 시작 버튼 자동 클릭
    }, 300);
  });
});
