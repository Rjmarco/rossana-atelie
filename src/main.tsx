import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { LaboratoryProvider } from './context/LaboratoryContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LaboratoryProvider>
      <App />
    </LaboratoryProvider>
  </StrictMode>,
);
