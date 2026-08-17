import { Group, Text } from '@mantine/core';
import { IconStarFilled, IconStarHalfFilled, IconStar } from '@tabler/icons-react';
import { palette } from '../theme';

// Display only for now — no input/onChange mode yet, since nothing in the
// app needs interactive rating until the interview modal (a later stage).
export default function StarRating({ value = 0, size = 16, showValue = true }) {
  const stars = [1, 2, 3, 4, 5].map((i) => {
    if (value >= i) return <IconStarFilled key={i} size={size} color={palette.terracotta} />;
    if (value >= i - 0.5) return <IconStarHalfFilled key={i} size={size} color={palette.terracotta} />;
    return <IconStar key={i} size={size} color={palette.line} />;
  });

  return (
    <Group gap={2} wrap="nowrap">
      {stars}
      {showValue && (
        <Text size="xs" c={palette.muted} ml={4}>{value.toFixed(1)}</Text>
      )}
    </Group>
  );
}
