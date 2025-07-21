import React, { useState } from "react";
import { type KeySignature, PRESET_KEY_SIGNATURES } from "./bassNoteGenerator";

interface KeySignatureSettingsProps {
  currentKeySignature: KeySignature;
  onKeySignatureChange: (keySignature: KeySignature) => void;
  onClose: () => void;
}

const KeySignatureSettings: React.FC<KeySignatureSettingsProps> = ({
  currentKeySignature,
  onKeySignatureChange,
  onClose,
}) => {
  const [selectedKeySignature, setSelectedKeySignature] = useState<string>(
    currentKeySignature.name
  );

  // 조표를 그룹화 (플랫, 자연, 샤프)
  const groupedKeySignatures = {
    flats: PRESET_KEY_SIGNATURES.filter((ks) => ks.fifths < 0),
    natural: PRESET_KEY_SIGNATURES.filter((ks) => ks.fifths === 0),
    sharps: PRESET_KEY_SIGNATURES.filter((ks) => ks.fifths > 0),
  };

  const handleKeySignatureChange = (keySignatureName: string) => {
    setSelectedKeySignature(keySignatureName);
    const keySignature = PRESET_KEY_SIGNATURES.find(
      (ks) => ks.name === keySignatureName
    );
    if (keySignature) {
      onKeySignatureChange(keySignature);
    }
  };

  const handleApply = () => {
    onClose();
  };

  const handleReset = () => {
    const defaultKeySignature = PRESET_KEY_SIGNATURES[0];
    setSelectedKeySignature(defaultKeySignature.name);
    onKeySignatureChange(defaultKeySignature);
  };

  const renderKeySignatureButton = (keySignature: KeySignature) => {
    const isSelected = selectedKeySignature === keySignature.name;
    const accidentals =
      keySignature.fifths > 0
        ? `${keySignature.fifths}♯`
        : keySignature.fifths < 0
        ? `${Math.abs(keySignature.fifths)}♭`
        : "자연";

    return (
      <button
        key={keySignature.name}
        onClick={() => handleKeySignatureChange(keySignature.name)}
        style={{
          padding: "12px 16px",
          border: isSelected ? "2px solid #007bff" : "2px solid #ddd",
          borderRadius: "8px",
          backgroundColor: isSelected ? "#e7f3ff" : "white",
          cursor: "pointer",
          fontSize: "13px",
          transition: "all 0.2s",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          minWidth: "120px",
        }}
      >
        <div style={{ fontWeight: "bold", color: "#333" }}>
          {keySignature.name.split(" / ")[0]}
        </div>
        <div style={{ fontSize: "11px", color: "#666" }}>
          {keySignature.name.split(" / ")[1]}
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "#007bff",
            fontWeight: "bold",
            marginTop: "2px",
          }}
        >
          {accidentals}
        </div>
      </button>
    );
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "12px",
          minWidth: "700px",
          maxWidth: "800px",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: "25px",
            fontSize: "24px",
            color: "#333",
          }}
        >
          조표 설정
        </h2>

        {/* 자연 조표 (C Major) */}
        <div style={{ marginBottom: "25px" }}>
          <h3
            style={{
              marginBottom: "15px",
              fontSize: "18px",
              color: "#555",
            }}
          >
            자연 조표
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            {groupedKeySignatures.natural.map(renderKeySignatureButton)}
          </div>
        </div>

        {/* 플랫 조표들 */}
        <div style={{ marginBottom: "25px" }}>
          <h3
            style={{
              marginBottom: "15px",
              fontSize: "18px",
              color: "#555",
            }}
          >
            플랫 조표 (♭)
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            {groupedKeySignatures.flats.map(renderKeySignatureButton)}
          </div>
        </div>

        {/* 샤프 조표들 */}
        <div style={{ marginBottom: "25px" }}>
          <h3
            style={{
              marginBottom: "15px",
              fontSize: "18px",
              color: "#555",
            }}
          >
            샤프 조표 (♯)
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            {groupedKeySignatures.sharps.map(renderKeySignatureButton)}
          </div>
        </div>

        {/* 현재 선택된 조표 정보 */}
        <div
          style={{
            marginBottom: "25px",
            padding: "15px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #e9ecef",
          }}
        >
          <h4 style={{ margin: "0 0 10px 0", color: "#495057" }}>
            현재 선택된 조표
          </h4>
          <div style={{ fontSize: "14px", color: "#6c757d" }}>
            <strong>{selectedKeySignature}</strong>
            {(() => {
              const current = PRESET_KEY_SIGNATURES.find(
                (ks) => ks.name === selectedKeySignature
              );
              if (!current) return null;

              if (current.fifths > 0) {
                return (
                  <div style={{ marginTop: "5px" }}>
                    샤프: {current.sharps.join(", ")}
                  </div>
                );
              } else if (current.fifths < 0) {
                return (
                  <div style={{ marginTop: "5px" }}>
                    플랫: {current.flats.join(", ")}
                  </div>
                );
              }
              return <div style={{ marginTop: "5px" }}>임시표 없음</div>;
            })()}
          </div>
        </div>

        {/* 버튼들 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "10px",
          }}
        >
          <button
            onClick={handleReset}
            style={{
              padding: "12px 20px",
              border: "2px solid #6c757d",
              borderRadius: "6px",
              backgroundColor: "white",
              color: "#6c757d",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            초기화 (C Major)
          </button>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={onClose}
              style={{
                padding: "12px 20px",
                border: "2px solid #6c757d",
                borderRadius: "6px",
                backgroundColor: "white",
                color: "#6c757d",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              취소
            </button>

            <button
              onClick={handleApply}
              style={{
                padding: "12px 20px",
                border: "2px solid #007bff",
                borderRadius: "6px",
                backgroundColor: "#007bff",
                color: "white",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              적용
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeySignatureSettings;
