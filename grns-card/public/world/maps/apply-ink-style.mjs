import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const [inputArg, outputArg] = process.argv.slice(2);

if (!inputArg) {
  console.error("Usage: node world/maps/apply-ink-style.mjs <input.svg> [output.svg]");
  process.exit(1);
}

const inputPath = path.resolve(inputArg);
const outputPath = path.resolve(outputArg ?? inputArg);

const styleBlock = `<style id="inkWashMapStyle"><![CDATA[
svg#fantasyMap {
  background: #e8e1cf;
  color: #1b130b;
}

#oceanBase,
#ocean {
  fill: #c8cbc1 !important;
}

#oceanPattern {
  opacity: 0.42 !important;
  filter: url(#paperGrain);
}

#landmass path,
#provincesBody path {
  fill: #eadfca !important;
  fill-opacity: 0.38 !important;
  stroke: #24160b !important;
  stroke-opacity: 0.72 !important;
  stroke-width: 0.72 !important;
  filter: url(#inkBleed);
}

#provincesBody path:nth-child(3n) {
  fill: #ded2bb !important;
}

#provincesBody path:nth-child(4n) {
  fill: #f0e8d8 !important;
}

#lakes path,
#freshwater path {
  fill: #d2d5ca !important;
  stroke: #21150c !important;
  stroke-opacity: 0.76 !important;
  stroke-width: 0.8 !important;
}

#rivers path {
  fill: none !important;
  stroke: #20150c !important;
  stroke-opacity: 0.82 !important;
  stroke-width: 0.92 !important;
  stroke-linecap: round !important;
  filter: url(#inkBleed);
}

#stateBorders path {
  fill: none !important;
  stroke: #120c07 !important;
  stroke-opacity: 0.9 !important;
  stroke-width: 1.35 !important;
  filter: url(#inkBleed);
}

#provinceBorders path {
  fill: none !important;
  stroke: #2b1a0e !important;
  stroke-opacity: 0.62 !important;
  stroke-width: 0.72 !important;
  stroke-dasharray: 2 3 !important;
}

#coastline path,
#sea_island path {
  fill: none !important;
  stroke: #110b06 !important;
  stroke-opacity: 0.96 !important;
  stroke-width: 2.25 !important;
  filter: url(#inkBleed);
}

#routes path,
#roads path,
#trails path,
#searoutes path {
  fill: none !important;
  stroke: #2b1a0d !important;
  stroke-opacity: 0.5 !important;
  stroke-width: 0.62 !important;
  stroke-dasharray: 3 5 !important;
}

#stateLabels text,
#burgLabels text {
  fill: #160e08 !important;
  stroke: #e8dfca !important;
  stroke-width: 1.45px !important;
  paint-order: stroke fill !important;
  font-family: "Gowun Batang", "Noto Serif CJK KR", serif !important;
  font-weight: 800 !important;
  letter-spacing: 0.08em !important;
}

#burgIcons,
#markers {
  opacity: 0.82 !important;
  filter: grayscale(1) sepia(0.26) contrast(1.35);
}
]]></style>
<filter id="inkBleed" x="-7%" y="-7%" width="114%" height="114%">
  <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="31" result="noise"/>
  <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.55" xChannelSelector="R" yChannelSelector="G"/>
</filter>
<filter id="paperGrain" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="2" seed="9" result="grain"/>
  <feColorMatrix type="saturate" values="0"/>
  <feComponentTransfer>
    <feFuncA type="table" tableValues="0 0.22"/>
  </feComponentTransfer>
</filter>`;

let svg = await readFile(inputPath, "utf8");

svg = svg.replace(/background-color="#[0-9a-fA-F]+"/, 'background-color="#e8e1cf"');
svg = svg.replace(/\s*<style id="inkWashMapStyle"><!\[CDATA\[[\s\S]*?\]\]><\/style>/, "");
svg = svg.replace(/\s*<filter id="inkBleed"[\s\S]*?<\/filter>/, "");
svg = svg.replace(/\s*<filter id="paperGrain"[\s\S]*?<\/filter>/, "");

if (!svg.includes("<defs>")) {
  throw new Error("SVG does not contain a <defs> block.");
}

svg = svg.replace("<defs>", `<defs>${styleBlock}`);

await writeFile(outputPath, svg);

console.log(`Applied ink map style: ${path.relative(process.cwd(), outputPath)}`);
