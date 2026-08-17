import { Box, Stack, Group, Text, Avatar } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { useCircleStore } from '../../stores/circleStore';
import { avatarColorFor } from '../../lib/avatarColor';
import { palette } from '../../theme';

export default function MembersSidebar() {
  const navigate = useNavigate();
  const circles = useCircleStore((state) => state.circles);
  const activeCircleId = useCircleStore((state) => state.activeCircleId);
  const members = useCircleStore((state) => state.members);

  const activeCircle = circles.find((c) => c.id === activeCircleId);
  if (!activeCircle) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeCircle.inviteCode);
    notifications.show({ color: 'green', message: 'Invite code copied.' });
  };

  return (
    <Box w={280} py="xl" px="md">
      <Text c={palette.forest} size="sm" fw={700} tt="uppercase" style={{ letterSpacing: '0.08em' }} mb="md">
        Circle members
      </Text>

      <Stack gap="md">
        {members.map((member) => (
          <Group
            key={member.id}
            gap="sm"
            wrap="nowrap"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/profile/${member.id}`)}
          >
            <Avatar radius="xl" size="md" color={avatarColorFor(member.id)}>
              {member.displayName?.charAt(0).toUpperCase()}
            </Avatar>
            <Stack gap={0}>
              <Text fw={600} size="sm" c={palette.ink}>{member.displayName}</Text>
              <Text size="xs" c={palette.muted}>in {activeCircle.name}</Text>
            </Stack>
          </Group>
        ))}
      </Stack>

      <Text
        size="xs"
        c={palette.muted}
        mt="xl"
        pt="md"
        style={{ borderTop: `1px solid ${palette.line}`, cursor: 'pointer' }}
        onClick={handleCopyCode}
      >
        {members.length} member{members.length === 1 ? '' : 's'} · code{' '}
        <Text component="span" ff="monospace">{activeCircle.inviteCode}</Text>
      </Text>
    </Box>
  );
}
