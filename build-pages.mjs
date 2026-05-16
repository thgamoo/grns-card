import { mkdir, cp, readFile, writeFile, rm } from "node:fs/promises";

const dist = "dist";
const publicModeScript = "<script>window.GRNS_PUBLIC_MODE = true;</script>";

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

await Promise.all([
  cp("styles.css", `${dist}/styles.css`),
  cp("app.js", `${dist}/app.js`),
  cp("server.mjs", `${dist}/server.mjs`),
  cp("data", `${dist}/data`, { recursive: true }),
  cp("docs", `${dist}/docs`, { recursive: true }),
]);

const html = await readFile("index.html", "utf8");
const withoutEditor = html
  .replace(/\n\s*<!-- EDITOR_ACTION_START -->[\s\S]*?<!-- EDITOR_ACTION_END -->\s*\n/, "\n")
  .replace(/\n\s*<!-- EDITOR_START -->[\s\S]*?<!-- EDITOR_END -->\s*\n/, "\n");
const publicHtml = withoutEditor.replace("<script src=\"./app.js\"></script>", `${publicModeScript}\n    <script src="./app.js"></script>`);
await writeFile(`${dist}/index.html`, publicHtml);

console.log("Built GitHub Pages artifact in ./dist");
