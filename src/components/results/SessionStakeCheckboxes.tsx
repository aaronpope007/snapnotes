import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { RESULTS_STAKE_OPTIONS } from '../../types/results';
import { toggleSessionStake } from '../../utils/sessionUtils';

interface SessionStakeCheckboxesProps {
  value: number[];
  onChange: (stakes: number[]) => void;
}

export function SessionStakeCheckboxes({ value, onChange }: SessionStakeCheckboxesProps) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        Stakes
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.25 }}>
        {RESULTS_STAKE_OPTIONS.map((s) => (
          <FormControlLabel
            key={s}
            control={
              <Checkbox
                size="small"
                checked={value.includes(s)}
                onChange={() => onChange(toggleSessionStake(value, s))}
              />
            }
            label={s}
            sx={{ mr: 0.5 }}
          />
        ))}
      </Box>
    </Box>
  );
}
