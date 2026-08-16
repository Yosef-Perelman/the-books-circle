import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { theme } from './theme.js';
import { useAuthStore } from './stores/authStore.js';
import { useCircleStore } from './stores/circleStore.js';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './index.css';

function Root() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const status = useAuthStore((state) => state.status);
  const userId = useAuthStore((state) => state.user?.id);
  const loadCircles = useCircleStore((state) => state.loadCircles);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (status === 'ready' && userId) {
      loadCircles();
    }
  }, [status, userId, loadCircles]);

  return (
    <MantineProvider theme={theme}>
      <Notifications position="top-right" />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MantineProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
