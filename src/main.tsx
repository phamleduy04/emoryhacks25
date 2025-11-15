import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useRoutes } from 'react-router-dom';
import routes from '~react-pages';
import './index.css';
import { Toaster } from '@/components/ui/sonner';
import { SolanaWalletProvider } from './contexts/SolanaWalletProvider';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>{useRoutes(routes)}</Suspense>
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <SolanaWalletProvider>
        <BrowserRouter>
          <App />
          <Toaster />
        </BrowserRouter>
      </SolanaWalletProvider>
    </ConvexProvider>
  </StrictMode>,
);
