import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { useCompactMode } from '../../context/CompactModeContext';
import { formatDrillSummary } from '../../constants/gtoStudy';
import { GtoDrillEvChart } from './GtoDrillEvChart';
import { GtoDrillResultRow } from './GtoDrillResultRow';
import { groupResultsByDate } from '../../utils/gtoStudyUtils';
import type { useGtoDrills, GtoDetailTab } from '../../hooks/useGtoDrills';
import type { GtoDrill } from '../../types/gtoStudy';

interface GtoDrillDetailViewProps {
  drill: GtoDrill;
  hook: ReturnType<typeof useGtoDrills>;
}

export function GtoDrillDetailView({ drill, hook }: GtoDrillDetailViewProps) {
  const compact = useCompactMode();
  const groups = groupResultsByDate(hook.detailResults);
  const tab = hook.detailTab;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
        <IconButton size="small" onClick={hook.closeDrillDetail} aria-label="Back to drills">
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
          {drill.name}
        </Typography>
        <IconButton
          size="small"
          onClick={() => hook.openEditDrill(drill)}
          aria-label="Edit drill"
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => hook.openCloneDrill(drill)}
          aria-label="Clone drill"
          title="Clone drill"
        >
          <ContentCopyIcon fontSize="small" />
        </IconButton>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        {formatDrillSummary(drill)}
      </Typography>

      {drill.description?.trim() && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ display: 'block', mb: 1, whiteSpace: 'pre-wrap' }}
        >
          {drill.description.trim()}
        </Typography>
      )}

      {drill.potType === 'Custom' && drill.customConfig && (
        <Box sx={{ mb: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
          {drill.customConfig.streetActions.map((row, i) => (
            <Typography key={i} variant="caption" sx={{ display: 'block' }}>
              <strong>{row.street}:</strong> {row.sizing || '—'}
            </Typography>
          ))}
          {drill.customConfig.notes && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {drill.customConfig.notes}
            </Typography>
          )}
        </Box>
      )}

      <ToggleButtonGroup
        value={tab}
        exclusive
        onChange={(_, v: GtoDetailTab | null) => v != null && hook.setDetailTab(v)}
        size="small"
        sx={{ mb: 1 }}
      >
        <ToggleButton value="chart" aria-label="Chart">
          <ShowChartIcon sx={{ fontSize: 16, mr: 0.5 }} />
          Chart
        </ToggleButton>
        <ToggleButton value="results" aria-label="Results list">
          <ListAltIcon sx={{ fontSize: 16, mr: 0.5 }} />
          Results
        </ToggleButton>
      </ToggleButtonGroup>

      {tab === 'chart' && (
        <>
          <GtoDrillEvChart results={hook.detailResults} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            <Button size="small" variant="outlined" onClick={() => hook.openLogResult(drill._id)}>
              Log Result
            </Button>
          </Box>
        </>
      )}

      {tab === 'results' && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            <Button size="small" variant="outlined" onClick={() => hook.openLogResult(drill._id)}>
              Log Result
            </Button>
          </Box>
          {hook.detailLoading ? (
            <Typography variant="body2" color="text.secondary">
              Loading results...
            </Typography>
          ) : hook.detailResults.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No results yet. Log your first attempt.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: compact ? 1 : 1.5 }}>
              {groups.map((group) => (
                <Box key={group.dateKey}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: 'block',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      mb: 0.5,
                      fontSize: '0.65rem',
                    }}
                  >
                    {group.header}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: compact ? 0.25 : 0.5 }}>
                    {group.results.map((result) => (
                      <GtoDrillResultRow
                        key={result._id}
                        result={result}
                        onEdit={(r) => hook.setEditResult({ drillId: drill._id, result: r })}
                        onDelete={(id) => hook.requestDeleteResult(drill._id, id)}
                      />
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
