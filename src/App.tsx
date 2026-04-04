// src/App.tsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';
import { Layout } from '@/shared/components/Layout';
import { PageLoader } from '@/shared/components/LoadingSpinner';

const LoginPage        = lazy(() => import('@/pages/LoginPage'));
const DashboardPage    = lazy(() => import('@/pages/DashboardPage'));
const TradingPage      = lazy(() => import('@/pages/TradingPage'));
const WealthPage       = lazy(() => import('@/pages/WealthPage'));
const TransactionsPage = lazy(() => import('@/pages/TransactionsPage'));
const AssetsPage       = lazy(() => import('@/pages/AssetsPage'));
const ReportsPage      = lazy(() => import('@/pages/ReportsPage'));
const SettingsPage     = lazy(() => import('@/pages/SettingsPage'));
const GuidePage        = lazy(() => import('@/pages/GuidePage'));

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Redirect already-authenticated users away from /login (also handles magic link return)
function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="trading"      element={<TradingPage />} />
            <Route path="wealth"       element={<WealthPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="assets"       element={<AssetsPage />} />
            <Route path="reports"      element={<ReportsPage />} />
            <Route path="settings"     element={<SettingsPage />} />
            <Route path="guide"        element={<GuidePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
