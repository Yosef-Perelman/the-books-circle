import { AppShell, Group, Title, Avatar, Text, UnstyledButton, Box, Button, TextInput, Burger, Drawer, Stack } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { IconSearch } from '@tabler/icons-react';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import AddBookModal from '../features/books/AddBookModal';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const modal = useUiStore((state) => state.modal);
  const openModal = useUiStore((state) => state.openModal);
  const closeModal = useUiStore((state) => state.closeModal);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const getNavColor = (path) => location.pathname === path ? 'terracotta' : 'muted';

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim().length > 0) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <>
      <AppShell
        header={{ height: 70 }}
        padding={0}
        bg="cream"
      >
        <AppShell.Header bg="surface" withBorder style={{ borderColor: '#EADFC9' }}>
          <Group h="100%" px="xl" justify="space-between">
            <Group style={{ cursor: 'pointer' }} onClick={() => navigate('/feed')}>
              <Burger opened={drawerOpened} onClick={toggleDrawer} hiddenFrom="sm" size="sm" />
              <Box w={28} h={28} bg="terracotta" style={{ borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box w={12} h={16} bg="white" style={{ borderRadius: '2px' }} />
              </Box>
              <Title order={3} c="terracotta" style={{ fontFamily: 'Newsreader, serif', fontSize: isMobile ? '20px' : '24px' }}>
                The Reading Circles
              </Title>
            </Group>

            <Group gap="xl">
              <TextInput 
                placeholder="Search..."
                radius="xl"
                size="sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                leftSection={<IconSearch size={16} />}
                style={{ width: isMobile ? '120px' : '250px' }}
              />
              <Button radius="xl" color="terracotta" onClick={() => openModal('addBook')} visibleFrom="sm">
                Add a Book
              </Button>
              <Group gap="sm" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile')}>
                <Avatar color="forest" radius="xl" size="sm">
                  {user?.displayName?.charAt(0).toUpperCase() || 'Y'}
                </Avatar>
              </Group>
              <Group gap="xl" visibleFrom="sm">
                <UnstyledButton onClick={() => navigate('/explore')}>
                  <Text fw={600} size="md" c={getNavColor('/explore')}>Explore</Text>
                </UnstyledButton>
                <UnstyledButton onClick={() => navigate('/profile')}>
                  <Text fw={600} size="md" c={getNavColor('/profile')}>Profile</Text>
                </UnstyledButton>
                <UnstyledButton onClick={() => navigate('/leaderboard')}>
                  <Text fw={600} size="md" c={getNavColor('/leaderboard')}>Leaderboard</Text>
                </UnstyledButton>
                <UnstyledButton onClick={() => { logout(); navigate('/'); }}>
                  <Text fw={500} size="md" c="muted">Logout</Text>
                </UnstyledButton>
              </Group>
            </Group>
          </Group>
        </AppShell.Header>

        <Drawer opened={drawerOpened} onClose={closeDrawer} size="xs" title="Menu" padding="xl">
          <Stack gap="lg">
            <Button radius="xl" color="terracotta" onClick={() => { openModal('addBook'); closeDrawer(); }} fullWidth>
              Add a Book
            </Button>
            <UnstyledButton onClick={() => { navigate('/explore'); closeDrawer(); }}>
              <Text fw={600} size="lg" c={getNavColor('/explore')}>Explore</Text>
            </UnstyledButton>
            <UnstyledButton onClick={() => { navigate('/profile'); closeDrawer(); }}>
              <Text fw={600} size="lg" c={getNavColor('/profile')}>Profile</Text>
            </UnstyledButton>
            <UnstyledButton onClick={() => { navigate('/leaderboard'); closeDrawer(); }}>
              <Text fw={600} size="lg" c={getNavColor('/leaderboard')}>Leaderboard</Text>
            </UnstyledButton>
            <UnstyledButton onClick={() => { logout(); navigate('/'); closeDrawer(); }}>
              <Text fw={500} size="lg" c="muted">Logout</Text>
            </UnstyledButton>
          </Stack>
        </Drawer>

        <AppShell.Main>
          <Outlet />
        </AppShell.Main>
      </AppShell>
      <AddBookModal opened={modal?.type === 'addBook'} onClose={closeModal} />
    </>
  );
}
