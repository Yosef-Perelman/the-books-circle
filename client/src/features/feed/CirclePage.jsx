import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIntersection } from '@mantine/hooks';
import { Box, Group, Title, Text, Avatar, Stack, Button, Loader, Center, Container } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { circlesApi } from '../../api/circlesApi';
import { postsApi } from '../../api/postsApi';
import { useAuthStore } from '../../stores/authStore';
import CreatePostWidget from './CreatePostWidget';
import PostCard from './PostCard';
import { IconLogout, IconUserPlus } from '@tabler/icons-react';

export default function CirclePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { myCircleIds, refreshMyCircles } = useAuthStore();
  
  const [circle, setCircle] = useState(null);
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const { ref: loadMoreRef, entry } = useIntersection({
    root: null,
    threshold: 0.1,
  });

  const isMember = myCircleIds.some(cId => String(cId) === String(id));

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setOffset(0);
    setHasMore(true);

    Promise.all([
      circlesApi.getCircleById(id),
      circlesApi.getMembers(id),
      postsApi.getPosts(id, 0, 10)
    ]).then(([circleData, membersData, postsData]) => {
      if (isMounted) {
        setCircle(circleData);
        setMembers(membersData || []);
        setPosts(postsData || []);
        if (!postsData || postsData.length < 10) {
          setHasMore(false);
        } else {
          setOffset(10);
        }
      }
    }).catch(err => {
      console.error('Failed to fetch circle data:', err);
      if (isMounted) {
        notifications.show({ title: 'Error', message: 'Failed to load circle', color: 'red' });
        navigate('/feed');
      }
    }).finally(() => {
      if (isMounted) setLoading(false);
    });

    return () => { isMounted = false; };
  }, [id, navigate]);

  useEffect(() => {
    if (entry?.isIntersecting && hasMore && !loadingMore && !loading) {
      setLoadingMore(true);
      postsApi.getPosts(id, offset, 10).then(postsData => {
        if (postsData && postsData.length > 0) {
          setPosts(prev => {
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
  }, [entry?.isIntersecting, hasMore, loadingMore, loading, id, offset]);

  const handleJoinCircle = async () => {
    setActionLoading(true);
    try {
      await circlesApi.joinCircleById(id);
      await refreshMyCircles();
      const newMembers = await circlesApi.getMembers(id);
      setMembers(newMembers);
      notifications.show({ title: 'Success', message: `Joined ${circle.name}!`, color: 'green' });
    } catch (err) {
      console.error(err);
      notifications.show({ title: 'Error', message: err.message || 'Failed to join circle', color: 'red' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveCircle = async () => {
    if (!window.confirm(`Are you sure you want to leave ${circle.name}?`)) return;
    try {
      await circlesApi.leaveCircle(id);
      await refreshMyCircles();
      const newMembers = await circlesApi.getMembers(id);
      setMembers(newMembers);
      notifications.show({ title: 'Success', message: `Left ${circle.name}`, color: 'green' });
    } catch (err) {
      console.error(err);
      notifications.show({ title: 'Error', message: 'Failed to leave circle', color: 'red' });
    }
  };

  if (loading) {
    return (
      <Center style={{ minHeight: 'calc(100vh - 70px)' }}>
        <Loader color="terracotta" />
      </Center>
    );
  }

  if (!circle) return null;

  return (
    <Group align="stretch" gap={0} wrap="nowrap" style={{ minHeight: 'calc(100vh - 70px)' }}>
      {/* Center Feed */}
      <Box style={{ flex: 1 }} bg="surface" p={40}>
        <Container size="sm" mx="auto" p={0}>
          
          <Box mb="xl">
            <Title order={2} style={{ fontFamily: 'Newsreader, serif', color: '#3A322A' }}>{circle.name}</Title>
            <Text c="dimmed">{circle.memberCount} members</Text>
          </Box>

          {!isMember ? (
            <Box bg="cream" p="xl" mb="xl" style={{ borderRadius: '12px', border: '1px solid #EADFC9', textAlign: 'center' }}>
              <Text fw={600} size="lg" mb="sm">Join the Conversation</Text>
              <Text c="dimmed" mb="md">You need to be a member of this circle to post, react, or comment.</Text>
              <Button 
                color="terracotta" 
                radius="xl" 
                leftSection={<IconUserPlus size={18} />} 
                onClick={handleJoinCircle} 
                loading={actionLoading}
              >
                Join Circle
              </Button>
            </Box>
          ) : (
            <CreatePostWidget 
              onPostCreated={() => {
                setOffset(0);
                setHasMore(true);
                postsApi.getPosts(id, 0, 10).then(setPosts);
              }} 
              activeCircle={circle} 
            />
          )}

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
                        userReacted: increment > 0,
                        reactionsCount: p.reactionsCount + increment
                      };
                    }
                    return p;
                  }));
                }}
                onCommentAdded={(postId) => {
                  setPosts(current => current.map(p => p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p));
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

        </Container>
      </Box>

      {/* Right Sidebar: Members */}
      <Box w={280} bg="cream" p="xl" style={{ borderLeft: '1px solid #EADFC9' }}>
        <Text c="forest" size="sm" fw={700} lts={1} mb="xl">CIRCLE MEMBERS</Text>
        
        <Stack gap="md">
          {members.map(m => (
            <Group key={m.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/profile/${m.id}`)}>
              <Avatar color="terracotta" radius="xl" size="md" src={m.avatarUrl}>{m.name?.charAt(0) || 'M'}</Avatar>
              <Stack gap={0}>
                <Text fw={600} size="sm">{m.name}</Text>
                <Text size="xs" c="muted">in {circle.name}</Text>
              </Stack>
            </Group>
          ))}
        </Stack>
        
        {isMember && (
          <>
            <Text size="xs" c="muted" mt="xl" pt="xl" style={{ borderTop: '1px solid #EADFC9' }}>
              {members.length} members · code {circle.inviteCode || 'N/A'}
            </Text>

            <Button 
              variant="subtle" 
              color="red" 
              fullWidth 
              mt="md" 
              size="xs"
              leftSection={<IconLogout size={14} />}
              onClick={handleLeaveCircle}
            >
              Leave Circle
            </Button>
          </>
        )}
      </Box>
    </Group>
  );
}
