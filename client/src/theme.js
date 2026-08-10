import { createTheme } from '@mantine/core';

export const palette = {
  cream: '#F7F0E1',
  surface: '#FFFDF8',
  terracotta: '#C96F4B',
  terracottaDark: '#B25E3C',
  terracottaTint: '#FBE9E0',
  forest: '#35594A',
  greenTint: '#E6EDE8',
  sage: '#6E8B7B',
  ink: '#3A322A',
  muted: '#8A7E70',
  line: '#EADFC9',
  stale: '#B9AE9C',
  gold: '#D9A45B',
  slate: '#6B7E8C',
};

export const theme = createTheme({
  primaryColor: 'terracotta',
  primaryShade: 6,
  white: palette.surface,
  black: palette.ink,
  colors: {
    terracotta: ['#FDF4F0','#FBE9E0','#F2CDBC','#E7AF97','#DC9174','#D28059','#C96F4B','#B25E3C','#964E32','#7A3F28'],
    forest:     ['#F2F6F4','#E6EDE8','#C6D6CD','#A5BFB1','#85A895','#6E8B7B','#35594A','#2E4C3F','#263F34','#1F3229'],
    gold:       ['#FDF7EE','#F8EAD3','#F0D5A8','#E8C07D','#E0AB52','#D9A45B','#C58F45','#A67739','#87602E','#684A23'],
    slate:      ['#F3F5F6','#E4E9EC','#C6D0D6','#A8B7C0','#8A9EAA','#6B7E8C','#5D6E7A','#4E5C66','#3F4B53','#30393F'],
    sand:       ['#FFFDF8','#F7F0E1','#EADFC9','#DDCEB4','#B9AE9C','#8A7E70','#6E6459','#544C43','#3A322A','#241F1A'],
  },
  defaultRadius: 'lg',
  radius: { sm: '8px', md: '12px', lg: '16px', xl: '24px' },
  shadows: {
    sm: '0 1px 2px rgba(58,50,42,0.06)',
    md: '0 4px 12px rgba(58,50,42,0.08)',
    lg: '0 10px 28px rgba(58,50,42,0.10)',
  },
  components: {
    Card:   { defaultProps: { radius: 'lg', shadow: 'md', bg: palette.surface, withBorder: false } },
    Button: { defaultProps: { radius: 'xl' } },
    Modal:  { defaultProps: { radius: 'xl', centered: true, overlayProps: { backgroundOpacity: 0.45, blur: 2 } } },
    Input:  { defaultProps: { radius: 'md' } },
  },
});
