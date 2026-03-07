import type { SessionResult } from '../types/results';

export type InsightsDateRange = 'all' | 'month' | 'year';

export interface PokerInsights {
  /** Max drawdown in dollars (peak - valley) */
  maxDrawdown: number;
  maxDrawdownHands: number;
  /** Longest breakeven stretch (hands below peak before recovery) */
  longestBreakevenHands: number;
  longestBreakevenDays: number;
  /** Biggest upswing from valley to peak */
  biggestUpswing: number;
  biggestUpswingHands: number;
  /** Streaks */
  maxWinStreak: number;
  maxWinStreakMonth: string | null;
  maxLoseStreak: number;
  /** Win rate % (sessions with net > 0) */
  winRatePercentage: number;
  avgSessionNet: number;
  /** Current status */
  currentStatus: string | null;
  currentWin: number;
  currentLose: number;
  /** Recovery info when in downswing */
  inDownswing: boolean;
  currentPeak: number;
  currentValley: number;
  cumulativeNet: number;
  /** Best day of week by $/hr */
  bestDay: string | null;
  bestDayProfitPerHour: number;
  bestDayTotal: number;
  /** Worst day of week by $/hr */
  worstDay: string | null;
  worstDayProfitPerHour: number;
  worstDayTotal: number;
  /** By session duration (<4hr vs >=4hr) */
  shortSessionProfitPerHour: number | null;
  shortSessionHours: number;
  longSessionProfitPerHour: number | null;
  longSessionHours: number;
  /** Best time of day by $/hand (from startTime) */
  bestTimeOfDay: string | null;
  bestTimeOfDayProfitPerHand: number;
  /** Best time of day by $/hr (for comparison with hands/hr) */
  bestTimeOfDayByHourly: string | null;
  bestTimeOfDayProfitPerHour: number;
  /** $/hand and $/hr by time-of-day bucket */
  byTimeOfDay: {
    label: string;
    profitPerHand: number;
    profitPerHour: number;
    hours: number;
    hands: number;
    handsPerHour: number;
  }[];
  /** Net and $/hand by day of week */
  byDayOfWeek: {
    label: string;
    profit: number;
    hands: number;
    profitPerHand: number;
  }[];
  /** Running total for chart */
  runningTotal: { cumulativeNet: number; cumulativeHands: number; date: string }[];
  /** Total profit / total hands (avg $ per hand) */
  profitPerHand: number;
  totalHands: number;
  /** Total hours played (for date range) */
  totalHours: number;
  /** Avg $ per hour (cumulativeNet / totalHours) */
  profitPerHour: number;
  /** Number of sessions in range */
  sessionCount: number;
  /** Best single session: net and date */
  bestSingleSessionNet: number | null;
  bestSingleSessionDate: string | null;
  /** Worst single session: net and date */
  worstSingleSessionNet: number | null;
  worstSingleSessionDate: string | null;
  /** Avg hours per session */
  avgSessionLengthHours: number;
  /** Avg hands per session */
  avgHandsPerSession: number;
}

const TIME_BUCKETS: { key: number; label: string; minHour: number; maxHour: number }[] = [
  { key: 0, label: 'Late night', minHour: 0, maxHour: 5 },   // 12am–6am
  { key: 1, label: 'Morning', minHour: 6, maxHour: 11 },     // 6am–12pm
  { key: 2, label: 'Afternoon', minHour: 12, maxHour: 17 },  // 12pm–6pm
  { key: 3, label: 'Evening', minHour: 18, maxHour: 23 },    // 6pm–12am
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function filterSessionsByRange(sessions: SessionResult[], range: InsightsDateRange): SessionResult[] {
  if (range === 'all') return sessions;
  const now = new Date();
  let cutoff: Date;
  if (range === 'month') {
    cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    cutoff = new Date(now.getFullYear(), 0, 1);
  }
  return sessions.filter((s) => new Date(s.date) >= cutoff);
}

export function calculatePokerInsights(
  sessions: SessionResult[],
  options?: { dateRange?: InsightsDateRange }
): PokerInsights {
  const range = options?.dateRange ?? 'all';
  const filtered = filterSessionsByRange(sessions, range);
  const sorted = [...filtered].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const runningTotal: { cumulativeNet: number; cumulativeHands: number; date: string }[] = [];
  let cumulativeNet = 0;
  let cumulativeHands = 0;
  let totalHours = 0;
  let peak = 0;
  let peakCumHands = 0;
  let peakDate: Date | null = null;

  let inStretch = false;
  let stretchStartCumHands = 0;
  let stretchStartDate: Date | null = null;
  let longestStretchHands = 0;
  let longestStretchDays = 0;

  let inDownswing = false;
  let downswingPeak = 0;
  let downswingValley = 0;
  let downswingHands = 0;
  let valleyCumHands = 0;
  let biggestDownswingAmount = 0;
  let biggestDownswingHands = 0;
  let biggestUpswingAmount = 0;
  let biggestUpswingHands = 0;

  let maxWinStreak = 0;
  let maxLoseStreak = 0;
  let currentWin = 0;
  let currentLose = 0;
  let maxWinStreakEndIdx = -1;
  let winningSessions = 0;

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    const net = s.dailyNet ?? 0;
    const hands = s.hands ?? 0;
    const hours = s.totalTime ?? 0;
    const date = new Date(s.date);
    cumulativeNet += net;
    cumulativeHands += hands;
    totalHours += hours;
    runningTotal.push({
      cumulativeNet,
      cumulativeHands,
      date: s.date,
    });

    if (net > 0) {
      currentWin++;
      currentLose = 0;
      if (currentWin > maxWinStreak) {
        maxWinStreak = currentWin;
        maxWinStreakEndIdx = i;
      }
      winningSessions++;
    } else if (net < 0) {
      currentLose++;
      currentWin = 0;
      maxLoseStreak = Math.max(maxLoseStreak, currentLose);
    } else {
      currentWin = 0;
      currentLose = 0;
    }

    if (cumulativeNet > peak) {
      peak = cumulativeNet;
      peakCumHands = cumulativeHands;
      peakDate = date;
      if (inStretch) {
        const stretchHands = cumulativeHands - stretchStartCumHands;
        const stretchDays = stretchStartDate
          ? Math.ceil((date.getTime() - stretchStartDate.getTime()) / (24 * 60 * 60 * 1000))
          : 0;
        if (stretchHands > longestStretchHands || stretchDays > longestStretchDays) {
          longestStretchHands = stretchHands;
          longestStretchDays = stretchDays;
        }
        inStretch = false;
      }
      if (inDownswing) {
        const drop = downswingPeak - downswingValley;
        if (drop > biggestDownswingAmount) {
          biggestDownswingAmount = drop;
          biggestDownswingHands = downswingHands;
        }
        const rise = cumulativeNet - downswingValley;
        const upswingHands = cumulativeHands - valleyCumHands;
        if (rise > biggestUpswingAmount) {
          biggestUpswingAmount = rise;
          biggestUpswingHands = upswingHands;
        }
        inDownswing = false;
      }
    } else if (cumulativeNet < peak) {
      if (!inStretch) {
        inStretch = true;
        stretchStartCumHands = cumulativeHands - hands;
        stretchStartDate = new Date(date);
        stretchStartDate.setHours(0, 0, 0, 0);
      }
      if (!inDownswing) {
        inDownswing = true;
        downswingPeak = peak;
        downswingValley = cumulativeNet;
        downswingHands = hands;
        valleyCumHands = cumulativeHands;
      } else {
        if (cumulativeNet < downswingValley) {
          downswingValley = cumulativeNet;
          valleyCumHands = cumulativeHands;
        }
        downswingHands += hands;
      }
    }
  }

  if (inStretch && sorted.length > 0) {
    const stretchHands = cumulativeHands - stretchStartCumHands;
    const stretchDays = stretchStartDate
      ? Math.ceil(
          (new Date(sorted[sorted.length - 1].date).getTime() - stretchStartDate.getTime()) /
            (24 * 60 * 60 * 1000)
        )
      : 0;
    if (stretchHands > longestStretchHands || stretchDays > longestStretchDays) {
      longestStretchHands = stretchHands;
      longestStretchDays = stretchDays;
    }
  }
  if (inDownswing) {
    const drop = downswingPeak - downswingValley;
    if (drop > biggestDownswingAmount) {
      biggestDownswingAmount = drop;
      biggestDownswingHands = downswingHands;
    }
  }

  const maxWinStreakMonth =
    maxWinStreakEndIdx >= 0
      ? new Date(sorted[maxWinStreakEndIdx].date).toLocaleDateString(undefined, {
          month: 'long',
          year: 'numeric',
        })
      : null;

  // Best / worst single session
  let bestSingleSessionNet: number | null = null;
  let bestSingleSessionDate: string | null = null;
  let worstSingleSessionNet: number | null = null;
  let worstSingleSessionDate: string | null = null;
  for (const s of sorted) {
    const net = s.dailyNet ?? 0;
    if (net > 0 && (bestSingleSessionNet === null || net > bestSingleSessionNet)) {
      bestSingleSessionNet = net;
      bestSingleSessionDate = s.date;
    }
    if (net < 0 && (worstSingleSessionNet === null || net < worstSingleSessionNet)) {
      worstSingleSessionNet = net;
      worstSingleSessionDate = s.date;
    }
  }

  const sessionCount = sorted.length;
  const avgSessionLengthHours = sessionCount > 0 ? totalHours / sessionCount : 0;
  const avgHandsPerSession = sessionCount > 0 ? cumulativeHands / sessionCount : 0;

  const winRatePercentage =
    sorted.length > 0 ? (winningSessions / sorted.length) * 100 : 0;
  const avgSessionNet =
    sorted.length > 0
      ? sorted.reduce((sum, s) => sum + (s.dailyNet ?? 0), 0) / sorted.length
      : 0;

  let currentStatus: string | null = null;
  if (currentWin >= 2) currentStatus = `On a ${currentWin}-session heater!`;
  else if (currentLose >= 2) currentStatus = `In a ${currentLose}-session downswing`;
  else if (currentWin === 1) currentStatus = '1 winning session';
  else if (currentLose === 1) currentStatus = '1 losing session';

  // Best day of week by $/hr; also build full byDayOfWeek for display
  const byDay = new Map<
    number,
    { hours: number; profit: number; hands: number }
  >();
  for (const s of sorted) {
    const d = new Date(s.date);
    const day = d.getDay();
    const hours = s.totalTime ?? 0;
    const profit = s.dailyNet ?? 0;
    const hands = s.hands ?? 0;
    const existing = byDay.get(day) ?? { hours: 0, profit: 0, hands: 0 };
    byDay.set(day, {
      hours: existing.hours + hours,
      profit: existing.profit + profit,
      hands: existing.hands + hands,
    });
  }
  const byDayOfWeek = [0, 1, 2, 3, 4, 5, 6].map((day) => {
    const data = byDay.get(day) ?? { hours: 0, profit: 0, hands: 0 };
    const profitPerHand = data.hands > 0 ? data.profit / data.hands : 0;
    return {
      label: DAY_NAMES[day],
      profit: data.profit,
      hands: data.hands,
      profitPerHand,
    };
  });
  let bestDay: string | null = null;
  let bestDayProfitPerHour = 0;
  let bestDayTotal = 0;
  let worstDay: string | null = null;
  let worstDayProfitPerHour = 0;
  let worstDayTotal = 0;
  for (const [day, { hours, profit }] of byDay.entries()) {
    if (hours > 0) {
      const pph = profit / hours;
      if (pph > bestDayProfitPerHour) {
        bestDayProfitPerHour = pph;
        bestDay = DAY_NAMES[day];
        bestDayTotal = profit;
      }
      if (worstDay === null || pph < worstDayProfitPerHour) {
        worstDayProfitPerHour = pph;
        worstDay = DAY_NAMES[day];
        worstDayTotal = profit;
      }
    }
  }

  // Session duration buckets (<4hr vs >=4hr)
  const SHORT_THRESHOLD = 4;
  let shortHours = 0;
  let shortProfit = 0;
  let longHours = 0;
  let longProfit = 0;
  for (const s of sorted) {
    const hours = s.totalTime ?? 0;
    const profit = s.dailyNet ?? 0;
    if (hours < SHORT_THRESHOLD) {
      shortHours += hours;
      shortProfit += profit;
    } else {
      longHours += hours;
      longProfit += profit;
    }
  }

  // Time of day (from startTime; only sessions with startTime)
  const byTimeBucket = new Map<number, { hours: number; profit: number; hands: number }>();
  for (const s of sorted) {
    const startTime = s.startTime ? new Date(s.startTime) : null;
    if (!startTime || Number.isNaN(startTime.getTime())) continue;
    const hour = startTime.getHours();
    const bucket = TIME_BUCKETS.find((b) => hour >= b.minHour && hour <= b.maxHour);
    if (!bucket) continue;
    const hours = s.totalTime ?? 0;
    const profit = s.dailyNet ?? 0;
    const hands = s.hands ?? 0;
    const existing = byTimeBucket.get(bucket.key) ?? { hours: 0, profit: 0, hands: 0 };
    byTimeBucket.set(bucket.key, {
      hours: existing.hours + hours,
      profit: existing.profit + profit,
      hands: existing.hands + hands,
    });
  }
  const byTimeOfDay = TIME_BUCKETS.map((b) => {
    const data = byTimeBucket.get(b.key) ?? { hours: 0, profit: 0, hands: 0 };
    const profitPerHand = data.hands > 0 ? data.profit / data.hands : 0;
    const profitPerHour = data.hours > 0 ? data.profit / data.hours : 0;
    const handsPerHour = data.hours > 0 ? data.hands / data.hours : 0;
    return {
      label: b.label,
      profitPerHand,
      profitPerHour,
      hours: data.hours,
      hands: data.hands,
      handsPerHour,
    };
  }).filter((r) => r.hours > 0);
  // Best time by $/hand (fair when table count varies)
  let bestTimeOfDay: string | null = null;
  let bestTimeOfDayProfitPerHand = 0;
  for (const r of byTimeOfDay) {
    if (r.hands > 0 && r.profitPerHand > bestTimeOfDayProfitPerHand) {
      bestTimeOfDayProfitPerHand = r.profitPerHand;
      bestTimeOfDay = r.label;
    }
  }
  // Best time by $/hr (highest hourly; can compare to hands/hr)
  let bestTimeOfDayByHourly: string | null = null;
  let bestTimeOfDayProfitPerHour = 0;
  for (const r of byTimeOfDay) {
    if (r.profitPerHour > bestTimeOfDayProfitPerHour) {
      bestTimeOfDayProfitPerHour = r.profitPerHour;
      bestTimeOfDayByHourly = r.label;
    }
  }

  return {
    maxDrawdown: biggestDownswingAmount,
    maxDrawdownHands: biggestDownswingHands,
    longestBreakevenHands: longestStretchHands,
    longestBreakevenDays: longestStretchDays,
    biggestUpswing: biggestUpswingAmount,
    biggestUpswingHands: biggestUpswingHands,
    maxWinStreak,
    maxWinStreakMonth,
    maxLoseStreak,
    winRatePercentage,
    avgSessionNet,
    currentStatus,
    currentWin,
    currentLose,
    inDownswing,
    currentPeak: peak,
    currentValley: inDownswing ? downswingValley : cumulativeNet,
    cumulativeNet,
    bestDay,
    bestDayProfitPerHour,
    bestDayTotal,
    worstDay,
    worstDayProfitPerHour,
    worstDayTotal,
    shortSessionProfitPerHour: shortHours > 0 ? shortProfit / shortHours : null,
    shortSessionHours: shortHours,
    longSessionProfitPerHour: longHours > 0 ? longProfit / longHours : null,
    longSessionHours: longHours,
    bestTimeOfDay,
    bestTimeOfDayProfitPerHand,
    bestTimeOfDayByHourly,
    bestTimeOfDayProfitPerHour,
    byTimeOfDay,
    byDayOfWeek,
    runningTotal,
    totalHands: cumulativeHands,
    profitPerHand: cumulativeHands > 0 ? cumulativeNet / cumulativeHands : 0,
    totalHours,
    profitPerHour: totalHours > 0 ? cumulativeNet / totalHours : 0,
    sessionCount,
    bestSingleSessionNet,
    bestSingleSessionDate,
    worstSingleSessionNet,
    worstSingleSessionDate,
    avgSessionLengthHours,
    avgHandsPerSession,
  };
}
