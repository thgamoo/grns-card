import { ReferenceLine, ScatterChart, XAxis, YAxis } from "recharts";
import type { CSSProperties } from "react";
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
  x: number;
  side: "top" | "bottom";
  color: string;
  left: string;
};

const maxTimelineYear = 60;
const ticks = Array.from({ length: 7 }, (_, index) => index * 10);

const factionColors: Record<string, string> = {
  전체: "#1f2937",
  예맥: "#a8322a",
  사로국: "#7047b8",
  가락국: "#b56b1e",
  십제: "#6d4c8f",
};

const chartConfig = {
  전체: {
    label: "전체",
    color: factionColors["전체"],
  },
  예맥: {
    label: "예맥",
    color: factionColors["예맥"],
  },
  사로국: {
    label: "사로국",
    color: factionColors["사로국"],
  },
  가락국: {
    label: "가락국",
    color: factionColors["가락국"],
  },
  십제: {
    label: "십제",
    color: factionColors["십제"],
  },
} satisfies ChartConfig;

function timelineLeft(year: number) {
  const chartWidth = 980;
  const leftMargin = 120;
  const rightMargin = 120;
  const plotWidth = chartWidth - leftMargin - rightMargin;
  return `${leftMargin + (year / maxTimelineYear) * plotWidth}px`;
}

export function TimelineView({ events }: TimelineViewProps) {
  const points = [...events]
    .sort((a, b) => a.year - b.year)
    .map<TimelinePoint>((event, index) => ({
      ...event,
      x: event.year,
      side: index % 2 === 0 ? "top" : "bottom",
      color: factionColors[event.faction] ?? "#6b6258",
      left: timelineLeft(event.year),
    }));

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
          대변혁, 즉 세계분리를 0년으로 두고 60년까지의 흐름을 표시합니다. 현재
          시점은 <strong>47년</strong>입니다.
        </p>
      </header>

      <div className="timeline-scroll" aria-label="세계분리 이후 연표">
        <div className="timeline-chart">
          <div className="timeline-future-gradient" />
          <div className="timeline-band-label">
            <strong>세계분리이후</strong>
            <span>0년부터 60년까지</span>
          </div>
          <ChartContainer
            className="timeline-chart-container"
            config={chartConfig}
          >
            <ScatterChart
              margin={{ top: 20, right: 120, bottom: 40, left: 120 }}
            >
              <ReferenceLine
                x={47}
                stroke="#b42318"
                strokeWidth={2}
                label={{
                  value: "현재 47년",
                  position: "top",
                  fill: "#b42318",
                  fontSize: 12,
                  fontWeight: 900,
                }}
              />
              <XAxis
                dataKey="x"
                type="number"
                domain={[0, maxTimelineYear]}
                ticks={ticks}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#3f392f", fontSize: 12, fontWeight: 800 }}
                height={54}
                tickMargin={18}
              />
              <YAxis dataKey="y" type="number" domain={[0, 4]} hide />
            </ScatterChart>
          </ChartContainer>

          <div className="timeline-events-layer">
            {points.map((event) => (
              <button
                className={`timeline-event-card ${event.side} ${
                  event.type === "present" ? "present" : ""
                }`}
                key={`${event.year}-${event.label}`}
                style={
                  {
                    "--x": event.left,
                    "--tone": event.color,
                  } as CSSProperties
                }
                type="button"
              >
                <span className="timeline-marker-line" />
                <span className="timeline-marker-dot" />
                <span className="timeline-event-label">
                  <span className="timeline-event-year">{event.year}년</span>
                  <strong>{event.label}</strong>
                  <span className="timeline-event-faction">
                    {event.faction}
                  </span>
                </span>
                <span className="timeline-event-popover">
                  <span>
                    {event.year}년 · {event.faction} · {event.type}
                  </span>
                  {event.summary}
                </span>
              </button>
            ))}
          </div>
          <div className="timeline-future-note">
            60년 이후는 아직 기록되지 않았습니다.
          </div>
        </div>
      </div>
    </div>
  );
}
