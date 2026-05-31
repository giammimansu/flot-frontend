import { Link, useLocation } from 'react-router-dom';
import { MIcon } from '../ui/MIcon';
import styles from './TabBar.module.css';

function TripIcon({ active }: { active: boolean }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 7 17 17" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" />
      <circle cx="7" cy="7" r="3" fill="currentColor" />
      <circle cx="17" cy="17" r="3" fill="var(--accent-500)" />
    </svg>
  );
}

export function TabBar() {
  const location = useLocation();

  const tabs = [
    {
      name: 'Home',
      path: '/',
      render: (active: boolean) => <MIcon name="home" size={22} sw={active ? 2 : 1.5} />,
    },
    {
      name: 'Viaggi',
      path: '/my-trips',
      render: (active: boolean) => <TripIcon active={active} />,
    },
    {
      name: 'Profilo',
      path: '/profile',
      render: (active: boolean) => <MIcon name="user" size={22} sw={active ? 2 : 1.5} />,
    },
  ];

  return (
    <div className={styles.tabBar}>
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path || (tab.path === '/' && location.pathname === '');
        return (
          <Link
            key={tab.name}
            to={tab.path}
            className={`${styles.tab} ${isActive ? styles.active : ''}`}
          >
            {tab.render(isActive)}
            <span className={styles.label}>{tab.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
