async function test() {
  const fetchCategory = async (query, maxResults = 10) => {
    let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}&printType=books`;
    console.log("fetching", url);
    const res = await fetch(url);
    if (!res.ok) {
        console.log("failed", query, res.status, await res.text());
        return [];
    }
    const data = await res.json();
    return data.items || [];
  };

  const results = await Promise.all([
    fetchCategory('subject:fiction', 15),
    fetchCategory('subject:fiction', 10),
    fetchCategory('subject:science fiction', 10),
    fetchCategory('subject:romance', 10),
  ]);
  console.log("Got lengths:", results.map(r => r.length));
}
test();
