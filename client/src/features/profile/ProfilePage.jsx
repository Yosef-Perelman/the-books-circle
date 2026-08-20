import { useState, useEffect, useMemo } from 'react';
import { Container, Title, Text, Group, Avatar, Stack, Tabs, Box, Loader, Center } from '@mantine/core';
import { useParams, useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import BookCard from '../../components/BookCard';
import PostCard from '../feed/PostCard';
import ConfirmDialog from '../../components/ConfirmDialog';
import { booksApi } from '../../api/booksApi';
import { usersApi } from '../../api/usersApi';
import { useAuthStore } from '../../stores/authStore';
import InterviewModal from '../interview/InterviewModal';

export default function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);
  const [profileUser, setProfileUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [circles, setCircles] = useState([]);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('finished');
  const [isInterviewOpen, setIsInterviewOpen] = useState(false);
  const [interviewBook, setInterviewBook] = useState(null);
  const [removeConfirm, setRemoveConfirm] = useState(null);

  // Determine if viewing own profile
  const isOwnProfile = !id || id === authUser?.id;
  // The user to display
  const user = isOwnProfile ? authUser : profileUser;

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadProfile = async () => {
      try {
        if (!isOwnProfile) {
          const userObj = await usersApi.getUser(id);
          if (isMounted) setProfileUser({ id: userObj.id, displayName: userObj.display_name, avatarUrl: userObj.avatar_url });
        }
        const currentId = id || authUser?.id;
        if (!currentId) return;
        
        const [booksData, circlesData, postsData] = await Promise.all([
          booksApi.getUserBooks(currentId),
          usersApi.getUserCircles(currentId),
          usersApi.getUserPosts(currentId)
        ]);

        if (isMounted) {
          setBooks(booksData);
          setCircles(circlesData);
          setPosts(postsData);
        }
      } catch (err) {
        console.error("Profile load error:", err);
        if (isMounted) notifications.show({ title: 'Error', message: 'Failed to load profile', color: 'red' });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadProfile();

    return () => { isMounted = false; };
  }, [id, isOwnProfile, authUser?.id]);

  const handleStatusChange = async (bookId, newStatus) => {
    try {
      await booksApi.updateUserBookStatus(bookId, newStatus);
      setBooks(current => current.map(b => b.id === bookId ? { ...b, status: newStatus } : b));
      notifications.show({ title: 'Success', message: 'Book status updated', color: 'green' });
      
      // If marked as finished, offer interview
      if (newStatus === 'finished') {
        const ub = books.find(b => b.id === bookId);
        if (ub) {
          setInterviewBook({ ...ub, status: 'finished' });
          setIsInterviewOpen(true);
        }
      }
    } catch (err) {
      notifications.show({ title: 'Error', message: 'Failed to update status', color: 'red' });
    }
  };

  const handleRatingChange = async (bookId, newRating) => {
    try {
      await booksApi.updateUserBookRating(bookId, newRating);
      setBooks(current => current.map(b => b.id === bookId ? { ...b, rating: newRating } : b));
      notifications.show({ title: 'Success', message: 'Rating saved', color: 'green' });
    } catch (err) {
      notifications.show({ title: 'Error', message: 'Failed to save rating', color: 'red' });
    }
  };

  const handleRemoveBook = async (bookId) => {
    try {
      await booksApi.removeUserBook(bookId);
      setBooks(current => current.filter(b => b.id !== bookId));
      notifications.show({ title: 'Success', message: 'Book removed', color: 'green' });
    } catch (err) {
      notifications.show({ title: 'Error', message: 'Failed to remove book', color: 'red' });
    } finally {
      setRemoveConfirm(null);
    }
  };

  const booksByStatus = useMemo(() => {
    const grouped = { want: [], reading: [], finished: [] };
    books.forEach(ub => {
      if (grouped[ub.status]) {
        grouped[ub.status].push(ub);
      }
    });
    return grouped;
  }, [books]);

  if (isLoading) {
    return (
      <Center style={{ height: 'calc(100vh - 70px)' }}>
        <Loader color="terracotta" />
      </Center>
    );
  }

  return (
    <Box bg="surface" style={{ minHeight: 'calc(100vh - 70px)' }} pt={60}>
      <Container size="md">
        
        {/* Profile Header */}
        <Group align="flex-start" gap="xl" mb={60} justify="center">
          <Avatar color="terracotta" size={100} radius={100} src={user?.avatarUrl || ''} style={{ fontSize: '2.5rem' }}>
            {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
          </Avatar>
          <Stack gap={4}>
            <Title order={1} style={{ fontFamily: 'Newsreader, serif', fontSize: '2.5rem' }}>
              {user?.displayName || 'User'}
            </Title>
            <Text c="muted" size="lg">{isOwnProfile ? 'My Profile' : 'Profile'}</Text>
            <Text c="sage" fw={600} mt="xs">
              {books.length} books · {booksByStatus.reading.length} currently reading
            </Text>
          </Stack>
        </Group>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={setActiveTab} color="terracotta" variant="unstyled" classNames={{
          tab: 'custom-tab',
        }}>
          <Tabs.List style={{ borderBottom: '1px solid #EADFC9', paddingBottom: '0' }} mb="xl">
            <Tabs.Tab 
              value="want" 
              px="xl" 
              py="md"
              style={(theme) => ({ 
                fontSize: '1.1rem',
                color: activeTab === 'want' ? '#C96F4B' : '#8A7E70',
                fontWeight: activeTab === 'want' ? 600 : 400,
                borderBottom: activeTab === 'want' ? '3px solid #C96F4B' : '3px solid transparent'
              })}
            >
              Want to read
            </Tabs.Tab>
            <Tabs.Tab 
              value="reading" 
              px="xl" 
              py="md"
              style={(theme) => ({ 
                fontSize: '1.1rem',
                color: activeTab === 'reading' ? '#C96F4B' : '#8A7E70',
                fontWeight: activeTab === 'reading' ? 600 : 400,
                borderBottom: activeTab === 'reading' ? '3px solid #C96F4B' : '3px solid transparent'
              })}
            >
              Reading
            </Tabs.Tab>
            <Tabs.Tab 
              value="finished" 
              px="xl" 
              py="md"
              style={(theme) => ({ 
                fontSize: '1.1rem',
                color: activeTab === 'finished' ? '#C96F4B' : '#8A7E70',
                fontWeight: activeTab === 'finished' ? 600 : 400,
                borderBottom: activeTab === 'finished' ? '3px solid #C96F4B' : '3px solid transparent'
              })}
            >
              Finished
            </Tabs.Tab>
            <Tabs.Tab 
              value="posts" 
              px="xl" 
              py="md"
              style={(theme) => ({ 
                fontSize: '1.1rem',
                color: activeTab === 'posts' ? '#C96F4B' : '#8A7E70',
                fontWeight: activeTab === 'posts' ? 600 : 400,
                borderBottom: activeTab === 'posts' ? '3px solid #C96F4B' : '3px solid transparent'
              })}
            >
              Reviews
            </Tabs.Tab>
            <Tabs.Tab 
              value="circles" 
              px="xl" 
              py="md"
              style={(theme) => ({ 
                fontSize: '1.1rem',
                color: activeTab === 'circles' ? '#C96F4B' : '#8A7E70',
                fontWeight: activeTab === 'circles' ? 600 : 400,
                borderBottom: activeTab === 'circles' ? '3px solid #C96F4B' : '3px solid transparent'
              })}
            >
              Circles
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="want">
            <Stack gap="md">
              {booksByStatus.want.map(ub => (
                <BookCard 
                  key={ub.id} 
                  variant="list" 
                  book={{...ub.book, status: ub.status, stars: ub.rating}} 
                  interactive={isOwnProfile}
                  onStatusChange={(newStatus) => handleStatusChange(ub.id, newStatus)}
                  onRatingChange={(newRating) => handleRatingChange(ub.id, newRating)}
                  onRemove={() => setRemoveConfirm(ub.id)}
                  onWriteReview={() => { setInterviewBook(ub); setIsInterviewOpen(true); }}
                />
              ))}
              {booksByStatus.want.length === 0 && <Text c="dimmed" ta="center" py="xl">No books in this list yet.</Text>}
            </Stack>
          </Tabs.Panel>
          
          <Tabs.Panel value="reading">
            <Stack gap="md">
              {booksByStatus.reading.map(ub => (
                <BookCard 
                  key={ub.id} 
                  variant="list" 
                  book={{...ub.book, status: ub.status, stars: ub.rating}} 
                  interactive={isOwnProfile}
                  onStatusChange={(newStatus) => handleStatusChange(ub.id, newStatus)}
                  onRatingChange={(newRating) => handleRatingChange(ub.id, newRating)}
                  onRemove={() => setRemoveConfirm(ub.id)}
                  onWriteReview={() => { setInterviewBook(ub); setIsInterviewOpen(true); }}
                />
              ))}
              {booksByStatus.reading.length === 0 && <Text c="dimmed" ta="center" py="xl">No books in this list yet.</Text>}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="finished">
            <Stack gap="md">
              {booksByStatus.finished.map(ub => (
                <BookCard 
                  key={ub.id} 
                  variant="list" 
                  book={{...ub.book, status: ub.status, stars: ub.rating}} 
                  interactive={isOwnProfile}
                  onStatusChange={(newStatus) => handleStatusChange(ub.id, newStatus)}
                  onRatingChange={(newRating) => handleRatingChange(ub.id, newRating)}
                  onRemove={() => setRemoveConfirm(ub.id)}
                  onWriteReview={() => { setInterviewBook(ub); setIsInterviewOpen(true); }}
                />
              ))}
              {booksByStatus.finished.length === 0 && <Text c="dimmed" ta="center" py="xl">No books in this list yet.</Text>}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="posts">
            <Stack gap="md">
              {posts.filter(post => post.type === 'review').map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onReactionUpdate={(postId, increment) => {
                    setPosts(current => current.map(p => {
                      if (p.id === postId) {
                        return {
                          ...p,
                          userReacted: increment > 0,
                          reactionsCount: p.reactionsCount + increment
                        };
                      }
                      return p;
                    }));
                  }}
                  onCommentAdded={(postId) => {
                    setPosts(current => current.map(p => p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p));
                  }}
                />
              ))}
              {posts.filter(post => post.type === 'review').length === 0 && <Text c="dimmed" ta="center" py="xl">No reviews yet.</Text>}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="circles">
            <Stack gap="md">
              {circles.map(circle => (
                <Box 
                  key={circle.id} 
                  p="md" 
                  style={{ border: '1px solid #EADFC9', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer' }}
                  onClick={() => navigate(`/circle/${circle.id}`)}
                >
                  <Text fw={600} size="lg">{circle.name}</Text>
                  <Text size="sm" c="dimmed">{circle.description || `${circle.memberCount} members`}</Text>
                </Box>
              ))}
              {circles.length === 0 && <Text c="dimmed" ta="center" py="xl">Not a member of any circles.</Text>}
            </Stack>
          </Tabs.Panel>
        </Tabs>
        
      </Container>
      <InterviewModal
        opened={isInterviewOpen}
        onClose={() => setIsInterviewOpen(false)}
        userBook={interviewBook}
      />
      <ConfirmDialog
        opened={!!removeConfirm}
        onClose={() => setRemoveConfirm(null)}
        onConfirm={() => handleRemoveBook(removeConfirm)}
        title="Remove this book?"
        message="Are you sure you want to remove this book from your lists?"
        confirmLabel="Remove"
        danger
      />
    </Box>
  );
}
