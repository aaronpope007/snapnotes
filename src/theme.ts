import { createTheme, type Theme } from '@mui/material/styles';

export function createAppTheme(darkMode: boolean): Theme {
  const mode = darkMode ? 'dark' : 'light';
  return createTheme({
    palette: {
      mode,
      primary: { main: '#90caf9' },
      secondary: { main: '#ce93d8' },
      ...(darkMode
        ? {
            background: {
              default: '#0d1117',
              paper: '#161b22',
            },
          }
        : {}),
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { minHeight: '100vh' },
        },
      },
      ...(darkMode
        ? {
            MuiMenu: {
              styleOverrides: {
                paper: {
                  backgroundColor: '#161b22',
                },
              },
            },
            MuiMenuItem: {
              styleOverrides: {
                root: {
                  color: 'rgba(255, 255, 255, 0.87)',
                },
              },
            },
            MuiListItemButton: {
              styleOverrides: {
                root: {
                  color: 'rgba(255, 255, 255, 0.87)',
                },
              },
            },
          }
        : {}),
    },
  });
}

export const theme = createAppTheme(true);
