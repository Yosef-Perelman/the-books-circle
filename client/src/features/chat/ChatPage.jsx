import { useState, useRef, useEffect } from 'react';
import { Container, Card, Title, Text, Stack, TextInput, ActionIcon, ScrollArea, Group, Avatar, Box, Loader, Button } from '@mantine/core';
import { IconSend, IconSparkles, IconRefresh } from '@tabler/icons-react';
import { chatApi } from '../../api/chatApi';
import ReactMarkdown from 'react-markdown';
import { useChatStore } from '../../stores/chatStore';

export default function ChatPage() {
  const { messages, setMessages, resetChat } = useChatStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', parts: input.trim() };
    const newHistory = [...messages, userMessage];
    
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      const response = await chatApi.sendMessage(newHistory);
      if (response.history) {
        setMessages(response.history);
      } else {
        setMessages([...newHistory, { role: 'ai', parts: response.text }]);
      }
    } catch (err) {
      console.error(err);
      setMessages([...newHistory, { role: 'ai', parts: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box bg="surface" style={{ height: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box bg="cream" p="md" style={{ borderBottom: '1px solid #EADFC9' }}>
        <Container size="md">
          <Group justify="space-between">
            <Group gap="sm">
              <Avatar color="terracotta" radius="xl" size="md">
                <IconSparkles size={18} />
              </Avatar>
              <div>
                <Title order={3} style={{ fontFamily: 'Newsreader, serif' }}>AI Librarian</Title>
                <Text size="sm" c="dimmed">Your personal assistant for books and social reading.</Text>
              </div>
            </Group>
            <Button 
              variant="subtle" 
              color="gray" 
              leftSection={<IconRefresh size={16} />} 
              onClick={resetChat}
              disabled={loading}
            >
              Reset Chat
            </Button>
          </Group>
        </Container>
      </Box>

      {/* Chat Area */}
      <ScrollArea style={{ flex: 1 }} p="xl" viewportRef={scrollRef}>
        <Container size="md">
          <Stack gap="xl">
            {messages.filter(msg => !msg.isHidden && msg.parts.trim() !== '').map((msg, i) => (
              <Group key={i} align="flex-start" wrap="nowrap" justify={msg.role === 'user' ? 'flex-end' : 'flex-start'}>
                {msg.role === 'ai' && (
                  <Avatar color="terracotta" radius="xl" size="sm" mt={4}>AI</Avatar>
                )}
                <Card 
                  p="lg" 
                  radius="lg" 
                  bg={msg.role === 'user' ? 'terracotta' : 'white'} 
                  c={msg.role === 'user' ? 'white' : 'dark'}
                  style={{
                    maxWidth: '80%',
                    borderBottomRightRadius: msg.role === 'user' ? 4 : undefined,
                    borderBottomLeftRadius: msg.role === 'ai' ? 4 : undefined,
                    border: msg.role === 'ai' ? '1px solid #EADFC9' : 'none',
                    boxShadow: '0 4px 15px rgba(58,50,42,0.05)'
                  }}
                >
                  <Box style={{ lineHeight: 1.6, fontSize: '15px' }} className="markdown-body">
                    <ReactMarkdown>{msg.parts}</ReactMarkdown>
                  </Box>
                </Card>
              </Group>
            ))}
            {loading && (
              <Group align="flex-start" wrap="nowrap">
                <Avatar color="terracotta" radius="xl" size="sm" mt={4}>AI</Avatar>
                <Card p="lg" radius="lg" bg="white" style={{ border: '1px solid #EADFC9', borderBottomLeftRadius: 4 }}>
                  <Loader size="sm" color="terracotta" variant="dots" />
                </Card>
              </Group>
            )}
          </Stack>
        </Container>
      </ScrollArea>

      {/* Input Area */}
      <Box p="md" bg="white" style={{ borderTop: '1px solid #EADFC9' }}>
        <Container size="md">
          <form onSubmit={e => { e.preventDefault(); handleSend(); }}>
            <TextInput
              placeholder="Ask about books, what friends are reading, or ask to add a book to your list..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              radius="xl"
              size="lg"
              rightSection={
                <ActionIcon 
                  size={40} 
                  radius="xl" 
                  color="terracotta" 
                  variant="filled" 
                  type="submit"
                  disabled={!input.trim() || loading}
                  mr={5}
                >
                  <IconSend size={18} />
                </ActionIcon>
              }
              rightSectionWidth={50}
            />
          </form>
        </Container>
      </Box>
    </Box>
  );
}
