import type { BassTuning, BassNote } from "../bassNoteGenerator";

// 순수한 음 정보 (프렛/튜닝 무관)
export interface PureNote {
  note: string; // "C4", "C#3" 등
  frequency: number; // 실제 주파수
}

// 베이스 음표와 주파수 정보 (하위 호환성을 위해 유지)
export interface BassNoteFrequency {
  note: string;
  frequency: number;
  description?: string; // deprecated: 프렛 정보
  string?: number; // deprecated: 현 번호
  fret?: number; // deprecated: 프렛 번호
  step?: string; // deprecated: 음계 단계
  octave?: number; // deprecated: 옥타브
  alter?: number; // deprecated: 샤프/플랫
}

// 크로매틱 음계 (샤프 표기 통일)
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

// 이명동음 매핑 (샤프 ↔ 플랫)
const ENHARMONIC_MAP: { [key: string]: string } = {
  "C#": "D♭",
  "D♭": "C#",
  "D#": "E♭",
  "E♭": "D#",
  "F#": "G♭",
  "G♭": "F#",
  "G#": "A♭",
  "A♭": "G#",
  "A#": "B♭",
  "B♭": "A#",
};

// 주파수를 순수한 음이름으로 변환 (A4 = 440Hz 기준)
export function frequencyToPureNote(frequency: number): PureNote | null {
  // 주파수 유효성 검사 강화
  if (!isFinite(frequency) || frequency <= 0) {
    return null;
  }

  // 베이스 주파수 범위 체크 (25Hz ~ 500Hz)
  if (frequency < 25 || frequency > 500) {
    return null;
  }

  // MIDI 번호 계산 (A4 = 440Hz = MIDI 69)
  const logValue = Math.log2(frequency / 440);
  if (!isFinite(logValue)) {
    return null;
  }

  const midiNumber = Math.round(12 * logValue + 69);

  // 음이름과 옥타브 계산
  const noteIndex = midiNumber % 12;
  const octave = Math.floor(midiNumber / 12) - 1;

  // 정확한 주파수 재계산
  const exactFrequency = 440 * Math.pow(2, (midiNumber - 69) / 12);

  return {
    note: CHROMATIC_NOTES[noteIndex] + octave,
    frequency: exactFrequency,
  };
}

// 이명동음 매칭 함수 (C#3 ↔ D♭3)
export function isEnharmonicMatch(note1: string, note2: string): boolean {
  if (note1 === note2) return true;

  // 정규식을 사용한 정확한 음표 파싱
  const parseNote = (note: string) => {
    const match = note.match(/^([A-G][#♭]?)(\d+)$/);
    if (!match) return null;
    return {
      base: match[1],
      octave: match[2],
    };
  };

  const parsed1 = parseNote(note1);
  const parsed2 = parseNote(note2);

  if (!parsed1 || !parsed2) return false;

  // 옥타브가 다르면 false
  if (parsed1.octave !== parsed2.octave) return false;

  // 이명동음 체크
  return ENHARMONIC_MAP[parsed1.base] === parsed2.base;
}

// 순수 음을 BassNoteFrequency로 변환 (하위 호환성)
export function adaptToBassNoteFrequency(
  pureNote: PureNote
): BassNoteFrequency {
  // 정규식을 사용한 정확한 음표 파싱 (샤프와 플랫 모두 지원)
  const match = pureNote.note.match(/^([A-G])([#♭]?)(\d+)$/);
  if (!match) {
    throw new Error(`Invalid note format: ${pureNote.note}`);
  }

  const [, step, accidental, octaveStr] = match;
  const octave = parseInt(octaveStr);

  // 베이스 악보 관습: 실제 소리보다 1옥타브 높게 표기
  // 감지된 E1 → 악보상 E2로 변환하여 목표 음표와 매칭
  const bassNotationNote = step + accidental + (octave + 1);

  return {
    note: bassNotationNote, // 베이스 악보 관습 적용 (E1 → E2)
    frequency: pureNote.frequency,
    // deprecated 필드들 (기존 코드 호환성을 위해 유지)
    description: "",
    string: 0,
    fret: 0,
    step: step,
    octave: octave + 1, // 베이스 악보 관습 (1옥타브 위 표기)
    alter: accidental === "#" ? 1 : accidental === "♭" ? -1 : undefined,
  };
}

// 음표 이름을 주파수로 변환하는 함수 (기존 호환성)
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

// 튜닝 설정에 따라 베이스 음표 주파수 매핑 생성 (하위 호환성을 위해 유지)
export function generateBassFrequencyMapping(
  tuning: BassTuning,
  maxFret: number = 12,
  minFret: number = 0
): BassNoteFrequency[] {
  const bassNotes: BassNoteFrequency[] = [];

  tuning.strings.forEach((string, stringIndex) => {
    for (let fret = minFret; fret <= maxFret; fret++) {
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

// 주파수 범위 생성 (deprecated - 순수 음 인식에서는 불필요)
export function generateFrequencyRanges(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _bassNotes: BassNoteFrequency[]
): {
  [key: string]: { min: number; max: number; target: number };
} {
  // 하위 호환성을 위해 유지하지만 빈 객체 반환
  console.warn(
    "generateFrequencyRanges is deprecated. 순수 음 인식에서는 불필요합니다."
  );
  return {};
}

// 감지된 주파수를 베이스 음표로 변환 (새로운 순수 음 인식 로직)
export function frequencyToNote(
  frequency: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _bassNotes?: BassNoteFrequency[] // 하위 호환성을 위해 유지하지만 사용하지 않음
): BassNoteFrequency | null {
  // 순수 음 인식 사용
  const pureNote = frequencyToPureNote(frequency);
  if (!pureNote) {
    return null;
  }

  // 기존 인터페이스로 변환
  return adaptToBassNoteFrequency(pureNote);
}

// 배음 감지를 포함한 고급 주파수 분석
export function frequencyToNoteWithHarmonics(
  frequency: number
): BassNoteFrequency | null {
  // 기본음 우선 검사
  const fundamentalNote = frequencyToPureNote(frequency);
  if (fundamentalNote) {
    return adaptToBassNoteFrequency(fundamentalNote);
  }

  // 배음 검사 (2-4배음)
  for (let harmonic = 2; harmonic <= 4; harmonic++) {
    const fundamentalFreq = frequency / harmonic;
    const harmonicNote = frequencyToPureNote(fundamentalFreq);

    if (harmonicNote) {
      console.log(
        `배음 감지: ${harmonicNote.note} (${harmonic}배음, ${frequency.toFixed(
          1
        )}Hz)`
      );
      return adaptToBassNoteFrequency(harmonicNote);
    }
  }

  return null;
}

// BassNote를 BassNoteFrequency로 변환
export function bassNoteToFrequency(
  bassNote: BassNote,
  bassNotes: BassNoteFrequency[]
): BassNoteFrequency | null {
  // 입력 유효성 검사
  if (!bassNote || !bassNote.step || typeof bassNote.octave !== "number") {
    return null;
  }

  const noteString =
    bassNote.step +
    (bassNote.alter === 1 ? "#" : bassNote.alter === -1 ? "♭" : "") +
    (bassNote.octave + 1); // 베이스 악보 관습 (1옥타브 위 표기)

  return (
    bassNotes.find((note) => {
      // 정확한 매칭
      if (note.note === noteString) return true;

      // 플랫/샤프 이명동음 처리
      if (bassNote.alter === 1) {
        const sharpNote = bassNote.step + "#" + bassNote.octave;
        return note.note === sharpNote;
      } else if (bassNote.alter === -1) {
        const flatNote = bassNote.step + "♭" + bassNote.octave;
        return note.note === flatNote;
      }

      return false;
    }) || null
  );
}
