import { useState } from 'react';
import { Card, Group, Stack, Text, Avatar, Divider, UnstyledButton } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { IconHeart } from '@tabler/icons-react';
import StarRating from '../../components/StarRating';
import { avatarColorFor } from '../../lib/avatarColor';
import { formatPostTime } from '../../lib/formatters';
import { palette } from '../../theme';

// fonts.md's serif stack — no fonts.js module exists yet to import this from.
const SERIF_FONT = "Georgia, 'Iowan Old Style', 'Times New Roman', serif";
const ARTICLE_CLAMP_THRESHOLD = 400;

function lightPostLine(post) {
  const title = post.userBook?.book?.title ?? 'a book';
  return post.type === 'started'
    ? `started reading "${title}"`
    : `added "${title}" to want to read`;
}

function PostHeader({ post, subline, onNavigateToProfile }) {
  return (
    <Group gap="sm" wrap="nowrap" mb="md" align="flex-start" style={{ cursor: 'pointer' }} onClick={onNavigateToProfile}>
      <Avatar radius="xl" size={40} color={avatarColorFor(post.user.id)}>
        {post.user.displayName?.charAt(0).toUpperCase()}
      </Avatar>
      <Stack gap={0}>
        <Text fw={600} c={palette.ink}>{post.user.displayName}</Text>
        <Text size="xs" c={palette.muted}>{subline}</Text>
      </Stack>
    </Group>
  );
}

function LikeButton({ post, onToggleLike }) {
  const [justLiked, setJustLiked] = useState(false);

  const handleClick = () => {
    if (!post.likedByMe) {
      setJustLiked(true);
      setTimeout(() => setJustLiked(false), 200);
    }
    onToggleLike(post);
  };

  return (
    <UnstyledButton onClick={handleClick} aria-label={post.likedByMe ? 'Unlike' : 'Like'}>
      <Group gap={6} wrap="nowrap">
        <IconHeart
          size={18}
          stroke={2}
          color={palette.terracotta}
          fill={post.likedByMe ? palette.terracotta : 'none'}
          style={{ transform: justLiked ? 'scale(1.25)' : 'scale(1)', transition: 'transform 200ms ease' }}
        />
        <Text size="sm" fw={500} c={post.likedByMe ? palette.terracottaDark : palette.muted}>
          {post.likeCount}
        </Text>
      </Group>
    </UnstyledButton>
  );
}

export default function PostCard({ post, onToggleLike }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const goToProfile = () => navigate(`/profile/${post.user.id}`);

  if (post.type !== 'finished') {
    return (
      <Card p={20}>
        <PostHeader
          post={post}
          subline={`${lightPostLine(post)} · ${formatPostTime(post.createdAt)}`}
          onNavigateToProfile={goToProfile}
        />
      </Card>
    );
  }

  const book = post.userBook?.book;
  const review = post.userBook?.review;
  const article = review?.articleText ?? '';
  const needsClamp = article.length > ARTICLE_CLAMP_THRESHOLD && !expanded;

  return (
    <Card p={20}>
      <PostHeader
        post={post}
        subline={`finished a book · ${formatPostTime(post.createdAt)}`}
        onNavigateToProfile={goToProfile}
      />

      <Stack gap={4} mb="md">
        <Text fw={700} size="lg" c={palette.ink}>{book?.title}</Text>
        <Text size="sm" c={palette.muted}>{book?.author}</Text>
        {review && <StarRating value={review.rating} />}
      </Stack>

      {article && (
        <Stack gap={4} mb="md">
          <Text
            ff={SERIF_FONT}
            fz={16}
            lh={1.7}
            c={palette.ink}
            style={
              needsClamp
                ? { display: '-webkit-box', WebkitLineClamp: 8, WebkitBoxOrient: 'vertical', overflow: 'hidden', maxWidth: 640 }
                : { maxWidth: 640 }
            }
          >
            &ldquo;{article}&rdquo;
          </Text>
          {article.length > ARTICLE_CLAMP_THRESHOLD && (
            <UnstyledButton onClick={() => setExpanded((v) => !v)}>
              <Text size="xs" c={palette.muted} fw={600}>{expanded ? 'Show less' : 'Read more'}</Text>
            </UnstyledButton>
          )}
        </Stack>
      )}

      <Divider color={palette.line} mb="md" />
      <LikeButton post={post} onToggleLike={onToggleLike} />
    </Card>
  );
}
