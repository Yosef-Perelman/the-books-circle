import { supabase } from '../config/supabase.js';

function mapBook(row) {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    genre: row.genre,
    pageCount: row.page_count,
    coverUrl: row.cover_url,
    isbn: row.isbn,
    apiId: row.api_id,
    createdAt: row.created_at
  };
}

export async function findOrCreate(bookData) {
  const { id: apiId, title, author, genre, pageCount, coverUrl, isbn } = bookData;

  // 1. If an ISBN is present, look up by ISBN
  if (isbn) {
    const { data: byIsbn, error: isbnError } = await supabase
      .from('books')
      .select('*')
      .eq('isbn', isbn)
      .maybeSingle();
    
    if (isbnError) throw isbnError;
    if (byIsbn) return mapBook(byIsbn);
  }

  // 2. Else -> look up by lower(title) + lower(author)
  let query = supabase.from('books').select('*').ilike('title', title);
  
  if (author) {
    query = query.ilike('author', author);
  } else {
    query = query.is('author', null);
  }

  const { data: byTitleAuthor, error: titleAuthorError } = await query.maybeSingle();
  if (titleAuthorError) throw titleAuthorError;
  if (byTitleAuthor) return mapBook(byTitleAuthor);

  // 3. Else -> insert a new books row
  const { data: newBook, error: insertError } = await supabase
    .from('books')
    .insert({
      title,
      author: author || null,
      genre: genre || null,
      page_count: pageCount || null,
      cover_url: coverUrl || null,
      isbn: isbn || null,
      api_id: apiId || null
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return mapBook(newBook);
}
