import { useState, useEffect } from 'react';
import { Container, Title, Text, Image, Loader, Group, Button, Grid, Stack, Paper, Box } from '@mantine/core';
import { useParams, useNavigate } from 'react-router-dom';
import { IconArrowLeft } from '@tabler/icons-react';
import { booksApi } from '../../api/booksApi';

export default function AuthorDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadAuthor() {
      try {
        setLoading(true);
        const res = await booksApi.getAuthorDetails(id);
        setAuthor(res.author || res);
      } catch (err) {
        setError("Could not load author details.");
      } finally {
        setLoading(false);
      }
    }
    loadAuthor();
  }, [id]);

  if (loading) {
    return (
      <Container size="lg" py="xl" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Loader color="terracotta" size="xl" />
      </Container>
    );
  }

  if (error || !author) {
    return (
      <Container size="lg" py="xl">
        <Text c="red" ta="center">{error || "Author not found"}</Text>
        <Button variant="subtle" color="forest" mt="md" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Container>
    );
  }

  const BookCard = ({ book }) => (
    <Paper 
      shadow="sm" 
      radius="md" 
      p="sm" 
      w="100%"
      style={{ cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }} 
      onClick={() => navigate(`/book/${book.id}`)}
      className="hover:-translate-y-1 transition-transform"
    >
      <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {book.coverUrl ? (
          <Image src={book.coverUrl} h={200} fit="contain" fallbackSrc="https://placehold.co/150x200?text=No+Cover" />
        ) : (
          <div style={{ height: 200, width: '100%', backgroundColor: '#eee', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text size="sm" c="dimmed">No cover</Text>
          </div>
        )}
      </Box>
      <Box mt="md">
        <Text size="sm" fw={600} lineClamp={2}>{book.title}</Text>
        <Text size="xs" c="dimmed" lineClamp={1} mt={4}>{book.publishedDate ? `Published: ${book.publishedDate}` : 'Unknown Date'}</Text>
      </Box>
    </Paper>
  );

  return (
    <Container size="lg" py="xl">
      <Button 
        variant="subtle" 
        color="forest" 
        leftSection={<IconArrowLeft size={16} />} 
        mb="lg"
        onClick={() => navigate(-1)}
      >
        Back
      </Button>

      <Grid gutter="xl">
        <Grid.Col span={{ base: 12, md: 4, lg: 3 }}>
          <Stack align="center">
            {author.photoUrl ? (
              <Image 
                src={author.photoUrl} 
                alt={author.name} 
                radius="md" 
                fallbackSrc="https://placehold.co/300x400?text=No+Photo"
              />
            ) : (
              <Paper bg="gray.2" w="100%" h={300} radius="md" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text c="dimmed">No photo available</Text>
              </Paper>
            )}
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 8, lg: 9 }}>
          <Stack gap="md">
            <Title order={1} style={{ fontFamily: 'Newsreader, serif', fontSize: '3rem' }} c="forest">
              {author.name}
            </Title>
            
            <Group c="dimmed" gap="xl">
              {(author.birthDate || author.deathDate) && (
                <Text size="sm">
                  {author.birthDate ? author.birthDate : '?'} - {author.deathDate ? author.deathDate : 'Present'}
                </Text>
              )}
            </Group>

            {author.bio && (
              <Box mt="xl">
                <Title order={4} mb="sm">Biography</Title>
                <Text style={{ lineHeight: 1.6, whiteSpace: 'pre-line' }}>{author.bio}</Text>
              </Box>
            )}

            <Box mt="xl" pt="xl" style={{ borderTop: '1px solid #eee' }}>
              <Title order={4} mb="lg">Popular Books by {author.name}</Title>
              {author.works && author.works.length > 0 ? (
                <Grid>
                  {author.works.map(book => (
                    <Grid.Col key={book.id || book.title} span={{ base: 6, sm: 4, md: 3, lg: 3 }}>
                      <BookCard book={book} />
                    </Grid.Col>
                  ))}
                </Grid>
              ) : (
                <Text c="dimmed">No popular books found for this author.</Text>
              )}
            </Box>
          </Stack>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
