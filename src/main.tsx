import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/styles/index.css';

if (import.meta.env.DEV) {
  void import('@/test/dev-hooks').then((m) => m.installDevHooks());
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
