export const KEYWORD_HIGHLIGHT_COLORS = {
  basePosition: "#b51f17",
  ambush: "#006326",
  blue: "#003f91",
  deathrattle: "#5f148b",
  deploy: "#6d3500",
  pink: "#c43771",
  supply: "#40574c",
  yellow: "#b87500",
  lightText: "#fffaf0",
} as const;

const keywordColorMap = new Map<string, string>([
  ["전진기지", KEYWORD_HIGHLIGHT_COLORS.basePosition],
  ["후방기지", KEYWORD_HIGHLIGHT_COLORS.deploy],
  ["매복", KEYWORD_HIGHLIGHT_COLORS.ambush],
  ["퇴각", KEYWORD_HIGHLIGHT_COLORS.blue],
  ["퇴출", KEYWORD_HIGHLIGHT_COLORS.blue],
  ["단말마", KEYWORD_HIGHLIGHT_COLORS.deathrattle],
  ["출정", KEYWORD_HIGHLIGHT_COLORS.deploy],
  ["전투광", KEYWORD_HIGHLIGHT_COLORS.basePosition],
  ["왕살", KEYWORD_HIGHLIGHT_COLORS.yellow],
]);

const keywordBadgeColorMap = new Map<string, string>([
  ["전진기지", KEYWORD_HIGHLIGHT_COLORS.basePosition],
  ["후방기지", KEYWORD_HIGHLIGHT_COLORS.deploy],
  ["퇴각", KEYWORD_HIGHLIGHT_COLORS.blue],
  ["자체보급", KEYWORD_HIGHLIGHT_COLORS.supply],
  ["성주등장", KEYWORD_HIGHLIGHT_COLORS.yellow],
  ["상시", KEYWORD_HIGHLIGHT_COLORS.ambush],
]);

export function keywordHighlightLabel(keyword: string) {
  return keyword.replace(/^\[|\]$/g, "").trim();
}

export function keywordHighlightColor(keyword: string) {
  return keywordColorMap.get(keywordHighlightLabel(keyword));
}

export function keywordHighlightStyle(keyword: string) {
  const normalizedKeyword = keywordHighlightLabel(keyword);
  const badgeColor = keywordBadgeColorMap.get(normalizedKeyword);
  const color = keywordColorMap.get(normalizedKeyword);
  const basePillStyle = {
    borderRadius: "0.28em",
    boxDecorationBreak: "clone",
    display: "inline-block",
    fontSize: "0.88em",
    fontWeight: 950,
    lineHeight: 1.12,
    paddingBlock: "0.22em",
    paddingInline: "0.22em",
    verticalAlign: "0.02em",
    WebkitBoxDecorationBreak: "clone",
  } as const;

  if (badgeColor) {
    return {
      ...basePillStyle,
      backgroundColor: badgeColor,
      border: `1px solid ${badgeColor}`,
      color: KEYWORD_HIGHLIGHT_COLORS.lightText,
    } as const;
  }

  return color
    ? ({
        ...basePillStyle,
        backgroundColor: "rgba(255, 253, 247, 0.34)",
        border: `1px solid ${color}`,
        color,
      } as const)
    : undefined;
}
