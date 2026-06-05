import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const cardsPath = path.join(
  repoRoot,
  "data/card-2026-06-01-v1/cards/ob01/ob01-pack.json",
);
const outDir = path.join(repoRoot, "lore/cards/ob01");
const force = process.argv.includes("--force");

const raceIdMap = new Map([
  ["인간", "race.human"],
  ["짐승", "race.beast"],
  ["귀신", "race.ghost"],
  ["도깨비", "race.dokkaebi"],
  ["도구", "race.tool"],
  ["알", "race.egg"],
]);

function yamlValue(value) {
  if (value === "" || value === undefined || value === null) return '""';
  return JSON.stringify(String(value));
}

function yamlList(key, values) {
  const items = values.filter(Boolean);
  if (items.length === 0) return `${key}: []`;
  return [`${key}:`, ...items.map((item) => `  - ${yamlValue(item)}`)].join(
    "\n",
  );
}

function indentedYamlList(key, values, indent = "  ") {
  const items = values.filter(Boolean);
  if (items.length === 0) return `${indent}${key}: []`;
  return [
    `${indent}${key}:`,
    ...items.map((item) => `${indent}  - ${yamlValue(item)}`),
  ].join("\n");
}

function raceIds(race) {
  return String(race || "")
    .split(/[\/,·\s]+/)
    .filter(Boolean)
    .map((item) => raceIdMap.get(item) ?? `race.${slug(item)}`);
}

function slug(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/^-+|-+$/g, "");
}

function motifsFor(card) {
  const text = `${card.name} ${card.effect} ${card.lore} ${card.sigil}`;
  const motifs = new Set();
  if (/문지기|門|고양이|여우/.test(text)) motifs.add("motif.beast-gatekeeper");
  if (/희생|단말마|매장지|冥/.test(text)) {
    motifs.add("motif.sacrifice-under-deck");
  }
  if (/검은 새|까마귀|三足|烏/.test(text)) {
    motifs.add("motif.three-legged-crow");
  }
  if (/검은 새 머리/.test(text)) motifs.add("motif.black-bird-head");
  return Array.from(motifs);
}

function groupsFor(card) {
  const text = `${card.name} ${card.race} ${card.effect}`;
  const groups = new Set(["group.animal-entourage"]);
  if (/문지기|공격할 수 없다/.test(text)) groups.add("group.beast-gatekeepers");
  if (/수신|신모|선구자|성주/.test(text)) groups.add("group.onboarding-spirits");
  return Array.from(groups);
}

function subjectLine(card) {
  const race = card.race ? `${card.race} ` : "";
  return `${race}${card.name}`;
}

function imageBrief(card) {
  const motifs = motifsFor(card);
  const base = `${subjectLine(card)}를 첫성문 앞의 작은 전쟁 의식으로 그린다. 카드 효과의 규칙 제스처가 장면 안에서 자연스럽게 보이게 한다.`;
  if (motifs.includes("motif.sacrifice-under-deck")) {
    return `${base} 밝은 시작 덱의 표면 아래에 희생과 매장지의 어두운 비용이 스며 있어야 한다.`;
  }
  if (motifs.includes("motif.beast-gatekeeper")) {
    return `${base} 성문과 문지기 자리의 문턱성이 분명해야 한다.`;
  }
  if (motifs.includes("motif.three-legged-crow")) {
    return `${base} 까마귀의 징조성과 단말마의 여운을 강하게 둔다.`;
  }
  return base;
}

function noteFor(card) {
  const races = raceIds(card.race);
  const motifs = motifsFor(card);
  const groups = groupsFor(card);
  const assetPath = (card.illustration ?? "").replace(/^\.\//, "");
  const cardFile = "data/card-2026-06-01-v1/cards/ob01/ob01-pack.json";
  const frontmatter = [
    "---",
    `id: card.${card.serial}`,
    "type: card",
    `title: ${yamlValue(card.name)}`,
    "status: extracted",
    `serial: ${yamlValue(card.serial)}`,
    `expansion: ${yamlValue(card.expansionId)}`,
    `theme: ${yamlValue(card.theme)}`,
    `sigil: ${yamlValue(card.sigil)}`,
    `cost: ${card.cost ?? 0}`,
    `power: ${card.power ?? 0}`,
    "context:",
    `  scene: ${yamlValue("scene.onboarding-first-gate")}`,
    `  site: ${yamlValue("site.first-gate")}`,
    `  period: ${yamlValue("period.first-gate-learning-age")}`,
    `  faction: ${yamlValue("faction.neutral")}`,
    `  class: ${yamlValue("class.onboarding")}`,
    `  style_profile: ${yamlValue("style-profile.ob01")}`,
    indentedYamlList("races", races),
    indentedYamlList("social_groups", groups),
    indentedYamlList("motifs", motifs),
    "grounded_in:",
    `  - ${yamlValue("lore/scenes/onboarding-first-gate.md")}`,
    `  - ${yamlValue("lore/societies/classes/onboarding.md")}`,
    `  - ${yamlValue("world/stories/first-gate/beom.md")}`,
    `  - ${yamlValue("world/stories/first-gate/bear.md")}`,
    `  - ${yamlValue("world/stories/first-gate/cat.md")}`,
    `  - ${yamlValue("world/stories/first-gate/fox.md")}`,
    `  - ${yamlValue("world/stories/first-gate/wolf.md")}`,
    "outputs:",
    `  card_data: ${yamlValue(cardFile)}`,
    `  illustration: ${yamlValue(assetPath)}`,
    "images:",
    `  cover: ${yamlValue(assetPath)}`,
    "  selected:",
    `    - ${yamlValue(assetPath)}`,
    "  references: []",
    "  generated: []",
    "image_generation:",
    "  reference_images:",
    `    - ${yamlValue(assetPath)}`,
    "legacy_seed:",
    `  card_file: ${yamlValue(cardFile)}`,
    "  card_fields:",
    `    - ${yamlValue("name")}`,
    `    - ${yamlValue("cost")}`,
    `    - ${yamlValue("faction")}`,
    `    - ${yamlValue("classId")}`,
    `    - ${yamlValue("className")}`,
    `    - ${yamlValue("theme")}`,
    `    - ${yamlValue("type")}`,
    `    - ${yamlValue("race")}`,
    `    - ${yamlValue("effect")}`,
    `    - ${yamlValue("lore")}`,
    `    - ${yamlValue("guide")}`,
    `    - ${yamlValue("power")}`,
    `    - ${yamlValue("sigil")}`,
    `    - ${yamlValue("illustration")}`,
    "---",
  ].join("\n");

  const sections = [
    `# ${card.name}`,
    "",
    "## Card Text",
    "",
    card.effect?.trim() || "_No rules text yet._",
    "",
    "## Flavor",
    "",
    card.lore?.trim() || "_No flavor text yet._",
    "",
    "## Guide",
    "",
    card.guide?.trim() || "_No guide text._",
    "",
    "## Image Brief",
    "",
    imageBrief(card),
    "",
    "## Links",
    "",
    "- [[onboarding-first-gate]]",
    "- [[first-gate]]",
    "- [[onboarding]]",
    ...motifs.map((motif) => `- [[${motif.split(".").slice(1).join(".")}]]`),
    "",
  ];

  return `${frontmatter}\n\n${sections.join("\n")}`;
}

await mkdir(outDir, { recursive: true });
const cards = JSON.parse(await readFile(cardsPath, "utf8"));
let written = 0;
let skipped = 0;

for (const card of cards) {
  const outPath = path.join(outDir, `${card.serial}.md`);
  if (!force) {
    try {
      await access(outPath);
      skipped += 1;
      continue;
    } catch {
      // Missing files are created below.
    }
  }
  await writeFile(outPath, noteFor(card));
  written += 1;
}

console.log(
  `Extracted ${written} ob01 lore card notes into ${outDir} (${skipped} skipped)`,
);
