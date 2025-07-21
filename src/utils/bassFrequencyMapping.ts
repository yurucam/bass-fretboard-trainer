import type { BassTuning, BassNote } from "../bassNoteGenerator";

// 베이스 음표와 주파수 정보
export interface BassNoteFrequency {
  note: string;
  frequency: number;
  description: string;
  string: number;
  fret: number;
  step: string;
  octave: number;
  alter?: number;
}

// 음표 이름을 주파수로 변환하는 함수
function noteToFrequency(noteName: string, octave: number): number {
  const A4_FREQUENCY = 440.0;
  const A4_MIDI = 69;

  const noteMap: { [key: string]: number } = {
    C: 0,
    "C#": 1,
    D: 2,
    "D#": 3,
    E: 4,
    F: 5,
    "F#": 6,
    G: 7,
    "G#": 8,
    A: 9,
    "A#": 10,
    B: 11,
  };

  const noteNumber = noteMap[noteName];
  if (noteNumber === undefined) {
    throw new Error(`Invalid note name: ${noteName}`);
  }

  const midiNumber = (octave + 1) * 12 + noteNumber;
  const semitonesFromA4 = midiNumber - A4_MIDI;

  return A4_FREQUENCY * Math.pow(2, semitonesFromA4 / 12);
}

// 튜닝 설정에 따라 베이스 음표 주파수 매핑 생성
export function generateBassFrequencyMapping(
  tuning: BassTuning,
  maxFret: number = 12
): BassNoteFrequency[] {
  const bassNotes: BassNoteFrequency[] = [];

  tuning.strings.forEach((string, stringIndex) => {
    for (let fret = 0; fret <= maxFret; fret++) {
      // MIDI 번호 계산
      const midiNumber = string.midiBase + fret;

      // 음표 정보 계산
      const noteIndex = midiNumber % 12;
      const octave = Math.floor(midiNumber / 12) - 1;

      const chromaticScale = [
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
      const noteName = chromaticScale[noteIndex];

      // 주파수 계산
      const frequency = noteToFrequency(noteName, octave);

      // 음표 설명
      const stringNumber = tuning.strings.length - stringIndex;
      const description = `${stringNumber}번줄 ${fret}프렛`;

      // BassNote 형식으로 변환
      let step = noteName;
      let alter: number | undefined = undefined;

      if (noteName.includes("#")) {
        step = noteName[0];
        alter = 1;
      }

      bassNotes.push({
        note: noteName + octave,
        frequency,
        description,
        string: stringNumber,
        fret,
        step,
        octave,
        alter,
      });
    }
  });

  return bassNotes;
}

// 주파수 범위 생성 (반음 간격으로 범위 설정)
export function generateFrequencyRanges(bassNotes: BassNoteFrequency[]): {
  [key: string]: { min: number; max: number; target: number };
} {
  const ranges: {
    [key: string]: { min: number; max: number; target: number };
  } = {};

  // 모든 주파수를 정렬
  const sortedFrequencies = bassNotes
    .map((note) => note.frequency)
    .sort((a, b) => a - b);

  bassNotes.forEach((note) => {
    const frequency = note.frequency;
    const noteKey = note.note;

    // 이미 처리된 음표는 건너뛰기
    if (ranges[noteKey]) return;

    // 현재 주파수의 인덱스 찾기
    const currentIndex = sortedFrequencies.indexOf(frequency);

    // 이전 주파수와 다음 주파수 찾기
    const prevFreq =
      currentIndex > 0 ? sortedFrequencies[currentIndex - 1] : frequency * 0.9;
    const nextFreq =
      currentIndex < sortedFrequencies.length - 1
        ? sortedFrequencies[currentIndex + 1]
        : frequency * 1.1;

    // 범위 계산 (이전 주파수와의 중점부터 다음 주파수와의 중점까지)
    const minFreq = (prevFreq + frequency) / 2;
    const maxFreq = (frequency + nextFreq) / 2;

    ranges[noteKey] = {
      min: minFreq,
      max: maxFreq,
      target: frequency,
    };
  });

  return ranges;
}

// 감지된 주파수를 베이스 음표로 변환
export function frequencyToNote(
  frequency: number,
  bassNotes: BassNoteFrequency[]
): BassNoteFrequency | null {
  // 기본음 검사 - 더 관대한 허용 오차 적용
  let bestMatch: { note: BassNoteFrequency; error: number } | null = null;

  for (const note of bassNotes) {
    const targetFreq = note.frequency;
    const tolerance = targetFreq * 0.15; // 15% 허용 오차로 확대
    const error = Math.abs(frequency - targetFreq);

    if (error <= tolerance) {
      if (!bestMatch || error < bestMatch.error) {
        bestMatch = { note, error };
      }
    }
  }

  // 기본음에서 매치가 있으면 우선 반환
  if (bestMatch) {
    return bestMatch.note;
  }

  // 배음 검사는 기본음 매치가 없을 때만 수행 (2-3배음만)
  for (const note of bassNotes) {
    const targetFreq = note.frequency;

    for (let harmonic = 2; harmonic <= 3; harmonic++) {
      const harmonicFreq = targetFreq * harmonic;
      const tolerance = harmonicFreq * 0.2; // 20% 허용 오차

      if (Math.abs(frequency - harmonicFreq) <= tolerance) {
        return note;
      }
    }
  }

  return null;
}

// BassNote를 BassNoteFrequency로 변환
export function bassNoteToFrequency(
  bassNote: BassNote,
  bassNotes: BassNoteFrequency[]
): BassNoteFrequency | null {
  const noteString =
    bassNote.step +
    (bassNote.alter === 1 ? "#" : bassNote.alter === -1 ? "♭" : "") +
    (bassNote.octave - 1); // 베이스 악보는 1옥타브 위로 표기되므로 실제 소리는 1옥타브 아래

  return (
    bassNotes.find((note) => {
      // 정확한 매칭
      if (note.note === noteString) return true;

      // 플랫/샤프 이명동음 처리
      if (bassNote.alter === 1) {
        const sharpNote = bassNote.step + "#" + (bassNote.octave - 1);
        return note.note === sharpNote;
      } else if (bassNote.alter === -1) {
        const flatNote = bassNote.step + "♭" + (bassNote.octave - 1);
        return note.note === flatNote;
      }

      return false;
    }) || null
  );
}
