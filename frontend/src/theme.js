import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0F4C5C' },
    secondary: { main: '#E36414' },
    background: { default: '#F7F9FA' },
    error: { main: '#C1121F' },
    warning: { main: '#E9C46A' },
    success: { main: '#2A9D8F' },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
});

export default theme;
