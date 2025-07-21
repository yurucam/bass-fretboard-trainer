// 베이스 음정 데이터
export interface BassNote {
  step: string;
  octave: number;
  alter?: number; // 샤프/플랫 (-1: 플랫, 1: 샤프)
}

// 베이스 현 정보
export interface BassString {
  name: string;
  octave: number;
  midiBase: number;
}

// 베이스 튜닝 설정
export interface BassTuning {
  name: string;
  strings: BassString[];
}

// 미리 정의된 튜닝들
export const PRESET_TUNINGS: BassTuning[] = [
  // 4현 베이스
  {
    name: "4현 - Standard (EADG)",
    strings: [
      { name: "E", octave: 1, midiBase: 28 }, // 4현 (가장 굵은 현)
      { name: "A", octave: 1, midiBase: 33 }, // 3현
      { name: "D", octave: 2, midiBase: 38 }, // 2현
      { name: "G", octave: 2, midiBase: 43 }, // 1현 (가장 얇은 현)
    ],
  },
  {
    name: "4현 - Drop D (DADG)",
    strings: [
      { name: "D", octave: 1, midiBase: 26 }, // 4현 (Drop D)
      { name: "A", octave: 1, midiBase: 33 }, // 3현
      { name: "D", octave: 2, midiBase: 38 }, // 2현
      { name: "G", octave: 2, midiBase: 43 }, // 1현
    ],
  },
  {
    name: "4현 - Half Step Down (D#G#C#F#)",
    strings: [
      { name: "D#", octave: 1, midiBase: 27 }, // 4현
      { name: "G#", octave: 1, midiBase: 32 }, // 3현
      { name: "C#", octave: 2, midiBase: 37 }, // 2현
      { name: "F#", octave: 2, midiBase: 42 }, // 1현
    ],
  },
  {
    name: "4현 - Whole Step Down (DGCF)",
    strings: [
      { name: "D", octave: 1, midiBase: 26 }, // 4현
      { name: "G", octave: 1, midiBase: 31 }, // 3현
      { name: "C", octave: 2, midiBase: 36 }, // 2현
      { name: "F", octave: 2, midiBase: 41 }, // 1현
    ],
  },
  // 5현 베이스
  {
    name: "5현 - Standard (BEADG)",
    strings: [
      { name: "B", octave: 0, midiBase: 23 }, // 5현 (가장 굵은 현)
      { name: "E", octave: 1, midiBase: 28 }, // 4현
      { name: "A", octave: 1, midiBase: 33 }, // 3현
      { name: "D", octave: 2, midiBase: 38 }, // 2현
      { name: "G", octave: 2, midiBase: 43 }, // 1현 (가장 얇은 현)
    ],
  },
  {
    name: "5현 - High C (EADGC)",
    strings: [
      { name: "E", octave: 1, midiBase: 28 }, // 5현
      { name: "A", octave: 1, midiBase: 33 }, // 4현
      { name: "D", octave: 2, midiBase: 38 }, // 3현
      { name: "G", octave: 2, midiBase: 43 }, // 2현
      { name: "C", octave: 3, midiBase: 48 }, // 1현 (High C)
    ],
  },
  // 6현 베이스
  {
    name: "6현 - Standard (BEADGC)",
    strings: [
      { name: "B", octave: 0, midiBase: 23 }, // 6현 (가장 굵은 현)
      { name: "E", octave: 1, midiBase: 28 }, // 5현
      { name: "A", octave: 1, midiBase: 33 }, // 4현
      { name: "D", octave: 2, midiBase: 38 }, // 3현
      { name: "G", octave: 2, midiBase: 43 }, // 2현
      { name: "C", octave: 3, midiBase: 48 }, // 1현 (가장 얇은 현)
    ],
  },
  {
    name: "6현 - Extended Range (F#BEADG)",
    strings: [
      { name: "F#", octave: 0, midiBase: 18 }, // 6현 (매우 굵은 현)
      { name: "B", octave: 0, midiBase: 23 }, // 5현
      { name: "E", octave: 1, midiBase: 28 }, // 4현
      { name: "A", octave: 1, midiBase: 33 }, // 3현
      { name: "D", octave: 2, midiBase: 38 }, // 2현
      { name: "G", octave: 2, midiBase: 43 }, // 1현
    ],
  },
  // 추가 특수 튜닝들
  {
    name: "5현 - Drop A (AEADG)",
    strings: [
      { name: "A", octave: 0, midiBase: 21 }, // 5현 (Drop A)
      { name: "E", octave: 1, midiBase: 28 }, // 4현
      { name: "A", octave: 1, midiBase: 33 }, // 3현
      { name: "D", octave: 2, midiBase: 38 }, // 2현
      { name: "G", octave: 2, midiBase: 43 }, // 1현
    ],
  },
  {
    name: "6현 - Drop A (AEADGC)",
    strings: [
      { name: "A", octave: 0, midiBase: 21 }, // 6현 (Drop A)
      { name: "E", octave: 1, midiBase: 28 }, // 5현
      { name: "A", octave: 1, midiBase: 33 }, // 4현
      { name: "D", octave: 2, midiBase: 38 }, // 3현
      { name: "G", octave: 2, midiBase: 43 }, // 2현
      { name: "C", octave: 3, midiBase: 48 }, // 1현
    ],
  },
];

// 크로매틱 음계
const CHROMATIC_SCALE = [
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

// 현재 튜닝 설정
let currentTuning: BassTuning = PRESET_TUNINGS[0];

// 튜닝 설정 함수
export function setTuning(tuning: BassTuning): void {
  currentTuning = tuning;
}

// 현재 튜닝 가져오기
export function getCurrentTuning(): BassTuning {
  return currentTuning;
}

// 음표 이름을 MIDI 번호로 변환
export function noteNameToMidi(noteName: string, octave: number): number {
  const noteIndex = CHROMATIC_SCALE.indexOf(noteName);
  if (noteIndex === -1) {
    throw new Error(`Invalid note name: ${noteName}`);
  }
  return (octave + 1) * 12 + noteIndex;
}

// MIDI 번호를 음표로 변환 (베이스 악보 8vb 관습에 따라 1옥타브 위로 표기)
function midiToNote(midiNumber: number): BassNote {
  const noteIndex = midiNumber % 12;
  const octave = Math.floor(midiNumber / 12) - 1 + 1; // 베이스 악보 관습: 1옥타브 위로 표기
  const noteName = CHROMATIC_SCALE[noteIndex];

  if (noteName.includes("#")) {
    return {
      step: noteName[0],
      octave: octave,
      alter: 1,
    };
  } else {
    return {
      step: noteName,
      octave: octave,
    };
  }
}

// 베이스에서 연주 가능한 모든 음표 생성
export function generateAllBassNotes(
  tuning?: BassTuning,
  maxFret: number = 12
): BassNote[] {
  const allNotes: BassNote[] = [];
  const useTuning = tuning || currentTuning;

  useTuning.strings.forEach((string) => {
    // 각 현에서 0프렛부터 지정된 프렛까지
    for (let fret = 0; fret <= maxFret; fret++) {
      const midiNumber = string.midiBase + fret;
      const note = midiToNote(midiNumber);
      allNotes.push(note);
    }
  });

  return allNotes;
}

// 랜덤 음표 생성
export function generateRandomBassNotes(
  count: number,
  tuning?: BassTuning,
  maxFret: number = 12
): BassNote[] {
  const allNotes = generateAllBassNotes(tuning, maxFret);
  const result: BassNote[] = [];

  // 요청된 개수만큼 음표 생성 (중복 허용)
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * allNotes.length);
    result.push(allNotes[randomIndex]);
  }

  return result;
}

// 음이름을 문자열로 변환 (라벨은 실제 소리로 표시)
function noteToString(note: BassNote): string {
  let noteName = note.step;
  if (note.alter === 1) {
    noteName += "#";
  } else if (note.alter === -1) {
    noteName += "♭";
  }
  // 라벨은 실제 소리(1옥타브 아래)로 표시
  return noteName + (note.octave - 1);
}

// MusicXML 생성
export function generateMusicXML(
  notes: BassNote[],
  showNoteNames: boolean = true
): string {
  const notesPerMeasure = 4;
  const totalMeasures = Math.ceil(notes.length / notesPerMeasure);

  let measuresXML = "";

  for (let measureNum = 1; measureNum <= totalMeasures; measureNum++) {
    const startIndex = (measureNum - 1) * notesPerMeasure;
    const endIndex = Math.min(startIndex + notesPerMeasure, notes.length);
    const measureNotes = notes.slice(startIndex, endIndex);

    let measureXML = `    <measure number="${measureNum}">`;

    // 첫 번째 마디에는 속성 추가
    if (measureNum === 1) {
      measureXML += `
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>0</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>F</sign>
          <line>4</line>
        </clef>
      </attributes>`;
    }

    // 새 시스템 시작 (4마디마다)
    if (measureNum > 1 && (measureNum - 1) % 4 === 0) {
      measureXML += `
      <print new-system="yes"/>`;
    }

    // 음표들 추가
    measureNotes.forEach((note) => {
      measureXML += `
      <note>
        <pitch>
          <step>${note.step}</step>`;

      if (note.alter) {
        measureXML += `
          <alter>${note.alter}</alter>`;
      }

      measureXML += `
          <octave>${note.octave}</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>`;

      measureXML += `
        <lyric number="1">
          <syllabic>single</syllabic>
          <text>${showNoteNames ? noteToString(note) : "　"}</text>
        </lyric>`;

      measureXML += `
      </note>`;
    });

    // 마디가 4박자보다 적으면 쉼표로 채우기
    const remainingBeats = notesPerMeasure - measureNotes.length;
    if (remainingBeats > 0) {
      measureXML += `
      <note>
        <rest/>
        <duration>${remainingBeats}</duration>
        <type>${
          remainingBeats === 4
            ? "whole"
            : remainingBeats === 2
            ? "half"
            : "quarter"
        }</type>
      </note>`;
    }

    // 마지막 마디에는 종료 바 추가
    if (measureNum === totalMeasures) {
      measureXML += `
      <barline location="right">
        <bar-style>light-heavy</bar-style>
      </barline>`;
    }

    measureXML += `
    </measure>`;

    measuresXML += measureXML + "\n";
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <defaults>
    <scaling>
      <millimeters>7.05556</millimeters>
      <tenths>40</tenths>
    </scaling>
  </defaults>
  <part-list>
    <score-part id="P1">
      <score-instrument id="P1-I1">
        <instrument-name>Bass</instrument-name>
      </score-instrument>
      <midi-device id="P1-I1" port="1"></midi-device>
      <midi-instrument id="P1-I1">
        <midi-channel>1</midi-channel>
        <midi-program>34</midi-program>
        <volume>78.7402</volume>
        <pan>0</pan>
      </midi-instrument>
    </score-part>
  </part-list>
  <part id="P1">
${measuresXML}  </part>
</score-partwise>`;
}
