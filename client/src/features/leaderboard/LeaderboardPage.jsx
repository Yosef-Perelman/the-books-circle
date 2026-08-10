import { Container, Title, Card, Text, Group, Avatar, Stack, SimpleGrid, Badge, SegmentedControl, Box } from '@mantine/core';

export default function LeaderboardPage() {
  return (
    <Box bg="surface" style={{ minHeight: 'calc(100vh - 70px)' }} pt={60}>
      <Container size="md">
        
        {/* Header */}
        <Group justify="space-between" mb={60} align="flex-start">
          <Stack gap={4}>
            <Title order={1} style={{ fontFamily: 'Newsreader, serif', fontSize: '2.5rem' }}>
              Leaderboard
            </Title>
            <Text c="muted" size="lg">Friends 1</Text>
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

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={40}>
          
          {/* Read Books */}
          <LeaderboardCard 
            title="Read Books" 
            items={[
              { rank: 1, name: 'Ben', score: '21', avatarBg: 'terracotta', initial: 'B' },
              { rank: 2, name: 'Gadi', score: '15', avatarBg: 'sage', initial: 'G' },
              { rank: 3, name: 'Avi', score: '12', avatarBg: 'forest', initial: 'A' },
            ]}
          />

          {/* Various Genres */}
          <LeaderboardCard 
            title="Various Genres" 
            items={[
              { rank: 1, name: 'Ben', score: '4', avatarBg: 'terracotta', initial: 'B' },
              { rank: 2, name: 'Gadi', score: '2', avatarBg: 'sage', initial: 'G' },
              { rank: 3, name: 'Dan', score: '2', avatarBg: 'slate', initial: 'D' },
            ]}
          />

          {/* Most Pages */}
          <LeaderboardCard 
            title="Most Pages" 
            items={[
              { rank: 1, name: 'Ben', score: '2,281', avatarBg: 'terracotta', initial: 'B' },
              { rank: 2, name: 'Avi', score: '1,926', avatarBg: 'forest', initial: 'A' },
              { rank: 3, name: 'Gossi', score: '1,400', avatarBg: 'gold', initial: 'G' },
            ]}
          />

          {/* Reading Streak */}
          <LeaderboardCard 
            title="Reading Streak (month)" 
            items={[
              { rank: 1, name: 'Ben', score: '6', avatarBg: 'terracotta', initial: 'B' },
              { rank: 2, name: 'Avi', score: '4', avatarBg: 'forest', initial: 'A' },
              { rank: 3, name: 'Gadi', score: '3', avatarBg: 'sage', initial: 'G' },
            ]}
          />

        </SimpleGrid>
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
              <Avatar size="md" color={item.avatarBg} radius="xl">{item.initial}</Avatar>
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
