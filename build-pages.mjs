import { mkdir, cp, readFile, writeFile, rm } from "node:fs/promises";

const dist = "dist";

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
await writeFile(`${dist}/index.html`, html);

console.log("Built GitHub Pages artifact in ./dist");
