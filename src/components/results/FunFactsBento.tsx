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
  compact?: boolean;
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

export function FunFactsBento({ sessions, compact: compactProp }: FunFactsBentoProps) {
  const compact = useCompactMode() ?? compactProp ?? false;
  const [dateRange, setDateRange] = useState<InsightsDateRange>('all');
  const [useBB, setUseBB] = useState(false);

  const primaryStake = useMemo(() => getPrimaryStake(sessions), [sessions]);
  const bbSize = primaryStake / 100;

  const insights = useMemo(
    () => calculatePokerInsights(sessions, { dateRange }),
    [sessions, dateRange]
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
        <ToggleButtonGroup
          value={dateRange}
          exclusive
          onChange={(_, v) => v != null && setDateRange(v)}
          size="small"
        >
          <ToggleButton value="all">All time</ToggleButton>
          <ToggleButton value="year">This year</ToggleButton>
          <ToggleButton value="month">This month</ToggleButton>
        </ToggleButtonGroup>
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
        {(insights.longestBreakevenHands > 0 || insights.longestBreakevenDays > 0) && (
          <InsightCard
            icon={<ScheduleIcon sx={{ fontSize: 20 }} />}
            label="Longest breakeven stretch"
            value={`${insights.longestBreakevenHands.toLocaleString()} hands / ${insights.longestBreakevenDays} day${insights.longestBreakevenDays !== 1 ? 's' : ''}`}
          />
        )}
        {insights.maxDrawdown > 0 && (
          <InsightCard
            icon={<TrendingDownIcon sx={{ fontSize: 20 }} />}
            label="Biggest downswing"
            value={`${formatDownswing(insights.maxDrawdown)}${insights.maxDrawdownHands > 0 ? ` over ${insights.maxDrawdownHands.toLocaleString()} hands` : ''}`}
            accent="error"
          />
        )}
        {insights.biggestUpswing > 0 && (
          <InsightCard
            icon={<TrendingUpIcon sx={{ fontSize: 20 }} />}
            label="Biggest upswing"
            value={`${formatDollar(insights.biggestUpswing)}${insights.biggestUpswingHands > 0 ? ` over ${insights.biggestUpswingHands.toLocaleString()} hands` : ''}`}
            accent="success"
          />
        )}
        {insights.bestSingleSessionNet != null && insights.bestSingleSessionNet > 0 && insights.bestSingleSessionDate && (
          <InsightCard
            icon={<TrendingUpIcon sx={{ fontSize: 20 }} />}
            label="Best single session"
            value={`${formatDollar(insights.bestSingleSessionNet)} on ${new Date(insights.bestSingleSessionDate).toLocaleDateString()}`}
            accent="success"
          />
        )}
        {insights.worstSingleSessionNet != null && insights.worstSingleSessionNet < 0 && insights.worstSingleSessionDate && (
          <InsightCard
            icon={<TrendingDownIcon sx={{ fontSize: 20 }} />}
            label="Worst single session"
            value={`${formatDollar(insights.worstSingleSessionNet)} on ${new Date(insights.worstSingleSessionDate).toLocaleDateString()}`}
            accent="error"
          />
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
        {insights.bestTimeOfDay && (
          <InsightCard
            icon={<WbSunnyIcon sx={{ fontSize: 20 }} />}
            label="Best time of day (by $/hand)"
            value={`${insights.bestTimeOfDay}: ${formatDollar(insights.bestTimeOfDayProfitPerHand)}/hand`}
            accent="success"
          />
        )}
        {insights.bestTimeOfDayByHourly && (
          <InsightCard
            icon={<AccessTimeIcon sx={{ fontSize: 20 }} />}
            label="Highest $/hr time"
            value={
              (() => {
                const r = insights.byTimeOfDay.find((x) => x.label === insights.bestTimeOfDayByHourly);
                const handsHr = r ? `${Math.round(r.handsPerHour).toLocaleString()} hands/hr` : '';
                return `${insights.bestTimeOfDayByHourly}: ${formatPerHr(insights.bestTimeOfDayProfitPerHour)}${handsHr ? ` (${handsHr})` : ''}`;
              })()
            }
          />
        )}
        {insights.byTimeOfDay.length > 0 && (
          <InsightCard
            icon={<AccessTimeIcon sx={{ fontSize: 20 }} />}
            label="$/hand & $/hr by time of day"
            value={insights.byTimeOfDay
              .map(
                (r) =>
                  `${r.label}: ${formatDollar(r.profitPerHand)}/hand, ${formatPerHr(r.profitPerHour)}`
              )
              .join(' · ')}
          />
        )}
        {insights.byDayOfWeek.some((r) => r.hands > 0 || r.profit !== 0) && (
          <InsightCard
            icon={<CalendarMonthIcon sx={{ fontSize: 20 }} />}
            label="Net & $/hand by day of week"
            value={insights.byDayOfWeek
              .map((r) => {
                const short = r.label.slice(0, 3);
                if (r.hands === 0 && r.profit === 0) return `${short}: —`;
                const net = formatDollar(r.profit);
                const pph = r.hands > 0 ? `${formatDollar(r.profitPerHand)}/hand` : '—';
                return `${short}: ${net} (${pph})`;
              })
              .join(' · ')}
          />
        )}
        {(insights.shortSessionProfitPerHour != null || insights.longSessionProfitPerHour != null) && (
          <InsightCard
            icon={<AccessTimeIcon sx={{ fontSize: 20 }} />}
            label="$/hr by session length"
            value={
              [
                insights.shortSessionHours > 0 && insights.shortSessionProfitPerHour != null
                  ? `<4hr: ${formatDollar(insights.shortSessionProfitPerHour)}/hr`
                  : null,
                insights.longSessionHours > 0 && insights.longSessionProfitPerHour != null
                  ? `≥4hr: ${formatDollar(insights.longSessionProfitPerHour)}/hr`
                  : null,
              ]
                .filter(Boolean)
                .join(' · ') || '—'
            }
          />
        )}
        <InsightCard
          icon={<EmojiEventsIcon sx={{ fontSize: 20 }} />}
          label="Win %"
          value={`${insights.winRatePercentage.toFixed(1)}%`}
        />
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
            value={formatPerHr(insights.profitPerHour)}
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
  accent?: 'success' | 'error';
  glow?: boolean;
}

function InsightCard({ icon, label, value, accent, glow }: InsightCardProps) {
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
        <Box sx={{ color: accent === 'success' ? 'success.main' : accent === 'error' ? 'error.main' : 'text.secondary' }}>
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
          color: accent === 'success' ? 'success.main' : accent === 'error' ? 'error.main' : undefined,
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
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
        {formatDownswing(drop)} from peak · {formatDollar(recovered)} recovered
      </Typography>
    </Paper>
  );
}
