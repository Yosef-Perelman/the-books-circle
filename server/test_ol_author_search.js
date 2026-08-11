async function test() {
  const authorSearch = 'https://openlibrary.org/search.json?author=Rowling&sort=editions&limit=5';
  const aRes = await fetch(authorSearch);
  const aData = await aRes.json();
  console.log("Author Works via Search:", aData.docs.map(e => ({title: e.title, key: e.key, cover: e.cover_i})));
}
test();
