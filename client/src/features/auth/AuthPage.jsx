import { useState } from 'react';
import { Card, Button, Title, Text, Stack, Container, Center, Group, Box, SegmentedControl } from '@mantine/core';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../config/supabase';
import { IconBrandGoogleFilled } from '@tabler/icons-react';

export default function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'login';
  const isLogin = mode === 'login';
  const navigate = useNavigate();
  
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/feed'
      }
    });
    
    if (error) {
      console.error("Error logging in with Google:", error.message);
      setLoading(false);
    }
  };

  return (
    <Container size="lg" style={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
      <Card radius="32px" shadow="xl" p={0} style={{ width: '100%', overflow: 'hidden', minHeight: 600 }}>
        <Group align="stretch" gap={0} wrap="nowrap" style={{ minHeight: 600 }}>
          
          {/* Left Side: Branding */}
          <Box bg="terracotta" p={50} style={{ width: '50%', color: 'white', display: 'flex', flexDirection: 'column' }}>
            <Group>
              <Box w={32} h={32} bg="white" style={{ borderRadius: '8px', border: '4px solid #C96F4B', outline: '3px solid white' }} />
              <Title order={3} c="white" style={{ fontFamily: 'Newsreader, serif', fontSize: '24px' }}>
                The Reading Circles
              </Title>
            </Group>

            <Center style={{ flex: 1 }}>
              <Box style={{ position: 'relative', width: 200, height: 160 }}>
                {/* Simulated CSS Book Stack */}
                <Box 
                  w={140} h={30} bg="#EADFC9" 
                  style={{ borderRadius: '4px', position: 'absolute', top: 30, left: 20, transform: 'rotate(-5deg)', zIndex: 3, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} 
                />
                <Box 
                  w={150} h={35} bg="#FFFDF8" 
                  style={{ borderRadius: '4px', position: 'absolute', top: 60, left: 25, transform: 'rotate(2deg)', zIndex: 2, boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }} 
                />
                <Box 
                  w={145} h={35} bg="#D9A45B" 
                  style={{ borderRadius: '4px', position: 'absolute', top: 95, left: 30, transform: 'rotate(-1deg)', zIndex: 1, boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }} 
                />
              </Box>
            </Center>

            <Stack align="center" ta="center" gap="xs">
              <Title order={2} c="white" style={{ fontFamily: 'Newsreader, serif' }}>
                A cosy corner for you<br />and your reading circle.
              </Title>
              <Text size="sm" style={{ opacity: 0.9 }}>
                Snap a cover, write a review,<br />see what your friends finish next.
              </Text>
            </Stack>

            <Box mt={60} style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }} pt="lg">
              <Text size="sm" fs="italic" style={{ opacity: 0.8 }} ta="center">
                "Best thing I did was stop reading alone."
              </Text>
            </Box>
          </Box>

          {/* Right Side: Auth Flow */}
          <Box bg="surface" p={50} style={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
            
            <Stack gap="xl" style={{ flex: 1, justifyContent: 'center' }}>
              <Box>
                <Title order={2} c="ink" mb="xs">
                  Welcome back
                </Title>
                <Text c="muted" size="sm">
                  Log in or create an account to see what your circles are reading.
                </Text>
              </Box>

              <Button 
                size="xl" 
                radius="xl" 
                color="dark" 
                leftSection={<IconBrandGoogleFilled />}
                loading={loading}
                onClick={handleGoogleLogin}
                style={{ fontSize: '1.1rem' }}
              >
                Continue with Google
              </Button>

            </Stack>
          </Box>

        </Group>
      </Card>
    </Container>
  );
}
