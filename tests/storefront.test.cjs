const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, 'books.js'), 'utf8'), context);
const books = JSON.parse(vm.runInContext('JSON.stringify(books)', context));
const sourcePath = process.env.LEGACY_BOOKS;

test('imports the full legacy collection with unchanged metadata and local covers', () => {
  assert.equal(books.length, 29);
  assert.equal(new Set(books.map(b => b.id)).size, 29);
  assert.equal(books.filter(b => b.category === 'Ebook').length, 16);
  assert.equal(books.filter(b => b.category === 'Comic').length, 13);
  if (sourcePath) {
    const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    for (const old of source) {
      const book = books.find(b => b.value === old.value);
      assert.ok(book, old.value);
      assert.equal(book.title, old.title);
      assert.equal(book.price, old.price);
      assert.equal(book.synopsis, old.summary);
      assert.equal(book.infoUrl, old.infoUrl);
      assert.equal(book.cover || '', old.cover || '');
    }
  }
  for (const b of books) {
    assert.ok(b.title && b.synopsis && b.author);
    assert.ok(Number.isFinite(b.price) && b.price > 0);
    assert.match(b.infoUrl, /^https:\/\//);
    if (b.cover) assert.ok(fs.existsSync(path.join(root, b.cover)), b.cover);
  }
});
