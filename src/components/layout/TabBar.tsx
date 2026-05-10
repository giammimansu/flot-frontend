import { Link, useLocation } from 'react-router-dom';
import { MIcon } from '../ui/MIcon';
import styles from './TabBar.module.css';

const tabs = [
  { name: 'Home', path: '/', icon: 'home' as const },
  { name: 'Viaggi', path: '/my-trips', icon: 'plane-landing' as const },
  { name: 'Profilo', path: '/profile', icon: 'user' as const },
];

export function TabBar() {
  const location = useLocation();

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
            <span className={styles.iconWrap}>
              <MIcon name={tab.icon} size={24} sw={isActive ? 2 : 1.5} />
            </span>
            <span className={styles.label}>{tab.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
