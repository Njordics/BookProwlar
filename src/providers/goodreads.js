const cheerio = require("cheerio");

class GoodreadsProvider {
  constructor() {
    this.name = "Goodreads";
  }

  async searchReleases({ follow, settings }) {
    if (!settings.providerConfig?.goodreadsEnabled) {
      return [];
    }

    const url = `https://www.goodreads.com/search?q=${encodeURIComponent(follow.name)}&search_type=books`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "BookProwlar/1.0 (+https://localhost)"
      }
    });

    if (!response.ok) {
      throw new Error(`Goodreads request failed: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const out = [];
    $("tr[itemtype='http://schema.org/Book']").each((_, row) => {
      const title = $(row).find("a.bookTitle span").first().text().trim();
      const href = $(row).find("a.bookTitle").attr("href") || "";
      const author = $(row).find("a.authorName span").first().text().trim() || "Unknown";
      const rawDetails = $(row).find("span.minirating").first().text();

      const yearMatch = rawDetails.match(/published\s+(\d{4})/i);
      const year = yearMatch ? yearMatch[1] : null;

      if (!title || !year) {
        return;
      }

      out.push({
        source: this.name,
        providerId: href || `${title}-${year}`,
        title,
        author,
        series: follow.type === "series" ? follow.name : null,
        releaseDate: year,
        url: href ? `https://www.goodreads.com${href}` : "https://www.goodreads.com/",
        description: "Matched from Goodreads search"
      });
    });

    return out;
  }
}

module.exports = { GoodreadsProvider };
