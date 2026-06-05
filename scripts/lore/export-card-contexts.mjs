import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const rootIndex = process.argv.indexOf("--root");
const outIndex = process.argv.indexOf("--out");
const root = path.resolve(
  process.cwd(),
  rootIndex === -1 ? "lore" : process.argv[rootIndex + 1],
);
const out = path.resolve(
  process.cwd(),
  outIndex === -1 ? "lore/generated/card-contexts.json" : process.argv[outIndex + 1],
);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
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
      const value = stripYamlValue(rawValue);
      data[currentKey][nestedKey] = value === "[]" || !value ? [] : value;
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
      data[currentKey][currentNestedKey].push(stripYamlValue(nestedListItem[1]));
      continue;
    }

    const listItem = line.match(/^\s*-\s+(.+)$/);
    if (listItem && currentKey) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = [];
      data[currentKey].push(stripYamlValue(listItem[1]));
      continue;
    }

    const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!pair) continue;
    const [, key, rawValue] = pair;
    currentKey = key;
    currentNestedKey = null;
    const value = stripYamlValue(rawValue);
    data[key] = value === "[]" || !value ? [] : value;
  }

  return data;
}

const cardFiles = (await walk(path.join(root, "cards"))).sort();
const cards = [];

for (const file of cardFiles) {
  const body = await readFile(file, "utf8");
  const frontmatter = parseFrontmatter(body);
  if (frontmatter.type !== "card") continue;

  cards.push({
    id: frontmatter.id,
    serial: frontmatter.serial,
    title: frontmatter.title,
    status: frontmatter.status,
    expansion: frontmatter.expansion,
    context: frontmatter.context ?? {},
    grounded_in: frontmatter.grounded_in ?? [],
    outputs: frontmatter.outputs ?? {},
    images: frontmatter.images ?? {},
    image_generation: frontmatter.image_generation ?? {},
    legacy_seed: frontmatter.legacy_seed ?? null,
    note_path: path.relative(process.cwd(), file),
  });
}

await mkdir(path.dirname(out), { recursive: true });
await writeFile(
  out,
  `${JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      source_root: path.relative(process.cwd(), root) || ".",
      cards,
    },
    null,
    2,
  )}\n`,
);

console.log(`Wrote ${cards.length} card context entries to ${out}`);
