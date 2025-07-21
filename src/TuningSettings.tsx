import React, { useState } from "react";
import {
  type BassTuning,
  PRESET_TUNINGS,
  noteNameToMidi,
} from "./bassNoteGenerator";

interface TuningSettingsProps {
  currentTuning: BassTuning;
  onTuningChange: (tuning: BassTuning) => void;
  onClose: () => void;
}

const CHROMATIC_NOTES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
const OCTAVE_RANGE = [0, 1, 2, 3, 4, 5];

const TuningSettings: React.FC<TuningSettingsProps> = ({
  currentTuning,
  onTuningChange,
  onClose,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(
    currentTuning.name
  );
  const [customTuning, setCustomTuning] = useState<BassTuning>(currentTuning);
  const [isCustomMode, setIsCustomMode] = useState(false);

  // 현 수별로 프리셋을 그룹화
  const groupedPresets = PRESET_TUNINGS.reduce((groups, preset) => {
    const stringCount = preset.strings.length;
    if (!groups[stringCount]) {
      groups[stringCount] = [];
    }
    groups[stringCount].push(preset);
    return groups;
  }, {} as Record<number, typeof PRESET_TUNINGS>);

  const handlePresetChange = (presetName: string) => {
    setSelectedPreset(presetName);
    const preset = PRESET_TUNINGS.find((t) => t.name === presetName);
    if (preset) {
      setCustomTuning(preset);
      setIsCustomMode(false);
    }
  };

  const handleCustomStringChange = (
    stringIndex: number,
    noteName: string,
    octave: number
  ) => {
    const midiBase = noteNameToMidi(noteName, octave);
    const newStrings = [...customTuning.strings];
    newStrings[stringIndex] = {
      name: noteName,
      octave: octave,
      midiBase: midiBase,
    };

    setCustomTuning({
      ...customTuning,
      strings: newStrings,
    });
    setIsCustomMode(true);
    setSelectedPreset("Custom");
  };

  const handleAddString = () => {
    const newStrings = [...customTuning.strings];
    // 새 현은 기본적으로 가장 낮은 음으로 설정 (E0)
    newStrings.unshift({
      name: "E",
      octave: 0,
      midiBase: noteNameToMidi("E", 0),
    });

    setCustomTuning({
      ...customTuning,
      strings: newStrings,
    });
    setIsCustomMode(true);
    setSelectedPreset("Custom");
  };

  const handleRemoveString = (stringIndex: number) => {
    if (customTuning.strings.length <= 1) return; // 최소 1현은 유지

    const newStrings = [...customTuning.strings];
    newStrings.splice(stringIndex, 1);

    setCustomTuning({
      ...customTuning,
      strings: newStrings,
    });
    setIsCustomMode(true);
    setSelectedPreset("Custom");
  };

  const handleApply = () => {
    onTuningChange(customTuning);
    onClose();
  };

  const handleReset = () => {
    setCustomTuning(PRESET_TUNINGS[0]);
    setSelectedPreset(PRESET_TUNINGS[0].name);
    setIsCustomMode(false);
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
          minWidth: "600px",
          maxWidth: "700px",
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
          베이스 튜닝 설정
        </h2>

        {/* 프리셋 선택 */}
        <div style={{ marginBottom: "25px" }}>
          <h3
            style={{
              marginBottom: "15px",
              fontSize: "18px",
              color: "#555",
            }}
          >
            프리셋 튜닝
          </h3>
          {Object.entries(groupedPresets)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([stringCount, presets]) => (
              <div key={stringCount} style={{ marginBottom: "15px" }}>
                <h4
                  style={{
                    margin: "10px 0 8px 0",
                    fontSize: "14px",
                    color: "#666",
                    fontWeight: "bold",
                  }}
                >
                  {stringCount}현 베이스
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {presets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handlePresetChange(preset.name)}
                      style={{
                        padding: "8px 12px",
                        border:
                          selectedPreset === preset.name
                            ? "2px solid #007bff"
                            : "2px solid #ddd",
                        borderRadius: "6px",
                        backgroundColor:
                          selectedPreset === preset.name ? "#e7f3ff" : "white",
                        cursor: "pointer",
                        fontSize: "12px",
                        transition: "all 0.2s",
                      }}
                    >
                      {preset.name.replace(`${stringCount}현 - `, "")}
                    </button>
                  ))}
                </div>
              </div>
            ))}
        </div>

        {/* 커스텀 튜닝 설정 */}
        <div style={{ marginBottom: "25px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "18px",
                color: "#555",
              }}
            >
              현별 튜닝 설정{" "}
              {isCustomMode && (
                <span style={{ color: "#007bff" }}>(커스텀)</span>
              )}
            </h3>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleAddString}
                style={{
                  padding: "6px 12px",
                  border: "2px solid #28a745",
                  borderRadius: "4px",
                  backgroundColor: "#28a745",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                현 추가
              </button>
            </div>
          </div>
          <div style={{ display: "grid", gap: "12px" }}>
            {customTuning.strings.map((string, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  backgroundColor: "#f9f9f9",
                }}
              >
                <span
                  style={{
                    minWidth: "60px",
                    fontWeight: "bold",
                    color: "#333",
                  }}
                >
                  {index + 1}현:
                </span>

                <select
                  value={string.name}
                  onChange={(e) =>
                    handleCustomStringChange(
                      index,
                      e.target.value,
                      string.octave
                    )
                  }
                  style={{
                    padding: "6px 10px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                >
                  {CHROMATIC_NOTES.map((note) => (
                    <option key={note} value={note}>
                      {note}
                    </option>
                  ))}
                </select>

                <select
                  value={string.octave}
                  onChange={(e) =>
                    handleCustomStringChange(
                      index,
                      string.name,
                      parseInt(e.target.value)
                    )
                  }
                  style={{
                    padding: "6px 10px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                >
                  {OCTAVE_RANGE.map((octave) => (
                    <option key={octave} value={octave}>
                      {octave}
                    </option>
                  ))}
                </select>

                <span
                  style={{
                    color: "#666",
                    fontSize: "14px",
                    minWidth: "80px",
                  }}
                >
                  ({string.name}
                  {string.octave})
                </span>

                {customTuning.strings.length > 1 && (
                  <button
                    onClick={() => handleRemoveString(index)}
                    style={{
                      padding: "4px 8px",
                      border: "2px solid #dc3545",
                      borderRadius: "4px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      cursor: "pointer",
                      fontSize: "12px",
                      marginLeft: "auto",
                    }}
                  >
                    제거
                  </button>
                )}
              </div>
            ))}
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
            초기화
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

export default TuningSettings;
