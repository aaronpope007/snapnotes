import { useMemo, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useCompactMode } from '../../context/CompactModeContext';
import {
  computeEvLossPerHand,
  computeScorePerHand,
  countAccuracyChartPoints,
  countEvLossChartPoints,
  countPerHandChartPoints,
  countScorePerHandChartPoints,
  getDefaultChartMetric,
  type GtoChartMetric,
} from '../../utils/gtoStudyUtils';
import type { GtoDrillResult } from '../../types/gtoStudy';

interface GtoDrillEvChartProps {
  results: GtoDrillResult[];
}

interface ChartPoint {
  attempt: number;
  date: string;
  fullDate: string;
  accuracy?: number;
  evLoss?: number;
  evLossPerHand?: number;
  score?: number;
  scorePerHand?: number;
  handsPlayed?: number;
  chartValue: number;
}

const CHART_METRIC_ORDER: GtoChartMetric[] = [
  'accuracy',
  'scorePerHand',
  'evLoss',
  'evLossPerHand',
];

function buildChartData(results: GtoDrillResult[], metric: GtoChartMetric): ChartPoint[] {
  const sorted = [...results].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (metric === 'accuracy') {
    return sorted
      .filter((r) => r.accuracy != null && Number.isFinite(r.accuracy))
      .map((r, i) => ({
        attempt: i + 1,
        date: new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        fullDate: new Date(r.date).toLocaleString(),
        accuracy: r.accuracy as number,
        handsPlayed: r.handsPlayed,
        chartValue: r.accuracy as number,
      }));
  }

  if (metric === 'scorePerHand') {
    return sorted
      .map((r) => {
        const perHand = computeScorePerHand(r.score, r.handsPlayed);
        if (perHand == null) return null;
        return { r, perHand };
      })
      .filter((row): row is { r: GtoDrillResult; perHand: number } => row != null)
      .map(({ r, perHand }, i) => ({
        attempt: i + 1,
        date: new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        fullDate: new Date(r.date).toLocaleString(),
        score: r.score,
        handsPlayed: r.handsPlayed,
        scorePerHand: perHand,
        chartValue: perHand,
      }));
  }

  if (metric === 'evLoss') {
    return sorted
      .filter((r) => r.evLoss != null && Number.isFinite(r.evLoss))
      .map((r, i) => ({
        attempt: i + 1,
        date: new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        fullDate: new Date(r.date).toLocaleString(),
        evLoss: r.evLoss as number,
        handsPlayed: r.handsPlayed,
        evLossPerHand: computeEvLossPerHand(r.evLoss, r.handsPlayed),
        chartValue: r.evLoss as number,
      }));
  }

  return sorted
    .map((r) => {
      const perHand = computeEvLossPerHand(r.evLoss, r.handsPlayed);
      if (perHand == null) return null;
      return { r, perHand };
    })
    .filter((row): row is { r: GtoDrillResult; perHand: number } => row != null)
    .map(({ r, perHand }, i) => ({
      attempt: i + 1,
      date: new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      fullDate: new Date(r.date).toLocaleString(),
      evLoss: r.evLoss as number,
      handsPlayed: r.handsPlayed,
      evLossPerHand: perHand,
      chartValue: perHand,
    }));
}

const METRIC_LABELS: Record<GtoChartMetric, string> = {
  accuracy: 'Accuracy',
  scorePerHand: 'Score / Hand',
  evLoss: 'EV Loss',
  evLossPerHand: 'EV / Hand',
};

const METRIC_EMPTY_HINT: Record<GtoChartMetric, string> = {
  accuracy: 'No results with accuracy logged yet.',
  scorePerHand: 'No results with both score and hands played yet.',
  evLoss: 'Log results with EV loss to see your trend across attempts.',
  evLossPerHand: 'No results with both EV loss and hands played yet.',
};

export function GtoDrillEvChart({ results }: GtoDrillEvChartProps) {
  const compact = useCompactMode();
  const [metric, setMetric] = useState<GtoChartMetric>(() => getDefaultChartMetric(results));

  const resultsKey = results.map((r) => r._id).join(',');

  useEffect(() => {
    setMetric(getDefaultChartMetric(results));
  }, [resultsKey]);

  const accuracyCount = useMemo(() => countAccuracyChartPoints(results), [results]);
  const scorePerHandCount = useMemo(() => countScorePerHandChartPoints(results), [results]);
  const evLossCount = useMemo(() => countEvLossChartPoints(results), [results]);
  const perHandCount = useMemo(() => countPerHandChartPoints(results), [results]);

  const metricCounts: Record<GtoChartMetric, number> = {
    accuracy: accuracyCount,
    scorePerHand: scorePerHandCount,
    evLoss: evLossCount,
    evLossPerHand: perHandCount,
  };

  const data = useMemo(() => buildChartData(results, metric), [results, metric]);

  const alternateMetrics = CHART_METRIC_ORDER.filter(
    (m) => m !== metric && metricCounts[m] > 0
  );

  if (data.length === 0) {
    return (
      <Box sx={{ py: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          {METRIC_EMPTY_HINT[metric]}
        </Typography>
        {alternateMetrics.map((alt) => (
          <Button
            key={alt}
            size="small"
            variant="text"
            onClick={() => setMetric(alt)}
            sx={{ p: 0, minWidth: 0, display: 'block', textAlign: 'left' }}
          >
            View {METRIC_LABELS[alt]} instead ({metricCounts[alt]})
          </Button>
        ))}
      </Box>
    );
  }

  const chartHeight = compact ? 100 : 140;
  const yLabel = METRIC_LABELS[metric];
  const lineStroke =
    metric === 'accuracy' ? '#64b5f6' : metric === 'scorePerHand' ? '#81c784' : '#ef9a9a';

  return (
    <Box sx={{ width: '100%', height: chartHeight, mb: compact ? 1 : 1.5 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 0.5,
          mb: 0.5,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {yLabel} — {data.length} attempt{data.length === 1 ? '' : 's'}
        </Typography>
        <ToggleButtonGroup
          value={metric}
          exclusive
          onChange={(_, v) => v != null && setMetric(v)}
          size="small"
        >
          <ToggleButton
            value="accuracy"
            disabled={accuracyCount === 0}
            sx={{ py: 0.25, px: 0.75, fontSize: '0.65rem' }}
          >
            Accuracy
          </ToggleButton>
          <ToggleButton
            value="scorePerHand"
            disabled={scorePerHandCount === 0}
            sx={{ py: 0.25, px: 0.75, fontSize: '0.65rem' }}
          >
            Score / Hand
          </ToggleButton>
          <ToggleButton value="evLoss" sx={{ py: 0.25, px: 0.75, fontSize: '0.65rem' }}>
            EV Loss
          </ToggleButton>
          <ToggleButton
            value="evLossPerHand"
            disabled={perHandCount === 0}
            sx={{ py: 0.25, px: 0.75, fontSize: '0.65rem' }}
          >
            EV / Hand
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {metric === 'accuracy' && accuracyCount < results.length && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.6rem' }}>
          {results.length - accuracyCount} result
          {results.length - accuracyCount === 1 ? '' : 's'} missing accuracy
        </Typography>
      )}
      {metric === 'scorePerHand' && scorePerHandCount < results.length && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.6rem' }}>
          {results.length - scorePerHandCount} result
          {results.length - scorePerHandCount === 1 ? '' : 's'} missing score or hands played
        </Typography>
      )}
      {metric === 'evLossPerHand' && perHandCount < evLossCount && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.6rem' }}>
          {evLossCount - perHandCount} result{evLossCount - perHandCount === 1 ? '' : 's'} missing hands played
        </Typography>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="attempt" tick={{ fontSize: 10 }} stroke="text.secondary" />
          <YAxis
            tick={{ fontSize: 10 }}
            stroke="text.secondary"
            domain={metric === 'accuracy' ? [0, 100] : undefined}
            tickFormatter={metric === 'accuracy' ? (v) => `${v}%` : undefined}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload?.[0]) {
                const p = payload[0].payload as ChartPoint;
                const chartVal = p.chartValue;
                if (!Number.isFinite(chartVal)) return null;
                return (
                  <Box
                    sx={{
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 1,
                    }}
                  >
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      Attempt {p.attempt} ({p.fullDate})
                    </Typography>
                    {metric === 'accuracy' ? (
                      <Typography variant="caption" sx={{ display: 'block' }}>
                        Accuracy: {p.accuracy}%
                        {p.handsPlayed != null ? ` · ${p.handsPlayed} hands` : ''}
                      </Typography>
                    ) : metric === 'scorePerHand' ? (
                      <>
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          Score: {p.score}
                          {p.handsPlayed != null ? ` · ${p.handsPlayed} hands` : ''}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          Score/hand: {p.scorePerHand} pts
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          EV loss: −{p.evLoss} bb
                          {p.handsPlayed != null ? ` · ${p.handsPlayed} hands` : ''}
                        </Typography>
                        {p.evLossPerHand != null && Number.isFinite(p.evLossPerHand) && (
                          <Typography variant="caption" sx={{ display: 'block' }}>
                            EV/hand: −{p.evLossPerHand} bb
                          </Typography>
                        )}
                      </>
                    )}
                  </Box>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="chartValue"
            stroke={lineStroke}
            strokeWidth={2}
            dot={{ r: 3 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
