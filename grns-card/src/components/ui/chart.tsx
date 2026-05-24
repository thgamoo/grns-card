"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    color?: string
  }
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"]
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-tooltip-cursor]:stroke-border [&_.recharts-layer]:outline-none [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorConfig = Object.entries(config).filter(([, item]) => item.color)

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: colorConfig
          .map(([key, item]) => `[data-chart=${id}] { --color-${key}: ${item.color}; }`)
          .join("\n"),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

type ChartTooltipPayload = {
  dataKey?: string | number
  name?: string | number
  value?: unknown
  payload?: {
    summary?: string
  }
}

function ChartTooltipContent({
  active,
  payload,
  className,
}: {
  active?: boolean
  payload?: ChartTooltipPayload[]
  className?: string
}) {
  const { config } = useChart()

  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className={cn("chart-tooltip-content", className)}>
      {payload.map((item) => {
        const key = String(item.dataKey ?? item.name ?? "")
        const itemConfig = config[key]
        const label = itemConfig?.label ?? item.name ?? key

        return (
          <div className="chart-tooltip-item" key={key}>
            {itemConfig?.color && (
              <span
                className="chart-tooltip-indicator"
                style={{ backgroundColor: itemConfig.color }}
              />
            )}
            <div>
              <strong>{label}</strong>
              {item.payload?.summary && <p>{item.payload.summary}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export { ChartContainer, ChartTooltip, ChartTooltipContent }
