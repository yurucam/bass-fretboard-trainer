import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import confetti from "canvas-confetti";
import SheetMusicViewer from "./SheetMusicViewer";
import TuningSettings from "./TuningSettings";
import KeySignatureSettings from "./KeySignatureSettings";
import { useAudioInput } from "./hooks/useAudioInput";
import {
  generateRandomBassNotes,
  generateMusicXML,
  type BassTuning,
  type KeySignature,
  PRESET_TUNINGS,
  PRESET_KEY_SIGNATURES,
  setTuning,
  setKeySignature,
} from "./bassNoteGenerator";

// localStorage 키들
const STORAGE_KEYS = {
  TUNING: "bass-trainer-tuning",
  MIN_FRET: "bass-trainer-min-fret",
  MAX_FRET: "bass-trainer-max-fret",
  SHOW_NOTE_NAMES: "bass-trainer-show-note-names",
  KEY_SIGNATURE: "bass-trainer-key-signature",
};

function App() {
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showTuningSettings, setShowTuningSettings] = useState(false);
  const [showKeySignatureSettings, setShowKeySignatureSettings] =
    useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isTrainingActive, setIsTrainingActive] = useState(false);
  const [score, setScore] = useState(0);

  // localStorage에서 설정 불러오기
  const [currentTuning, setCurrentTuning] = useState<BassTuning>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TUNING);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return PRESET_TUNINGS[0];
      }
    }
    return PRESET_TUNINGS[0];
  });

  const [minFret, setMinFret] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MIN_FRET);
    return saved ? parseInt(saved) : 0;
  });

  const [maxFret, setMaxFret] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MAX_FRET);
    return saved ? parseInt(saved) : 12;
  });

  const [showNoteNames, setShowNoteNames] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHOW_NOTE_NAMES);
    return saved ? JSON.parse(saved) : true;
  });

  const [currentKeySignature, setCurrentKeySignature] = useState<KeySignature>(
    () => {
      const saved = localStorage.getItem(STORAGE_KEYS.KEY_SIGNATURE);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return PRESET_KEY_SIGNATURES[0];
        }
      }
      return PRESET_KEY_SIGNATURES[0];
    }
  );

  // 랜덤 음표들 생성 (8마디 = 32개 음표) - 튜닝, 프렛 수, 조표, refreshKey가 바뀔 때만 새로 생성
  const randomNotes = useMemo(() => {
    return generateRandomBassNotes(
      32,
      currentTuning,
      maxFret,
      currentKeySignature,
      minFret
    );
  }, [currentTuning, maxFret, minFret, currentKeySignature, refreshKey]);

  // 최신 randomNotes를 참조하기 위한 ref
  const randomNotesRef = useRef(randomNotes);
  randomNotesRef.current = randomNotes;

  // MusicXML 생성 - 음표명 표시 여부, 조표가 바뀔 때만 다시 생성
  const musicXmlContent = useMemo(() => {
    return generateMusicXML(randomNotes, showNoteNames, currentKeySignature);
  }, [randomNotes, showNoteNames, currentKeySignature]);

  // 음표 감지 처리 함수
  const handleNoteDetected = useCallback(
    (detectedNote: { note: string }) => {
      setCursorPosition((currentPos) => {
        // 최신 randomNotes를 참조
        const currentRandomNotes = randomNotesRef.current;

        // 현재 커서 위치의 음표 가져오기
        const currentNote = currentRandomNotes[currentPos];
        if (!currentNote) return currentPos;

        // 타겟 음표 문자열 생성
        const currentTargetNoteString =
          currentNote.step +
          (currentNote.alter === 1
            ? "#"
            : currentNote.alter === -1
            ? "♭"
            : "") +
          (currentNote.octave - 1); // 베이스 악보는 1옥타브 위로 표기

        // 현재 커서 위치의 음과 감지된 음이 일치하는지 확인
        if (detectedNote.note === currentTargetNoteString) {
          // 음이 일치하면 점수 증가
          setScore((prev) => prev + 1);

          if (currentPos < currentRandomNotes.length - 1) {
            // 다음 음표로 이동
            return currentPos + 1;
          } else {
            // 모든 음표를 완료했으면 confetti 효과와 함께 새로운 악보 생성
            confetti({
              particleCount: 100,
              spread: 200,
            });
            setRefreshKey((prev) => prev + 1);
            setScore(0);
            return 0;
          }
        }

        return currentPos;
      });
    },
    [] // 의존성 배열을 비워서 콜백이 재생성되지 않도록 함
  );

  // 오디오 입력 훅 설정
  const audioInput = useAudioInput({
    tuning: currentTuning,
    maxFret: maxFret,
    minFret: minFret,
    onNoteDetected: handleNoteDetected,
    requiredConsecutiveDetections: 3,
  });

  const handleTuningChange = (newTuning: BassTuning) => {
    setCurrentTuning(newTuning);
    setTuning(newTuning);
    localStorage.setItem(STORAGE_KEYS.TUNING, JSON.stringify(newTuning));
    setRefreshKey((prev) => prev + 1); // 새로운 음표 생성을 위해 리프레시
  };

  const handleMinFretChange = (newMinFret: number) => {
    // 시작 프렛이 끝 프렛보다 작거나 같아야 함
    if (newMinFret > maxFret) {
      return; // 유효하지 않은 값이면 변경하지 않음
    }
    setMinFret(newMinFret);
    localStorage.setItem(STORAGE_KEYS.MIN_FRET, newMinFret.toString());
    setRefreshKey((prev) => prev + 1); // 새로운 음표 생성을 위해 리프레시
  };

  const handleMaxFretChange = (newMaxFret: number) => {
    // 끝 프렛이 시작 프렛보다 크거나 같아야 함
    if (newMaxFret < minFret) {
      return; // 유효하지 않은 값이면 변경하지 않음
    }
    setMaxFret(newMaxFret);
    localStorage.setItem(STORAGE_KEYS.MAX_FRET, newMaxFret.toString());
    setRefreshKey((prev) => prev + 1); // 새로운 음표 생성을 위해 리프레시
  };

  const handleShowNoteNamesToggle = () => {
    const newValue = !showNoteNames;
    setShowNoteNames(newValue);
    localStorage.setItem(
      STORAGE_KEYS.SHOW_NOTE_NAMES,
      JSON.stringify(newValue)
    );
    // refreshKey를 변경하지 않음 - 같은 악보에서 음표명만 토글
  };

  const handleKeySignatureChange = (newKeySignature: KeySignature) => {
    setCurrentKeySignature(newKeySignature);
    setKeySignature(newKeySignature);
    localStorage.setItem(
      STORAGE_KEYS.KEY_SIGNATURE,
      JSON.stringify(newKeySignature)
    );
    setRefreshKey((prev) => prev + 1); // 새로운 음표 생성을 위해 리프레시
  };

  const handleNewExercise = () => {
    setRefreshKey((prev) => prev + 1);
    setCursorPosition(0);
    setScore(0);
  };

  // 오디오 훈련 시작
  const handleStartTraining = async () => {
    try {
      await audioInput.initialize();
      audioInput.startDetection();
      setIsTrainingActive(true);
      setCursorPosition(0);
      setScore(0);
    } catch (error) {
      console.error("오디오 훈련 시작 실패:", error);
    }
  };

  // 오디오 훈련 중지
  const handleStopTraining = () => {
    audioInput.stopDetection();
    setIsTrainingActive(false);
  };

  // 키보드 단축키 (설정 관련만 유지)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        setShowTuningSettings(true);
      } else if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setShowKeySignatureSettings(true);
      } else if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        handleNewExercise();
      } else if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        handleShowNoteNamesToggle();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showNoteNames]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 악보 영역 */}
      <div
        style={{
          flex: 1,
          padding: "20px",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        <SheetMusicViewer
          musicXmlContent={musicXmlContent}
          cursorPosition={cursorPosition}
        />
      </div>

      {/* 하단 컨트롤 바 */}
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "12px 16px",
          borderTop: "1px solid #e0e0e0",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {/* 첫 번째 줄: 제목과 상태 정보 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
            minHeight: "24px",
          }}
        >
          <span
            style={{
              color: "#666",
              fontSize: "12px",
              padding: "3px 6px",
              backgroundColor: "#f0f0f0",
              borderRadius: "4px",
            }}
          >
            {currentTuning.name}
          </span>
          <span
            style={{
              color: "#666",
              fontSize: "12px",
              padding: "3px 6px",
              backgroundColor: "#e8f4f8",
              borderRadius: "4px",
            }}
          >
            {minFret}-{maxFret}프렛
          </span>
          <span
            style={{
              color: "#666",
              fontSize: "12px",
              padding: "3px 6px",
              backgroundColor: "#f0e8ff",
              borderRadius: "4px",
            }}
          >
            {currentKeySignature.name.split(" / ")[0]}
          </span>
          <span
            style={{
              color: "#666",
              fontSize: "12px",
              padding: "3px 6px",
              backgroundColor: showNoteNames ? "#e8f5e8" : "#f5e8e8",
              borderRadius: "4px",
            }}
          >
            음표명: {showNoteNames ? "ON" : "OFF"}
          </span>

          {/* 점수 표시 */}
          <span
            style={{
              color: "#333",
              fontSize: "14px",
              padding: "4px 8px",
              backgroundColor: "#fff3cd",
              borderRadius: "4px",
              fontWeight: "bold",
            }}
          >
            점수: {score}
          </span>

          {/* 실시간 음 감지 결과 */}
          <span
            style={{
              color: audioInput.detectedNote ? "#28a745" : "#6c757d",
              fontSize: "12px",
              padding: "3px 6px",
              backgroundColor: audioInput.detectedNote ? "#d4edda" : "#f8f9fa",
              borderRadius: "4px",
              minWidth: "80px",
              textAlign: "center",
            }}
          >
            감지: {audioInput.detectedNote?.note || "-"}
          </span>

          {/* 주파수 표시 */}
          <span
            style={{
              color: "#666",
              fontSize: "11px",
              padding: "2px 4px",
              backgroundColor: "#f8f9fa",
              borderRadius: "3px",
            }}
          >
            {audioInput.detectedFrequency
              ? `${audioInput.detectedFrequency.toFixed(1)}Hz`
              : "0Hz"}
          </span>
        </div>

        {/* 두 번째 줄: 컨트롤 버튼들 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          {/* 프렛 범위 조절 */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ fontSize: "12px", color: "#666" }}>
              시작 프렛:
            </label>
            <select
              value={minFret}
              onChange={(e) => handleMinFretChange(parseInt(e.target.value))}
              style={{
                padding: "4px 8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              {Array.from({ length: 25 }, (_, i) => i).map((fret) => (
                <option key={fret} value={fret}>
                  {fret}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ fontSize: "12px", color: "#666" }}>끝 프렛:</label>
            <select
              value={maxFret}
              onChange={(e) => handleMaxFretChange(parseInt(e.target.value))}
              style={{
                padding: "4px 8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              {Array.from({ length: 25 }, (_, i) => i).map((fret) => (
                <option key={fret} value={fret}>
                  {fret}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleShowNoteNamesToggle}
            style={{
              padding: "6px 12px",
              border: `2px solid ${showNoteNames ? "#28a745" : "#6c757d"}`,
              borderRadius: "6px",
              backgroundColor: showNoteNames ? "#28a745" : "#6c757d",
              color: "white",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            음표명 (L)
          </button>

          {/* 오디오 훈련 시작/중지 버튼 */}
          <button
            onClick={
              isTrainingActive ? handleStopTraining : handleStartTraining
            }
            disabled={audioInput.error !== null}
            style={{
              padding: "6px 12px",
              border: `2px solid ${isTrainingActive ? "#dc3545" : "#007bff"}`,
              borderRadius: "6px",
              backgroundColor: isTrainingActive ? "#dc3545" : "#007bff",
              color: "white",
              cursor: audioInput.error ? "not-allowed" : "pointer",
              fontSize: "12px",
              fontWeight: "bold",
              opacity: audioInput.error ? 0.6 : 1,
            }}
          >
            {isTrainingActive ? "중지" : "시작"}
          </button>

          <button
            onClick={handleNewExercise}
            style={{
              padding: "6px 12px",
              border: "2px solid #28a745",
              borderRadius: "6px",
              backgroundColor: "#28a745",
              color: "white",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            새 연습 (N)
          </button>

          <button
            onClick={() => setShowTuningSettings(true)}
            style={{
              padding: "6px 12px",
              border: "2px solid #007bff",
              borderRadius: "6px",
              backgroundColor: "#007bff",
              color: "white",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            튜닝 설정 (T)
          </button>

          <button
            onClick={() => setShowKeySignatureSettings(true)}
            style={{
              padding: "6px 12px",
              border: "2px solid #6f42c1",
              borderRadius: "6px",
              backgroundColor: "#6f42c1",
              color: "white",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            조표 설정 (K)
          </button>
        </div>
      </div>

      {/* 오디오 에러 메시지 */}
      {audioInput.error && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "#f8d7da",
            color: "#721c24",
            padding: "12px 20px",
            borderRadius: "8px",
            border: "1px solid #f5c6cb",
            zIndex: 200,
            maxWidth: "500px",
            textAlign: "center",
            fontSize: "14px",
          }}
        >
          <strong>오디오 오류:</strong> {audioInput.error}
          <br />
          <small>마이크 권한을 확인하고 다시 시도해주세요.</small>
        </div>
      )}

      {/* 튜닝 설정 모달 */}
      {showTuningSettings && (
        <TuningSettings
          currentTuning={currentTuning}
          onTuningChange={handleTuningChange}
          onClose={() => setShowTuningSettings(false)}
        />
      )}

      {/* 조표 설정 모달 */}
      {showKeySignatureSettings && (
        <KeySignatureSettings
          currentKeySignature={currentKeySignature}
          onKeySignatureChange={handleKeySignatureChange}
          onClose={() => setShowKeySignatureSettings(false)}
        />
      )}
    </div>
  );
}

export default App;
