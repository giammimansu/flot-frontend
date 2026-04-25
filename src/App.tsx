import { lazy, Suspense, type ReactNode } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
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

function Placeholder({ label }: { label: string }) {
  return <div className={styles.placeholder}>{label}</div>;
}

function ScreenLoader() {
  return (
    <div className={styles.loader}>
      <div className={styles.loaderDot} />
    </div>
  );
}

function wrap(node: ReactNode) {
  return <ErrorBoundary>{node}</ErrorBoundary>;
}

export function App() {
  return (
    <HashRouter>
      <ErrorBoundary>
        <Suspense fallback={<ScreenLoader />}>
          <Routes>
            <Route path="/" element={wrap(<EntryPoint />)} />
            <Route path="/airport" element={wrap(<AirportPicker />)} />
            <Route path="/check-in" element={wrap(<TravelCheckin />)} />
            <Route path="/search" element={wrap(<Placeholder label="Active Search" />)} />
            <Route path="/match/:matchId" element={wrap(<Placeholder label="Match Locked" />)} />
            <Route path="/connection/:matchId" element={wrap(<Placeholder label="Connection Unlocked" />)} />
            <Route path="/no-match" element={wrap(<Placeholder label="No Match Found" />)} />
            <Route path="/verify" element={wrap(<Placeholder label="Identity Verification" />)} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </HashRouter>
  );
}
