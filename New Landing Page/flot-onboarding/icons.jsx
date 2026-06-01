/* Flot Onboarding — inline Lucide SVG icons (robust, no webfont dependency) */
const LUCIDE_PATHS = {
  plane: <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />,
  search: <React.Fragment><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></React.Fragment>,
  users: <React.Fragment><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></React.Fragment>,
  'arrow-right': <React.Fragment><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></React.Fragment>,
  check: <path d="M20 6 9 17l-5-5" />,
  'circle-check': <React.Fragment><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></React.Fragment>,
  'shield-check': <React.Fragment><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></React.Fragment>,
  clock: <React.Fragment><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></React.Fragment>,
  lock: <React.Fragment><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></React.Fragment>,
  info: <React.Fragment><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></React.Fragment>,
};

function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 2, style }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0, ...style }}
    >
      {LUCIDE_PATHS[name] || null}
    </svg>
  );
}

window.Icon = Icon;
