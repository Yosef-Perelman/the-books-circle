import { useState, useEffect, useCallback } from 'react';
import { Container, Title, Card, Text, Group, Avatar, Stack, SimpleGrid, SegmentedControl, Box, Select, Loader, Center, Skeleton } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { circlesApi } from '../../api/circlesApi';
import { avatarColorFor } from '../../lib/avatarColor';
import { palette } from '../../theme';

const CATEGORIES = [
  { key: 'books', title: 'Read Books', description: (monthly) => `Books finished${monthly ? ' this month' : ''}` },
  { key: 'genres', title: 'Various Genres', description: (monthly) => `Different genres finished${monthly ? ' this month' : ''}` },
  { key: 'pages', title: 'Most Pages', description: (monthly) => `Pages read${monthly ? ' this month' : ''}` },
  { key: 'streak', title: 'Reading Streak', description: () => 'Consecutive weeks with a finished book' }
];

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [circles, setCircles] = useState([]);
  const [activeCircleId, setActiveCircleId] = useState(null);
  const [circlesLoading, setCirclesLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState(null);
  const [boardLoading, setBoardLoading] = useState(false);

  useEffect(() => {
    circlesApi.getMyCircles().then(data => {
      setCircles(data);
      if (data.length > 0) {
        setActiveCircleId(data[0].id);
      }
    }).finally(() => setCirclesLoading(false));
  }, []);

  const loadLeaderboard = useCallback(() => {
    if (!activeCircleId) return;
    setBoardLoading(true);
    circlesApi.getLeaderboard(activeCircleId, period).then(result => {
      setData(result);
    }).finally(() => setBoardLoading(false));
  }, [activeCircleId, period]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  if (circlesLoading) {
    return (
      <Center style={{ minHeight: 'calc(100vh - 70px)' }}>
        <Loader color="terracotta" />
      </Center>
    );
  }

  if (circles.length === 0) {
    return (
      <Center style={{ minHeight: 'calc(100vh - 70px)' }}>
        <Text c={palette.muted}>Join or create a circle to see a leaderboard.</Text>
      </Center>
    );
  }

  const activeCircleName = circles.find(c => c.id === activeCircleId)?.name || '';

  return (
    <Box bg="surface" style={{ minHeight: 'calc(100vh - 70px)' }} pt={60}>
      <Container size="md">

        {/* Header */}
        <Group justify="space-between" mb={60} align="flex-start">
          <Stack gap={4}>
            <Title order={1} style={{ fontFamily: 'Newsreader, serif', fontSize: '2.5rem' }}>
              Leaderboard
            </Title>
            {circles.length > 1 ? (
              <Select
                data={circles.map(c => ({ value: c.id, label: c.name }))}
                value={activeCircleId}
                onChange={setActiveCircleId}
                variant="unstyled"
                size="lg"
                styles={{ input: { color: 'var(--mantine-color-muted-text)', fontWeight: 600 } }}
              />
            ) : (
              <Text c={palette.muted} size="lg">{activeCircleName}</Text>
            )}
          </Stack>

          <SegmentedControl
            value={period === 'month' ? 'Monthly' : 'All-Time'}
            onChange={(value) => setPeriod(value === 'Monthly' ? 'month' : 'all')}
            data={['All-Time', 'Monthly']}
            radius="xl"
            size="md"
            color="terracotta"
            bg="cream"
            styles={{
              label: { fontWeight: 600 },
            }}
          />
        </Group>

        {boardLoading && (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={40}>
            {[1, 2, 3, 4].map(i => <Skeleton key={i} height={280} radius="xl" />)}
          </SimpleGrid>
        )}

        {!boardLoading && data && (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={40}>
            {CATEGORIES.map(category => (
              <LeaderboardCard
                key={category.key}
                title={category.title}
                description={category.description(period === 'month')}
                entries={data.categories[category.key] || []}
                memberCount={(data.categories[category.key] || []).length}
                onRowClick={(userId) => navigate(`/profile/${userId}`)}
              />
            ))}
          </SimpleGrid>
        )}
      </Container>
    </Box>
  );
}

function LeaderboardCard({ title, description, entries, memberCount, onRowClick }) {
  const getRankColor = (rank) => {
    if (rank === 1) return palette.gold;
    if (rank === 2) return palette.forest;
    if (rank === 3) return palette.sage;
    return palette.muted;
  };

  const top3 = entries.slice(0, 3);
  const allZero = entries.every(e => e.value === 0);
  const remainder = memberCount > 3 ? memberCount - 3 : 0;

  return (
    <Card radius="xl" p="xl" bg="cream" withBorder={false} style={{ boxShadow: '0 4px 15px rgba(58,50,42,0.02)' }}>
      <Stack gap={4} mb="xl">
        <Text fw={700} size="lg" style={{ borderBottom: `2px solid ${palette.terracotta}`, display: 'inline-block', paddingBottom: '4px' }}>
          {title}
        </Text>
        <Text size="sm" c={palette.muted}>{description}</Text>
      </Stack>

      {allZero ? (
        <Text c={palette.muted} ta="center" py="md">No finished books yet.</Text>
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
                <Box w={28} h={28} style={{ borderRadius: '50%', backgroundColor: getRankColor(entry.rank), color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                  {entry.rank}
                </Box>
                <Avatar size="md" radius="xl" src={entry.user.avatarUrl} style={{ backgroundColor: avatarColorFor(entry.user.id), color: 'white' }}>
                  {entry.user.name?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
                <Text size="md" fw={600} c={palette.ink}>{entry.user.name}</Text>
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
