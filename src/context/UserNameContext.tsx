import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import Dialog from '@mui/material/Dialog';
import { registerReviewer } from '../api/reviewers';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

const STORAGE_KEY = 'snapnotes_user_name';

interface UserNameContextValue {
  userName: string | null;
  setUserName: (name: string) => void;
}

const UserNameContext = createContext<UserNameContextValue | null>(null);

export function useUserName(): string | null {
  const ctx = useContext(UserNameContext);
  return ctx?.userName ?? null;
}

export function useSetUserName(): (name: string) => void {
  const ctx = useContext(UserNameContext);
  if (!ctx) throw new Error('UserNameProvider required');
  return ctx.setUserName;
}

interface UserNameProviderProps {
  children: ReactNode;
}

export function UserNameProvider({ children }: UserNameProviderProps) {
  const [userName, setUserNameState] = useState<string | null>(null);
  const [promptOpen, setPromptOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored?.trim()) {
      const trimmed = stored.trim();
      setUserNameState(trimmed);
      void registerReviewer(trimmed);
    } else {
      setPromptOpen(true);
    }
  }, []);

  const setUserName = useCallback((name: string) => {
    const trimmed = name.trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed);
      setUserNameState(trimmed);
      setPromptOpen(false);
      void registerReviewer(trimmed);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem('userName') as HTMLInputElement;
    if (input?.value?.trim()) {
      setUserName(input.value.trim());
    }
  };

  return (
    <UserNameContext.Provider value={{ userName, setUserName }}>
      {children}
      <Dialog open={promptOpen} disableEscapeKeyDown>
        <form onSubmit={handleSubmit}>
          <DialogTitle>What&apos;s your name?</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 1 }}>
              Enter your name so we can attribute notes you add or import.
            </DialogContentText>
            <TextField
              name="userName"
              autoFocus
              fullWidth
              label="Your name"
              placeholder="e.g. Aaron Pope"
            />
          </DialogContent>
          <DialogActions>
            <Button type="submit" variant="contained">
              Continue
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </UserNameContext.Provider>
  );
}
