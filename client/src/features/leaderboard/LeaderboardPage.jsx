import { useCallback, useEffect, useState } from 'react';
import { Container, Title, Card, Text, Group, Avatar, Stack, SegmentedControl, Box, SimpleGrid, Skeleton } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useCircleStore } from '../../stores/circleStore';
import { useUiStore } from '../../stores/uiStore';
import { leaderboardApi } from '../../api/leaderboardApi';
import JoinCreateCircleModal from '../circles/JoinCreateCircleModal';
import EmptyState from '../../components/EmptyState';
import ErrorBanner from '../../components/ErrorBanner';
import { palette } from '../../theme';

const CATEGORIES = [
  { key: 'books', title: 'Read Books', description: (monthly) => `Books finished${monthly ? ' this month' : ''}` },
  { key: 'genres', title: 'Various Genres', description: (monthly) => `Different genres finished${monthly ? ' this month' : ''}` },
  { key: 'pages', title: 'Most Pages', description: (monthly) => `Pages read${monthly ? ' this month' : ''}` },
  { key: 'streak', title: 'Reading Streak', description: () => 'Consecutive weeks with a finished book' }
];

function rankColor(rank) {
  if (rank === 1) return palette.gold;
  if (rank === 2) return palette.forest;
  if (rank === 3) return palette.sage;
  return palette.muted;
}

function LeaderboardSkeleton() {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={40}>
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} radius="xl" p="xl">
          <Skeleton height={20} width="40%" mb="xl" />
          <Stack gap="lg">
            {[1, 2, 3].map((j) => (
              <Group key={j} justify="space-between">
                <Group gap="md">
                  <Skeleton height={28} circle />
                  <Skeleton height={28} circle />
                  <Skeleton height={14} width={80} />
                </Group>
                <Skeleton height={14} width={30} />
              </Group>
            ))}
          </Stack>
        </Card>
      ))}
    </SimpleGrid>
  );
}

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const activeCircleId = useCircleStore((state) => state.activeCircleId);
  const circles = useCircleStore((state) => state.circles);
  const members = useCircleStore((state) => state.members);
  const loadMembers = useCircleStore((state) => state.loadMembers);
  const modal = useUiStore((state) => state.modal);
  const openModal = useUiStore((state) => state.openModal);
  const closeModal = useUiStore((state) => state.closeModal);

  const [period, setPeriod] = useState('month');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const activeCircle = circles.find((c) => c.id === activeCircleId);

  const loadLeaderboard = useCallback(async () => {
    if (!activeCircleId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await leaderboardApi.getLeaderboard(activeCircleId, period);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeCircleId, period]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  useEffect(() => {
    if (activeCircleId) loadMembers();
  }, [activeCircleId, loadMembers]);

  if (circles.length === 0) {
    return (
      <>
        <Box style={{ minHeight: 'calc(100vh - 70px)' }} display="flex" pt={80}>
          <EmptyState
            icon={IconUsers}
            title="You're not in a circle yet"
            message="Join a friend's circle with their code, or start your own."
            actionLabel="Join or create a circle"
            onAction={() => openModal('joinCircle')}
          />
        </Box>
        <JoinCreateCircleModal opened={modal?.type === 'joinCircle'} onClose={closeModal} />
      </>
    );
  }

  return (
    <Box bg="surface" pt={60} pb={80} style={{ minHeight: 'calc(100vh - 70px)' }}>
      <Container size="md">
        <Group justify="space-between" mb={60} align="flex-start">
          <Stack gap={4}>
            <Title order={1} style={{ fontFamily: 'Newsreader, serif', fontSize: '2.5rem' }}>
              Leaderboard
            </Title>
            <Text c={palette.muted} size="lg">{activeCircle?.name}</Text>
          </Stack>

          <SegmentedControl
            value={period === 'month' ? 'Monthly' : 'All-Time'}
            onChange={(value) => setPeriod(value === 'Monthly' ? 'month' : 'all')}
            data={['All-Time', 'Monthly']}
            radius="xl"
            size="md"
            color="terracotta"
            bg={palette.cream}
            styles={{ label: { fontWeight: 600 } }}
          />
        </Group>

        {loading && <LeaderboardSkeleton />}

        {!loading && error && <ErrorBanner message={error} onRetry={loadLeaderboard} />}

        {!loading && !error && data && (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={40}>
            {CATEGORIES.map((category) => (
              <LeaderboardCard
                key={category.key}
                title={category.title}
                description={category.description(period === 'month')}
                emptyMessage={`No finished books yet${period === 'month' ? ' this month' : ''}.`}
                entries={data.categories[category.key]}
                memberCount={members.length}
                onRowClick={(userId) => navigate(`/profile/${userId}`)}
              />
            ))}
          </SimpleGrid>
        )}
      </Container>
    </Box>
  );
}

function LeaderboardCard({ title, description, emptyMessage, entries, memberCount, onRowClick }) {
  const top3 = entries.slice(0, 3);
  const allZero = entries.every((entry) => entry.value === 0);
  const remainder = memberCount > 3 ? memberCount - 3 : 0;

  return (
    <Card radius="xl" p="xl">
      <Stack gap={4} mb="xl">
        <Text
          fw={700}
          size="lg"
          style={{ borderBottom: `2px solid ${palette.terracotta}`, display: 'inline-block', paddingBottom: '4px' }}
        >
          {title}
        </Text>
        <Text size="sm" c={palette.muted}>{description}</Text>
      </Stack>

      {allZero ? (
        <Text c={palette.muted} ta="center" py="md">{emptyMessage}</Text>
      ) : (
        <Stack gap="lg">
          {top3.map((entry, idx) => (
            <Group
              justify="space-between"
              key={entry.user.id}
              style={{
                cursor: 'pointer',
                borderBottom: idx < top3.length - 1 ? `1px solid ${palette.line}` : 'none',
                paddingBottom: idx < top3.length - 1 ? '16px' : '0'
              }}
              onClick={() => onRowClick(entry.user.id)}
            >
              <Group gap="md">
                <Box
                  w={28}
                  h={28}
                  style={{
                    borderRadius: '50%',
                    backgroundColor: rankColor(entry.rank),
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.9rem'
                  }}
                >
                  {entry.rank}
                </Box>
                <Avatar size="md" radius="xl" src={entry.user.avatarUrl}>
                  {entry.user.displayName?.charAt(0).toUpperCase()}
                </Avatar>
                <Text size="md" fw={600} c={palette.ink}>{entry.user.displayName}</Text>
              </Group>
              <Text size="md" fw={700} c={palette.forest} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {entry.value.toLocaleString()}
              </Text>
            </Group>
          ))}

          {remainder > 0 && (
            <Text ta="center" c={palette.muted} size="sm" mt="sm">+{remainder} more</Text>
          )}
        </Stack>
      )}
    </Card>
  );
}
