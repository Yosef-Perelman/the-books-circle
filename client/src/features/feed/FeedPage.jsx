import { Box, Group, Title, Text, Avatar, Stack, Card, Badge, Button, TextInput, Divider } from '@mantine/core';
import { IconHeart, IconMessageCircle, IconPlus } from '@tabler/icons-react';

export default function FeedPage() {
  return (
    <Group align="stretch" gap={0} wrap="nowrap" style={{ minHeight: 'calc(100vh - 70px)' }}>
      
      {/* Left Sidebar: Circles */}
      <Box w={260} bg="cream" p="xl" style={{ borderRight: '1px solid #EADFC9' }}>
        <Text c="forest" size="sm" fw={700} lts={1} mb="xl">CIRCLES</Text>
        
        <Stack gap="sm">
          <Group p="sm" style={{ cursor: 'pointer' }}>
            <Avatar color="sage" radius="xl" size="md" />
            <Text fw={500}>Family</Text>
          </Group>

          <Group 
            p="sm" 
            bg="terracottaTint" 
            style={{ 
              borderRadius: '8px', 
              borderLeft: '4px solid #C96F4B', 
              cursor: 'pointer' 
            }}
          >
            <Avatar color="terracotta" radius="xl" size="md" />
            <Text fw={600} c="terracottaDark">Friends 1</Text>
          </Group>

          <Group p="sm" style={{ cursor: 'pointer' }}>
            <Avatar color="forest" radius="xl" size="md" />
            <Text fw={500}>Friends 2</Text>
          </Group>

          <Group p="sm" style={{ cursor: 'pointer' }}>
            <Avatar color="slate" radius="xl" size="md" />
            <Text fw={500}>Work</Text>
          </Group>
        </Stack>

        <Button 
          variant="outline" 
          color="terracotta" 
          fullWidth 
          mt="xl" 
          radius="xl"
          style={{ borderStyle: 'dashed' }}
          leftSection={<IconPlus size={16} />}
        >
          New circle
        </Button>
      </Box>

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

      {/* Right Sidebar: Members */}
      <Box w={280} bg="cream" p="xl" style={{ borderLeft: '1px solid #EADFC9' }}>
        <Text c="forest" size="sm" fw={700} lts={1} mb="xl">CIRCLE MEMBERS</Text>
        
        <Stack gap="md">
          <Group>
            <Avatar color="terracotta" radius="xl" size="md">B</Avatar>
            <Stack gap={0}>
              <Text fw={600} size="sm">Ben</Text>
              <Text size="xs" c="muted">in Friends 1</Text>
            </Stack>
          </Group>
          
          <Group>
            <Avatar color="forest" radius="xl" size="md">A</Avatar>
            <Stack gap={0}>
              <Text fw={600} size="sm">Avi</Text>
              <Text size="xs" c="muted">in Friends 1</Text>
            </Stack>
          </Group>
          
          <Group>
            <Avatar color="sage" radius="xl" size="md">G</Avatar>
            <Stack gap={0}>
              <Text fw={600} size="sm">Gadi</Text>
              <Text size="xs" c="muted">in Friends 1</Text>
            </Stack>
          </Group>
          
          <Group>
            <Avatar color="gold" radius="xl" size="md">G</Avatar>
            <Stack gap={0}>
              <Text fw={600} size="sm">Gossi</Text>
              <Text size="xs" c="muted">in Friends 1</Text>
            </Stack>
          </Group>

          <Group>
            <Avatar color="slate" radius="xl" size="md">D</Avatar>
            <Stack gap={0}>
              <Text fw={600} size="sm">Dan</Text>
              <Text size="xs" c="muted">in Friends 1</Text>
            </Stack>
          </Group>
        </Stack>
        
        <Text size="xs" c="muted" mt="xl" pt="xl" style={{ borderTop: '1px solid #EADFC9' }}>
          5 members · code F1-8KZQ
        </Text>
      </Box>

    </Group>
  );
}

// Mock component Container
function Container({ children, ...props }) {
  return <Box style={{ maxWidth: 700 }} mx="auto" {...props}>{children}</Box>;
}
