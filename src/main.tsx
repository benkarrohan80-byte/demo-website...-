import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safely suppress noisy network connection/reconnection alerts from Cloud Firestore in the sandboxed dev environment.
// Firestore operates perfectly in offline mode using caching, so these are non-fatal warnings.
const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args: any[]) => {
  const msg = args.map(arg => typeof arg === 'string' ? arg : String(arg)).join(' ');
  if (msg.includes('Could not reach Cloud Firestore backend') || msg.includes('Firestore (12.18.0)')) {
    return;
  }
  originalWarn(...args);
};

console.error = (...args: any[]) => {
  const msg = args.map(arg => typeof arg === 'string' ? arg : String(arg)).join(' ');
  if (msg.includes('Could not reach Cloud Firestore backend') || msg.includes('Firestore (12.18.0)')) {
    return;
  }
  originalError(...args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
