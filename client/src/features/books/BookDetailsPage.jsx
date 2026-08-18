import { useState, useEffect } from 'react';
import { Container, Title, Text, Image, Loader, Group, Button, Badge, Grid, Stack, Menu, Avatar, Card, Divider, Box } from '@mantine/core';
import { useParams, useNavigate } from 'react-router-dom';
import { IconArrowLeft, IconPlus, IconBook, IconCheck, IconBookmark } from '@tabler/icons-react';
import { booksApi } from '../../api/booksApi';
import { notifications } from '@mantine/notifications';

export default function BookDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddBook = async (status) => {
    setIsAdding(true);
    try {
      await booksApi.addUserBook({ book, status, source: 'search' });
      notifications.show({ title: 'Success', message: 'Book added to your shelf!', color: 'green' });
    } catch (err) {
      notifications.show({ title: 'Error', message: 'Could not add book', color: 'red' });
    } finally {
      setIsAdding(false);
    }
  };

  useEffect(() => {
    async function loadBook() {
      try {
        const [bookRes, reviewsRes] = await Promise.all([
          booksApi.getBookDetails(id),
          booksApi.getBookReviews(id)
        ]);
        setBook(bookRes.book);
        setReviews(reviewsRes || []);
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

            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Button 
                  color="terracotta" 
                  radius="xl" 
                  size="md" 
                  w="fit-content" 
                  leftSection={<IconPlus size={20} />}
                  mt="md"
                  loading={isAdding}
                >
                  Add to my shelf
                </Button>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Select shelf</Menu.Label>
                <Menu.Item leftSection={<IconCheck size={14} />} onClick={() => handleAddBook('finished')}>
                  Finished
                </Menu.Item>
                <Menu.Item leftSection={<IconBook size={14} />} onClick={() => handleAddBook('reading')}>
                  Currently Reading
                </Menu.Item>
                <Menu.Item leftSection={<IconBookmark size={14} />} onClick={() => handleAddBook('want')}>
                  Want to Read
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>

            {book.description && (
              <div mt="xl">
                <Title order={4} mb="sm">About this book</Title>
                <div dangerouslySetInnerHTML={{ __html: book.description }} style={{ color: '#444', lineHeight: 1.6 }} />
              </div>
            )}

            <Divider mt="xl" />

            <Box mt="md">
              <Title order={4} mb="lg">Community Reviews</Title>
              {reviews.length === 0 ? (
                <Text c="dimmed">No reviews yet. Be the first to share your thoughts!</Text>
              ) : (
                <Stack gap="md">
                  {reviews.map(review => (
                    <Card key={review.id} withBorder radius="md" p="md" shadow="sm">
                      <Group align="flex-start" wrap="nowrap" mb="xs">
                        <Avatar src={review.reviewerAvatar} radius="xl" size="md">
                          {review.reviewerName?.charAt(0) || 'U'}
                        </Avatar>
                        <Box style={{ flex: 1 }}>
                          <Group justify="space-between">
                            <Text fw={600}>{review.reviewerName}</Text>
                            {review.rating && (
                              <Group gap={4}>
                                {[...Array(Math.floor(review.rating))].map((_, i) => (
                                  <Text key={i} c="terracotta" size="sm">★</Text>
                                ))}
                              </Group>
                            )}
                          </Group>
                          <Text size="xs" c="dimmed">
                            In {review.circleId ? (
                              <Text 
                                component="span" 
                                c="terracotta" 
                                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                onClick={() => navigate(`/circle/${review.circleId}`)}
                              >
                                {review.circleName}
                              </Text>
                            ) : (
                              review.circleName
                            )}
                          </Text>
                        </Box>
                      </Group>
                      <Text style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }} mt="sm">
                        {review.content}
                      </Text>
                    </Card>
                  ))}
                </Stack>
              )}
            </Box>
          </Stack>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
