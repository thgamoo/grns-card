const fallbackClassColor = "#8c7662";
const storageKey = "grns-card-db-filters";
const graphStorageKey = "grns-card-graph-filters";

const state = {
  manifest: null,
  db: null,
  cards: [],
  classes: [],
  cardTypes: ["일반유닛", "트랩유닛", "책사유닛"],
  tags: [],
  classId: "all",
  type: "전체",
  tag: "전체",
  query: "",
  selectedVersion: "",
  selectedCardId: "",
  graphClassId: "all",
  graphType: "전체",
  graphTag: "전체",
};

function readSavedFilters() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) ?? "{}");
  } catch {
    return {};
  }
}

function saveFilters() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({
      selectedVersion: state.selectedVersion,
      classId: state.classId,
      type: state.type,
      tag: state.tag,
      query: state.query,
    }));
  } catch {
    // Browsers can block storage in private contexts; filtering should still work.
  }
}

function restoreFilters() {
  const savedFilters = readSavedFilters();
  const classIds = new Set(["all", ...state.classes.map((item) => item.id)]);
  const typeIds = new Set(state.cardTypes);
  const tagIds = new Set(["전체", ...state.tags]);

  state.classId = classIds.has(savedFilters.classId) ? savedFilters.classId : "all";
  state.type = typeIds.has(savedFilters.type) ? savedFilters.type : "전체";
  state.tag = tagIds.has(savedFilters.tag) ? savedFilters.tag : "전체";
  state.query = typeof savedFilters.query === "string" ? savedFilters.query : "";
  searchInput.value = state.query;
}

function readSavedGraphFilters() {
  try {
    return JSON.parse(localStorage.getItem(graphStorageKey) ?? "{}");
  } catch {
    return {};
  }
}

function saveGraphFilters() {
  try {
    localStorage.setItem(graphStorageKey, JSON.stringify({
      graphClassId: state.graphClassId,
      graphType: state.graphType,
      graphTag: state.graphTag,
    }));
  } catch {
    // Graph filtering still works when storage is blocked.
  }
}

function restoreGraphFilters() {
  const savedFilters = readSavedGraphFilters();
  const classIds = new Set(["all", ...state.classes.map((item) => item.id)]);
  const typeIds = new Set(state.cardTypes);
  const tagIds = new Set(["전체", ...state.tags]);

  state.graphClassId = classIds.has(savedFilters.graphClassId) ? savedFilters.graphClassId : "all";
  state.graphType = typeIds.has(savedFilters.graphType) ? savedFilters.graphType : "전체";
  state.graphTag = tagIds.has(savedFilters.graphTag) ? savedFilters.graphTag : "전체";
}

const cardGrid = document.querySelector("#cardGrid");
const deckGrid = document.querySelector("#deckGrid");
const resultCount = document.querySelector("#resultCount");
const searchInput = document.querySelector("#search");
const classFilters = document.querySelector("#classFilters");
const typeFilters = document.querySelector("#typeFilters");
const tagFilters = document.querySelector("#tagFilters");
const versionSelect = document.querySelector("#versionSelect");
const dbStatus = document.querySelector("#dbStatus");
const exportImageButton = document.querySelector("#exportImageButton");
const printButton = document.querySelector("#printButton");
const printFieldButton = document.querySelector("#printFieldButton");
const dialog = document.querySelector("#cardDialog");
const dialogBody = document.querySelector("#dialogBody");
const dialogClose = document.querySelector("#dialogClose");
const printArea = document.querySelector("#printArea");
const fieldBoardSheet = document.querySelector("#fieldBoardSheet");
const levelGraph = document.querySelector("#levelGraph");
const graphMetrics = document.querySelector("#graphMetrics");
const graphLegend = document.querySelector("#graphLegend");
const graphClassFilter = document.querySelector("#graphClassFilter");
const graphTypeFilter = document.querySelector("#graphTypeFilter");
const graphTagFilter = document.querySelector("#graphTagFilter");

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

function hashNumber(value) {
  return Array.from(String(value ?? "")).reduce((total, char) => {
    return (total * 31 + char.charCodeAt(0)) % 9973;
  }, 7);
}

function extractKeywords(effect) {
  return Array.from(String(effect ?? "").matchAll(/\[([^\]]+)\]/g), (match) => match[1]);
}

function primaryRace(card) {
  return String(card.race ?? "").split(/[\/,·\s]+/).filter(Boolean)[0] ?? "";
}

function cardTags(card) {
  return Array.from(new Set([
    card.faction,
    card.race,
    ...String(card.race ?? "").split(/[\/,·\s]+/),
    ...extractKeywords(card.effect),
  ].map((tag) => String(tag ?? "").trim()).filter(Boolean)));
}

function collectTags(cards) {
  const counts = cards.reduce((tagCounts, card) => {
    cardTags(card).forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    });
    return tagCounts;
  }, new Map());

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))
    .map(([tag]) => tag);
}

function migrateCard(card) {
  const nextCard = structuredClone(card);
  nextCard.serial = nextCard.serial || nextCard.id;
  nextCard.sigil = nextCard.sigil || classPrintTokens(nextCard.classId).mark;
  nextCard.illustration = nextCard.illustration ?? "";
  nextCard.lore = nextCard.lore ?? nextCard.flavor ?? "";
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
  const savedVersion = readSavedFilters().selectedVersion;
  const versionExists = state.manifest.versions.some((item) => item.id === savedVersion);
  state.selectedVersion = versionExists ? savedVersion : state.manifest.latest;
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
  state.tags = collectTags(state.cards);
  state.selectedVersion = versionId;
  state.selectedCardId = "";
  restoreFilters();
  restoreGraphFilters();

  createFilters();
  createGraphFilters();
  renderStructureDecks();
  renderLibrary();
  renderLevelGraph();
  updateStatus();
}

function updateStatus() {
  dbStatus.textContent = `${state.db?.dbVersion ?? "-"} · ${state.cards.length}장`;
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

  if (tagFilters) {
    const tagItems = ["전체", ...state.tags];
    tagFilters.innerHTML = tagItems
      .map((item) => `<button class="filter-button tag-filter ${item === state.tag ? "active" : ""}" data-tag="${escapeHtml(item)}">${escapeHtml(item)}</button>`)
      .join("");
  }
}

function createGraphFilters() {
  if (!graphClassFilter || !graphTypeFilter || !graphTagFilter) return;
  const classItems = [
    { id: "all", label: "전체" },
    ...state.classes.map((item) => ({ id: item.id, label: item.label })),
  ];
  const tagItems = ["전체", ...state.tags];

  graphClassFilter.innerHTML = classItems
    .map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`)
    .join("");
  graphTypeFilter.innerHTML = state.cardTypes
    .map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`)
    .join("");
  graphTagFilter.innerHTML = tagItems
    .map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`)
    .join("");

  graphClassFilter.value = state.graphClassId;
  graphTypeFilter.value = state.graphType;
  graphTagFilter.value = state.graphTag;
}

function getFilteredCards() {
  const query = state.query.trim().toLowerCase();
  return state.cards.filter((card) => {
    const classMatches = state.classId === "all" || card.classId === state.classId;
    const typeMatches = state.type === "전체" || card.type === state.type;
    const tagMatches = state.tag === "전체" || cardTags(card).includes(state.tag);
    const text = `${card.id} ${card.serial} ${card.name} ${card.faction} ${card.className} ${card.theme} ${card.type} ${card.race} ${card.effect}`.toLowerCase();
    return classMatches && typeMatches && tagMatches && (!query || text.includes(query));
  });
}

function getGraphCards() {
  const filtered = state.cards.filter((card) => {
    const classMatches = state.graphClassId === "all" || card.classId === state.graphClassId;
    const typeMatches = state.graphType === "전체" || card.type === state.graphType;
    const tagMatches = state.graphTag === "전체" || cardTags(card).includes(state.graphTag);
    return classMatches && typeMatches && tagMatches;
  });

  return filtered;
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

function buildGraphEdges(cards) {
  const edges = [];
  const seen = new Set();
  const classGroups = cards.reduce((groups, card) => {
    if (!groups.has(card.classId)) groups.set(card.classId, []);
    groups.get(card.classId).push(card);
    return groups;
  }, new Map());

  function addEdge(source, target, kind) {
    if (!source || !target || source.id === target.id) return;
    const key = `${source.id}->${target.id}:${kind}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ source: source.id, target: target.id, kind });
  }

  classGroups.forEach((classCards) => {
    const sorted = [...classCards].sort((a, b) => Number(a.cost) - Number(b.cost) || Number(a.power) - Number(b.power));
    sorted.forEach((card, index) => addEdge(card, sorted[index + 1], "curve"));
  });

  cards.forEach((source) => {
    const effect = String(source.effect ?? "");
    const keywords = new Set(extractKeywords(effect));
    const targets = cards
      .filter((target) => {
        if (target.id === source.id || target.classId !== source.classId) return false;
        const race = primaryRace(target);
        if (race && effect.includes(race)) return true;
        return extractKeywords(target.effect).some((keyword) => keywords.has(keyword));
      })
      .slice(0, 2);

    targets.forEach((target) => addEdge(source, target, "synergy"));
  });

  return edges.slice(0, 120);
}

function renderLevelGraph(cards = getGraphCards()) {
  if (!levelGraph || !graphMetrics || !graphLegend) return;
  if (!cards.length) {
    levelGraph.innerHTML = `
      <rect x="1" y="1" width="958" height="538" class="graph-empty-bg" />
      <text x="480" y="258" text-anchor="middle" class="graph-empty">카드 데이터를 불러오지 못했습니다.</text>
      <text x="480" y="288" text-anchor="middle" class="graph-empty-help">DB 버전 목록과 JSON 파일을 확인하세요.</text>
    `;
    graphMetrics.innerHTML = `<div><strong>0</strong><span>노드</span></div>`;
    graphLegend.innerHTML = `<h3>범례</h3><p>그래프 필터와 일치하는 카드가 없습니다. 그래프 전용 필터를 조정하세요.</p>`;
    return;
  }

  const width = 960;
  const height = 540;
  const margin = { top: 44, right: 48, bottom: 52, left: 62 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const maxCost = Math.ceil(Math.max(1, ...cards.map((card) => Number(card.cost) || 0)));
  const maxPower = Math.ceil(Math.max(1, ...cards.map((card) => Number(card.power) || 0)));
  const colors = classColors();
  const nodes = cards.map((card) => {
    const hash = hashNumber(card.id);
    const jitterX = (hash % 19) - 9;
    const jitterY = ((Math.floor(hash / 19) % 19) - 9) * 0.85;
    const cost = Number(card.cost) || 0;
    const power = Number(card.power) || 0;
    return {
      card,
      x: margin.left + (cost / maxCost) * plotWidth + jitterX,
      y: margin.top + (1 - power / maxPower) * plotHeight + jitterY,
      radius: card.type === "트랩유닛" ? 7 : card.type === "책사유닛" ? 8 : 6.5,
      color: colors[card.classId] ?? fallbackClassColor,
    };
  });
  const nodeById = new Map(nodes.map((node) => [node.card.id, node]));
  const edges = buildGraphEdges(cards);
  const costTicks = Array.from({ length: maxCost + 1 }, (_, cost) => cost).filter((cost) => cost === 0 || cost === maxCost || cost % 2 === 0);
  const powerTicks = Array.from({ length: maxPower + 1 }, (_, power) => power).filter((power) => power === 0 || power === maxPower || power % 2 === 0);

  const axis = `
    <g class="graph-axis">
      <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" />
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" />
      ${costTicks.map((cost) => {
        const x = margin.left + (cost / maxCost) * plotWidth;
        return `<g><line class="graph-grid" x1="${x}" y1="${margin.top}" x2="${x}" y2="${height - margin.bottom}" /><text x="${x}" y="${height - 18}" text-anchor="middle">${cost}</text></g>`;
      }).join("")}
      ${powerTicks.map((power) => {
        const y = margin.top + (1 - power / maxPower) * plotHeight;
        return `<g><line class="graph-grid" x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" /><text x="34" y="${y + 4}" text-anchor="middle">${power}</text></g>`;
      }).join("")}
      <text x="${width / 2}" y="${height - 4}" text-anchor="middle">비용</text>
      <text x="18" y="${height / 2}" text-anchor="middle" transform="rotate(-90 18 ${height / 2})">힘</text>
    </g>
  `;

  const edgeMarkup = edges.map((edge) => {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    if (!source || !target) return "";
    return `<line class="graph-edge graph-edge-${edge.kind}" x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}" />`;
  }).join("");

  const nodeMarkup = nodes.map((node) => {
    const label = escapeHtml(`${node.card.name} · 비용 ${node.card.cost} / 힘 ${node.card.power}`);
    const common = `class="graph-node" data-id="${escapeHtml(node.card.id)}" tabindex="0" role="button" aria-label="${label}"`;
    if (node.card.type === "트랩유닛") {
      return `<rect ${common} x="${node.x - node.radius}" y="${node.y - node.radius}" width="${node.radius * 2}" height="${node.radius * 2}" fill="${escapeHtml(node.color)}"><title>${label}</title></rect>`;
    }
    if (node.card.type === "책사유닛") {
      const r = node.radius;
      const points = `${node.x},${node.y - r} ${node.x + r},${node.y} ${node.x},${node.y + r} ${node.x - r},${node.y}`;
      return `<polygon ${common} points="${points}" fill="${escapeHtml(node.color)}"><title>${label}</title></polygon>`;
    }
    return `<circle ${common} cx="${node.x}" cy="${node.y}" r="${node.radius}" fill="${escapeHtml(node.color)}"><title>${label}</title></circle>`;
  }).join("");

  levelGraph.innerHTML = `${axis}<g class="graph-edges">${edgeMarkup}</g><g class="graph-nodes">${nodeMarkup}</g>`;

  const averageCost = cards.reduce((sum, card) => sum + Number(card.cost || 0), 0) / cards.length;
  const averagePower = cards.reduce((sum, card) => sum + Number(card.power || 0), 0) / cards.length;
  const typeCounts = cards.reduce((counts, card) => {
    const type = displayCardType(card.type);
    counts[type] = (counts[type] ?? 0) + 1;
    return counts;
  }, {});
  const keywordCounts = cards.flatMap((card) => extractKeywords(card.effect)).reduce((counts, keyword) => {
    counts[keyword] = (counts[keyword] ?? 0) + 1;
    return counts;
  }, {});
  const topKeywords = Object.entries(keywordCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  graphMetrics.innerHTML = `
    <div><strong>${cards.length}</strong><span>노드</span></div>
    <div><strong>${edges.length}</strong><span>연결</span></div>
    <div><strong>${averageCost.toFixed(1)}</strong><span>평균 비용</span></div>
    <div><strong>${averagePower.toFixed(1)}</strong><span>평균 힘</span></div>
  `;

  graphLegend.innerHTML = `
    <h3>범례</h3>
    <p>가로축은 비용, 세로축은 힘입니다. 원은 일반, 사각형은 트랩, 마름모는 책사입니다.</p>
    <div class="graph-type-counts">
      ${Object.entries(typeCounts).map(([type, count]) => `<span>${escapeHtml(type)} ${count}</span>`).join("")}
    </div>
    <div class="graph-keywords">
      ${topKeywords.map(([keyword, count]) => `<span><strong>[${escapeHtml(keyword)}]</strong> ${count}</span>`).join("")}
    </div>
  `;
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
  updateAssetButtons();
  const lore = String(card.lore ?? "").trim();
  const loreBlock = lore
    ? `<section class="lore-panel"><h4>설정</h4><p>${renderKeywordText(lore)}</p></section>`
    : "";

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
        ${loreBlock}
      </div>
    </div>
  `;
  dialog.showModal();
}

function selectedCard() {
  return state.cards.find((item) => item.id === state.selectedCardId);
}

function updateAssetButtons() {
  exportImageButton.disabled = !selectedCard();
  printButton.disabled = getFilteredCards().length === 0;
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
  await loadVersion(event.target.value);
  saveFilters();
});

classFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-class]");
  if (!button) return;
  state.classId = button.dataset.class;
  saveFilters();
  createFilters();
  renderLibrary();
});

typeFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-type]");
  if (!button) return;
  state.type = button.dataset.type;
  saveFilters();
  createFilters();
  renderLibrary();
});

tagFilters?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-tag]");
  if (!button) return;
  state.tag = button.dataset.tag;
  saveFilters();
  createFilters();
  renderLibrary();
});

graphClassFilter?.addEventListener("change", (event) => {
  state.graphClassId = event.target.value;
  saveGraphFilters();
  renderLevelGraph();
});

graphTypeFilter?.addEventListener("change", (event) => {
  state.graphType = event.target.value;
  saveGraphFilters();
  renderLevelGraph();
});

graphTagFilter?.addEventListener("change", (event) => {
  state.graphTag = event.target.value;
  saveGraphFilters();
  renderLevelGraph();
});

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  saveFilters();
  renderLibrary();
});

cardGrid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-id]");
  if (card) openCard(card.dataset.id);
});

levelGraph?.addEventListener("click", (event) => {
  const node = event.target.closest("[data-id]");
  if (node) openCard(node.dataset.id);
});

levelGraph?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const node = event.target.closest("[data-id]");
  if (!node) return;
  event.preventDefault();
  openCard(node.dataset.id);
});

exportImageButton?.addEventListener("click", exportSelectedCardImage);
printButton?.addEventListener("click", printCards);
printFieldButton?.addEventListener("click", printFieldBoard);
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
    await loadManifest();
    await loadVersion(state.selectedVersion);
  } catch (error) {
    dbStatus.textContent = error.message;
    cardGrid.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
  }
}

boot();
