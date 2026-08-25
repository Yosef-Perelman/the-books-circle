import { useMediaQuery } from '@mantine/hooks';

// Matches the theme's 'sm' breakpoint (768px) used throughout design/ui-patterns.md.
// useMediaQuery returns undefined on first render, so default to false to avoid
// flashing the mobile layout on a desktop load.
export function useIsMobile() {
  return useMediaQuery('(max-width: 768px)') ?? false;
}
