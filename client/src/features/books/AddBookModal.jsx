import { useState, useEffect } from 'react';
import { Modal, Button, Tabs, TextInput, Stack, NumberInput, Text, Group, Loader, ScrollArea, Box, ActionIcon, Autocomplete, SegmentedControl } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconCheck } from '@tabler/icons-react';
import { booksApi } from '../../api/booksApi';
import BookCover from '../../components/BookCover';

export default function AddBookModal({ opened, onClose }) {
  const [activeTab, setActiveTab] = useState('search');
  const [selectedStatus, setSelectedStatus] = useState('want');
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingBookId, setAddingBookId] = useState(null);

  // Search tab state
  const [debouncedQuery] = useDebouncedValue(query, 500);

  // Manual tab state
  const [manualData, setManualData] = useState({ title: '', author: '', genre: '', pageCount: '', coverUrl: '' });
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);
  const [debouncedManualQuery] = useDebouncedValue(manualData.title, 500);

  useEffect(() => {
    if (activeTab !== 'manual' || !debouncedManualQuery || debouncedManualQuery.length < 3) {
      setAutocompleteResults([]);
      return;
    }
    
    let isMounted = true;
    setIsAutocompleteLoading(true);
    booksApi.searchBooks(debouncedManualQuery).then(data => {
      if (isMounted) {
        setAutocompleteResults(data.slice(0, 5));
      }
    }).catch(() => {}).finally(() => {
      if (isMounted) setIsAutocompleteLoading(false);
    });
    return () => { isMounted = false; };
  }, [debouncedManualQuery, activeTab]);

  useEffect(() => {
    if (activeTab === 'search' && debouncedQuery && debouncedQuery.length >= 3) {
      handleSearch(debouncedQuery);
    } else if (activeTab === 'search' && (!debouncedQuery || debouncedQuery.length < 3)) {
      setResults([]);
    }
  }, [debouncedQuery, activeTab]);

  const handleSearch = async (searchQuery) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    setIsLoading(true);
    try {
      const data = await booksApi.searchBooks(q);
      setResults(data);
    } catch (err) {
      notifications.show({ title: 'Error', message: 'Failed to search books', color: 'red' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (book) => {
    setAddingBookId(book.id || book.cover_i);
    try {
      await booksApi.addUserBook({
        book,
        status: selectedStatus,
        source: activeTab === 'manual' ? 'manual' : 'search'
      });
      notifications.show({ title: 'Success', message: `Added ${book.title} to your shelf!`, color: 'teal', icon: <IconCheck /> });
      onClose(); // close modal on success
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message || 'Failed to add book', color: 'red' });
    } finally {
      setAddingBookId(null);
    }
  };

  const handleManualAdd = async () => {
    if (!manualData.title) return;
    const book = {
      title: manualData.title,
      author: manualData.author,
      genre: manualData.genre,
      pageCount: manualData.pageCount,
      coverUrl: manualData.coverUrl
    };
    await handleAdd(book);
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Add a book" size="md">
      <SegmentedControl
        value={selectedStatus}
        onChange={setSelectedStatus}
        data={[
          { label: 'Want to Read', value: 'want' },
          { label: 'Reading', value: 'reading' },
          { label: 'Finished', value: 'finished' }
        ]}
        fullWidth
        color="terracotta"
        mb="md"
      />
      
      <Tabs value={activeTab} onChange={setActiveTab} color="terracotta">
        <Tabs.List>
          <Tabs.Tab value="scan">Scan cover</Tabs.Tab>
          <Tabs.Tab value="search">Search</Tabs.Tab>
          <Tabs.Tab value="manual">Manual</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="scan" pt="xl">
          <Stack align="center" gap="md" py="xl">
            <Text c="muted">Upload or take a photo of the book cover.</Text>
            <Button color="terracotta" radius="xl">Select Photo</Button>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="search" pt="xl">
          <Stack gap="md">
            <Group>
              <TextInput 
                placeholder="Search by title, author, or ISBN..." 
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                style={{ flex: 1 }}
              />
              <Button color="terracotta" radius="xl" onClick={handleSearch} loading={isLoading}>Search</Button>
            </Group>

            <ScrollArea h={300} type="always" offsetScrollbars>
              <Stack gap="sm">
                {results.map((book, idx) => (
                  <Group key={book.id || idx} wrap="nowrap" align="center" style={{ borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                    <BookCover 
                      src={book.coverUrl || book.cover_i} 
                      title={book.title} 
                      h={60} 
                      w={40} 
                    />
                    <Box style={{ flex: 1 }}>
                      <Text size="sm" fw={600} lineClamp={1}>{book.title}</Text>
                      <Text size="xs" c="dimmed" lineClamp={1}>{book.author}</Text>
                    </Box>
                    <ActionIcon 
                      color="terracotta" 
                      variant="light" 
                      radius="xl" 
                      onClick={() => handleAdd(book)}
                      loading={addingBookId === (book.id || book.cover_i)}
                    >
                      <IconPlus size={18} />
                    </ActionIcon>
                  </Group>
                ))}
                {!isLoading && query && results.length === 0 && (
                  <Text c="dimmed" ta="center" mt="xl">No results found.</Text>
                )}
              </Stack>
            </ScrollArea>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="manual" pt="xl">
          <Stack gap="md">
            <Autocomplete 
              label="Title" 
              placeholder="Start typing to find a real book..."
              required 
              value={manualData.title}
              onChange={(val) => setManualData({ ...manualData, title: val })}
              data={autocompleteResults.map(b => b.title)}
              onOptionSubmit={(val) => {
                const book = autocompleteResults.find(b => b.title === val);
                if (book) {
                  setManualData({
                    title: book.title,
                    author: book.author || '',
                    genre: book.genre || '',
                    pageCount: book.pageCount || '',
                    coverUrl: book.coverUrl || book.cover_i || ''
                  });
                }
              }}
              rightSection={isAutocompleteLoading ? <Loader size="xs" /> : null}
            />
            <TextInput 
              label="Author" 
              value={manualData.author} 
              onChange={(e) => setManualData({ ...manualData, author: e.currentTarget.value })}
            />
            <TextInput 
              label="Genre" 
              value={manualData.genre}
              onChange={(e) => setManualData({ ...manualData, genre: e.currentTarget.value })}
            />
            <NumberInput 
              label="Page count" 
              min={1} 
              value={manualData.pageCount}
              onChange={(val) => setManualData({ ...manualData, pageCount: val })}
            />
            <Button color="terracotta" radius="xl" onClick={handleManualAdd} loading={addingBookId !== null}>Add to shelf</Button>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}
