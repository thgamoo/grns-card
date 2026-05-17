import { mkdir, cp, readdir, rm } from "node:fs/promises";

const dist = "dist";

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

await Promise.all([
  cp("styles.css", `${dist}/styles.css`),
  cp("app.js", `${dist}/app.js`),
  cp("server.mjs", `${dist}/server.mjs`),
  cp("data", `${dist}/data`, { recursive: true }),
  cp("docs", `${dist}/docs`, { recursive: true }),
  cp("world", `${dist}/world`, { recursive: true }),
]);

const htmlFiles = (await readdir(".")).filter((file) => file.endsWith(".html"));
await Promise.all(htmlFiles.map((file) => cp(file, `${dist}/${file}`)));

console.log("Built GitHub Pages artifact in ./dist");
