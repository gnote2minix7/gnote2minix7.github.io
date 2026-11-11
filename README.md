# Rioz — The Bookshelf

The new Rioz design, populated with the existing Suzanna AR storefront collection.

## Included

- 29 original titles: 16 ebooks and 13 comics.
- Original titles, prices (MYR), synopses, category assignments and preview links.
- 28 original cover images, downloaded into `images/` (not hotlinked).
- A styled title cover for **Kawan Baik Anakku**, which had no cover in the source.
- Search, Ebook / Comic filters, accessible book-preview dialogs and responsive layout.
- A cart with one copy per title, removal, refresh persistence and a 5% discount for 3 or more books.
- Original TNG eWallet and Stripe payment links and Telegram receipt-message handoff.

## Preview locally

From this folder, run:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8765/` in a browser. No build or runtime npm dependency is required.

## Publish to the existing GitHub Pages site

Target repository: `gnote2minix7/gnote2minix7.github.io`.

1. Back up the current repository or make a migration branch before replacing the live page.
2. Upload **the contents of this folder**, not the enclosing folder, into the repository's publishing root. Replace `index.html` and add `app.js`, `books.js`, `.nojekyll` and the complete `images/` folder. Existing unrelated assets such as `qr.png` and `TNGo.png` can stay.
3. Commit the changes to the branch configured for Pages.
4. In **Settings → Pages → Build and deployment**, use **Deploy from a branch**, select the publishing branch (normally `main`) and **/(root)**, then Save if these are not already configured.
5. Wait for the Pages deployment in the repository's Actions tab to finish, then verify the live collection, covers, cart and preview links.

GitHub's publishing-source documentation:
https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

This local folder has not been pushed or published automatically.

## Payment and delivery limitations

The original payment URLs are preserved in `PAYMENT_LINKS` in `app.js`. They **do not receive the calculated cart amount, selected titles or email automatically**. Customers must check that the amount on the payment page matches the cart and send their receipt via Telegram.

Opening a payment link is not confirmation of payment. This static site has no payment webhook, order database, automatic email delivery or protected ebook downloads. Google Drive access still requires manual payment verification and fulfillment. Never put private ebook PDFs, access tokens or customer data in this public repository.

The email is used to compose the Telegram order message; this site does not send it to a backend. Customers must send the prepared Telegram message and attach their receipt themselves. The cart stores only selected book identifiers in the browser; the email is not persisted.

## Edit the collection

- `books.js`: book metadata; keep each `id` and `value` unique. `category` is `Ebook` or `Comic`.
- `images/`: cover files referenced by `cover`; leave `cover` empty for a title-only fallback.
- `app.js`: filtering, preview, cart, payment URLs and Telegram handoff.
- `index.html`: original Rioz layout, styling, page copy and checkout markup.

Preview links were copied exactly, including any shared or potentially incorrect links from the old site. Audit destination content separately before launch; no replacements were guessed. External preview destinations and payment processing were not end-to-end validated, and no real payment or Telegram message was sent during testing.

## Tests (development only)

Requires Node.js and npm:

```sh
npm install
npx playwright install chromium
npm test
```

The browser test starts its own loopback HTTP server and checks collection counts, aligned cards, categories, search, previews, covers, cart persistence, discounts, removal, payment URL selection, receipt-message contents and layouts at 320 / 390 / 768 / 1440 pixels. Payment and Telegram windows are intercepted in tests: no transaction or message is sent.

For a dependency-free data and local-cover check:

```sh
npm run test:data
```
