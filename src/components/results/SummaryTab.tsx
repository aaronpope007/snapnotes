import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import SettingsIcon from '@mui/icons-material/Settings';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import Alert from '@mui/material/Alert';
import { useCompactMode } from '../../context/CompactModeContext';
import { useDarkMode } from '../../context/DarkModeContext';
import type { SessionResult } from '../../types/results';
import { calculatePokerInsights, type InsightsDateRange } from '../../utils/calculatePokerInsights';
import { SessionDurationLabel } from '../SessionDurationLabel';
import { FunFactsBento } from './FunFactsBento';

export type ChartInterval =
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | { perHand: number };

const PER_HAND_OPTIONS = [1000, 5000, 10000, 25000, 50000, 100000];

function formatIntervalLabel(interval: ChartInterval | undefined): string {
  if (interval == null) return 'Monthly';
  if (typeof interval === 'object') return `Per ${interval.perHand.toLocaleString()} hands`;
  return interval.charAt(0).toUpperCase() + interval.slice(1);
}

interface SummaryTabProps {
  sessions: SessionResult[];
  loading: boolean;
  hasActiveSession?: boolean;
  activeSessionStartTime?: string | null;
}

export function SummaryTab({ sessions, loading, hasActiveSession, activeSessionStartTime }: SummaryTabProps) {
  const compact = useCompactMode();
  const darkMode = useDarkMode();
  const axisColor = darkMode ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)';
  const axisStroke = darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)';
  const gridStroke = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const [interval, setInterval] = useState<ChartInterval>({ perHand: 5000 });
  const [chartMode, setChartMode] = useState<'bankroll' | 'perHand'>('bankroll');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [hourlyPerHandRange, setHourlyPerHandRange] = useState<InsightsDateRange>('all');

  const stats = useMemo(() => {
    const sorted = [...sessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const totalHours = sorted.reduce(
      (sum, s) => sum + (s.totalTime ?? 0),
      0
    );
    const totalHands = sorted.reduce((sum, s) => sum + (s.hands ?? 0), 0);
    const totalProfit = sorted.reduce(
      (sum, s) => sum + (s.dailyNet ?? 0),
      0
    );
    const startDate =
      sorted.length > 0 ? new Date(sorted[0].date) : null;
    const profitPerHand = totalHands > 0 ? totalProfit / totalHands : 0;
    const avgHandsPerHour = totalHours > 0 ? totalHands / totalHours : 0;
    const profitPerHour = totalHours > 0 ? totalProfit / totalHours : 0;

    return {
      startDate,
      totalHours,
      totalHands,
      totalProfit,
      profitPerHand,
      avgHandsPerHour,
      profitPerHour,
    };
  }, [sessions]);

  const byStake = useMemo(() => {
    const groups = new Map<number, SessionResult[]>();
    for (const s of sessions) {
      const stake = s.stake ?? 0;
      if (!groups.has(stake)) groups.set(stake, []);
      groups.get(stake)!.push(s);
    }
    return [...groups.entries()]
      .filter(([stake]) => stake > 0)
      .sort(([a], [b]) => a - b)
      .map(([stake, sess]) => {
        const sorted = [...sess].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        const totalHours = sorted.reduce((sum, s) => sum + (s.totalTime ?? 0), 0);
        const totalHands = sorted.reduce((sum, s) => sum + (s.hands ?? 0), 0);
        const totalProfit = sorted.reduce((sum, s) => sum + (s.dailyNet ?? 0), 0);
        const startDate = sorted.length > 0 ? new Date(sorted[0].date) : null;
        const profitPerHand = totalHands > 0 ? totalProfit / totalHands : 0;
        const avgHandsPerHour = totalHours > 0 ? totalHands / totalHours : 0;
        const profitPerHour = totalHours > 0 ? totalProfit / totalHours : 0;
        const bb = stake / 100;
        const bbPer100 = totalHands > 0 && bb > 0
          ? (totalProfit / totalHands) * 100 / bb
          : null;
        return {
          stake,
          startDate,
          totalHours,
          totalHands,
          totalProfit,
          profitPerHand,
          avgHandsPerHour,
          profitPerHour,
          bbPer100,
        };
      });
  }, [sessions]);

  const chartData = useMemo(() => {
    const sorted = [...sessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    if (sorted.length === 0) return [];

    const isPerHand = typeof interval === 'object';
    const points: { label: string; value: number; profitPerHand: number; cumulativeHands: number }[] = [];
    let cumulativeProfit = 0;
    let cumulativeHands = 0;

    if (isPerHand) {
      points.push({ label: 'Start', value: 0, profitPerHand: 0, cumulativeHands: 0 });
      const step = interval.perHand;
      let nextHands = step;
      for (const s of sorted) {
        const hands = s.hands ?? 0;
        const net = s.dailyNet ?? 0;
        cumulativeHands += hands;
        cumulativeProfit += net;
        while (cumulativeHands >= nextHands) {
          const pph = nextHands > 0 ? cumulativeProfit / nextHands : 0;
          points.push({
            label: `${(nextHands / 1000).toFixed(0)}k`,
            value: cumulativeProfit,
            profitPerHand: pph,
            cumulativeHands: nextHands,
          });
          nextHands += step;
        }
      }
    }
    else {
      const groupBy = (d: Date) => {
        if (interval === 'weekly') {
          const start = new Date(d);
          start.setDate(start.getDate() - start.getDay());
          return start.toDateString();
        }
        if (interval === 'monthly')
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return `${d.getFullYear()}`;
      };
      const groups = new Map<string, { profit: number; hands: number }>();
      for (const s of sorted) {
        const key = groupBy(new Date(s.date));
        const prev = groups.get(key) ?? { profit: 0, hands: 0 };
        groups.set(key, {
          profit: prev.profit + (s.dailyNet ?? 0),
          hands: prev.hands + (s.hands ?? 0),
        });
      }
      cumulativeProfit = 0;
      cumulativeHands = 0;
      points.push({ label: 'Start', value: 0, profitPerHand: 0, cumulativeHands: 0 });
      for (const [label, { profit: delta, hands: groupHands }] of [...groups.entries()].sort()) {
        cumulativeProfit += delta;
        cumulativeHands += groupHands;
        const displayLabel =
          interval === 'weekly'
            ? new Date(label).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })
            : interval === 'monthly'
              ? label.replace('-', '/')
              : label;
        const pph = cumulativeHands > 0 ? cumulativeProfit / cumulativeHands : 0;
        points.push({ label: displayLabel, value: cumulativeProfit, profitPerHand: pph, cumulativeHands });
      }
    }
    return points;
  }, [sessions, interval]);

  const hourlyPerHandInsights = useMemo(
    () => calculatePokerInsights(sessions, { dateRange: hourlyPerHandRange }),
    [sessions, hourlyPerHandRange]
  );

  if (loading) {
    return (
      <Typography variant="body2" color="text.secondary">
        Loading…
      </Typography>
    );
  }

  if (sessions.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Add sessions to see summary and chart.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {hasActiveSession && activeSessionStartTime && (
        <Alert severity="error" sx={{ fontWeight: 600 }}>
          <SessionDurationLabel startTime={activeSessionStartTime} />
        </Alert>
      )}
      <Paper
        variant="outlined"
        sx={{
          p: compact ? 1.5 : 2,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: compact ? 1 : 1.5,
        }}
      >
        <Box>
          <Typography variant="caption" color="text.secondary">
            Start
          </Typography>
          <Typography variant="body2">
            {stats.startDate?.toLocaleDateString() ?? '—'}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Hours
          </Typography>
          <Typography variant="body2">
            {stats.totalHours.toFixed(1)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Profit
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: stats.totalProfit >= 0 ? 'success.main' : 'error.main' }}
          >
            ${stats.totalProfit.toFixed(2)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            $/hand
          </Typography>
          <Typography variant="body2">
            ${stats.profitPerHand.toFixed(2)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Avg hands/hr
          </Typography>
          <Typography variant="body2">
            {Math.round(stats.avgHandsPerHour)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Total hands
          </Typography>
          <Typography variant="body2">
            {stats.totalHands.toLocaleString()}
          </Typography>
        </Box>
        <Box sx={{ gridColumn: '1 / -1' }}>
          <Typography variant="caption" color="text.secondary">
            $/hr
          </Typography>
          <Typography variant="body2">
            ${stats.profitPerHour.toFixed(2)}
          </Typography>
        </Box>
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          p: compact ? 1.5 : 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            $/hr & $/hand
          </Typography>
          <ToggleButtonGroup
            value={hourlyPerHandRange}
            exclusive
            onChange={(_, v) => v != null && setHourlyPerHandRange(v)}
            size="small"
            sx={{ '& .MuiToggleButton-root': { py: 0.25, px: 1 } }}
          >
            <ToggleButton value="all">All time</ToggleButton>
            <ToggleButton value="year">This year</ToggleButton>
            <ToggleButton value="month">This month</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: compact ? 1 : 1.5 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">$/hr</Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: hourlyPerHandInsights.profitPerHour >= 0 ? 'success.main' : 'error.main',
              }}
            >
              ${hourlyPerHandInsights.profitPerHour.toFixed(2)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">$/hand</Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: hourlyPerHandInsights.profitPerHand >= 0 ? 'success.main' : 'error.main',
              }}
            >
              ${hourlyPerHandInsights.profitPerHand.toFixed(2)}/hand
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Accordion variant="outlined" sx={{ '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<Typography sx={{ color: 'text.secondary' }}>▾</Typography>}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <EmojiEventsIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2">Fun facts</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <FunFactsBento sessions={sessions} />
        </AccordionDetails>
      </Accordion>

      <Accordion variant="outlined" sx={{ '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<Typography sx={{ color: 'text.secondary' }}>▾</Typography>}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TrendingUpIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2">By stake</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {byStake.length === 0 ? (
              <Typography variant="caption" color="text.secondary">
                No stake data recorded.
              </Typography>
            ) : (
              byStake.map((row) => (
                <Paper
                  key={row.stake}
                  variant="outlined"
                  sx={{
                    p: compact ? 1 : 1.5,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: compact ? 1 : 1.5,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ gridColumn: '1 / -1' }}>
                    {row.stake}
                  </Typography>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Start</Typography>
                    <Typography variant="body2">{row.startDate?.toLocaleDateString() ?? '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Hours</Typography>
                    <Typography variant="body2">{row.totalHours.toFixed(1)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Profit</Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: row.totalProfit >= 0 ? 'success.main' : 'error.main' }}
                    >
                      ${row.totalProfit.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">$/hand</Typography>
                    <Typography variant="body2">${row.profitPerHand.toFixed(2)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Avg hands/hr</Typography>
                    <Typography variant="body2">{Math.round(row.avgHandsPerHour)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Total hands</Typography>
                    <Typography variant="body2">{row.totalHands.toLocaleString()}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">$/hr</Typography>
                    <Typography variant="body2">${row.profitPerHour.toFixed(2)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">BB/100</Typography>
                    <Typography variant="body2">
                      {row.bbPer100 != null ? row.bbPer100.toFixed(1) : '—'}
                    </Typography>
                  </Box>
                </Paper>
              ))
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      <Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 0.5,
            flexWrap: 'wrap',
            gap: 0.5,
          }}
        >
          <ToggleButtonGroup
            value={chartMode}
            exclusive
            onChange={(_, v) => v != null && setChartMode(v)}
            size="small"
            sx={{ '& .MuiToggleButton-root': { py: 0.25, px: 1 } }}
          >
            <ToggleButton value="bankroll" aria-label="Bankroll over time">
              Bankroll
            </ToggleButton>
            <ToggleButton value="perHand" aria-label="$ per hand over time">
              $/hand
            </ToggleButton>
          </ToggleButtonGroup>
          <IconButton
            size="small"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            aria-label="Chart interval"
          >
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Box>
        <Menu
          anchorEl={anchorEl}
          open={!!anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem onClick={() => { setInterval('monthly'); setAnchorEl(null); }}>
            Monthly
          </MenuItem>
          <MenuItem onClick={() => { setInterval('yearly'); setAnchorEl(null); }}>
            Yearly
          </MenuItem>
          {PER_HAND_OPTIONS.map((n) => (
            <MenuItem
              key={n}
              onClick={() => { setInterval({ perHand: n }); setAnchorEl(null); }}
            >
              Per {n.toLocaleString()} hands
            </MenuItem>
          ))}
        </Menu>
        <Box sx={{ height: compact ? 160 : 220, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 24, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: axisColor }}
                stroke={axisStroke}
                label={
                  typeof interval === 'object'
                    ? { value: 'Hands', position: 'insideBottom', offset: -8, fill: axisStroke }
                    : undefined
                }
              />
              <YAxis
                tick={{ fontSize: 10, fill: axisColor }}
                stroke={axisStroke}
                tickFormatter={(v) => (chartMode === 'perHand' ? `$${Number(v).toFixed(2)}` : `$${v}`)}
              />
              <Tooltip
                formatter={(value: number) =>
                  chartMode === 'perHand'
                    ? [`$${Number(value).toFixed(2)}/hand`, '$/hand']
                    : [`$${Number(value).toFixed(2)}`, 'Bankroll']
                }
                labelFormatter={(label) => label}
              />
              <Line
                type="monotone"
                dataKey={chartMode === 'perHand' ? 'profitPerHand' : 'value'}
                stroke={chartMode === 'perHand' ? '#ff9800' : '#4caf50'}
                strokeWidth={2}
                dot={{ r: 3 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          {chartMode === 'perHand' ? '$ per hand over time' : 'Bankroll over time'} · {formatIntervalLabel(interval)}
        </Typography>
      </Box>
    </Box>
  );
}
