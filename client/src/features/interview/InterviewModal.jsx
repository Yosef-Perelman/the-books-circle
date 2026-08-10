import { useState } from 'react';
import { Modal, Button, Stack, Text, Textarea } from '@mantine/core';

export default function InterviewModal({ opened, onClose }) {
  const [step, setStep] = useState(0);

  return (
    <Modal opened={opened} onClose={onClose} title="AI Interview" size="lg">
      <Stack gap="md">
        <Text c="forest" fw={600}>
          {step === 0 
            ? "What stood out to you the most in 'Dune'?" 
            : "Who would you recommend this book to?"}
        </Text>
        
        <Textarea 
          placeholder="Type your thoughts here..." 
          minRows={4} 
        />
        
        <Button 
          color="terracotta" 
          radius="xl"
          onClick={() => {
            if (step === 0) setStep(1);
            else onClose();
          }}
        >
          {step === 0 ? "Next Question" : "Publish Review"}
        </Button>
      </Stack>
    </Modal>
  );
}
