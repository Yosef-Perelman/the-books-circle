import { useState, useEffect, useMemo } from 'react';
import { Container, Title, Text, Group, Avatar, Stack, Tabs, Box, Loader, Center } from '@mantine/core';
import { useParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import BookCard from '../../components/BookCard';
import { booksApi } from '../../api/booksApi';
import { usersApi } from '../../api/usersApi';
import { useAuthStore } from '../../stores/authStore';

export default function ProfilePage() {
  const { id } = useParams();
  const authUser = useAuthStore(state => state.user);
  const [profileUser, setProfileUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('finished');

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
        
        const booksData = await booksApi.getUserBooks(id);
        if (isMounted) setBooks(booksData);
      } catch (err) {
        console.error("Profile load error:", err);
        if (isMounted) notifications.show({ title: 'Error', message: 'Failed to load profile', color: 'red' });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadProfile();

    return () => { isMounted = false; };
  }, [id, isOwnProfile]);

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
          </Tabs.List>

          <Tabs.Panel value="want">
            <Stack gap="md">
              {booksByStatus.want.map(ub => (
                <BookCard key={ub.id} variant="list" book={{...ub.book, status: ub.status}} />
              ))}
              {booksByStatus.want.length === 0 && <Text c="dimmed" ta="center" py="xl">No books in this list yet.</Text>}
            </Stack>
          </Tabs.Panel>
          
          <Tabs.Panel value="reading">
            <Stack gap="md">
              {booksByStatus.reading.map(ub => (
                <BookCard key={ub.id} variant="list" book={{...ub.book, status: ub.status}} />
              ))}
              {booksByStatus.reading.length === 0 && <Text c="dimmed" ta="center" py="xl">No books in this list yet.</Text>}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="finished">
            <Stack gap="md">
              {booksByStatus.finished.map(ub => (
                <BookCard key={ub.id} variant="list" book={{...ub.book, status: ub.status}} />
              ))}
              {booksByStatus.finished.length === 0 && <Text c="dimmed" ta="center" py="xl">No books in this list yet.</Text>}
            </Stack>
          </Tabs.Panel>
        </Tabs>
        
      </Container>
    </Box>
  );
}
