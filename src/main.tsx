import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './theme';
import { UserNameProvider } from './context/UserNameContext';
import { CompactModeProvider } from './context/CompactModeContext';
import { HorizontalModeProvider } from './context/HorizontalModeContext';
import { CalculatorVisibilityProvider } from './context/CalculatorVisibilityContext';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <UserNameProvider>
        <CompactModeProvider>
          <HorizontalModeProvider>
            <CalculatorVisibilityProvider>
              <App />
            </CalculatorVisibilityProvider>
          </HorizontalModeProvider>
        </CompactModeProvider>
      </UserNameProvider>
    </ThemeProvider>
  </StrictMode>,
);
