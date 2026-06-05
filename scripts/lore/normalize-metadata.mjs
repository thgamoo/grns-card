import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const rootArg = process.argv[process.argv.indexOf("--root") + 1];
const root = path.resolve(process.cwd(), rootArg && !rootArg.startsWith("--") ? rootArg : "lore");

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

let changed = 0;

for (const file of await walk(root)) {
  const body = await readFile(file, "utf8");
  if (!body.startsWith("---\n")) continue;
  const end = body.indexOf("\n---", 4);
  if (end === -1) continue;

  const frontmatter = body.slice(0, end);
  if (!/^source:/m.test(frontmatter)) continue;

  const next = `${frontmatter.replace(/^source:/m, "grounded_in:")}${body.slice(end)}`;
  await writeFile(file, next);
  changed += 1;
}

console.log(`Normalized metadata in ${changed} lore Markdown files under ${root}`);
