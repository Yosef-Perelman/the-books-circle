import { useState, useEffect } from 'react';
import { Modal, Button, Stack, Text, Textarea, Select, Loader, Center, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { booksApi } from '../../api/booksApi';
import { circlesApi } from '../../api/circlesApi';
import { postsApi } from '../../api/postsApi';

export default function InterviewModal({ opened, onClose, userBook }) {
  const [step, setStep] = useState('loading-questions'); // loading-questions, q0, q1, q2, loading-review, edit-review
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [myCircles, setMyCircles] = useState([]);
  const [selectedCircleId, setSelectedCircleId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (opened && userBook) {
      setStep('loading-questions');
      setQuestions([]);
      setAnswers([]);
      setCurrentAnswer('');
      setReviewText('');
      
      Promise.all([
        booksApi.getInterviewQuestions(userBook.id),
        circlesApi.getMyCircles()
      ]).then(([qRes, cRes]) => {
        setQuestions(qRes || []);
        setMyCircles(cRes || []);
        if (cRes && cRes.length > 0) {
          setSelectedCircleId(cRes[0].id); // default to first circle
        }
        setStep('q0');
      }).catch(err => {
        console.error(err);
        notifications.show({ title: 'Error', message: 'Failed to start interview', color: 'red' });
        onClose();
      });
    }
  }, [opened, userBook]);

  const handleNextQuestion = () => {
    const qIndex = parseInt(step.replace('q', ''));
    const newAnswers = [...answers];
    newAnswers[qIndex] = { question: questions[qIndex], answer: currentAnswer };
    setAnswers(newAnswers);

    if (qIndex + 1 < questions.length) {
      setStep(`q${qIndex + 1}`);
      setCurrentAnswer(newAnswers[qIndex + 1] ? newAnswers[qIndex + 1].answer : '');
    } else {
      // Finished answering, generate review
      setStep('loading-review');
      booksApi.generateReview(userBook.id, newAnswers).then(res => {
        setReviewText(res);
        setStep('edit-review');
      }).catch(err => {
        console.error(err);
        notifications.show({ title: 'Error', message: 'Failed to write review. Please try again.', color: 'red' });
        // Revert to last question so they can retry
        setStep(`q${qIndex}`);
        setCurrentAnswer(newAnswers[qIndex].answer);
      });
    }
  };

  const handlePrevQuestion = () => {
    const qIndex = parseInt(step.replace('q', ''));
    if (qIndex > 0) {
      const newAnswers = [...answers];
      newAnswers[qIndex] = { question: questions[qIndex], answer: currentAnswer };
      setAnswers(newAnswers);
      
      setStep(`q${qIndex - 1}`);
      setCurrentAnswer(newAnswers[qIndex - 1].answer);
    }
  };

  const handlePublish = async () => {
    if (!selectedCircleId) {
      notifications.show({ title: 'Wait', message: 'Please select a circle to post to', color: 'orange' });
      return;
    }
    setIsSubmitting(true);
    try {
      await postsApi.createPost({
        circleId: selectedCircleId,
        content: reviewText,
        type: 'review',
        userBookId: userBook.id
      });
      notifications.show({ title: 'Success!', message: 'Your review has been published.', color: 'green' });
      onClose();
    } catch (err) {
      console.error(err);
      notifications.show({ title: 'Error', message: 'Failed to publish review', color: 'red' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userBook) return null;

  return (
    <Modal opened={opened} onClose={onClose} title={`Reviewing "${userBook.book?.title}"`} size="xl" closeOnClickOutside={false}>
      {step === 'loading-questions' && (
        <Center py="xl">
          <Stack align="center" gap="sm">
            <Loader color="terracotta" />
            <Text c="dimmed">The AI is preparing questions for you...</Text>
          </Stack>
        </Center>
      )}

      {step.startsWith('q') && (
        <Stack gap="md">
          <Text c="forest" fw={600} size="lg">
            {questions[parseInt(step.replace('q', ''))]}
          </Text>
          
          <Textarea 
            placeholder="Type your thoughts here..." 
            minRows={4} 
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.currentTarget.value)}
            data-autofocus
          />
          
          <Group justify="space-between">
            {parseInt(step.replace('q', '')) > 0 ? (
              <Button variant="subtle" color="gray" onClick={handlePrevQuestion}>
                Back
              </Button>
            ) : (
              <div></div> // spacer
            )}
            <Button 
              color="terracotta" 
              radius="xl"
              onClick={handleNextQuestion}
              disabled={!currentAnswer.trim()}
            >
              {parseInt(step.replace('q', '')) === questions.length - 1 ? "Write my review ✨" : "Next Question"}
            </Button>
          </Group>
        </Stack>
      )}

      {step === 'loading-review' && (
        <Center py="xl">
          <Stack align="center" gap="sm">
            <Loader color="terracotta" type="bars" />
            <Text c="dimmed">Drafting your magazine-style review...</Text>
          </Stack>
        </Center>
      )}

      {step === 'edit-review' && (
        <Stack gap="md">
          <Text fw={600}>Here is a draft based on your thoughts. Feel free to edit it!</Text>
          
          <Textarea
            minRows={12}
            autosize
            value={reviewText}
            onChange={(e) => setReviewText(e.currentTarget.value)}
          />

          <Select
            label="Post to Circle"
            data={myCircles.map(c => ({ value: c.id, label: c.name }))}
            value={selectedCircleId}
            onChange={setSelectedCircleId}
            allowDeselect={false}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" color="gray" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button 
              color="terracotta" 
              onClick={handlePublish}
              loading={isSubmitting}
            >
              Publish Review
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
