import { Card, Group, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useUiStore } from '../../stores/uiStore';
import { palette } from '../../theme';

// The whole card is one button that opens AddBookModal — not a text input.
// See features/feed.md: "the placeholder copy is aspirational."
export default function PostComposer() {
  const openModal = useUiStore((state) => state.openModal);

  return (
    <Card p={20} mb="lg" style={{ cursor: 'pointer' }} onClick={() => openModal('addBook')}>
      <Group justify="space-between">
        <Text c={palette.muted}>Add a post — what are you reading?</Text>
        <Group gap={6}>
          <IconPlus size={18} color={palette.terracotta} />
          <Text fw={600} c={palette.terracotta}>Post</Text>
        </Group>
      </Group>
    </Card>
  );
}
