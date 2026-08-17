import { Stack, Text, Button } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { palette } from '../theme';

export default function ErrorBanner({ message = 'Something went wrong.', onRetry }) {
  return (
    <Stack align="center" gap={4} py="xl">
      <IconAlertCircle size={32} color={palette.terracottaDark} stroke={1.5} />
      <Text size="sm" c={palette.muted} ta="center">{message}</Text>
      {onRetry && (
        <Button variant="outline" color="terracotta" radius="xl" mt="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </Stack>
  );
}
