class GoogleBooksProvider {
  constructor() {
    this.name = "Google Books";
  }

  async searchReleases({ follow, settings }) {
    const providerCfg = settings.providerConfig || {};
    const apiKey = providerCfg.googleBooksApiKey || "";

    const q = follow.type === "author"
      ? `inauthor:${follow.name}`
      : `intitle:${follow.name}`;

    const params = new URLSearchParams({
      q,
      orderBy: "newest",
      maxResults: "20",
      printType: "books"
    });

    if (apiKey) {
      params.set("key", apiKey);
    }

    const url = `https://www.googleapis.com/books/v1/volumes?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Books request failed: ${response.status}`);
    }

    const payload = await response.json();
    const items = Array.isArray(payload.items) ? payload.items : [];

    return items.map((entry) => {
      const info = entry.volumeInfo || {};
      return {
        source: this.name,
        providerId: entry.id || info.title,
        title: info.title || null,
        author: Array.isArray(info.authors) ? info.authors.join(", ") : "Unknown",
        series: follow.type === "series" ? follow.name : null,
        releaseDate: info.publishedDate || null,
        url: info.infoLink || `https://books.google.com/books?id=${entry.id}`,
        description: info.subtitle || info.description || null
      };
    }).filter((x) => x.title && x.releaseDate);
  }
}

module.exports = { GoogleBooksProvider };
