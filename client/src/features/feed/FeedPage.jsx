import { useEffect, useState } from 'react';
import { Box, Group, Text, Avatar, Stack, Card, Button, TextInput, Divider } from '@mantine/core';
import { IconHeart, IconMessageCircle, IconPlus, IconUsers } from '@tabler/icons-react';
import { useCircleStore } from '../../stores/circleStore';
import CirclesSidebar from '../circles/CirclesSidebar';
import MembersSidebar from '../circles/MembersSidebar';
import JoinCreateCircleModal from '../circles/JoinCreateCircleModal';
import EmptyState from '../../components/EmptyState';

export default function FeedPage() {
  const activeCircleId = useCircleStore((state) => state.activeCircleId);
  const circles = useCircleStore((state) => state.circles);
  const loadMembers = useCircleStore((state) => state.loadMembers);
  const [circleModalOpened, setCircleModalOpened] = useState(false);

  useEffect(() => {
    if (activeCircleId) loadMembers();
  }, [activeCircleId, loadMembers]);

  // Zero circles: auto-open the join/create modal on first mount instead of
  // rendering a feed that has nothing circle-scoped to show.
  useEffect(() => {
    if (circles.length === 0) setCircleModalOpened(true);
  }, [circles.length]);

  if (circles.length === 0) {
    return (
      <>
        <Box style={{ minHeight: 'calc(100vh - 70px)' }} display="flex" pt={80}>
          <EmptyState
            icon={IconUsers}
            title="You're not in a circle yet"
            message="Join a friend's circle with their code, or start your own."
            actionLabel="Join or create a circle"
            onAction={() => setCircleModalOpened(true)}
          />
        </Box>
        <JoinCreateCircleModal opened={circleModalOpened} onClose={() => setCircleModalOpened(false)} />
      </>
    );
  }

  return (
    <>
    <Group align="stretch" gap={0} wrap="nowrap" style={{ minHeight: 'calc(100vh - 70px)' }}>

      <CirclesSidebar onNewCircle={() => setCircleModalOpened(true)} />

      {/* Center Feed */}
      <Box style={{ flex: 1 }} bg="surface" p={40}>
        <Container size="sm" mx="auto" p={0}>
          
          <Card radius="xl" p="md" withBorder style={{ borderColor: '#EADFC9' }} mb="xl">
            <Group>
              <TextInput 
                placeholder="Add a post — what are you reading?" 
                style={{ flex: 1 }} 
                variant="unstyled" 
                size="md"
              />
              <Button color="terracotta" radius="xl" leftSection={<IconPlus size={16} />}>
                Post
              </Button>
            </Group>
          </Card>

          <Stack gap="lg">
            {/* Post 1 */}
            <Card radius="xl" p="xl" withBorder style={{ borderColor: '#EADFC9', boxShadow: '0 4px 20px rgba(58,50,42,0.03)' }}>
              <Group mb="md" align="flex-start">
                <Avatar color="slate" radius="xl">D</Avatar>
                <Stack gap={0}>
                  <Text fw={600}>Dan</Text>
                  <Text size="xs" c="muted">started reading · 2h</Text>
                </Stack>
              </Group>
              <Group align="flex-start">
                <Box w={40} h={60} bg="forest" style={{ borderRadius: '4px' }} />
                <Stack gap={0}>
                  <Text fw={700}>The Hobbit</Text>
                  <Text size="sm" c="muted">J.R.R. Tolkien</Text>
                </Stack>
              </Group>
            </Card>

            {/* Post 2 */}
            <Card radius="xl" p="xl" withBorder style={{ borderColor: '#EADFC9', boxShadow: '0 4px 20px rgba(58,50,42,0.03)' }}>
              <Group mb="md" align="flex-start">
                <Avatar color="terracotta" radius="xl">B</Avatar>
                <Stack gap={0}>
                  <Text fw={600}>Ben</Text>
                  <Text size="xs" c="muted">added to want to read · 4h</Text>
                </Stack>
              </Group>
              <Group align="flex-start">
                <Box w={40} h={60} bg="gold" style={{ borderRadius: '4px' }} />
                <Stack gap={0}>
                  <Text fw={700}>Harry Potter and the Sorcerer's Stone</Text>
                  <Text size="sm" c="muted">J.K. Rowling</Text>
                </Stack>
              </Group>
            </Card>

            {/* Post 3: Review */}
            <Card radius="xl" p="xl" withBorder style={{ borderColor: '#EADFC9', boxShadow: '0 4px 20px rgba(58,50,42,0.03)' }}>
              <Group mb="md" align="flex-start">
                <Avatar color="forest" radius="xl">A</Avatar>
                <Stack gap={0}>
                  <Text fw={600}>Avi</Text>
                  <Text size="xs" c="muted">finished a book · 6h</Text>
                </Stack>
              </Group>
              
              <Group align="flex-start" mb="md">
                <Box w={60} h={90} bg="sage" style={{ borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text size="xs" c="white" fw={700} ta="center">THE<br/>HOBBIT</Text>
                </Box>
                <Stack gap={4}>
                  <Text fw={700} size="lg">The Hobbit</Text>
                  <Text size="sm" c="muted">J.R.R. Tolkien</Text>
                  <Group gap={4}>
                    {[1,2,3,4].map(i => <Text key={i} c="terracotta">★</Text>)}
                    <Text c="terracotta">⯪</Text>
                    <Text size="sm" fw={600} ml="xs">4.5</Text>
                  </Group>
                </Stack>
              </Group>

              <Text size="md" style={{ lineHeight: 1.6 }} mb="xl">
                "A cosy, perfect adventure to start with. Bilbo's reluctant-hero arc still holds up decades later — equal parts funny and quietly moving. If you've only seen the films, the book is warmer and much, much funnier."
              </Text>

              <Divider color="line" mb="md" />

              <Group gap="xl">
                <Group gap="xs" style={{ cursor: 'pointer' }}>
                  <IconHeart size={18} stroke={2} color="#C96F4B" fill="#C96F4B" />
                  <Text size="sm" fw={500} c="terracottaDark">7</Text>
                </Group>
                <Group gap="xs" style={{ cursor: 'pointer' }}>
                  <IconMessageCircle size={18} stroke={1.5} color="#8A7E70" />
                  <Text size="sm" fw={500} c="muted">3</Text>
                </Group>
              </Group>
            </Card>

          </Stack>

        </Container>
      </Box>

      <MembersSidebar />

    </Group>
    <JoinCreateCircleModal opened={circleModalOpened} onClose={() => setCircleModalOpened(false)} />
    </>
  );
}

// Mock component Container
function Container({ children, ...props }) {
  return <Box style={{ maxWidth: 700 }} mx="auto" {...props}>{children}</Box>;
}
