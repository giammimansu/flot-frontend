import { Link, useLocation } from 'react-router-dom';
import { MIcon } from '../ui/MIcon';
import styles from './TabBar.module.css';

export function TabBar() {
  const location = useLocation();

  const tabs = [
    { name: 'Home', path: '/', icon: 'search' as const },
    { name: 'My Trips', path: '/my-trips', icon: 'plane-landing' as const },
    { name: 'Profile', path: '/profile', icon: 'user' as const },
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
            <MIcon name={tab.icon} size={24} />
            <span className={styles.label}>{tab.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
