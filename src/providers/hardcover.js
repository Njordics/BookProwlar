class HardcoverProvider {
  constructor() {
    this.name = "Hardcover";
    this.url = "https://api.hardcover.app/v1/graphql";
  }

  async searchReleases({ follow, settings }) {
    const token = settings.providerConfig?.hardcoverApiToken || "";
    if (!token) {
      return [];
    }

    const searchText = follow.name;
    const query = `
      query SearchBooks($query: String!) {
        books(
          limit: 30,
          where: {
            _or: [
              { title: { _ilike: $query } }
              { contributions: { author: { name: { _ilike: $query } } } }
            ]
          },
          order_by: { release_date: desc }
        ) {
          id
          slug
          title
          release_date
          contributions {
            author {
              name
            }
          }
          series_books(limit: 1) {
            series {
              name
            }
          }
        }
      }
    `;

    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        query,
        variables: {
          query: `%${searchText}%`
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Hardcover request failed: ${response.status}`);
    }

    const payload = await response.json();
    if (payload.errors?.length) {
      throw new Error(payload.errors[0].message || "Hardcover GraphQL error");
    }

    const books = Array.isArray(payload.data?.books) ? payload.data.books : [];

    return books.map((book) => ({
      source: this.name,
      providerId: String(book.id),
      title: book.title,
      author: (book.contributions || []).map((c) => c.author?.name).filter(Boolean).join(", ") || "Unknown",
      series: book.series_books?.[0]?.series?.name || (follow.type === "series" ? follow.name : null),
      releaseDate: book.release_date || null,
      url: book.slug ? `https://hardcover.app/books/${book.slug}` : "https://hardcover.app",
      description: "Matched from Hardcover catalog"
    })).filter((x) => x.title && x.releaseDate);
  }
}

module.exports = { HardcoverProvider };
