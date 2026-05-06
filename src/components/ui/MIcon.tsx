import type { JSX } from 'react';

export type IconName =
  | 'home'
  | 'plane-landing'
  | 'users'
  | 'luggage'
  | 'search'
  | 'map-pin'
  | 'phone'
  | 'message-circle'
  | 'timer'
  | 'chevron-left'
  | 'chevron-right'
  | 'check'
  | 'help-circle'
  | 'plus'
  | 'minus'
  | 'sparkles'
  | 'arrow-right'
  | 'shield'
  | 'crown'
  | 'eye'
  | 'x'
  | 'info'
  | 'zap'
  | 'navigation'
  | 'user'
  | 'settings'
  | 'log-out'
  | 'badge-check'
  | 'lock'
  | 'clock'
  | 'bell'
  | 'calendar'
  | 'trash';

interface MIconProps {
  name: IconName;
  size?: number;
  sw?: number;
  color?: string;
  className?: string;
  'aria-label'?: string;
}

const iconPaths: Record<IconName, JSX.Element> = {
  home: (
    <g>
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
      <path d="M9 21V12h6v9" />
    </g>
  ),
  'plane-landing': (
    <g>
      <path d="M2 22h20" />
      <path d="M6.36 17.4 4 17l-2-4 1.1-.55a2 2 0 0 1 1.8 0l.17.1a2 2 0 0 0 1.8 0L8 12 5 6l.9-.45a2 2 0 0 1 2.09.2l4.02 3a2 2 0 0 0 2.1.2l4.19-2.06a2.41 2.41 0 0 1 1.73-.17L22 7v14" />
    </g>
  ),
  users: (
    <g>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </g>
  ),
  luggage: (
    <g>
      <rect x="6" y="8" width="12" height="13" rx="2" />
      <path d="M9 8V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3" />
      <path d="M9 21v1M15 21v1" />
    </g>
  ),
  search: (
    <g>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </g>
  ),
  'map-pin': (
    <g>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </g>
  ),
  phone: (
    <g>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </g>
  ),
  'message-circle': (
    <g>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </g>
  ),
  timer: (
    <g>
      <circle cx="12" cy="14" r="8" />
      <path d="M12 10v4l2 2" />
      <path d="M5 3 2 6" />
      <path d="m22 6-3-3" />
    </g>
  ),
  'chevron-left': <path d="m15 18-6-6 6-6" />,
  'chevron-right': <path d="m9 18 6-6-6-6" />,
  check: <path d="M20 6 9 17l-5-5" />,
  'help-circle': (
    <g>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </g>
  ),
  plus: (
    <g>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </g>
  ),
  minus: <path d="M5 12h14" />,
  sparkles: (
    <g>
      <path d="M9.94 5.17 8.5 2l-1.44 3.17L4 6.5l3.06 1.33L8.5 11l1.44-3.17L13 6.5z" />
      <path d="m19 3-1.26 2.74L15 7l2.74 1.26L19 11l1.26-2.74L23 7l-2.74-1.26z" />
      <path d="m19 16-1.26 2.74L15 20l2.74 1.26L19 24" />
    </g>
  ),
  'arrow-right': (
    <g>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </g>
  ),
  shield: (
    <g>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </g>
  ),
  crown: (
    <g>
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L20.183 6.2a.5.5 0 0 1 .798.519l-1.494 7.6a1 1 0 0 1-.981.8H5.494a1 1 0 0 1-.981-.8L3.02 6.72a.5.5 0 0 1 .798-.519l3.276 2.962a1 1 0 0 0 1.516-.294z" />
      <path d="M5.494 15.118h13.012" />
    </g>
  ),
  eye: (
    <g>
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </g>
  ),
  x: (
    <g>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </g>
  ),
  info: (
    <g>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </g>
  ),
  zap: (
    <g>
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </g>
  ),
  navigation: (
    <g>
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </g>
  ),
  user: (
    <g>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </g>
  ),
  settings: (
    <g>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </g>
  ),
  'log-out': (
    <g>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </g>
  ),
  lock: (
    <g>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </g>
  ),
  clock: (
    <g>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </g>
  ),
  'badge-check': (
    <g>
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
      <path d="m9 12 2 2 4-4" />
    </g>
  ),
  bell: (
    <g>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </g>
  ),
  calendar: (
    <g>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </g>
  ),
  trash: (
    <g>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </g>
  ),
};

export function MIcon({
  name,
  size = 24,
  sw = 1.75,
  color,
  className,
  'aria-label': ariaLabel,
}: MIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : 'presentation'}
      aria-hidden={!ariaLabel}
    >
      {iconPaths[name]}
    </svg>
  );
}
