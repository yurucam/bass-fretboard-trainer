// 4현 베이스 음정 데이터
export interface BassNote {
  step: string;
  octave: number;
  alter?: number; // 샤프/플랫 (-1: 플랫, 1: 샤프)
}

// 4현 베이스 EADG 튜닝 (표준 음정)
// E1 = 41.2Hz, A1 = 55Hz, D2 = 73.4Hz, G2 = 98Hz
const BASS_STRINGS = [
  { name: "E", octave: 1, midiBase: 28 }, // 4현 (가장 굵은 현)
  { name: "A", octave: 1, midiBase: 33 }, // 3현
  { name: "D", octave: 2, midiBase: 38 }, // 2현
  { name: "G", octave: 2, midiBase: 43 }, // 1현 (가장 얇은 현)
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

// 4현 베이스에서 연주 가능한 모든 음표 생성 (0-12프렛)
export function generateAllBassNotes(): BassNote[] {
  const allNotes: BassNote[] = [];

  BASS_STRINGS.forEach((string) => {
    // 각 현에서 0프렛부터 12프렛까지
    for (let fret = 0; fret <= 12; fret++) {
      const midiNumber = string.midiBase + fret;
      const note = midiToNote(midiNumber);
      allNotes.push(note);
    }
  });

  return allNotes;
}

// 랜덤 음표 생성
export function generateRandomBassNotes(count: number): BassNote[] {
  const allNotes = generateAllBassNotes();
  const shuffled = [...allNotes].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
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
export function generateMusicXML(notes: BassNote[]): string {
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
        <type>quarter</type>
        <lyric number="1">
          <syllabic>single</syllabic>
          <text>${noteToString(note)}</text>
        </lyric>
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
