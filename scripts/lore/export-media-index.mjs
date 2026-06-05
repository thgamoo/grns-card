import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const outDir = path.join(repoRoot, "lore/media/manifests");
const imageRoot = path.join(repoRoot, "docs/card-assets");
const dataRoot = path.join(repoRoot, "data/card-2026-06-01-v1");
const loreRoot = path.join(repoRoot, "lore");

const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function normalizeAssetPath(value) {
  return String(value ?? "")
    .replace(/^\.?\//, "")
    .replace(/\\/g, "/");
}

function serialFromFile(file) {
  return path.basename(file, path.extname(file)).match(/([a-z]{2}\d{2}-\d{4})/)?.[1] ?? null;
}

function packFromSerial(serial) {
  return serial?.match(/^([a-z]{2}\d{2})-/)?.[1] ?? null;
}

async function loadCards() {
  const cardsDir = path.join(dataRoot, "cards");
  const files = (await walk(cardsDir)).filter((file) => file.endsWith(".json"));
  const cards = new Map();

  for (const file of files) {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) continue;
    for (const card of parsed) {
      if (!card.serial) continue;
      const illustration = normalizeAssetPath(card.illustration);
      cards.set(card.serial, {
        id: `card.${card.serial}`,
        serial: card.serial,
        title: card.name,
        pack: card.expansionId ?? packFromSerial(card.serial),
        card_file: path.relative(repoRoot, file),
        illustration,
        lore_note: path.relative(
          repoRoot,
          path.join(loreRoot, "cards", card.expansionId ?? packFromSerial(card.serial) ?? "unknown", `${card.serial}.md`),
        ),
      });
    }
  }

  return cards;
}

function classifyAsset(relativePath, card) {
  if (card) return "card_illustration";
  if (relativePath.includes("/deck-banners/")) return "deck_banner";
  if (relativePath.includes("/common/")) return "card_common";
  if (relativePath.includes("/ui/")) return "ui_asset";
  if (relativePath.includes("/tutorial-board/")) return "scene_candidate";
  if (relativePath.includes("/tutorial-lords/")) return "tutorial_character";
  if (relativePath.includes("/illustrations/")) return "illustration_unmapped";
  return "asset";
}

function nodeFor(relativePath, card) {
  if (card) return card.id;
  if (relativePath.includes("/tutorial-board/")) return "scene.onboarding-first-gate";
  if (relativePath.includes("/tutorial-lords/")) return "scene.onboarding-first-gate";
  if (relativePath.includes("/deck-banners/sushin")) return "group.animal-entourage";
  if (relativePath.includes("/deck-banners/shinmo")) return "group.animal-entourage";
  if (relativePath.includes("/deck-banners/pioneer")) return "motif.black-bird-head";
  return null;
}

await mkdir(outDir, { recursive: true });

const cards = await loadCards();
const imageFiles = (await walk(imageRoot)).filter((file) =>
  imageExtensions.has(path.extname(file).toLowerCase()),
);

const images = imageFiles
  .map((file) => {
    const asset_path = path.relative(repoRoot, file).replace(/\\/g, "/");
    const serial = serialFromFile(file);
    const card = serial ? cards.get(serial) : null;
    const pack = card?.pack ?? packFromSerial(serial);
    const kind = classifyAsset(asset_path, card);
    const node_id = nodeFor(asset_path, card);

    return {
      id: asset_path,
      asset_path,
      kind,
      node_id,
      serial,
      pack,
      role: card ? "final_asset" : kind,
      title: card?.title ?? path.basename(file, path.extname(file)),
      card_file: card?.card_file,
      lore_note: card?.lore_note,
      discovered_from:
        card?.illustration === asset_path
          ? "card_data.illustration"
          : "filesystem",
    };
  })
  .sort((a, b) => a.asset_path.localeCompare(b.asset_path));

const cardAssets = images.filter((image) => image.kind === "card_illustration");

await writeFile(
  path.join(outDir, "image-index.json"),
  `${JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      asset_root: "docs/card-assets",
      images,
    },
    null,
    2,
  )}\n`,
);

await writeFile(
  path.join(outDir, "card-assets.json"),
  `${JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      asset_root: "docs/card-assets",
      images: cardAssets,
    },
    null,
    2,
  )}\n`,
);

console.log(
  `Indexed ${images.length} media assets (${cardAssets.length} card illustrations) into ${outDir}`,
);
