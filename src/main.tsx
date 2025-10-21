import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// StrictMode intentionally double-mounts components in development to find bugs.
// This causes duplicate logs. You can disable it to reduce console noise.
// Re-enable periodically to check for side effects.
const ENABLE_STRICT_MODE = false; // Set to true to enable double-mounting checks

createRoot(document.getElementById('root')!).render(
  ENABLE_STRICT_MODE ? (
    <StrictMode>
      <App />
    </StrictMode>
  ) : (
    <App />
  )
);
