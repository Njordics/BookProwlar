function uniqueBy(items, keyFn) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = keyFn(item);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(item);
  }
  return out;
}

class OpenLibraryProvider {
  constructor() {
    this.name = "Open Library";
  }

  async searchReleases({ follow }) {
    const query = follow.type === "author"
      ? `https://openlibrary.org/search.json?author=${encodeURIComponent(follow.name)}&sort=new&limit=25`
      : `https://openlibrary.org/search.json?title=${encodeURIComponent(follow.name)}&sort=new&limit=25`;

    const response = await fetch(query);
    if (!response.ok) {
      throw new Error(`Open Library request failed: ${response.status}`);
    }

    const payload = await response.json();
    const docs = Array.isArray(payload.docs) ? payload.docs : [];

    const mapped = docs.map((doc) => {
      const publishYears = Array.isArray(doc.publish_year) ? doc.publish_year : [];
      const latestYear = publishYears.length ? Math.max(...publishYears) : doc.first_publish_year;
      const author = Array.isArray(doc.author_name) ? doc.author_name.join(", ") : "Unknown";
      const title = doc.title || null;

      return {
        source: this.name,
        providerId: doc.key || title,
        title,
        author,
        series: follow.type === "series" ? follow.name : null,
        releaseDate: latestYear ? String(latestYear) : null,
        url: doc.key ? `https://openlibrary.org${doc.key}` : "https://openlibrary.org/",
        description: `Open Library editions: ${doc.edition_count || 0}`
      };
    }).filter((x) => x.title);

    return uniqueBy(mapped, (x) => `${x.title}|${x.releaseDate}`);
  }
}

module.exports = { OpenLibraryProvider };
