import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import TodayIcon from '@mui/icons-material/Today';
import type { GtoTierProgressRow } from '../../types/gtoTierProgress';
import { pickDrillToday, resolveDrillTier } from '../../utils/gtoTierProgress';
import { formatAccuracyAcc } from '../../utils/gtoStudyUtils';
import type { GtoStudyTier } from '../../types/gtoStudy';

const drillNameLinkSx = {
  cursor: 'pointer',
  textDecoration: 'none',
  color: 'text.primary',
  '&:hover': { textDecoration: 'underline' },
  display: 'block',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  textAlign: 'left' as const,
};

interface DrillTodayCardProps {
  rows: GtoTierProgressRow[];
  loading?: boolean;
  onLogResult: (drillId: string) => void;
}

function tierChip(tier: GtoStudyTier | null) {
  if (tier == null) return null;
  return (
    <Chip
      size="small"
      label={`T${tier}`}
      variant="outlined"
      sx={{ height: 18, fontSize: '0.65rem' }}
    />
  );
}

export function DrillTodayCard({ rows, loading, onLogResult }: DrillTodayCardProps) {
  const recommended = useMemo(() => pickDrillToday(rows, 3), [rows]);

  if (loading && rows.length === 0) {
    return (
      <Card variant="outlined" sx={{ mb: 1.5 }}>
        <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
          <Typography variant="body2" color="text.secondary">
            Loading recommendations…
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (recommended.length === 0) return null;

  return (
    <Card variant="outlined" sx={{ mb: 1.5 }}>
      <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
          <TodayIcon fontSize="small" color="primary" />
          <Typography variant="subtitle2">Drill Today</Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {recommended.map((row) => {
            const tier = resolveDrillTier(row.tier, row.name);
            const accLabel =
              row.timesLogged === 0
                ? 'Not started'
                : formatAccuracyAcc(row.latestAccuracy ?? undefined);
            return (
              <Box
                key={row.drillId}
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => onLogResult(row.drillId)}
                  title={row.name}
                  sx={{ ...drillNameLinkSx, flex: 1, minWidth: 120 }}
                >
                  {row.name}
                </Link>
                {tierChip(tier)}
                <Chip
                  size="small"
                  label={row.stack}
                  variant="outlined"
                  sx={{ height: 18, fontSize: '0.65rem' }}
                />
                <Typography variant="caption" color="text.secondary">
                  {accLabel}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}
