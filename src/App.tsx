import { useState, useEffect } from "react";
import SheetMusicViewer from "./SheetMusicViewer";

function App() {
  const [cursorPosition, setCursorPosition] = useState(0);

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
      }}
    >
      <SheetMusicViewer
        musicXmlUrl="/src/bassClefScore.xml"
        cursorPosition={cursorPosition}
      />
    </div>
  );
}

export default App;
