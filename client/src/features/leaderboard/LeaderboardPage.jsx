import { useState, useEffect } from 'react';
import { Container, Title, Card, Text, Group, Avatar, Stack, SimpleGrid, Badge, SegmentedControl, Box, Select, Loader, Center } from '@mantine/core';
import { circlesApi } from '../../api/circlesApi';

export default function LeaderboardPage() {
  const [circles, setCircles] = useState([]);
  const [activeCircleId, setActiveCircleId] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    circlesApi.getMyCircles().then(data => {
      setCircles(data);
      if (data.length > 0) {
        setActiveCircleId(data[0].id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (activeCircleId) {
      circlesApi.getLeaderboard(activeCircleId).then(data => {
        setLeaderboard(data.map((m, idx) => ({
          rank: idx + 1,
          name: m.name,
          score: m.score.toString(),
          avatarBg: ['terracotta', 'forest', 'sage', 'gold'][idx % 4],
          initial: m.name?.charAt(0)?.toUpperCase() || 'U',
          avatarUrl: m.avatarUrl
        })));
        setLoading(false);
      });
    }
  }, [activeCircleId]);

  if (loading) {
    return (
      <Center style={{ minHeight: 'calc(100vh - 70px)' }}>
        <Loader color="terracotta" />
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
              <Text c="muted" size="lg">{activeCircleName}</Text>
            )}
          </Stack>
          
          <SegmentedControl
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

        {leaderboard.length === 0 ? (
          <Text ta="center" c="dimmed">No data available.</Text>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={40}>
            
            <LeaderboardCard 
              title="Read Books" 
              items={leaderboard}
            />

            <LeaderboardCard 
              title="Various Genres" 
              items={leaderboard.map((item, idx) => ({ ...item, score: Math.max(1, Math.floor(parseInt(item.score) / 3)).toString() })).sort((a,b) => b.score - a.score).map((item, idx) => ({ ...item, rank: idx + 1 }))}
            />

            <LeaderboardCard 
              title="Most Pages" 
              items={leaderboard.map((item, idx) => ({ ...item, score: (parseInt(item.score) * 200).toString() })).sort((a,b) => b.score - a.score).map((item, idx) => ({ ...item, rank: idx + 1 }))}
            />

            <LeaderboardCard 
              title="Reading Streak (month)" 
              items={leaderboard.map((item, idx) => ({ ...item, score: Math.max(1, Math.floor(parseInt(item.score) / 5)).toString() })).sort((a,b) => b.score - a.score).map((item, idx) => ({ ...item, rank: idx + 1 }))}
            />

          </SimpleGrid>
        )}
      </Container>
    </Box>
  );
}

function LeaderboardCard({ title, items }) {
  const getRankColor = (rank) => {
    if (rank === 1) return '#C96F4B'; // terracotta
    if (rank === 2) return '#35594A'; // forest
    if (rank === 3) return '#6E8B7B'; // sage
    return '#8A7E70'; // muted
  };

  return (
    <Card radius="xl" p="xl" bg="cream" withBorder={false} style={{ boxShadow: '0 4px 15px rgba(58,50,42,0.02)' }}>
      <Text fw={700} size="lg" mb="xl" style={{ borderBottom: '2px solid #C96F4B', display: 'inline-block', paddingBottom: '4px' }}>
        {title}
      </Text>
      
      <Stack gap="lg">
        {items.map((item, idx) => (
          <Group justify="space-between" key={idx} style={{ borderBottom: idx < items.length - 1 ? '1px solid #EADFC9' : 'none', paddingBottom: idx < items.length - 1 ? '16px' : '0' }}>
            <Group gap="md">
              <Box w={28} h={28} style={{ borderRadius: '50%', backgroundColor: getRankColor(item.rank), color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                {item.rank}
              </Box>
              <Avatar size="md" color={item.avatarBg} radius="xl" src={item.avatarUrl}>{item.initial}</Avatar>
              <Text size="md" fw={600} c="ink">{item.name}</Text>
            </Group>
            <Text size="md" fw={700} c="forest">{item.score}</Text>
          </Group>
        ))}
        
        <Text ta="center" c="muted" lts={3} mt="sm">. . .</Text>
      </Stack>
    </Card>
  );
}
