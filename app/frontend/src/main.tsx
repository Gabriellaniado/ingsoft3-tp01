import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.tsx';
import './index.css';

Sentry.init({
  dsn: 'https://f47c69f68531cbcabf4d5f6e6f4eeabe@o4512301158432768.ingest.us.sentry.io/4512301186285568',
  environment: window.location.hostname,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1.0,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
