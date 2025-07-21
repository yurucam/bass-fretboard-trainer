import { useState, useEffect, useMemo } from "react";
import SheetMusicViewer from "./SheetMusicViewer";
import { generateRandomBassNotes, generateMusicXML } from "./bassNoteGenerator";

function App() {
  const [cursorPosition, setCursorPosition] = useState(0);

  // 랜덤 음표들과 MusicXML 생성 (8마디 = 32개 음표)
  const musicXmlContent = useMemo(() => {
    const randomNotes = generateRandomBassNotes(32);
    return generateMusicXML(randomNotes);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setCursorPosition((prev) => Math.max(0, prev - 1));
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setCursorPosition((prev) => prev + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
      {/* 컨트롤 패널 */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          zIndex: 1000,
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          padding: "10px",
          borderRadius: "5px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ marginBottom: "5px", fontSize: "12px" }}>
          <strong>조작법:</strong>
        </div>
        <div style={{ fontSize: "11px", lineHeight: "1.3" }}>
          ← → : 커서 이동
        </div>
      </div>

      <SheetMusicViewer
        musicXmlContent={musicXmlContent}
        cursorPosition={cursorPosition}
      />
    </div>
  );
}

export default App;
