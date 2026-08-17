import { useState, useEffect } from 'react';
import { Modal, Tabs, TextInput, Button, Stack, Text, CopyButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useCircleStore } from '../../stores/circleStore';
import { palette } from '../../theme';

export default function JoinCreateCircleModal({ opened, onClose, initialTab = 'join' }) {
  const createCircle = useCircleStore((state) => state.createCircle);
  const joinCircle = useCircleStore((state) => state.joinCircle);

  const [tab, setTab] = useState(initialTab);
  const [joinCode, setJoinCode] = useState('');
  const [circleName, setCircleName] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdCircle, setCreatedCircle] = useState(null);

  useEffect(() => {
    if (opened) {
      setTab(initialTab);
      setJoinCode('');
      setCircleName('');
      setFieldError('');
      setCreatedCircle(null);
    }
  }, [opened, initialTab]);

  const handleJoin = async () => {
    setFieldError('');
    setSubmitting(true);
    try {
      await joinCircle(joinCode);
      onClose();
    } catch (err) {
      if (err.details?.inviteCode) setFieldError(err.details.inviteCode);
      else notifications.show({ color: 'red', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreate = async () => {
    setFieldError('');
    setSubmitting(true);
    try {
      const circle = await createCircle(circleName);
      setCreatedCircle(circle);
    } catch (err) {
      if (err.details?.name) setFieldError(err.details.name);
      else notifications.show({ color: 'red', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (createdCircle) {
    return (
      <Modal opened={opened} onClose={onClose} title="Circle created" radius="xl" size="sm">
        <Stack align="center" gap="sm" py="md">
          <Text c={palette.muted} ta="center">Share this code so friends can join.</Text>
          <Text ff="monospace" fw={700} size="xl" c={palette.terracottaDark}>
            {createdCircle.inviteCode}
          </Text>
          <CopyButton value={createdCircle.inviteCode}>
            {({ copied, copy }) => (
              <Button
                variant="outline"
                color="terracotta"
                radius="xl"
                onClick={() => {
                  copy();
                  notifications.show({ color: 'green', message: 'Invite code copied.' });
                }}
              >
                {copied ? 'Copied' : 'Copy code'}
              </Button>
            )}
          </CopyButton>
          <Button color="terracotta" radius="xl" fullWidth mt="sm" onClick={onClose}>
            Done
          </Button>
        </Stack>
      </Modal>
    );
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Join or create a circle" radius="xl" size="sm">
      <Tabs value={tab} onChange={setTab}>
        <Tabs.List grow mb="lg">
          <Tabs.Tab value="join">Join</Tabs.Tab>
          <Tabs.Tab value="create">Create</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="join">
          <Stack gap="md">
            <TextInput
              label="Invite code"
              placeholder="F1-8KZQ"
              value={joinCode}
              onChange={(e) => setJoinCode(e.currentTarget.value.toUpperCase())}
              error={fieldError}
              styles={{ input: { fontFamily: 'monospace' } }}
            />
            <Button color="terracotta" radius="xl" fullWidth loading={submitting} onClick={handleJoin}>
              Join circle
            </Button>
            <Text size="xs" c={palette.muted} ta="center">
              Ask a friend in the circle for their code.
            </Text>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="create">
          <Stack gap="md">
            <TextInput
              label="Circle name"
              placeholder="Friends 1"
              value={circleName}
              onChange={(e) => setCircleName(e.currentTarget.value)}
              error={fieldError}
              maxLength={50}
            />
            <Button color="terracotta" radius="xl" fullWidth loading={submitting} onClick={handleCreate}>
              Create circle
            </Button>
            <Text size="xs" c={palette.muted} ta="center">
              You'll get an invite code to share.
            </Text>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}
