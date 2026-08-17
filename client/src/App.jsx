import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import AppShell from './components/AppShell';
import AuthPage from './features/auth/AuthPage';
import FeedPage from './features/feed/FeedPage';
import ProfilePage from './features/profile/ProfilePage';
import LeaderboardPage from './features/leaderboard/LeaderboardPage';
import ExplorePage from './features/books/ExplorePage';
import BookDetailsPage from './features/books/BookDetailsPage';
import SearchPage from './features/books/SearchPage';
import AuthorDetailsPage from './features/books/AuthorDetailsPage';
import { Loader, Center } from '@mantine/core';

function ProtectedRoute({ children }) {
  const { user, status } = useAuthStore();

  if (status !== 'ready') {
    return <Center h="100vh"><Loader color="terracotta" /></Center>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

export default function App() {
  const { user } = useAuthStore();

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/feed" replace /> : <AuthPage />} />
      <Route path="/auth" element={user ? <Navigate to="/feed" replace /> : <AuthPage />} />

      {/* Protected Routes wrapped in AppShell layout */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/book/:id" element={<BookDetailsPage />} />
        <Route path="/author/:id" element={<AuthorDetailsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
