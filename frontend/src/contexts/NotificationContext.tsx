import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

interface NotificationContextType {
  showNotification: (message: string, severity?: AlertColor) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertColor>('info');

  const showNotification = (msg: string, sev: AlertColor = 'info') => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  };

  const showSuccess = (msg: string) => showNotification(msg, 'success');
  const showError = (msg: string) => showNotification(msg, 'error');
  const showWarning = (msg: string) => showNotification(msg, 'warning');
  const showInfo = (msg: string) => showNotification(msg, 'info');

  const handleClose = (_?: any, reason?: any) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  return (
    <NotificationContext.Provider
      value={{ showNotification, showSuccess, showError, showWarning, showInfo }}
    >
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleClose} severity={severity} variant="filled" sx={{ width: '100%', fontWeight: 500 }}>
          {message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification phải được sử dụng bên trong NotificationProvider');
  }
  return context;
};
