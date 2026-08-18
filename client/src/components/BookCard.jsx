import { Card, Group, Stack, Text, Box, Paper, Rating, Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import BookCover from './BookCover';
import StarRating from './StarRating';
import StatusPills from './StatusPills';

export default function BookCard({ 
  book, 
  variant = 'grid', 
  interactive = false, 
  onStatusChange,
  onRatingChange,
  onRemove,
  onWriteReview,
  w = '100%'
}) {
  const navigate = useNavigate();

  // Common properties extracted from the book object
  const title = book.title || 'Unknown Title';
  const author = book.author || 'Unknown author';
  const coverUrl = book.coverUrl || book.cover_i; // Handling different cover prop names

  if (variant === 'list') {
    // List variant (used in ProfilePage)
    const { coverColor = 'forest', coverTitle = title, stars = 0, quote, status = 'want' } = book;
    
    return (
      <Card radius="xl" p="lg" withBorder bg="surface" style={{ borderColor: '#EADFC9', boxShadow: '0 4px 20px rgba(58,50,42,0.03)' }}>
        <Group justify="space-between" align="center" wrap="nowrap">
          <Group align="flex-start" wrap="nowrap">
            <BookCover 
              src={coverUrl} 
              title={coverTitle} 
              coverColor={coverColor} 
              w={60} 
              h={90} 
            />
            <Stack gap={2} mt={4}>
              <Text fw={700} size="lg" style={{ cursor: 'pointer' }} onClick={() => navigate(`/book/${book.apiId || book.id}`)}>{title}</Text>
              <Text size="sm" c="muted">{author}</Text>
              {stars > 0 && !interactive && <StarRating stars={stars} />}
              {interactive && (status === 'finished' || status === 'reading') && (
                <Group gap="sm">
                  <Rating 
                    value={stars} 
                    onChange={(val) => onRatingChange && onRatingChange(val)}
                    color="yellow" 
                    size="md" 
                  />
                  {status === 'finished' && onWriteReview && (
                    <Button 
                      variant="light" 
                      color="terracotta" 
                      size="xs" 
                      radius="xl"
                      onClick={(e) => { e.stopPropagation(); onWriteReview(); }}
                    >
                      Write Review
                    </Button>
                  )}
                </Group>
              )}
              {quote && (
                <Text size="sm" fs="italic" mt="xs" c="ink">
                  "{quote}"
                </Text>
              )}
            </Stack>
          </Group>

          <StatusPills 
            status={status} 
            interactive={interactive} 
            onStatusChange={onStatusChange} 
            onRemove={onRemove}
          />
        </Group>
      </Card>
    );
  }

  // Grid variant (used in ExplorePage, SearchPage, AuthorDetailsPage)
  return (
    <Paper 
      shadow="sm" 
      radius="md" 
      p="sm" 
      w={w}
      style={{ cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column', flexShrink: 0 }} 
      onClick={() => navigate(`/book/${book.apiId || book.id}`)}
      className="hover:-translate-y-1 transition-transform"
    >
      <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <BookCover src={coverUrl} title={title} h={200} w="100%" />
      </Box>
      <Box mt="md">
        <Text size="sm" fw={600} lineClamp={2}>{title}</Text>
        <Text size="xs" c="dimmed" lineClamp={1} mt={4}>{author}</Text>
      </Box>
    </Paper>
  );
}
