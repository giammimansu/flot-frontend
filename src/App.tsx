import { lazy, Suspense, type ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuth } from './hooks/useAuth';
import { Toast } from './components/ui';
import { TabBar } from './components/layout/TabBar';
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
  useAuth();
  return null;
}

function TabBarContainer() {
  const location = useLocation();
  const showTabPaths = ['/check-in', '/my-trips', '/profile'];
  const isTrip = location.pathname.startsWith('/trip/');
  if (showTabPaths.includes(location.pathname) || isTrip) {
    return <TabBar />;
  }
  return null;
}

export function App() {
  return (
    <HashRouter>
      <ErrorBoundary>
        <AuthInit />
        <Toast />
        <Suspense fallback={<ScreenLoader />}>
          <Routes>
            <Route path="/" element={wrap(<EntryPoint />)} />
            <Route path="/airport" element={wrap(<AirportPicker />)} />
            <Route path="/check-in" element={wrap(<TravelCheckin />)} />
            <Route path="/search" element={wrap(<ActiveSearch />)} />
            <Route path="/trip/:tripId" element={wrap(<TripScheduled />)} />
            <Route path="/match/:matchId" element={wrap(<MatchLocked />)} />
            <Route path="/connection/:matchId" element={wrap(<ProtectedRoute><ConnectionUnlocked /></ProtectedRoute>)} />
            <Route path="/no-match" element={wrap(<NoMatchFound />)} />
            <Route path="/verify" element={wrap(<ProtectedRoute><IdentityVerification /></ProtectedRoute>)} />
            <Route path="/my-trips" element={wrap(<MyTrips />)} />
            <Route path="/profile" element={wrap(<ProtectedRoute><Profile /></ProtectedRoute>)} />
          </Routes>
        </Suspense>
        <TabBarContainer />
      </ErrorBoundary>
    </HashRouter>
  );
}
