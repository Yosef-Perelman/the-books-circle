import { useState, useEffect } from 'react';
import { Container, Title, Text, Image, Loader, Group, Button, Badge, Grid, Stack } from '@mantine/core';
import { useParams, useNavigate } from 'react-router-dom';
import { IconArrowLeft, IconPlus } from '@tabler/icons-react';
import { booksApi } from '../../api/booksApi';

export default function BookDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadBook() {
      try {
        const res = await booksApi.getBookDetails(id);
        setBook(res.book);
      } catch (err) {
        setError("Could not load book details.");
      } finally {
        setLoading(false);
      }
    }
    loadBook();
  }, [id]);

  if (loading) {
    return (
      <Container size="lg" py="xl" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Loader color="terracotta" />
      </Container>
    );
  }

  if (error || !book) {
    return (
      <Container size="lg" py="xl">
        <Text c="red" ta="center">{error || 'Book not found'}</Text>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Button variant="subtle" color="muted" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate(-1)} mb="xl">
        Back
      </Button>

      <Grid gutter="xl">
        <Grid.Col span={{ base: 12, md: 4 }}>
          {book.coverUrl ? (
            <Image src={book.coverUrl} radius="md" shadow="sm" fallbackSrc="https://placehold.co/300x450?text=No+Cover" />
          ) : (
            <div style={{ height: 450, backgroundColor: '#eee', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text c="dimmed">No cover</Text>
            </div>
          )}
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="md">
            <div>
              <Title order={1} style={{ fontFamily: 'Newsreader, serif', fontSize: '40px' }} c="forest">
                {book.title}
              </Title>
              {book.authorId ? (
                <Text 
                  size="xl" 
                  c="terracotta" 
                  mt="xs" 
                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => navigate(`/author/${encodeURIComponent(book.authorId)}`)}
                >
                  {book.author}
                </Text>
              ) : (
                <Text size="xl" c="dimmed" mt="xs">{book.author || 'Unknown author'}</Text>
              )}
            </div>

            <Group gap="sm">
              {book.genre && <Badge color="gray">{book.genre}</Badge>}
              {book.pageCount && <Badge color="gray" variant="outline">{book.pageCount} pages</Badge>}
              {book.publishedDate && <Badge color="gray" variant="outline">{book.publishedDate}</Badge>}
            </Group>

            <Button 
              color="terracotta" 
              radius="xl" 
              size="md" 
              w="fit-content" 
              leftSection={<IconPlus size={20} />}
              mt="md"
            >
              Add to my shelf
            </Button>

            {book.description && (
              <div mt="xl">
                <Title order={4} mb="sm">About this book</Title>
                <div dangerouslySetInnerHTML={{ __html: book.description }} style={{ color: '#444', lineHeight: 1.6 }} />
              </div>
            )}
          </Stack>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
