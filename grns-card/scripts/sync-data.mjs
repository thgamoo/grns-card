import { cp, rm } from "node:fs/promises";

const dataSource = new URL("../../data/", import.meta.url);
const dataTarget = new URL("../public/data/", import.meta.url);
const docsSource = new URL("../../docs/", import.meta.url);
const docsTarget = new URL("../public/docs/", import.meta.url);
const worldSource = new URL("../../world/", import.meta.url);
const worldTarget = new URL("../public/world/", import.meta.url);

await rm(dataTarget, { recursive: true, force: true });
await cp(dataSource, dataTarget, { recursive: true });
await rm(docsTarget, { recursive: true, force: true });
await cp(docsSource, docsTarget, { recursive: true });
await rm(worldTarget, { recursive: true, force: true });
await cp(worldSource, worldTarget, { recursive: true });

console.log("Synced card data, docs, and world archive into grns-card/public");
