import { Container, Title, Text, Button, Group, Stack } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <Container size="sm" style={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
      <Stack align="center" gap="xl" w="100%">
        <Title c="terracotta" style={{ fontFamily: 'Newsreader, serif', fontSize: '3rem' }}>
          The Reading Circles
        </Title>
        <Text size="xl" c="ink" fw={500}>
          A cosy corner for you and your reading circle.
        </Text>
        
        <Stack gap="md" my="lg">
          <Text c="muted">📸 Snap a cover to add a book</Text>
          <Text c="muted">📚 Track what you want to read</Text>
          <Text c="muted">🏆 Compete on the leaderboard</Text>
        </Stack>

        <Group>
          <Button size="lg" radius="xl" color="terracotta" onClick={() => navigate('/auth?mode=register')}>
            Get Started
          </Button>
          <Button size="lg" radius="xl" variant="transparent" c="muted" onClick={() => navigate('/auth?mode=login')}>
            Log in
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}
