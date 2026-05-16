const fallbackClassColor = "#8c7662";
const publicMode = Boolean(window.GRNS_PUBLIC_MODE);

const state = {
  manifest: null,
  db: null,
  cards: [],
  classes: [],
  cardTypes: ["일반유닛", "트랩유닛", "책사유닛"],
  classId: "all",
  type: "전체",
  query: "",
  selectedVersion: "",
  selectedCardId: "",
  dirty: false,
};

const cardGrid = document.querySelector("#cardGrid");
const deckGrid = document.querySelector("#deckGrid");
const resultCount = document.querySelector("#resultCount");
const searchInput = document.querySelector("#search");
const classFilters = document.querySelector("#classFilters");
const typeFilters = document.querySelector("#typeFilters");
const versionSelect = document.querySelector("#versionSelect");
const dbStatus = document.querySelector("#dbStatus");
const exportButton = document.querySelector("#exportButton");
const exportImageButton = document.querySelector("#exportImageButton");
const printButton = document.querySelector("#printButton");
const printFieldButton = document.querySelector("#printFieldButton");
const addCardButton = document.querySelector("#addCardButton");
const editorForm = document.querySelector("#editorForm");
const editorEmpty = document.querySelector("#editorEmpty");
const editorTitle = document.querySelector("#editorTitle");
const deleteCardButton = document.querySelector("#deleteCardButton");
const duplicateCardButton = document.querySelector("#duplicateCardButton");
const dialog = document.querySelector("#cardDialog");
const dialogBody = document.querySelector("#dialogBody");
const dialogClose = document.querySelector("#dialogClose");
const printArea = document.querySelector("#printArea");
const fieldBoardSheet = document.querySelector("#fieldBoardSheet");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function classColors() {
  return Object.fromEntries(state.classes.map((item) => [item.id, item.color]));
}

function classPrintTokens(classId) {
  const classInfo = state.classes.find((item) => item.id === classId);
  return {
    stripe: classInfo?.stripe ?? "#e5e7eb",
    mark: classInfo?.mark ?? "◇",
  };
}

function displayCardType(type) {
  return String(type ?? "").replace("유닛", "");
}

function effectText(card) {
  const actionCost = Number(card.actionCost ?? 1);
  const effect = card.effect ?? "";
  return actionCost > 0 ? `[막: ${actionCost}] ${effect}` : effect;
}

function renderKeywordText(value) {
  return escapeHtml(value)
    .replace(/\[([^\]]+)\]/g, "<strong>[$1]</strong>")
    .replace(/\r?\n/g, "<br>");
}

function renderEffect(card) {
  const actionCost = Number(card.actionCost ?? 1);
  const effect = renderKeywordText(card.effect);
  return actionCost > 0
    ? `<strong>[막: ${escapeHtml(actionCost)}]</strong> ${effect}`
    : effect;
}

function cardNameSizeClass(name) {
  const length = Array.from(String(name ?? "")).length;
  if (length >= 12) return "name-compact";
  if (length > 8) return "name-small";
  return "";
}

function migrateCard(card) {
  const nextCard = structuredClone(card);
  nextCard.serial = nextCard.serial || nextCard.id;
  nextCard.sigil = nextCard.sigil || classPrintTokens(nextCard.classId).mark;
  nextCard.illustration = nextCard.illustration ?? "";
  nextCard.power = Number(nextCard.power ?? nextCard.atk ?? 0);
  nextCard.actionCost = Number(nextCard.actionCost ?? 1);
  delete nextCard.atk;
  delete nextCard.hp;
  delete nextCard.flavor;
  return nextCard;
}

async function loadManifest() {
  const response = await fetch("./data/card-versions.json", { cache: "no-store" });
  if (!response.ok) throw new Error("버전 목록을 불러오지 못했습니다.");
  state.manifest = await response.json();
  state.selectedVersion = state.manifest.latest;
  versionSelect.innerHTML = state.manifest.versions
    .map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`)
    .join("");
  versionSelect.value = state.selectedVersion;
}

async function loadVersion(versionId) {
  const version = state.manifest.versions.find((item) => item.id === versionId);
  if (!version) throw new Error("선택한 버전이 없습니다.");

  dbStatus.textContent = "불러오는 중";
  const response = await fetch(version.file, { cache: "no-store" });
  if (!response.ok) throw new Error(`${version.file} 파일을 불러오지 못했습니다.`);

  state.db = await response.json();
  state.cards = (state.db.cards ?? []).map(migrateCard);
  state.classes = state.db.classes ?? [];
  state.cardTypes = ["전체", ...(state.db.cardTypes ?? ["일반유닛", "트랩유닛", "책사유닛"])];
  state.selectedVersion = versionId;
  state.selectedCardId = "";
  state.dirty = false;

  createFilters();
  renderStructureDecks();
  renderLibrary();
  renderEditor();
  updateStatus();
}

function updateStatus() {
  const dirtyLabel = state.dirty ? " · 편집됨" : "";
  dbStatus.textContent = `${state.db?.dbVersion ?? "-"} · ${state.cards.length}장${dirtyLabel}`;
}

function markDirty() {
  state.dirty = true;
  updateStatus();
}

function createFilters() {
  const classItems = [
    { id: "all", label: "전체", color: "#eeeeee" },
    ...state.classes.map((item) => ({
      id: item.id,
      label: item.label,
      color: item.light ?? "#eeeeee",
    })),
  ];

  classFilters.innerHTML = classItems
    .map((item) => `<button class="filter-button ${item.id === state.classId ? "active" : ""}" data-class="${escapeHtml(item.id)}" style="--tone:${escapeHtml(item.color)}">${escapeHtml(item.label)}</button>`)
    .join("");

  typeFilters.innerHTML = state.cardTypes
    .map((item) => `<button class="filter-button ${item === state.type ? "active" : ""}" data-type="${escapeHtml(item)}">${escapeHtml(item)}</button>`)
    .join("");
}

function getFilteredCards() {
  const query = state.query.trim().toLowerCase();
  return state.cards.filter((card) => {
    const classMatches = state.classId === "all" || card.classId === state.classId;
    const typeMatches = state.type === "전체" || card.type === state.type;
    const text = `${card.id} ${card.serial} ${card.name} ${card.faction} ${card.className} ${card.theme} ${card.type} ${card.race} ${card.effect}`.toLowerCase();
    return classMatches && typeMatches && (!query || text.includes(query));
  });
}

function renderCard(card, detailed = false) {
  const colors = classColors();
  const tones = classPrintTokens(card.classId);
  const artContent = card.illustration
    ? `<img class="art-image" src="${escapeHtml(card.illustration)}" alt="${escapeHtml(card.name)} 일러스트" />`
    : `<div class="art-placeholder"><span>${escapeHtml(card.sigil)}</span></div>`;
  return `
    <article class="game-card ${detailed ? "game-card-detail" : ""}" data-id="${escapeHtml(card.id)}" style="--class-color:${colors[card.classId] ?? fallbackClassColor}; --class-stripe:${escapeHtml(tones.stripe)}">
      <div class="card-top">
        <span class="cost">${escapeHtml(card.cost)}</span>
        <strong class="name ${cardNameSizeClass(card.name)}">${escapeHtml(card.name)}</strong>
        <span class="power">${escapeHtml(card.power ?? card.atk ?? 0)}</span>
      </div>
      <div class="art">
        ${artContent}
      </div>
      <div class="card-bottom">
        <div class="meta">
          <span class="chip">${escapeHtml(card.faction)}</span>
          <span class="chip">${escapeHtml(card.race)}</span>
        </div>
        <div class="effect">${renderEffect(card)}</div>
        <div class="serial-line">${escapeHtml(card.serial)}</div>
        <div class="type-line">${escapeHtml(displayCardType(card.type))}</div>
        <div class="class-mark">${escapeHtml(tones.mark)}</div>
      </div>
    </article>
  `;
}

function renderLibrary() {
  const filtered = getFilteredCards();
  resultCount.textContent = `${filtered.length}장`;
  cardGrid.innerHTML = filtered.map((card) => renderCard(card)).join("");
  updateAssetButtons();
}

function renderStructureDecks() {
  const decks = state.db?.structureDecks ?? [];
  if (!deckGrid) return;
  const cardById = new Map(state.cards.map((card) => [card.id, card]));

  deckGrid.innerHTML = decks
    .map((deck) => {
      const typeCounts = deck.entries.reduce((counts, entry) => {
        const card = cardById.get(entry.cardId);
        const type = displayCardType(card?.type);
        counts[type] = (counts[type] ?? 0) + entry.count;
        return counts;
      }, {});

      const rows = deck.entries
        .map((entry) => {
          const card = cardById.get(entry.cardId);
          if (!card) return "";
          return `<li><span>${escapeHtml(entry.count)}x</span> ${escapeHtml(card.name)} <small>${escapeHtml(card.serial)}</small></li>`;
        })
        .join("");

      return `
        <article class="deck-card">
          <h3>${escapeHtml(deck.name)}</h3>
          <div class="deck-meta">
            <span>${escapeHtml(deck.totalCards)}장</span>
            <span>일반 ${typeCounts["일반"] ?? 0}</span>
            <span>책사 ${typeCounts["책사"] ?? 0}</span>
            <span>트랩 ${typeCounts["트랩"] ?? 0}/16</span>
          </div>
          <ol>${rows}</ol>
        </article>
      `;
    })
    .join("");
}

function openCard(cardId) {
  const card = state.cards.find((item) => item.id === cardId);
  if (!card) return;

  state.selectedCardId = card.id;
  renderEditor();

  dialogBody.innerHTML = `
    <div class="dialog-layout">
      ${renderCard(card, true)}
      <div class="detail-copy">
        <p class="eyebrow">${escapeHtml(card.faction)} · ${escapeHtml(card.theme)}</p>
        <h3>${escapeHtml(card.name)}</h3>
        <div class="rule-table">
          <div class="rule-row"><span>ID</span><strong>${escapeHtml(card.id)}</strong></div>
          <div class="rule-row"><span>시리얼</span><strong>${escapeHtml(card.serial)}</strong></div>
          <div class="rule-row"><span>클래스</span><strong>${escapeHtml(card.className)}</strong></div>
          <div class="rule-row"><span>카드 타입</span><strong>${escapeHtml(card.type)}</strong></div>
          <div class="rule-row"><span>종족</span><strong>${escapeHtml(card.race)}</strong></div>
          <div class="rule-row"><span>비용</span><strong>${escapeHtml(card.cost)}</strong></div>
          <div class="rule-row"><span>힘</span><strong>${escapeHtml(card.power ?? card.atk ?? 0)}</strong></div>
          <div class="rule-row"><span>효과</span><strong>${renderEffect(card)}</strong></div>
        </div>
      </div>
    </div>
  `;
  dialog.showModal();
}

function selectedCard() {
  return state.cards.find((item) => item.id === state.selectedCardId);
}

function renderEditor() {
  if (publicMode) return;
  const card = selectedCard();
  const hasCard = Boolean(card);
  editorForm.hidden = !hasCard;
  editorEmpty.hidden = hasCard;
  deleteCardButton.disabled = !hasCard;
  duplicateCardButton.disabled = !hasCard;

  if (!card) {
    editorTitle.textContent = "카드 편집";
    updateAssetButtons();
    return;
  }

  editorTitle.textContent = card.name || card.id;
  editorForm.elements.id.value = card.id ?? "";
  editorForm.elements.serial.value = card.serial ?? card.id ?? "";
  editorForm.elements.illustration.value = card.illustration ?? "";
  editorForm.elements.name.value = card.name ?? "";
  editorForm.elements.cost.value = card.cost ?? 0;
  editorForm.elements.classId.value = card.classId ?? "";
  editorForm.elements.type.value = card.type ?? "일반유닛";
  editorForm.elements.race.value = card.race ?? "";
  editorForm.elements.power.value = card.power ?? card.atk ?? 0;
  editorForm.elements.actionCost.value = card.actionCost ?? 1;
  editorForm.elements.sigil.value = card.sigil ?? classPrintTokens(card.classId).mark;
  editorForm.elements.effect.value = card.effect ?? "";

  editorForm.elements.classId.innerHTML = state.classes
    .map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`)
    .join("");
  editorForm.elements.classId.value = card.classId ?? state.classes[0]?.id ?? "";

  editorForm.elements.type.innerHTML = state.cardTypes
    .filter((item) => item !== "전체")
    .map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`)
    .join("");
  editorForm.elements.type.value = card.type ?? "일반유닛";
  updateAssetButtons();
}

function updateAssetButtons() {
  exportImageButton.disabled = !selectedCard();
  printButton.disabled = getFilteredCards().length === 0;
}

function normalizeCard(formData, previousCard = {}) {
  const classInfo = state.classes.find((item) => item.id === formData.get("classId"));
  const nextCard = {
    ...previousCard,
    id: formData.get("id").trim(),
    serial: formData.get("serial").trim(),
    illustration: formData.get("illustration").trim(),
    name: formData.get("name").trim(),
    cost: Number(formData.get("cost") || 0),
    faction: classInfo?.faction ?? previousCard.faction ?? "",
    classId: formData.get("classId"),
    className: classInfo?.className ?? previousCard.className ?? "",
    theme: classInfo?.theme ?? previousCard.theme ?? "",
    type: formData.get("type"),
    race: formData.get("race").trim(),
    power: Number(formData.get("power") || 0),
    actionCost: Number(formData.get("actionCost") || 0),
    sigil: formData.get("sigil").trim(),
    effect: formData.get("effect").trim(),
  };
  delete nextCard.atk;
  delete nextCard.hp;
  delete nextCard.flavor;
  return nextCard;
}

function addCard() {
  const classInfo = state.classes[0];
  const nextNumber = String(state.cards.length + 1).padStart(3, "0");
  const card = {
    id: `new-${nextNumber}`,
    serial: `GRNS-${Date.now().toString(36).toUpperCase()}`,
    illustration: "",
    name: "새 카드",
    cost: 1,
    faction: classInfo?.faction ?? "",
    classId: classInfo?.id ?? "",
    className: classInfo?.className ?? "",
    theme: classInfo?.theme ?? "",
    type: "일반유닛",
    race: "",
    power: 1,
    actionCost: 1,
    sigil: classPrintTokens(classInfo?.id).mark,
    effect: "",
  };
  state.cards.unshift(card);
  state.selectedCardId = card.id;
  markDirty();
  renderLibrary();
  renderEditor();
}

function duplicateCard() {
  const card = selectedCard();
  if (!card) return;
  const copy = structuredClone(card);
  copy.id = `${card.id}-copy`;
  copy.serial = `${card.serial ?? card.id}-COPY-${Date.now().toString(36).toUpperCase()}`;
  copy.name = `${card.name} 복사본`;
  state.cards.unshift(copy);
  state.selectedCardId = copy.id;
  markDirty();
  renderLibrary();
  renderEditor();
}

function deleteCard() {
  const card = selectedCard();
  if (!card) return;
  state.cards = state.cards.filter((item) => item.id !== card.id);
  state.selectedCardId = "";
  markDirty();
  renderLibrary();
  renderEditor();
}

function exportJson() {
  const today = new Date().toISOString().slice(0, 10);
  const defaultVersion = `${today}-v2`;
  const version = window.prompt("내보낼 DB 버전을 입력하세요. 예: 2026-05-16-v2", defaultVersion);
  if (!version) return;

  const exportDb = {
    ...state.db,
    dbVersion: version,
    updatedAt: today,
    cards: state.cards.map(migrateCard),
  };
  const blob = new Blob([`${JSON.stringify(exportDb, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `card-${version}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized.length === 3
    ? normalized.split("").map((char) => `${char}${char}`).join("")
    : normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 99) {
  const words = String(text ?? "").match(/\[[^\]]+\]|\S+/g) ?? [];
  const lines = [];
  let line = "";

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);

  lines.slice(0, maxLines).forEach((item, index) => {
    const suffix = index === maxLines - 1 && lines.length > maxLines ? "..." : "";
    ctx.fillText(`${item}${suffix}`, x, y + index * lineHeight);
  });
  return Math.min(lines.length, maxLines) * lineHeight;
}

function drawInlineText(ctx, text, x, y, normalFont, boldFont) {
  const segments = String(text ?? "").split(/(\[[^\]]+\])/g).filter(Boolean);
  let cursor = x;

  for (const segment of segments) {
    const isKeyword = /^\[[^\]]+\]$/.test(segment);
    ctx.font = isKeyword ? boldFont : normalFont;
    ctx.fillText(segment, cursor, y);
    cursor += ctx.measureText(segment).width;
  }
}

function wrapRichText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 99, normalFont = ctx.font, boldFont = ctx.font) {
  const lines = [];

  ctx.font = normalFont;
  for (const paragraph of String(text ?? "").split(/\r?\n/)) {
    const words = paragraph.match(/\[[^\]]+\]|\S+/g) ?? [];
    let line = "";

    if (words.length === 0) {
      lines.push("");
      continue;
    }

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) lines.push(line);
  }

  lines.slice(0, maxLines).forEach((item, index) => {
    const suffix = index === maxLines - 1 && lines.length > maxLines ? "..." : "";
    drawInlineText(ctx, `${item}${suffix}`, x, y + index * lineHeight, normalFont, boldFont);
  });
  return Math.min(lines.length, maxLines) * lineHeight;
}

function drawCardToCanvas(card) {
  const dpi = 300;
  const width = Math.round((60 / 25.4) * dpi);
  const height = Math.round((85 / 25.4) * dpi);
  const scale = width / 60;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const tones = classPrintTokens(card.classId);

  canvas.width = width;
  canvas.height = height;
  ctx.scale(scale, scale);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 60, 85);
  ctx.fillStyle = tones.stripe;
  ctx.fillRect(0, 0, 4.2, 85);
  ctx.fillStyle = "#111111";
  ctx.fillRect(4.2, 0, 0.25, 85);

  ctx.strokeStyle = "#111111";
  ctx.lineWidth = 0.35;
  ctx.strokeRect(0.3, 0.3, 59.4, 84.4);

  ctx.beginPath();
  ctx.arc(5.7, 5.7, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "#111111";
  ctx.stroke();
  ctx.fillStyle = "#111111";
  ctx.font = "bold 3.6px Noto Sans KR, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(card.cost ?? 0), 5.7, 5.8);

  ctx.fillStyle = "#111111";
  ctx.textAlign = "left";
  const nameLength = Array.from(String(card.name ?? "")).length;
  const nameFontSize = nameLength >= 12 ? 2.75 : nameLength > 8 ? 3.45 : 4.1;
  const nameLineHeight = nameLength >= 12 ? 3.05 : nameLength > 8 ? 3.45 : 4.1;
  ctx.font = `bold ${nameFontSize}px Gowun Batang, Noto Sans KR, serif`;
  wrapText(ctx, card.name, 11, 5.7, 37, nameLineHeight, 2);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(50.8, 2.2, 7, 7);
  ctx.strokeStyle = "#111111";
  ctx.strokeRect(50.8, 2.2, 7, 7);
  ctx.fillStyle = "#111111";
  ctx.textAlign = "center";
  ctx.fillText(String(card.power ?? card.atk ?? 0), 54.3, 5.8);

  const artX = 6.4;
  const artY = 11;
  const artW = 51.4;
  const artH = 34;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(artX, artY, artW, artH);
  ctx.strokeStyle = "#111111";
  ctx.lineWidth = 0.35;
  ctx.strokeRect(artX, artY, artW, artH);
  ctx.fillStyle = "#222222";
  ctx.textAlign = "center";
  ctx.font = "bold 14px Gowun Batang, Noto Sans KR, serif";
  ctx.fillText(card.sigil ?? "", artX + artW / 2, artY + artH / 2 + 4);

  let y = 49;
  const chips = [card.faction, card.race].filter(Boolean);
  ctx.textAlign = "left";
  ctx.font = "bold 2.25px Noto Sans KR, sans-serif";
  let x = 6.4;
  for (const chip of chips) {
    const widthChip = Math.min(ctx.measureText(chip).width + 2.4, 19);
    if (x + widthChip > 57.8) {
      x = 6.4;
      y += 4.1;
    }
    ctx.strokeStyle = "#111111";
    ctx.strokeRect(x, y - 2.6, widthChip, 3.4);
    ctx.fillStyle = "#111111";
    ctx.fillText(chip, x + 1, y);
    x += widthChip + 1.2;
  }

  y += 5.2;
  ctx.fillStyle = "#111111";
  const effectFont = "2.75px Noto Sans KR, sans-serif";
  const effectBoldFont = "bold 2.75px Noto Sans KR, sans-serif";
  ctx.font = effectFont;
  wrapRichText(ctx, effectText(card), 6.4, y, 51.4, 3.55, 6, effectFont, effectBoldFont);

  ctx.fillStyle = "#555555";
  ctx.font = "bold 2.2px Noto Sans KR, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(card.serial ?? "", 6.4, 76.4);

  ctx.fillStyle = "#111111";
  ctx.font = "bold 4.2px Noto Sans KR, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(displayCardType(card.type), 6.4, 81.5);
  ctx.font = "bold 6px Noto Sans KR, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(tones.mark, 57.8, 81.8);

  return canvas;
}

function downloadCanvas(canvas, filename) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function exportSelectedCardImage() {
  const card = selectedCard();
  if (!card) {
    window.alert("이미지로 내보낼 카드를 먼저 선택하세요.");
    return;
  }
  const safeName = card.name.replace(/[\\/:*?"<>|]/g, "_");
  downloadCanvas(drawCardToCanvas(card), `${card.id}-${safeName}-60x85mm-300dpi.png`);
}

function buildPrintArea() {
  const cards = getFilteredCards();
  if (cards.length === 0) {
    window.alert("프린트할 카드가 없습니다.");
    return false;
  }

  const pages = [];
  for (let index = 0; index < cards.length; index += 9) {
    pages.push(cards.slice(index, index + 9));
  }

  printArea.innerHTML = pages
    .map((page) => `
      <section class="print-page">
        ${page.map((card) => renderCard(card)).join("")}
      </section>
    `)
    .join("");

  return true;
}

function printCards() {
  if (!buildPrintArea()) return;
  document.body.classList.add("print-mode");
  window.print();
}

function printFieldBoard() {
  if (!fieldBoardSheet) return;
  const boardHtml = fieldBoardSheet.outerHTML.replace('id="fieldBoardSheet"', "");
  printArea.innerHTML = `
    <section class="field-print-page field-print-left">
      <div class="field-board-slice">${boardHtml}</div>
    </section>
    <section class="field-print-page field-print-right">
      <div class="field-board-slice">${boardHtml}</div>
    </section>
  `;
  document.body.classList.add("print-mode");
  window.print();
}

versionSelect.addEventListener("change", async (event) => {
  if (state.dirty && !window.confirm("편집 중인 변경사항이 있습니다. 다른 버전을 불러올까요?")) {
    versionSelect.value = state.selectedVersion;
    return;
  }
  await loadVersion(event.target.value);
});

classFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-class]");
  if (!button) return;
  state.classId = button.dataset.class;
  createFilters();
  renderLibrary();
});

typeFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-type]");
  if (!button) return;
  state.type = button.dataset.type;
  createFilters();
  renderLibrary();
});

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderLibrary();
});

cardGrid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-id]");
  if (card) openCard(card.dataset.id);
});

editorForm?.addEventListener("input", () => {
  if (publicMode) return;
  const card = selectedCard();
  if (!card) return;
  const nextCard = normalizeCard(new FormData(editorForm), card);
  const duplicate = state.cards.some((item) => item.id === nextCard.id && item !== card);
  if (duplicate) {
    dbStatus.textContent = "ID가 중복되었습니다.";
    return;
  }
  Object.assign(card, nextCard);
  state.selectedCardId = nextCard.id;
  markDirty();
  editorTitle.textContent = card.name || card.id;
  renderLibrary();
});

exportButton?.addEventListener("click", exportJson);
exportImageButton?.addEventListener("click", exportSelectedCardImage);
printButton?.addEventListener("click", printCards);
printFieldButton?.addEventListener("click", printFieldBoard);
addCardButton?.addEventListener("click", addCard);
duplicateCardButton?.addEventListener("click", duplicateCard);
deleteCardButton?.addEventListener("click", deleteCard);
dialogClose.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

window.addEventListener("afterprint", () => {
  document.body.classList.remove("print-mode");
  printArea.innerHTML = "";
});

async function boot() {
  try {
    document.body.classList.toggle("public-mode", publicMode);
    await loadManifest();
    await loadVersion(state.selectedVersion);
  } catch (error) {
    dbStatus.textContent = error.message;
    cardGrid.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
  }
}

boot();
