import { theme } from '@/theme';
import { ChartsView } from '@/shared/components/common/ChartsView';
import type { EvolutionData, SpectrumData } from '@/shared/components/common/ChartsView';
import {
  useMeasurementsEvolutionRetrieve,
  useMeasurementsSpectrumRetrieve,
} from '@/api/measurements/measurements';

export const MeasurementCharts = ({ measurementId }: { measurementId: string }) => {
  const evolutionQuery = useMeasurementsEvolutionRetrieve(measurementId);
  const spectrumQuery = useMeasurementsSpectrumRetrieve(measurementId);

  const evolutionData = evolutionQuery.data?.data as unknown as EvolutionData | null;
  const spectrumData = spectrumQuery.data?.data as unknown as SpectrumData | null;
  const loading = evolutionQuery.isLoading || spectrumQuery.isLoading;
  const error = evolutionQuery.error
    ? `Evolution: ${(evolutionQuery.error as Error).message}`
    : spectrumQuery.error
    ? `Spectrum: ${(spectrumQuery.error as Error).message}`
    : null;

  if (loading) {
    return (
      <div style={{ padding: theme.spacing['3xl'], textAlign: 'center', color: theme.colors.muted }}>
        Loading chart data...
      </div>
    );
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
    );
  }

  if (!evolutionData || !spectrumData) return null;

  return <ChartsView evolutionData={evolutionData} spectrumData={spectrumData} />;
};