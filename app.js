// 전역 변수 설정
let audioContext;
let analyzer;
let microphone;
let isRecording = false;
let canvasContext;
let canvas;
let animationFrame;
let currentQuizNote = '';
let score = 0;
let audioBuffer = [];

// 베이스 음계 데이터 (E, A, D, G 현 별 음계 정보)
const bassNotes = {
    'E': ['E', 'F', 'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B', 'C', 'C#/Db', 'D', 'D#/Eb', 'E'],
    'A': ['A', 'A#/Bb', 'B', 'C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab', 'A'],
    'D': ['D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B', 'C', 'C#/Db', 'D'],
    'G': ['G', 'G#/Ab', 'A', 'A#/Bb', 'B', 'C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G'],
};

// 기본 음의 주파수 (4번 현 E (E2) 부터 시작)
const baseFrequencies = {
    'E2': 82.41,
    'F2': 87.31,
    'F#2/Gb2': 92.50,
    'G2': 98.00,
    'G#2/Ab2': 103.83,
    'A2': 110.00,
    'A#2/Bb2': 116.54,
    'B2': 123.47,
    'C3': 130.81,
    'C#3/Db3': 138.59,
    'D3': 146.83,
    'D#3/Eb3': 155.56,
    'E3': 164.81,
    'F3': 174.61,
    'F#3/Gb3': 185.00,
    'G3': 196.00,
    'G#3/Ab3': 207.65,
    'A3': 220.00,
    'A#3/Bb3': 233.08,
    'B3': 246.94,
    'C4': 261.63,
    'C#4/Db4': 277.18,
    'D4': 293.66,
    'D#4/Eb4': 311.13,
    'E4': 329.63,
    'F4': 349.23,
    'F#4/Gb4': 369.99,
    'G4': 392.00
};

// 주파수로 음 이름 찾기
const getNoteFromFrequency = (frequency) => {
    if (!frequency || frequency <= 0) return null;
    
    // 주파수를 MIDI 노트 번호로 변환
    // A4(440Hz)는 MIDI 노트 번호 69
    const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2)) + 69;
    
    // 가장 가까운 반음 구하기
    const noteNumRounded = Math.round(noteNum);
    
    // MIDI 노트 번호에서 음 이름 추출 (C=0, C#=1, ... B=11)
    const octave = Math.floor(noteNumRounded / 12) - 1;
    const noteIndex = noteNumRounded % 12;
    
    // 음 이름 배열
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteName = noteNames[noteIndex];
    
    // 베이스 기타의 음역만 고려
    if (octave < 1 || octave > 4) return null;
    
    // 주파수 정확도 계산 (반음 차이가 너무 크면 무시)
    const cents = 100 * (noteNum - noteNumRounded);
    if (Math.abs(cents) > 50) return null;
    
    return noteName + octave;
};

// 지판 초기화 함수
function initializeFretboard() {
    const fretboard = document.querySelector('.fretboard');
    fretboard.innerHTML = '';
    
    // 12개의 프렛 생성
    for (let i = 0; i <= 12; i++) {
        const fret = document.createElement('div');
        fret.className = 'fret';
        
        // 프렛 번호 표시
        const fretNumber = document.createElement('div');
        fretNumber.className = 'fret-number';
        fretNumber.textContent = i;
        fret.appendChild(fretNumber);
        
        // 프렛 마커 추가 (특정 프렛에만)
        if ([3, 5, 7, 9, 12].includes(i)) {
            const marker = document.createElement('div');
            marker.className = 'fret-marker';
            fret.appendChild(marker);
        }
        
        // 각 현(string)의 음 추가
        for (const string of ['G', 'D', 'A', 'E']) {
            const stringNote = document.createElement('div');
            stringNote.className = 'string-note';
            
            // 음표 서클 (원)
            const noteCircle = document.createElement('div');
            noteCircle.className = 'note-circle';
            noteCircle.textContent = bassNotes[string][i].split('/')[0];
            noteCircle.dataset.note = bassNotes[string][i].split('/')[0];
            noteCircle.dataset.string = string;
            noteCircle.dataset.fret = i;
            
            // 클릭 이벤트 추가
            noteCircle.addEventListener('click', () => {
                playNote(string, i);
            });
            
            stringNote.appendChild(noteCircle);
            fret.appendChild(stringNote);
        }
        
        fretboard.appendChild(fret);
    }
}

// 음 재생 함수 (클릭했을 때 소리 재생)
function playNote(string, fret) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // 베이스 기타 현과 프렛에 따른 주파수 계산
    const baseNote = string + (string === 'G' ? '3' : string === 'D' ? '3' : string === 'A' ? '2' : '2');
    const baseFreq = baseFrequencies[baseNote];
    const freq = baseFreq * Math.pow(2, fret/12);
    
    oscillator.type = 'sawtooth'; // 베이스 같은 소리를 위해 sawtooth 파형 사용
    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
    
    // 소리 볼륨 및 ADSR 엔벨로프 설정
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1);
    
    // 연결 및 재생
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 1);
}

// 퀴즈 시작 함수
function startQuiz() {
    resetQuiz();
    chooseRandomNote();
    highlightTargetNote();
    
    document.getElementById('feedback').className = 'feedback';
    document.getElementById('feedback').innerHTML = '<span class="feedback-text">연주를 시작하세요...</span>';
}

// 퀴즈 초기화
function resetQuiz() {
    score = 0;
    document.getElementById('score-value').textContent = score;
    clearHighlights();
}

// 랜덤 노트 선택 함수
function chooseRandomNote() {
    const strings = ['E', 'A', 'D', 'G'];
    const randomString = strings[Math.floor(Math.random() * strings.length)];
    const randomFret = Math.floor(Math.random() * 12);
    
    currentQuizNote = bassNotes[randomString][randomFret].split('/')[0];
    document.getElementById('target-note').textContent = currentQuizNote;
}

// 정답 노트 하이라이트 함수
function highlightTargetNote() {
    clearHighlights();
    
    // 모든 해당 노트에 target 클래스 추가
    document.querySelectorAll('.note-circle').forEach(note => {
        if (note.dataset.note === currentQuizNote) {
            note.classList.add('target');
        }
    });
}

// 하이라이트 제거 함수
function clearHighlights() {
    document.querySelectorAll('.note-circle').forEach(note => {
        note.classList.remove('target');
    });
}

// 정답 듣기 함수
function listenToAnswer() {
    // 모든 가능한 현과 프렛 조합을 확인
    for (const string of ['G', 'D', 'A', 'E']) {
        for (let fret = 0; fret <= 12; fret++) {
            if (bassNotes[string][fret].split('/')[0] === currentQuizNote) {
                // 처음 찾은 조합으로 소리 재생
                playNote(string, fret);
                return;
            }
        }
    }
}

// 녹음 시작/종료 함수
async function toggleRecording() {
    const recordBtn = document.getElementById('record-btn');
    
    if (!isRecording) {
        // 녹음 시작
        try {
            // 오디오 컨텍스트 초기화
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // 마이크 접근 요청
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            microphone = audioContext.createMediaStreamSource(stream);
            analyzer = audioContext.createAnalyser();
            analyzer.fftSize = 2048;
            analyzer.smoothingTimeConstant = 0.8;
            
            microphone.connect(analyzer);
            
            // 캔버스 초기화
            canvas = document.getElementById('audio-canvas');
            canvasContext = canvas.getContext('2d');
            
            // 녹음 상태 변경
            isRecording = true;
            recordBtn.textContent = '녹음 중지';
            recordBtn.classList.add('recording');
            
            // 오디오 분석 시작
            analyzeAudio();
            
            // 피드백 초기화
            document.getElementById('feedback').className = 'feedback';
            document.getElementById('feedback').innerHTML = '<span class="feedback-text">연주 중입니다...</span>';
            
        } catch (err) {
            console.error('마이크 접근 오류:', err);
            alert('마이크에 접근할 수 없습니다. 권한을 확인해주세요.');
        }
    } else {
        // 녹음 종료
        isRecording = false;
        recordBtn.textContent = '녹음 시작';
        recordBtn.classList.remove('recording');
        
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
        
        // 마이크 연결 해제
        if (microphone) {
            microphone.disconnect();
            microphone = null;
        }
        
        // 결과 평가
        evaluateResult();
        
        // 새로운 문제 출제
        setTimeout(() => {
            chooseRandomNote();
            highlightTargetNote();
        }, 2000);
    }
}

// 오디오 분석 함수
function analyzeAudio() {
    const bufferLength = analyzer.frequencyBinCount;
    const timeDataArray = new Float32Array(bufferLength);
    const freqDataArray = new Float32Array(analyzer.frequencyBinCount);
    
    function draw() {
        animationFrame = requestAnimationFrame(draw);
        
        // 오디오 데이터 가져오기 (시간 도메인)
        analyzer.getFloatTimeDomainData(timeDataArray);
        
        // 주파수 데이터 가져오기 (주파수 도메인)
        analyzer.getFloatFrequencyData(freqDataArray);
        
        // 직접 구현된 피치 감지 알고리즘 사용
        const pitch = detectPitch(timeDataArray, audioContext.sampleRate);
        
        if (pitch > 0) {
            const detectedNote = getNoteFromFrequency(pitch);
            
            if (detectedNote) {
                document.getElementById('detected-note-value').textContent = detectedNote;
                
                // 감지된 음 기록 (최근 10개)
                audioBuffer.push(detectedNote);
                if (audioBuffer.length > 10) audioBuffer.shift();
            }
        }
        
        // 캔버스 시각화
        canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        canvasContext.lineWidth = 2;
        canvasContext.strokeStyle = '#3498db';
        canvasContext.beginPath();
        
        const sliceWidth = canvas.width / bufferLength;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            const v = timeDataArray[i] * 50;
            const y = canvas.height / 2 + v;
            
            if (i === 0) {
                canvasContext.moveTo(x, y);
            } else {
                canvasContext.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        canvasContext.lineTo(canvas.width, canvas.height / 2);
        canvasContext.stroke();
    }
    
    draw();
}

// 자동 상관 함수를 사용한 피치 감지 함수
function detectPitch(buffer, sampleRate) {
    // 신호 파워가 일정 임계값 이상인지 확인 (소리가 있는지 확인)
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
        sum += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sum / buffer.length);
    
    // 임계값보다 낮으면 소리가 없는 것으로 간주
    if (rms < 0.01) return -1;
    
    // 자동 상관 함수를 사용한 피치 감지
    const ACF = []; // 자동 상관 함수 배열
    const SIZE = buffer.length;
    
    // 최대 지연 크기 (계산 효율성을 위해)
    const MAX_LAG = Math.floor(SIZE / 2);
    
    // 자동 상관 함수 계산
    for (let lag = 0; lag < MAX_LAG; lag++) {
        let sum = 0;
        for (let i = 0; i < SIZE - lag; i++) {
            sum += buffer[i] * buffer[i + lag];
        }
        ACF[lag] = sum;
    }
    
    // 첫 번째 피크를 건너뛰고 두 번째 피크를 찾음
    // 첫 번째 피크는 항상 지연이 0일 때임
    let maxIndex = 0;
    let maxValue = ACF[0];
    
    // 첫 번째 제로 크로싱 찾기 (ACF 값이 0 이하로 떨어지는 지점)
    let zeroCrossing = 0;
    for (let i = 1; i < MAX_LAG; i++) {
        if (ACF[i] <= 0) {
            zeroCrossing = i;
            break;
        }
    }
    
    // 피크 찾기 (첫 번째 제로 크로싱 이후)
    for (let i = zeroCrossing; i < MAX_LAG; i++) {
        if (ACF[i] > maxValue) {
            maxValue = ACF[i];
            maxIndex = i;
        }
    }
    
    // 주파수 계산 (Hz)
    return maxIndex > 0 ? sampleRate / maxIndex : -1;
}

// 결과 평가 함수
function evaluateResult() {
    const feedback = document.getElementById('feedback');
    
    if (audioBuffer.length === 0) {
        feedback.className = 'feedback wrong';
        feedback.innerHTML = '<span class="feedback-text">소리가 감지되지 않았습니다. 다시 시도해주세요.</span>';
        return;
    }
    
    // 가장 많이 감지된 음 찾기
    const frequency = {};
    let maxCount = 0;
    let mostFrequentNote = null;
    
    audioBuffer.forEach(note => {
        // 옥타브 정보 제거 (E3 -> E)
        const baseNote = note.replace(/\d+$/, '');
        
        if (!frequency[baseNote]) frequency[baseNote] = 0;
        frequency[baseNote]++;
        
        if (frequency[baseNote] > maxCount) {
            maxCount = frequency[baseNote];
            mostFrequentNote = baseNote;
        }
    });
    
    // 정답 확인
    if (mostFrequentNote === currentQuizNote) {
        score++;
        document.getElementById('score-value').textContent = score;
        
        feedback.className = 'feedback correct';
        feedback.innerHTML = '<span class="feedback-text">정답입니다!</span>';
    } else {
        feedback.className = 'feedback wrong';
        feedback.innerHTML = `<span class="feedback-text">오답입니다. 정답은 ${currentQuizNote}입니다.</span>`;
    }
    
    // 버퍼 초기화
    audioBuffer = [];
}

// 페이지 로드시 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 지판 초기화
    initializeFretboard();
    
    // 이벤트 리스너 등록
    document.getElementById('start-btn').addEventListener('click', startQuiz);
    document.getElementById('listen-btn').addEventListener('click', listenToAnswer);
    document.getElementById('record-btn').addEventListener('click', toggleRecording);
    
    // 캔버스 초기화
    canvas = document.getElementById('audio-canvas');
    canvasContext = canvas.getContext('2d');
    canvasContext.fillStyle = '#f9f9f9';
    canvasContext.fillRect(0, 0, canvas.width, canvas.height);
    
    // 초기 퀴즈 시작
    startQuiz();
});
