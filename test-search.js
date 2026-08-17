import { booksApi } from './client/src/api/booksApi.js';

// We can't use apiClient in node easily without polyfilling fetch and env vars.
// Let's check server/src/controllers/book.controller.js for searchBooksCtrl.
