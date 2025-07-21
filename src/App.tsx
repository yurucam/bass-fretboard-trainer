import { useState, useEffect, useMemo } from "react";
import SheetMusicViewer from "./SheetMusicViewer";
import TuningSettings from "./TuningSettings";
import {
  generateRandomBassNotes,
  generateMusicXML,
  type BassTuning,
  PRESET_TUNINGS,
  setTuning,
} from "./bassNoteGenerator";

// localStorage 키들
const STORAGE_KEYS = {
  TUNING: "bass-trainer-tuning",
  MAX_FRET: "bass-trainer-max-fret",
  SHOW_NOTE_NAMES: "bass-trainer-show-note-names",
};

function App() {
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showTuningSettings, setShowTuningSettings] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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

  const [maxFret, setMaxFret] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MAX_FRET);
    return saved ? parseInt(saved) : 12;
  });

  const [showNoteNames, setShowNoteNames] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHOW_NOTE_NAMES);
    return saved ? JSON.parse(saved) : true;
  });

  // 랜덤 음표들 생성 (8마디 = 32개 음표) - 튜닝, 프렛 수, refreshKey가 바뀔 때만 새로 생성
  const randomNotes = useMemo(() => {
    return generateRandomBassNotes(32, currentTuning, maxFret);
  }, [currentTuning, maxFret, refreshKey]);

  // MusicXML 생성 - 음표명 표시 여부가 바뀔 때만 다시 생성
  const musicXmlContent = useMemo(() => {
    return generateMusicXML(randomNotes, showNoteNames);
  }, [randomNotes, showNoteNames]);

  const handleTuningChange = (newTuning: BassTuning) => {
    setCurrentTuning(newTuning);
    setTuning(newTuning);
    localStorage.setItem(STORAGE_KEYS.TUNING, JSON.stringify(newTuning));
    setRefreshKey((prev) => prev + 1); // 새로운 음표 생성을 위해 리프레시
  };

  const handleMaxFretChange = (newMaxFret: number) => {
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

  const handleNewExercise = () => {
    setRefreshKey((prev) => prev + 1);
    setCursorPosition(0);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setCursorPosition((prev) => Math.max(0, prev - 1));
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setCursorPosition((prev) => prev + 1);
      } else if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        setShowTuningSettings(true);
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
        position: "relative",
      }}
    >
      {/* 상단 컨트롤 바 */}
      <div
        style={{
          position: "fixed",
          top: "10px",
          left: "10px",
          right: "10px",
          zIndex: 100,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          padding: "8px 16px",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
          backdropFilter: "blur(5px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <h3 style={{ margin: 0, color: "#333", fontSize: "18px" }}>
            베이스 프렛보드 트레이너
          </h3>
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
            {maxFret}프렛
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
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* 프렛 수 조절 */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ fontSize: "12px", color: "#666" }}>프렛:</label>
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
              {Array.from({ length: 20 }, (_, i) => i + 5).map((fret) => (
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
        </div>
      </div>

      {/* 키보드 단축키 안내 */}
      <div
        style={{
          position: "fixed",
          bottom: "10px",
          left: "10px",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          color: "white",
          padding: "6px 10px",
          borderRadius: "6px",
          fontSize: "11px",
          zIndex: 100,
        }}
      >
        ← → : 이동 | T : 튜닝 설정 | N : 새 연습 | L : 음표명 토글
      </div>

      <div style={{ paddingTop: "70px" }}>
        <SheetMusicViewer
          musicXmlContent={musicXmlContent}
          cursorPosition={cursorPosition}
        />
      </div>

      {/* 튜닝 설정 모달 */}
      {showTuningSettings && (
        <TuningSettings
          currentTuning={currentTuning}
          onTuningChange={handleTuningChange}
          onClose={() => setShowTuningSettings(false)}
        />
      )}
    </div>
  );
}

export default App;
