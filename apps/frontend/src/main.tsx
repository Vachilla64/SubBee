import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/500.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import '@fontsource/nunito/900.css';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './lib/auth.tsx';
import { TransitionProvider } from './lib/TransitionContext.tsx';
import ToastProvider from './components/ui/ToastProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TransitionProvider>
          <App />
        </TransitionProvider>
        <ToastProvider />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
