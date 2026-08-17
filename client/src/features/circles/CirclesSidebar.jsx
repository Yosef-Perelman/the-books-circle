import { Box, Stack, Group, Text, Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useCircleStore } from '../../stores/circleStore';
import { avatarColorFor } from '../../lib/avatarColor';
import { palette } from '../../theme';

export default function CirclesSidebar({ onNewCircle }) {
  const circles = useCircleStore((state) => state.circles);
  const activeCircleId = useCircleStore((state) => state.activeCircleId);
  const setActive = useCircleStore((state) => state.setActive);

  return (
    <Box w={240} py="xl" px="md">
      <Text c={palette.forest} size="sm" fw={700} tt="uppercase" style={{ letterSpacing: '0.08em' }} mb="md">
        Circles
      </Text>

      <Stack gap={8}>
        {circles.map((circle) => {
          const isActive = circle.id === activeCircleId;
          return (
            <Group
              key={circle.id}
              gap="sm"
              p={12}
              wrap="nowrap"
              style={{
                cursor: 'pointer',
                borderRadius: 999,
                backgroundColor: isActive ? palette.terracottaTint : 'transparent',
                borderLeft: `3px solid ${isActive ? palette.terracotta : 'transparent'}`
              }}
              onClick={() => setActive(circle.id)}
            >
              <Box
                w={32}
                h={32}
                style={{ borderRadius: '50%', backgroundColor: avatarColorFor(circle.id), flexShrink: 0 }}
              />
              <Text fw={isActive ? 600 : 500} c={isActive ? palette.terracottaDark : palette.ink} truncate>
                {circle.name}
              </Text>
            </Group>
          );
        })}
      </Stack>

      <Button
        variant="outline"
        color="terracotta"
        fullWidth
        mt="lg"
        radius="xl"
        style={{ borderStyle: 'dashed', borderWidth: 2 }}
        leftSection={<IconPlus size={16} />}
        onClick={onNewCircle}
      >
        New circle
      </Button>
    </Box>
  );
}
