import { cp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const loreRoot = path.join(repoRoot, "lore");
const outPath = path.join(loreRoot, "media/manifests/selected-media.json");

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

function asArray(value) {
  if (value === undefined || value === null || value === "") return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeRepoPath(value) {
  return String(value ?? "")
    .replace(/^\.?\//, "")
    .replace(/\\/g, "/");
}

function resolveRepoPath(relativePath) {
  return path.join(repoRoot, normalizeRepoPath(relativePath));
}

function isSafeAssetOutput(relativePath) {
  return normalizeRepoPath(relativePath).startsWith("docs/card-assets/");
}

const cardFiles = (await walk(path.join(loreRoot, "cards"))).sort();
const entries = [];
let copied = 0;
let unchanged = 0;
let skipped = 0;

for (const file of cardFiles) {
  const body = await readFile(file, "utf8");
  const frontmatter = parseFrontmatter(body);
  if (frontmatter.type !== "card") continue;

  const selected = asArray(frontmatter.images?.selected).filter(Boolean);
  const output = normalizeRepoPath(frontmatter.outputs?.illustration);
  const selectedPath = normalizeRepoPath(selected[0]);
  const notePath = path.relative(repoRoot, file).replace(/\\/g, "/");

  if (!selectedPath || !output) {
    skipped += 1;
    entries.push({
      node_id: frontmatter.id,
      serial: frontmatter.serial,
      title: frontmatter.title,
      note_path: notePath,
      selected_path: selectedPath || null,
      output_path: output || null,
      action: "skipped",
      reason: "missing selected image or outputs.illustration",
    });
    continue;
  }

  if (!isSafeAssetOutput(output)) {
    skipped += 1;
    entries.push({
      node_id: frontmatter.id,
      serial: frontmatter.serial,
      title: frontmatter.title,
      note_path: notePath,
      selected_path: selectedPath,
      output_path: output,
      action: "skipped",
      reason: "outputs.illustration is outside docs/card-assets",
    });
    continue;
  }

  if (selectedPath === output) {
    unchanged += 1;
    entries.push({
      node_id: frontmatter.id,
      serial: frontmatter.serial,
      title: frontmatter.title,
      note_path: notePath,
      selected_path: selectedPath,
      output_path: output,
      action: "unchanged",
      reason: "legacy selected image already lives at final asset path",
    });
    continue;
  }

  await mkdir(path.dirname(resolveRepoPath(output)), { recursive: true });
  await cp(resolveRepoPath(selectedPath), resolveRepoPath(output));
  copied += 1;
  entries.push({
    node_id: frontmatter.id,
    serial: frontmatter.serial,
    title: frontmatter.title,
    note_path: notePath,
    selected_path: selectedPath,
    output_path: output,
    action: "copied",
  });
}

await mkdir(path.dirname(outPath), { recursive: true });
await writeFile(
  outPath,
  `${JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      copied,
      unchanged,
      skipped,
      entries,
    },
    null,
    2,
  )}\n`,
);

console.log(
  `Promoted selected media: ${copied} copied, ${unchanged} unchanged, ${skipped} skipped`,
);
