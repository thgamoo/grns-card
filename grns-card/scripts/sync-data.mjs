import { cp, rm } from "node:fs/promises";

const source = new URL("../../data/", import.meta.url);
const target = new URL("../public/data/", import.meta.url);

await rm(target, { recursive: true, force: true });
await cp(source, target, { recursive: true });

console.log("Synced card data into grns-card/public/data");
