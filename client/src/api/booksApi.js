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
  }
};
