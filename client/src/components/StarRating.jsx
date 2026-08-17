import { Group, Text } from '@mantine/core';

export default function StarRating({ stars = 0, max = 5, size = "md" }) {
  return (
    <Group gap={2} mt={4}>
      {Array.from({ length: max }, (_, i) => i + 1).map(i => (
        <Text key={i} size={size} c={i <= stars ? "terracotta" : "line"}>★</Text>
      ))}
    </Group>
  );
}
