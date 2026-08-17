import { useCallback, useEffect, useState } from 'react';
import { Box, Group, Stack, Card, Skeleton, Container } from '@mantine/core';
import { IconUsers, IconBooks } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useCircleStore } from '../../stores/circleStore';
import { useUiStore } from '../../stores/uiStore';
import { feedApi } from '../../api/feedApi';
import CirclesSidebar from '../circles/CirclesSidebar';
import MembersSidebar from '../circles/MembersSidebar';
import JoinCreateCircleModal from '../circles/JoinCreateCircleModal';
import PostComposer from './PostComposer';
import PostCard from './PostCard';
import EmptyState from '../../components/EmptyState';
import ErrorBanner from '../../components/ErrorBanner';

function FeedSkeleton() {
  return (
    <Stack gap="lg">
      {[1, 2, 3].map((i) => (
        <Card key={i} p={20}>
          <Group mb="md">
            <Skeleton height={40} circle />
            <Stack gap={6} style={{ flex: 1 }}>
              <Skeleton height={12} width="30%" />
              <Skeleton height={10} width="50%" />
            </Stack>
          </Group>
          <Skeleton height={60} />
        </Card>
      ))}
    </Stack>
  );
}

export default function FeedPage() {
  const activeCircleId = useCircleStore((state) => state.activeCircleId);
  const circles = useCircleStore((state) => state.circles);
  const loadMembers = useCircleStore((state) => state.loadMembers);
  const modal = useUiStore((state) => state.modal);
  const openModal = useUiStore((state) => state.openModal);
  const closeModal = useUiStore((state) => state.closeModal);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeCircleId) loadMembers();
  }, [activeCircleId, loadMembers]);

  const loadFeed = useCallback(async () => {
    if (!activeCircleId) return;
    setLoading(true);
    setError(null);
    try {
      const { posts: fetched } = await feedApi.getFeed(activeCircleId);
      setPosts(fetched);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeCircleId]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // Zero circles: auto-open the join/create modal on first mount instead of
  // rendering a feed that has nothing circle-scoped to show.
  useEffect(() => {
    if (circles.length === 0) openModal('joinCircle');
  }, [circles.length, openModal]);

  async function handleToggleLike(post) {
    const wasLiked = post.likedByMe;
    const prevCount = post.likeCount;

    setPosts((current) =>
      current.map((p) =>
        p.id === post.id ? { ...p, likedByMe: !wasLiked, likeCount: wasLiked ? prevCount - 1 : prevCount + 1 } : p
      )
    );

    try {
      const result = wasLiked ? await feedApi.unlikePost(post.id) : await feedApi.likePost(post.id);
      setPosts((current) => current.map((p) => (p.id === post.id ? { ...p, ...result } : p)));
    } catch {
      setPosts((current) =>
        current.map((p) => (p.id === post.id ? { ...p, likedByMe: wasLiked, likeCount: prevCount } : p))
      );
      notifications.show({ color: 'red', message: 'Could not update your like. Please try again.' });
    }
  }

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
    <>
      <Group align="stretch" gap={0} wrap="nowrap" style={{ minHeight: 'calc(100vh - 70px)' }}>
        <CirclesSidebar onNewCircle={() => openModal('joinCircle')} />

        <Box style={{ flex: 1 }} bg="surface" p={40}>
          <Container size="sm" mx="auto" p={0}>
            <PostComposer />

            {loading && <FeedSkeleton />}

            {!loading && error && <ErrorBanner message={error} onRetry={loadFeed} />}

            {!loading && !error && posts.length === 0 && (
              <EmptyState
                icon={IconBooks}
                title="Nothing here yet"
                message="Add a book to get your circle started."
                actionLabel="Add a book"
                onAction={() => openModal('addBook')}
              />
            )}

            {!loading && !error && posts.length > 0 && (
              <Stack gap="lg">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} onToggleLike={handleToggleLike} />
                ))}
              </Stack>
            )}
          </Container>
        </Box>

        <MembersSidebar />
      </Group>
      <JoinCreateCircleModal opened={modal?.type === 'joinCircle'} onClose={closeModal} />
    </>
  );
}
