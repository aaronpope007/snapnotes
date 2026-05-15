import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useCompactMode } from '../../context/CompactModeContext';
import type { GtoStudySession } from '../../types/gtoStudy';

export type GtoChartBreakdown = 'none' | 'potType' | 'position';

interface GtoStudyEvChartProps {
  sessions: GtoStudySession[];
  breakdown: GtoChartBreakdown;
  onBreakdownChange: (b: GtoChartBreakdown) => void;
}

interface DailyPoint {
  date: string;
  fullDate: string;
  evLoss: number;
  count: number;
}

interface BreakdownPoint {
  label: string;
  evLoss: number;
  count: number;
}

function aggregateByDay(sessions: GtoStudySession[]): DailyPoint[] {
  const map = new Map<string, { sum: number; count: number; fullDate: string }>();
  for (const s of sessions) {
    if (s.evLoss == null) continue;
    const d = new Date(s.sessionDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const existing = map.get(key) ?? { sum: 0, count: 0, fullDate: d.toLocaleDateString() };
    existing.sum += s.evLoss;
    existing.count += 1;
    map.set(key, existing);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({
      date: new Date(key).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      fullDate: v.fullDate,
      evLoss: Math.round((v.sum / v.count) * 100) / 100,
      count: v.count,
    }));
}

function aggregateBreakdown(
  sessions: GtoStudySession[],
  field: 'potType' | 'heroPosition'
): BreakdownPoint[] {
  const map = new Map<string, { sum: number; count: number }>();
  for (const s of sessions) {
    if (s.evLoss == null) continue;
    const label = s[field];
    const existing = map.get(label) ?? { sum: 0, count: 0 };
    existing.sum += s.evLoss;
    existing.count += 1;
    map.set(label, existing);
  }
  return Array.from(map.entries())
    .map(([label, v]) => ({
      label,
      evLoss: Math.round((v.sum / v.count) * 100) / 100,
      count: v.count,
    }))
    .sort((a, b) => b.evLoss - a.evLoss);
}

export function GtoStudyEvChart({ sessions, breakdown, onBreakdownChange }: GtoStudyEvChartProps) {
  const compact = useCompactMode();
  const withEv = sessions.filter((s) => s.evLoss != null);

  const dailyData = useMemo(() => aggregateByDay(withEv), [withEv]);
  const breakdownData = useMemo(
    () =>
      breakdown === 'potType'
        ? aggregateBreakdown(withEv, 'potType')
        : breakdown === 'position'
          ? aggregateBreakdown(withEv, 'heroPosition')
          : [],
    [withEv, breakdown]
  );

  if (withEv.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', py: 1 }}>
        Add EV loss values to sessions to see charts.
      </Typography>
    );
  }

  const chartHeight = compact ? 100 : 140;

  return (
    <Box>
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
          EV loss (bb) — {withEv.length} session{withEv.length === 1 ? '' : 's'} with data
        </Typography>
        <ToggleButtonGroup
          value={breakdown}
          exclusive
          onChange={(_, v) => v != null && onBreakdownChange(v)}
          size="small"
        >
          <ToggleButton value="none" sx={{ py: 0.25, px: 0.75, fontSize: '0.65rem' }}>
            Over time
          </ToggleButton>
          <ToggleButton value="potType" sx={{ py: 0.25, px: 0.75, fontSize: '0.65rem' }}>
            By pot
          </ToggleButton>
          <ToggleButton value="position" sx={{ py: 0.25, px: 0.75, fontSize: '0.65rem' }}>
            By position
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {breakdown === 'none' ? (
        dailyData.length === 0 ? (
          <Typography variant="caption" color="text.secondary">
            Not enough dated EV data for a trend line.
          </Typography>
        ) : (
          <Box sx={{ width: '100%', height: chartHeight, mb: compact ? 1 : 1.5 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="text.secondary" />
                <YAxis tick={{ fontSize: 10 }} stroke="text.secondary" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload?.[0]) {
                      const p = payload[0].payload as DailyPoint;
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
                          <Typography variant="caption">
                            {p.fullDate}: avg −{p.evLoss} bb ({p.count} drill{p.count === 1 ? '' : 's'})
                          </Typography>
                        </Box>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="evLoss"
                  stroke="#ef9a9a"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )
      ) : breakdownData.length === 0 ? (
        <Typography variant="caption" color="text.secondary">
          No breakdown data available.
        </Typography>
      ) : (
        <Box sx={{ width: '100%', height: chartHeight, mb: compact ? 1 : 1.5 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={breakdownData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} stroke="text.secondary" />
              <YAxis tick={{ fontSize: 10 }} stroke="text.secondary" />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload?.[0]) {
                    const p = payload[0].payload as BreakdownPoint;
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
                        <Typography variant="caption">
                          {p.label}: avg −{p.evLoss} bb ({p.count} drill{p.count === 1 ? '' : 's'})
                        </Typography>
                      </Box>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="evLoss" fill="#ef9a9a" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Box>
  );
}
