import { getBookById, searchBooks } from './src/integrations/googleBooks.js';

async function test() {
  try {
    const results = await searchBooks('The Hobbit', 1);
    console.log("Search Result:", results[0]);
    if (results[0]) {
      const book = await getBookById(results[0].id);
      console.log("Book Details:", book);
    }
  } catch(err) {
    console.error(err);
  }
}
test();
