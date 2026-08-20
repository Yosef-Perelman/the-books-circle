import { AppShell, Group, Title, Avatar, Text, UnstyledButton, Box, Button, TextInput, Burger, Drawer, Stack, Loader } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { IconSearch } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuthStore } from '../stores/authStore';
import AddBookModal from '../features/books/AddBookModal';
import { palette } from '../theme';

// Exact match for Home (it's also the fallback for '/'); prefix match for
// everything else so nested routes like /profile/:id or /book/:id still
// mark their parent nav item active.
const NAV_ITEMS = [
  { label: 'Home', path: '/feed', exact: true },
  { label: 'Explore', path: '/explore' },
  { label: 'Profile', path: '/profile' },
  { label: 'Leaderboard', path: '/leaderboard' },
  { label: 'AI Chat', path: '/chat' }
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [addBookOpened, setAddBookOpened] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const isActive = (path, exact) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);
  const getNavColor = (path, exact) => (isActive(path, exact) ? 'terracotta' : palette.muted);

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
                placeholder="Search books, authors, ISBN..."
                radius="xl"
                size="sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                leftSection={<IconSearch size={16} />}
                style={{ width: isMobile ? '120px' : '250px' }}
              />
              <Button radius="xl" color="terracotta" onClick={() => setAddBookOpened(true)} visibleFrom="sm">
                Add a Book
              </Button>
              <Group gap="sm" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile')} visibleFrom="sm">
                <Avatar color="forest" radius="xl" size="sm" src={user?.avatarUrl}>
                  {user?.displayName?.charAt(0).toUpperCase() || 'Y'}
                </Avatar>
                <Text fw={600} size="sm" c={palette.ink}>{user?.displayName}</Text>
              </Group>
              <Avatar color="forest" radius="xl" size="sm" src={user?.avatarUrl} hiddenFrom="sm" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
                {user?.displayName?.charAt(0).toUpperCase() || 'Y'}
              </Avatar>
              <Group gap="xl" visibleFrom="sm">
                {NAV_ITEMS.map(({ label, path, exact }) => (
                  <UnstyledButton key={path} onClick={() => navigate(path)}>
                    <Text fw={600} size="md" c={getNavColor(path, exact)}>{label}</Text>
                  </UnstyledButton>
                ))}
                <UnstyledButton onClick={handleLogout} disabled={loggingOut}>
                  <Group gap={6}>
                    {loggingOut && <Loader size={12} color="terracotta" />}
                    <Text fw={500} size="md" c={palette.muted}>Logout</Text>
                  </Group>
                </UnstyledButton>
              </Group>
            </Group>
          </Group>
        </AppShell.Header>

        <Drawer opened={drawerOpened} onClose={closeDrawer} size="xs" title="Menu" padding="xl">
          <Stack gap="lg">
            <Group gap="sm">
              <Avatar color="forest" radius="xl" size="sm" src={user?.avatarUrl}>
                {user?.displayName?.charAt(0).toUpperCase() || 'Y'}
              </Avatar>
              <Text fw={600} size="sm" c={palette.ink}>{user?.displayName}</Text>
            </Group>
            <Button radius="xl" color="terracotta" onClick={() => { setAddBookOpened(true); closeDrawer(); }} fullWidth>
              Add a Book
            </Button>
            {NAV_ITEMS.map(({ label, path, exact }) => (
              <UnstyledButton key={path} onClick={() => { navigate(path); closeDrawer(); }}>
                <Text fw={600} size="lg" c={getNavColor(path, exact)}>{label}</Text>
              </UnstyledButton>
            ))}
            <UnstyledButton onClick={() => { handleLogout(); closeDrawer(); }} disabled={loggingOut}>
              <Text fw={500} size="lg" c={palette.muted}>Logout</Text>
            </UnstyledButton>
          </Stack>
        </Drawer>

        <AppShell.Main>
          <Outlet />
        </AppShell.Main>
      </AppShell>
      <AddBookModal opened={addBookOpened} onClose={() => setAddBookOpened(false)} />
    </>
  );
}
