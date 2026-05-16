import { readFile, writeFile } from "node:fs/promises";

const md = await readFile("docs/card-db-plan.md", "utf8");

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function inline(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function renderMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let inList = false;
  let inCode = false;
  let inTable = false;
  let tableRows = [];

  function closeList() {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  }

  function closeTable() {
    if (!inTable) return;
    html.push("<table>");
    tableRows.forEach((row, index) => {
      const cells = row.split("|").slice(1, -1).map((cell) => cell.trim());
      if (index === 1 && cells.every((cell) => /^:?-{3,}:?$/.test(cell))) return;
      const tag = index === 0 ? "th" : "td";
      html.push(`<tr>${cells.map((cell) => `<${tag}>${inline(cell)}</${tag}>`).join("")}</tr>`);
    });
    html.push("</table>");
    tableRows = [];
    inTable = false;
  }

  for (const line of lines) {
    if (line.startsWith("```")) {
      closeList();
      closeTable();
      html.push(inCode ? "</code></pre>" : "<pre><code>");
      inCode = !inCode;
      continue;
    }

    if (inCode) {
      html.push(escapeHtml(line));
      continue;
    }

    if (/^\|.*\|$/.test(line)) {
      closeList();
      inTable = true;
      tableRows.push(line);
      continue;
    }

    closeTable();

    if (!line.trim()) {
      closeList();
      continue;
    }

    if (line.startsWith("# ")) {
      closeList();
      html.push(`<h1>${inline(line.slice(2))}</h1>`);
    } else if (line.startsWith("## ")) {
      closeList();
      html.push(`<h2>${inline(line.slice(3))}</h2>`);
    } else if (line.startsWith("### ")) {
      closeList();
      html.push(`<h3>${inline(line.slice(4))}</h3>`);
    } else if (line.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inline(line.slice(2))}</li>`);
    } else if (/^\d+\.\s/.test(line)) {
      closeList();
      html.push(`<p>${inline(line.replace(/^\d+\.\s/, ""))}</p>`);
    } else {
      closeList();
      html.push(`<p>${inline(line)}</p>`);
    }
  }

  closeList();
  closeTable();
  return html.join("\n");
}

const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>괴력난신 카드 DB 기획</title>
    <style>
      body { margin: 0; background: #f5f2ea; color: #111; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Noto Sans KR", sans-serif; line-height: 1.75; }
      main { max-width: 920px; margin: 0 auto; padding: 48px 24px 80px; }
      h1, h2, h3 { line-height: 1.25; letter-spacing: 0; }
      h1 { font-size: clamp(2rem, 5vw, 3.6rem); }
      h2 { margin-top: 3rem; border-top: 1px solid #111; padding-top: 1.3rem; }
      h3 { margin-top: 2rem; }
      a { color: inherit; }
      code { background: #fff; border: 1px solid #d4d4d4; padding: 0.1em 0.35em; border-radius: 4px; }
      pre { overflow: auto; background: #fff; border: 1px solid #111; padding: 1rem; }
      table { width: 100%; border-collapse: collapse; margin: 1rem 0 2rem; background: #fff; }
      th, td { border: 1px solid #111; padding: 0.55rem 0.7rem; text-align: left; vertical-align: top; }
      th { background: #e5e7eb; }
    </style>
  </head>
  <body>
    <main>
${renderMarkdown(md)}
    </main>
  </body>
</html>
`;

await writeFile("docs/card-db-plan.html", html);
