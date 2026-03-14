import type { SessionResult, SessionRating } from '../types/results';
import { SESSION_RATING_OPTIONS } from '../types/results';
import { getSessionNetsMap } from './sessionUtils';

export type InsightsDateRange = 'all' | 'month' | 'year' | 'today' | { start: string; end: string };

export interface PokerInsights {
  /** Max drawdown in dollars (peak - valley) */
  maxDrawdown: number;
  maxDrawdownHands: number;
  /** Longest breakeven stretch (hands below peak before recovery) */
  longestBreakevenHands: number;
  longestBreakevenDays: number;
  /** Top 3 longest breakeven stretches (by hands) */
  topBreakevenStretches: { hands: number; days: number }[];
  /** Current breakeven stretch (when below peak), null if not in one */
  currentBreakevenStretch: { hands: number; days: number } | null;
  /** Top 3 biggest downswings (by dollar amount) */
  topDownswings: { amount: number; hands: number }[];
  /** Top 3 biggest upswings (by dollar amount) */
  topUpswings: { amount: number; hands: number }[];
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
  /** Hands in current downswing (0 if not in downswing) */
  currentDownswingHands: number;
  /** Best day of week by $/hr */
  bestDay: string | null;
  bestDayProfitPerHour: number;
  bestDayTotal: number;
  /** Worst day of week by $/hr */
  worstDay: string | null;
  worstDayProfitPerHour: number;
  worstDayTotal: number;
  /** By session duration (<4hr vs >=4hr) - legacy, use bySessionLengthBuckets */
  shortSessionProfitPerHour: number | null;
  shortSessionHours: number;
  longSessionProfitPerHour: number | null;
  longSessionHours: number;
  /** $/hr by session length bucket (<1, 1-2, 2-3, etc.) - only sessions with startTime and endTime */
  bySessionLengthBuckets: {
    label: string;
    hoursMin: number;
    hoursMax: number;
    hours: number;
    profit: number;
    hands: number;
    sessionCount: number;
    profitPerHour: number;
  }[];
  /** Results by A/B/C/D/F game rating */
  byRating: {
    label: string;
    rating: SessionRating;
    hours: number;
    profit: number;
    hands: number;
    sessionCount: number;
    profitPerHour: number;
    profitPerHand: number;
  }[];
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
    sessionCount: number;
    winRatePercentage: number;
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
  /** Avg net per calendar day (days with sessions) */
  avgDayNet: number;
  /** Avg net per calendar month (months with sessions) */
  avgMonthNet: number;
}

/** Morning 4am-noon, Afternoon noon-8pm, Night 8pm-4am, Unspecified (no start time) */
const TIME_BUCKET_LABELS: Record<number, string> = {
  0: 'Morning',
  1: 'Afternoon',
  2: 'Night',
  3: 'Unspecified',
};

/** Get bucket key (0=Morning, 1=Afternoon, 2=Night) for an hour (0-23). */
function getTimeBucketForHour(hour: number): number {
  if (hour >= 4 && hour < 12) return 0;
  if (hour >= 12 && hour < 20) return 1;
  return 2; // Night: 20-23 or 0-3
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function filterSessionsByRange(sessions: SessionResult[], range: InsightsDateRange): SessionResult[] {
  if (range === 'all') return sessions;
  const now = new Date();
  if (typeof range === 'object' && 'start' in range && 'end' in range) {
    const start = range.start;
    const end = range.end;
    return sessions.filter((s) => {
      const sDate = s.date.slice(0, 10);
      return sDate >= start && sDate <= end;
    });
  }
  if (range === 'today') {
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return sessions.filter((s) => {
      const d = new Date(s.date);
      const sStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return sStr === todayStr;
    });
  }
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
  const sessionNets = getSessionNetsMap(sessions);
  const filtered = filterSessionsByRange(sessions, range);
  const sorted = [...filtered].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const net = (s: SessionResult) => sessionNets.get(s._id) ?? (s.dailyNet ?? 0);

  const runningTotal: { cumulativeNet: number; cumulativeHands: number; date: string }[] = [];
  let cumulativeNet = 0;
  let cumulativeHands = 0;
  let totalHours = 0;
  let peak = 0;

  let inStretch = false;
  let stretchStartCumHands = 0;
  let stretchStartDate: Date | null = null;
  let longestStretchHands = 0;
  let longestStretchDays = 0;
  const allBreakevenStretches: { hands: number; days: number }[] = [];

  let inDownswing = false;
  let downswingPeak = 0;
  let downswingValley = 0;
  let downswingHands = 0;
  let valleyCumHands = 0;
  let biggestDownswingAmount = 0;
  let biggestDownswingHands = 0;
  let biggestUpswingAmount = 0;
  let biggestUpswingHands = 0;
  const allDownswings: { amount: number; hands: number }[] = [];
  const allUpswings: { amount: number; hands: number }[] = [];

  let maxWinStreak = 0;
  let maxLoseStreak = 0;
  let currentWin = 0;
  let currentLose = 0;
  let maxWinStreakEndIdx = -1;
  let winningSessions = 0;

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    const sessionNet = net(s);
    const hands = s.hands ?? 0;
    const hours = s.totalTime ?? 0;
    const date = new Date(s.date);
    cumulativeNet += sessionNet;
    cumulativeHands += hands;
    totalHours += hours;
    runningTotal.push({
      cumulativeNet,
      cumulativeHands,
      date: s.date,
    });

    if (sessionNet > 0) {
      currentWin++;
      currentLose = 0;
      if (currentWin > maxWinStreak) {
        maxWinStreak = currentWin;
        maxWinStreakEndIdx = i;
      }
      winningSessions++;
    } else if (sessionNet < 0) {
      currentLose++;
      currentWin = 0;
      maxLoseStreak = Math.max(maxLoseStreak, currentLose);
    } else {
      currentWin = 0;
      currentLose = 0;
    }

    if (cumulativeNet > peak) {
      peak = cumulativeNet;
      if (inStretch) {
        const stretchHands = cumulativeHands - stretchStartCumHands;
        const stretchDays = stretchStartDate
          ? Math.ceil((date.getTime() - stretchStartDate.getTime()) / (24 * 60 * 60 * 1000))
          : 0;
        if (stretchHands > longestStretchHands || stretchDays > longestStretchDays) {
          longestStretchHands = stretchHands;
          longestStretchDays = stretchDays;
        }
        allBreakevenStretches.push({ hands: stretchHands, days: stretchDays });
        inStretch = false;
      }
      if (inDownswing) {
        const drop = downswingPeak - downswingValley;
        if (drop > biggestDownswingAmount) {
          biggestDownswingAmount = drop;
          biggestDownswingHands = downswingHands;
        }
        allDownswings.push({ amount: drop, hands: downswingHands });
        const rise = cumulativeNet - downswingValley;
        const upswingHands = cumulativeHands - valleyCumHands;
        if (rise > biggestUpswingAmount) {
          biggestUpswingAmount = rise;
          biggestUpswingHands = upswingHands;
        }
        allUpswings.push({ amount: rise, hands: upswingHands });
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

  let currentBreakevenStretch: { hands: number; days: number } | null = null;
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
    allBreakevenStretches.push({ hands: stretchHands, days: stretchDays });
    currentBreakevenStretch = { hands: stretchHands, days: stretchDays };
  }
  if (inDownswing) {
    const drop = downswingPeak - downswingValley;
    if (drop > biggestDownswingAmount) {
      biggestDownswingAmount = drop;
      biggestDownswingHands = downswingHands;
    }
    allDownswings.push({ amount: drop, hands: downswingHands });
    const rise = cumulativeNet - downswingValley;
    const upswingHands = cumulativeHands - valleyCumHands;
    allUpswings.push({ amount: rise, hands: upswingHands });
  }

  const topBreakevenStretches = [...allBreakevenStretches]
    .sort((a, b) => b.hands - a.hands)
    .slice(0, 3);
  const topDownswings = [...allDownswings]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);
  const topUpswings = [...allUpswings]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

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
    const sessionNetVal = net(s);
    if (sessionNetVal > 0 && (bestSingleSessionNet === null || sessionNetVal > bestSingleSessionNet)) {
      bestSingleSessionNet = sessionNetVal;
      bestSingleSessionDate = s.date;
    }
    if (sessionNetVal < 0 && (worstSingleSessionNet === null || sessionNetVal < worstSingleSessionNet)) {
      worstSingleSessionNet = sessionNetVal;
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
    const profit = net(s);
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

  // Avg net per calendar day and per month
  const byDate = new Map<string, number>();
  const byMonth = new Map<string, number>();
  for (const s of sorted) {
    const d = new Date(s.date);
    const dateKey = d.toISOString().slice(0, 10);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    byDate.set(dateKey, (byDate.get(dateKey) ?? 0) + net(s));
    byMonth.set(monthKey, (byMonth.get(monthKey) ?? 0) + net(s));
  }
  const dayCount = byDate.size;
  const monthCount = byMonth.size;
  const avgDayNet = dayCount > 0 ? [...byDate.values()].reduce((a, b) => a + b, 0) / dayCount : 0;
  const avgMonthNet = monthCount > 0 ? [...byMonth.values()].reduce((a, b) => a + b, 0) / monthCount : 0;

  // Session duration buckets (<4hr vs >=4hr) - legacy
  const SHORT_THRESHOLD = 4;
  let shortHours = 0;
  let shortProfit = 0;
  let longHours = 0;
  let longProfit = 0;
  for (const s of sorted) {
    const hours = s.totalTime ?? 0;
    const profit = net(s);
    if (hours < SHORT_THRESHOLD) {
      shortHours += hours;
      shortProfit += profit;
    } else {
      longHours += hours;
      longProfit += profit;
    }
  }

  // Granular session length buckets (<1, 1-2, 2-3, etc.) - include all sessions with duration (totalTime or start/end)
  const getSessionHours = (s: SessionResult): number => {
    const total = s.totalTime ?? null;
    if (total != null && total > 0) return total;
    const start = s.startTime ? new Date(s.startTime).getTime() : NaN;
    const end = s.endTime ? new Date(s.endTime).getTime() : NaN;
    if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) {
      return (end - start) / (1000 * 60 * 60);
    }
    return 0;
  };
  const bucketMap = new Map<
    number,
    { hours: number; profit: number; hands: number; sessionCount: number }
  >();
  for (const s of sorted) {
    const h = getSessionHours(s);
    if (h <= 0) continue;
    const bucketIdx = h < 1 ? 0 : Math.floor(h);
    const existing = bucketMap.get(bucketIdx) ?? {
      hours: 0,
      profit: 0,
      hands: 0,
      sessionCount: 0,
    };
    bucketMap.set(bucketIdx, {
      hours: existing.hours + h,
      profit: existing.profit + net(s),
      hands: existing.hands + (s.hands ?? 0),
      sessionCount: existing.sessionCount + 1,
    });
  }
  const maxBucketIdx =
    bucketMap.size > 0 ? Math.max(...bucketMap.keys()) : 0;
  const bySessionLengthBuckets: PokerInsights['bySessionLengthBuckets'] = [];
  for (let i = 0; i <= maxBucketIdx; i++) {
    const data = bucketMap.get(i);
    if (!data) continue;
    const label =
      i === 0 ? '<1hr' : i === 1 ? '1-2hr' : `${i}-${i + 1}hr`;
    bySessionLengthBuckets.push({
      label,
      hoursMin: i === 0 ? 0 : i,
      hoursMax: i === 0 ? 1 : i + 1,
      hours: data.hours,
      profit: data.profit,
      hands: data.hands,
      sessionCount: data.sessionCount,
      profitPerHour: data.hours > 0 ? data.profit / data.hours : 0,
    });
  }

  // By rating (A, B, C, D, F game)
  const byRatingMap = new Map<
    SessionRating,
    { hours: number; profit: number; hands: number; sessionCount: number }
  >();
  for (const s of sorted) {
    const r = s.rating;
    if (!r || !SESSION_RATING_OPTIONS.includes(r)) continue;
    const hours = s.totalTime ?? 0;
    const existing = byRatingMap.get(r) ?? {
      hours: 0,
      profit: 0,
      hands: 0,
      sessionCount: 0,
    };
    byRatingMap.set(r, {
      hours: existing.hours + hours,
      profit: existing.profit + net(s),
      hands: existing.hands + (s.hands ?? 0),
      sessionCount: existing.sessionCount + 1,
    });
  }
  const byRating: PokerInsights['byRating'] = SESSION_RATING_OPTIONS.filter(
    (r) => byRatingMap.has(r)
  ).map((r) => {
    const data = byRatingMap.get(r)!;
    return {
      label: `${r} game`,
      rating: r,
      hours: data.hours,
      profit: data.profit,
      hands: data.hands,
      sessionCount: data.sessionCount,
      profitPerHour: data.hours > 0 ? data.profit / data.hours : 0,
      profitPerHand: data.hands > 0 ? data.profit / data.hands : 0,
    };
  });

  // Time of day: use midpoint when start+end exist, else start time; Unspecified for full-day sessions without start
  const UNSPECIFIED_BUCKET = 3;
  const byTimeBucket = new Map<
    number,
    { hours: number; profit: number; hands: number; sessionCount: number; winningSessions: number }
  >();
  for (const s of sorted) {
    const startDate = s.startTime ? new Date(s.startTime) : null;
    let bucketKey: number;
    if (!startDate || Number.isNaN(startDate.getTime())) {
      bucketKey = UNSPECIFIED_BUCKET; // Full-day sessions without start/stop
    } else {
      let hour: number;
      if (s.endTime) {
        const endDate = new Date(s.endTime);
        if (!Number.isNaN(endDate.getTime())) {
          const midMs = (startDate.getTime() + endDate.getTime()) / 2;
          hour = new Date(midMs).getHours();
        } else {
          hour = startDate.getHours();
        }
      } else {
        hour = startDate.getHours();
      }
      bucketKey = getTimeBucketForHour(hour);
    }
    const sessionHours = s.totalTime ?? 0;
    const profit = net(s);
    const hands = s.hands ?? 0;
    const existing = byTimeBucket.get(bucketKey) ?? {
      hours: 0,
      profit: 0,
      hands: 0,
      sessionCount: 0,
      winningSessions: 0,
    };
    byTimeBucket.set(bucketKey, {
      hours: existing.hours + sessionHours,
      profit: existing.profit + profit,
      hands: existing.hands + hands,
      sessionCount: existing.sessionCount + 1,
      winningSessions: existing.winningSessions + (profit > 0 ? 1 : 0),
    });
  }
  const byTimeOfDay = [0, 1, 2, UNSPECIFIED_BUCKET].map((key) => {
    const data = byTimeBucket.get(key) ?? {
      hours: 0,
      profit: 0,
      hands: 0,
      sessionCount: 0,
      winningSessions: 0,
    };
    const profitPerHand = data.hands > 0 ? data.profit / data.hands : 0;
    const profitPerHour = data.hours > 0 ? data.profit / data.hours : 0;
    const handsPerHour = data.hours > 0 ? data.hands / data.hours : 0;
    const winRatePercentage =
      data.sessionCount > 0 ? (data.winningSessions / data.sessionCount) * 100 : 0;
    return {
      label: TIME_BUCKET_LABELS[key],
      profitPerHand,
      profitPerHour,
      hours: data.hours,
      hands: data.hands,
      handsPerHour,
      sessionCount: data.sessionCount,
      winRatePercentage,
    };
  }).filter((r) => r.sessionCount > 0 || r.hours > 0);
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
    topBreakevenStretches,
    currentBreakevenStretch,
    topDownswings,
    topUpswings,
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
    currentDownswingHands: inDownswing ? downswingHands : 0,
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
    bySessionLengthBuckets,
    byRating,
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
    avgDayNet,
    avgMonthNet,
  };
}
