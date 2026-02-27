import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Collapse from '@mui/material/Collapse';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import { useCompactMode } from '../../context/CompactModeContext';
import { getLeakStatusColor, LEAK_CATEGORY_LABELS } from '../../constants/learningColors';
import type { Leak } from '../../types/learning';

interface LeakCardProps {
  leak: Leak;
  expanded: boolean;
  onToggleExpand: (id: string) => void;
  onStatusCycle: (leak: Leak) => void;
  onEdit: (leak: Leak) => void;
  onDelete: (id: string) => void;
  onLinkClick?: (leak: Leak) => void;
}

export function LeakCard({
  leak,
  expanded,
  onToggleExpand,
  onStatusCycle,
  onEdit,
  onDelete,
  onLinkClick,
}: LeakCardProps) {
  const compact = useCompactMode();
  const [notesExpanded, setNotesExpanded] = useState(false);
  const statusColor = getLeakStatusColor(leak.status);
  const categoryLabel = LEAK_CATEGORY_LABELS[leak.category] ?? leak.category;
  const linkedCount = leak.linkedHandIds?.length ?? 0;

  return (
    <Paper
      variant="outlined"
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <Box
        component="button"
        onClick={() => onToggleExpand(leak._id)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: compact ? 0.25 : 0.5,
          width: '100%',
          p: compact ? 0.375 : 1,
          minHeight: compact ? 28 : undefined,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          bgcolor: expanded ? 'action.selected' : 'transparent',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <IconButton size="small" sx={{ p: 0 }}>
          {expanded ? (
            <ExpandLessIcon fontSize="small" />
          ) : (
            <ExpandMoreIcon fontSize="small" />
          )}
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant={compact ? 'caption' : 'body2'}
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: 500,
              color: 'text.primary',
            }}
          >
            {leak.title || 'Untitled leak'}
          </Typography>
        </Box>
        <Box
          component="span"
          onClick={(e) => {
            e.stopPropagation();
            onStatusCycle(leak);
          }}
          sx={{
            px: 0.75,
            py: 0.25,
            borderRadius: 0.5,
            fontSize: '0.7rem',
            bgcolor: statusColor,
            color: 'rgba(0,0,0,0.7)',
            cursor: 'pointer',
            textTransform: 'capitalize',
          }}
          title="Click to cycle status"
        >
          {leak.status}
        </Box>
        <Box
          component="span"
          sx={{
            px: 0.75,
            py: 0.25,
            borderRadius: 0.5,
            fontSize: '0.7rem',
            bgcolor: 'action.selected',
            color: 'text.secondary',
          }}
        >
          {categoryLabel}
        </Box>
        {linkedCount > 0 && (
          <Typography
            variant="caption"
            color="text.secondary"
            component="span"
            onClick={(e) => {
              e.stopPropagation();
              onLinkClick?.(leak);
            }}
            sx={{ cursor: onLinkClick ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 0.25 }}
            title={`${linkedCount} hand${linkedCount !== 1 ? 's' : ''} linked`}
          >
            <LinkIcon sx={{ fontSize: 12 }} />
            {linkedCount}
          </Typography>
        )}
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(leak);
          }}
          sx={{ p: 0.25 }}
          aria-label="Edit"
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(leak._id);
          }}
          sx={{ p: 0.25 }}
          aria-label="Delete"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box
          sx={{
            p: compact ? 0.75 : 1.5,
            pt: 0,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.default',
          }}
        >
          {leak.description && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: 'block',
                mb: compact ? 0.5 : 1,
                whiteSpace: 'pre-wrap',
              }}
            >
              {leak.description}
            </Typography>
          )}
          {(leak.notes?.length ?? 0) > 0 && (
            <Box sx={{ mb: compact ? 0.5 : 1 }}>
              <Box
                component="button"
                onClick={() => setNotesExpanded((p) => !p)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  p: 0,
                  color: 'text.secondary',
                  '&:hover': { color: 'text.primary' },
                }}
              >
                {notesExpanded ? (
                  <ExpandLessIcon sx={{ fontSize: 14 }} />
                ) : (
                  <ExpandMoreIcon sx={{ fontSize: 14 }} />
                )}
                <Typography variant="caption">
                  {leak.notes!.length} note{leak.notes!.length !== 1 ? 's' : ''}
                </Typography>
              </Box>
              <Collapse in={notesExpanded}>
                <Box
                  sx={{
                    mt: 0.5,
                    pl: 1,
                    borderLeft: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  {leak.notes!.map((n) => (
                    <Typography
                      key={n._id}
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', py: 0.25, whiteSpace: 'pre-wrap' }}
                    >
                      {n.content}
                    </Typography>
                  ))}
                </Box>
              </Collapse>
            </Box>
          )}
          <Typography variant="caption" color="text.secondary">
            {leak.resolvedAt
              ? `Resolved ${new Date(leak.resolvedAt).toLocaleDateString()}`
              : `Added ${new Date(leak.createdAt).toLocaleDateString()}`}
          </Typography>
        </Box>
      </Collapse>
    </Paper>
  );
}
