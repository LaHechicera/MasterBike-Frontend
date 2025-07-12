import { createTheme } from '@mui/material/styles';

// 🎨 Colores principales
const backgroundPage = '#BCB893'; 
const cardBackground = '#ffffff'; 
const appBarColor = '#EAC3BF'; 
const buttonColor = '#474329'; 

const darkAccent = {
  main: '#332C0F',
  light: '#4F4520',
  dark: '#1F1A09',
  contrastText: '#ffffff',
};

const theme = createTheme({
  palette: {
    primary: {
      main: buttonColor,
      contrastText: '#ffffff',
    },
    secondary: {
      main: darkAccent.main,
      contrastText: '#ffffff',
    },
    error: {
      main: '#D32F2F',
    },
    background: {
      default: backgroundPage,
      paper: cardBackground,
    },
    text: {
      primary: darkAccent.main,
      secondary: '#424242',
    },
  },
  typography: {
    fontFamily: [
      'Quicksand',
      'Roboto',
      'Georgia',
    ].join(','),
    h6: {
      fontWeight: 700,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#EAC3BF',      // Fondo de la AppBar
          color: '#332C0F',    // Color del texto sobre la barra
          boxShadow: 'none',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          color: darkAccent.main,            // Texto dentro de la barra (por si acaso)
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 4,
        },
        containedPrimary: {
          backgroundColor: buttonColor,
          '&:hover': {
            backgroundColor: '#3b391f',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          // Se usará palette.background.paper
        },
      },
    },
  },
});

export default theme;
