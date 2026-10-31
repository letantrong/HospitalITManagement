import { createTheme } from '@mui/material/styles';

/**
 * Material UI Theme Chuẩn Y Tế & Chuyên Nghiệp
 * Bệnh viện Phục hồi chức năng
 * Bảng màu: Medical Blue (#0284c7) & Emerald Health (#059669)
 */
export const hospitalTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0284c7', // Sky / Medical Blue
      light: '#38bdf8',
      dark: '#0369a1',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#059669', // Emerald Green (Y tế phục hồi)
      light: '#34d399',
      dark: '#047857',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#b91c1c',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    info: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#1d4ed8',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    background: {
      default: '#f8fafc', // Slate 50
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a', // Slate 900
      secondary: '#64748b', // Slate 500
    },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'Helvetica',
      'Arial',
      'sans-serif',
    ].join(','),
    h4: {
      fontWeight: 800,
      letterSpacing: '-0.02em',
      color: '#0f172a',
    },
    h5: {
      fontWeight: 800,
      letterSpacing: '-0.01em',
      color: '#0f172a',
    },
    h6: {
      fontWeight: 700,
      color: '#0f172a',
    },
    subtitle1: {
      fontWeight: 600,
      color: '#1e293b',
    },
    subtitle2: {
      fontWeight: 600,
      color: '#334155',
    },
    body1: {
      fontSize: '0.925rem',
      color: '#334155',
    },
    body2: {
      fontSize: '0.85rem',
      color: '#64748b',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f8fafc',
          color: '#0f172a',
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#cbd5e1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#94a3b8',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          padding: '7px 16px',
          fontSize: '0.875rem',
          fontWeight: 600,
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
          },
        },
        contained: {
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0',
          backgroundImage: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#f8fafc',
          '& .MuiTableCell-root': {
            fontWeight: 700,
            color: '#475569',
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            borderBottom: '1px solid #e2e8f0',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
          borderColor: '#f1f5f9',
          fontSize: '0.875rem',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 6,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});
