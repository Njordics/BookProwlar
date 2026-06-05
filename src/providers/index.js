const { HardcoverProvider } = require("./hardcover");
const { OpenLibraryProvider } = require("./openLibrary");
const { GoogleBooksProvider } = require("./googleBooks");
const { GoodreadsProvider } = require("./goodreads");

function buildProviders() {
  return [
    new HardcoverProvider(),
    new OpenLibraryProvider(),
    new GoogleBooksProvider(),
    new GoodreadsProvider()
  ];
}

module.exports = { buildProviders };
