import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
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
import type { MentalGameEntry } from '../../types/learning';

interface MentalGameChartProps {
  entries: MentalGameEntry[];
  maxEntries?: number;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'OK',
  4: 'Good',
  5: 'Excellent',
};

export function MentalGameChart({ entries, maxEntries = 30 }: MentalGameChartProps) {
  const compact = useCompactMode();
  const data = [...entries]
    .slice(0, maxEntries)
    .reverse()
    .map((e) => ({
      date: new Date(e.sessionDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
      rating: e.stateRating,
      fullDate: new Date(e.sessionDate).toLocaleDateString(),
    }));

  if (data.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', py: 1 }}>
        Add entries to see your mental game trend.
      </Typography>
    );
  }

  return (
    <Box sx={{ width: '100%', height: compact ? 80 : 120, mb: compact ? 1 : 1.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        State rating (last {Math.min(entries.length, maxEntries)} sessions)
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            stroke="text.secondary"
          />
          <YAxis
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tick={{ fontSize: 10 }}
            stroke="text.secondary"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload?.[0]) {
                const p = payload[0].payload;
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
                      {p.fullDate}: {RATING_LABELS[p.rating] ?? p.rating}/5
                    </Typography>
                  </Box>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="rating"
            stroke="#90caf9"
            strokeWidth={2}
            dot={{ r: 3 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
