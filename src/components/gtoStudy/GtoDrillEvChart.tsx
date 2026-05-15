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
  countEvLossChartPoints,
  countPerHandChartPoints,
  getDefaultChartMetric,
} from '../../utils/gtoStudyUtils';
import type { GtoDrillResult } from '../../types/gtoStudy';

export type GtoEvChartMetric = 'evLoss' | 'evLossPerHand';

interface GtoDrillEvChartProps {
  results: GtoDrillResult[];
}

interface ChartPoint {
  attempt: number;
  date: string;
  fullDate: string;
  evLoss: number;
  evLossPerHand?: number;
  handsPlayed?: number;
  chartValue: number;
}

function buildChartData(results: GtoDrillResult[], metric: GtoEvChartMetric): ChartPoint[] {
  const sorted = [...results].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

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

export function GtoDrillEvChart({ results }: GtoDrillEvChartProps) {
  const compact = useCompactMode();
  const [metric, setMetric] = useState<GtoEvChartMetric>(() => getDefaultChartMetric(results));

  const resultsKey = results.map((r) => r._id).join(',');

  useEffect(() => {
    setMetric(getDefaultChartMetric(results));
  }, [resultsKey, results]);

  const evLossCount = useMemo(() => countEvLossChartPoints(results), [results]);
  const perHandCount = useMemo(() => countPerHandChartPoints(results), [results]);

  const data = useMemo(() => buildChartData(results, metric), [results, metric]);

  const alternateMetric: GtoEvChartMetric = metric === 'evLoss' ? 'evLossPerHand' : 'evLoss';
  const alternateCount = alternateMetric === 'evLoss' ? evLossCount : perHandCount;

  if (data.length === 0) {
    return (
      <Box sx={{ py: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          {metric === 'evLossPerHand'
            ? 'No results with both EV loss and hands played yet.'
            : 'Log results with EV loss to see your trend across attempts.'}
        </Typography>
        {alternateCount > 0 && (
          <Button size="small" variant="text" onClick={() => setMetric(alternateMetric)} sx={{ p: 0, minWidth: 0 }}>
            View {alternateMetric === 'evLoss' ? 'EV Loss' : 'EV / Hand'} instead ({alternateCount})
          </Button>
        )}
      </Box>
    );
  }

  const chartHeight = compact ? 100 : 140;
  const yLabel = metric === 'evLoss' ? 'EV Loss' : 'EV Loss / Hand';

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
      {metric === 'evLossPerHand' && perHandCount < evLossCount && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.6rem' }}>
          {evLossCount - perHandCount} result{evLossCount - perHandCount === 1 ? '' : 's'} missing hands played
        </Typography>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="attempt" tick={{ fontSize: 10 }} stroke="text.secondary" />
          <YAxis tick={{ fontSize: 10 }} stroke="text.secondary" />
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
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      EV loss: −{p.evLoss} bb
                      {p.handsPlayed != null ? ` · ${p.handsPlayed} hands` : ''}
                    </Typography>
                    {p.evLossPerHand != null && Number.isFinite(p.evLossPerHand) && (
                      <Typography variant="caption" sx={{ display: 'block' }}>
                        EV/hand: −{p.evLossPerHand} bb
                      </Typography>
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
            stroke="#ef9a9a"
            strokeWidth={2}
            dot={{ r: 3 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
