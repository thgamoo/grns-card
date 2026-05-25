import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  Bar,
  BarChart,
  ReferenceDot,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import { ChartContainer } from "@/components/ui/chart";

export type TimelineEvent = {
  year: number;
  label: string;
  type: string;
  faction: string;
  summary: string;
};

type TimelineViewProps = {
  events: TimelineEvent[];
};

type TimelinePoint = TimelineEvent & {
  color: string;
  side: "top" | "bottom";
};

type TimelineMarkerLabelProps = {
  point: TimelinePoint;
  selected: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  viewBox?: {
    x?: number;
    y?: number;
    cx?: number;
    cy?: number;
  };
  x?: number;
  y?: number;
};

const currentYear = 47;
const timelineLabel = "세계분리 이후";
const factionOrder = ["전체", "예맥", "사로국", "가락국", "십제"];

const factionColors: Record<string, string> = {
  전체: "#1f2937",
  예맥: "#a8322a",
  사로국: "#7047b8",
  가락국: "#b56b1e",
  십제: "#6d4c8f",
};

const chartConfig = factionOrder.reduce<ChartConfig>((config, faction) => {
  config[faction] = {
    label: faction,
    color: factionColors[faction],
  };
  return config;
}, {
  elapsed: {
    label: "현재까지",
    color: "#8c8274",
  },
  future: {
    label: "이후",
    color: "#ddd7cd",
  },
});

function eventKey(event: TimelineEvent) {
  return `${event.year}-${event.faction}-${event.label}`;
}

function TimelineMarkerLabel({
  point,
  selected,
  onActivate,
  onDeactivate,
  viewBox,
  x,
  y,
}: TimelineMarkerLabelProps) {
  const labelX = viewBox?.cx ?? viewBox?.x ?? x;
  const labelY = viewBox?.cy ?? viewBox?.y ?? y;
  if (typeof labelX !== "number" || typeof labelY !== "number") return null;

  const direction = point.side === "top" ? -1 : 1;
  const bottomExtension = point.side === "bottom" ? 8 : 0;
  const lineX = labelX + 5;
  const lineStart = labelY + direction * 7;
  const lineEnd = labelY + direction * (29 + bottomExtension);
  const textY = labelY + direction * (34 + bottomExtension);
  const metaY = textY + direction * 11;
  const shouldShowTextLabel = point.type !== "present";

  return (
    <g
      className={selected ? "timeline-marker-label selected" : "timeline-marker-label"}
      onClick={onActivate}
      onFocus={onActivate}
      onMouseEnter={onActivate}
      onMouseOver={onActivate}
      onMouseLeave={onDeactivate}
      tabIndex={0}
    >
      <line
        x1={lineX}
        x2={lineX}
        y1={lineStart}
        y2={lineEnd}
        stroke={point.color}
        strokeDasharray="3 3"
      />
      {shouldShowTextLabel && (
        <>
          <text
            x={labelX}
            y={textY}
            dominantBaseline={point.side === "top" ? "auto" : "hanging"}
            textAnchor="middle"
          >
            {point.label}
          </text>
          <text
            className="timeline-marker-meta"
            x={labelX}
            y={metaY}
            dominantBaseline={point.side === "top" ? "auto" : "hanging"}
            textAnchor="middle"
          >
            {point.year}년
          </text>
        </>
      )}
    </g>
  );
}

export function TimelineView({ events }: TimelineViewProps) {
  const points = useMemo<TimelinePoint[]>(() => {
    return [...events]
      .sort((a, b) => a.year - b.year)
      .map((event, index) => ({
        ...event,
        color: factionColors[event.faction] ?? "#6b6258",
        side: index % 2 === 0 ? "top" : "bottom",
      }));
  }, [events]);

  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const hoveredPoint = points.find((event) => eventKey(event) === hoveredKey);
  const maxYear = Math.max(60, ...points.map((event) => event.year));
  const isOriginPoint =
    hoveredPoint?.year === 0 && hoveredPoint.label === "대변혁";
  const hoveredPointEdge = isOriginPoint ? "start" : "center";
  const barData = [
    {
      name: timelineLabel,
      elapsed: Math.min(currentYear, maxYear),
      future: Math.max(0, maxYear - currentYear),
    },
  ];
  const ticks = Array.from(
    { length: Math.floor(maxYear / 10) + 1 },
    (_, index) => index * 10,
  );

  if (points.length === 0) {
    return (
      <div className="timeline-view">
        <p className="timeline-empty">연표 데이터를 불러오는 중입니다.</p>
      </div>
    );
  }

  return (
    <div className="timeline-view">
      <header className="timeline-head">
        <p className="eyebrow">timeline</p>
        <h1>세계분리 이후 연표</h1>
        <p>
          대변혁, 즉 세계분리를 0년으로 두고 주요 사건을 표시합니다. 현재 시점은{" "}
          <strong>{currentYear}년</strong>입니다.
        </p>
      </header>

      <div className="timeline-panel">
        <div className="timeline-chart-shell">
          <ChartContainer className="timeline-chart-container" config={chartConfig}>
            <BarChart
              data={barData}
              layout="vertical"
              margin={{ top: 62, right: 34, bottom: 64, left: 34 }}
              barCategoryGap={0}
            >
              <ReferenceLine
                x={currentYear}
                stroke="#b42318"
                strokeWidth={2}
                label={{
                  value: "현재",
                  position: "top",
                  fill: "#b42318",
                  fontSize: 12,
                  fontWeight: 900,
                }}
              />
              <XAxis
                type="number"
                domain={[0, maxYear]}
                ticks={ticks}
                tickFormatter={(value) => `${value}년`}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#3f392f", fontSize: 12, fontWeight: 800 }}
              />
              <YAxis
                dataKey="name"
                type="category"
                hide
              />
              <Bar
                dataKey="elapsed"
                stackId="timeline"
                fill="var(--color-elapsed)"
                isAnimationActive={false}
                barSize={34}
                radius={[3, 0, 0, 3]}
              />
              <Bar
                dataKey="future"
                stackId="timeline"
                fill="var(--color-future)"
                isAnimationActive={false}
                barSize={34}
                radius={[0, 3, 3, 0]}
              />
              {points.map((point) => {
                const key = eventKey(point);
                const isSelected = key === hoveredKey;
                return (
                  <ReferenceDot
                    key={key}
                    x={point.year}
                    y={timelineLabel}
                    r={isSelected ? 7 : 5}
                    fill={point.color}
                    stroke={isSelected ? "#111111" : "#241f18"}
                    strokeWidth={point.type === "present" ? 2.5 : 1.4}
                    onMouseEnter={() => setHoveredKey(key)}
                    onMouseOver={() => setHoveredKey(key)}
                    onMouseLeave={() => setHoveredKey(null)}
                    onFocus={() => setHoveredKey(key)}
                    onBlur={() => setHoveredKey(null)}
                    onClick={() => setHoveredKey(key)}
                    className="timeline-reference-dot"
                    label={
                      <TimelineMarkerLabel
                        point={point}
                        selected={isSelected}
                        onActivate={() => setHoveredKey(key)}
                        onDeactivate={() => setHoveredKey(null)}
                      />
                    }
                  />
                );
              })}
            </BarChart>
          </ChartContainer>

          {hoveredPoint && (
            <div
              className={`timeline-marker-card ${hoveredPoint.side} edge-${hoveredPointEdge}`}
              style={
                {
                  "--timeline-card-x":
                    hoveredPointEdge === "start"
                      ? "12px"
                      : `calc(34px + ${
                          hoveredPoint.year / maxYear
                        } * (100% - 68px))`,
                } as CSSProperties
              }
            >
              <span>
                {hoveredPoint.year}년 · {hoveredPoint.faction} · {hoveredPoint.type}
              </span>
              <strong>{hoveredPoint.label}</strong>
              <p>{hoveredPoint.summary}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
