async function test() {
  const fetchCategory = async (subject, limit = 10) => {
    let url = `https://openlibrary.org/subjects/${subject}.json?limit=${limit}`;
    const res = await fetch(url);
    const data = await res.json();
    console.log(subject, data.works?.length);
  };
  await Promise.all([
    fetchCategory('fiction', 10),
    fetchCategory('science_fiction', 10),
    fetchCategory('romance', 10)
  ]);
}
test();
