import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { RouterProvider } from "react-router-dom";
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { router } from './routes/Routes';
import AuthProvider from "./pages/Auth/Authprovider";
import { LanguageProvider } from "./context/LanguageContext";
import { NotificationProvider } from "./context/NotificationContext";

// A reload always starts at the top. Content loads after the page opens, so
// the browser's restored position (and the router's saved one) would land
// mid-page. Back/forward still restore positions (see <ScrollRestoration> in Layout).
try {
  window.history.scrollRestoration = 'manual';
  const [nav] = performance.getEntriesByType('navigation');
  if (nav?.type === 'reload') sessionStorage.removeItem('react-router-scroll-positions');
} catch {
  // Storage blocked (private mode etc.): the scroll-to-top below still applies.
}
window.scrollTo(0, 0);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      {/* Fallback tab title so pages without their own <Helmet> don't keep a stale one (e.g. the 404 title). */}
      <Helmet defaultTitle="PriPackLab — Online Printing & Packaging in Bangladesh | Business Card, ID Card, Packaging" />
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            <div className="mx-auto bg-white">
              <RouterProvider router={router} />
            </div>
          </NotificationProvider>
        </AuthProvider>
      </LanguageProvider>
    </HelmetProvider>
  </React.StrictMode>,
)
