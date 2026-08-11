async function test() {
  const searchUrl = 'https://openlibrary.org/search.json?q=harry+potter&limit=2';
  const sRes = await fetch(searchUrl);
  const sData = await sRes.json();
  console.log("Search:", sData.docs.map(d => ({title: d.title, key: d.key, cover: d.cover_i})));

  const detUrl = `https://openlibrary.org${sData.docs[0].key}.json`;
  const dRes = await fetch(detUrl);
  const dData = await dRes.json();
  console.log("Details:", dData.title, typeof dData.description === 'object' ? dData.description.value : dData.description);
}
test();
