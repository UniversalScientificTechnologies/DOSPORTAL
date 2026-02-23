import { useState, useEffect, useRef } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import { theme } from '../theme'

type EvolutionData = {
  evolution_values: [number, number][]
  total_time: number
}

type SpectrumData = {
  spectrum_values: [number, number][]
  total_time: number
  calib: boolean
}

export const SpectralCharts = ({
  apiBase,
  recordId,
  getAuthHeader,
}: {
  apiBase: string
  recordId: string
  getAuthHeader: () => { Authorization?: string }
}) => {
  const [evolutionData, setEvolutionData] = useState<EvolutionData | null>(null)
  const [spectrumData, setSpectrumData] = useState<SpectrumData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const chartRef = useRef<ReactECharts | null>(null)

  useEffect(() => {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    }

    const fetchEvolution = fetch(`${apiBase}/spectral-record/${recordId}/evolution/`, {
      method: 'GET',
      headers,
    }).then(res => {
      if (!res.ok) throw new Error(`Evolution HTTP ${res.status}`)
      return res.json() as Promise<EvolutionData>
    })

    const fetchSpectrum = fetch(`${apiBase}/spectral-record/${recordId}/spectrum/`, {
      method: 'GET',
      headers,
    }).then(res => {
      if (!res.ok) throw new Error(`Spectrum HTTP ${res.status}`)
      return res.json() as Promise<SpectrumData>
    })

    Promise.all([fetchEvolution, fetchSpectrum])
      .then(([evo, spec]) => {
        setEvolutionData(evo)
        setSpectrumData(spec)
      })
      .catch(e => {
        setError(e instanceof Error ? e.message : 'Failed to load chart data')
      })
      .finally(() => setLoading(false))
  }, [apiBase, recordId, getAuthHeader])

  if (loading) {
    return (
      <div style={{ padding: theme.spacing['3xl'], textAlign: 'center', color: theme.colors.muted }}>
        Loading chart data...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        padding: theme.spacing.xl,
        color: theme.colors.danger,
        backgroundColor: theme.colors.warningBg,
        borderRadius: theme.borders.radius.sm,
        border: `${theme.borders.width} solid ${theme.colors.warningBorder}`,
      }}>
        Failed to load charts: {error}
      </div>
    )
  }

  if (!evolutionData || !spectrumData) return null

  const xAxisSpectrum = spectrumData.calib
    ? { name: 'Energy [keV]', axisLabel: { formatter: '{value} keV' } }
    : { name: 'Channel [#]', axisLabel: { formatter: '{value} ch' } }

  const option: EChartsOption = {
    title: [
      { left: 'center', text: 'Counts evolution', top: '0%' },
      { left: 'center', text: 'Energy spectrum', top: '48%' },
    ],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
    },
    toolbox: {
      right: 10,
      feature: {
        dataZoom: {},
        restore: {},
        saveAsImage: {},
      },
    },
    grid: [
      { left: '5%', right: '5%', height: '40%', bottom: '62%' },
      { left: '5%', right: '5%', height: '40%', bottom: '8%' },
    ],
    dataZoom: [
      { type: 'inside', xAxisIndex: 0 },
      { type: 'inside', xAxisIndex: 1 },
      {
        type: 'slider',
        filterMode: 'empty',
        realtime: true,
        height: '5%',
        bottom: '54%',
        xAxisIndex: 0,
      },
      {
        type: 'slider',
        filterMode: 'empty',
        realtime: false,
        height: '5%',
        bottom: 0,
        xAxisIndex: 1,
      },
    ],
    xAxis: [
      {
        name: 'time',
        type: 'value',
        axisLabel: { formatter: '{value} s' },
        min: 'dataMin',
        max: 'dataMax',
      },
      {
        gridIndex: 1,
        type: 'value',
        ...xAxisSpectrum,
        min: 'dataMin',
        max: 'dataMax',
      },
    ],
    yAxis: [
      {
        axisLabel: {
            formatter: (value: number) => value.toFixed(8).replace(/\.?0+$/, ''),
        },
        min: 'dataMin',
        max: 'dataMax',
        name: 'Counts per second',
      },
      {
        axisLabel: {
            formatter: (value: number) => value.toFixed(8).replace(/\.?0+$/, ''),
        },
        gridIndex: 1,
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
        xAxisIndex: 0,
        yAxisIndex: 0,
        symbol: 'rect',
        symbolSize: 5,
        itemStyle: { color: '#198754' },
      },
      {
        id: 'spectrum-trend',
        data: spectrumData.spectrum_values,
        type: 'line',
        xAxisIndex: 1,
        yAxisIndex: 1,
        symbol: 'none',
        lineStyle: { color: '#0d6efd', opacity: 0.25, width: 2 },
        smooth: true,
        z: 1,
        emphasis: { disabled: true },
        tooltip: { show: false },
      },
      { 
        id: 'spectrum',
        data: spectrumData.spectrum_values,
        type: 'scatter',
        name: 'Energetic spectrum',
        xAxisIndex: 1,
        yAxisIndex: 1,
        symbolSize: 5,
        itemStyle: { color: '#0d6dfdc8' },
      },
    ],
  }

  return (
    <div style={{
      backgroundColor: theme.colors.bg,
      border: `${theme.borders.width} solid ${theme.colors.border}`,
      borderRadius: theme.borders.radius.sm,
      padding: theme.spacing.lg,
    }}>
      <ReactECharts
        ref={chartRef}
        option={option}
        style={{ width: '100%', height: '800px' }}
        notMerge={true}
      />
    </div>
  )
}
