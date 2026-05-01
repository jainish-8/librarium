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
  cart:          [],
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
  put:   (path, body={}) => apiFetch(path, { method:'PUT', body: JSON.stringify(body) }),
  patch: (path, body={}) => apiFetch(path, { method:'PATCH', body: JSON.stringify(body) }),
  delete:(path) => apiFetch(path, { method:'DELETE' }),
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

function goTo(pageId, skipLoad = false) {
  $$('.page').forEach(p => p.classList.remove('active'));
  $$('.nav-link').forEach(l => l.classList.remove('active'));
  const page = $(`#page-${pageId}`);
  if (page) { page.classList.add('active'); activePage = pageId; }
  const link = $(`.nav-link[data-page="${pageId}"]`);
  if (link) link.classList.add('active');

  if (pageId === 'cart') { openCart(); return; }

  // Lazy-load each page's content
  if (!skipLoad) {
    if (pageId === 'authors')    loadAuthorsPage();
    if (pageId === 'my-library') loadLibraryPage();
    if (pageId === 'orders')     loadOrdersPage();
    if (pageId === 'settings')   renderSettingsPage();
    if (pageId === 'explore')    loadExplorePage();
    if (pageId === 'admin-dashboard') loadAdminDashboard();
    if (pageId === 'admin-inventory') loadAdminInventory();
    if (pageId === 'admin-users') loadAdminUsers();
    if (pageId === 'admin-transactions') loadAdminTransactions();
  }

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

// ==== DYNAMIC CATEGORIES ====
async function loadCategories() {
  try {
    const { categories } = await api.get('/books/categories');
    
    // Sidebar submenu
    const submenu = $('#cat-submenu');
    if (submenu) {
      submenu.innerHTML = categories.map(c => `<a class="nav-sub" data-cat="${c.name}" href="#">${c.name} <span style="opacity:0.5;font-size:10px">(${c.count})</span></a>`).join('');
    }
    
    // Dashboard pills
    const pills = $('#cat-pills');
    if (pills) {
      pills.innerHTML = `<button class="cat-pill active" data-cat="all">All</button>` + 
        categories.map(c => `<button class="cat-pill" data-cat="${c.name}">${c.name}</button>`).join('');
    }
    
    // Explore pills
    const explorePills = $('#explore-cat-pills');
    if (explorePills) {
      explorePills.innerHTML = `<button class="cat-pill active" data-cat="all">All</button>` + 
        categories.map(c => `<button class="cat-pill" data-cat="${c.name}">${c.name}</button>`).join('');
    }
    
    // Wire events for new dynamic nav-sub items
    $$('.nav-sub').forEach(a => a.addEventListener('click', e => {
      e.preventDefault(); filterByCategory(a.dataset.cat); goTo('dashboard');
    }));
  } catch (err) {
    console.error('Failed to load categories', err);
  }
}

/* ─────────────────────────────────────────────────────────
   PAGES / ROUTING
───────────────────────────────────────────────────────── */
async function loadExplorePage(filter = 'trending', category = 'all') {
  try {
    const grid = $('#explore-grid');
    grid.style.opacity = 0; // fade out for smooth transition
    
    // Reset UI in case we came from an Author filter
    $('#explore-title').textContent = 'Explore Books';
    $('#explore-cat-pills').style.display = 'flex';
    $('#explore-sort').style.display = 'block';
    
    // Default sorting based on filter
    let sort = 'borrow_count';
    if (filter === 'recommended') sort = 'rating';
    else if (filter === 'new') sort = 'year';
    else if (filter === 'title') sort = 'title';
    
    const params = { sort, limit: 500 };
    if (category !== 'all') params.category = category;
    
    const { books } = await api.get('/books', params);
    
    let displayBooks = books;
    if (filter === 'ebooks') {
      displayBooks = books.filter(b => b.is_ebook);
    }
    
    // Highlight correct explore pill
    $$('#explore-cat-pills .cat-pill').forEach(p => {
      if (p.dataset.cat === category) p.classList.add('active');
      else p.classList.remove('active');
    });
    
    setTimeout(() => {
      grid.innerHTML = '';
      displayBooks.forEach((b, i) => {
        const card = buildBookCard(b, i * 30);
        grid.appendChild(card);
      });
      grid.style.opacity = 1; // fade in
    }, 200); // small delay to let DOM clear and fade out
    
    // Hook up sorting dropdown
    const sortSelect = $('#explore-sort');
    sortSelect.value = sort;
    sortSelect.onchange = async () => {
      const newFilter = sortSelect.value === 'rating' ? 'recommended' : sortSelect.value === 'year' ? 'new' : sortSelect.value === 'title' ? 'title' : 'trending';
      const activeExplorePill = $('#explore-cat-pills .cat-pill.active');
      const activeExploreCat = activeExplorePill ? activeExplorePill.dataset.cat : 'all';
      loadExplorePage(newFilter, activeExploreCat);
    };
  } catch (err) {
    console.error(err);
    toast('Failed to load explore page.', '⚠');
  }
}

async function loadDashboard() {
  try {
    showSkeletons('trending-row', 6);
    showSkeletons('rec-row', 6);
    showSkeletons('ebook-row', 5);

    // Fetch all books from API
    const { books } = await api.get('/books', { limit: 200 });
    STATE.allBooks = books;

    // Trending: highest borrow count
    const trending = [...books].sort((a,b)=>b.borrow_count-a.borrow_count);
    // Recommended: highest rated
    const recommended = [...books].sort((a,b)=>b.rating-a.rating);
    // Ebooks only
    const ebooks = books.filter(b=>b.is_ebook);

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
        <span class="bc-price" style="${available?'':'color:#EF4444'}; display:flex; align-items:center; gap:6px;">
          ${available ? `<span style="font-size:10px; font-weight:normal; color:var(--text-4);">${book.available_copies} left</span> $${(book.price||0).toFixed(2)}` : 'Unavailable'}
        </span>
      </div>
    </div>`;

  card.querySelector('.bco-view')?.addEventListener('click', e => { e.stopPropagation(); openPanel(book); });
  card.querySelector('.bco-cart')?.addEventListener('click', e => { e.stopPropagation(); addToCart(book, 'BORROW'); });
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
            ? `<button class="btn-outline" style="background:rgba(255,255,255,.1);color:#fff;border-color:rgba(255,255,255,.2)" data-borrow="${book.id}">Add to Cart</button>`
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
    slide.querySelector('[data-borrow]')?.addEventListener('click', () => addToCart(book, 'BORROW'));
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
  const borrowBtn = $('#p-borrow-btn');
  
  if (copies > 0) {
    cartBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg> Buy for $${(book.price||0).toFixed(2)}`;
    cartBtn.disabled = false;
    cartBtn.style.opacity = '1';

    borrowBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" /></svg> Borrow Free`;
    borrowBtn.style.display = 'flex';
  } else {
    cartBtn.textContent = 'Unavailable';
    cartBtn.disabled = true;
    cartBtn.style.opacity = '0.45';

    borrowBtn.style.display = 'none';
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
  ].map(([k,v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('');

  // Chips
  const chips = $('#panel-chips');
  if (chips) {
    chips.innerHTML = `
      <div class="p-chip" style="background:var(--accent-light);color:var(--accent);border-color:var(--accent);font-weight:700">${copies} Available</div>
      <div class="p-chip">${book.pages || '?'} Pages</div>
      <div class="p-chip">${book.year || '2023'}</div>
      <div class="p-chip">${book.language || 'English'}</div>
    `;
  }

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

function loadOrdersPage() {
  if (!STATE.user) {
    $('#orders-borrows-grid').innerHTML = '';
    $('#orders-purchases-grid').innerHTML = '';
    toast('Log in to see your orders.', '🔒');
    return;
  }

  api.get('/user/dashboard').then(dash => {
    STATE.dashboard = dash;

    const bGrid = $('#orders-borrows-grid');
    const bEmpty = $('#orders-borrows-empty');
    if (!dash.active_borrows.length) {
      if(bEmpty) bEmpty.style.display = 'flex';
      if(bGrid) bGrid.innerHTML = '';
    } else {
      if(bEmpty) bEmpty.style.display = 'none';
      if(bGrid) {
        bGrid.innerHTML = dash.active_borrows.map(txn => {
          const book = txn.book || STATE.allBooks.find(b=>b.id===txn.book_id) || {};
          return buildOrderCard(txn, book, 'borrow');
        }).join('');
      }
    }

    const pGrid = $('#orders-purchases-grid');
    const pEmpty = $('#orders-purchases-empty');
    if (!dash.purchases || !dash.purchases.length) {
      if(pEmpty) pEmpty.style.display = 'flex';
      if(pGrid) pGrid.innerHTML = '';
    } else {
      if(pEmpty) pEmpty.style.display = 'none';
      if(pGrid) {
        pGrid.innerHTML = dash.purchases.map(txn => {
          const book = txn.book || STATE.allBooks.find(b=>b.id===txn.book_id) || {};
          return buildOrderCard(txn, book, 'buy');
        }).join('');
      }
    }
  }).catch(err => {
    toast('Failed to load orders.', '⚠');
  });
}

function buildOrderCard(txn, book, type) {
  const p = pal(book.cover_palette??0);
  const daysLeft = txn.days_remaining ?? '?';
  const priceLabel = type === 'buy' ? 'Purchased' : (txn.status === 'overdue' ? `Fine: $${(txn.fine_amount||0).toFixed(2)}` : `${daysLeft} day(s) left`);
  
  return `
    <div class="book-card" onclick="openPanel(STATE.allBooks.find(b=>b.id==='${book.id}'))" style="cursor:pointer">
      <div class="bc-cover">
        <div class="bc-art">${buildCoverEl(book)}</div>
        <span class="bc-type ${type}">${type === 'buy' ? 'Owned' : 'Borrowed'}</span>
      </div>
      <div class="bc-info">
        <div class="bc-title">${book.title||txn.book_title}</div>
        <div class="bc-author">${book.author_name||''}</div>
        <div class="bc-bottom">
          <span style="font-size:12px;font-weight:600;color:${txn.status==='overdue' ? '#EF4444' : 'var(--text-1)'}">${priceLabel}</span>
          ${type === 'borrow' ? `<button class="btn-outline" style="font-size:11px;padding:4px 8px" onclick="event.stopPropagation(); returnBook('${txn.book_id}')">Return</button>` : ''}
        </div>
      </div>
    </div>`;
}

/* ─────────────────────────────────────────────────────────
   CART ACTIONS
───────────────────────────────────────────────────────── */
function addToCart(book, action) {
  if (!STATE.user) { toast('Please log in to add items to cart.', '🔒'); showModal('auth-modal'); return; }
  // Check if already in cart
  const exists = STATE.cart.find(c => c.id === book.id && c.action === action);
  if (exists) {
    toast(`Already in cart for ${action}`, 'ℹ');
    return;
  }
  STATE.cart.push({ ...book, action });
  toast(`Added "${book.title}" to cart (${action})`, '🛒');
  updateCountBadges();
}

function removeFromCart(idx) {
  STATE.cart.splice(idx, 1);
  updateCountBadges();
  openCart();
}

async function checkoutCart() {
  if (!STATE.cart.length) return;
  const btn = $('#checkout-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Processing...'; }

  try {
    for (const item of STATE.cart) {
      await api.post('/transaction', { book_id: item.id, action: item.action });
      // Decrement globally in UI
      const cached = STATE.allBooks.find(b => b.id === item.id);
      if (cached) {
        cached.available_copies = Math.max(0, (cached.available_copies||0) - 1);
        if (item.action === 'BORROW') cached.borrow_count = (cached.borrow_count||0)+1;
      }
    }
    toast(`Successfully processed ${STATE.cart.length} item(s)!`, '🎉', 4000);
    STATE.cart = [];
    closeCart();
    updateCountBadges();
    
    if (activePage === 'dashboard') await loadDashboard();
    else if (activePage === 'orders') loadOrdersPage();
    else if (activePage === 'my-library') await loadLibraryPage();
    
  } catch (err) {
    toast(err.data?.error || 'Checkout failed.', '⚠');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `Checkout <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>`;
    }
  }
}

/* ─────────────────────────────────────────────────────────
   BORROW BOOK — legacy helper mostly used in cart now
───────────────────────────────────────────────────────── */
async function borrowBook(book) {
  if (!STATE.user) {
    showModal('auth-modal');
    toast('Please log in to borrow books.', '🔒');
    return;
  }
  try {
    const res = await api.post(`/borrow/${book.id}`);
    toast(res.message || `Borrowed "${book.title}"`, '✓', 4000);
    book.available_copies = Math.max(0, (book.available_copies||0)-1);
    if (activePage === 'dashboard') loadDashboard();
    else if (activePage === 'my-library') loadLibraryPage();
    else if (activePage === 'orders') loadOrdersPage();
    if (STATE.activeBookId === book.id) openPanel(book);
  } catch (err) {
    toast(err.data?.error || 'Could not borrow book.', '⚠');
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
    else if (activePage === 'orders') loadOrdersPage();
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
  goTo('explore', true);
  $('#explore-title').innerHTML = `Books by <span style="color:var(--primary)">${author.name}</span>`;
  $('#explore-cat-pills').style.display = 'none'; // Hide category pills for author view
  $('#explore-sort').style.display = 'none'; // Disable sorting for now

  try {
    const grid = $('#explore-grid');
    grid.style.opacity = 0;
    
    const res = await api.get(`/authors/${author.id}`);
    const books = res.books || [];
    
    setTimeout(() => {
      grid.innerHTML = '';
      if (!books.length) {
        grid.innerHTML = '<p style="color:var(--text-3); grid-column: 1/-1;">No books available by this author.</p>';
      } else {
        books.forEach((b, i) => {
          const card = buildBookCard(b, i * 30);
          grid.appendChild(card);
        });
      }
      grid.style.opacity = 1;
    }, 200);
    
    toast(`Showing books by ${author.name}`, '📚');
  } catch { 
    toast('Failed to load author books', '⚠');
  }
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
    
    if (document.body.classList.contains('admin-mode-active')) {
      if (q.toLowerCase().includes('add') || q.toLowerCase().includes('new')) {
        drop.innerHTML = `
          <div class="sd-label">Admin Commands</div>
          <div class="sd-item" onclick="showAdminBookModal(); document.getElementById('search-drop').classList.remove('open');">
            <div style="background:var(--accent); color:#fff; width:36px; height:36px; display:flex; align-items:center; justify-content:center; border-radius:8px; font-weight:bold; font-size:18px; margin-right:12px;">+</div>
            <div class="sd-info">
              <span class="sd-name">Add New Book</span>
              <span class="sd-sub">Inventory Management</span>
            </div>
          </div>
        `;
        drop.classList.add('open');
        return;
      }
    }
    try {
      const { books, authors } = await api.get('/search', { q });

      const emptyStateHtml = `
        <div style="padding: 32px 16px; text-align: center;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" stroke-width="1.5" style="margin-bottom: 12px; opacity:0.5;">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="9" y1="9" x2="13" y2="13"></line>
            <line x1="13" y1="9" x2="9" y2="13"></line>
          </svg>
          <div style="font-size:14px; font-weight:600; color:var(--text); margin-bottom:4px;">No results found</div>
          <div style="font-size:12px; color:var(--text-3); margin-bottom:16px;">We couldn't find anything matching "${q}".</div>
          <button class="btn-ghost" onclick="document.getElementById('top-search').value=''; document.getElementById('search-drop').classList.remove('open');" style="font-size:12px; padding:6px 12px; border:1px solid var(--border);">Clear Search</button>
        </div>
      `;

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
          : emptyStateHtml
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
    const params = cat==='all' ? { sort:'borrow_count', limit:200 } : { category: cat, sort:'borrow_count', limit:200 };
    const { books } = await api.get('/books', params);
    const byRating = cat==='all' ? [...books].sort((a,b)=>b.rating-a.rating) : [...books];
    renderRow('trending-row', books);
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
    applyUserToUI(null);
  }
}

function applyUserToUI(user) {
  const userChip = document.getElementById('user-chip');
  const authBtnTop = document.getElementById('auth-btn-top');
  const logoutBtn = document.getElementById('logout-btn');

  if (!user) {
    if (userChip) userChip.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (authBtnTop) authBtnTop.style.display = 'block';
    document.body.classList.remove('admin-mode-active');
    return;
  }
  
  if (userChip) userChip.style.display = 'flex';
  if (logoutBtn) logoutBtn.style.display = 'flex';
  if (authBtnTop) authBtnTop.style.display = 'none';

  document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name||'');
  document.querySelectorAll('#user-ava, #settings-ava').forEach(el => el.textContent = (user.name||'?').charAt(0).toUpperCase());
  if (document.getElementById('user-name-display')) document.getElementById('user-name-display').textContent = user.name||'';
  if (user.reading_goal) STATE.challengeGoal = user.reading_goal;
  if (user.books_read)   STATE.challengeRead = user.books_read;

  if (user.role === 'admin') {
    document.body.classList.add('admin-mode-active');
    if (activePage !== 'admin-dashboard' && !activePage.startsWith('admin-')) {
       goTo('admin-dashboard');
    }
  } else {
    document.body.classList.remove('admin-mode-active');
  }

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
   CART — Uses STATE.cart
───────────────────────────────────────────────────────── */
async function openCart() {
  if (!STATE.user) { toast('Log in to view your cart.','🔒'); return; }
  
  const list  = $('#cart-list');
  const empty = $('#cart-empty');
  const ft    = $('#cart-ft');

  if (!STATE.cart.length) {
    empty.style.display='flex'; list.innerHTML=''; ft.style.display='none';
  } else {
    empty.style.display='none'; ft.style.display='block';
    
    let subtotal = 0;
    list.innerHTML = STATE.cart.map((item, idx) => {
      const p = pal(item.cover_palette??0);
      const price = item.action === 'BUY' ? (item.price || 0) : 0;
      subtotal += price;
      
      return `<div class="cart-item" style="display:flex; gap:12px; margin-bottom:16px; align-items:center;">
        <div class="ci-cover" style="width:40px;height:60px;background:${p.bg};border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:8px;color:#fff;text-align:center;">${shortT(item.title,14)}</div>
        <div class="ci-info" style="flex:1;">
          <div class="ci-title" style="font-weight:600;font-size:14px;color:var(--text-1);">${item.title}</div>
          <div class="ci-author" style="font-size:12px;color:var(--text-3);margin-bottom:4px;">${item.author_name||''}</div>
          <div class="ci-bottom" style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:12px;font-weight:600;color:var(--text-1)">
              ${item.action === 'BUY' ? `Buy: $${price.toFixed(2)}` : 'Borrow: Free'}
            </span>
            <button class="btn-outline" style="font-size:11px;padding:4px 8px" onclick="removeFromCart(${idx})">Remove</button>
          </div>
        </div>
      </div>`;
    }).join('');

    $('#cart-sub')   && ($('#cart-sub').textContent   = `$${subtotal.toFixed(2)}`);
    $('#cart-total') && ($('#cart-total').textContent = `$${subtotal.toFixed(2)}`);
    $('#cart-count-label') && ($('#cart-count-label').textContent = `(${STATE.cart.length})`);
  }

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
    $$('#lib-count').forEach(el => el.textContent = activeCount||'');
  }
  const cartCount = STATE.cart.length;
  $$('#sb-cart-count, #cart-dot').forEach(el => el.textContent = cartCount||'');
}

/* ─────────────────────────────────────────────────────────
   EVENT WIRING
───────────────────────────────────────────────────────── */
function wireEvents() {
  // Nav links
  $$('.nav-link[data-page]').forEach(link =>
    link.addEventListener('click', e => { e.preventDefault(); goTo(link.dataset.page); })
  );

  // See All links
  $$('.see-all').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const filter = btn.dataset.filter || 'trending';
      const activePill = $('#cat-pills .cat-pill.active');
      const cat = activePill ? activePill.dataset.cat : 'all';
      goTo('explore', true);
      loadExplorePage(filter, cat);
    });
  });

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

  // Dashboard Category pills
  $('#cat-pills')?.addEventListener('click', e => {
    const pill = e.target.closest('.cat-pill');
    if (!pill) return;
    $$('#cat-pills .cat-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    filterByCategory(pill.dataset.cat);
  });

  // Explore Category pills
  $('#explore-cat-pills')?.addEventListener('click', e => {
    const pill = e.target.closest('.cat-pill');
    if (!pill) return;
    const sortSelect = $('#explore-sort');
    const newFilter = sortSelect.value === 'rating' ? 'recommended' : sortSelect.value === 'year' ? 'new' : sortSelect.value === 'title' ? 'title' : 'trending';
    loadExplorePage(newFilter, pill.dataset.cat);
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
    if (book) addToCart(book, 'BUY');
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
    if (book) addToCart(book, 'BORROW');
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
  $('#checkout-btn')?.addEventListener('click', checkoutCart);

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
  await loadCategories();
  
  if (location.hash === '#authors') goTo('authors');
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
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const data = await api.post('/auth/login', { email, password });
        hideModal('auth-modal');
        toast("Welcome back, " + data.user.name + "!", "✓");
        // Reload user state and UI without full page reload
        await loadCurrentUser();
        await loadDashboard();
        if (activePage === 'my-library') loadLibraryPage();
    } catch (err) {
        toast(err.data?.error || 'Login failed', '⚠');
    }
});

document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    try {
        const data = await api.post('/auth/signup', { name, email, password });
        hideModal('auth-modal');
        toast("Account created! Welcome, " + data.user.name, "🎉");
        await loadCurrentUser();
        await loadDashboard();
    } catch (err) {
        toast(err.data?.error || 'Signup failed', '⚠');
    }
});

/* ─────────────────────────────────────────────────────────
   ADMIN PAGES & LOGIC
───────────────────────────────────────────────────────── */
async function loadAdminDashboard() {
  try {
    const data = await api.get('/admin/dashboard');
    const m = data.metrics;
    $('#admin-metric-users').textContent = m.total_users;
    $('#admin-metric-books').textContent = m.total_books;
    $('#admin-metric-purchases').textContent = m.total_purchases;
    $('#admin-metric-revenue').textContent = '$' + (m.total_revenue||0).toFixed(2);
  } catch(e) { console.error(e); }
}

async function loadAdminInventory() {
  try {
    const tbody = $('#admin-inventory-table tbody');
    if (tbody) tbody.innerHTML = `<tr class="shimmer-row"><td><div style="height:14px; width:70%; background:var(--surface-3); border-radius:4px;"></div></td><td><div style="height:14px; width:50%; background:var(--surface-3); border-radius:4px;"></div></td><td><div style="height:14px; width:40%; background:var(--surface-3); border-radius:4px;"></div></td><td><div style="height:14px; width:60%; background:var(--surface-3); border-radius:4px;"></div></td><td><div style="height:14px; width:30%; background:var(--surface-3); border-radius:4px;"></div></td></tr>`.repeat(5);
    const { books } = await api.get('/books', { limit: 1000 });
    if (tbody) {
      tbody.innerHTML = books.map(b => `
        <tr>
          <td><strong>${b.title}</strong></td>
          <td>${b.author_name || b.author || 'Unknown'}</td>
          <td>$${(b.price||0).toFixed(2)}</td>
          <td>${b.available_copies} / ${b.total_copies}</td>
          <td style="text-align:right; white-space:nowrap;">
            <button class="btn-icon" title="Edit Book" onclick="editAdminBook('${b.id}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            </button>
            <button class="btn-icon danger" title="Delete Book" onclick="deleteAdminBook('${b.id}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </td>
          <button class="btn-icon quick-edit-btn" title="Quick Edit" onclick="editAdminBook('${b.id}')">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="14 2 18 6 7 17 3 17 3 13 14 2"></polygon><line x1="3" y1="22" x2="21" y2="22"></line></svg>
          </button>
        </tr>
      `).join('');
    }
  } catch(e) { console.error(e); }
}

async function loadAdminUsers() {
  try {
    const tbody = $('#admin-users-table tbody');
    if (tbody) tbody.innerHTML = `<tr class="shimmer-row"><td><div style="height:14px; width:70%; background:var(--surface-3); border-radius:4px;"></div></td><td><div style="height:14px; width:50%; background:var(--surface-3); border-radius:4px;"></div></td><td><div style="height:14px; width:40%; background:var(--surface-3); border-radius:4px;"></div></td><td><div style="height:14px; width:60%; background:var(--surface-3); border-radius:4px;"></div></td><td><div style="height:14px; width:30%; background:var(--surface-3); border-radius:4px;"></div></td></tr>`.repeat(5);
    const data = await api.get('/admin/users');
    if (tbody) {
      tbody.innerHTML = data.users.map(u => `
        <tr>
          <td><strong>${u.name}</strong></td>
          <td>${u.email}</td>
          <td><span class="p-chip ${u.role === 'admin' ? 'p-chip-overdue' : 'p-chip-borrowed'}" style="${u.role === 'admin' ? 'background:rgba(168,85,247,0.15); color:#a855f7; border-color:rgba(168,85,247,0.3)' : ''}; font-size:10px">${u.role}</span></td>
          <td>${new Date(u.joined_date).toLocaleDateString()}</td>
          <td style="text-align:right">
            <button class="btn-icon" title="View Profile" onclick="viewAdminUser('${u.id}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch(e) { console.error(e); }
}

window.viewAdminUser = async function(id) {
  try {
    const data = await api.get('/admin/users/' + id);
    const u = data.user;
    const txns = data.transactions;
    
    $('#au-name').textContent = u.name;
    $('#au-email').textContent = u.email;
    $('#au-role').textContent = (u.role||'').toUpperCase();
    $('#au-avatar').textContent = (u.name || '?').charAt(0).toUpperCase();
    $('#au-joined').textContent = 'Joined ' + new Date(u.joined_date).toLocaleDateString();
    
    const tbody = $('#au-txn-table tbody');
    tbody.innerHTML = txns.map(t => {
      const typeStr = (t.action || (t.status==='bought'?'BUY':'BORROW')).toUpperCase();
      const statusClass = t.status === 'bought' ? 'p-chip-bought' : 
                          t.status === 'borrowed' ? 'p-chip-borrowed' : 
                          t.status === 'returned' ? 'p-chip-returned' : 'p-chip-overdue';
                          
      return `
        <tr>
          <td>${new Date(t.borrow_date || t.purchase_date || t.transaction_date || Date.now()).toLocaleDateString()}</td>
          <td><strong>${shortT(t.book_title, 30)}</strong></td>
          <td><span style="font-size:11px;font-weight:700;color:var(--text-4)">${typeStr}</span></td>
          <td><span class="p-chip ${statusClass}" style="font-size:10px">${t.status.toUpperCase()}</span></td>
        </tr>
      `;
    }).join('');
    
    showModal('admin-user-modal');
  } catch(e) { toast('Error loading user profile', '⚠'); }
};

async function loadAdminTransactions() {
  try {
    const tbody = $('#admin-txn-table tbody');
    if (tbody) tbody.innerHTML = `<tr class="shimmer-row"><td><div style="height:14px; width:70%; background:var(--surface-3); border-radius:4px;"></div></td><td><div style="height:14px; width:50%; background:var(--surface-3); border-radius:4px;"></div></td><td><div style="height:14px; width:40%; background:var(--surface-3); border-radius:4px;"></div></td><td><div style="height:14px; width:60%; background:var(--surface-3); border-radius:4px;"></div></td><td><div style="height:14px; width:30%; background:var(--surface-3); border-radius:4px;"></div></td></tr>`.repeat(5);
    const data = await api.get('/admin/transactions');
    if (tbody) {
      tbody.innerHTML = data.transactions.map(t => {
        const typeStr = (t.action || (t.status==='bought'?'BUY':'BORROW')).toUpperCase();
        const statusClass = t.status === 'bought' ? 'p-chip-bought' : 
                            t.status === 'borrowed' ? 'p-chip-borrowed' : 
                            t.status === 'returned' ? 'p-chip-returned' : 'p-chip-overdue';
        return `
        <tr>
          <td>${new Date(t.borrow_date || t.purchase_date || t.transaction_date || Date.now()).toLocaleString()}</td>
          <td><span style="font-size:11px;color:var(--text-4)">${t.user_id}</span></td>
          <td><strong>${t.book_title}</strong></td>
          <td><span style="font-size:11px;font-weight:700;color:var(--text-4)">${typeStr}</span></td>
          <td><span class="p-chip ${statusClass}" style="font-size:10px">${t.status.toUpperCase()}</span></td>
        </tr>
        `;
      }).join('');
    }
  } catch(e) { console.error(e); }
}

window.showAdminBookModal = function(bookId=null) {
  const form = $('#admin-book-form');
  if (form) form.reset();
  if ($('#ab-id')) $('#ab-id').value = '';
  if ($('#ab-modal-title')) $('#ab-modal-title').textContent = 'Add New Book';
  
  if (bookId) {
    const book = STATE.allBooks.find(b => b.id === bookId);
    if (book) {
      $('#ab-id').value = book.id;
      $('#ab-title').value = book.title;
      $('#ab-author').value = book.author_name || book.author || '';
      $('#ab-price').value = book.price || 0;
      $('#ab-total-copies').value = book.total_copies || 1;
      $('#ab-avail-copies').value = book.available_copies || 1;
      $('#ab-modal-title').textContent = 'Edit Book';
    }
  }
  showModal('admin-book-modal');
};

window.editAdminBook = function(id) {
  window.showAdminBookModal(id);
};

window.deleteAdminBook = async function(id) {
  if (!confirm('Are you sure you want to delete this book?')) return;
  try {
    await api.delete('/admin/books/' + id);
    toast('Book deleted', '✓');
    loadAdminInventory();
  } catch(e) { toast('Error deleting book', '⚠'); }
};

$('#admin-book-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = $('#ab-id').value;
  const payload = {
    title: $('#ab-title').value,
    author_name: $('#ab-author').value,
    price: parseFloat($('#ab-price').value),
    total_copies: parseInt($('#ab-total-copies').value, 10),
    available_copies: parseInt($('#ab-avail-copies').value, 10)
  };
  
  try {
    if (id) {
      await api.put('/admin/books/' + id, payload);
      toast('Book updated', '✓');
    } else {
      await api.post('/admin/books', payload);
      toast('Book created', '✓');
    }
    hideModal('admin-book-modal');
    loadAdminInventory();
    
    // Also reload global state so editing books reflects without refresh
    const { books } = await api.get('/books', { limit: 500 });
    STATE.allBooks = books;
  } catch(err) {
    toast('Failed to save book', '⚠');
  }
});

window.toggleAdminMode = function() {
  const content = document.querySelector('.auth-modal-content');
  if (!content) return;
  
  const isCurrentlyAdmin = content.classList.contains('admin-mode');
  if (!isCurrentlyAdmin) {
    content.classList.add('admin-mode');
    content.style.background = '#1a1a1a';
    content.style.color = '#fff';
    if ($('#modal-title')) {
      $('#modal-title').textContent = 'Admin Portal Access';
      $('#modal-title').style.color = '#fff';
    }
    if ($('#admin-login-toggle')) $('#admin-login-toggle').textContent = 'Back to Member Login';
  } else {
    content.classList.remove('admin-mode');
    content.style.background = '';
    content.style.color = '';
    if ($('#modal-title')) {
      $('#modal-title').textContent = 'Welcome to Librarium';
      $('#modal-title').style.color = '';
    }
    if ($('#admin-login-toggle')) $('#admin-login-toggle').textContent = 'Admin Access';
  }
};
