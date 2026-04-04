import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import LinearProgress from '@mui/material/LinearProgress';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { useCompactMode } from '../../context/CompactModeContext';
import {
  calculatePokerInsights,
  type InsightsDateRange,
  type PokerInsights,
} from '../../utils/calculatePokerInsights';
import type { SessionResult } from '../../types/results';

interface FunFactsBentoProps {
  sessions: SessionResult[];
  /** Full history for carry-forward nets when `sessions` is format- or date-filtered. */
  allSessionsForNet?: SessionResult[];
  compact?: boolean;
  /** When provided, this component becomes controlled for date-range filtering. */
  dateRange?: InsightsDateRange;
  onDateRangeChange?: (range: InsightsDateRange) => void;
  /** Hide the date range toggle when the parent provides global controls. */
  showDateRangeToggle?: boolean;
}

function getPrimaryStake(sessions: SessionResult[]): number {
  const counts = new Map<number, number>();
  for (const s of sessions) {
    const stake = s.stake ?? 0;
    if (stake > 0) {
      counts.set(stake, (counts.get(stake) ?? 0) + 1);
    }
  }
  if (counts.size === 0) return 200;
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function formatAmount(
  dollars: number,
  useBB: boolean,
  bbSize: number
): string {
  if (useBB && bbSize > 0) {
    const bb = Math.round((dollars / bbSize) * 100) / 100;
    return `${bb >= 0 ? '+' : ''}${bb} bb`;
  }
  const sign = dollars >= 0 ? '+' : '−';
  return `${sign}$${Math.abs(dollars).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPerHour(dollars: number, useBB: boolean, bbSize: number): string {
  const formatted = formatAmount(dollars, useBB, bbSize);
  return `${formatted}/hr`;
}

/** Format date string as local calendar date (avoids UTC parsing shifting the day) */
function formatDateForDisplay(dateStr: string): string {
  const d = new Date(dateStr);
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return new Date(key + 'T12:00:00').toLocaleDateString();
}

export function FunFactsBento({
  sessions,
  allSessionsForNet,
  compact: compactProp,
  dateRange: dateRangeProp,
  onDateRangeChange,
  showDateRangeToggle = true,
}: FunFactsBentoProps) {
  const compact = useCompactMode() ?? compactProp ?? false;
  const [dateRangeState, setDateRangeState] = useState<InsightsDateRange>('all');
  const [useBB, setUseBB] = useState(false);

  const dateRange = dateRangeProp ?? dateRangeState;
  const setDateRange = (r: InsightsDateRange) => {
    if (dateRangeProp !== undefined) onDateRangeChange?.(r);
    else setDateRangeState(r);
  };

  const primaryStake = useMemo(() => getPrimaryStake(sessions), [sessions]);
  const bbSize = primaryStake / 100;

  const insights = useMemo(
    () =>
      calculatePokerInsights(sessions, {
        dateRange,
        allSessionsForNet: allSessionsForNet ?? sessions,
      }),
    [sessions, dateRange, allSessionsForNet]
  );

  if (sessions.length < 2) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          textAlign: 'center',
          borderStyle: 'dashed',
          bgcolor: 'action.hover',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Play more sessions to unlock insights!
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          Log at least 2 sessions to see streaks, downswings, and more.
        </Typography>
      </Paper>
    );
  }

  const formatDollar = (d: number) => formatAmount(d, useBB, bbSize);
  const formatPerHr = (d: number) => formatPerHour(d, useBB, bbSize);
  const formatDownswing = (d: number) =>
    formatAmount(-d, useBB, bbSize).replace(/^\+/, '−');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        {showDateRangeToggle && (
          <ToggleButtonGroup
            value={dateRange}
            exclusive
            onChange={(_, v) => v != null && setDateRange(v)}
            size="small"
          >
            <ToggleButton value="all">All time</ToggleButton>
            <ToggleButton value="year">This year</ToggleButton>
            <ToggleButton value="month">This month</ToggleButton>
            <ToggleButton value="week">Last 7 days</ToggleButton>
            <ToggleButton value="today">Today</ToggleButton>
          </ToggleButtonGroup>
        )}
        <ToggleButtonGroup
          value={useBB ? 'bb' : 'usd'}
          exclusive
          onChange={(_, v) => setUseBB(v === 'bb')}
          size="small"
        >
          <ToggleButton value="usd">$</ToggleButton>
          <ToggleButton value="bb">BB</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: compact ? 1 : 1.5,
        }}
      >
        {insights.maxWinStreak > 0 && (
          <InsightCard
            icon={<LocalFireDepartmentIcon sx={{ fontSize: 20 }} />}
            label="Longest win streak"
            value={`${insights.maxWinStreak} session${insights.maxWinStreak !== 1 ? 's' : ''}${insights.maxWinStreakMonth ? ` (${insights.maxWinStreakMonth})` : ''}`}
            accent="success"
          />
        )}
        {insights.maxLoseStreak > 0 && (
          <InsightCard
            icon={<TrendingDownIcon sx={{ fontSize: 20 }} />}
            label="Longest lose streak"
            value={`${insights.maxLoseStreak} session${insights.maxLoseStreak !== 1 ? 's' : ''}`}
            accent="error"
          />
        )}
        {insights.sessionCount > 0 && (
          <InsightCard
            icon={<CalendarMonthIcon sx={{ fontSize: 20 }} />}
            label="Total sessions"
            value={`${insights.sessionCount} session${insights.sessionCount !== 1 ? 's' : ''}`}
          />
        )}
        {insights.sessionCount > 0 && (
          <InsightCard
            icon={<AttachMoneyIcon sx={{ fontSize: 20 }} />}
            label="Avg day / month net"
            value={`${formatDollar(insights.avgDayNet)} / day · ${formatDollar(insights.avgMonthNet)} / month`}
            accent={insights.avgDayNet >= 0 ? 'success' : 'error'}
          />
        )}
        {(insights.topBreakevenStretches.length > 0 || insights.currentBreakevenStretch) && (
          <Paper
            variant="outlined"
            sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ color: 'warning.main' }}>
                <ScheduleIcon sx={{ fontSize: 20 }} />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {insights.currentBreakevenStretch ? 'Current & top 3 breakeven stretches' : 'Top 3 longest breakeven stretches'}
              </Typography>
            </Box>
            {insights.currentBreakevenStretch && (
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                Current: {insights.currentBreakevenStretch.hands.toLocaleString()} hands / {insights.currentBreakevenStretch.days} day{insights.currentBreakevenStretch.days !== 1 ? 's' : ''}
              </Typography>
            )}
            {insights.topBreakevenStretches
              .filter((r) => !insights.currentBreakevenStretch || r.hands !== insights.currentBreakevenStretch.hands || r.days !== insights.currentBreakevenStretch.days)
              .map((r, i) => (
                <Typography key={i} variant="body2" sx={{ fontWeight: 500, color: 'warning.main' }}>
                  {r.hands.toLocaleString()} hands / {r.days} day{r.days !== 1 ? 's' : ''}{r.dateEnded ? ` · ended ${formatDateForDisplay(r.dateEnded)}` : ''}
                </Typography>
              ))}
          </Paper>
        )}
        {insights.topDownswings.length > 0 && (
          <Paper
            variant="outlined"
            sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ color: 'error.main' }}>
                <TrendingDownIcon sx={{ fontSize: 20 }} />
              </Box>
              <Typography variant="caption" color="text.secondary">
                Top 3 longest downswings
              </Typography>
            </Box>
            {insights.topDownswings.map((r, i) => (
              <Typography key={i} variant="body2" sx={{ fontWeight: 500, color: 'error.main' }}>
                {formatDownswing(r.amount)}{r.hands > 0 ? ` over ${r.hands.toLocaleString()} hands` : ''}
                {r.ongoing ? ' · current' : r.dateEnded ? ` · ended ${formatDateForDisplay(r.dateEnded)}` : ''}
              </Typography>
            ))}
          </Paper>
        )}
        {insights.topUpswings.length > 0 && (
          <Paper
            variant="outlined"
            sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ color: 'success.main' }}>
                <TrendingUpIcon sx={{ fontSize: 20 }} />
              </Box>
              <Typography variant="caption" color="text.secondary">
                Top 3 longest upswings
              </Typography>
            </Box>
            {insights.topUpswings.map((r, i) => (
              <Typography key={i} variant="body2" sx={{ fontWeight: 500, color: 'success.main' }}>
                {formatDollar(r.amount)}{r.hands > 0 ? ` over ${r.hands.toLocaleString()} hands` : ''}{r.dateEnded ? ` · ended ${formatDateForDisplay(r.dateEnded)}` : ''}
              </Typography>
            ))}
          </Paper>
        )}
        {(insights.bestSingleSessionNet != null || insights.worstSingleSessionNet != null || insights.bestSingleDayTotal != null || insights.worstSingleDayTotal != null) && (
          <Paper
            variant="outlined"
            sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ color: 'text.secondary' }}>
                <TrendingUpIcon sx={{ fontSize: 20 }} />
              </Box>
              <Typography variant="caption" color="text.secondary">
                Best / worst session & day
              </Typography>
            </Box>
            {insights.bestSingleSessionNet != null && insights.bestSingleSessionNet > 0 && insights.bestSingleSessionDate && (
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'success.main' }}>
                Best session: {formatDollar(insights.bestSingleSessionNet)} on {formatDateForDisplay(insights.bestSingleSessionDate)}
              </Typography>
            )}
            {insights.worstSingleSessionNet != null && insights.worstSingleSessionNet < 0 && insights.worstSingleSessionDate && (
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'error.main' }}>
                Worst session: {formatDollar(insights.worstSingleSessionNet)} on {formatDateForDisplay(insights.worstSingleSessionDate)}
              </Typography>
            )}
            {insights.bestSingleDayTotal != null && insights.bestSingleDayTotal > 0 && insights.bestSingleDayDate && (
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'success.main' }}>
                Best day: {formatDollar(insights.bestSingleDayTotal)} on {formatDateForDisplay(insights.bestSingleDayDate)}
              </Typography>
            )}
            {insights.worstSingleDayTotal != null && insights.worstSingleDayTotal < 0 && insights.worstSingleDayDate && (
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'error.main' }}>
                Worst day: {formatDollar(insights.worstSingleDayTotal)} on {formatDateForDisplay(insights.worstSingleDayDate)}
              </Typography>
            )}
          </Paper>
        )}
        {insights.bestDay && (
          <InsightCard
            icon={<CalendarMonthIcon sx={{ fontSize: 20 }} />}
            label="Best day"
            value={`${insights.bestDay}: ${formatDollar(insights.bestDayTotal)} total, ${formatPerHr(insights.bestDayProfitPerHour)}`}
            accent="success"
          />
        )}
        {insights.worstDay && (
          <InsightCard
            icon={<CalendarMonthIcon sx={{ fontSize: 20 }} />}
            label="Worst day"
            value={`${insights.worstDay}: ${formatDollar(insights.worstDayTotal)} total, ${formatPerHr(insights.worstDayProfitPerHour)}`}
            accent="error"
          />
        )}
        {insights.byTimeOfDay.length > 0 && (
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.75,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ color: 'text.secondary' }}>
                <WbSunnyIcon sx={{ fontSize: 20 }} />
              </Box>
              <Typography variant="caption" color="text.secondary">
                Time of day (best → worst by session $/hr). 4-tabling = $/hand×240.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {[...insights.byTimeOfDay]
                .filter((r) => r.hours > 0)
                .sort((a, b) => {
                  const d = b.profitPerHour - a.profitPerHour;
                  return d !== 0 ? d : a.label.localeCompare(b.label);
                })
                .map((r, idx) => {
                  const isPositive = r.profitPerHour >= 0;
                  const handsStr =
                    r.hands >= 100_000
                      ? `${Math.round(r.hands / 1000)}k`
                      : r.hands.toLocaleString();
                  const volumeStr = `${handsStr} hands, ${r.hours.toFixed(1)} hrs`;
                  const fourTabHr = r.profitPerHand * 240;
                  return (
                    <Box
                      key={r.label}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        flexWrap: 'wrap',
                        gap: 0.5,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        {idx + 1}. {r.label}
                      </Typography>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: isPositive ? 'success.main' : 'error.main',
                          }}
                        >
                          {formatPerHr(r.profitPerHour)} session · {formatPerHr(fourTabHr)} 4-tab
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDollar(r.profitPerHand)}/hand · {Math.round(r.handsPerHour).toLocaleString()} hands/hr
                          {' · '}
                          {volumeStr}
                          {r.sessionCount > 0 && ` · Win ${r.winRatePercentage.toFixed(0)}%`}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
            </Box>
          </Paper>
        )}
        {insights.byDayOfWeek.some((r) => r.hands > 0 || r.profit !== 0) && (
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ color: 'text.secondary' }}>
                <CalendarMonthIcon sx={{ fontSize: 20 }} />
              </Box>
              <Typography variant="caption" color="text.secondary">
                Net & $/hand by day of week
              </Typography>
            </Box>
            <Box
              component="ul"
              sx={{
                m: 0,
                pl: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.25,
              }}
            >
              {[...insights.byDayOfWeek]
                .sort((a, b) => b.profit - a.profit)
                .map((r) => {
                  const hasData = r.hands > 0 || r.profit !== 0;
                  const net = formatDollar(r.profit);
                  const handsStr =
                    r.hands >= 100_000
                      ? `${Math.round(r.hands / 1000)}k`
                      : r.hands > 0
                        ? r.hands.toLocaleString()
                        : '';
                  const pph = r.hands > 0 ? `${formatDollar(r.profitPerHand)}/hand` : '—';
                  const handsSuffix = handsStr ? ` ${handsStr} hands` : '';
                  return (
                    <Typography
                      key={r.label}
                      component="li"
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        color: hasData && r.profit >= 0 ? 'success.main' : hasData && r.profit < 0 ? 'error.main' : 'text.secondary',
                      }}
                    >
                      {r.label}: {hasData ? `${net} (${pph})${handsSuffix}` : '—'}
                    </Typography>
                  );
                })}
            </Box>
          </Paper>
        )}
        {insights.bySessionLengthBuckets.length > 0 && (
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.75,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ color: 'text.secondary' }}>
                <AccessTimeIcon sx={{ fontSize: 20 }} />
              </Box>
              <Typography variant="caption" color="text.secondary">
                $/hr by session length
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {insights.bySessionLengthBuckets.map((r) => {
                const isPositive = r.profitPerHour >= 0;
                return (
                  <Box
                    key={r.label}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      flexWrap: 'wrap',
                      gap: 0.5,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {r.label}
                    </Typography>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: isPositive ? 'success.main' : 'error.main',
                        }}
                      >
                        {formatDollar(r.profitPerHour)}/hr
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {r.sessionCount} session{r.sessionCount !== 1 ? 's' : ''} · {r.hands.toLocaleString()} hands · {r.hours.toFixed(1)} hrs
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        )}
        {insights.byRating.length > 0 && (
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.75,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ color: 'text.secondary' }}>
                <EmojiEventsIcon sx={{ fontSize: 20 }} />
              </Box>
              <Typography variant="caption" color="text.secondary">
                Results by A/B/C/D/F game
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {insights.byRating.map((r) => {
                const isPositive = r.profit >= 0;
                const handsStr =
                  r.hands >= 100_000
                    ? `${Math.round(r.hands / 1000)}k`
                    : r.hands.toLocaleString();
                return (
                  <Box
                    key={r.rating}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      flexWrap: 'wrap',
                      gap: 0.5,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {r.label}
                    </Typography>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: isPositive ? 'success.main' : 'error.main',
                        }}
                      >
                        {formatDollar(r.profit)} · {formatDollar(r.profitPerHand)}/hand · {formatPerHr(r.profitPerHour)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {r.sessionCount} session{r.sessionCount !== 1 ? 's' : ''} · {handsStr} hands · {r.hours.toFixed(1)} hrs
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        )}
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.75,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ color: 'text.secondary' }}>
              <EmojiEventsIcon sx={{ fontSize: 20 }} />
            </Box>
            <Typography variant="caption" color="text.secondary">
              Win %
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Total: {insights.winRatePercentage.toFixed(1)}%
            </Typography>
            {insights.byTimeOfDay.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25 }}>
                {insights.byTimeOfDay.map((r) => `${r.label} ${r.winRatePercentage.toFixed(0)}%`).join(' · ')}
              </Typography>
            )}
          </Box>
        </Paper>
        <InsightCard
          icon={<TrendingUpIcon sx={{ fontSize: 20 }} />}
          label="Avg session net"
          value={formatDollar(insights.avgSessionNet)}
          accent={insights.avgSessionNet >= 0 ? 'success' : 'error'}
        />
        {insights.totalHands > 0 && (
          <InsightCard
            icon={<AttachMoneyIcon sx={{ fontSize: 20 }} />}
            label="$ won per hand"
            value={`${formatDollar(insights.profitPerHand)} (${insights.totalHands.toLocaleString()} hands)`}
            accent={insights.profitPerHand >= 0 ? 'success' : 'error'}
          />
        )}
        {insights.totalHours > 0 && (
          <InsightCard
            icon={<AccessTimeIcon sx={{ fontSize: 20 }} />}
            label="Average $ per hour"
            value={
              insights.totalHands > 0
                ? `${formatPerHr(insights.profitPerHour)} session · ${formatPerHr(insights.profitPerHand * 240)} 4-tabling ($/hand×240)`
                : formatPerHr(insights.profitPerHour)
            }
            accent={insights.profitPerHour >= 0 ? 'success' : 'error'}
          />
        )}
        {insights.sessionCount > 0 && insights.avgSessionLengthHours > 0 && (
          <InsightCard
            icon={<ScheduleIcon sx={{ fontSize: 20 }} />}
            label="Avg session length"
            value={`${insights.avgSessionLengthHours.toFixed(1)} hrs/session`}
          />
        )}
        {insights.sessionCount > 0 && insights.avgHandsPerSession > 0 && (
          <InsightCard
            icon={<ScheduleIcon sx={{ fontSize: 20 }} />}
            label="Avg hands per session"
            value={`${Math.round(insights.avgHandsPerSession).toLocaleString()} hands/session`}
          />
        )}
        {insights.currentStatus && (
          <InsightCard
            icon={<LocalFireDepartmentIcon sx={{ fontSize: 20 }} />}
            label="Current status"
            value={insights.currentStatus}
            accent={
              insights.currentStatus.includes('heater')
                ? 'success'
                : insights.currentStatus.includes('downswing')
                  ? 'error'
                  : undefined
            }
            glow={insights.currentWin >= 2}
          />
        )}
        {insights.inDownswing && (
          <Box sx={{ gridColumn: '1 / -1' }}>
            <RecoveryProgressBar
              insights={insights}
              formatDollar={formatDollar}
              formatDownswing={formatDownswing}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}

interface InsightCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: 'success' | 'error' | 'warning';
  glow?: boolean;
}

function getAccentColor(accent?: 'success' | 'error' | 'warning') {
  if (accent === 'success') return 'success.main';
  if (accent === 'error') return 'error.main';
  if (accent === 'warning') return 'warning.main';
  return 'text.secondary';
}

function InsightCard({ icon, label, value, accent, glow }: InsightCardProps) {
  const accentColor = getAccentColor(accent);
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        borderColor: glow ? 'success.main' : undefined,
        boxShadow: glow ? '0 0 12px rgba(76, 175, 80, 0.3)' : undefined,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Box sx={{ color: accent ? accentColor : 'text.secondary' }}>
          {icon}
        </Box>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </Box>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 500,
          color: accent ? accentColor : undefined,
        }}
      >
        {value}
      </Typography>
    </Paper>
  );
}

function RecoveryProgressBar({
  insights,
  formatDollar,
  formatDownswing,
}: {
  insights: PokerInsights;
  formatDollar: (d: number) => string;
  formatDownswing: (d: number) => string;
}) {
  const drop = insights.currentPeak - insights.currentValley;
  const recovered = insights.cumulativeNet - insights.currentValley;
  const progress = drop > 0 ? Math.min(100, (recovered / drop) * 100) : 0;
  const needToPeak = Math.max(0, insights.currentPeak - insights.cumulativeNet);
  const needToPeakLabel = formatDollar(needToPeak).replace(/^\++/, '');

  return (
    <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          Recovery to peak
        </Typography>
        <Typography variant="caption" color="error.main">
          {progress.toFixed(0)}% there
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 6,
          borderRadius: 1,
          bgcolor: 'action.selected',
          '& .MuiLinearProgress-bar': { bgcolor: 'success.main' },
        }}
      />
      {needToPeak > 0 && (
        <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block', fontWeight: 600 }}>
          Still need {needToPeakLabel} to reach peak
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
        {formatDownswing(drop)} from peak · {formatDollar(recovered)} recovered
        {insights.currentDownswingHands > 0 &&
          ` · ${insights.currentDownswingHands.toLocaleString()} hands since peak`}
      </Typography>
    </Paper>
  );
}
