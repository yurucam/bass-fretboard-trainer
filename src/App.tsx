import SheetMusicViewer from "./SheetMusicViewer";

function App() {
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
      <SheetMusicViewer musicXmlUrl="/src/bassClefScore.xml" />
    </div>
  );
}

export default App;
