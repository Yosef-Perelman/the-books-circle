import { AppShell, Group, Title, Avatar, Text, UnstyledButton, Button, TextInput, Burger, Drawer, Stack, Loader } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { IconSearch } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import AddBookModal from '../features/books/AddBookModal';
import AboutModal from './AboutModal';
import Logo from './Logo';
import { palette } from '../theme';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const modal = useUiStore((state) => state.modal);
  const openModal = useUiStore((state) => state.openModal);
  const closeModal = useUiStore((state) => state.closeModal);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const getNavColor = (path) => location.pathname === path ? 'terracotta' : 'muted';

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim().length > 0) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
    notifications.show({ color: 'green', message: 'Signed out.' });
    navigate('/');
  };

  return (
    <>
      <AppShell
        header={{ height: 70 }}
        padding={0}
        bg="cream"
      >
        <AppShell.Header bg="surface" withBorder style={{ borderColor: palette.line }}>
          <Group h="100%" px="xl" justify="space-between">
            <Group style={{ cursor: 'pointer' }} onClick={() => navigate('/feed')}>
              <Burger opened={drawerOpened} onClick={toggleDrawer} hiddenFrom="sm" size="sm" />
              <Logo size={28} color={palette.terracotta} />
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
                <Avatar color="forest" radius="xl" size="sm" src={user?.avatarUrl}>
                  {user?.displayName?.charAt(0).toUpperCase() || 'Y'}
                </Avatar>
              </Group>
              <Group gap="xl" visibleFrom="sm">
                <UnstyledButton onClick={() => navigate('/feed')}>
                  <Text fw={600} size="md" c={getNavColor('/feed')}>Home</Text>
                </UnstyledButton>
                <UnstyledButton onClick={() => navigate('/explore')}>
                  <Text fw={600} size="md" c={getNavColor('/explore')}>Explore</Text>
                </UnstyledButton>
                <UnstyledButton onClick={() => navigate('/profile')}>
                  <Text fw={600} size="md" c={getNavColor('/profile')}>Profile</Text>
                </UnstyledButton>
                <UnstyledButton onClick={() => navigate('/leaderboard')}>
                  <Text fw={600} size="md" c={getNavColor('/leaderboard')}>Leaderboard</Text>
                </UnstyledButton>
                <UnstyledButton onClick={() => openModal('about')}>
                  <Text fw={500} size="md" c="muted">About</Text>
                </UnstyledButton>
                <UnstyledButton onClick={handleLogout} disabled={loggingOut}>
                  <Group gap={6}>
                    {loggingOut && <Loader size={12} color="terracotta" />}
                    <Text fw={500} size="md" c="muted">Logout</Text>
                  </Group>
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
            <UnstyledButton onClick={() => { navigate('/feed'); closeDrawer(); }}>
              <Text fw={600} size="lg" c={getNavColor('/feed')}>Home</Text>
            </UnstyledButton>
            <UnstyledButton onClick={() => { navigate('/explore'); closeDrawer(); }}>
              <Text fw={600} size="lg" c={getNavColor('/explore')}>Explore</Text>
            </UnstyledButton>
            <UnstyledButton onClick={() => { navigate('/profile'); closeDrawer(); }}>
              <Text fw={600} size="lg" c={getNavColor('/profile')}>Profile</Text>
            </UnstyledButton>
            <UnstyledButton onClick={() => { navigate('/leaderboard'); closeDrawer(); }}>
              <Text fw={600} size="lg" c={getNavColor('/leaderboard')}>Leaderboard</Text>
            </UnstyledButton>
            <UnstyledButton onClick={() => { openModal('about'); closeDrawer(); }}>
              <Text fw={500} size="lg" c="muted">About</Text>
            </UnstyledButton>
            <UnstyledButton onClick={() => { handleLogout(); closeDrawer(); }} disabled={loggingOut}>
              <Text fw={500} size="lg" c="muted">Logout</Text>
            </UnstyledButton>
          </Stack>
        </Drawer>

        <AppShell.Main pb={60}>
          <Outlet />
        </AppShell.Main>
      </AppShell>
      <AddBookModal opened={modal?.type === 'addBook'} onClose={closeModal} />
      <AboutModal opened={modal?.type === 'about'} onClose={closeModal} />
    </>
  );
}
