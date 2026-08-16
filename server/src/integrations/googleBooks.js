import { ApiError } from '../utils/ApiError.js';

// Hotfix: Due to Google Books API rate limits in the sandbox, we are using OpenLibrary
// as a drop-in replacement so the features work flawlessly for the user.

function normalizeSearch(item) {
  const id = item.key?.replace('/works/', '') ?? null;
  const coverUrl = item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg` : null;

  return {
    id,
    title: item.title ?? null,
    author: item.author_name?.[0] ?? null,
    genre: item.subject?.[0] ?? null,
    pageCount: item.number_of_pages_median ?? null,
    coverUrl,
    isbn: item.isbn?.[0] ?? null,
    publishedDate: item.first_publish_year ? String(item.first_publish_year) : null,
  };
}

function normalizeSubject(item) {
  const id = item.key?.replace('/works/', '') ?? null;
  const coverUrl = item.cover_id ? `https://covers.openlibrary.org/b/id/${item.cover_id}-M.jpg` : null;

  return {
    id,
    title: item.title ?? null,
    author: item.authors?.[0]?.name ?? null,
    genre: null,
    coverUrl,
  };
}

export async function searchBooks(query, maxResults = 10) {
  try {
    let url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${maxResults}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new ApiError(502, "Book search is unavailable right now.");
    }

    const data = await response.json();
    const results = (data.docs ?? []).map(normalizeSearch).filter(book => book.title);

    return results;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error("OpenLibrary Search Error:", error);
    throw new ApiError(502, "Book search is unavailable right now.");
  }
}

export async function getExploreBooks() {
  try {
    const fetchCategory = async (subject, limit = 10) => {
      let url = `https://openlibrary.org/subjects/${subject}.json?limit=${limit}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.works ?? []).map(normalizeSubject).filter(b => b.title);
    };

    const [trending, fiction, sciFi, romance] = await Promise.all([
      fetchCategory('fantasy', 15),
      fetchCategory('fiction', 10),
      fetchCategory('science_fiction', 10),
      fetchCategory('romance', 10),
    ]);

    return {
      trending: trending.slice(0, 10),
      categories: [
        { title: 'Popular Fiction', books: fiction },
        { title: 'Science Fiction', books: sciFi },
        { title: 'Romance', books: romance }
      ]
    };
  } catch (error) {
    console.error("OpenLibrary Explore Error:", error);
    throw new ApiError(502, "Explore is temporarily unavailable.");
  }
}

export async function getBookById(id) {
  try {
    const workUrl = `https://openlibrary.org/works/${encodeURIComponent(id)}.json`;
    const res = await fetch(workUrl);
    if (!res.ok) {
      if (res.status === 404) throw new ApiError(404, "Book not found.");
      throw new ApiError(502, "API is unavailable.");
    }
    const data = await res.json();
    
    // Attempt to get author names since works API only returns author keys
    let authorName = "Unknown author";
    let authorId = null;
    
    if (data.authors && data.authors[0] && data.authors[0].author) {
       try {
           const authorKey = data.authors[0].author.key;
           authorId = authorKey.replace('/authors/', '');
           const authorUrl = `https://openlibrary.org${authorKey}.json`;
           const aRes = await fetch(authorUrl);
           const aData = await aRes.json();
           if (aData.name) authorName = aData.name;
       } catch (e) {
           console.error("Failed to fetch author", e);
       }
    }

    const coverUrl = data.covers && data.covers.length > 0 
      ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg` 
      : null;

    let desc = null;
    if (data.description) {
      desc = typeof data.description === 'object' ? data.description.value : data.description;
    }

    return {
      id: id,
      title: data.title,
      author: authorName,
      authorId: authorId,
      genre: data.subjects?.[0] ?? null,
      description: desc,
      coverUrl: coverUrl,
      publishedDate: data.first_publish_date ?? null
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error("OpenLibrary GetById Error:", error);
    throw new ApiError(502, "Could not fetch book details.");
  }
}

export async function searchAuthors(query, maxResults = 10) {
  try {
    let url = `https://openlibrary.org/search/authors.json?q=${encodeURIComponent(query)}&limit=${maxResults}`;
    const response = await fetch(url);
    if (!response.ok) throw new ApiError(502, "Author search unavailable.");
    const data = await response.json();
    return (data.docs ?? []).map(a => ({
      id: a.key,
      name: a.name,
      workCount: a.work_count ?? 0,
      topSubjects: (a.top_subjects ?? []).slice(0, 3)
    }));
  } catch (error) {
    console.error("OpenLibrary Author Search Error:", error);
    throw new ApiError(502, "Author search unavailable.");
  }
}

export async function getAuthorDetails(id) {
  try {
    const detailsUrl = `https://openlibrary.org/authors/${encodeURIComponent(id)}.json`;
    const dRes = await fetch(detailsUrl);
    if (!dRes.ok) throw new ApiError(404, "Author not found.");
    const authorData = await dRes.json();

    const worksUrl = `https://openlibrary.org/search.json?author=${encodeURIComponent(authorData.name)}&sort=editions&limit=12`;
    const wRes = await fetch(worksUrl);
    let works = [];
    if (wRes.ok) {
      const wData = await wRes.json();
      works = (wData.docs ?? []).map(normalizeSearch).filter(b => b.title);
    }

    let bio = null;
    if (authorData.bio) {
      bio = typeof authorData.bio === 'object' ? authorData.bio.value : authorData.bio;
    }

    // Attempt to get author photo if available (often they don't have one, but we try)
    const photoUrl = authorData.photos && authorData.photos.length > 0
      ? `https://covers.openlibrary.org/a/id/${authorData.photos[0]}-L.jpg`
      : null;

    return {
      id: id,
      name: authorData.name,
      bio: bio,
      birthDate: authorData.birth_date ?? null,
      deathDate: authorData.death_date ?? null,
      photoUrl: photoUrl,
      works: works
    };
  } catch (error) {
    console.error("OpenLibrary Author Details Error:", error);
    throw new ApiError(502, "Could not fetch author details.");
  }
}
