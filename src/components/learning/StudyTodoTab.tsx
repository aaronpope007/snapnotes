import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import BugReportIcon from '@mui/icons-material/BugReport';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';
import { useCompactMode } from '../../context/CompactModeContext';
import type { StudyTodo } from '../../types/learning';

interface StudyTodoTabProps {
  todos: StudyTodo[];
  loading: boolean;
  onAdd: (text: string) => Promise<void>;
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
  /** When user wants to promote a completed task to a leak; opens Leaks tab with add modal pre-filled */
  onAddToLeaks?: (text: string) => void;
}

export function StudyTodoTab({
  todos,
  loading,
  onAdd,
  onToggle,
  onDelete,
  onAddToLeaks,
}: StudyTodoTabProps) {
  const compact = useCompactMode();
  const [newText, setNewText] = useState('');
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');

  const handleAdd = async () => {
    const text = newText.trim();
    if (!text) return;
    setAdding(true);
    try {
      await onAdd(text);
      setNewText('');
    } finally {
      setAdding(false);
    }
  };

  const searchLower = search.trim().toLowerCase();
  const matches = (t: StudyTodo) =>
    !searchLower || t.text.toLowerCase().includes(searchLower);

  const active = todos.filter((t) => !t.done).filter(matches);
  const done = todos.filter((t) => t.done).filter(matches);

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          gap: 0.5,
          alignItems: 'flex-start',
          mb: compact ? 1 : 1.5,
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="e.g. Study 3-bet pots OOP"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleAdd();
          }}
          disabled={adding}
          inputProps={{ autoComplete: 'off' }}
        />
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => void handleAdd()}
          disabled={!newText.trim() || adding}
          sx={{ flexShrink: 0 }}
        >
          Add
        </Button>
      </Box>

      {todos.length > 0 && (
        <TextField
          fullWidth
          size="small"
          placeholder="Search tasks (e.g. 3bet, OOP)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: compact ? 1 : 1.5 }}
          inputProps={{ autoComplete: 'off' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  edge="end"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          }}
        />
      )}

      {loading ? (
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      ) : todos.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No study tasks yet. Add something you want to work on—tick it off when done. For bigger
          issues, use the Leaks tab.
        </Typography>
      ) : searchLower && active.length === 0 && done.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No tasks match &quot;{search.trim()}&quot;.
        </Typography>
      ) : (
        <List disablePadding>
          {active.map((todo) => (
            <ListItem
              key={todo._id}
              disablePadding
              secondaryAction={
                <IconButton
                  size="small"
                  edge="end"
                  onClick={() => onDelete(todo._id)}
                  aria-label="Delete"
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemButton
                dense={compact}
                onClick={() => onToggle(todo._id, !todo.done)}
                sx={{ pr: 5 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Checkbox
                    edge="start"
                    checked={false}
                    tabIndex={-1}
                    disableRipple
                    size="small"
                  />
                </ListItemIcon>
                <ListItemText
                  primary={todo.text}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItemButton>
            </ListItem>
          ))}
          {done.length > 0 && (
            <>
              {active.length > 0 && (
                <Box sx={{ borderTop: 1, borderColor: 'divider', my: 0.5 }} />
              )}
              {done.map((todo) => (
                <ListItem
                  key={todo._id}
                  disablePadding
                  secondaryAction={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                      {onAddToLeaks && (
                        <Tooltip title="Add to Leaks">
                          <IconButton
                            size="small"
                            onClick={() => onAddToLeaks(todo.text)}
                            aria-label="Add to Leaks"
                          >
                            <BugReportIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <IconButton
                        size="small"
                        edge="end"
                        onClick={() => onDelete(todo._id)}
                        aria-label="Delete"
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemButton
                    dense={compact}
                    onClick={() => onToggle(todo._id, false)}
                    sx={{ pr: onAddToLeaks ? 8 : 5 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Checkbox
                        edge="start"
                        checked
                        tabIndex={-1}
                        disableRipple
                        size="small"
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={todo.text}
                      primaryTypographyProps={{
                        variant: 'body2',
                        sx: { textDecoration: 'line-through', color: 'text.secondary' },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </>
          )}
        </List>
      )}
    </Box>
  );
}
