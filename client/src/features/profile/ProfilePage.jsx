import { Container, Title, Text, Group, Avatar, Stack, Tabs, Card, Badge, Box } from '@mantine/core';

export default function ProfilePage() {
  return (
    <Box bg="surface" style={{ minHeight: 'calc(100vh - 70px)' }} pt={60}>
      <Container size="md">
        
        {/* Profile Header */}
        <Group align="flex-start" gap="xl" mb={60} justify="center">
          <Avatar color="terracotta" size={100} radius={100} style={{ fontSize: '2.5rem' }}>
            C
          </Avatar>
          <Stack gap={4}>
            <Title order={1} style={{ fontFamily: 'Newsreader, serif', fontSize: '2.5rem' }}>
              Chen
            </Title>
            <Text c="muted" size="lg">in Friends 1</Text>
            <Text c="sage" fw={600} mt="xs">
              24 books · 18 reviews · 3 currently reading
            </Text>
          </Stack>
        </Group>

        {/* Tabs */}
        <Tabs defaultValue="finished" color="terracotta" variant="unstyled" classNames={{
          tab: 'custom-tab',
        }}>
          <Tabs.List style={{ borderBottom: '1px solid #EADFC9', paddingBottom: '0' }} mb="xl">
            <Tabs.Tab 
              value="want" 
              px="xl" 
              py="md"
              style={(theme) => ({ 
                fontSize: '1.1rem',
                color: '#8A7E70'
              })}
            >
              Want to read
            </Tabs.Tab>
            <Tabs.Tab 
              value="reading" 
              px="xl" 
              py="md"
              style={(theme) => ({ 
                fontSize: '1.1rem',
                color: '#8A7E70'
              })}
            >
              Reading
            </Tabs.Tab>
            <Tabs.Tab 
              value="finished" 
              px="xl" 
              py="md"
              style={(theme) => ({ 
                fontSize: '1.1rem',
                fontWeight: 600,
                color: '#C96F4B',
                borderBottom: '3px solid #C96F4B'
              })}
            >
              Finished
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="finished">
            <Stack gap="md">
              <BookCard 
                coverColor="forest" 
                coverTitle="DUNE"
                title="Dune" 
                author="Frank Herbert" 
                stars={4} 
                quote="A slow burn that took over my whole week..."
              />
              <BookCard 
                coverColor="slate" 
                coverTitle="THE HOBBIT"
                title="The Hobbit" 
                author="J.R.R. Tolkien" 
                stars={5} 
                quote="Comfort reading at its finest..."
              />
              <BookCard 
                coverColor="terracotta" 
                coverTitle="1984"
                title="1984" 
                author="George Orwell" 
                stars={3.5} 
                quote="Still hits hard. Bleak but essential..."
              />
              <BookCard 
                coverColor="gold" 
                coverTitle="EDUCATED"
                title="Educated" 
                author="Tara Westover" 
                stars={4.5} 
                quote="Couldn't put it down..."
              />
            </Stack>
          </Tabs.Panel>
        </Tabs>
        
      </Container>
    </Box>
  );
}

function BookCard({ coverColor, coverTitle, title, author, stars, quote }) {
  return (
    <Card radius="xl" p="lg" withBorder bg="surface" style={{ borderColor: '#EADFC9', boxShadow: '0 4px 20px rgba(58,50,42,0.03)' }}>
      <Group justify="space-between" align="center" wrap="nowrap">
        <Group align="flex-start" wrap="nowrap">
          <Box w={60} h={90} bg={coverColor} style={{ borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {coverTitle && (
              <Text size="xs" c="white" fw={700} ta="center" style={{ lineHeight: 1.2 }}>
                {coverTitle.split(' ').map((w, i) => <span key={i}>{w}<br/></span>)}
              </Text>
            )}
          </Box>
          <Stack gap={2} mt={4}>
            <Text fw={700} size="lg">{title}</Text>
            <Text size="sm" c="muted">{author}</Text>
            <Group gap={2} mt={4}>
              {[1,2,3,4,5].map(i => (
                <Text key={i} c={i <= stars ? "terracotta" : "line"}>★</Text>
              ))}
            </Group>
            <Text size="sm" fs="italic" mt="xs" c="ink">
              "{quote}"
            </Text>
          </Stack>
        </Group>

        <Group gap="xs">
          <Badge color="line" variant="outline" c="muted" radius="xl" size="lg" style={{ fontWeight: 500, textTransform: 'none' }}>Want</Badge>
          <Badge color="line" variant="outline" c="muted" radius="xl" size="lg" style={{ fontWeight: 500, textTransform: 'none' }}>Reading</Badge>
          <Badge color="terracotta" variant="filled" radius="xl" size="lg" style={{ fontWeight: 600, textTransform: 'none' }}>Finished</Badge>
        </Group>
      </Group>
    </Card>
  );
}
