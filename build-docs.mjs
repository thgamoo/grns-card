import { readdir, readFile, writeFile } from "node:fs/promises";

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function inline(text) {
  return escapeHtml(text)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function renderMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let inList = false;
  let inOrderedList = false;
  let inCode = false;
  let inTable = false;
  let tableRows = [];

  function closeList() {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
    if (inOrderedList) {
      html.push("</ol>");
      inOrderedList = false;
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

    const trimmedLine = line.trimStart();

    if (trimmedLine.startsWith("# ")) {
      closeList();
      html.push(`<h1>${inline(trimmedLine.slice(2))}</h1>`);
    } else if (trimmedLine.startsWith("## ")) {
      closeList();
      html.push(`<h2>${inline(trimmedLine.slice(3))}</h2>`);
    } else if (trimmedLine.startsWith("### ")) {
      closeList();
      html.push(`<h3>${inline(trimmedLine.slice(4))}</h3>`);
    } else if (trimmedLine.startsWith("- ")) {
      if (!inList || inOrderedList) {
        closeList();
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inline(trimmedLine.slice(2))}</li>`);
    } else if (/^\d+\.\s/.test(trimmedLine)) {
      if (!inOrderedList || inList) {
        closeList();
        html.push("<ol>");
        inOrderedList = true;
      }
      html.push(`<li>${inline(trimmedLine.replace(/^\d+\.\s/, ""))}</li>`);
    } else {
      closeList();
      html.push(`<p>${inline(line)}</p>`);
    }
  }

  closeList();
  closeTable();
  return html.join("\n");
}

function titleFromMarkdown(markdown, fallback) {
  return markdown.match(/^#\s+(.+)$/m)?.[1] ?? fallback;
}

function pageHtml(markdown, title) {
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
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
      .doc-nav { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 2rem; }
      .doc-nav a { border: 1px solid #111; background: #fff; padding: 0.35rem 0.7rem; text-decoration: none; }
    </style>
  </head>
  <body>
    <main>
      <nav class="doc-nav" aria-label="문서">
        <a href="./index.html">문서 홈</a>
        <a href="./rulebook.html">룰북</a>
        <a href="./card-design.html">카드/클래스 설계</a>
        <a href="./card-db-plan.html">카드 DB 운영</a>
        <a href="../index.html">카드 DB로 돌아가기</a>
      </nav>
${renderMarkdown(markdown)}
    </main>
  </body>
</html>
`;
}

const files = await readdir("docs");
const markdownFiles = files.filter((file) => file.endsWith(".md"));

await Promise.all(markdownFiles.map(async (file) => {
  const markdown = await readFile(`docs/${file}`, "utf8");
  const title = titleFromMarkdown(markdown, file.replace(/\.md$/, ""));
  const output = `docs/${file.replace(/\.md$/, ".html")}`;
  await writeFile(output, pageHtml(markdown, title));
}));
