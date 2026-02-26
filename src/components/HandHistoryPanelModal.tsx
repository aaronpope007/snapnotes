import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { HandHistoryFormContent } from './HandHistoryFormContent';

interface HandHistoryPanelModalProps {
  open: boolean;
  mode: 'add' | 'edit';
  title: string;
  content: string;
  spoiler: string;
  onClose: () => void;
  onTitleChange: (v: string) => void;
  onContentChange: (v: string) => void;
  onSpoilerChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
}

export function HandHistoryPanelModal({
  open,
  mode,
  title,
  content,
  spoiler,
  onClose,
  onTitleChange,
  onContentChange,
  onSpoilerChange,
  onSave,
  saving,
}: HandHistoryPanelModalProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
          <Typography component="span" variant="h6">
            {mode === 'add' ? 'Add hand history' : 'Edit hand history'}
          </Typography>
          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
            — click a card to insert at cursor
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <HandHistoryFormContent
          title={title}
          onTitleChange={onTitleChange}
          content={content}
          onContentChange={onContentChange}
          spoilerValue={spoiler}
          onSpoilerChange={onSpoilerChange}
          contentLabel="Content"
          placeholder="Paste hand history… Click a card on the right to insert at cursor"
          cardSize="xs"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={saving}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
