import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Suspense } from 'react';
import { BrowserRouter, useRoutes } from 'react-router-dom';
import { Toaster } from 'sonner';
import routes from '~react-pages';
import './index.css';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>{useRoutes(routes)}</Suspense>
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <BrowserRouter>
        <App />
        <Toaster />
      </BrowserRouter>
    </ConvexProvider>
  </StrictMode>,
);
