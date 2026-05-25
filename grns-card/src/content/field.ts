export const battlefieldSlots = [
  {
    id: "front-1",
    name: "야전병",
    note: "가장 왼쪽 진. 문지기 1과 대각으로 맞닿아 장악과 공격 경로를 만든다.",
  },
  {
    id: "front-2",
    name: "야전병",
    note: "문지기 1과 2 사이를 압박하는 진. 양쪽 문지기 중 비어 있는 곳을 노리기 쉽다.",
  },
  {
    id: "front-3",
    name: "야전병",
    note: "중앙 진. 성주로 향하는 압박이 가장 잘 보이는 자리다.",
  },
  {
    id: "front-4",
    name: "야전병",
    note: "문지기 3과 4 사이를 압박하는 진. 이동 후 장악 판단이 자주 일어난다.",
  },
  {
    id: "front-5",
    name: "야전병",
    note: "가장 오른쪽 진. 문지기 4와 대각으로 맞닿아 외곽 공격선을 만든다.",
  },
];

export const gateSlots = [
  {
    id: "gate-1",
    name: "문지기 1",
    note: "첫 번째와 두 번째 야전병 사이의 수비점. 비공개로 시작하고 공격받으면 등장한다.",
  },
  {
    id: "gate-2",
    name: "문지기 2",
    note: "두 번째와 세 번째 야전병 사이의 수비점. 중앙으로 향하는 첫 관문이다.",
  },
  {
    id: "gate-3",
    name: "문지기 3",
    note: "세 번째와 네 번째 야전병 사이의 수비점. 성주 주변 전투를 지연시킨다.",
  },
  {
    id: "gate-4",
    name: "문지기 4",
    note: "네 번째와 다섯 번째 야전병 사이의 수비점. 외곽 장악을 막는 마지막 문이다.",
  },
];

type FieldTerm = {
  name: string;
  note: string;
  aliases?: string[];
  showOnField?: boolean;
};

const supportZones = [
  {
    name: "군영",
    note: "손패. 출정, 보급병 배치, 퇴출과 공개가 이루어지는 시작점입니다.",
  },
  {
    name: "징집소",
    note: "덱. 전쟁 시작 시 40장으로 구성하고, 비면 즉시 패배합니다.",
  },
  {
    name: "후방기지",
    note: "아직 보급하지 않은 보급병이 머무는 곳. 공격과 이동의 비용을 준비합니다. (사용하지 않은 자원)",
  },
  {
    name: "전진기지",
    note: "보급에 사용된 카드가 이동하는 곳입니다. (사용한 자원)",
  },
  {
    name: "매장지",
    note: "쓰러진 카드가 가는 공개 더미. 성주가 이곳으로 가면 패배합니다.",
  },
  {
    name: "발각된 군영",
    note: "공개된 카드를 내려놓는 별도 공간입니다.",
  },
  {
    name: "검은 강",
    note: "퇴출로 죽은 카드들이 가는 별도 공간입니다.",
  },
];

const fieldTerms: FieldTerm[] = [
  {
    name: "전장",
    note: "야전병 5장이 세로로 서는 구획. 공격, 이동, 장악 판단이 일어나는 전투 중심입니다.",
    showOnField: true,
  },
  {
    name: "성",
    note: "문지기 4장과 성주 1장을 포함하는 구획입니다.",
    showOnField: true,
  },
  ...supportZones.map((zone) => ({
    ...zone,
    showOnField: true,
  })),
  {
    name: "야전병",
    note: "전장에 서는 카드입니다. 공격, 이동, 장악 판단의 주체가 됩니다.",
  },
  {
    name: "문지기",
    note: "성의 입구를 지키는 수비 카드입니다. 비공개로 시작하고 공격받으면 등장합니다.",
  },
  {
    name: "성주",
    note: "성에 놓이는 핵심 카드입니다. 성주가 매장지로 이동하면 즉시 패배합니다.",
  },
  {
    name: "진",
    note: "전장 안에서 야전병이 서는 자리입니다. 이동과 대치 판단의 기준이 됩니다.",
  },
];

export const fieldPositionNotes = fieldTerms
  .filter((term) => term.showOnField)
  .map(({ name, note }) => ({ name, note }));

export const fieldTermNotes = Object.fromEntries(
  fieldTerms.flatMap((term) => [
    [term.name, term.note],
    ...(term.aliases ?? []).map((alias) => [alias, term.note]),
  ]),
) as Record<string, string>;
