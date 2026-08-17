import { useState, useEffect } from 'react';
import { Modal, Tabs, TextInput, Loader, Stack, Group, Avatar, Text, Card, ActionIcon, ScrollArea, Box } from '@mantine/core';
import { IconSearch, IconBooks, IconCheck } from '@tabler/icons-react';
import { booksApi } from '../../api/booksApi';

export default function BookSelectModal({ opened, onClose, onSelectBook }) {
  const [activeTab, setActiveTab] = useState('my-books');
  const [myBooks, setMyBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (opened && activeTab === 'my-books') {
      loadMyBooks();
    }
  }, [opened, activeTab]);

  const loadMyBooks = async () => {
    setLoading(true);
    try {
      const data = await booksApi.getUserBooks();
      setMyBooks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const data = await booksApi.searchBooks(searchQuery);
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const BookItem = ({ book, isMyBook }) => (
    <Card 
      withBorder 
      p="sm" 
      radius="md" 
      style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
      onClick={() => onSelectBook(isMyBook ? { userBookId: book.id, bookDetails: book.book } : { bookDetails: book })}
    >
      <Group wrap="nowrap">
        <Avatar 
          src={isMyBook ? book.book.coverUrl : book.coverUrl} 
          radius="md" 
          size="xl" 
          alt={isMyBook ? book.book.title : book.title}
        />
        <Box style={{ flex: 1 }}>
          <Text fw={600} lineClamp={1}>{isMyBook ? book.book.title : book.title}</Text>
          <Text size="sm" c="dimmed">{isMyBook ? book.book.author : book.author}</Text>
        </Box>
        <ActionIcon variant="light" color="terracotta" radius="xl">
          <IconCheck size={18} />
        </ActionIcon>
      </Group>
    </Card>
  );

  return (
    <Modal opened={opened} onClose={onClose} title="Select a Book to Review" size="lg" radius="md">
      <Tabs value={activeTab} onChange={setActiveTab} color="terracotta">
        <Tabs.List>
          <Tabs.Tab value="my-books" leftSection={<IconBooks size={16} />}>My Books</Tabs.Tab>
          <Tabs.Tab value="search" leftSection={<IconSearch size={16} />}>Search</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="my-books" pt="md">
          <ScrollArea h={400}>
            {loading ? (
              <Loader color="terracotta" size="sm" display="block" mx="auto" mt="xl" />
            ) : myBooks.length > 0 ? (
              <Stack gap="sm">
                {myBooks.map(ub => <BookItem key={ub.id} book={ub} isMyBook />)}
              </Stack>
            ) : (
              <Text c="dimmed" ta="center" mt="xl">No books in your reading list yet.</Text>
            )}
          </ScrollArea>
        </Tabs.Panel>

        <Tabs.Panel value="search" pt="md">
          <form onSubmit={handleSearch}>
            <TextInput
              placeholder="Search for a book by title or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              rightSection={
                loading ? <Loader size="xs" /> : (
                  <ActionIcon type="submit" color="terracotta" variant="subtle">
                    <IconSearch size={18} />
                  </ActionIcon>
                )
              }
              mb="md"
            />
          </form>
          <ScrollArea h={350}>
            {searchResults.length > 0 ? (
              <Stack gap="sm">
                {searchResults.map(b => <BookItem key={b.id} book={b} isMyBook={false} />)}
              </Stack>
            ) : (
              !loading && searchQuery && <Text c="dimmed" ta="center" mt="xl">No results found.</Text>
            )}
          </ScrollArea>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}
