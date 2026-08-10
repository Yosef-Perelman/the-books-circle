import { AppShell, Group, Title, Avatar, Text, UnstyledButton, Box } from '@mantine/core';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const getNavColor = (path) => location.pathname === path ? 'terracotta' : 'muted';

  return (
    <AppShell
      header={{ height: 70 }}
      padding={0}
      bg="cream"
    >
      <AppShell.Header bg="surface" withBorder style={{ borderColor: '#EADFC9' }}>
        <Group h="100%" px="xl" justify="space-between">
          <Group style={{ cursor: 'pointer' }} onClick={() => navigate('/feed')}>
            <Box w={28} h={28} bg="terracotta" style={{ borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box w={12} h={16} bg="white" style={{ borderRadius: '2px' }} />
            </Box>
            <Title order={3} c="terracotta" style={{ fontFamily: 'Newsreader, serif', fontSize: '24px' }}>
              The Reading Circles
            </Title>
          </Group>
          
          <Group gap="xl">
            <Group gap="sm" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile')}>
              <Avatar color="forest" radius="xl" size="sm">
                {user?.displayName?.charAt(0).toUpperCase() || 'Y'}
              </Avatar>
            </Group>
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
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
