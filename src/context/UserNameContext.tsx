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
import { basicAuthHeader } from '../api/me';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

const STORAGE_KEY_NAME = 'snapnotes_user_name';
const STORAGE_KEY_PASSWORD = 'snapnotes_user_password';

interface UserNameContextValue {
  userName: string | null;
  /** When set, the user has claimed this name (can use improvement notes, name is protected). */
  userPassword: string | null;
  isClaimedUser: boolean;
  setUserName: (name: string) => void;
  setCredentials: (name: string, password: string) => void;
  /** Returns Basic auth header for API calls when logged in as a claimed user. */
  getAuthHeader: () => string | null;
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

export function useUserCredentials(): {
  userName: string | null;
  userPassword: string | null;
  isClaimedUser: boolean;
  setCredentials: (name: string, password: string) => void;
  getAuthHeader: () => string | null;
} {
  const ctx = useContext(UserNameContext);
  if (!ctx) throw new Error('UserNameProvider required');
  return {
    userName: ctx.userName,
    userPassword: ctx.userPassword,
    isClaimedUser: ctx.isClaimedUser,
    setCredentials: ctx.setCredentials,
    getAuthHeader: ctx.getAuthHeader,
  };
}

interface UserNameProviderProps {
  children: ReactNode;
}

export function UserNameProvider({ children }: UserNameProviderProps) {
  const [userName, setUserNameState] = useState<string | null>(null);
  const [userPassword, setUserPasswordState] = useState<string | null>(null);
  const [promptOpen, setPromptOpen] = useState(false);

  useEffect(() => {
    const storedName = localStorage.getItem(STORAGE_KEY_NAME)?.trim() ?? '';
    const storedPassword = localStorage.getItem(STORAGE_KEY_PASSWORD);
    if (storedName) {
      setUserNameState(storedName);
      if (storedPassword) setUserPasswordState(storedPassword);
      void registerReviewer(storedName);
    } else {
      setPromptOpen(true);
    }
  }, []);

  const setUserName = useCallback((name: string) => {
    const trimmed = name.trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY_NAME, trimmed);
      setUserNameState(trimmed);
      setUserPasswordState(null);
      localStorage.removeItem(STORAGE_KEY_PASSWORD);
      setPromptOpen(false);
      void registerReviewer(trimmed);
    }
  }, []);

  const setCredentials = useCallback((name: string, password: string) => {
    const trimmed = name.trim();
    if (trimmed && password) {
      localStorage.setItem(STORAGE_KEY_NAME, trimmed);
      localStorage.setItem(STORAGE_KEY_PASSWORD, password);
      setUserNameState(trimmed);
      setUserPasswordState(password);
      setPromptOpen(false);
      void registerReviewer(trimmed);
    }
  }, []);

  const getAuthHeader = useCallback((): string | null => {
    if (userName && userPassword) return basicAuthHeader(userName, userPassword);
    return null;
  }, [userName, userPassword]);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const input = form.elements.namedItem('userName') as HTMLInputElement;
      if (input?.value?.trim()) setUserName(input.value.trim());
    },
    [setUserName]
  );

  const value: UserNameContextValue = {
    userName,
    userPassword,
    isClaimedUser: !!(userName && userPassword),
    setUserName,
    setCredentials,
    getAuthHeader,
  };

  return (
    <UserNameContext.Provider value={value}>
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
