import { Modal, Text, Group, Button } from '@mantine/core';

export default function ConfirmDialog({
  opened,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  loading = false
}) {
  return (
    <Modal opened={opened} onClose={onClose} title={title} centered radius="lg">
      {message && <Text c="dimmed" mb="xl">{message}</Text>}
      <Group justify="flex-end" gap="sm">
        <Button variant="subtle" color="gray" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button color={danger ? 'red' : 'terracotta'} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </Group>
    </Modal>
  );
}
