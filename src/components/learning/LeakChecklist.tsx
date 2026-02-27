import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { useCompactMode } from '../../context/CompactModeContext';
import { LEAK_PRESETS } from '../../constants/leakPresets';
import { LEAK_CATEGORY_LABELS } from '../../constants/learningColors';
import type { LeakPreset } from '../../constants/leakPresets';

interface LeakChecklistProps {
  completed: Set<string>;
  onToggle: (title: string) => void;
}

function groupByCategory(presets: LeakPreset[]): Map<string, LeakPreset[]> {
  const map = new Map<string, LeakPreset[]>();
  for (const p of presets) {
    const label = LEAK_CATEGORY_LABELS[p.category] ?? p.category;
    const list = map.get(label) ?? [];
    list.push(p);
    map.set(label, list);
  }
  return map;
}

export function LeakChecklist({ completed, onToggle }: LeakChecklistProps) {
  const compact = useCompactMode();
  const grouped = groupByCategory(LEAK_PRESETS);

  return (
    <Box
      sx={{
        mb: compact ? 1.5 : 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          display: 'block',
          px: compact ? 1 : 1.5,
          py: compact ? 0.5 : 0.75,
          fontWeight: 600,
          bgcolor: 'action.hover',
        }}
      >
        Leak checklist — click to mark as not a leak for you
      </Typography>
      <List dense disablePadding sx={{ maxHeight: 320, overflowY: 'auto' }}>
        {Array.from(grouped.entries()).map(([categoryLabel, items]) => (
          <Box key={categoryLabel}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: 'block',
                px: compact ? 1 : 1.5,
                pt: compact ? 0.5 : 0.75,
                fontWeight: 600,
              }}
            >
              {categoryLabel}
            </Typography>
            {items.map((preset) => {
              const isCompleted = completed.has(preset.title);
              return (
                <ListItemButton
                  key={preset.title}
                  onClick={() => onToggle(preset.title)}
                  sx={{
                    py: compact ? 0.25 : 0.5,
                    minHeight: compact ? 32 : 40,
                  }}
                  dense
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {isCompleted ? (
                      <CheckBoxIcon color="success" fontSize="small" />
                    ) : (
                      <CheckBoxOutlineBlankIcon fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={preset.title}
                    primaryTypographyProps={{
                      variant: compact ? 'caption' : 'body2',
                      sx: isCompleted
                        ? {
                            textDecoration: 'line-through',
                            color: 'text.secondary',
                          }
                        : undefined,
                    }}
                  />
                </ListItemButton>
              );
            })}
          </Box>
        ))}
      </List>
    </Box>
  );
}
