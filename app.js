'use strict';
const $ = id => document.getElementById(id);
const PAYMENT_LINKS = Object.freeze({
  tng: 'https://payment.tngdigital.com.my/sc/bDLnx1yAeB',
  stripe: 'https://buy.stripe.com/cNi28rfiWdkR1fn7hj57W0v'
});
const CART_KEY = 'rioz-cart-v1';
const cart = new Set();
try {
  const saved = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  if (Array.isArray(saved)) saved.forEach(value => {
    if (books.some(book => book.value === value)) cart.add(value);
  });
} catch { /* Storage is optional; the cart still works for this visit. */ }
let category = 'All books';
let selectedBook;
let lastBook;
const money = cents => 'RM ' + (cents / 100).toFixed(2);
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);
const httpsURL = value => {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; }
  catch { return ''; }
};

function cover(book, eager = false) {
  const fallback = `<div class="cover-fallback"><span class="edition">THE SUZANNA AR COLLECTION</span><span class="ct">${escapeHTML(book.title)}</span><span class="orn" aria-hidden="true">${book.orn}</span><span class="author">${escapeHTML(book.author)}</span></div>`;
  return `<div class="cover" style="background:${book.bg};color:${book.fg}">${fallback}${book.cover ? `<img src="${escapeHTML(book.cover)}" alt="Cover ${escapeHTML(book.title)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async">` : ''}</div>`;
}
function handleCoverErrors(container) {
  container.querySelectorAll('.cover img').forEach(img => {
    const failed = () => img.remove();
    img.addEventListener('error', failed, { once: true });
    if (img.complete && !img.naturalWidth) failed();
  });
}
function render() {
  const query = $('search').value.toLocaleLowerCase().trim();
  const list = books.filter(book => (category === 'All books' || book.category === category)
    && [book.title, book.category, book.synopsis, book.author].join(' ').toLocaleLowerCase().includes(query));
  $('count').textContent = `${list.length} ${list.length === 1 ? 'book' : 'books'} on the shelf · Koleksi Suzanna AR`;
  $('grid').innerHTML = list.length ? list.map(book => `<button class="book" data-id="${book.id}" aria-label="Preview ${escapeHTML(book.title)}"><div class="cover-wrap">${cover(book)}<span class="edition-tag">${book.category}</span></div><div class="category">${book.category}</div><h3>${escapeHTML(book.title)}</h3><div class="meta"><span>Digital edition</span><span class="price">${money(Math.round(book.price * 100))}</span></div></button>`).join('') : '<div class="empty">No books found. Try another title or category.</div>';
  handleCoverErrors($('grid'));
  $('grid').querySelectorAll('.book').forEach(el => {
    el.onclick = () => openBook(Number(el.dataset.id), el);
  });
}
function updateAddButton() {
  const button = $('add-to-cart');
  if (!button || !selectedBook) return;
  button.disabled = cart.has(selectedBook.value);
  button.textContent = button.disabled ? 'Sudah dalam cart ✓' : 'Add to Cart';
}
function openBook(id, element) {
  const book = books.find(item => item.id === id);
  if (!book) return;
  selectedBook = book;
  lastBook = element;
  const previewURL = httpsURL(book.infoUrl);
  $('modal-content').innerHTML = `<div>${cover(book, true)}</div><div><div class="eyebrow">${book.category} · DIGITAL EDITION</div><h2 id="detail-title">${escapeHTML(book.title)}</h2><div class="tiny">By ${escapeHTML(book.author)}</div><p class="synopsis">${escapeHTML(book.synopsis)}</p>${previewURL ? `<a class="preview-link" href="${escapeHTML(previewURL)}" target="_blank" rel="noopener noreferrer">${book.category === 'Comic' ? 'Preview Comic' : 'Baca Disini'} ↗</a>` : ''}<div class="format">${book.category === 'Comic' ? 'Komik digital' : 'ePub / PDF'} · Akses melalui Google Drive selepas pengesahan</div><div class="modal-price">${money(Math.round(book.price * 100))}</div><button type="button" class="buy" id="add-to-cart">Add to Cart</button><p class="note">Pilih 3 buku atau lebih untuk diskaun 5%. Bayar melalui cart.</p></div>`;
  handleCoverErrors($('modal-content'));
  updateAddButton();
  $('add-to-cart').onclick = () => {
    cart.add(book.value);
    renderCart();
    updateAddButton();
    $('status').textContent = book.title + ' ditambah ke cart.';
  };
  $('detail').showModal();
}
function totals() {
  const items = books.filter(book => cart.has(book.value));
  const subtotal = items.reduce((sum, book) => sum + Math.round(book.price * 100), 0);
  const discount = items.length >= 3 ? Math.round(subtotal * 0.05) : 0;
  return { items, subtotal, discount, total: subtotal - discount };
}
function renderCart() {
  const order = totals();
  try { localStorage.setItem(CART_KEY, JSON.stringify([...cart])); } catch { /* Optional storage. */ }
  $('cart-count').textContent = order.items.length;
  $('checkout').hidden = !order.items.length;
  $('cart-items').innerHTML = order.items.length ? order.items.map(book => `<div class="cart-row"><div><strong>${escapeHTML(book.title)}</strong><span>${money(Math.round(book.price * 100))}</span></div><button type="button" class="remove-item secondary" data-value="${book.value}" aria-label="Buang ${escapeHTML(book.title)}">Buang</button></div>`).join('') : '<p class="empty">Cart masih kosong. Pilih ebook atau comic untuk mula.</p>';
  $('cart-items').querySelectorAll('.remove-item').forEach(button => {
    button.onclick = () => {
      cart.delete(button.dataset.value);
      renderCart();
      updateAddButton();
      $('close-cart').focus();
    };
  });
  $('subtotal').textContent = money(order.subtotal);
  $('discount').textContent = '− ' + money(order.discount);
  $('discount-row').hidden = !order.discount;
  $('total').textContent = money(order.total);
  $('payment-status').textContent = '';
}
document.querySelectorAll('.filter').forEach(button => {
  button.setAttribute('aria-pressed', String(button.classList.contains('active')));
  button.onclick = () => {
    category = button.dataset.filter;
    document.querySelectorAll('.filter').forEach(other => {
      other.classList.toggle('active', other === button);
      other.setAttribute('aria-pressed', String(other === button));
    });
    render();
  };
});
$('search').addEventListener('input', render);
$('detail').querySelector('.close').onclick = () => $('detail').close();
$('detail').addEventListener('close', () => lastBook?.isConnected && lastBook.focus());
$('open-cart').onclick = () => { renderCart(); $('cart-dialog').showModal(); };
$('close-cart').onclick = () => $('cart-dialog').close();
for (const dialog of [$('detail'), $('cart-dialog')]) {
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
}
$('payment-form').onsubmit = event => {
  event.preventDefault();
  const method = event.submitter?.value;
  if (!cart.size || !PAYMENT_LINKS[method] || !$('payment-form').reportValidity()) return;
  window.open(PAYMENT_LINKS[method], '_blank', 'noopener,noreferrer');
  $('payment-status').textContent = 'Jumlah yang perlu dibayar: ' + money(totals().total) + '. Semak jumlah di halaman pembayaran dan hantar resit selepas bayar.';
};
$('receipt').onclick = () => {
  if (!cart.size || !$('email').reportValidity()) return;
  const order = totals();
  const message = ['Hi! Saya ingin hantar resit untuk pesanan ini:',
    ...order.items.map(book => '- ' + book.title + ' (' + money(Math.round(book.price * 100)) + ')'),
    'Subtotal: ' + money(order.subtotal), 'Diskaun: ' + money(order.discount),
    'Jumlah bayaran: ' + money(order.total), 'Email: ' + $('email').value.trim(),
    'Sila semak resit pembayaran yang saya lampirkan.'].join('\n');
  window.open('https://t.me/kokombeee?text=' + encodeURIComponent(message), '_blank', 'noopener,noreferrer');
};
$('year').textContent = new Date().getFullYear();
render();
renderCart();
