import { useMemo } from "react"
import { useStravaActivityContext } from "../../hooks/useStravaActivityContext"
import { useThemeContext } from "../../hooks/useThemeContext"
import { UnitDefinitions } from "../../types/activity"
import { SportType, StravaActivity } from "../../types/strava"
import {
  unitConversion,
  calculateTrendLine,
  calculateTrendLinePoints,
  calculateTicks,
  getDataBounds,
} from "../../utils/utils"
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ZAxis,
  ReferenceLine,
} from "recharts"
import Card from "../common/card"
import NoData from "../common/noData"
import { HeartPulse } from "lucide-react"
import { CustomScatterTooltip } from "../common/customScatterToolTip"
import * as Sentry from "@sentry/browser"


type ScatterChartData = {
  heartrate: number
  speed: number
  url: string
  fill: string
  name: string
  sport_type: string
}

const X_OFFSET = 2
const Y_OFFSET = 5
const TICK_COUNT = 5

export const calculateHeartRateData = (activities: StravaActivity[]): ScatterChartData[] => {
  if (!activities?.length) return []

  return activities.reduce((acc, act) => {
    if (!act.average_heartrate || !act.average_speed || !act.sport_type) return acc

    acc.push({
      heartrate: act.average_heartrate,
      speed: act.average_speed,
      fill: "#ffffff", // placeholder color
      url: `https://www.strava.com/activities/${act.id}`,
      name: act.name ?? "",
      sport_type: act.sport_type
    })
    return acc
  }, [] as ScatterChartData[])
}

export default function HeartrateVsSpeed() {
  const { activitiesData, units } = useStravaActivityContext()
  const { colorPalette, darkMode } = useThemeContext()

  const rawData = useMemo(() => {
    if (!activitiesData?.all) return []

    try {
      return calculateHeartRateData(activitiesData.all)
    } catch (err) {
      console.warn(err)
      Sentry.captureException(err)
      return []
    }
  }, [activitiesData])

  const dataWithUnits = useMemo(() =>
    rawData.map(item => ({
      ...item,
      speed: Number(unitConversion.convertSpeed(item.speed, units).toFixed(2))
    }))
    , [rawData, units])

  const data = useMemo(() =>
    dataWithUnits.map(item => ({
      ...item,
      fill: colorPalette[item.sport_type as SportType] || "#ffffff"
    }))
    , [dataWithUnits, colorPalette])

  const chartData = useMemo(() => {
    if (data.length === 0) {
      return {
        bounds: { xMin: 0, xMax: 0, yMin: 0, yMax: 0 },
        ticks: { xAxisTicks: [], yAxisTicks: [] },
        trend: { slope: 0, intercept: 0, canShowLine: false },
        referenceLinePoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }]
      }
    }

    const bounds = getDataBounds(data, "speed", "heartrate")
    const ticks = {
      xAxisTicks: calculateTicks(0, Math.round(bounds.xMax), TICK_COUNT),
      yAxisTicks: calculateTicks(Math.round(bounds.yMin), Math.round(bounds.yMax), TICK_COUNT)
    }
    const trend = calculateTrendLine(data, "speed", "heartrate")
    const referenceLinePoints = trend.canShowLine
      ? calculateTrendLinePoints(trend, {
        xMin: 0,
        xMax: bounds.xMax * 10,
        yMin: bounds.yMin - Y_OFFSET,
        yMax: bounds.yMax * 10
      })
      : [{ x: 0, y: 0 }, { x: 0, y: 0 }]

    return { bounds, ticks, trend, referenceLinePoints }
  }, [data])

  const chartConfig = useMemo(() => ({
    tickStyle: {
      fontSize: 10,
      color: darkMode ? "#c2c2c2" : "#666",
      fill: darkMode ? "#c2c2c2" : "#666"
    },
    axisStyle: {
      stroke: darkMode ? "#c2c2c2" : "#666"
    },
    referenceLineStyle: {
      stroke: darkMode ? "#c2c2c2" : "black",
      strokeDasharray: "5 5"
    }
  }), [darkMode])

  const handleDotClick = (data: any) => {
    if (data.url) {
      window.open(data.url, "_blank")
    }
  }

  if (data.length === 0) {
    return (
      <Card
        title="Heartrate vs. Speed"
        description="heartrate compared to speed"
        icon={<HeartPulse size={16} strokeWidth={2} />}
      >
        <NoData />
      </Card>
    )
  }

  return (
    <Card
      title="Heartrate vs. Speed"
      description="heartrate compared to speed"
      icon={<HeartPulse size={16} strokeWidth={2} />}
    >
      <ResponsiveContainer height={350} width="90%" className="overflow-hidden">
        <ScatterChart>
          <Scatter
            data={data}
            isAnimationActive={false}
            onClick={handleDotClick}
            className="hover:cursor-pointer"
          />
          <XAxis
            type="number"
            dataKey="speed"
            name="speed"
            unit={UnitDefinitions[units].speed}
            tick={chartConfig.tickStyle}
            stroke={chartConfig.axisStyle.stroke}
            domain={[chartData.bounds.xMin - X_OFFSET, chartData.bounds.xMax + X_OFFSET]}
            allowDecimals={false}
            ticks={chartData.ticks.xAxisTicks}
            interval={0}
          />
          <YAxis
            type="number"
            dataKey="heartrate"
            name="heartrate"
            unit="bpm"
            tick={chartConfig.tickStyle}
            width={38}
            stroke={chartConfig.axisStyle.stroke}
            allowDecimals={false}
            domain={[chartData.bounds.yMin - Y_OFFSET, chartData.bounds.yMax + Y_OFFSET]}
            ticks={chartData.ticks.yAxisTicks}
            interval={0}
          />
          {chartData.trend.canShowLine && (
            <ReferenceLine
              ifOverflow="extendDomain"
              segment={chartData.referenceLinePoints}
              {...chartConfig.referenceLineStyle}
            />
          )}
          <ZAxis range={[30, 40]} />
          <Tooltip content={CustomScatterTooltip} />
        </ScatterChart>
      </ResponsiveContainer>
    </Card>
  )
}