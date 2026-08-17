import { useState } from 'react';
import { Card, Group, Avatar, Button, Textarea, ActionIcon, Text, Box } from '@mantine/core';
import { IconBook, IconPencil, IconX } from '@tabler/icons-react';
import { useAuthStore } from '../../stores/authStore';
import BookSelectModal from './BookSelectModal';
import { postsApi } from '../../api/postsApi';

export default function CreatePostWidget({ onPostCreated, activeCircle }) {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('text'); // 'text' | 'review'
  const [selectedBook, setSelectedBook] = useState(null); // { userBookId?, bookDetails }
  const [modalOpened, setModalOpened] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    if (postType === 'review' && !selectedBook) return;

    setLoading(true);
    try {
      const payload = {
        type: selectedBook ? 'review' : 'text',
        content: content.trim(),
        userBookId: selectedBook?.userBookId,
        book: selectedBook?.userBookId ? null : selectedBook?.bookDetails
      };
      await postsApi.createPost(payload);
      setContent('');
      setSelectedBook(null);
      setPostType('text');
      onPostCreated();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBook = (bookInfo) => {
    setSelectedBook(bookInfo);
    setPostType('review');
    setModalOpened(false);
  };

  const clearBook = () => {
    setSelectedBook(null);
    setPostType('text');
  };

  return (
    <>
      <Card radius="md" p="md" withBorder mb="lg" style={{ borderColor: '#EADFC9' }}>
        <Group align="flex-start" wrap="nowrap">
          <Avatar src={user?.user_metadata?.avatar_url} radius="xl" alt={user?.user_metadata?.display_name} />
          <Box style={{ flex: 1 }}>
            <Textarea
              placeholder={postType === 'review' ? "Write your review..." : "What are your thoughts on your latest read?"}
              autosize
              minRows={2}
              variant="unstyled"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              styles={{ input: { fontSize: '15px' } }}
            />

            {selectedBook && (
              <Card withBorder radius="md" p="xs" mt="sm" bg="gray.0">
                <Group justify="space-between" wrap="nowrap">
                  <Group wrap="nowrap">
                    <Avatar src={selectedBook.bookDetails.coverUrl} radius="sm" size="md" />
                    <div>
                      <Text size="sm" fw={600} lineClamp={1}>{selectedBook.bookDetails.title}</Text>
                      <Text size="xs" c="dimmed">Attached to review</Text>
                    </div>
                  </Group>
                  <ActionIcon color="gray" variant="subtle" onClick={clearBook}>
                    <IconX size={16} />
                  </ActionIcon>
                </Group>
              </Card>
            )}

            <Group justify="space-between" mt="md" align="center">
              <Group gap="sm">
                <Button 
                  variant={postType === 'text' && !selectedBook ? 'light' : 'subtle'} 
                  color="terracotta" 
                  size="xs" 
                  radius="xl"
                  leftSection={<IconPencil size={14} />}
                  onClick={clearBook}
                >
                  Text
                </Button>
                <Button 
                  variant={postType === 'review' || selectedBook ? 'light' : 'subtle'} 
                  color="terracotta" 
                  size="xs" 
                  radius="xl"
                  leftSection={<IconBook size={14} />}
                  onClick={() => setModalOpened(true)}
                >
                  {selectedBook ? 'Change Book' : 'Write Review'}
                </Button>
              </Group>
              
              <Group gap="sm" align="center">
                {activeCircle?.id === 'global' && (
                  <Text size="xs" c="dimmed">Posting to all your circles</Text>
                )}
                <Button 
                  color="terracotta" 
                  radius="xl"
                  loading={loading}
                  disabled={!content.trim() || (postType === 'review' && !selectedBook)}
                  onClick={handleSubmit}
                >
                  Post
                </Button>
              </Group>
            </Group>
          </Box>
        </Group>
      </Card>

      <BookSelectModal 
        opened={modalOpened} 
        onClose={() => setModalOpened(false)} 
        onSelectBook={handleSelectBook} 
      />
    </>
  );
}
