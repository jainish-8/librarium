'use strict';
/* ═══════════════════════════════════════════════════════════
   LIBRARIUM v2 — API-Connected Script
   All data sourced from Flask backend via fetch().
   localStorage used only for UI preferences (theme, accent).
═══════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────────────────── */
const API_BASE = 'http://localhost:5000/api';

function showModal(id) { document.getElementById(id).classList.add('show'); }
function hideModal(id) { document.getElementById(id).classList.remove('show'); }

/* ─────────────────────────────────────────────────────────
   12-COLOR LUXURY GRADIENT SYSTEM (matches backend palette index)
───────────────────────────────────────────────────────── */
const PALETTES = [
  { bg:'linear-gradient(135deg,#0A0E27 0%,#0015FF 100%)',  accent:'#818cf8', deco:'✦' },
  { bg:'linear-gradient(135deg,#064E3B 0%,#059669 100%)',  accent:'#6EE7B7', deco:'❧' },
  { bg:'linear-gradient(135deg,#450A0A 0%,#DC2626 100%)',  accent:'#FCA5A5', deco:'◈' },
  { bg:'linear-gradient(135deg,#2E1065 0%,#7C3AED 100%)',  accent:'#C4B5FD', deco:'⬡' },
  { bg:'linear-gradient(135deg,#0C1A2E 0%,#1E40AF 100%)',  accent:'#93C5FD', deco:'✧' },
  { bg:'linear-gradient(135deg,#1C0533 0%,#9D174D 100%)',  accent:'#F9A8D4', deco:'✿' },
  { bg:'linear-gradient(135deg,#0F1318 0%,#334155 100%)',  accent:'#CBD5E1', deco:'◆' },
  { bg:'linear-gradient(135deg,#431407 0%,#C2410C 100%)',  accent:'#FDBA74', deco:'⬢' },
  { bg:'linear-gradient(135deg,#042F2E 0%,#0F766E 100%)',  accent:'#99F6E4', deco:'✾' },
  { bg:'linear-gradient(135deg,#1E1B4B 0%,#4338CA 100%)',  accent:'#A5B4FC', deco:'◉' },
  { bg:'linear-gradient(135deg,#14532D 0%,#15803D 100%)',  accent:'#86EFAC', deco:'✤' },
  { bg:'linear-gradient(135deg,#292524 0%,#78716C 100%)',  accent:'#D6D3D1', deco:'❋' },
];
const pal = (i) => PALETTES[(i ?? 0) % PALETTES.length];

/* ─────────────────────────────────────────────────────────
   LOCAL UI PREFERENCES (theme / accent only)
───────────────────────────────────────────────────────── */
const UI_PREF_KEY = 'librarium_ui_v2';
function loadUIPrefs() {
  try { return JSON.parse(localStorage.getItem(UI_PREF_KEY) || '{}'); }
  catch { return {}; }
}
function saveUIPrefs(prefs) {
  localStorage.setItem(UI_PREF_KEY, JSON.stringify(prefs));
}

/* ─────────────────────────────────────────────────────────
   CLIENT STATE (runtime only — sourced from API)
───────────────────────────────────────────────────────── */
let STATE = {
  user:          null,    // current user object from /api/auth/me
  dashboard:     null,    // /api/user/dashboard response
  allBooks:      [],      // cache from /api/books
  allAuthors:    [],      // cache from /api/authors
  activeBookId:  null,    // book open in detail panel
  readerBook:    null,    // book open in reader
  readerPage:    0,
  readerChapter: 0,
  readerFontSize:18,
  readerDark:    false,
  carouselIdx:   0,
  carouselTimer: null,
  challengeGoal: 24,
  challengeRead: 0,
};

/* ─────────────────────────────────────────────────────────
   UTILITIES
───────────────────────────────────────────────────────── */
const $  = (s, c=document) => c.querySelector(s);
const $$ = (s, c=document) => [...c.querySelectorAll(s)];
const shortT = (t, n=20) => t && t.length > n ? t.slice(0, n-1)+'…' : (t||'');
const starsHtml = r => {
  const full=Math.floor(r), half=r%1>=0.3;
  return Array.from({length:5},(_,i)=>
    `<span style="color:${i<full?'#F59E0B':i===full&&half?'#F59E0B':'#D1D5DB'}">${i<full?'★':i===full&&half?'⯨':'☆'}</span>`
  ).join('');
};

/* ─────────────────────────────────────────────────────────
   API LAYER — centralised fetch with error handling
───────────────────────────────────────────────────────── */
async function apiFetch(path, opts={}) {
  const defaults = {
    credentials: 'include',
    headers:     { 'Content-Type': 'application/json' },
  };
  const res = await fetch(`${API_BASE}${path}`, { ...defaults, ...opts,
    headers: { ...defaults.headers, ...(opts.headers||{}) }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'API error'), { status: res.status, data });
  return data;
}

const api = {
  get:   (path, params={}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(q ? `${path}?${q}` : path);
  },
  post:  (path, body={}) => apiFetch(path, { method:'POST', body: JSON.stringify(body) }),
  patch: (path, body={}) => apiFetch(path, { method:'PATCH', body: JSON.stringify(body) }),
};

/* ─────────────────────────────────────────────────────────
   TOAST
───────────────────────────────────────────────────────── */
function toast(msg, icon='✓', dur=3200) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span class="toast-icon">${icon}</span>${msg}`;
  $('#toast-stack').appendChild(el);
  setTimeout(() => {
    el.style.animation = 'toastOut .28s ease forwards';
    setTimeout(() => el.remove(), 280);
  }, dur);
}

/* ─────────────────────────────────────────────────────────
   THEME SYSTEM (UI-only preference stored in localStorage)
───────────────────────────────────────────────────────── */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const prefs = loadUIPrefs();
  prefs.theme = theme;
  saveUIPrefs(prefs);
  const chk = $('#theme-check');
  if (chk) chk.checked = theme === 'dark';
}

function applyAccent(color) {
  document.documentElement.style.setProperty('--accent', color);
  document.documentElement.style.setProperty('--accent-mid', color);
  document.documentElement.style.setProperty('--accent-light', color+'22');
  const prefs = loadUIPrefs();
  prefs.accent = color;
  saveUIPrefs(prefs);
}

/* ─────────────────────────────────────────────────────────
   LOADING STATES
───────────────────────────────────────────────────────── */
function showSkeletons(containerId, count=5) {
  const el = $(`#${containerId}`);
  if (!el) return;
  el.innerHTML = Array.from({length:count}, () => '<div class="book-skel"></div>').join('');
}

/* ─────────────────────────────────────────────────────────
   PAGE ROUTING
───────────────────────────────────────────────────────── */
let activePage = 'dashboard';

function goTo(pageId) {
  $$('.page').forEach(p => p.classList.remove('active'));
  $$('.nav-link').forEach(l => l.classList.remove('active'));
  const page = $(`#page-${pageId}`);
  if (page) { page.classList.add('active'); activePage = pageId; }
  const link = $(`.nav-link[data-page="${pageId}"]`);
  if (link) link.classList.add('active');

  // Lazy-load each page's content
  if (pageId === 'authors')    loadAuthorsPage();
  if (pageId === 'my-library') loadLibraryPage();
  if (pageId === 'favorites')  loadFavouritesPage();
  if (pageId === 'settings')   renderSettingsPage();
  if (pageId === 'cart')       { openCart(); return; }

  if (window.innerWidth <= 768) {
    $('#sidebar')?.classList.remove('mobile-open');
    $('#sidebar-overlay')?.classList.remove('show');
  }
}

/* ─────────────────────────────────────────────────────────
   COVER ART BUILDER (uses book.cover_palette from API)
───────────────────────────────────────────────────────── */
function buildCoverEl(book) {
  const p = pal(book.cover_palette ?? 0);
  return `
    <div class="bc-art-inner" style="background:${p.bg}">
      <div class="bai-shimmer"></div>
      <div class="bai-deco" style="color:${p.accent}">${p.deco}</div>
      <div class="bai-title" style="color:${p.accent}">${shortT(book.title, 22)}</div>
      <div class="bai-author">${(book.author_name||book.author||'').split(' ').pop()}</div>
    </div>`;
}

/* ─────────────────────────────────────────────────────────
   BOOK CARD
───────────────────────────────────────────────────────── */
function buildBookCard(book, delay=0) {
  const p = pal(book.cover_palette ?? 0);
  const typeLabel = book.is_ebook ? 'Ebook' : 'Physical';
  const available = book.available_copies > 0;

  const card = document.createElement('div');
  card.className = 'book-card';
  card.style.animationDelay = `${delay}ms`;
  card.dataset.id = book.id;

  card.innerHTML = `
    <div class="bc-cover">
      <div class="bc-art">${buildCoverEl(book)}</div>
      <span class="bc-type">${typeLabel}</span>
      <button class="bc-fav" data-id="${book.id}" aria-label="Favourite">♡</button>
      <div class="bc-overlay">
        <button class="bc-overlay-btn bco-view" data-id="${book.id}">View Details</button>
        ${available
          ? `<button class="bc-overlay-btn bco-cart" data-id="${book.id}">Borrow Free</button>`
          : `<button class="bc-overlay-btn" disabled style="opacity:.4;cursor:not-allowed">Unavailable</button>`}
        ${book.is_ebook ? `<button class="bc-overlay-btn bco-read" data-id="${book.id}">▶ Quick Read</button>` : ''}
      </div>
    </div>
    <div class="bc-info">
      <div class="bc-title">${book.title}</div>
      <div class="bc-author">${book.author_name || book.author || ''}</div>
      <div class="bc-bottom">
        <div class="bc-rating"><span class="bc-star">★</span>${book.rating?.toFixed(1)}</div>
        <span class="bc-price ${available?'':'free'}" style="${available?'':'color:#EF4444'}">
          ${available ? `${book.available_copies} left` : 'Unavailable'}
        </span>
      </div>
    </div>`;

  card.querySelector('.bco-view')?.addEventListener('click', e => { e.stopPropagation(); openPanel(book); });
  card.querySelector('.bco-cart')?.addEventListener('click', e => { e.stopPropagation(); borrowBook(book); });
  card.querySelector('.bco-read')?.addEventListener('click', e => { e.stopPropagation(); openReader(book); });
  card.querySelector('.bc-fav').addEventListener('click', e => { e.stopPropagation(); toggleFav(book, card.querySelector('.bc-fav')); });
  card.addEventListener('click', () => openPanel(book));
  return card;
}

function renderRow(containerId, books, skeletonCount=6) {
  const row = $(`#${containerId}`);
  if (!row) return;
  row.innerHTML = '';
  if (!books || !books.length) {
    row.innerHTML = '<p style="color:var(--text-4);padding:20px;font-size:13px">Nothing to show here yet.</p>';
    return;
  }
  books.forEach((b, i) => row.appendChild(buildBookCard(b, i * 55)));
}

/* ─────────────────────────────────────────────────────────
   DASHBOARD — Load from API
───────────────────────────────────────────────────────── */
async function loadDashboard() {
  try {
    showSkeletons('trending-row', 6);
    showSkeletons('rec-row', 6);
    showSkeletons('ebook-row', 5);

    // Fetch all books from API
    const { books } = await api.get('/books', { limit: 100 });
    STATE.allBooks = books;

    // Trending: highest borrow count
    const trending = [...books].sort((a,b)=>b.borrow_count-a.borrow_count).slice(0,8);
    // Recommended: highest rated
    const recommended = [...books].sort((a,b)=>b.rating-a.rating).slice(0,8);
    // Ebooks only
    const ebooks = books.filter(b=>b.is_ebook).slice(0,7);

    renderRow('trending-row', trending);
    renderRow('rec-row', recommended);
    renderRow('ebook-row', ebooks);

    // Hero carousel from top 4 books
    buildCarousel(trending.slice(0,4));

    // Challenge from dashboard if logged in
    if (STATE.user) await loadChallenge();

  } catch (err) {
    console.error('Dashboard load error:', err);
    toast('Failed to load books from server.', '⚠', 4000);
  }
}

async function loadChallenge() {
  try {
    const { reading_challenge } = await api.get('/user/dashboard');
    STATE.challengeGoal = reading_challenge.goal;
    STATE.challengeRead = reading_challenge.read;
    updateChallengeUI();
  } catch { /* guest view — keep defaults */ }
}

function updateChallengeUI() {
  const read = STATE.challengeRead;
  const goal = STATE.challengeGoal;
  const pct  = goal > 0 ? Math.min(100, Math.round((read/goal)*100)) : 0;

  $('#ch-read') && ($('#ch-read').textContent = read);
  $('#ch-goal') && ($('#ch-goal').textContent = goal);
  $('#ch-pct')  && ($('#ch-pct').textContent  = pct);
  $('#ch-fill') && ($('#ch-fill').style.width  = `${pct}%`);
  $('#ch-label')&& ($('#ch-label').textContent = `${read} / ${goal}`);

  const stack = $('#ch-books-visual');
  if (stack) {
    const colours = ['#4338CA','#7C3AED','#0891B2','#D97706','#059669','#DC2626','#1E40AF'];
    const heights = [90,110,75,100,85,95,70];
    stack.innerHTML = [...Array(Math.min(read,7))].map((_,i)=>
      `<div class="ch-book-bar" style="height:${heights[i%7]}px;background:${colours[i%colours.length]}"></div>`
    ).join('');
  }
}

/* ─────────────────────────────────────────────────────────
   HERO CAROUSEL — built from API book data
───────────────────────────────────────────────────────── */
function buildCarousel(heroBooks) {
  const track = $('#carousel-track');
  const dots  = $('#carousel-dots');
  if (!track || !dots) return;
  track.innerHTML = '';
  dots.innerHTML  = '';

  heroBooks.forEach((book, i) => {
    const p = pal(book.cover_palette ?? i);
    const slide = document.createElement('div');
    slide.className = 'carousel-slide';
    slide.innerHTML = `
      <div class="cs-bg" style="background:${p.bg}"></div>
      <div class="cs-overlay"></div>
      <div class="cs-content">
        <div class="cs-eyebrow"><span class="cs-pulse"></span>Featured This Week</div>
        <h1 class="cs-title">${book.title}</h1>
        <p class="cs-author">by ${book.author_name || book.author || ''}</p>
        <p class="cs-desc">${(book.description||'').slice(0,140)}…</p>
        <div class="cs-rating">
          <div class="stars-row">${starsHtml(book.rating||0)}</div>
          <span class="cs-rating-txt">${(book.rating||0).toFixed(1)} · ${(book.borrow_count||0).toLocaleString()} borrows</span>
        </div>
        <div class="cs-acts">
          <button class="btn-primary cs-view" data-id="${book.id}">Explore Book</button>
          ${book.available_copies > 0
            ? `<button class="btn-outline" style="background:rgba(255,255,255,.1);color:#fff;border-color:rgba(255,255,255,.2)" data-borrow="${book.id}">Borrow Free</button>`
            : `<button class="btn-outline" disabled style="opacity:.4">Unavailable</button>`}
        </div>
      </div>
      <div class="cs-book" style="background:${p.bg};border-radius:3px 8px 8px 3px">
        <div class="cs-book-inner" style="background:${p.bg};border-radius:3px 8px 8px 3px">
          <div class="csbi-deco" style="color:${p.accent}">${p.deco}</div>
          <div class="csbi-title" style="color:${p.accent}">${book.title}</div>
          <div class="csbi-author">${book.author_name || book.author || ''}</div>
        </div>
      </div>`;

    slide.querySelector('.cs-view').addEventListener('click', () => openPanel(book));
    slide.querySelector('[data-borrow]')?.addEventListener('click', () => borrowBook(book));
    track.appendChild(slide);

    const dot = document.createElement('div');
    dot.className = `c-dot${i===0?' active':''}`;
    dot.addEventListener('click', () => setSlide(i));
    dots.appendChild(dot);
  });

  startCarouselTimer();
}

function setSlide(idx) {
  STATE.carouselIdx = idx;
  const track = $('#carousel-track');
  if (track) track.style.transform = `translateX(-${idx * 100}%)`;
  $$('.c-dot').forEach((d,i) => d.classList.toggle('active', i===idx));
  clearInterval(STATE.carouselTimer);
  STATE.carouselTimer = setInterval(() => setSlide((STATE.carouselIdx+1) % 4), 5500);
}
function startCarouselTimer() {
  clearInterval(STATE.carouselTimer);
  STATE.carouselTimer = setInterval(() => setSlide((STATE.carouselIdx+1) % 4), 5500);
}

/* ─────────────────────────────────────────────────────────
   BOOK DETAIL PANEL — fetches from cached STATE.allBooks
───────────────────────────────────────────────────────── */
function openPanel(book) {
  STATE.activeBookId = book.id;
  const p = pal(book.cover_palette ?? 0);

  // Cover
  const cover = $('#panel-cover-3d');
  cover.style.background = p.bg;
  cover.innerHTML = `<div style="text-align:center;color:${p.accent};padding:14px">
    <div style="font-size:22px;margin-bottom:8px">${p.deco}</div>
    <div style="font-family:'Instrument Serif',serif;font-size:13px;line-height:1.3;margin-bottom:8px">${book.title}</div>
    <div style="font-size:9px;opacity:.6;letter-spacing:.15em;text-transform:uppercase">${book.author_name||book.author||''}</div>
  </div>`;
  $('#panel-glow').style.background = `radial-gradient(ellipse at center,rgba(0,21,255,.25) 0%,transparent 70%)`;

  // Meta
  const typeLabel = book.is_ebook ? 'Ebook' : 'Physical';
  $('#panel-badges').innerHTML = `<span class="p-badge type">${typeLabel}</span><span class="p-badge genre">${book.category||''}</span>`;
  $('#panel-title').textContent  = book.title;
  $('#panel-author').textContent = `by ${book.author_name || book.author || ''}`;
  $('#panel-rating').innerHTML   = `<div class="stars-row">${starsHtml(book.rating||0)}</div><span class="rc">${(book.rating||0).toFixed(1)} rating</span>`;
  $('#panel-chips').innerHTML    = (book.tags||[]).map(t=>`<span class="p-chip">${t}</span>`).join('') + `<span class="p-chip">${book.pages}pp</span>`;
  $('#panel-price').textContent  = `$${(book.price||0).toFixed(2)}`;
  $('#panel-orig').textContent   = '';
  $('#panel-save').style.display = 'none';
  $('#panel-desc').textContent   = book.description || '';

  // Copies info
  const copies = book.available_copies ?? 0;
  const cartBtn = $('#p-cart-btn');
  if (copies > 0) {
    cartBtn.textContent = `Borrow Free (${copies} left)`;
    cartBtn.disabled = false;
    cartBtn.style.opacity = '1';
  } else {
    cartBtn.textContent = 'Unavailable';
    cartBtn.disabled = true;
    cartBtn.style.opacity = '0.45';
  }

  // Read btn (ebooks only)
  const readBtn = $('#p-read-btn');
  book.is_ebook ? readBtn.classList.add('show') : readBtn.classList.remove('show');

  // Details table
  $('#detail-table').innerHTML = [
    ['Author',    book.author_name || book.author || ''],
    ['Publisher', book.publisher || ''],
    ['Year',      book.year || ''],
    ['Pages',     book.pages || ''],
    ['Language',  book.language || 'English'],
    ['ISBN',      book.isbn || ''],
    ['Category',  book.category || ''],
    ['Available', `${copies} / ${book.total_copies || '?'} copies`],
  ].map(([k,v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('');

  // Similar books (same category)
  const simRow = $('#similar-row');
  simRow.innerHTML = '';
  const similar = STATE.allBooks
    .filter(b => b.category===book.category && b.id!==book.id)
    .slice(0,4);
  similar.forEach(sb => {
    const sp = pal(sb.cover_palette??0);
    const sc = document.createElement('div');
    sc.className = 'sim-card';
    sc.innerHTML = `<div class="sim-cover" style="background:${sp.bg}">${shortT(sb.title,16)}</div><div class="sim-title">${sb.title}</div>`;
    sc.addEventListener('click', () => openPanel(sb));
    simRow.appendChild(sc);
  });

  $('#detail-panel').classList.add('open');
  $('#detail-panel').setAttribute('aria-hidden','false');
  $('#panel-scrim').classList.add('show');
}

function closePanel() {
  $('#detail-panel').classList.remove('open');
  $('#panel-scrim').classList.remove('show');
  STATE.activeBookId = null;
}

/* ─────────────────────────────────────────────────────────
   FAVOURITES (localStorage-backed since it's a UI preference)
───────────────────────────────────────────────────────── */
function getFavIds() {
  const prefs = loadUIPrefs();
  return prefs.favourites || [];
}
function saveFavIds(ids) {
  const prefs = loadUIPrefs();
  prefs.favourites = ids;
  saveUIPrefs(prefs);
}

function toggleFav(book, btnEl) {
  const ids = getFavIds();
  const idx = ids.indexOf(book.id);
  if (idx > -1) {
    ids.splice(idx, 1);
    if (btnEl) { btnEl.classList.remove('active'); btnEl.textContent = '♡'; }
    toast('Removed from Favourites', '💔');
  } else {
    ids.push(book.id);
    if (btnEl) { btnEl.classList.add('active'); btnEl.textContent = '❤'; }
    toast('Added to Favourites ❤', '❤');
  }
  saveFavIds(ids);
  updateCountBadges();
}

function loadFavouritesPage() {
  const grid  = $('#fav-grid');
  const empty = $('#fav-empty');
  if (!grid) return;
  const ids = getFavIds();
  const favBooks = STATE.allBooks.filter(b => ids.includes(b.id));

  if (!favBooks.length) { empty.style.display='flex'; grid.innerHTML=''; return; }
  empty.style.display = 'none';
  grid.innerHTML = '';
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(162px,1fr));gap:16px;padding:0 32px 32px';
  favBooks.forEach((b,i) => grid.appendChild(buildBookCard(b, i*50)));
}

/* ─────────────────────────────────────────────────────────
   BORROW BOOK — calls POST /api/borrow/:id
───────────────────────────────────────────────────────── */
async function handleBorrow(bookId) {
    const user = JSON.parse(localStorage.getItem('librarium_user'));
    
    if (!user) {
        showModal('auth-modal'); // If no user in storage, show login
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/borrow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, book_id: bookId })
        });

        const result = await response.json();
        if (response.status === 401) {
            showModal('auth-modal');
        } else if (result.success) {
            alert("Book Borrowed Successfully!");
            location.reload(); // Refresh to see updated stock
        }
    } catch (err) {
        console.error("Borrowing failed:", err);
    }
}

/* ─────────────────────────────────────────────────────────
   RETURN BOOK — calls POST /api/return/:id
───────────────────────────────────────────────────────── */
async function returnBook(bookId) {
  try {
    const { message, fine } = await api.post(`/return/${bookId}`);
    toast(message, fine > 0 ? '⚠' : '✓', 5000);

    const cached = STATE.allBooks.find(b => b.id === bookId);
    if (cached) cached.available_copies = Math.min((cached.available_copies||0)+1, cached.total_copies||1);

    if (activePage === 'my-library') loadLibraryPage();
  } catch (err) {
    toast(err.data?.error || 'Could not return this book.', '⚠');
  }
}

/* ─────────────────────────────────────────────────────────
   MY LIBRARY — fetches from /api/user/dashboard
───────────────────────────────────────────────────────── */
async function loadLibraryPage() {
  if (!STATE.user) {
    $$('.tab-panel').forEach(p => p.querySelector('.lib-grid') && (p.querySelector('.lib-grid').innerHTML=''));
    toast('Log in to see your library.', '🔒');
    return;
  }

  try {
    const dash = await api.get('/user/dashboard');
    STATE.dashboard = dash;

    renderLibraryTab('reading',   dash.active_borrows, 'reading');
    renderLibraryTab('completed', dash.history,         'completed');
    renderWishlistTab();

  } catch (err) {
    toast('Failed to load library.', '⚠');
  }
}

function renderLibraryTab(tabId, borrows, status) {
  const grid  = $(`#${tabId}-grid`);
  const empty = $(`#${tabId}-empty`);
  if (!grid) return;
  grid.innerHTML = '';

  const items = (borrows||[]).filter(t => status==='completed' ? true : t.status!=='returned');

  if (!items.length) { if(empty) empty.style.display='flex'; return; }
  if(empty) empty.style.display = 'none';

  items.forEach((txn, i) => {
    const book = txn.book || STATE.allBooks.find(b=>b.id===txn.book_id) || {};
    const p = pal(book.cover_palette??0);
    const isActive = txn.status==='borrowed' || txn.status==='overdue';
    const pct = txn.progress_pct || 0;

    const el = document.createElement('div');
    el.className = 'lib-card';
    el.style.animationDelay = `${i*50}ms`;
    el.innerHTML = `
      <div class="lc-cover">
        <div class="lc-cover-inner" style="background:${p.bg}">
          <div class="bai-shimmer"></div>
          <div class="bai-deco" style="color:${p.accent}">${p.deco}</div>
          <div class="bai-title" style="color:${p.accent}">${shortT(book.title||txn.book_title,20)}</div>
        </div>
        ${txn.status==='overdue'?'<div style="position:absolute;top:8px;left:8px;background:#EF4444;color:#fff;font-size:9px;font-weight:700;padding:3px 8px;border-radius:99px">OVERDUE</div>':''}
      </div>
      <div class="lc-info">
        <div class="lc-title">${book.title||txn.book_title||'Unknown'}</div>
        <div class="lc-author">${book.author_name||''}</div>
        ${isActive ? `
          <div class="lc-prog-wrap">
            <div class="lc-prog-bar"><div class="lc-prog-fill" style="width:${pct}%"></div></div>
            <span class="lc-pct">${Math.round(pct)}%</span>
          </div>
          <span class="lc-status reading">Reading</span>
          ${txn.fine_amount > 0 ? `<div style="font-size:10px;color:#EF4444;margin-top:4px;font-weight:700">Fine: $${txn.fine_amount.toFixed(2)}</div>` : ''}
          <button class="btn-outline" style="width:100%;margin-top:8px;font-size:11px;padding:6px" data-return="${txn.book_id}">Return Book</button>
        ` : `
          <span class="lc-status completed">✓ Returned</span>
          ${txn.fine_amount > 0 ? `<div style="font-size:10px;color:#EF4444;margin-top:4px">Fine paid: $${txn.fine_amount.toFixed(2)}</div>` : ''}
        `}
      </div>`;

    el.querySelector('[data-return]')?.addEventListener('click', e => {
      e.stopPropagation();
      if (confirm(`Return "${book.title||txn.book_title}"?`)) returnBook(txn.book_id);
    });
    el.addEventListener('click', () => {
      if (book.id && book.is_ebook && isActive) {
        openReader({...book, txnId: txn.id});
      } else if (book.id) {
        openPanel(book);
      }
    });
    grid.appendChild(el);
  });
}

function renderWishlistTab() {
  const grid  = $('#wishlist-grid');
  const empty = $('#wishlist-empty');
  if (!grid) return;
  const ids = getFavIds();
  const books = STATE.allBooks.filter(b => ids.includes(b.id));
  grid.innerHTML = '';
  if (!books.length) { if(empty) empty.style.display='flex'; return; }
  if(empty) empty.style.display = 'none';
  books.forEach((b,i) => grid.appendChild(buildBookCard(b, i*50)));
}

/* ─────────────────────────────────────────────────────────
   AUTHORS PAGE — fetches from /api/authors
───────────────────────────────────────────────────────── */
async function loadAuthorsPage() {
  const grid = $('#authors-grid');
  if (!grid) return;
  grid.innerHTML = '<div style="padding:40px;color:var(--text-4);font-size:13px">Loading authors…</div>';

  try {
    if (!STATE.allAuthors.length) {
      const { authors } = await api.get('/authors');
      STATE.allAuthors = authors;
    }

    grid.innerHTML = '';
    STATE.allAuthors.forEach((author, i) => {
      const p = pal(i);
      const card = document.createElement('div');
      card.className = 'author-card';
      card.style.animationDelay = `${i*40}ms`;
      card.innerHTML = `
        <div class="author-ava" style="background:${p.bg}">${author.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
        <div class="author-name">${author.name}</div>
        <div class="author-genre">${author.genre}</div>
        <div class="author-bio">${(author.bio||'').slice(0,150)}…</div>
        <span class="author-count">${author.book_count||0} book${author.book_count!==1?'s':''}</span>`;

      card.addEventListener('click', () => filterByAuthor(author));
      grid.appendChild(card);
    });

  } catch (err) {
    grid.innerHTML = '<p style="padding:40px;color:var(--text-4)">Failed to load authors.</p>';
  }
}

async function filterByAuthor(author) {
  goTo('dashboard');
  try {
    const { books } = await api.get('/books', { limit: 20 });
    const filtered = books.filter(b => b.author_id === author.id || (b.author_name||'').toLowerCase() === author.name.toLowerCase());
    renderRow('trending-row', filtered.length ? filtered : books.slice(0,6));
    renderRow('rec-row', filtered.length ? filtered : books.slice(0,6));
    toast(`Showing books by ${author.name}`, '📚');
  } catch { /* fallback to cached */ }
}

/* ─────────────────────────────────────────────────────────
   SEARCH — server-side via /api/search
───────────────────────────────────────────────────────── */
function initSearch() {
  const topInput = $('#top-search');
  const drop     = $('#search-drop');
  let timer;

  async function runSearch(q) {
    if (q.length < 2) { drop.classList.remove('open'); return; }
    try {
      const { books, authors } = await api.get('/search', { q });

      drop.innerHTML = `<div class="sd-label">Books (${books.length})</div>` +
        (books.length
          ? books.map(b => {
              const p = pal(b.cover_palette??0);
              return `<div class="sd-item" data-id="${b.id}">
                <div class="sd-cover" style="background:${p.bg}">${shortT(b.title,12)}</div>
                <div class="sd-info">
                  <span class="sd-name">${b.title}</span>
                  <span class="sd-sub">${b.author_name||b.author||''} · ${b.category}</span>
                </div>
              </div>`;
            }).join('')
          : '<div style="padding:12px 16px;font-size:13px;color:var(--text-4)">No books found</div>'
        );

      if (authors.length) {
        drop.innerHTML += `<div class="sd-label">Authors</div>` + authors.map(a =>
          `<div class="sd-item" data-author-id="${a.id}">
            <div class="sd-cover" style="background:linear-gradient(135deg,#1a1a2e,#0015FF)">${a.name.slice(0,2)}</div>
            <div class="sd-info"><span class="sd-name">${a.name}</span><span class="sd-sub">${a.genre}</span></div>
          </div>`
        ).join('');
      }

      drop.classList.add('open');

      drop.querySelectorAll('.sd-item[data-id]').forEach(el => {
        el.addEventListener('click', () => {
          const book = STATE.allBooks.find(b => b.id===el.dataset.id);
          if (book) { openPanel(book); drop.classList.remove('open'); topInput.value=''; }
        });
      });
      drop.querySelectorAll('.sd-item[data-author-id]').forEach(el => {
        el.addEventListener('click', () => {
          const author = STATE.allAuthors.find(a => a.id===el.dataset.authorId);
          if (author) { filterByAuthor(author); drop.classList.remove('open'); topInput.value=''; }
        });
      });

    } catch { drop.innerHTML = '<div style="padding:12px 16px;color:var(--text-4)">Search unavailable</div>'; drop.classList.add('open'); }
  }

  topInput?.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => runSearch(topInput.value.trim()), 250); });
  topInput?.addEventListener('focus', () => { if (topInput.value.trim().length>=2) drop.classList.add('open'); });
  document.addEventListener('click', e => { if (!e.target.closest('.topbar-l')) drop.classList.remove('open'); });

  // Sidebar search mirrors topbar
  $('#sb-search')?.addEventListener('input', e => {
    topInput.value = e.target.value;
    clearTimeout(timer);
    timer = setTimeout(() => runSearch(e.target.value.trim()), 250);
  });
}

/* ─────────────────────────────────────────────────────────
   CATEGORY FILTER
───────────────────────────────────────────────────────── */
async function filterByCategory(cat) {
  showSkeletons('trending-row', 6);
  showSkeletons('rec-row', 6);
  try {
    const params = cat==='all' ? { sort:'borrow_count', limit:8 } : { category: cat, sort:'borrow_count', limit:8 };
    const { books } = await api.get('/books', params);
    const byRating = cat==='all' ? [...books].sort((a,b)=>b.rating-a.rating).slice(0,6) : books.slice(0,6);
    renderRow('trending-row', books.slice(0,8));
    renderRow('rec-row', byRating);
  } catch { toast('Filter failed.','⚠'); }
}

/* ─────────────────────────────────────────────────────────
   EBOOK READER
───────────────────────────────────────────────────────── */
const CHAPTER_PAGES = [
  { title:'Chapter 1: A Silence of Three Parts', pages:[
    `It was night again. The Waystone Inn lay in silence, and it was a silence of three parts.\n\nThe most obvious part was a hollow, echoing quiet, made by things that were lacking. If there had been a wind it would have sighed through the trees, set the inn's sign creaking on its hooks, and brushed the silence down the road like trailing autumn leaves.\n\nInside the Waystone a pair of men huddled at one corner of the bar. They drank with quiet determination, avoiding each other's eyes. The innkeeper moved with the deliberate calm of a man at the still point of a turning world.\n\nHis name was Kote. He had red hair, though not the carrot-red one sees in children, nor the copper of a new penny, but a slow, deep red like the fading heartwood of a darkening tree.`,
    `He had a quick wit, and had never been a coward. He had a gift for languages, having learned a dozen or so over the years of his life. He loved music and played expertly. When he arrived at the Waystone Inn, he had carried with him three things.\n\nFirst: a large iron ring with a number of keys hanging from it.\n\nSecond: a lacquered selas-wood case, long as a man's arm, narrow as a hand, and deep as a fist.\n\nThird: a leather-wrapped cylinder about the size of a man's thigh.\n\nOn his first night, Kote had taken out the lute case and set it on the highest shelf behind the bar, and he had never taken it down again.`,
  ]},
  { title:'Chapter 2: A Beautiful Day', pages:[
    `It was midmorning of the next day when the tinker came to the Waystone Inn. He came early, as tinkers always do, before the heat of the day lay heavy on the road.\n\nThe tinker was old, as most tinkers are, with a back bent by years of carrying and a face weathered by sun and wind. He came carrying a heavy pack, walking with the deliberate steadiness of a man who knew his own pace.\n\nKote was behind the bar polishing cups when the door opened. He looked up and for a moment his careful innkeeper's expression slipped, and something flickered behind his eyes. A shadow of the shape a man can become when he has said goodbye to a part of himself.`,
    `"What can I get for you?" Kote asked. "We have cider, beer, and wine. Also food, if you're hungry."\n\n"I've not eaten since yesterday's noon," the tinker admitted, settling onto a barstool with the sigh of a man setting down a great weight.\n\nKote fed him eggs and bread, and the tinker ate with the honest enthusiasm of the genuinely hungry. Kote watched him eat without seeming to watch, the way a good innkeeper learns to do.\n\nWhen the tinker was half-finished, he looked up and said, "You play, don't you?" He nodded toward the lute case on the high shelf.\n\nKote looked at it for a long moment. "Not anymore," he said.`,
  ]},
];

function openReader(book) {
  STATE.readerBook = book;
  STATE.readerFontSize = 18;

  $('#reader-title').textContent = book.title || 'Reading…';
  renderReaderPage();

  $('#reader-shell').classList.add('open');
  document.body.style.overflow = 'hidden';
  updateSidebarWidget(book, computeReaderProgress());
}

function closeReader() {
  saveReaderProgress();
  $('#reader-shell').classList.remove('open');
  document.body.style.overflow = '';
}

function renderReaderPage() {
  const { readerChapter: ch, readerPage: pg, readerFontSize: fs, readerDark: dark } = STATE;
  const chapter = CHAPTER_PAGES[ch % CHAPTER_PAGES.length];
  const text    = chapter.pages[pg % chapter.pages.length];

  $('#chapter-title').textContent = chapter.title;
  $('#chapter-text').innerHTML    = text.split('\n\n').map(para =>
    `<p style="font-size:${fs}px">${para}</p>`
  ).join('');

  const totalPages  = CHAPTER_PAGES.reduce((s,c)=>s+c.pages.length,0);
  const currentPage = CHAPTER_PAGES.slice(0,ch).reduce((s,c)=>s+c.pages.length,0) + pg + 1;
  $('#rd-page-info').textContent = `Page ${currentPage} of ${totalPages}`;

  const pct = Math.round((currentPage / totalPages) * 100);
  $('#reader-prog').style.width = `${pct}%`;

  $('#reader-shell').classList.toggle('dark-reader', dark);
  $('#rd-theme').textContent = dark ? '🌙' : '☀';

  if (STATE.readerBook) updateSidebarWidget(STATE.readerBook, pct);
}

function computeReaderProgress() {
  const totalPages  = CHAPTER_PAGES.reduce((s,c)=>s+c.pages.length,0);
  const currentPage = CHAPTER_PAGES.slice(0,STATE.readerChapter).reduce((s,c)=>s+c.pages.length,0) + STATE.readerPage + 1;
  return Math.round((currentPage / totalPages) * 100);
}

async function saveReaderProgress() {
  if (!STATE.readerBook || !STATE.user) return;
  const pct = computeReaderProgress();
  try {
    await api.post(`/progress/${STATE.readerBook.id}`, {
      current_page: STATE.readerPage,
      progress_pct: pct,
    });
  } catch { /* silent — progress save is best-effort */ }
}

function updateSidebarWidget(book, pct) {
  if (!book) return;
  const p = pal(book.cover_palette??0);
  $('#rw-cover') && ($('#rw-cover').style.background = p.bg);
  $('#rw-title') && ($('#rw-title').textContent = book.title||'');
  $('#rw-fill')  && ($('#rw-fill').style.width  = `${pct}%`);
  $('#rw-pct')   && ($('#rw-pct').textContent   = `${pct}% complete`);
}

/* ─────────────────────────────────────────────────────────
   AUTH — Login / Signup modal
───────────────────────────────────────────────────────── */
function showAuthModal(mode='login') {
  // Redirect to settings / login UI
  // For simplicity, goTo settings if no modal exists
  goTo('settings');
  toast('Please log in or sign up.', '🔒');
}

async function loadCurrentUser() {
  try {
    const { user } = await api.get('/auth/me');
    STATE.user = user;
    applyUserToUI(user);
  } catch {
    STATE.user = null;
  }
}

function applyUserToUI(user) {
  if (!user) return;
  $$('.user-name').forEach(el => el.textContent = user.name||'');
  $$('#user-ava, #settings-ava').forEach(el => el.textContent = (user.name||'?').charAt(0).toUpperCase());
  if ($('#user-name-display')) $('#user-name-display').textContent = user.name||'';
  if (user.reading_goal) STATE.challengeGoal = user.reading_goal;
  if (user.books_read)   STATE.challengeRead = user.books_read;
  updateCountBadges();
}

/* ─────────────────────────────────────────────────────────
   SETTINGS PAGE
───────────────────────────────────────────────────────── */
function renderSettingsPage() {
  const user = STATE.user;
  if (!user) return;
  const pName  = $('#pref-name');
  const pEmail = $('#pref-email');
  if (pName)  pName.value  = user.name  || '';
  if (pEmail) pEmail.value = user.email || '';
  $('#fsc-val') && ($('#fsc-val').textContent = STATE.readerFontSize);
  $('#goal-val')&& ($('#goal-val').textContent = STATE.challengeGoal);
  if ($('#settings-ava'))      $('#settings-ava').textContent = (user.name||'?').charAt(0);
  if ($('#settings-ava-name')) $('#settings-ava-name').textContent = user.name||'';

  const prefs = loadUIPrefs();
  $$('.swatch').forEach(sw => sw.classList.toggle('active', sw.dataset.accent===(prefs.accent||'#0015FF')));
}

/* ─────────────────────────────────────────────────────────
   CART — borrows from API
───────────────────────────────────────────────────────── */
async function openCart() {
  if (!STATE.user) { toast('Log in to view your cart/borrows.','🔒'); return; }
  try {
    const dash = await api.get('/user/dashboard');
    const list  = $('#cart-list');
    const empty = $('#cart-empty');
    const ft    = $('#cart-ft');

    if (!dash.active_borrows.length) {
      empty.style.display='flex'; list.innerHTML=''; ft.style.display='none';
    } else {
      empty.style.display='none'; ft.style.display='block';
      list.innerHTML = dash.active_borrows.map(txn => {
        const book = txn.book || {};
        const p = pal(book.cover_palette??0);
        const daysLeft = txn.days_remaining ?? '?';
        return `<div class="cart-item">
          <div class="ci-cover" style="background:${p.bg}">${shortT(book.title||txn.book_title,14)}</div>
          <div class="ci-info">
            <div class="ci-title">${book.title||txn.book_title||'Unknown'}</div>
            <div class="ci-author">${book.author_name||''}</div>
            <div class="ci-bottom">
              <span style="font-size:12px;color:${txn.status==='overdue'?'#EF4444':'var(--text-3)'}">
                ${txn.status==='overdue' ? `⚠ Overdue — Fine: $${(txn.fine_amount||0).toFixed(2)}` : `${daysLeft} day${daysLeft!==1?'s':''} left`}
              </span>
              <button class="btn-outline" style="font-size:11px;padding:5px 10px" onclick="returnBook('${txn.book_id}');closeCart()">Return</button>
            </div>
          </div>
        </div>`;
      }).join('');

      const totalFines = dash.total_outstanding_fines;
      $('#cart-sub')   && ($('#cart-sub').textContent   = `$${totalFines.toFixed(2)}`);
      $('#cart-total') && ($('#cart-total').textContent = `$${totalFines.toFixed(2)}`);
      $('#cart-count-label') && ($('#cart-count-label').textContent = `(${dash.active_borrows.length})`);
    }
  } catch { toast('Could not load borrows.', '⚠'); }

  $('#cart-drawer').classList.add('open');
  $('#cart-scrim').classList.add('show');
}

function closeCart() {
  $('#cart-drawer').classList.remove('open');
  $('#cart-scrim').classList.remove('show');
}

/* ─────────────────────────────────────────────────────────
   BADGE COUNTS
───────────────────────────────────────────────────────── */
function updateCountBadges() {
  const favCount = getFavIds().length;
  $$('#fav-count').forEach(el => el.textContent = favCount||'');
  if (STATE.dashboard) {
    const activeCount = STATE.dashboard.active_borrows?.length||0;
    $$('#lib-count, #sb-cart-count, #cart-dot').forEach(el => el.textContent = activeCount||'');
  }
}

/* ─────────────────────────────────────────────────────────
   EVENT WIRING
───────────────────────────────────────────────────────── */
function wireEvents() {
  // Nav links
  $$('.nav-link[data-page]').forEach(link =>
    link.addEventListener('click', e => { e.preventDefault(); goTo(link.dataset.page); })
  );

  // Sidebar collapse
  $('#sidebar-toggle')?.addEventListener('click', () => $('#sidebar')?.classList.toggle('collapsed'));

  // Mobile menu
  $('#menu-btn')?.addEventListener('click', () => {
    $('#sidebar')?.classList.toggle('mobile-open');
    $('#sidebar-overlay')?.classList.toggle('show');
  });
  $('#sidebar-overlay')?.addEventListener('click', () => {
    $('#sidebar')?.classList.remove('mobile-open');
    $('#sidebar-overlay')?.classList.remove('show');
  });

  // Category submenu
  const catToggle = $('#nav-cat-toggle');
  const catMenu   = $('#cat-submenu');
  catToggle?.addEventListener('click', () => {
    catToggle.classList.toggle('open');
    catMenu?.classList.toggle('open');
  });
  $$('.nav-sub').forEach(a => a.addEventListener('click', e => {
    e.preventDefault(); filterByCategory(a.dataset.cat); goTo('dashboard');
  }));

  // Category pills
  $('#cat-pills')?.addEventListener('click', e => {
    const pill = e.target.closest('.cat-pill');
    if (!pill) return;
    $$('.cat-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    filterByCategory(pill.dataset.cat);
  });

  // Carousel
  $('#hero-prev')?.addEventListener('click', () => setSlide((STATE.carouselIdx-1+4)%4));
  $('#hero-next')?.addEventListener('click', () => setSlide((STATE.carouselIdx+1)%4));

  // Theme
  $('#theme-toggle')?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current==='dark'?'light':'dark');
  });
  $('#theme-check')?.addEventListener('change', e => applyTheme(e.target.checked?'dark':'light'));

  // Panel
  $('#panel-x')?.addEventListener('click', closePanel);
  $('#panel-scrim')?.addEventListener('click', closePanel);
  $('#p-cart-btn')?.addEventListener('click', () => {
    const book = STATE.allBooks.find(b=>b.id===STATE.activeBookId);
    if (book) borrowBook(book);
  });
  $('#p-fav-btn')?.addEventListener('click', () => {
    const book = STATE.allBooks.find(b=>b.id===STATE.activeBookId);
    if (book) { toggleFav(book, null); if(STATE.activeBookId) openPanel(book); }
  });
  $('#p-read-btn')?.addEventListener('click', () => {
    const book = STATE.allBooks.find(b=>b.id===STATE.activeBookId);
    if (book?.is_ebook) { closePanel(); openReader(book); }
  });
  $('#p-borrow-btn')?.addEventListener('click', () => {
    const book = STATE.allBooks.find(b=>b.id===STATE.activeBookId);
    if (book) borrowBook(book);
  });
  $('#acc-btn')?.addEventListener('click', () => {
    $('#acc-btn').classList.toggle('open');
    $('#acc-body').classList.toggle('open');
  });

  // Cart
  $('#cart-topbar-btn')?.addEventListener('click', openCart);
  $('#nav-cart')?.addEventListener('click', e => { e.preventDefault(); openCart(); });
  $('#cart-x')?.addEventListener('click', closeCart);
  $('#cart-scrim')?.addEventListener('click', closeCart);

  // Reader
  $('#reader-x')?.addEventListener('click', closeReader);
  $('#rd-font-up')?.addEventListener('click', () => {
    STATE.readerFontSize = Math.min(26, STATE.readerFontSize+2);
    renderReaderPage();
  });
  $('#rd-font-down')?.addEventListener('click', () => {
    STATE.readerFontSize = Math.max(14, STATE.readerFontSize-2);
    renderReaderPage();
  });
  $('#rd-theme')?.addEventListener('click', () => { STATE.readerDark = !STATE.readerDark; renderReaderPage(); });
  $('#rd-next')?.addEventListener('click', () => {
    const ch = CHAPTER_PAGES[STATE.readerChapter % CHAPTER_PAGES.length];
    if (STATE.readerPage < ch.pages.length-1) STATE.readerPage++;
    else if (STATE.readerChapter < CHAPTER_PAGES.length-1) { STATE.readerChapter++; STATE.readerPage=0; }
    renderReaderPage(); saveReaderProgress();
  });
  $('#rd-prev')?.addEventListener('click', () => {
    if (STATE.readerPage > 0) STATE.readerPage--;
    else if (STATE.readerChapter > 0) { STATE.readerChapter--; const c=CHAPTER_PAGES[STATE.readerChapter]; STATE.readerPage=c.pages.length-1; }
    renderReaderPage(); saveReaderProgress();
  });

  // Sidebar continue reading
  $('#rw-continue')?.addEventListener('click', () => {
    if (!STATE.readerBook) { toast('No book currently open.','📖'); return; }
    openReader(STATE.readerBook);
  });

  // Challenge
  $('#ch-inc')?.addEventListener('click', async () => {
    if (!STATE.user) { toast('Log in to track your reading.','🔒'); return; }
    try {
      await api.patch('/user/profile', { books_read: STATE.challengeRead+1 });
      STATE.challengeRead++;
      updateChallengeUI();
      toast('Book marked as read! 🎉','✓');
    } catch { STATE.challengeRead++; updateChallengeUI(); toast('Progress updated locally.','📚'); }
  });
  $('#ch-reset')?.addEventListener('click', () => { STATE.challengeRead=0; updateChallengeUI(); });

  // Tabs
  $$('.tab-btn').forEach(btn => btn.addEventListener('click', () => {
    $$('.tab-btn').forEach(b => b.classList.remove('active'));
    $$('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    $(`#tab-${btn.dataset.tab}`)?.classList.add('active');
  }));

  // Settings — profile save
  $('#save-profile')?.addEventListener('click', async () => {
    const name = $('#pref-name')?.value.trim();
    if (!name || !STATE.user) return;
    try {
      const { user } = await api.patch('/user/profile', { name });
      STATE.user = user;
      applyUserToUI(user);
      toast('Profile saved!','✓');
    } catch { toast('Failed to save profile.','⚠'); }
  });

  // Settings — reader font size
  $('#fsc-up')?.addEventListener('click', () => {
    STATE.readerFontSize = Math.min(26, STATE.readerFontSize+2);
    if ($('#fsc-val')) $('#fsc-val').textContent = STATE.readerFontSize;
  });
  $('#fsc-down')?.addEventListener('click', () => {
    STATE.readerFontSize = Math.max(14, STATE.readerFontSize-2);
    if ($('#fsc-val')) $('#fsc-val').textContent = STATE.readerFontSize;
  });

  // Settings — reading goal
  $('#goal-up')?.addEventListener('click', async () => {
    STATE.challengeGoal++;
    if ($('#goal-val')) $('#goal-val').textContent = STATE.challengeGoal;
    updateChallengeUI();
    if (STATE.user) api.patch('/user/profile', { reading_goal: STATE.challengeGoal }).catch(()=>{});
  });
  $('#goal-down')?.addEventListener('click', async () => {
    STATE.challengeGoal = Math.max(1, STATE.challengeGoal-1);
    if ($('#goal-val')) $('#goal-val').textContent = STATE.challengeGoal;
    updateChallengeUI();
    if (STATE.user) api.patch('/user/profile', { reading_goal: STATE.challengeGoal }).catch(()=>{});
  });

  // Settings — accent swatches
  $$('.swatch').forEach(sw => sw.addEventListener('click', () => {
    $$('.swatch').forEach(s=>s.classList.remove('active'));
    sw.classList.add('active');
    applyAccent(sw.dataset.accent);
    toast('Accent updated','🎨');
  }));

  // Settings — clear data
  $('#clear-data')?.addEventListener('click', () => {
    if (!confirm('Clear all local UI preferences? (Server data will be retained)')) return;
    localStorage.removeItem(UI_PREF_KEY);
    applyTheme('light'); applyAccent('#0015FF');
    toast('Local preferences cleared','🗑');
  });

  // Logout
  $('#logout-btn')?.addEventListener('click', async () => {
    if (!confirm('Log out of Librarium?')) return;
    try { await api.post('/auth/logout'); } catch {}
    STATE.user = null;
    toast('Logged out. See you soon! 👋','✓');
    setTimeout(() => location.reload(), 800);
  });

  // User chip → settings
  $('#user-chip')?.addEventListener('click', () => goTo('settings'));

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if ((e.metaKey||e.ctrlKey) && e.key==='k') { e.preventDefault(); $('#top-search')?.focus(); }
    if (e.key==='Escape') { closePanel(); closeCart(); closeReader(); $('#search-drop')?.classList.remove('open'); }
  });
}

/* ─────────────────────────────────────────────────────────
   BOOTSTRAP
───────────────────────────────────────────────────────── */
async function init() {
  // Apply saved UI preferences
  const prefs = loadUIPrefs();
  if (prefs.theme)  applyTheme(prefs.theme);
  if (prefs.accent) applyAccent(prefs.accent);

  // Wire all events
  wireEvents();
  initSearch();

  // Check session
  await loadCurrentUser();

  // Load dashboard data
  await loadDashboard();

  // Update challenge
  updateChallengeUI();
  updateCountBadges();

  console.log('%c📚 Librarium v2 API-connected', 'color:#0015FF;font-family:serif;font-size:14px;font-weight:bold');
  console.log(`%cBackend: ${API_BASE}`, 'color:#7880A8;font-size:12px');
}

document.addEventListener('DOMContentLoaded', init);

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Simulate Login (For now, let's auto-log in as Admin for your demo)
    const userData = { id: "U001", name: "Jainish Khatkar", email: "admin@example.com" };
    localStorage.setItem('librarium_user', JSON.stringify(userData));
    hideModal('auth-modal');
    alert("Welcome back, Jainish!");
    location.reload();
});
