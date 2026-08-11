import { useState, useEffect } from 'react';
import { Container, Title, Text, Image, Loader, Paper, Grid, Box, Tabs, Badge } from '@mantine/core';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { booksApi } from '../../api/booksApi';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [activeTab, setActiveTab] = useState('books');
  const [bookResults, setBookResults] = useState([]);
  const [authorResults, setAuthorResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function performSearch() {
      if (!query) return;
      setLoading(true);
      setError(null);
      try {
        const [books, authors] = await Promise.all([
          booksApi.searchBooks(query),
          booksApi.searchAuthors(query)
        ]);
        setBookResults(books.data || books);
        setAuthorResults(authors.data || authors);
      } catch (err) {
        setError("Search failed. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    performSearch();
  }, [query]);

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
        <Text size="xs" c="dimmed" lineClamp={1} mt={4}>{book.author}</Text>
      </Box>
    </Paper>
  );

  return (
    <Container size="lg" py="xl">
      <Title order={2} c="forest" mb="xs" style={{ fontFamily: 'Newsreader, serif', fontSize: '32px' }}>
        Search Results
      </Title>
      {query && <Text c="dimmed" mb="xl">Showing results for "{query}"</Text>}

      {loading ? (
        <Container size="lg" py="xl" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '30vh' }}>
          <Loader color="terracotta" />
        </Container>
      ) : error ? (
        <Text c="red" ta="center">{error}</Text>
      ) : (
        <Tabs value={activeTab} onChange={setActiveTab} color="terracotta" mt="md">
          <Tabs.List mb="xl">
            <Tabs.Tab value="books" fz="md" fw={500}>
              Books {bookResults.length > 0 && <Badge size="sm" ml="xs" color="gray" variant="light">{bookResults.length}</Badge>}
            </Tabs.Tab>
            <Tabs.Tab value="authors" fz="md" fw={500}>
              Authors {authorResults.length > 0 && <Badge size="sm" ml="xs" color="gray" variant="light">{authorResults.length}</Badge>}
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="books">
            {bookResults.length > 0 ? (
              <Grid>
                {bookResults.map(book => (
                  <Grid.Col key={book.id || book.title} span={{ base: 6, sm: 4, md: 3, lg: 2 }}>
                    <BookCard book={book} />
                  </Grid.Col>
                ))}
              </Grid>
            ) : (
              query && <Text ta="center" mt="xl" size="lg" c="dimmed">No books found for "{query}".</Text>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="authors">
            {authorResults.length > 0 ? (
              <Grid>
                {authorResults.map(author => (
                  <Grid.Col key={author.id} span={{ base: 12, sm: 6, md: 4 }}>
                    <Paper 
                      shadow="sm" 
                      radius="md" 
                      p="md" 
                      withBorder
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/author/${encodeURIComponent(author.id)}`)}
                      className="hover:-translate-y-1 transition-transform"
                    >
                      <Title order={5} c="forest">{author.name}</Title>
                      {author.topSubjects && author.topSubjects.length > 0 && (
                        <Text size="sm" c="dimmed" mt="xs" lineClamp={1}>
                          Known for: {author.topSubjects.join(', ')}
                        </Text>
                      )}
                      <Text size="xs" fw={500} mt="md" c="terracotta">
                        {author.workCount} published works
                      </Text>
                    </Paper>
                  </Grid.Col>
                ))}
              </Grid>
            ) : (
              query && <Text ta="center" mt="xl" size="lg" c="dimmed">No authors found for "{query}".</Text>
            )}
          </Tabs.Panel>
        </Tabs>
      )}
    </Container>
  );
}
