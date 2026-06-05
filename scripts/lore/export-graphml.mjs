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
  outIndex === -1 ? "lore/graph/exports/world.graphml" : process.argv[outIndex + 1],
);

const relationKeys = new Set([
  "cards",
  "class",
  "cosmology",
  "event",
  "events",
  "faction",
  "factions",
  "materials",
  "motifs",
  "palette",
  "period",
  "races",
  "region",
  "scene",
  "scene_context",
  "style_core",
  "style_profile",
  "style_profiles",
  "site",
  "social_groups",
  "visual_motifs",
  "visual_rules",
]);

const relationMapKeys = new Set([
  "context",
  "images",
  "image_generation",
  "outputs",
  "legacy_seed",
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

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
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
    if (!value) {
      data[key] = [];
      continue;
    }
    if (value.startsWith("[") && value.endsWith("]")) {
      data[key] = value
        .slice(1, -1)
        .split(",")
        .map(stripYamlValue)
        .filter(Boolean);
      continue;
    }
    data[key] = value === "[]" ? [] : value;
  }
  return data;
}

function titleFromBody(body, file) {
  return (
    body.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? path.basename(file, ".md")
  );
}

function wikiLinks(body) {
  return Array.from(body.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g)).map(
    (match) => match[1].trim(),
  );
}

function asArray(value) {
  if (value === undefined || value === null || value === "") return [];
  return Array.isArray(value) ? value : [value];
}

function relationEntries(frontmatter) {
  const entries = [];
  for (const [key, value] of Object.entries(frontmatter)) {
    if (relationKeys.has(key)) {
      entries.push([key, value]);
      continue;
    }
    if (relationMapKeys.has(key) && value && typeof value === "object") {
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        entries.push([`${key}.${nestedKey}`, nestedValue]);
      }
    }
  }
  return entries;
}

function isEntityRef(value) {
  return /^[a-z][a-z0-9_-]*\.[^\s/]+/i.test(value);
}

const files = await walk(root);
const nodes = new Map();
const titleToId = new Map();
const fileSlugToId = new Map();

for (const file of files) {
  const body = await readFile(file, "utf8");
  const frontmatter = parseFrontmatter(body);
  const id =
    frontmatter.id ??
    path
      .relative(root, file)
      .replace(/\.md$/i, "")
      .split(path.sep)
      .join(".");
  const title = frontmatter.title ?? titleFromBody(body, file);
  const type = frontmatter.type ?? "note";
  const relativePath = path.relative(process.cwd(), file);
  nodes.set(id, { id, title, type, path: relativePath, frontmatter, body });
  titleToId.set(String(title), id);
  titleToId.set(path.basename(file, ".md"), id);
  fileSlugToId.set(path.basename(file, ".md"), id);
}

const edges = [];
const seenEdges = new Set();

function addEdge(source, target, relation) {
  if (!source || !target || source === target) return;
  const key = `${source}->${target}:${relation}`;
  if (seenEdges.has(key)) return;
  seenEdges.add(key);
  if (!nodes.has(target)) {
    nodes.set(target, {
      id: target,
      title: target,
      type: "external_ref",
      path: "",
      frontmatter: {},
      body: "",
    });
  }
  edges.push({ source, target, relation });
}

for (const node of nodes.values()) {
  for (const [key, value] of relationEntries(node.frontmatter)) {
    for (const ref of asArray(value)) {
      if (isEntityRef(ref)) addEdge(node.id, ref, key);
    }
  }

  for (const link of wikiLinks(node.body)) {
    const target = titleToId.get(link) ?? fileSlugToId.get(link) ?? link;
    addEdge(node.id, target, "wikilink");
  }
}

const nodeXml = Array.from(nodes.values())
  .sort((a, b) => a.id.localeCompare(b.id))
  .map(
    (node) => `    <node id="${escapeXml(node.id)}">
      <data key="type">${escapeXml(node.type)}</data>
      <data key="title">${escapeXml(node.title)}</data>
      <data key="path">${escapeXml(node.path)}</data>
    </node>`,
  )
  .join("\n");

const edgeXml = edges
  .map(
    (edge, index) => `    <edge id="e${index + 1}" source="${escapeXml(
      edge.source,
    )}" target="${escapeXml(edge.target)}">
      <data key="relation">${escapeXml(edge.relation)}</data>
    </edge>`,
  )
  .join("\n");

const graphml = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
  <key id="type" for="node" attr.name="type" attr.type="string"/>
  <key id="title" for="node" attr.name="title" attr.type="string"/>
  <key id="path" for="node" attr.name="path" attr.type="string"/>
  <key id="relation" for="edge" attr.name="relation" attr.type="string"/>
  <graph id="GRNSLore" edgedefault="directed">
${nodeXml}
${edgeXml}
  </graph>
</graphml>
`;

await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, graphml);

console.log(`Wrote ${nodes.size} nodes and ${edges.length} edges to ${out}`);
