import { useState, useEffect } from 'react';
import { useIntersection } from '@mantine/hooks';
import { Box, Group, Title, Text, Avatar, Stack, Button, TextInput, Loader, Center, Modal, Tabs as MantineTabs } from '@mantine/core';
import { IconPlus, IconLogout, IconUsers } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { circlesApi } from '../../api/circlesApi';
import { postsApi } from '../../api/postsApi';
import CreatePostWidget from './CreatePostWidget';
import PostCard from './PostCard';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import { avatarColorFor } from '../../lib/avatarColor';

export default function FeedPage() {
  const navigate = useNavigate();
  const [circles, setCircles] = useState([]);
  const [circlesLoading, setCirclesLoading] = useState(true);
  const [activeCircle, setActiveCircle] = useState(null);
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);

  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Modal states
  const [modalOpened, setModalOpened] = useState(false);
  const [modalTab, setModalTab] = useState('create');
  const [newCircleName, setNewCircleName] = useState('');
  const [joinInviteCode, setJoinInviteCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [leaveConfirmOpened, setLeaveConfirmOpened] = useState(false);

  const { ref: loadMoreRef, entry } = useIntersection({
    root: null,
    threshold: 0.1, // trigger slightly before hitting the exact bottom
  });

  useEffect(() => {
    circlesApi.getMyCircles().then(data => {
      setCircles(data);
    }).catch(err => {
      console.error(err);
    }).finally(() => setCirclesLoading(false));
  }, []);

  const loadFeed = (silent = false) => {
    if (!activeCircle) return;
    if (!silent) setFeedLoading(true);
    setOffset(0);
    setHasMore(true);

    Promise.all([
      circlesApi.getMembers(activeCircle.id),
      postsApi.getPosts(activeCircle.id, 0, 10)
    ]).then(([membersData, postsData]) => {
      setMembers(membersData || []);
      setPosts(postsData || []);
      if (!postsData || postsData.length < 10) {
        setHasMore(false);
      } else {
        setOffset(10);
      }
    }).catch(err => {
      console.error('Failed to fetch circle data:', err);
    }).finally(() => {
      if (!silent) setFeedLoading(false);
    });
  };

  useEffect(() => {
    loadFeed();
  }, [activeCircle]);

  useEffect(() => {
    if (entry?.isIntersecting && hasMore && !loadingMore && !feedLoading && activeCircle) {
      setLoadingMore(true);
      postsApi.getPosts(activeCircle.id, offset, 10).then(postsData => {
        if (postsData && postsData.length > 0) {
          setPosts(prev => {
            // Prevent duplicates just in case
            const existingIds = new Set(prev.map(p => p.id));
            const newPosts = postsData.filter(p => !existingIds.has(p.id));
            return [...prev, ...newPosts];
          });
          setOffset(prev => prev + 10);
        }
        if (!postsData || postsData.length < 10) {
          setHasMore(false);
        }
      }).catch(err => {
        console.error('Failed to load more posts:', err);
      }).finally(() => setLoadingMore(false));
    }
  }, [entry?.isIntersecting, hasMore, loadingMore, feedLoading, activeCircle, offset]);

  const handleCreateCircle = async () => {
    if (!newCircleName.trim()) return;
    setActionLoading(true);
    try {
      const newCircle = await circlesApi.createCircle(newCircleName);
      setCircles(prev => [...prev, newCircle]);
      setActiveCircle(newCircle);
      setModalOpened(false);
      setNewCircleName('');
    } catch (err) {
      console.error(err);
      notifications.show({ title: 'Error', message: 'Failed to create circle', color: 'red' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinCircle = async () => {
    if (!joinInviteCode.trim()) return;
    setActionLoading(true);
    try {
      const joinedCircle = await circlesApi.joinCircle(joinInviteCode);
      setCircles(prev => {
        if (prev.find(c => c.id === joinedCircle.id)) return prev;
        return [...prev, joinedCircle];
      });
      setActiveCircle(joinedCircle);
      setModalOpened(false);
      setJoinInviteCode('');
    } catch (err) {
      console.error(err);
      notifications.show({ title: 'Error', message: err.message || 'Failed to join circle', color: 'red' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveCircle = async () => {
    if (!activeCircle) return;
    setActionLoading(true);
    try {
      await circlesApi.leaveCircle(activeCircle.id);
      const updatedCircles = circles.filter(c => c.id !== activeCircle.id);
      setCircles(updatedCircles);
      setActiveCircle(null);
      setLeaveConfirmOpened(false);
      notifications.show({ color: 'green', message: `Left ${activeCircle.name}.` });
    } catch (err) {
      console.error(err);
      notifications.show({ title: 'Error', message: 'Failed to leave circle', color: 'red' });
    } finally {
      setActionLoading(false);
    }
  };

  if (circlesLoading) {
    return (
      <Center style={{ minHeight: 'calc(100vh - 70px)' }}>
        <Loader color="terracotta" />
      </Center>
    );
  }

  return (
    <Group align="stretch" gap={0} wrap="nowrap" style={{ minHeight: 'calc(100vh - 70px)' }}>

      {/* Left Sidebar: Circles */}
      <Box w={260} bg="cream" p="xl" style={{ borderRight: '1px solid #EADFC9' }}>
        <Text c="forest" size="sm" fw={700} lts={1} mb="xl">CIRCLES</Text>

        <Stack gap="sm">
          {circles.map(c => (
            <Group
              key={c.id}
              p="sm"
              wrap="nowrap"
              onClick={() => setActiveCircle(c)}
              bg={activeCircle?.id === c.id ? "terracottaTint" : "transparent"}
              style={{
                borderRadius: '8px',
                borderLeft: activeCircle?.id === c.id ? '4px solid #C96F4B' : '4px solid transparent',
                cursor: 'pointer'
              }}
            >
              <Avatar radius="xl" size="md" style={{ backgroundColor: avatarColorFor(c.id), color: 'white' }}>
                {c.name.charAt(0)}
              </Avatar>
              <Text
                fw={activeCircle?.id === c.id ? 600 : 500}
                c={activeCircle?.id === c.id ? "terracottaDark" : "forest"}
                style={{ flex: 1, lineHeight: 1.3 }}
                lineClamp={2}
              >
                {c.name}
              </Text>
            </Group>
          ))}
        </Stack>

        <Button
          variant="outline"
          color="terracotta"
          fullWidth
          mt="xl"
          radius="xl"
          style={{ borderStyle: 'dashed' }}
          leftSection={<IconPlus size={16} />}
          onClick={() => setModalOpened(true)}
        >
          New circle
        </Button>
      </Box>

      {/* Center Feed */}
      <Box style={{ flex: 1 }} bg="surface" p={40}>
        <Container size="sm" mx="auto" p={0}>

          {!activeCircle && (
            <Center style={{ minHeight: '50vh' }}>
              {circles.length === 0 ? (
                <EmptyState
                  icon={IconUsers}
                  title="You're not in a circle yet"
                  message="Join a friend's circle with their code, or start your own."
                  actionLabel="Join or create a circle"
                  onAction={() => setModalOpened(true)}
                />
              ) : (
                <EmptyState
                  icon={IconUsers}
                  title="Pick a circle"
                  message="Choose a circle on the left to see what they're reading."
                />
              )}
            </Center>
          )}

          {activeCircle && feedLoading && (
            <Center py="xl"><Loader color="terracotta" /></Center>
          )}

          {activeCircle && !feedLoading && (
            <>
              <CreatePostWidget
                onPostCreated={() => loadFeed(true)}
                activeCircle={activeCircle}
              />

              <Stack gap="lg">
                {posts.length === 0 && (
                  <Text ta="center" c="dimmed" mt="xl">No recent activity.</Text>
                )}

                {posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onReactionUpdate={(postId, increment) => {
                      setPosts(current => current.map(p => {
                        if (p.id === postId) {
                          return {
                            ...p,
                            userReacted: increment > 0, // In simple toggle, +1 means we reacted, -1 means unreacted
                            reactionsCount: p.reactionsCount + increment
                          };
                        }
                        return p;
                      }));
                    }}
                    onCommentAdded={(postId) => {
                      setPosts(current => current.map(p => p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p));
                    }}
                    onPostDeleted={(postId) => {
                      setPosts(current => current.filter(p => p.id !== postId));
                    }}
                  />
                ))}

                {hasMore && posts.length > 0 && (
                  <div ref={loadMoreRef} style={{ padding: '20px', textAlign: 'center' }}>
                    <Loader color="terracotta" size="sm" />
                  </div>
                )}
                {!hasMore && posts.length > 0 && (
                  <Text ta="center" c="dimmed" mt="md">You've reached the end.</Text>
                )}
              </Stack>
            </>
          )}

        </Container>
      </Box>

      {/* Right Sidebar: Members */}
      {activeCircle && (
        <Box w={280} bg="cream" p="xl" style={{ borderLeft: '1px solid #EADFC9' }}>
          <Text c="forest" size="sm" fw={700} lts={1} mb="xl">CIRCLE MEMBERS</Text>

          <Stack gap="md">
            {members.map(m => (
              <Group key={m.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/profile/${m.id}`)}>
                <Avatar radius="xl" size="md" src={m.avatarUrl} style={{ backgroundColor: avatarColorFor(m.id), color: 'white' }}>
                  {m.name?.charAt(0) || 'M'}
                </Avatar>
                <Stack gap={0}>
                  <Text fw={600} size="sm">{m.name}</Text>
                  <Text size="xs" c="muted">in {activeCircle.name}</Text>
                </Stack>
              </Group>
            ))}
          </Stack>

          <Text size="xs" c="muted" mt="xl" pt="xl" style={{ borderTop: '1px solid #EADFC9' }}>
            {members.length} members · code {activeCircle.inviteCode || 'N/A'}
          </Text>

          <Button
            variant="subtle"
            color="red"
            fullWidth
            mt="md"
            size="xs"
            leftSection={<IconLogout size={14} />}
            onClick={() => setLeaveConfirmOpened(true)}
          >
            Leave Circle
          </Button>
        </Box>
      )}

      {/* Modal for Create/Join Circle */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={<Title order={3} style={{ fontFamily: 'Newsreader, serif' }}>New Circle</Title>}
        centered
        radius="lg"
      >
        <MantineTabs value={modalTab} onChange={setModalTab} color="terracotta" mt="sm">
          <MantineTabs.List grow mb="md">
            <MantineTabs.Tab value="create">Create</MantineTabs.Tab>
            <MantineTabs.Tab value="join">Join</MantineTabs.Tab>
          </MantineTabs.List>

          <MantineTabs.Panel value="create">
            <Stack gap="md">
              <Text size="sm" c="dimmed">Create a new reading circle and invite your friends.</Text>
              <TextInput
                label="Circle Name"
                placeholder="e.g. Sci-Fi Lovers"
                value={newCircleName}
                onChange={e => setNewCircleName(e.target.value)}
              />
              <Button color="terracotta" onClick={handleCreateCircle} loading={actionLoading} disabled={!newCircleName.trim()}>Create</Button>
            </Stack>
          </MantineTabs.Panel>

          <MantineTabs.Panel value="join">
            <Stack gap="md">
              <Text size="sm" c="dimmed">Have an invite code? Enter it below to join an existing circle.</Text>
              <TextInput
                label="Invite Code"
                placeholder="e.g. SCIFI123"
                value={joinInviteCode}
                onChange={e => setJoinInviteCode(e.target.value)}
              />
              <Button color="terracotta" onClick={handleJoinCircle} loading={actionLoading} disabled={!joinInviteCode.trim()}>Join</Button>
            </Stack>
          </MantineTabs.Panel>
        </MantineTabs>
      </Modal>

      <ConfirmDialog
        opened={leaveConfirmOpened}
        onClose={() => setLeaveConfirmOpened(false)}
        onConfirm={handleLeaveCircle}
        title="Leave circle?"
        message={activeCircle ? `Are you sure you want to leave ${activeCircle.name}?` : ''}
        confirmLabel="Leave"
        danger
        loading={actionLoading}
      />

    </Group>
  );
}

function Container({ children, ...props }) {
  return <Box style={{ maxWidth: 700 }} mx="auto" {...props}>{children}</Box>;
}
