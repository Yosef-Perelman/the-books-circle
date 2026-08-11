import { useState, useEffect } from 'react';
import { Container, Title, Stack, Group, Text, Image, Loader, Paper, ScrollArea, Box } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { booksApi } from '../../api/booksApi';

export default function ExplorePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadExplore() {
      try {
        const res = await booksApi.getExplore();
        setData(res);
      } catch (err) {
        setError("Could not load explore data.");
      } finally {
        setLoading(false);
      }
    }
    loadExplore();
  }, []);

  if (loading) {
    return (
      <Container size="lg" py="xl" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Loader color="terracotta" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Text c="red" ta="center">{error}</Text>
      </Container>
    );
  }

  const BookCard = ({ book }) => (
    <Paper 
      shadow="xs" 
      radius="md" 
      p="sm" 
      w={140} 
      style={{ cursor: 'pointer', flexShrink: 0 }} 
      onClick={() => navigate(`/book/${book.id}`)}
      className="hover:-translate-y-1 transition-transform"
    >
      {book.coverUrl ? (
        <Image src={book.coverUrl} h={180} fit="cover" radius="sm" fallbackSrc="https://placehold.co/120x180?text=No+Cover" />
      ) : (
        <div style={{ height: 180, backgroundColor: '#eee', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Text size="xs" c="dimmed">No cover</Text>
        </div>
      )}
      <Text size="sm" fw={600} mt="sm" lineClamp={2}>{book.title}</Text>
      <Text size="xs" c="dimmed" lineClamp={1}>{book.author}</Text>
    </Paper>
  );

  return (
    <Container size="lg" py="xl">
      <Title order={2} c="forest" mb="xl" style={{ fontFamily: 'Newsreader, serif', fontSize: '32px' }}>
        Explore Books
      </Title>

      <Stack gap="xl">
        {data.trending && data.trending.length > 0 && (
          <Box>
            <Title order={4} mb="md">Trending Now</Title>
            <ScrollArea>
              <Group wrap="nowrap" pb="sm">
                {data.trending.map(book => <BookCard key={book.id} book={book} />)}
              </Group>
            </ScrollArea>
          </Box>
        )}

        {data.categories?.map((cat, i) => (
          <Box key={i}>
            <Title order={4} mb="md">{cat.title}</Title>
            <ScrollArea>
              <Group wrap="nowrap" pb="sm">
                {cat.books.map(book => <BookCard key={book.id} book={book} />)}
              </Group>
            </ScrollArea>
          </Box>
        ))}
      </Stack>
    </Container>
  );
}
