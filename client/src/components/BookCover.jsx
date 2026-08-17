import { Box, Image, Text } from '@mantine/core';

export default function BookCover({ src, title, coverColor = 'forest', h = 200, w = '100%', fallbackText = 'No Cover' }) {
  if (src) {
    return (
      <Image 
        src={src} 
        h={h} 
        w={w} 
        fit="contain" 
        fallbackSrc={`https://placehold.co/150x200?text=${encodeURIComponent(fallbackText)}`} 
      />
    );
  }

  // Fallback for missing images, simulating the colorful ProfilePage covers or simple gray
  if (title) {
    return (
      <Box w={w} h={h} bg={coverColor} style={{ borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text size="xs" c="white" fw={700} ta="center" style={{ lineHeight: 1.2 }}>
          {title.split(' ').map((word, i) => <span key={i}>{word}<br/></span>)}
        </Text>
      </Box>
    );
  }

  return (
    <div style={{ height: h, width: w, backgroundColor: '#eee', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Text size="sm" c="dimmed">{fallbackText}</Text>
    </div>
  );
}
