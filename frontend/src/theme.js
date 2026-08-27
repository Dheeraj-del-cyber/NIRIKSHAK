import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0F4C5C' },
    secondary: { main: '#E36414' },
    background: { default: '#F4F7F8', paper: '#FFFFFF' },
    error: { main: '#C1121F' },
    warning: { main: '#E9A400' },
    success: { main: '#2A9D8F' },
    info: { main: '#3A86FF' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(15, 76, 92, 0.12)',
          boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
          transition: 'box-shadow 0.15s ease',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 700, color: 'rgba(15, 23, 42, 0.7)' },
      },
    },
  },
});

export default theme;