import { Box } from '@mantine/core';

// An open book inside a ring — the app's mark, used in AppShell, AuthPage,
// and WelcomePage instead of each drawing its own ad-hoc box.
export default function Logo({ size = 28, color = 'currentColor' }) {
  return (
    <Box
      w={size}
      h={size}
      style={{ borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6}>
        <circle cx="12" cy="12" r="11" strokeOpacity={0.35} />
        <path
          d="M12 8.5c-1.2-1-2.9-1.5-4.5-1.5v9c1.6 0 3.3.5 4.5 1.5m0-9c1.2-1 2.9-1.5 4.5-1.5v9c-1.6 0-3.3.5-4.5 1.5m0-9V17"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Box>
  );
}
