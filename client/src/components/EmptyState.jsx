import { Stack, Text, Button } from '@mantine/core';
import { IconMoodEmpty } from '@tabler/icons-react';
import { palette } from '../theme';

export default function EmptyState({ icon: Icon = IconMoodEmpty, title, message, actionLabel, onAction }) {
  return (
    <Stack align="center" gap={4} py="xl">
      <Icon size={40} color={palette.stale} stroke={1.5} />
      <Text fw={600} size="md" c={palette.ink} mt="xs">{title}</Text>
      {message && (
        <Text size="sm" c={palette.muted} ta="center" maw={320}>{message}</Text>
      )}
      {actionLabel && onAction && (
        <Button color="terracotta" radius="xl" mt="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Stack>
  );
}
