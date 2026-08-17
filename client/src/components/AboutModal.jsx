import { Modal, Stack, Text, Title, Group } from '@mantine/core';
import { IconCamera, IconBooks, IconTrophy } from '@tabler/icons-react';
import { palette } from '../theme';
import Logo from './Logo';

const POINTS = [
  { icon: IconCamera, text: 'Snap a cover to add a book to your shelf.' },
  { icon: IconBooks, text: 'Track what you want to read, are reading, and have finished.' },
  { icon: IconTrophy, text: 'Finish a book and an AI-written review posts to your circle — compete on the leaderboard.' }
];

export default function AboutModal({ opened, onClose }) {
  return (
    <Modal opened={opened} onClose={onClose} title={null} size="sm">
      <Stack align="center" gap="lg" py="md">
        <Logo size={40} color={palette.terracotta} />
        <Title order={2} ta="center" style={{ fontFamily: 'Newsreader, serif' }} c={palette.terracotta}>
          The Reading Circles
        </Title>
        <Text c={palette.muted} ta="center" size="sm">
          A cosy corner for you and your reading circle.
        </Text>

        <Stack gap="sm" w="100%">
          {POINTS.map(({ icon: Icon, text }, i) => (
            <Group key={i} gap="sm" wrap="nowrap" align="flex-start">
              <Icon size={20} color={palette.terracotta} style={{ flexShrink: 0, marginTop: 2 }} />
              <Text size="sm" c={palette.ink}>{text}</Text>
            </Group>
          ))}
        </Stack>
      </Stack>
    </Modal>
  );
}
