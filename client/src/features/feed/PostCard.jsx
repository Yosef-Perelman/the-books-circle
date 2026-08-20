import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Card, Group, Avatar, Stack, Text, Box, Center, Loader, TextInput, Button, Modal, ActionIcon } from '@mantine/core';
import { IconHeart, IconMessageCircle, IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { postsApi } from '../../api/postsApi';
import { circlesApi } from '../../api/circlesApi';
import { useAuthStore } from '../../stores/authStore';
import ConfirmDialog from '../../components/ConfirmDialog';
import { avatarColorFor } from '../../lib/avatarColor';

export default function PostCard({ post, onReactionUpdate = () => {}, onCommentAdded = () => {}, onPostDeleted = () => {} }) {
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [joinModalOpened, setJoinModalOpened] = useState(false);
  const [deleteConfirmOpened, setDeleteConfirmOpened] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { user, myCircleIds, refreshMyCircles } = useAuthStore();

  const requireMembership = () => {
    if (post.circle && !myCircleIds.some(cId => String(cId) === String(post.circle.id))) {
      setJoinModalOpened(true);
      return true;
    }
    return false;
  };

  const handleDeletePost = async () => {
    setActionLoading(true);
    try {
      await postsApi.deletePost(post.id);
      onPostDeleted(post.id);
      notifications.show({ title: 'Success', message: 'Post deleted', color: 'green' });
    } catch (err) {
      notifications.show({ title: 'Error', message: 'Failed to delete post', color: 'red' });
    } finally {
      setActionLoading(false);
      setDeleteConfirmOpened(false);
    }
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    if (requireMembership()) return;
    
    const isCurrentlyReacted = post.userReacted;
    onReactionUpdate(post.id, isCurrentlyReacted ? -1 : 1);
    try {
      await postsApi.toggleReaction(post.id);
    } catch (err) {
      // Revert if failed
      onReactionUpdate(post.id, isCurrentlyReacted ? 1 : -1);
    }
  };

  const handleToggleComments = async (e) => {
    e.stopPropagation();
    if (!showComments && comments.length === 0 && post.commentsCount > 0) {
      setLoadingComments(true);
      try {
        const data = await postsApi.getComments(post.id);
        setComments(data);
      } finally {
        setLoadingComments(false);
      }
    }
    setShowComments(!showComments);
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (requireMembership()) return;
    if (!newComment.trim()) return;
    try {
      const added = await postsApi.addComment(post.id, newComment);
      setComments([...comments, added]);
      setNewComment('');
      onCommentAdded(post.id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card radius="xl" p="xl" withBorder style={{ borderColor: '#EADFC9', boxShadow: '0 4px 20px rgba(58,50,42,0.03)' }}>
      <Group justify="space-between" mb="md" align="flex-start" style={{ cursor: 'pointer' }} onClick={() => navigate(`/profile/${post.user?.id}`)}>
        <Group wrap="nowrap">
          <Avatar radius="xl" src={post.user?.avatarUrl} style={{ backgroundColor: avatarColorFor(post.user?.id), color: 'white' }}>
            {post.user?.name?.charAt(0) || 'U'}
          </Avatar>
          <Stack gap={0}>
            <Text fw={600}>{post.user?.name || 'Unknown User'}</Text>
            <Text size="xs" c="muted">
              {post.type === 'text' ? 'Posted an update' : post.type === 'review' ? 'Wrote a review' : `${post.type} a book`}
              {post.circle ? ` in ${post.circle.name}` : ''}
              {' · '}
              {post.createdAt ? formatDistanceToNow(new Date(post.createdAt)) : 'some time'} ago
            </Text>
          </Stack>
        </Group>
        {user?.id === post.user?.id && (
          <ActionIcon color="red" variant="subtle" onClick={(e) => { e.stopPropagation(); setDeleteConfirmOpened(true); }}>
            <IconTrash size={18} />
          </ActionIcon>
        )}
      </Group>
      
      {post.content && (
        <Text mt="md" mb="md" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
          {post.content}
        </Text>
      )}

      {post.userBook?.book && (
        <Card withBorder radius="md" p="xs" mt={post.content ? "0" : "md"} mb="md" bg="gray.0">
          <Group 
            align="flex-start" 
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/book/${post.userBook.book.apiId}`)}
            wrap="nowrap"
          >
        {post.userBook?.book?.coverUrl ? (
          <Avatar src={post.userBook.book.coverUrl} w={40} h={60} radius="sm" />
        ) : (
          <Box w={40} h={60} bg="forest" style={{ borderRadius: '4px' }} />
        )}
        <Stack gap={0}>
          <Text fw={700}>{post.userBook?.book?.title || 'Unknown Title'}</Text>
          <Text size="sm" c="muted">{post.userBook?.book?.author || 'Unknown Author'}</Text>
          {post.userBook?.rating && (
            <Group gap={4} mt="xs">
              {[...Array(Math.floor(post.userBook.rating))].map((_, i) => <Text key={i} c="terracotta" size="sm">★</Text>)}
              <Text size="sm" fw={600} ml="xs">{post.userBook.rating}</Text>
            </Group>
          )}
          </Stack>
          </Group>
        </Card>
      )}

      <Group gap="xl" mt="md">
        <Group gap="xs" style={{ cursor: 'pointer' }} onClick={handleLike}>
          <IconHeart size={18} stroke={post.userReacted ? 2 : 1.5} color={post.userReacted ? "#C96F4B" : "#8A7E70"} fill={post.userReacted ? "#C96F4B" : "none"} />
          <Text size="sm" fw={post.userReacted ? 600 : 500} c={post.userReacted ? "terracottaDark" : "muted"}>{post.reactionsCount || 0}</Text>
        </Group>
        <Group gap="xs" style={{ cursor: 'pointer' }} onClick={handleToggleComments}>
          <IconMessageCircle size={18} stroke={showComments ? 2 : 1.5} color={showComments ? "#C96F4B" : "#8A7E70"} />
          <Text size="sm" fw={showComments ? 600 : 500} c={showComments ? "terracottaDark" : "muted"}>{post.commentsCount || 0}</Text>
        </Group>
      </Group>

      {showComments && (
        <Box mt="md" pt="md" style={{ borderTop: '1px solid #EADFC9' }}>
          {loadingComments ? (
            <Center p="md"><Loader size="sm" color="terracotta" /></Center>
          ) : (
            <Stack gap="sm">
              {comments.map(c => (
                <Group key={c.id} align="flex-start" wrap="nowrap">
                  <Avatar size="sm" radius="xl" src={c.user?.avatarUrl} style={{ backgroundColor: avatarColorFor(c.user?.id), color: 'white' }}>
                    {c.user?.name?.charAt(0)}
                  </Avatar>
                  <Box bg="surface" p="xs" style={{ borderRadius: '12px', flex: 1 }}>
                    <Text size="sm" fw={600}>{c.user?.name}</Text>
                    <Text size="sm">{c.content}</Text>
                  </Box>
                </Group>
              ))}
              
              <form onSubmit={handleSubmitComment} style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <TextInput 
                  placeholder="Write a comment..." 
                  size="sm" 
                  radius="xl"
                  style={{ flex: 1 }}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button type="submit" size="sm" radius="xl" color="terracotta" disabled={!newComment.trim()}>Send</Button>
              </form>
            </Stack>
          )}
        </Box>
      )}

      <Modal opened={joinModalOpened} onClose={() => setJoinModalOpened(false)} title="Join Circle" centered radius="md">
        <Text size="sm" mb="xl">
          You need to be a member of <b>{post.circle?.name}</b> to interact with this post.
        </Text>
        <Button 
          color="terracotta" 
          fullWidth 
          radius="xl"
          loading={actionLoading}
          onClick={async () => {
            setActionLoading(true);
            try {
              await circlesApi.joinCircleById(post.circle.id);
              await refreshMyCircles();
              setJoinModalOpened(false);
              notifications.show({ title: 'Success', message: `You joined ${post.circle.name}!`, color: 'green' });
            } catch (err) {
              notifications.show({ title: 'Error', message: err.message || 'Failed to join', color: 'red' });
            } finally {
              setActionLoading(false);
            }
          }}
        >
          Join Circle
        </Button>
      </Modal>

      <ConfirmDialog
        opened={deleteConfirmOpened}
        onClose={() => setDeleteConfirmOpened(false)}
        onConfirm={handleDeletePost}
        title="Delete this post?"
        message="Are you sure you want to delete this post?"
        confirmLabel="Delete"
        danger
        loading={actionLoading}
      />
    </Card>
  );
}
