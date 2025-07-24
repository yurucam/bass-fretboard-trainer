import { useState, useEffect, useCallback, useRef } from "react";
import { AudioPitchDetector } from "../utils/audioAnalysis";
import {
  generateBassFrequencyMapping,
  frequencyToNote,
  type BassNoteFrequency,
} from "../utils/bassFrequencyMapping";
import type { BassTuning, BassNote } from "../bassNoteGenerator";

// 상수 정의
const DETECTION_COMPLETE_THRESHOLD = 10; // 같은 음 반복 감지 방지를 위한 합리적인 임계값
const MAX_NOTE_HISTORY_LENGTH = 10;

export interface AudioInputState {
  isInitialized: boolean;
  isDetecting: boolean;
  detectedFrequency: number | null;
  detectedNote: BassNoteFrequency | null;
  error: string | null;
  audioContextState: AudioContextState | null;
}

export interface UseAudioInputOptions {
  tuning: BassTuning;
  maxFret: number;
  minFret?: number;
  onNoteDetected?: (note: BassNoteFrequency) => void;
  requiredConsecutiveDetections?: number;
  cursorPosition?: number; // 커서 위치 추가
}

export function useAudioInput({
  tuning,
  maxFret,
  minFret = 0,
  onNoteDetected,
  requiredConsecutiveDetections = 3,
  cursorPosition = 0,
}: UseAudioInputOptions) {
  const [state, setState] = useState<AudioInputState>({
    isInitialized: false,
    isDetecting: false,
    detectedFrequency: null,
    detectedNote: null,
    error: null,
    audioContextState: null,
  });

  const detectorRef = useRef<AudioPitchDetector | null>(null);
  const bassNotesRef = useRef<BassNoteFrequency[]>([]); // 연습 범위용 (하위 호환성)
  const lastDetectedNotesRef = useRef<string[]>([]);
  const consecutiveCountRef = useRef<number>(0);
  const lastNoteRef = useRef<string | null>(null);

  // 커서 위치가 변경될 때 연속 감지 상태 리셋
  useEffect(() => {
    // 커서가 이동하면 연속 감지 상태를 초기화
    consecutiveCountRef.current = 0;
    lastNoteRef.current = null;
    lastDetectedNotesRef.current = [];
    console.log("커서 위치 변경으로 인한 감지 상태 리셋:", cursorPosition);
  }, [cursorPosition]);

  // 연습 범위용 매핑만 유지 (하위 호환성을 위해)
  useEffect(() => {
    // 연습 범위용 매핑 (사용자 설정 프렛 범위)
    bassNotesRef.current = generateBassFrequencyMapping(
      tuning,
      maxFret,
      minFret
    );

    console.log(
      "베이스 음표 매핑 업데이트됨 (연습용):",
      bassNotesRef.current.length,
      "개 음표"
    );
    console.log("순수 음 인식 모드: 프렛/튜닝과 독립적으로 음 인식");
  }, [tuning, maxFret, minFret]);

  // 오디오 컨텍스트 초기화
  const initialize = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: null }));

      if (!detectorRef.current) {
        detectorRef.current = new AudioPitchDetector();
      }

      await detectorRef.current.initialize();

      setState((prev) => ({
        ...prev,
        isInitialized: true,
        audioContextState: detectorRef.current?.audioContextState || null,
      }));

      console.log("오디오 입력 초기화 완료");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "오디오 초기화 실패";
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isInitialized: false,
      }));
      console.error("오디오 초기화 오류:", error);
    }
  }, []);

  // 음 감지 시작
  const startDetection = useCallback(() => {
    if (!detectorRef.current?.isInitialized) {
      console.warn("오디오 감지기가 초기화되지 않았습니다");
      return;
    }

    setState((prev) => ({ ...prev, isDetecting: true }));

    // 감지 상태 초기화
    lastDetectedNotesRef.current = [];
    consecutiveCountRef.current = 0;
    lastNoteRef.current = null;

    detectorRef.current.startDetection((frequency: number | null) => {
      setState((prev) => ({ ...prev, detectedFrequency: frequency }));

      if (frequency === null) {
        setState((prev) => ({
          ...prev,
          detectedNote: null,
        }));
        return;
      }

      // 주파수를 베이스 음표로 변환 (순수 음 인식 - 프렛/튜닝 무관)
      const detectedNote = frequencyToNote(frequency);

      setState((prev) => ({ ...prev, detectedNote }));

      if (detectedNote) {
        console.log(
          "🎵 음 감지됨:",
          detectedNote.note,
          "주파수:",
          frequency?.toFixed(1)
        );

        // 연속 감지 로직
        if (lastNoteRef.current === detectedNote.note) {
          consecutiveCountRef.current++;
          console.log(
            "🔄 같은 음 연속 감지:",
            consecutiveCountRef.current,
            "회"
          );
        } else {
          consecutiveCountRef.current = 1;
          lastNoteRef.current = detectedNote.note;
          console.log("🆕 새로운 음 감지:", detectedNote.note);
        }

        // 필요한 연속 감지 횟수에 도달하면 콜백 호출
        if (consecutiveCountRef.current >= requiredConsecutiveDetections) {
          console.log("✅ 콜백 호출 조건 만족! 음표:", detectedNote.note);
          onNoteDetected?.(detectedNote);
          // 같은 음이 계속 감지되어도 콜백이 한 번만 호출되도록
          // 카운터를 높은 값으로 설정하되, 다른 음이 감지되면 다시 리셋됨
          consecutiveCountRef.current = DETECTION_COMPLETE_THRESHOLD;
          console.log(
            "🔒 콜백 호출 후 카운터 잠금:",
            DETECTION_COMPLETE_THRESHOLD
          );
        }

        // 최근 감지된 음표 히스토리 관리 (안정화용)
        lastDetectedNotesRef.current.push(detectedNote.note);
        if (lastDetectedNotesRef.current.length > MAX_NOTE_HISTORY_LENGTH) {
          lastDetectedNotesRef.current.shift();
        }
      } else {
        // 음이 감지되지 않을 때
        if (lastNoteRef.current !== null) {
          console.log("🔇 음 감지 중단");
          lastNoteRef.current = null;
          consecutiveCountRef.current = 0;
        }
      }
    });

    console.log("음 감지 시작됨");
  }, [onNoteDetected, requiredConsecutiveDetections]);

  // 음 감지 중지
  const stopDetection = useCallback(() => {
    if (detectorRef.current) {
      detectorRef.current.stopDetection();
    }

    setState((prev) => ({
      ...prev,
      isDetecting: false,
      detectedFrequency: null,
      detectedNote: null,
    }));

    // 감지 상태 초기화
    lastDetectedNotesRef.current = [];
    consecutiveCountRef.current = 0;
    lastNoteRef.current = null;

    console.log("음 감지 중지됨");
  }, []);

  // 리소스 정리
  const cleanup = useCallback(async () => {
    if (detectorRef.current) {
      try {
        await detectorRef.current.cleanup();
      } catch (error) {
        console.warn("오디오 감지기 정리 중 오류:", error);
      }
      detectorRef.current = null;
    }

    setState({
      isInitialized: false,
      isDetecting: false,
      detectedFrequency: null,
      detectedNote: null,
      error: null,
      audioContextState: null,
    });

    console.log("오디오 입력 리소스 정리됨");
  }, []);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // 현재 감지된 음표가 목표 음표와 일치하는지 확인
  const isNoteMatching = useCallback(
    (targetNote: BassNote): boolean => {
      if (!state.detectedNote) return false;

      // BassNote를 문자열로 변환하여 비교
      // 베이스 악보는 실제 소리보다 1옥타브 높게 표기되므로,
      // 악보의 옥타브 그대로 사용하여 실제 소리와 비교
      const targetNoteString =
        targetNote.step +
        (targetNote.alter === 1 ? "#" : targetNote.alter === -1 ? "♭" : "") +
        targetNote.octave; // 악보 옥타브 그대로 (실제로는 1옥타브 낮은 소리)

      return state.detectedNote.note === targetNoteString;
    },
    [state.detectedNote]
  );

  return {
    ...state,
    initialize,
    startDetection,
    stopDetection,
    cleanup,
    isNoteMatching,
    bassNotes: bassNotesRef.current, // 연습 범위용 (하위 호환성)
    consecutiveCount: consecutiveCountRef.current,
    requiredConsecutiveDetections,
  };
}
