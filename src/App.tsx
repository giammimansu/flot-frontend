import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuth, useAuthInit } from './hooks/useAuth';
import { Toast } from './components/ui';
import { TabBar } from './components/layout/TabBar';
import { setupForegroundNotifications } from './services/pushNotifications';
import { useNotificationStore } from './stores/notificationStore';
import styles from './App.module.css';

const EntryPoint = lazy(() =>
  import('./screens/EntryPoint').then((m) => ({ default: m.EntryPoint }))
);
const AirportPicker = lazy(() =>
  import('./screens/AirportPicker').then((m) => ({ default: m.AirportPicker }))
);
const TravelCheckin = lazy(() =>
  import('./screens/TravelCheckin').then((m) => ({ default: m.TravelCheckin }))
);
const ActiveSearch = lazy(() =>
  import('./screens/ActiveSearch').then((m) => ({ default: m.ActiveSearch }))
);
const MatchLocked = lazy(() =>
  import('./screens/MatchLocked').then((m) => ({ default: m.MatchLocked }))
);
const NoMatchFound = lazy(() =>
  import('./screens/NoMatchFound').then((m) => ({ default: m.NoMatchFound }))
);
const TripScheduled = lazy(() =>
  import('./screens/TripScheduled').then((m) => ({ default: m.TripScheduled }))
);
const MyTrips = lazy(() =>
  import('./screens/MyTrips').then((m) => ({ default: m.MyTrips }))
);
const ConnectionUnlocked = lazy(() =>
  import('./screens/ConnectionUnlocked').then((m) => ({ default: m.ConnectionUnlocked }))
);
const Profile = lazy(() =>
  import('./screens/Profile').then((m) => ({ default: m.Profile }))
);
const IdentityVerification = lazy(() =>
  import('./screens/IdentityVerification').then((m) => ({ default: m.IdentityVerification }))
);

function ScreenLoader() {
  return (
    <div className={styles.loader}>
      <div className={styles.loaderDot} />
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) {
    return (
      <div className={styles.loader}>
        <div className={styles.loaderDot} />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

function wrap(node: ReactNode) {
  return <ErrorBoundary>{node}</ErrorBoundary>;
}

function AuthInit() {
  useAuthInit();
  return null;
}

function ForegroundNotifications() {
  const { isAuthenticated } = useAuth();
  const showToast = useNotificationStore((s) => s.showToast);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Listen for FCM foreground messages
    const unsubscribe = setupForegroundNotifications(({ title, body, matchId, tripId }) => {
      showToast({
        title,
        body,
        onClick: () => {
          if (matchId) navigate(`/match/${matchId}`);
          else if (tripId) navigate(`/trip/${tripId}`);
        },
      });
    });

    // Listen for navigation messages from background SW notificationclick
    function handleSwMessage(event: MessageEvent) {
      if (event.data?.type === 'NOTIFICATION_CLICK' && event.data.path) {
        // path is like /#/match/123 — strip hash prefix for navigate()
        const path = (event.data.path as string).replace(/^\/#/, '');
        navigate(path);
      }
    }
    navigator.serviceWorker?.addEventListener('message', handleSwMessage);

    return () => {
      unsubscribe();
      navigator.serviceWorker?.removeEventListener('message', handleSwMessage);
    };
  }, [isAuthenticated, navigate, showToast]);

  return null;
}

function TabBarContainer() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const showTabPaths = ['/check-in', '/my-trips', '/profile'];
  const isTrip = location.pathname.startsWith('/trip/');
  const isHome = location.pathname === '/' || location.pathname === '';
  if (showTabPaths.includes(location.pathname) || isTrip || (isHome && isAuthenticated)) {
    return <TabBar />;
  }
  return null;
}

export function App() {
  return (
    <HashRouter>
      <ErrorBoundary>
        <AuthInit />
        <ForegroundNotifications />
        <Toast />
        <Suspense fallback={<ScreenLoader />}>
          <Routes>
            <Route path="/" element={wrap(<EntryPoint />)} />
            <Route path="/airport" element={wrap(<AirportPicker />)} />
            <Route path="/check-in" element={wrap(<ProtectedRoute><TravelCheckin /></ProtectedRoute>)} />
            <Route path="/search" element={wrap(<ProtectedRoute><ActiveSearch /></ProtectedRoute>)} />
            <Route path="/trip/:tripId" element={wrap(<ProtectedRoute><TripScheduled /></ProtectedRoute>)} />
            <Route path="/match/:matchId" element={wrap(<ProtectedRoute><MatchLocked /></ProtectedRoute>)} />
            <Route path="/connection/:matchId" element={wrap(<ProtectedRoute><ConnectionUnlocked /></ProtectedRoute>)} />
            <Route path="/no-match" element={wrap(<ProtectedRoute><NoMatchFound /></ProtectedRoute>)} />
            <Route path="/verify" element={wrap(<ProtectedRoute><IdentityVerification /></ProtectedRoute>)} />
            <Route path="/my-trips" element={wrap(<ProtectedRoute><MyTrips /></ProtectedRoute>)} />
            <Route path="/profile" element={wrap(<ProtectedRoute><Profile /></ProtectedRoute>)} />
          </Routes>
        </Suspense>
        <TabBarContainer />
      </ErrorBoundary>
    </HashRouter>
  );
}
