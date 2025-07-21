import { useState, useEffect, useCallback, useRef } from "react";
import { AudioPitchDetector } from "../utils/audioAnalysis";
import {
  generateBassFrequencyMapping,
  generateFrequencyRanges,
  frequencyToNote,
  type BassNoteFrequency,
} from "../utils/bassFrequencyMapping";
import type { BassTuning, BassNote } from "../bassNoteGenerator";

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
  onNoteDetected?: (note: BassNoteFrequency) => void;
  requiredConsecutiveDetections?: number;
}

export function useAudioInput({
  tuning,
  maxFret,
  onNoteDetected,
  requiredConsecutiveDetections = 3,
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
  const bassNotesRef = useRef<BassNoteFrequency[]>([]);
  const frequencyRangesRef = useRef<{
    [key: string]: { min: number; max: number; target: number };
  }>({});
  const lastDetectedNotesRef = useRef<string[]>([]);
  const consecutiveCountRef = useRef<number>(0);
  const lastNoteRef = useRef<string | null>(null);

  // 튜닝이 변경될 때마다 베이스 음표 매핑 업데이트
  useEffect(() => {
    bassNotesRef.current = generateBassFrequencyMapping(tuning, maxFret);
    frequencyRangesRef.current = generateFrequencyRanges(bassNotesRef.current);
    console.log(
      "베이스 음표 매핑 업데이트됨:",
      bassNotesRef.current.length,
      "개 음표"
    );
  }, [tuning, maxFret]);

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

      // 주파수를 베이스 음표로 변환
      const detectedNote = frequencyToNote(frequency, bassNotesRef.current);

      setState((prev) => ({ ...prev, detectedNote }));

      if (detectedNote) {
        // 연속 감지 로직
        if (lastNoteRef.current === detectedNote.note) {
          consecutiveCountRef.current++;
        } else {
          consecutiveCountRef.current = 1;
          lastNoteRef.current = detectedNote.note;
        }

        // 필요한 연속 감지 횟수에 도달하면 콜백 호출
        if (consecutiveCountRef.current >= requiredConsecutiveDetections) {
          onNoteDetected?.(detectedNote);
          consecutiveCountRef.current = 0; // 중복 호출 방지
        }

        // 최근 감지된 음표 히스토리 관리 (안정화용)
        lastDetectedNotesRef.current.push(detectedNote.note);
        if (lastDetectedNotesRef.current.length > 10) {
          lastDetectedNotesRef.current.shift();
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
  const cleanup = useCallback(() => {
    if (detectorRef.current) {
      detectorRef.current.cleanup();
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
      const targetNoteString =
        targetNote.step +
        (targetNote.alter === 1 ? "#" : targetNote.alter === -1 ? "♭" : "") +
        (targetNote.octave - 1); // 베이스 악보는 1옥타브 위로 표기

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
    bassNotes: bassNotesRef.current,
    consecutiveCount: consecutiveCountRef.current,
    requiredConsecutiveDetections,
  };
}
