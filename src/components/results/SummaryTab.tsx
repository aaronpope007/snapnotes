import { useCallback, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import SettingsIcon from '@mui/icons-material/Settings';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SummarizeIcon from '@mui/icons-material/Summarize';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MultilineChartIcon from '@mui/icons-material/MultilineChart';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ScatterChart,
  Scatter,
} from 'recharts';
import Alert from '@mui/material/Alert';
import { useCompactMode } from '../../context/CompactModeContext';
import { useDarkMode } from '../../context/DarkModeContext';
import type { SessionResult, Withdrawal } from '../../types/results';
import { calculatePokerInsights, type InsightsDateRange } from '../../utils/calculatePokerInsights';
import {
  getMostRecentSession,
} from '../../utils/sessionUtils';
import { SessionDurationLabel } from '../SessionDurationLabel';
import type { ActiveSession } from '../../utils/activeSession';
import { FunFactsBento } from './FunFactsBento';

export type ChartInterval =
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | { perHand: number };

const PER_HAND_OPTIONS = [250, 500, 1000, 5000, 10000, 25000, 50000, 100000];

const NICE_HAND_STEPS = [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000];

function getHandsAxisTicks(maxHands: number): number[] {
  if (maxHands <= 0) return [0];
  const rawStep = maxHands / 10;
  const step = NICE_HAND_STEPS.find((s) => s >= rawStep) ?? NICE_HAND_STEPS[NICE_HAND_STEPS.length - 1];
  const ticks: number[] = [];
  for (let h = 0; h <= maxHands; h += step) {
    ticks.push(h);
  }
  if (ticks[ticks.length - 1] !== maxHands) ticks.push(maxHands);
  return ticks;
}

function formatHandsAxisLabel(hands: number): string {
  if (hands === 0) return 'Start';
  if (hands >= 1_000_000) return `${(hands / 1_000_000).toFixed(hands % 1_000_000 === 0 ? 0 : 1)}M`;
  if (hands >= 1000) return `${(hands / 1000).toFixed(hands % 1000 === 0 ? 0 : 1)}k`;
  return String(hands);
}

function formatIntervalLabel(interval: ChartInterval | undefined): string {
  if (interval == null) return 'Monthly';
  if (typeof interval === 'object') return `Per ${interval.perHand.toLocaleString()} hands`;
  return interval.charAt(0).toUpperCase() + interval.slice(1);
}

function quantile(values: number[], q: number): number | null {
  const v = values.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (v.length === 0) return null;
  if (v.length === 1) return v[0];
  const qq = Math.max(0, Math.min(1, q));
  const idx = (v.length - 1) * qq;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return v[lo];
  const t = idx - lo;
  return v[lo] + (v[hi] - v[lo]) * t;
}

interface SummaryTabProps {
  sessions: SessionResult[];
  /**
   * Optional full session list used only for bankroll carry-forward (net calculation).
   * This lets HU-only / Ring-only views still compute a single-session "Today" net
   * correctly when the session is missing an explicit startBankroll.
   */
  allSessionsForNet?: SessionResult[];
  withdrawals?: Withdrawal[];
  loading: boolean;
  hasActiveSession?: boolean;
  activeSessionForLabel?: ActiveSession | null;
}

export function SummaryTab({ sessions, allSessionsForNet, withdrawals = [], loading, hasActiveSession, activeSessionForLabel }: SummaryTabProps) {
  const compact = useCompactMode();
  const darkMode = useDarkMode();
  const axisColor = darkMode ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)';
  const axisStroke = darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)';
  const gridStroke = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  // Percentile line colors:
  // P5 dark red, P25 very light red, P50 white, P75 very light green, P95 vibrant neon green
  const p5Color = '#8b0000';
  const p25Color = '#f44336'; // same red as loss bars
  const p50Color = '#ffffff';
  const p75Color = '#39ff14'; // same neon green as P95
  const p95Color = '#39ff14';
  const [interval, setInterval] = useState<ChartInterval>({ perHand: 5000 });
  const [chartMode, setChartMode] = useState<'bankroll' | 'perHand'>('bankroll');
  const [barChartMode, setBarChartMode] = useState<'day' | 'session'>('day');
  const [barChartValueMode, setBarChartValueMode] = useState<'net' | 'perHand'>('net');
  const [barRangePreset, setBarRangePreset] = useState<'all' | 'year' | 'month' | 'week' | 'today' | 'custom'>('all');
  const [showHandsOverlay, setShowHandsOverlay] = useState(false);
  const [stakeChartMode, setStakeChartMode] = useState<'net' | 'perHand'>('net');
  const [scatterMode, setScatterMode] = useState<'net' | 'perHand'>('net');
  const [rollingWindow, setRollingWindow] = useState(10000);
  const [rollingMenuAnchorEl, setRollingMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [barCustomStart, setBarCustomStart] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [barCustomEnd, setBarCustomEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [rangePreset, setRangePreset] = useState<'all' | 'year' | 'month' | 'week' | 'today' | 'custom'>('all');
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const hourlyPerHandRange: InsightsDateRange =
    rangePreset === 'custom' ? { start: customStart, end: customEnd } : rangePreset;

  const summaryFilteredSessions = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const toKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const startDay = (() => {
      if (rangePreset === 'custom') return null;
      if (rangePreset === 'today') return now;
      if (rangePreset === 'week') {
        const endDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const s = new Date(endDay);
        s.setDate(s.getDate() - 6);
        return s;
      }
      if (rangePreset === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
      if (rangePreset === 'year') return new Date(now.getFullYear(), 0, 1);
      return null;
    })();

    if (rangePreset === 'all') return sessions;
    if (rangePreset === 'custom') {
      const start = customStart;
      const end = customEnd;
      return sessions.filter((s) => {
        const sDate = s.date.slice(0, 10);
        return sDate >= start && sDate <= end;
      });
    }
    if (rangePreset === 'today') {
      // Use string comparison to avoid timezone-related day shifts.
      return sessions.filter((s) => s.date.slice(0, 10) === todayStr);
    }
    if (!startDay) return sessions;
    const startStr = toKey(startDay);
    return sessions.filter((s) => {
      const sDate = s.date.slice(0, 10);
      return sDate >= startStr && sDate <= todayStr;
    });
  }, [sessions, rangePreset, customStart, customEnd]);

  /**
   * Build a sessionNet map across the full session list so that short date ranges
   * like "Today" compute a correct net using the prior session's endBankroll as
   * the start when startBankroll isn't explicitly set.
   *
   * When a format filter is active (HU-only / Ring-only), using only `sessions`
   * can incorrectly fall back to an older bankroll from the previous session in
   * that filtered subset. `allSessionsForNet` preserves true bankroll continuity.
   */
  const sessionNetById = useMemo(() => {
    const base = allSessionsForNet ?? sessions;
    const sorted = [...base].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const byId = new Map<string, number>();
    let prevEndBankroll: number | null = null;
    for (const s of sorted) {
      const accountStart = s.startBankroll ?? prevEndBankroll;
      const accountEnd = s.endBankroll ?? null;
      const net =
        accountStart != null && accountEnd != null
          ? accountEnd - accountStart
          : (s.dailyNet ?? 0);
      byId.set(s._id, net);
      prevEndBankroll = accountEnd;
    }
    return byId;
  }, [sessions, allSessionsForNet]);

  const stats = useMemo(() => {
    const sorted = [...summaryFilteredSessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const net = (s: SessionResult) => sessionNetById.get(s._id) ?? (s.dailyNet ?? 0);
    const mostRecent = getMostRecentSession(summaryFilteredSessions);
    const currentAccount = mostRecent?.endBankroll ?? null;
    const totalProfit = sorted.reduce((sum, s) => sum + net(s), 0);
    const totalHours = sorted.reduce(
      (sum, s) => sum + (s.totalTime ?? 0),
      0
    );
    const totalHands = sorted.reduce((sum, s) => sum + (s.hands ?? 0), 0);
    const profitPerHand = totalHands > 0 ? totalProfit / totalHands : 0;
    const avgHandsPerHour = totalHours > 0 ? totalHands / totalHours : 0;
    const profitPerHour = totalHours > 0 ? totalProfit / totalHours : 0;
    const profitPerHourAt240 = profitPerHand * 240;
    const startDate =
      sorted.length > 0 ? new Date(sorted[0].date) : null;

    return {
      startDate,
      totalHours,
      totalHands,
      totalProfit,
      profitPerHand,
      avgHandsPerHour,
      profitPerHour,
      profitPerHourAt240,
      currentAccount,
    };
  }, [summaryFilteredSessions, sessionNetById]);

  const streakAndDrawdown = useMemo(() => {
    const net = (s: SessionResult) => sessionNetById.get(s._id) ?? (s.dailyNet ?? 0);
    const sorted = [...summaryFilteredSessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let currentStreakCount = 0;
    let currentStreakType: 'win' | 'loss' | null = null;
    let longestWin = 0;
    let longestLoss = 0;
    let tempCount = 0;
    let tempType: 'win' | 'loss' | null = null;

    let cumProfit = 0;
    let peak = 0;
    let maxDrawdown = 0;

    for (const s of sorted) {
      const n = net(s);
      const type: 'win' | 'loss' = n >= 0 ? 'win' : 'loss';
      if (type === tempType) {
        tempCount++;
      } else {
        tempCount = 1;
        tempType = type;
      }
      if (tempType === 'win') longestWin = Math.max(longestWin, tempCount);
      else longestLoss = Math.max(longestLoss, tempCount);

      cumProfit += n;
      if (cumProfit > peak) peak = cumProfit;
      const drawdown = peak - cumProfit;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    currentStreakCount = tempCount;
    currentStreakType = tempType;
    const currentDrawdown = peak - cumProfit;

    return { currentStreakCount, currentStreakType, longestWin, longestLoss, maxDrawdown, currentDrawdown };
  }, [summaryFilteredSessions, sessionNetById]);

  const netForSession = useCallback(
    (s: SessionResult) => sessionNetById.get(s._id) ?? (s.dailyNet ?? 0),
    [sessionNetById]
  );

  const byStake = useMemo(() => {
    const groups = new Map<number, SessionResult[]>();
    for (const s of summaryFilteredSessions) {
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
        const totalProfit = sorted.reduce((sum, s) => sum + netForSession(s), 0);
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
  }, [summaryFilteredSessions, netForSession]);

  const chartData = useMemo(() => {
    const sorted = [...summaryFilteredSessions].sort(
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
      const labelEvery1k = step === 250;
      let nextHands = step;
      for (const s of sorted) {
        const hands = s.hands ?? 0;
        const sessionNet = netForSession(s);
        cumulativeHands += hands;
        cumulativeProfit += sessionNet;
        while (cumulativeHands >= nextHands) {
          const pph = nextHands > 0 ? cumulativeProfit / nextHands : 0;
          const label = labelEvery1k
            ? (nextHands % 1000 === 0 ? `${nextHands / 1000}k` : '')
            : `${(nextHands / 1000).toFixed(0)}k`;
          points.push({
            label,
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
          profit: prev.profit + netForSession(s),
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
  }, [summaryFilteredSessions, interval, netForSession]);

  const chartYDomain = useMemo(() => {
    const dataKey = chartMode === 'perHand' ? 'profitPerHand' : 'value';
    const points = chartData.filter((d) => (d.cumulativeHands ?? 0) > 0);
    const values = points
      .map((d) => d[dataKey] as number)
      .filter((v) => v != null && !Number.isNaN(v));
    if (values.length === 0) return undefined;
    const min = Math.min(...values);
    const isPerHandInterval = typeof interval === 'object';
    const floor = isPerHandInterval ? 0 : (min >= 0 ? 0 : min);
    return [floor, 'auto'] as [number | 'auto', number | 'auto'];
  }, [chartData, chartMode, interval]);

  const chartXAxisConfig = useMemo(() => {
    if (typeof interval !== 'object') return null;
    const maxHands = chartData.length > 0
      ? Math.max(...chartData.map((d) => d.cumulativeHands ?? 0))
      : 0;
    return {
      ticks: getHandsAxisTicks(maxHands),
      tickFormatter: formatHandsAxisLabel,
    };
  }, [chartData, interval]);

  const barFilteredSessions = useMemo(() => {
    if (barRangePreset === 'all') return sessions;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return sessions.filter((s) => {
      const d = new Date(s.date);
      if (barRangePreset === 'year') return d.getFullYear() === now.getFullYear();
      if (barRangePreset === 'month')
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      if (barRangePreset === 'week') {
        const endDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startDay = new Date(endDay);
        startDay.setDate(startDay.getDate() - 6);
        const sessionDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        return sessionDay >= startDay && sessionDay <= endDay;
      }
      if (barRangePreset === 'today') {
        // Use string comparison to avoid timezone-related day shifts.
        return s.date.slice(0, 10) === todayStr;
      }
      if (barRangePreset === 'custom') {
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return dateStr >= barCustomStart && dateStr <= barCustomEnd;
      }
      return true;
    });
  }, [sessions, barRangePreset, barCustomStart, barCustomEnd]);

  type BarChartPoint = { label: string; date: string; profit: number; profitPerHand: number; hands: number };
  const barChartData = useMemo((): BarChartPoint[] => {
    const sorted = [...barFilteredSessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    if (sorted.length === 0) return [];
    if (barChartMode === 'session') {
      // Count how many sessions each day has so we can number duplicates
      const dayCounts = new Map<string, number>();
      for (const s of sorted) {
        const d = new Date(s.date);
        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        dayCounts.set(dateKey, (dayCounts.get(dateKey) ?? 0) + 1);
      }
      const dayCounters = new Map<string, number>();
      return sorted.map((s) => {
        const d = new Date(s.date);
        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const baseLabel = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
        const total = dayCounts.get(dateKey) ?? 1;
        const counter = (dayCounters.get(dateKey) ?? 0) + 1;
        dayCounters.set(dateKey, counter);
        const label = total > 1 ? `${baseLabel} #${counter}` : baseLabel;
        const hands = s.hands ?? 0;
        const sessionProfit = netForSession(s);
        const profitPerHand = hands > 0 ? sessionProfit / hands : 0;
        return { label, date: dateKey, profit: sessionProfit, profitPerHand, hands };
      });
    }
    const byDate = new Map<string, { profit: number; hands: number }>();
    for (const s of sorted) {
      const d = new Date(s.date);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const prev = byDate.get(dateKey) ?? { profit: 0, hands: 0 };
      byDate.set(dateKey, {
        profit: prev.profit + netForSession(s),
        hands: prev.hands + (s.hands ?? 0),
      });
    }
    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, { profit, hands }]) => {
        const [y, m, day] = dateKey.split('-').map(Number);
        const d = new Date(y, m - 1, day);
        const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
        const profitPerHand = hands > 0 ? profit / hands : 0;
        return { label, date: dateKey, profit, profitPerHand, hands };
      });
  }, [barFilteredSessions, netForSession, barChartMode]);

  const barPeriodStats = useMemo(() => {
    const periodNet = barFilteredSessions.reduce((sum, s) => sum + netForSession(s), 0);

    let wonCount = 0;
    let lostCount = 0;

    if (barChartMode === 'session') {
      for (const s of barFilteredSessions) {
        const n = netForSession(s);
        if (n >= 0) wonCount++;
        else lostCount++;
      }
    } else {
      const byDay = new Map<string, number>();
      for (const s of barFilteredSessions) {
        const d = new Date(s.date);
        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        byDay.set(dateKey, (byDay.get(dateKey) ?? 0) + netForSession(s));
      }
      for (const [, dayNet] of byDay.entries()) {
        if (dayNet >= 0) wonCount++;
        else lostCount++;
      }
    }

    const periodLabel =
      barRangePreset === 'all'
        ? 'All time'
        : barRangePreset === 'year'
          ? 'This year'
          : barRangePreset === 'month'
            ? 'This month'
            : barRangePreset === 'week'
              ? 'Last 7 days'
              : barRangePreset === 'today'
                ? 'Today'
                : `Custom (${barCustomStart}–${barCustomEnd})`;

    return { periodNet, wonCount, lostCount, periodLabel };
  }, [
    barFilteredSessions,
    netForSession,
    barChartMode,
    barRangePreset,
    barCustomStart,
    barCustomEnd,
  ]);

  const showWonLostCounts = !(barRangePreset === 'today' && barChartMode === 'day');

  const barChartPercentiles = useMemo(() => {
    const values =
      barChartValueMode === 'net'
        ? barChartData.map((d) => d.profit)
        : barChartData.filter((d) => d.hands > 0).map((d) => d.profitPerHand);
    return {
      p5: quantile(values, 0.05),
      p25: quantile(values, 0.25),
      p50: quantile(values, 0.5),
      p75: quantile(values, 0.75),
      p95: quantile(values, 0.95),
    };
  }, [barChartData, barChartValueMode]);

  const formatBarValue = useCallback((v: number) => {
    return barChartValueMode === 'net'
      ? `$${v.toFixed(0)}`
      : `$${v.toFixed(2)}`;
  }, [barChartValueMode]);

  const hourlyPerHandInsights = useMemo(
    () => calculatePokerInsights(summaryFilteredSessions, { dateRange: hourlyPerHandRange }),
    [summaryFilteredSessions, hourlyPerHandRange]
  );

  // 5-point moving average overlay for bankroll chart
  const movingAvgData = useMemo(() => {
    const maWindow = 5;
    const key = chartMode === 'perHand' ? 'profitPerHand' : 'value';
    return chartData.map((point, i) => {
      const start = Math.max(0, i - maWindow + 1);
      const slice = chartData.slice(start, i + 1);
      const avg = slice.reduce((sum, p) => sum + (p[key] as number), 0) / slice.length;
      return { ...point, movingAvg: avg };
    });
  }, [chartData, chartMode]);

  const bankrollIndexByHands = useMemo(() => {
    const m = new Map<number, number>();
    for (let i = 0; i < movingAvgData.length; i++) {
      const h = Number(movingAvgData[i].cumulativeHands ?? NaN);
      if (!Number.isNaN(h)) m.set(h, i);
    }
    return m;
  }, [movingAvgData]);

  // Session length vs result scatter data
  type ScatterPoint = { hours: number; net: number; pph: number; hands: number };
  const scatterData = useMemo((): ScatterPoint[] => {
    return sessions
      .filter((s) => (s.totalTime ?? 0) > 0)
      .map((s) => {
        const sessionNet = netForSession(s);
        const hands = s.hands ?? 0;
        return { hours: s.totalTime!, net: sessionNet, pph: hands > 0 ? sessionNet / hands : 0, hands };
      });
  }, [sessions, netForSession]);

  // Time-of-day heatmap: avg result by start hour
  const timeOfDayData = useMemo(() => {
    const buckets: { sum: number; count: number }[] = Array.from({ length: 24 }, () => ({ sum: 0, count: 0 }));
    for (const s of sessions) {
      if (!s.startTime) continue;
      const d = new Date(s.startTime);
      if (isNaN(d.getTime())) continue;
      const hour = d.getHours();
      buckets[hour].sum += netForSession(s);
      buckets[hour].count += 1;
    }
    return buckets.map((b, h) => ({
      hour: h,
      label: `${h === 0 ? 12 : h > 12 ? h - 12 : h}${h < 12 ? 'a' : 'p'}`,
      avg: b.count > 0 ? b.sum / b.count : 0,
      count: b.count,
    }));
  }, [sessions, netForSession]);

  const hasTimeOfDayData = timeOfDayData.some((d) => d.count > 0);

  // Rolling $/hand win rate trend
  const ROLLING_OPTIONS = [5000, 10000, 25000, 50000, 100000];
  const rollingWinRateData = useMemo(() => {
    const sorted = [...sessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const result: { cumulativeHands: number; rollingPPH: number }[] = [];
    let cumHands = 0;
    for (let right = 0; right < sorted.length; right++) {
      cumHands += sorted[right].hands ?? 0;
      let wHands = 0;
      let wProfit = 0;
      for (let j = right; j >= 0; j--) {
        const jh = sorted[j].hands ?? 0;
        wHands += jh;
        wProfit += netForSession(sorted[j]);
        if (wHands >= rollingWindow) break;
      }
      if (wHands > 0) {
        result.push({ cumulativeHands: cumHands, rollingPPH: wProfit / wHands });
      }
    }
    return result;
  }, [sessions, netForSession, rollingWindow]);

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
      {hasActiveSession && activeSessionForLabel && (
        <Alert severity="error" sx={{ fontWeight: 600 }}>
          <SessionDurationLabel activeSession={activeSessionForLabel} />
        </Alert>
      )}
      <Accordion variant="outlined" defaultExpanded sx={{ '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<Typography sx={{ color: 'text.secondary' }}>▾</Typography>}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <SummarizeIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2">Summary</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1, mb: 1 }}>
            <ToggleButtonGroup
              value={rangePreset}
              exclusive
              onChange={(_, v) => v != null && setRangePreset(v)}
              size="small"
              sx={{ '& .MuiToggleButton-root': { py: 0.25, px: 1 } }}
            >
              <ToggleButton value="all">All time</ToggleButton>
              <ToggleButton value="year">This year</ToggleButton>
              <ToggleButton value="month">This month</ToggleButton>
              <ToggleButton value="week">Last 7 days</ToggleButton>
              <ToggleButton value="today">Today</ToggleButton>
              <ToggleButton value="custom">Custom</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          {rangePreset === 'custom' && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
              <TextField
                size="small"
                type="date"
                label="From"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                size="small"
                type="date"
                label="To"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
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
        <Box sx={{ gridColumn: '1 / -1' }}>
          <Typography variant="caption" color="text.secondary">
            Total winnings
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontWeight: 500, color: stats.totalProfit >= 0 ? 'success.main' : 'error.main' }}
          >
            ${stats.totalProfit.toFixed(2)}
          </Typography>
        </Box>
        <Box sx={{ gridColumn: '1 / -1' }}>
          <Typography variant="caption" color="text.secondary">
            Total withdrawn
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 500, color: 'success.main' }}>
            ${withdrawals.reduce((sum, w) => sum + w.amount, 0).toFixed(2)}
          </Typography>
        </Box>
        <Box sx={{ gridColumn: '1 / -1' }}>
          <Typography variant="caption" color="text.secondary">
            Current account
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {stats.currentAccount != null
              ? `$${Number(stats.currentAccount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : '—'}
          </Typography>
        </Box>
        <Box sx={{ gridColumn: '1 / -1' }}>
          <Typography variant="caption" color="text.secondary">
            $/hr @ 240 hands
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ${stats.profitPerHourAt240.toFixed(2)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Current streak
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: streakAndDrawdown.currentStreakType === 'win' ? 'success.main' : streakAndDrawdown.currentStreakType === 'loss' ? 'error.main' : 'text.secondary' }}
          >
            {streakAndDrawdown.currentStreakType === 'win'
              ? `W${streakAndDrawdown.currentStreakCount}`
              : streakAndDrawdown.currentStreakType === 'loss'
              ? `L${streakAndDrawdown.currentStreakCount}`
              : '—'}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Longest win / loss
          </Typography>
          <Typography variant="body2">
            <Box component="span" sx={{ color: 'success.main', fontWeight: 600 }}>W{streakAndDrawdown.longestWin}</Box>
            {' / '}
            <Box component="span" sx={{ color: 'error.main', fontWeight: 600 }}>L{streakAndDrawdown.longestLoss}</Box>
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Max drawdown
          </Typography>
          <Typography variant="body2" sx={{ color: streakAndDrawdown.maxDrawdown > 0 ? 'error.main' : 'text.secondary' }}>
            {streakAndDrawdown.maxDrawdown > 0 ? `−$${streakAndDrawdown.maxDrawdown.toFixed(2)}` : '—'}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Current drawdown
          </Typography>
          <Typography variant="body2" sx={{ color: streakAndDrawdown.currentDrawdown > 0 ? 'error.main' : 'text.secondary' }}>
            {streakAndDrawdown.currentDrawdown > 0 ? `−$${streakAndDrawdown.currentDrawdown.toFixed(2)}` : '—'}
          </Typography>
        </Box>
      </Paper>
        </AccordionDetails>
      </Accordion>

      <Accordion variant="outlined" sx={{ '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<Typography sx={{ color: 'text.secondary' }}>▾</Typography>}>
          <Typography variant="body2">General</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1 }}>
                <ToggleButtonGroup
                  value={rangePreset}
                  exclusive
                  onChange={(_, v) => v != null && setRangePreset(v)}
                  size="small"
                  sx={{ '& .MuiToggleButton-root': { py: 0.25, px: 1 } }}
                >
                  <ToggleButton value="all">All time</ToggleButton>
                  <ToggleButton value="year">This year</ToggleButton>
                  <ToggleButton value="month">This month</ToggleButton>
                  <ToggleButton value="week">This week</ToggleButton>
                  <ToggleButton value="today">Today</ToggleButton>
                  <ToggleButton value="custom">Custom</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              {rangePreset === 'custom' && (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  <TextField
                    size="small"
                    type="date"
                    label="From"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 140 }}
                  />
                  <TextField
                    size="small"
                    type="date"
                    label="To"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 140 }}
                  />
                </Box>
              )}
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: compact ? 1 : 1.5 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Net won</Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    color: hourlyPerHandInsights.cumulativeNet >= 0 ? 'success.main' : 'error.main',
                  }}
                >
                  ${hourlyPerHandInsights.cumulativeNet.toFixed(2)}
                </Typography>
              </Box>
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
              <Box>
                <Typography variant="caption" color="text.secondary">Hours played</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {hourlyPerHandInsights.totalHours.toFixed(1)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Hands played</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {hourlyPerHandInsights.totalHands.toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Hands/hr</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {hourlyPerHandInsights.totalHours > 0
                    ? Math.round(hourlyPerHandInsights.totalHands / hourlyPerHandInsights.totalHours).toLocaleString()
                    : '—'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">$/hr @ 240</Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    color: (hourlyPerHandInsights.profitPerHand * 240) >= 0 ? 'success.main' : 'error.main',
                  }}
                >
                  ${(hourlyPerHandInsights.profitPerHand * 240).toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion variant="outlined" sx={{ '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<Typography sx={{ color: 'text.secondary' }}>▾</Typography>}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <EmojiEventsIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2">Fun facts</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <FunFactsBento
            sessions={summaryFilteredSessions}
            dateRange={hourlyPerHandRange}
            onDateRangeChange={(r) => {
              if (typeof r === 'object') {
                setRangePreset('custom');
                setCustomStart(r.start);
                setCustomEnd(r.end);
              } else {
                setRangePreset(r);
              }
            }}
            showDateRangeToggle
          />
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

      <Accordion variant="outlined" defaultExpanded sx={{ '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<Typography sx={{ color: 'text.secondary' }}>▾</Typography>}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <BarChartIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2">Sessions / days over time</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 0.5, mb: 0.75 }}>
              <ToggleButtonGroup
                value={barRangePreset}
                exclusive
                onChange={(_, v) => v != null && setBarRangePreset(v)}
                size="small"
                sx={{ '& .MuiToggleButton-root': { py: 0.25, px: 1 } }}
              >
                <ToggleButton value="all">All time</ToggleButton>
                <ToggleButton value="year">This year</ToggleButton>
                <ToggleButton value="month">This month</ToggleButton>
                <ToggleButton value="week">This week</ToggleButton>
                <ToggleButton value="today">Today</ToggleButton>
                <ToggleButton value="custom">Custom</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            {barRangePreset === 'custom' && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 0.75 }}>
                <TextField
                  size="small"
                  type="date"
                  label="From"
                  value={barCustomStart}
                  onChange={(e) => setBarCustomStart(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 140 }}
                />
                <TextField
                  size="small"
                  type="date"
                  label="To"
                  value={barCustomEnd}
                  onChange={(e) => setBarCustomEnd(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 140 }}
                />
              </Box>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
              <ToggleButtonGroup
                value={barChartMode}
                exclusive
                onChange={(_, v) => v != null && setBarChartMode(v)}
                size="small"
                sx={{ '& .MuiToggleButton-root': { py: 0.25, px: 1 } }}
              >
                <ToggleButton value="day" aria-label="Profit by calendar day">
                  By day
                </ToggleButton>
                <ToggleButton value="session" aria-label="Profit by session">
                  By session
                </ToggleButton>
              </ToggleButtonGroup>
              <ToggleButtonGroup
                value={barChartValueMode}
                exclusive
                onChange={(_, v) => v != null && setBarChartValueMode(v)}
                size="small"
                sx={{ '& .MuiToggleButton-root': { py: 0.25, px: 1 } }}
              >
                <ToggleButton value="net" aria-label="Show net dollars">
                  Net $
                </ToggleButton>
                <ToggleButton value="perHand" aria-label="Show dollars per hand">
                  $/hand
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Box sx={{ height: compact ? 640 : 880, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 4, right: 4, bottom: 24, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 9, fill: axisColor }}
                    stroke={axisStroke}
                    interval="preserveStartEnd"
                    angle={barChartData.length > 20 ? -35 : 0}
                    textAnchor={barChartData.length > 20 ? 'end' : 'middle'}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: axisColor }}
                    stroke={axisStroke}
                    tickFormatter={(v) =>
                      barChartValueMode === 'net'
                        ? `$${Number(v).toFixed(0)}`
                        : `$${Number(v).toFixed(2)}`
                    }
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length || !label) return null;
                      const point = payload[0].payload as BarChartPoint;
                      const contextLabel = barChartMode === 'session' ? 'Session' : 'Day';
                      const valueLabel = barChartValueMode === 'net' ? 'Net' : '$/hand';
                      const value = barChartValueMode === 'net' ? point.profit : point.profitPerHand;
                      const formatted = barChartValueMode === 'net'
                        ? `$${value.toFixed(2)}`
                        : `$${value.toFixed(2)}`;
                      return (
                        <Paper elevation={3} sx={{ px: 1.5, py: 1, minWidth: 140 }}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {contextLabel}: {String(label)}
                          </Typography>
                          <Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>
                            {valueLabel}: {formatted}
                          </Typography>
                          {point.hands != null && point.hands > 0 && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                              {point.hands.toLocaleString()} hands
                            </Typography>
                          )}
                        </Paper>
                      );
                    }}
                  />
                  {barChartPercentiles.p25 != null && (
                    <ReferenceLine
                      y={barChartPercentiles.p25}
                      stroke={p25Color}
                      strokeDasharray="4 4"
                      strokeOpacity={0.55}
                      label={{ value: 'P25', position: 'right', fill: p25Color, fontSize: 10 }}
                    />
                  )}
                  {barChartPercentiles.p5 != null && (
                    <ReferenceLine
                      y={barChartPercentiles.p5}
                      stroke={p5Color}
                      strokeWidth={3}
                      strokeDasharray="0"
                      strokeOpacity={1}
                      label={{ value: 'P5', position: 'right', fill: p5Color, fontSize: 12, fontWeight: 800 }}
                    />
                  )}
                  {barChartPercentiles.p50 != null && (
                    <ReferenceLine
                      y={barChartPercentiles.p50}
                      stroke={p50Color}
                      strokeDasharray="6 4"
                      strokeOpacity={0.8}
                      label={{ value: 'P50', position: 'right', fill: p50Color, fontSize: 10 }}
                    />
                  )}
                  {barChartPercentiles.p75 != null && (
                    <ReferenceLine
                      y={barChartPercentiles.p75}
                      stroke={p75Color}
                      strokeDasharray="4 4"
                      strokeOpacity={0.55}
                      label={{ value: 'P75', position: 'right', fill: p75Color, fontSize: 10 }}
                    />
                  )}
                  {barChartPercentiles.p95 != null && (
                    <ReferenceLine
                      y={barChartPercentiles.p95}
                      stroke={p95Color}
                      strokeWidth={3}
                      // Solid/thicker line so P95 doesn't get lost on dense/negative charts
                      strokeDasharray="0"
                      strokeOpacity={1}
                      label={{ value: 'P95', position: 'right', fill: p95Color, fontSize: 12, fontWeight: 800 }}
                    />
                  )}
                  <Bar
                    dataKey={barChartValueMode === 'net' ? 'profit' : 'profitPerHand'}
                    radius={[2, 2, 0, 0]}
                    isAnimationActive={false}
                  >
                    {barChartData.map((entry, index) => {
                      const val = barChartValueMode === 'net' ? entry.profit : entry.profitPerHand;
                      return (
                        <Cell key={index} fill={val >= 0 ? '#4caf50' : '#f44336'} />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                mt: 0.5,
                gap: 1,
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {barChartMode === 'day' ? 'Per calendar day' : 'Per session'}
                {barChartValueMode === 'net' ? ' · Net $' : ' · $/hand'} (chronological)
              </Typography>
              <Box sx={{ textAlign: 'right' }}>
                <Typography
                  variant="caption"
                  sx={{ color: barPeriodStats.periodNet >= 0 ? 'success.main' : 'error.main', fontWeight: 600 }}
                >
                  {barPeriodStats.periodLabel} net: {barPeriodStats.periodNet >= 0 ? '+' : '−'}${Math.abs(barPeriodStats.periodNet).toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {showWonLostCounts ? (
                    <>
                      {barChartMode === 'day' ? 'Days won' : 'Sessions won'}:{' '}
                      <Box component="span" sx={{ color: 'success.main', fontWeight: 700 }}>
                        {barPeriodStats.wonCount}
                      </Box>{' '}
                      · {barChartMode === 'day' ? 'Days lost' : 'Sessions lost'}:{' '}
                      <Box component="span" sx={{ color: '#f44336', fontWeight: 700 }}>
                        {barPeriodStats.lostCount}
                      </Box>
                    </>
                  ) : (
                    '—'
                  )}
                </Typography>
              </Box>
            </Box>
            {(barChartPercentiles.p5 != null || barChartPercentiles.p25 != null || barChartPercentiles.p50 != null || barChartPercentiles.p75 != null || barChartPercentiles.p95 != null) && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, mt: 0.5 }}>
                {barChartPercentiles.p5 != null && (
                  <Typography variant="caption" sx={{ color: p5Color }}>
                    P5{' '}
                    <Typography component="span" sx={{ color: p5Color, fontWeight: 700 }}>
                      {formatBarValue(barChartPercentiles.p5)}
                    </Typography>
                  </Typography>
                )}
                {barChartPercentiles.p25 != null && (
                  <Typography variant="caption" sx={{ color: p25Color }}>
                    P25{' '}
                    <Typography component="span" sx={{ color: p25Color, fontWeight: 700 }}>
                      {formatBarValue(barChartPercentiles.p25)}
                    </Typography>
                  </Typography>
                )}
                {barChartPercentiles.p50 != null && (
                  <Typography variant="caption" sx={{ color: p50Color }}>
                    P50{' '}
                    <Typography component="span" sx={{ color: p50Color, fontWeight: 800 }}>
                      {formatBarValue(barChartPercentiles.p50)}
                    </Typography>
                  </Typography>
                )}
                {barChartPercentiles.p75 != null && (
                  <Typography variant="caption" sx={{ color: p75Color }}>
                    P75{' '}
                    <Typography component="span" sx={{ color: p75Color, fontWeight: 700 }}>
                      {formatBarValue(barChartPercentiles.p75)}
                    </Typography>
                  </Typography>
                )}
                {barChartPercentiles.p95 != null && (
                  <Typography variant="caption" sx={{ color: p95Color }}>
                    P95{' '}
                    <Typography component="span" sx={{ color: p95Color, fontWeight: 700 }}>
                      {formatBarValue(barChartPercentiles.p95)}
                    </Typography>
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion variant="outlined" defaultExpanded sx={{ '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<Typography sx={{ color: 'text.secondary' }}>▾</Typography>}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ShowChartIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2">Bankroll / $ per hand</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {typeof interval !== 'object' && (
              <ToggleButton
                value="hands"
                selected={showHandsOverlay}
                onChange={() => setShowHandsOverlay((v) => !v)}
                size="small"
                sx={{ py: 0.25, px: 1 }}
              >
                + Hands
              </ToggleButton>
            )}
            <IconButton
              size="small"
              onClick={(e) => setAnchorEl(e.currentTarget)}
              aria-label="Chart interval"
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Box>
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
        <Box sx={{ height: compact ? 640 : 880, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={movingAvgData} margin={{ top: 4, right: showHandsOverlay && typeof interval !== 'object' ? 40 : 4, bottom: 24, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis
                dataKey={chartXAxisConfig ? 'cumulativeHands' : 'label'}
                tick={{ fontSize: 10, fill: axisColor }}
                stroke={axisStroke}
                ticks={chartXAxisConfig?.ticks}
                tickFormatter={chartXAxisConfig?.tickFormatter}
                label={
                  typeof interval === 'object'
                    ? { value: 'Hands', position: 'insideBottom', offset: -8, fill: axisStroke }
                    : undefined
                }
              />
              <YAxis
                yAxisId={0}
                {...(chartYDomain && { domain: chartYDomain, allowDataOverflow: true })}
                tick={{ fontSize: 10, fill: axisColor }}
                stroke={axisStroke}
                tickFormatter={(v) => (chartMode === 'perHand' ? `$${Number(v).toFixed(2)}` : `$${v}`)}
              />
              {showHandsOverlay && typeof interval !== 'object' && (
                <YAxis
                  yAxisId={1}
                  orientation="right"
                  tick={{ fontSize: 9, fill: 'rgba(100,181,246,0.8)' }}
                  stroke="rgba(100,181,246,0.4)"
                  tickFormatter={formatHandsAxisLabel}
                  width={40}
                />
              )}
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const point = payload[0]?.payload as { cumulativeHands?: number; value?: number; profitPerHand?: number; movingAvg?: number } | undefined;
                  const hands = point?.cumulativeHands ?? 0;
                  const idx = bankrollIndexByHands.get(Number(hands)) ?? null;
                  const prevPoint = idx != null && idx > 0 ? movingAvgData[idx - 1] : null;
                  const prevValue = prevPoint?.value ?? null;
                  const prevHands = prevPoint?.cumulativeHands ?? null;
                  const currentValue = point?.value ?? null;
                  const deltaNet =
                    currentValue != null && prevValue != null ? currentValue - prevValue : null;
                  const deltaHands =
                    hands != null && prevHands != null ? Number(hands) - Number(prevHands) : null;
                  const segmentPerHand =
                    deltaNet != null && deltaHands != null && deltaHands > 0 ? deltaNet / deltaHands : null;

                  const mainVal =
                    chartMode === 'perHand' ? (point?.profitPerHand ?? 0) : (point?.value ?? 0);
                  const movingAvg = point?.movingAvg;
                  const formattedMain =
                    chartMode === 'perHand'
                      ? `$${Number(mainVal).toFixed(2)}/hand`
                      : `$${Number(mainVal).toFixed(2)}`;
                  const formattedMa =
                    movingAvg != null
                      ? (chartMode === 'perHand'
                          ? `$${Number(movingAvg).toFixed(2)}/hand`
                          : `$${Number(movingAvg).toFixed(2)}`)
                      : null;
                  const title =
                    chartXAxisConfig && typeof label === 'number'
                      ? formatHandsAxisLabel(label)
                      : String(label ?? '');
                  return (
                    <Paper elevation={3} sx={{ px: 1.5, py: 1, minWidth: 160 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {title}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {chartMode === 'perHand' ? '$/hand' : 'Bankroll'}: {formattedMain}
                      </Typography>
                      {formattedMa && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          5-pt avg: {formattedMa}
                        </Typography>
                      )}
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ color: deltaNet != null ? (deltaNet >= 0 ? 'success.main' : 'error.main') : 'text.secondary' }}
                      >
                        Δ vs prev: {deltaNet != null ? `${deltaNet >= 0 ? '+' : '−'}$${Math.abs(deltaNet).toFixed(2)}` : '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Segment: {segmentPerHand != null ? `$${segmentPerHand.toFixed(3)}/hand` : '—'}
                        {deltaHands != null && deltaHands > 0 ? ` · ${Math.round(deltaHands).toLocaleString()} hands` : ''}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Hands: {Number(hands).toLocaleString()}
                      </Typography>
                    </Paper>
                  );
                }}
              />
              <Line
                yAxisId={0}
                type="monotone"
                dataKey={chartMode === 'perHand' ? 'profitPerHand' : 'value'}
                stroke={chartMode === 'perHand' ? '#ff9800' : '#4caf50'}
                strokeWidth={2}
                dot={{ r: 3 }}
                isAnimationActive={false}
              />
              <Line
                yAxisId={0}
                type="monotone"
                dataKey="movingAvg"
                stroke={chartMode === 'perHand' ? 'rgba(255,152,0,0.45)' : 'rgba(76,175,80,0.45)'}
                strokeWidth={1.5}
                strokeDasharray="5 3"
                dot={false}
                isAnimationActive={false}
                name="movingAvg"
              />
              {showHandsOverlay && typeof interval !== 'object' && (
                <Line
                  yAxisId={1}
                  type="monotone"
                  dataKey="cumulativeHands"
                  stroke="rgba(100,181,246,0.55)"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                  name="cumulativeHands"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          {chartMode === 'perHand' ? '$ per hand over time' : 'Bankroll over time'} · {formatIntervalLabel(interval)}
          {showHandsOverlay && typeof interval !== 'object' && ' · Cumulative hands (right axis, light blue)'}
          {' · Dashed = 5-pt avg'}
        </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* ── Net profit by stake chart ── */}
      <Accordion variant="outlined" sx={{ '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<Typography sx={{ color: 'text.secondary' }}>▾</Typography>}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TrendingUpIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2">Profit by stake</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {byStake.length === 0 ? (
            <Typography variant="caption" color="text.secondary">No stake data recorded.</Typography>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <ToggleButtonGroup
                  value={stakeChartMode}
                  exclusive
                  onChange={(_, v) => v != null && setStakeChartMode(v)}
                  size="small"
                  sx={{ '& .MuiToggleButton-root': { py: 0.25, px: 1 } }}
                >
                  <ToggleButton value="net">Net $</ToggleButton>
                  <ToggleButton value="perHand">$/hand</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              <Box sx={{ height: compact ? 200 : 260, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byStake} margin={{ top: 4, right: 4, bottom: 4, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                    <XAxis dataKey="stake" tick={{ fontSize: 10, fill: axisColor }} stroke={axisStroke} />
                    <YAxis
                      tick={{ fontSize: 10, fill: axisColor }}
                      stroke={axisStroke}
                      tickFormatter={(v) => stakeChartMode === 'net' ? `$${Number(v).toFixed(0)}` : `$${Number(v).toFixed(2)}`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload as typeof byStake[0];
                        const val = stakeChartMode === 'net' ? d.totalProfit : d.profitPerHand;
                        return (
                          <Paper elevation={3} sx={{ px: 1.5, py: 1 }}>
                            <Typography variant="caption" color="text.secondary">${d.stake}</Typography>
                            <Typography variant="body2" sx={{ color: val >= 0 ? 'success.main' : 'error.main', fontWeight: 600 }}>
                              {stakeChartMode === 'net' ? `$${val.toFixed(2)}` : `$${val.toFixed(2)}/hand`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">{d.totalHands.toLocaleString()} hands</Typography>
                          </Paper>
                        );
                      }}
                    />
                    <Bar dataKey={stakeChartMode === 'net' ? 'totalProfit' : 'profitPerHand'} radius={[3, 3, 0, 0]} isAnimationActive={false}>
                      {byStake.map((entry, i) => {
                        const val = stakeChartMode === 'net' ? entry.totalProfit : entry.profitPerHand;
                        return <Cell key={i} fill={val >= 0 ? '#4caf50' : '#f44336'} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* ── Session length vs result scatter ── */}
      <Accordion variant="outlined" sx={{ '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<Typography sx={{ color: 'text.secondary' }}>▾</Typography>}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <BubbleChartIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2">Session length vs result</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {scatterData.length === 0 ? (
            <Typography variant="caption" color="text.secondary">No sessions with recorded duration.</Typography>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <ToggleButtonGroup
                  value={scatterMode}
                  exclusive
                  onChange={(_, v) => v != null && setScatterMode(v)}
                  size="small"
                  sx={{ '& .MuiToggleButton-root': { py: 0.25, px: 1 } }}
                >
                  <ToggleButton value="net">Net $</ToggleButton>
                  <ToggleButton value="perHand">$/hand</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              <Box sx={{ height: compact ? 280 : 360, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 4, right: 4, bottom: 28, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis
                      type="number"
                      dataKey="hours"
                      name="Duration"
                      tick={{ fontSize: 10, fill: axisColor }}
                      stroke={axisStroke}
                      label={{ value: 'Hours', position: 'insideBottom', offset: -12, fill: axisStroke, fontSize: 11 }}
                    />
                    <YAxis
                      type="number"
                      dataKey={scatterMode === 'net' ? 'net' : 'pph'}
                      name={scatterMode === 'net' ? 'Net' : '$/hand'}
                      tick={{ fontSize: 10, fill: axisColor }}
                      stroke={axisStroke}
                      tickFormatter={(v) => scatterMode === 'net' ? `$${Number(v).toFixed(0)}` : `$${Number(v).toFixed(2)}`}
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload as ScatterPoint;
                        const val = scatterMode === 'net' ? d.net : d.pph;
                        return (
                          <Paper elevation={3} sx={{ px: 1.5, py: 1 }}>
                            <Typography variant="caption" color="text.secondary">{d.hours.toFixed(1)}h session</Typography>
                            <Typography variant="body2" sx={{ color: val >= 0 ? 'success.main' : 'error.main', fontWeight: 600 }}>
                              {scatterMode === 'net' ? `Net: $${d.net.toFixed(2)}` : `$/hand: $${d.pph.toFixed(2)}`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">{d.hands.toLocaleString()} hands</Typography>
                          </Paper>
                        );
                      }}
                    />
                    <Scatter
                      data={scatterData}
                      shape={(props) => {
                        const { cx, cy, payload } = props as { cx: number; cy: number; payload: ScatterPoint };
                        const val = scatterMode === 'net' ? payload.net : payload.pph;
                        return <circle cx={cx} cy={cy} r={4} fill={val >= 0 ? '#4caf50' : '#f44336'} fillOpacity={0.75} />;
                      }}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Each dot = one session. {scatterMode === 'net' ? 'Net $' : '$/hand'} vs hours played.
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* ── Time of day heatmap ── */}
      <Accordion variant="outlined" sx={{ '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<Typography sx={{ color: 'text.secondary' }}>▾</Typography>}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTimeIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2">Time of day</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {!hasTimeOfDayData ? (
            <Typography variant="caption" color="text.secondary">No sessions with recorded start time.</Typography>
          ) : (
            <Box>
              <Box sx={{ height: compact ? 200 : 260, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeOfDayData} margin={{ top: 4, right: 4, bottom: 4, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: axisColor }} stroke={axisStroke} interval={0} />
                    <YAxis
                      tick={{ fontSize: 10, fill: axisColor }}
                      stroke={axisStroke}
                      tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload as typeof timeOfDayData[0];
                        if (d.count === 0) return null;
                        return (
                          <Paper elevation={3} sx={{ px: 1.5, py: 1 }}>
                            <Typography variant="caption" color="text.secondary">{d.label}</Typography>
                            <Typography variant="body2">{d.count} session{d.count !== 1 ? 's' : ''}</Typography>
                            <Typography variant="body2" sx={{ color: d.avg >= 0 ? 'success.main' : 'error.main', fontWeight: 600 }}>
                              Avg: ${d.avg.toFixed(2)}
                            </Typography>
                          </Paper>
                        );
                      }}
                    />
                    <Bar dataKey="avg" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                      {timeOfDayData.map((entry, i) => (
                        <Cell key={i} fill={entry.count === 0 ? 'transparent' : entry.avg >= 0 ? '#4caf50' : '#f44336'} fillOpacity={entry.count === 0 ? 0 : Math.min(0.4 + entry.count * 0.15, 1)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Avg net $ by session start hour. Opacity reflects session count. Requires start time logged.
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* ── Rolling $/hand win rate ── */}
      <Accordion variant="outlined" sx={{ '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<Typography sx={{ color: 'text.secondary' }}>▾</Typography>}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <MultilineChartIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2">Rolling $/hand trend</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <IconButton size="small" onClick={(e) => setRollingMenuAnchorEl(e.currentTarget)} aria-label="Rolling window">
                <SettingsIcon fontSize="small" />
              </IconButton>
              <Menu
                anchorEl={rollingMenuAnchorEl}
                open={!!rollingMenuAnchorEl}
                onClose={() => setRollingMenuAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                {ROLLING_OPTIONS.map((n) => (
                  <MenuItem
                    key={n}
                    selected={rollingWindow === n}
                    onClick={() => { setRollingWindow(n); setRollingMenuAnchorEl(null); }}
                  >
                    Last {n.toLocaleString()} hands
                  </MenuItem>
                ))}
              </Menu>
            </Box>
            {rollingWinRateData.length < 2 ? (
              <Typography variant="caption" color="text.secondary">
                Not enough hand data yet (need more than one session with hands recorded).
              </Typography>
            ) : (
              <Box sx={{ height: compact ? 280 : 360, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rollingWinRateData} margin={{ top: 4, right: 4, bottom: 28, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis
                      dataKey="cumulativeHands"
                      type="number"
                      tick={{ fontSize: 10, fill: axisColor }}
                      stroke={axisStroke}
                      tickFormatter={formatHandsAxisLabel}
                      label={{ value: 'Hands', position: 'insideBottom', offset: -12, fill: axisStroke, fontSize: 11 }}
                      domain={['dataMin', 'dataMax']}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: axisColor }}
                      stroke={axisStroke}
                      tickFormatter={(v) => `$${Number(v).toFixed(2)}`}
                    />
                    <ReferenceLine y={0} stroke={axisStroke} strokeDasharray="4 2" />
                    <Tooltip
                      formatter={(value: number | undefined) => [`$${Number(value ?? 0).toFixed(3)}/hand`, `Rolling (last ${rollingWindow.toLocaleString()} hands)`]}
                      labelFormatter={(v) => `At ${formatHandsAxisLabel(Number(v))} hands`}
                    />
                    <Line
                      type="monotone"
                      dataKey="rollingPPH"
                      stroke="#ff9800"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Rolling $/hand over last {rollingWindow.toLocaleString()} hands. Use ⚙ to change window.
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
