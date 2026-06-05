import { cp, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dataSource = new URL("../../data/", import.meta.url);
const dataTarget = new URL("../public/data/", import.meta.url);
const docsSource = new URL("../../docs/", import.meta.url);
const docsTarget = new URL("../public/docs/", import.meta.url);
const worldSource = new URL("../../world/", import.meta.url);
const worldTarget = new URL("../public/world/", import.meta.url);
const repoRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));

function runNodeScript(scriptPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd: repoRoot,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${scriptPath} exited with code ${code}`));
    });
  });
}

await runNodeScript("scripts/lore/promote-selected-media.mjs");

await rm(dataTarget, { recursive: true, force: true });
await cp(dataSource, dataTarget, { recursive: true });
await rm(docsTarget, { recursive: true, force: true });
await cp(docsSource, docsTarget, { recursive: true });
await rm(worldTarget, { recursive: true, force: true });
await cp(worldSource, worldTarget, { recursive: true });

console.log("Synced card data, docs, and world archive into grns-card/public");
