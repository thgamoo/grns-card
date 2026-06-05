import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const rootIndex = process.argv.indexOf("--root");
const outIndex = process.argv.indexOf("--out");
const cardIndex = process.argv.indexOf("--card");
const root = path.resolve(
  process.cwd(),
  rootIndex === -1 ? "lore" : process.argv[rootIndex + 1],
);
const outRoot = path.resolve(
  process.cwd(),
  outIndex === -1 ? "lore/cache/image-contexts" : process.argv[outIndex + 1],
);
const requestedCard = cardIndex === -1 ? null : process.argv[cardIndex + 1];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (
      entry.name.startsWith(".") ||
      entry.name === "node_modules" ||
      entry.name === "cache"
    ) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }
  return files;
}

function stripYamlValue(value) {
  return value
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\s+#.*$/g, "")
    .trim();
}

function parseScalar(value) {
  const stripped = stripYamlValue(value);
  if (!stripped || stripped === "[]") return [];
  if (/^-?\d+(\.\d+)?$/.test(stripped)) return Number(stripped);
  if (stripped === "true") return true;
  if (stripped === "false") return false;
  if (stripped.startsWith("[") && stripped.endsWith("]")) {
    return stripped
      .slice(1, -1)
      .split(",")
      .map(stripYamlValue)
      .filter(Boolean);
  }
  return stripped;
}

function parseFrontmatter(body) {
  if (!body.startsWith("---\n")) return {};
  const end = body.indexOf("\n---", 4);
  if (end === -1) return {};
  const yaml = body.slice(4, end).split(/\r?\n/);
  const data = {};
  let currentKey = null;
  let currentNestedKey = null;

  for (const line of yaml) {
    const nestedPair = line.match(/^\s{2}([A-Za-z0-9_-]+):\s*(.*)$/);
    if (nestedPair && currentKey) {
      const [, nestedKey, rawValue] = nestedPair;
      currentNestedKey = nestedKey;
      if (
        !data[currentKey] ||
        Array.isArray(data[currentKey]) ||
        typeof data[currentKey] !== "object"
      ) {
        data[currentKey] = {};
      }
      data[currentKey][nestedKey] = parseScalar(rawValue);
      continue;
    }

    const nestedListItem = line.match(/^\s{4}-\s+(.+)$/);
    if (nestedListItem && currentKey && currentNestedKey) {
      if (
        !data[currentKey] ||
        Array.isArray(data[currentKey]) ||
        typeof data[currentKey] !== "object"
      ) {
        data[currentKey] = {};
      }
      if (!Array.isArray(data[currentKey][currentNestedKey])) {
        data[currentKey][currentNestedKey] = [];
      }
      data[currentKey][currentNestedKey].push(parseScalar(nestedListItem[1]));
      continue;
    }

    const listItem = line.match(/^\s*-\s+(.+)$/);
    if (listItem && currentKey) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = [];
      data[currentKey].push(parseScalar(listItem[1]));
      continue;
    }

    const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!pair) continue;
    const [, key, rawValue] = pair;
    currentKey = key;
    currentNestedKey = null;
    data[key] = parseScalar(rawValue);
  }

  return data;
}

function bodyWithoutFrontmatter(body) {
  if (!body.startsWith("---\n")) return body;
  const end = body.indexOf("\n---", 4);
  return end === -1 ? body : body.slice(end + 4).trim();
}

function titleFromBody(body, file) {
  return (
    body.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? path.basename(file, ".md")
  );
}

function sections(body) {
  const result = {};
  const matches = Array.from(body.matchAll(/^##\s+(.+)$/gm));
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const title = match[1].trim();
    const start = match.index + match[0].length;
    const end =
      index + 1 < matches.length ? matches[index + 1].index : body.length;
    result[title] = body.slice(start, end).trim();
  }
  return result;
}

function asArray(value) {
  if (value === undefined || value === null || value === "") return [];
  return Array.isArray(value) ? value : [value];
}

function relationValues(frontmatter) {
  const refs = [];
  const directKeys = [
    "style_core",
    "region",
    "site",
    "period",
    "event",
    "events",
    "faction",
    "factions",
    "class",
    "social_groups",
    "motifs",
    "palette",
    "materials",
    "visual_rules",
    "style_profiles",
  ];

  for (const key of directKeys) {
    refs.push(...asArray(frontmatter[key]));
  }

  for (const value of Object.values(frontmatter.context ?? {})) {
    refs.push(...asArray(value));
  }

  refs.push(...asArray(frontmatter.grounded_in));
  return refs.filter((value) => typeof value === "string" && value);
}

function cleanImagesForGeneration(frontmatter) {
  return {
    cover: frontmatter.images?.cover ?? null,
    references: frontmatter.images?.references ?? [],
    generated: frontmatter.images?.generated ?? [],
  };
}

function noteSummary(note) {
  const noteSections = sections(note.body);
  return {
    id: note.id,
    type: note.type,
    title: note.title,
    path: note.relativePath,
    frontmatter: note.frontmatter,
    sections: noteSections,
  };
}

function outputName(card) {
  return `${card.frontmatter.serial ?? card.id.replace(/^card\./, "")}.json`;
}

const files = await walk(root);
const notes = [];
const byId = new Map();
const byPath = new Map();

for (const file of files) {
  const raw = await readFile(file, "utf8");
  const frontmatter = parseFrontmatter(raw);
  const body = bodyWithoutFrontmatter(raw);
  const id =
    frontmatter.id ??
    path
      .relative(root, file)
      .replace(/\.md$/i, "")
      .split(path.sep)
      .join(".");
  const note = {
    id,
    type: frontmatter.type ?? "note",
    title: frontmatter.title ?? titleFromBody(body, file),
    relativePath: path.relative(process.cwd(), file),
    rootRelativePath: path.relative(root, file),
    frontmatter,
    body,
  };
  notes.push(note);
  byId.set(id, note);
  byPath.set(note.relativePath, note);
  byPath.set(note.rootRelativePath, note);
}

const cards = notes
  .filter((note) => note.type === "card")
  .filter(
    (note) =>
      !requestedCard ||
      note.id === requestedCard ||
      note.frontmatter.serial === requestedCard,
  )
  .sort((a, b) => a.id.localeCompare(b.id));

const indexEntries = [];

await mkdir(outRoot, { recursive: true });

for (const card of cards) {
  const refs = relationValues(card.frontmatter);
  const resolved = refs
    .map((ref) => byId.get(ref) ?? byPath.get(ref))
    .filter(Boolean);
  const uniqueResolved = Array.from(
    new Map(resolved.map((note) => [note.id, note])).values(),
  ).sort((a, b) => a.id.localeCompare(b.id));

  const imageGeneration = card.frontmatter.image_generation ?? {};
  const payload = {
    generated_at: new Date().toISOString(),
    cache_kind: "image_context",
    cache_policy: {
      gitignored: true,
      source_of_truth: false,
      regenerate_with:
        "node scripts/lore/build-image-context-cache.mjs --root lore",
      selected_images_read: false,
      selected_images_note:
        "images.selected is used by promotion after selection, not as image-generation input.",
    },
    card: {
      id: card.id,
      serial: card.frontmatter.serial,
      expansion: card.frontmatter.expansion,
      title: card.title,
      status: card.frontmatter.status,
      theme: card.frontmatter.theme,
      sigil: card.frontmatter.sigil,
      cost: card.frontmatter.cost,
      power: card.frontmatter.power,
      path: card.relativePath,
      context: card.frontmatter.context ?? {},
      grounded_in: card.frontmatter.grounded_in ?? [],
      outputs: card.frontmatter.outputs ?? {},
      images_for_generation: cleanImagesForGeneration(card.frontmatter),
      image_generation: {
        ...imageGeneration,
        reference_images: imageGeneration.reference_images ?? [],
      },
      sections: sections(card.body),
    },
    context_notes: uniqueResolved.map(noteSummary),
  };

  const outFile = path.join(outRoot, outputName(card));
  await writeFile(outFile, `${JSON.stringify(payload, null, 2)}\n`);
  indexEntries.push({
    card: card.id,
    serial: card.frontmatter.serial,
    title: card.title,
    cache_file: path.relative(process.cwd(), outFile),
    context_notes: uniqueResolved.map((note) => note.id),
  });
}

const indexPayload = {
  generated_at: new Date().toISOString(),
  cache_kind: "image_context_index",
  card_count: indexEntries.length,
  entries: indexEntries,
};

await writeFile(
  path.join(outRoot, "index.json"),
  `${JSON.stringify(indexPayload, null, 2)}\n`,
);

console.log(`Wrote ${indexEntries.length} image context cache files to ${outRoot}`);
