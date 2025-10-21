import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppNew from './AppNew';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppNew />
  </StrictMode>
);