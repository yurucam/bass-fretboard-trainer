import React, { useEffect, useRef } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";

interface SheetMusicViewerProps {
  musicXmlUrl: string;
}

const SheetMusicViewer: React.FC<SheetMusicViewerProps> = ({ musicXmlUrl }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);

  useEffect(() => {
    if (divRef.current && !osmdRef.current) {
      // OpenSheetMusicDisplay 인스턴스 생성 (제목과 파트명 숨김 옵션 추가)
      osmdRef.current = new OpenSheetMusicDisplay(divRef.current, {
        autoResize: true,
        backend: "svg",
        drawTitle: false,
        drawComposer: false,
        drawPartNames: false,
        drawPartAbbreviations: false,
        stretchLastSystemLine: true,
      });
      osmdRef.current.EngravingRules.RenderXMeasuresPerLineAkaSystem = 4;

      // 악보 로드 및 렌더링
      loadAndRenderScore();
    }

    return () => {
      if (osmdRef.current) {
        osmdRef.current.clear();
      }
    };
  }, [musicXmlUrl]);

  const loadAndRenderScore = async () => {
    if (!osmdRef.current) return;

    try {
      // MusicXML 파일 로드
      await osmdRef.current.load(musicXmlUrl);

      // 악보 렌더링
      osmdRef.current.render();

      console.log("악보가 성공적으로 렌더링되었습니다.");
    } catch (error) {
      console.error("악보 로드 중 오류 발생:", error);
    }
  };

  return (
    <div
      ref={divRef}
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
