import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const args = new Set(process.argv.slice(2));
const rootArg = process.argv[process.argv.indexOf("--root") + 1];
const root = path.resolve(process.cwd(), rootArg && !rootArg.startsWith("--") ? rootArg : "lore");
const write = args.has("--write");

const typeBySegment = new Map([
  ["cards", "card"],
  ["scenes", "scene_context"],
  ["regions", "region"],
  ["sites", "site"],
  ["periods", "period"],
  ["events", "event"],
  ["factions", "faction"],
  ["classes", "class"],
  ["groups", "social_group"],
  ["cosmology", "cosmology"],
  ["motifs", "motif"],
  ["materials", "material"],
  ["palettes", "palette"],
  ["rules", "rule"],
  ["indexes", "index"],
]);

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

function slug(value) {
  return value
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}/_-]+/gu, "")
    .replace(/[/_-]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

function inferTitle(body, file) {
  const heading = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading) return heading;
  return path.basename(file, ".md").replace(/[-_]+/g, " ");
}

function inferType(relativePath) {
  const parts = relativePath.split(path.sep);
  for (const part of parts) {
    const type = typeBySegment.get(part);
    if (type) return type;
  }
  return "note";
}

function yamlString(value) {
  return JSON.stringify(value);
}

const files = await walk(root);
let changed = 0;

for (const file of files) {
  const body = await readFile(file, "utf8");
  if (body.startsWith("---\n")) continue;

  const relative = path.relative(root, file);
  const title = inferTitle(body, file);
  const type = inferType(relative);
  const id = `${type}.${slug(relative)}`;
  const tagParts = relative
    .split(path.sep)
    .slice(0, -1)
    .filter((part) => part !== "lore");

  const frontmatter = [
    "---",
    `id: ${id}`,
    `type: ${type}`,
    `title: ${yamlString(title)}`,
    "status: draft",
    "tags:",
    ...tagParts.map((part) => `  - ${yamlString(part)}`),
    "---",
    "",
  ].join("\n");

  changed += 1;
  if (write) {
    await writeFile(file, `${frontmatter}${body}`);
  } else {
    console.log(`[missing] ${relative}`);
  }
}

console.log(
  write
    ? `Added frontmatter to ${changed} Markdown files under ${root}`
    : `${changed} Markdown files are missing frontmatter under ${root}`,
);
