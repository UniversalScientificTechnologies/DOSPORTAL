import { useRef, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import type { ECharts } from 'echarts'
import { theme } from '@/theme'
import type { EvolutionData } from '@/shared/components/common/ChartsView'

export type SegmentMark = {
  id?: string
  fromMs: number
  toMs: number
  label?: string
}

type Props = {
  evolutionData: EvolutionData
  /** Called once when user releases the brush (mouse up). Values are ms relative to record start. */
  onBrushEnd?: (fromMs: number, toMs: number) => void
  /** Existing segments shown as shaded areas on the chart */
  segments?: SegmentMark[]
  /** Pending (not yet added) brush range shown with a dashed border */
  pendingRange?: { fromMs: number; toMs: number } | null
  /** Highlighted segment – shown with yellow background */
  highlightedRange?: { fromMs: number; toMs: number } | null
}

export const EvolutionEditorChart = ({ evolutionData, onBrushEnd, segments = [], pendingRange, highlightedRange }: Props) => {
  const chartRef = useRef<ReactECharts | null>(null)

  const axisLabelFormatter = (value: number) =>
    value.toFixed(8).replace(/\.?0+$/, '')

  const markAreas = segments.map((seg) => [
    { xAxis: seg.fromMs, name: seg.label ?? 'Segment' },
    { xAxis: seg.toMs },
  ])

  const pendingMarkArea = pendingRange
    ? [[{ xAxis: pendingRange.fromMs, name: 'Pending' }, { xAxis: pendingRange.toMs }]]
    : []

  const highlightedMarkArea = highlightedRange
    ? [[{ xAxis: highlightedRange.fromMs, name: '' }, { xAxis: highlightedRange.toMs }]]
    : []

  const option: EChartsOption = {
    title: [{ left: 'center', text: 'Counts evolution' }],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
    },
    toolbox: {
      right: 10,
      feature: {
        brush: { type: ['lineX'] },
        dataZoom: {},
        restore: {},
        saveAsImage: {},
      },
    },
    brush: {
      xAxisIndex: 0,
      brushType: 'lineX',
      brushStyle: {
        borderWidth: 1,
        color: 'rgba(13, 110, 253, 0.12)',
        borderColor: '#0d6efd',
      },
    },
    grid: [{ left: '5%', right: '5%', height: '72%', top: '10%', bottom: '15%' }],
    dataZoom: [
      { type: 'inside', xAxisIndex: 0 },
      { type: 'slider', filterMode: 'empty', realtime: true, height: 24, bottom: 8, xAxisIndex: 0 },
    ],
    xAxis: [
      {
        name: 'time [ms]',
        type: 'value',
        axisLabel: { formatter: '{value} ms' },
        min: 'dataMin',
        max: 'dataMax',
      },
    ],
    yAxis: [
      {
        axisLabel: { formatter: axisLabelFormatter },
        min: 'dataMin',
        max: 'dataMax',
        name: 'Counts per second',
      },
    ],
    series: [
      {
        id: 'evolution',
        data: evolutionData.evolution_values,
        type: 'scatter',
        name: 'Counts per second',
        symbol: 'rect',
        symbolSize: 5,
        itemStyle: { color: '#198754' },
        markArea:
          markAreas.length > 0
            ? {
                silent: true,
                itemStyle: { color: 'rgba(13, 110, 253, 0.15)', borderColor: '#0d6efd', borderWidth: 1 },
                label: { show: true, position: 'insideTop', fontSize: 11, color: '#0d6efd' },
                data: markAreas as any,
              }
            : undefined,
      },
      {
        id: 'pending',
        data: [],
        type: 'scatter',
        markArea: pendingMarkArea.length > 0
          ? {
              silent: true,
              itemStyle: { color: 'rgba(245, 158, 11, 0.15)', borderColor: '#f59e0b', borderWidth: 2, borderType: 'dashed' },
              label: { show: true, position: 'insideTop', fontSize: 11, color: '#f59e0b' },
              data: pendingMarkArea as any,
            }
          : undefined,
      },
      {
        id: 'highlighted',
        data: [],
        type: 'scatter',
        markArea: highlightedMarkArea.length > 0
          ? {
              silent: true,
              itemStyle: { color: 'rgba(234, 179, 8, 0.25)', borderColor: '#ca8a04', borderWidth: 2 },
              label: { show: false },
              data: highlightedMarkArea as any,
            }
          : undefined,
      },
    ],
  }

  const handleBrushEnd = useCallback(
    (params: { areas?: Array<{ coordRange?: [number, number] }> }) => {
      if (!onBrushEnd) return
      const area = params.areas?.[0]
      if (!area?.coordRange) return
      const [from, to] = area.coordRange
      if (typeof from === 'number' && typeof to === 'number' && Math.abs(to - from) > 0) {
        onBrushEnd(Math.min(from, to), Math.max(from, to))
      }
    },
    [onBrushEnd],
  )

  const onChartReady = useCallback((chartInstance: ECharts) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chartInstance.on('brushEnd', handleBrushEnd as any)
  }, [handleBrushEnd])

  return (
    <div
      style={{
        backgroundColor: theme.colors.bg,
        border: `${theme.borders.width} solid ${theme.colors.border}`,
        borderRadius: theme.borders.radius.sm,
        padding: theme.spacing.lg,
      }}
    >
      <ReactECharts
        ref={chartRef}
        option={option}
        style={{ width: '100%', height: '540px' }}
        notMerge={true}
        onChartReady={onChartReady}
      />
    </div>
  )
}
