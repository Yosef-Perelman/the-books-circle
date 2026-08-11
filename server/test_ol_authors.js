async function test() {
  const searchUrl = 'https://openlibrary.org/search/authors.json?q=Rowling';
  const sRes = await fetch(searchUrl);
  const sData = await sRes.json();
  console.log("Author Search:", sData.docs[0].key, sData.docs[0].name);

  const authorId = sData.docs[0].key;
  
  const worksUrl = `https://openlibrary.org/authors/${authorId}/works.json?limit=5`;
  const wRes = await fetch(worksUrl);
  const wData = await wRes.json();
  console.log("Author Works:", wData.entries.map(e => ({title: e.title, key: e.key, covers: e.covers})));
  
  const authorDetUrl = `https://openlibrary.org/authors/${authorId}.json`;
  const aRes = await fetch(authorDetUrl);
  const aData = await aRes.json();
  console.log("Author Details:", aData.name, aData.bio?.value ?? aData.bio);
}
test();
