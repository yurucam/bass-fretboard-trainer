import React, { useRef, useEffect } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";

interface SheetMusicViewerProps {
  musicXmlContent: string;
  cursorPosition: number;
}

const SheetMusicViewer: React.FC<SheetMusicViewerProps> = ({
  musicXmlContent,
  cursorPosition,
}) => {
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);

  const loadAndRenderScore = async (osmd: OpenSheetMusicDisplay) => {
    try {
      // MusicXML 문자열을 직접 로드
      await osmd.load(musicXmlContent);

      // 악보 렌더링
      osmd.render();

      // 커서를 첫 번째 위치로 초기화
      osmd.cursor.show();
      osmd.cursor.reset();
    } catch (error) {
      console.error("악보 로드 중 오류 발생:", error);
    }
  };

  // 커서 위치 업데이트 효과
  useEffect(() => {
    if (osmdRef.current && osmdRef.current.Sheet) {
      // 커서를 해당 위치로 이동
      osmdRef.current.cursor.show();
      osmdRef.current.cursor.reset();

      // 지정된 위치만큼 커서 이동
      for (let i = 0; i < cursorPosition; i++) {
        osmdRef.current.cursor.next();
      }
    }
  }, [cursorPosition]);

  const divRefCallback = (div: HTMLDivElement | null) => {
    if (div && !osmdRef.current) {
      // OpenSheetMusicDisplay 인스턴스 생성 (제목과 파트명 숨김 옵션 추가)
      osmdRef.current = new OpenSheetMusicDisplay(div, {
        autoResize: true,
        backend: "svg",
        drawTitle: false,
        drawComposer: false,
        drawPartNames: false,
        drawPartAbbreviations: false,
        stretchLastSystemLine: true,
        cursorsOptions: [
          {
            type: 0, // VoiceEntry cursor
            color: "#ff0000", // 빨간색 마커
            alpha: 0.8,
            follow: false,
          },
        ],
      });
      osmdRef.current.EngravingRules.RenderXMeasuresPerLineAkaSystem = 4;

      // 악보 로드 및 렌더링
      loadAndRenderScore(osmdRef.current);
    }
  };

  return (
    <div
      ref={divRefCallback}
      style={{
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        backgroundColor: "#fff",
        overflow: "hidden",
      }}
    />
  );
};

export default SheetMusicViewer;
