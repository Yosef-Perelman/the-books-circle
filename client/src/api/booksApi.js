import { apiClient } from './client.js';

export const booksApi = {
  searchBooks: async (query) => {
    return await apiClient(`/books/search?q=${encodeURIComponent(query)}`);
  },
  getExplore: async () => {
    return await apiClient(`/books/explore`);
  },
  getBookDetails: async (id) => {
    return await apiClient(`/books/${encodeURIComponent(id)}`);
  },
  searchAuthors: async (query) => {
    return await apiClient(`/books/authors/search?q=${encodeURIComponent(query)}`);
  },
  getAuthorDetails: async (id) => {
    return await apiClient(`/books/authors/${encodeURIComponent(id)}`);
  },
  getBookReviews: async (id) => {
    return await apiClient(`/books/${encodeURIComponent(id)}/reviews`);
  },
  scanBookCover: async (file) => {
    const form = new FormData();
    form.append('image', file);
    return await apiClient('/books/scan', { method: 'POST', body: form });
  },
  addUserBook: async (data) => {
    return await apiClient('/user-books', {
      method: 'POST',
      body: data, // Note: fetch stringifies body inside apiClient if it's an object? Wait, apiClient stringifies body.
    });
  },
  getUserBooks: async (userId = null) => {
    const query = userId ? `?userId=${userId}` : '';
    return await apiClient(`/user-books${query}`);
  },
  updateUserBookStatus: async (userBookId, status) => {
    return await apiClient(`/user-books/${userBookId}/status`, {
      method: 'PATCH',
      body: { status }
    });
  },
  updateUserBookRating: async (userBookId, rating) => {
    return await apiClient(`/user-books/${userBookId}/rating`, {
      method: 'PATCH',
      body: { rating }
    });
  },
  removeUserBook: async (userBookId) => {
    return await apiClient(`/user-books/${userBookId}`, {
      method: 'DELETE'
    });
  },
  getInterviewQuestions: async (userBookId) => {
    return await apiClient(`/user-books/${userBookId}/interview/questions`);
  },
  generateReview: async (userBookId, qa) => {
    return await apiClient(`/user-books/${userBookId}/interview/review`, {
      method: 'POST',
      body: { qa }
    });
  }
};
