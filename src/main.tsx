import { StrictMode, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { createAppTheme } from './theme';
import { DarkModeProvider, useDarkMode } from './context/DarkModeContext';
import { UserNameProvider } from './context/UserNameContext';
import { CompactModeProvider } from './context/CompactModeContext';
import { HorizontalModeProvider } from './context/HorizontalModeContext';
import { CalculatorVisibilityProvider } from './context/CalculatorVisibilityContext';
import { LearningVisibilityProvider } from './context/LearningVisibilityContext';
import App from './App.tsx';
import './index.css';

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const darkMode = useDarkMode();
  const theme = useMemo(() => createAppTheme(darkMode), [darkMode]);
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DarkModeProvider>
      <ThemeWrapper>
        <CssBaseline />
        <UserNameProvider>
        <CompactModeProvider>
          <HorizontalModeProvider>
            <CalculatorVisibilityProvider>
              <LearningVisibilityProvider>
                <App />
              </LearningVisibilityProvider>
            </CalculatorVisibilityProvider>
          </HorizontalModeProvider>
        </CompactModeProvider>
      </UserNameProvider>
      </ThemeWrapper>
    </DarkModeProvider>
  </StrictMode>,
);
