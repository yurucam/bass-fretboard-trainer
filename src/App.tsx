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
      <SheetMusicViewer
        musicXmlContent={musicXmlContent}
        cursorPosition={cursorPosition}
      />
    </div>
  );
}

export default App;
