import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import { STAKE_VALUES, GAME_TYPE_OPTIONS, FORMAT_OPTIONS, ORIGIN_OPTIONS } from '../types';

interface StakesSectionProps {
  gameTypes: string[];
  stakesSeenAt: number[];
  formats: string[];
  origin: string;
  onUpdateGameTypes: (gameTypes: string[]) => Promise<void>;
  onUpdateStakes: (stakesSeenAt: number[]) => Promise<void>;
  onUpdateFormats: (formats: string[]) => Promise<void>;
  onUpdateOrigin: (origin: string) => Promise<void>;
  saving?: boolean;
  inline?: boolean;
}

export function StakesSection({
  gameTypes,
  stakesSeenAt,
  formats,
  origin,
  onUpdateGameTypes,
  onUpdateStakes,
  onUpdateFormats,
  onUpdateOrigin,
  saving = false,
  inline = false,
}: StakesSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const handleGameTypeToggle = async (gameType: string) => {
    const current = gameTypes || [];
    const next = current.includes(gameType)
      ? current.filter((g) => g !== gameType)
      : [...current, gameType];
    await onUpdateGameTypes(next);
  };

  const handleStakeToggle = async (stake: number) => {
    const current = stakesSeenAt || [];
    const next = current.includes(stake)
      ? current.filter((s) => s !== stake)
      : [...current, stake].sort((a, b) => a - b);
    await onUpdateStakes(next);
  };

  const handleFormatToggle = async (format: string) => {
    const current = formats || [];
    const next = current.includes(format)
      ? current.filter((f) => f !== format)
      : [...current, format];
    await onUpdateFormats(next);
  };

  const handleOriginChange = async (value: string) => {
    await onUpdateOrigin(value);
  };

  const gameTypesSummary = (gameTypes?.length ?? 0) > 0 ? gameTypes.join(', ') : 'None';
  const stakesSummary = (stakesSeenAt?.length ?? 0) > 0 ? stakesSeenAt.join(', ') : 'None';
  const formatsSummary = (formats?.length ?? 0) > 0 ? formats.join(', ') : 'None';
  const summary = [gameTypesSummary, stakesSummary, formatsSummary, origin || 'WPT Gold'].join(' · ');

  return (
    <Box sx={{ mb: inline ? 0 : 2 }}>
      <Box
        component="button"
        onClick={() => setExpanded((e) => !e)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          p: 0,
          mb: inline ? 0 : 0.5,
          textAlign: 'left',
          width: inline ? 'auto' : '100%',
        }}
      >
        {!inline && (
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          Games, format & stakes
        </Typography>
        )}
        <IconButton size="small" sx={{ p: 0, ml: -0.5 }}>
          {expanded ? (
            <ExpandLessIcon fontSize="small" />
          ) : (
            <ExpandMoreIcon fontSize="small" />
          )}
        </IconButton>
        {inline && (
          <Typography variant="caption" color="text.secondary" component="span">
            {summary}
          </Typography>
        )}
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ pl: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Games
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
            {GAME_TYPE_OPTIONS.map((g) => (
              <FormControlLabel
                key={g}
                control={
                  <Checkbox
                    size="small"
                    checked={(gameTypes || []).includes(g)}
                    onChange={() => handleGameTypeToggle(g)}
                    disabled={saving}
                  />
                }
                label={g}
              />
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Format
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
            {FORMAT_OPTIONS.map((f) => (
              <FormControlLabel
                key={f}
                control={
                  <Checkbox
                    size="small"
                    checked={(formats || []).includes(f)}
                    onChange={() => handleFormatToggle(f)}
                    disabled={saving}
                  />
                }
                label={f}
              />
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Stakes seen at
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
            {STAKE_VALUES.map((s) => (
              <FormControlLabel
                key={s}
                control={
                  <Checkbox
                    size="small"
                    checked={(stakesSeenAt || []).includes(s)}
                    onChange={() => handleStakeToggle(s)}
                    disabled={saving}
                  />
                }
                label={s}
              />
            ))}
          </Box>
          <FormControl fullWidth size="small">
            <InputLabel>Site</InputLabel>
            <Select
              value={origin || 'WPT Gold'}
              label="Site"
              onChange={(e) => handleOriginChange(e.target.value)}
              disabled={saving}
            >
              {ORIGIN_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Collapse>
      {!expanded && !inline && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: -0.5 }}>
          {summary}
        </Typography>
      )}
    </Box>
  );
}
