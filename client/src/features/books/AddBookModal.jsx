import { useState } from 'react';
import { Modal, Button, Tabs, TextInput, Stack, NumberInput, Text } from '@mantine/core';

export default function AddBookModal({ opened, onClose }) {
  const [activeTab, setActiveTab] = useState('scan');

  return (
    <Modal opened={opened} onClose={onClose} title="Add a book" size="md">
      <Tabs value={activeTab} onChange={setActiveTab} color="terracotta">
        <Tabs.List>
          <Tabs.Tab value="scan">Scan cover</Tabs.Tab>
          <Tabs.Tab value="search">Search</Tabs.Tab>
          <Tabs.Tab value="manual">Manual</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="scan" pt="xl">
          <Stack align="center" gap="md" py="xl">
            <Text c="muted">Upload or take a photo of the book cover.</Text>
            <Button color="terracotta" radius="xl">Select Photo</Button>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="search" pt="xl">
          <Stack gap="md">
            <TextInput placeholder="Search by title, author, or ISBN..." />
            <Button color="terracotta" radius="xl">Search</Button>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="manual" pt="xl">
          <Stack gap="md">
            <TextInput label="Title" required />
            <TextInput label="Author" />
            <TextInput label="Genre" />
            <NumberInput label="Page count" min={1} />
            <Button color="terracotta" radius="xl">Add to shelf</Button>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}
