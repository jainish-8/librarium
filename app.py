"""
app.py — Librarium Flask Backend
Atomic JSON storage · JWT-style sessions · Fine engine · Borrow logic
"""

import json
import os
import uuid
import hashlib
import secrets
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, jsonify, request, session, render_template
from flask_cors import CORS

# ─────────────────────────────────────────────────────────
# APP SETUP
# ─────────────────────────────────────────────────────────
app = Flask(__name__, static_folder="static", template_folder="templates")
app.secret_key = os.environ.get("SECRET_KEY", secrets.token_hex(32))
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=7)

CORS(app, supports_credentials=True, origins=[
    "http://localhost:3000",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "null",  # file:// origin for direct HTML open
])

DATA_DIR     = "data"
BOOKS_PATH   = os.path.join(DATA_DIR, "books.json")
AUTHORS_PATH = os.path.join(DATA_DIR, "authors.json")
USERS_PATH   = os.path.join(DATA_DIR, "users.json")
TRANS_PATH   = os.path.join(DATA_DIR, "transactions.json")

FINE_PER_DAY = 0.50   # $0.50 per overdue day
BORROW_DAYS  = 7      # 7-day borrow period

# ─────────────────────────────────────────────────────────
# JSON STORAGE (Atomic read/write to prevent data loss)
# ─────────────────────────────────────────────────────────
def _read(path: str) -> list | dict:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def _write(path: str, data) -> None:
    """Atomic write: write to .tmp then os.replace (atomic on POSIX)."""
    os.makedirs(DATA_DIR, exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=str)
    os.replace(tmp, path)


# ─────────────────────────────────────────────────────────
# UTILITIES
# ─────────────────────────────────────────────────────────
def hash_password(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()


def now_iso() -> str:
    return datetime.utcnow().isoformat()


def calc_fine(due_date_str: str) -> float:
    """Compare current_date with due_date and calculate a $0.50/day fine automatically."""
    if not due_date_str:
        return 0.0
    due = datetime.fromisoformat(due_date_str)
    current_date = datetime.utcnow()
    delta = current_date - due
    if delta.total_seconds() <= 0:
        return 0.0
    overdue_days = delta.days + (1 if delta.seconds > 0 else 0)
    return round(overdue_days * FINE_PER_DAY, 2)


def enrich_book(book: dict, authors: list) -> dict:
    """Merge author metadata into a book record."""
    author = next((a for a in authors if a["id"] == book.get("author_id")), {})
    return {
        **book,
        "author_name":        author.get("name", "Unknown"),
        "author_nationality": author.get("nationality", ""),
        "author_avatar":      author.get("avatar_url", ""),
        "author_bio_short":   author.get("bio", "")[:180] + "…" if author.get("bio") else "",
    }


# ─────────────────────────────────────────────────────────
# AUTH DECORATOR
# ─────────────────────────────────────────────────────────
def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user or user.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return f(*args, **kwargs)
    return decorated


def get_current_user() -> dict | None:
    uid = session.get("user_id")
    if not uid:
        return None
    users = _read(USERS_PATH)
    return next((u for u in users if u["id"] == uid), None)


# ─────────────────────────────────────────────────────────
# ── AUTH ROUTES ──────────────────────────────────────────
# ─────────────────────────────────────────────────────────
@app.route("/api/signup", methods=["POST"])
@app.route("/api/auth/signup", methods=["POST"])
def signup():
    data = request.get_json(silent=True) or {}
    name     = (data.get("name") or "").strip()
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required."}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400

    users = _read(USERS_PATH)
    if any(u["email"] == email for u in users):
        return jsonify({"error": "An account with this email already exists."}), 409

    new_user = {
        "id":             f"user_{uuid.uuid4().hex[:8]}",
        "name":           name,
        "email":          email,
        "password_hash":  hash_password(password),
        "role":           "member",
        "avatar_seed":    email.replace("@", "_").replace(".", "_"),
        "joined_date":    now_iso(),
        "reading_goal":   24,
        "books_read":     0,
        "total_fines":    0.0,
        "active_borrows": [],
    }
    users.append(new_user)
    _write(USERS_PATH, users)

    session.permanent = True
    session["user_id"] = new_user["id"]

    safe = {k: v for k, v in new_user.items() if k != "password_hash"}
    return jsonify({"message": "Account created successfully.", "user": safe}), 201


@app.route("/api/login", methods=["POST"])
@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    users = _read(USERS_PATH)
    user  = next((u for u in users if u["email"] == email), None)

    if not user or user["password_hash"] != hash_password(password):
        return jsonify({"error": "Invalid email or password."}), 401

    session.permanent = True
    session["user_id"] = user["id"]

    safe = {k: v for k, v in user.items() if k != "password_hash"}
    return jsonify({"message": "Login successful.", "user": safe}), 200


@app.route("/api/auth/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out."}), 200


@app.route("/api/auth/me", methods=["GET"])
@login_required
def me():
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found."}), 404
    safe = {k: v for k, v in user.items() if k != "password_hash"}
    return jsonify({"user": safe}), 200


# ─────────────────────────────────────────────────────────
# ── BOOKS ROUTES ─────────────────────────────────────────
# ─────────────────────────────────────────────────────────
@app.route("/api/books", methods=["GET"])
def get_books():
    """
    GET /api/books
    Query params:
      category  – filter by category
      q         – full-text search (title, author, description, tags)
      sort      – 'rating' | 'borrow_count' | 'year' | 'title'
      available – 'true' → only books with available_copies > 0
      limit     – max results (default 100)
      offset    – pagination offset (default 0)
    """
    books   = _read(BOOKS_PATH)
    authors = _read(AUTHORS_PATH)

    # Enrich with author data
    enriched = [enrich_book(b, authors) for b in books]

    # ── Filters
    category  = request.args.get("category", "").strip()
    query     = request.args.get("q", "").strip().lower()
    sort_by   = request.args.get("sort", "borrow_count")
    only_avail= request.args.get("available", "").lower() == "true"
    limit     = min(int(request.args.get("limit", 100)), 200)
    offset    = int(request.args.get("offset", 0))

    if category and category.lower() != "all":
        enriched = [b for b in enriched if b.get("category", "").lower() == category.lower()]

    if query:
        def matches(b):
            haystack = " ".join([
                b.get("title", ""),
                b.get("author_name", ""),
                b.get("description", ""),
                b.get("category", ""),
                " ".join(b.get("tags", [])),
            ]).lower()
            return query in haystack
        enriched = [b for b in enriched if matches(b)]

    if only_avail:
        enriched = [b for b in enriched if b.get("available_copies", 0) > 0]

    # ── Sort
    sort_map = {
        "rating":       lambda b: -b.get("rating", 0),
        "borrow_count": lambda b: -b.get("borrow_count", 0),
        "year":         lambda b: -b.get("year", 0),
        "title":        lambda b: b.get("title", "").lower(),
    }
    enriched.sort(key=sort_map.get(sort_by, sort_map["borrow_count"]))

    total   = len(enriched)
    page    = enriched[offset: offset + limit]

    return jsonify({
        "total":  total,
        "offset": offset,
        "limit":  limit,
        "books":  page,
    }), 200


@app.route("/api/books/<book_id>", methods=["GET"])
def get_book(book_id):
    books   = _read(BOOKS_PATH)
    authors = _read(AUTHORS_PATH)
    book    = next((b for b in books if b["id"] == book_id), None)
    if not book:
        return jsonify({"error": "Book not found."}), 404
    return jsonify({"book": enrich_book(book, authors)}), 200


@app.route("/api/books/categories", methods=["GET"])
def get_categories():
    books = _read(BOOKS_PATH)
    cats  = sorted(set(b.get("category", "") for b in books if b.get("category")))
    counts = {}
    for b in books:
        c = b.get("category", "Other")
        counts[c] = counts.get(c, 0) + 1
    return jsonify({"categories": [{"name": c, "count": counts[c]} for c in cats]}), 200


# ─────────────────────────────────────────────────────────
# ── AUTHORS ROUTES ───────────────────────────────────────
# ─────────────────────────────────────────────────────────
@app.route("/api/authors", methods=["GET"])
def get_authors():
    authors = _read(AUTHORS_PATH)
    q = request.args.get("q", "").strip().lower()
    if q:
        authors = [a for a in authors if q in a.get("name", "").lower() or q in a.get("genre", "").lower()]
    return jsonify({"authors": authors, "total": len(authors)}), 200


@app.route("/api/authors/<author_id>", methods=["GET"])
def get_author(author_id):
    authors = _read(AUTHORS_PATH)
    author  = next((a for a in authors if a["id"] == author_id), None)
    if not author:
        return jsonify({"error": "Author not found."}), 404

    books = _read(BOOKS_PATH)
    author_books = [enrich_book(b, authors) for b in books if b.get("author_id") == author_id]

    return jsonify({"author": author, "books": author_books}), 200


# ─────────────────────────────────────────────────────────
# ── TRANSACTION / BORROW / RETURN ROUTES ─────────────────
# ─────────────────────────────────────────────────────────
@app.route("/api/transaction", methods=["POST"])
@login_required
def transaction():
    """Dual-Transaction engine: handles both 'BORROW' (7-day limit) and 'BUY' (permanent)."""
    user_id = session["user_id"]
    data = request.get_json(silent=True) or {}
    book_id = data.get("book_id")
    action = data.get("action", "").upper()

    if not book_id or action not in ("BORROW", "BUY"):
        return jsonify({"error": "Invalid book_id or action. Use 'BORROW' or 'BUY'."}), 400

    books = _read(BOOKS_PATH)
    book  = next((b for b in books if b["id"] == book_id), None)
    if not book:
        return jsonify({"error": "Book not found."}), 404

    # Check availability
    if book.get("available_copies", 0) <= 0:
        return jsonify({"error": "No copies currently available."}), 409

    users = _read(USERS_PATH)
    user  = next((u for u in users if u["id"] == user_id), None)
    if not user:
        return jsonify({"error": "User not found."}), 404

    transactions = _read(TRANS_PATH)

    # Check already borrowed or bought
    already = next((t for t in transactions
                    if t["user_id"] == user_id
                    and t["book_id"] == book_id
                    and t["status"] in ("borrowed", "overdue", "bought")), None)
    if already:
        if already["status"] == "bought":
            return jsonify({"error": "You already own this book."}), 409
        elif action == "BORROW":
            return jsonify({"error": "You have already borrowed this book."}), 409

    txn_id = f"txn_{uuid.uuid4().hex[:10]}"
    
    if action == "BORROW":
        due_date = (datetime.utcnow() + timedelta(days=BORROW_DAYS)).isoformat()
        status = "borrowed"
    else: # BUY
        due_date = None
        status = "bought"

    new_txn = {
        "id":           txn_id,
        "user_id":      user_id,
        "book_id":      book_id,
        "book_title":   book["title"],
        "action":       action,
        "price":        float(book.get("price", 0.0)),
        "borrow_date":  now_iso() if action == "BORROW" else None,
        "purchase_date":now_iso() if action == "BUY" else None,
        "due_date":     due_date,
        "return_date":  None,
        "status":       status,
        "fine_amount":  0.0,
        "fine_paid":    False,
        "current_page": 0,
        "progress_pct": 0.0,
    }
    transactions.append(new_txn)

    book["available_copies"] -= 1
    if action == "BORROW":
        book["borrow_count"] = book.get("borrow_count", 0) + 1

    user.setdefault("active_borrows", []).append(txn_id)

    # Atomic writes
    _write(TRANS_PATH, transactions)
    _write(BOOKS_PATH, books)
    _write(USERS_PATH, users)

    msg = f"Successfully borrowed '{book['title']}'." if action == "BORROW" else f"Successfully bought '{book['title']}'."
    return jsonify({"message": msg, "transaction": new_txn}), 200

@app.route("/api/borrow/<book_id>", methods=["POST"])
@login_required
def borrow_book(book_id):
    user_id = session["user_id"]

    books = _read(BOOKS_PATH)
    book  = next((b for b in books if b["id"] == book_id), None)
    if not book:
        return jsonify({"error": "Book not found."}), 404

    # Check availability
    if book.get("available_copies", 0) <= 0:
        return jsonify({"error": "No copies currently available. Please check back later."}), 409

    users = _read(USERS_PATH)
    user  = next((u for u in users if u["id"] == user_id), None)
    if not user:
        return jsonify({"error": "User not found."}), 404

    transactions = _read(TRANS_PATH)

    # Check already borrowed (active)
    already = next((t for t in transactions
                    if t["user_id"] == user_id
                    and t["book_id"] == book_id
                    and t["status"] in ("borrowed", "overdue")), None)
    if already:
        return jsonify({"error": "You have already borrowed this book."}), 409

    # Build transaction
    due_date   = (datetime.utcnow() + timedelta(days=BORROW_DAYS)).isoformat()
    txn_id     = f"txn_{uuid.uuid4().hex[:10]}"
    transaction = {
        "id":           txn_id,
        "user_id":      user_id,
        "book_id":      book_id,
        "book_title":   book["title"],
        "action":       "BORROW",
        "price":        float(book.get("price", 0.0)),
        "borrow_date":  now_iso(),
        "due_date":     due_date,
        "return_date":  None,
        "status":       "borrowed",
        "fine_amount":  0.0,
        "fine_paid":    False,
        "current_page": 0,
        "progress_pct": 0.0,
    }
    transactions.append(transaction)

    # Update book stock
    book["available_copies"] -= 1
    book["borrow_count"]      = book.get("borrow_count", 0) + 1

    # Update user active_borrows
    user.setdefault("active_borrows", []).append(txn_id)

    _write(TRANS_PATH, transactions)
    _write(BOOKS_PATH, books)
    _write(USERS_PATH, users)

    return jsonify({
        "message":     f"Successfully borrowed '{book['title']}'.",
        "transaction": transaction,
    }), 200


@app.route("/api/return/<book_id>", methods=["POST"])
@login_required
def return_book(book_id):
    user_id = session["user_id"]

    transactions = _read(TRANS_PATH)
    txn = next((t for t in transactions
                if t["user_id"] == user_id
                and t["book_id"] == book_id
                and t["status"] in ("borrowed", "overdue")), None)
    if not txn:
        return jsonify({"error": "No active borrow found for this book."}), 404

    # Calculate fine
    fine = calc_fine(txn["due_date"])
    txn["fine_amount"]  = fine
    txn["return_date"]  = now_iso()
    txn["status"]       = "returned"

    # Update book stock
    books = _read(BOOKS_PATH)
    book  = next((b for b in books if b["id"] == book_id), None)
    if book:
        book["available_copies"] = min(
            book["available_copies"] + 1,
            book["total_copies"]
        )

    # Update user
    users = _read(USERS_PATH)
    user  = next((u for u in users if u["id"] == user_id), None)
    if user:
        user["active_borrows"] = [b for b in user.get("active_borrows", []) if b != txn["id"]]
        user["books_read"]     = user.get("books_read", 0) + 1
        user["total_fines"]    = round(user.get("total_fines", 0.0) + fine, 2)

    _write(TRANS_PATH, transactions)
    _write(BOOKS_PATH, books)
    _write(USERS_PATH, users)

    msg = f"Returned '{txn['book_title']}' successfully."
    if fine > 0:
        msg += f" A late fee of ${fine:.2f} has been applied."

    return jsonify({"message": msg, "fine": fine, "transaction": txn}), 200


# ─────────────────────────────────────────────────────────
# ── READING PROGRESS ─────────────────────────────────────
# ─────────────────────────────────────────────────────────
@app.route("/api/progress/<book_id>", methods=["POST"])
@login_required
def update_progress(book_id):
    """Save Kindle-style reading progress for a book."""
    user_id = session["user_id"]
    data    = request.get_json(silent=True) or {}

    current_page = int(data.get("current_page", 0))
    progress_pct = float(data.get("progress_pct", 0.0))

    transactions = _read(TRANS_PATH)
    txn = next((t for t in transactions
                if t["user_id"] == user_id
                and t["book_id"] == book_id
                and t["status"] in ("borrowed", "overdue")), None)

    if not txn:
        return jsonify({"error": "No active borrow found. Borrow this book first."}), 404

    txn["current_page"] = current_page
    txn["progress_pct"] = min(round(progress_pct, 1), 100.0)
    _write(TRANS_PATH, transactions)

    return jsonify({"message": "Progress saved.", "current_page": current_page, "progress_pct": txn["progress_pct"]}), 200


# ─────────────────────────────────────────────────────────
# ── USER DASHBOARD ───────────────────────────────────────
# ─────────────────────────────────────────────────────────
@app.route("/api/user/dashboard", methods=["GET"])
@login_required
def user_dashboard():
    user_id = session["user_id"]

    users = _read(USERS_PATH)
    user  = next((u for u in users if u["id"] == user_id), None)
    if not user:
        return jsonify({"error": "User not found."}), 404

    books        = _read(BOOKS_PATH)
    authors      = _read(AUTHORS_PATH)
    transactions = _read(TRANS_PATH)

    user_txns = [t for t in transactions if t["user_id"] == user_id]

    # Update overdue status + recalculate fines live
    total_outstanding_fines = 0.0
    active_borrows  = []
    history         = []
    purchased       = []

    for txn in user_txns:
        if txn["status"] in ("borrowed", "overdue"):
            # Recompute fine
            fine = calc_fine(txn["due_date"])
            txn["fine_amount"] = fine
            if fine > 0:
                txn["status"] = "overdue"
            total_outstanding_fines += fine

            book = next((b for b in books if b["id"] == txn["book_id"]), {})
            active_borrows.append({
                **txn,
                "book":    enrich_book(book, authors) if book else {},
                "days_remaining": max(
                    0,
                    (datetime.fromisoformat(txn["due_date"]) - datetime.utcnow()).days
                ) if txn.get("due_date") else None,
            })
        elif txn["status"] in ("returned",):
            book = next((b for b in books if b["id"] == txn["book_id"]), {})
            history.append({
                **txn,
                "book": enrich_book(book, authors) if book else {},
            })
        elif txn["status"] == "bought":
            book = next((b for b in books if b["id"] == txn["book_id"]), {})
            purchased.append({
                **txn,
                "book": enrich_book(book, authors) if book else {},
            })

    # Reading challenge progress
    reading_goal = user.get("reading_goal", 24)
    books_read   = user.get("books_read", 0)

    safe_user = {k: v for k, v in user.items() if k != "password_hash"}

    return jsonify({
        "user":                    safe_user,
        "active_borrows":          active_borrows,
        "history":                 sorted(history, key=lambda t: t.get("return_date", ""), reverse=True),
        "purchases":               sorted(purchased, key=lambda t: t.get("purchase_date", ""), reverse=True),
        "total_active_borrows":    len(active_borrows),
        "total_outstanding_fines": round(total_outstanding_fines, 2),
        "reading_challenge": {
            "goal":     reading_goal,
            "read":     books_read,
            "percent":  round((books_read / reading_goal * 100) if reading_goal else 0, 1),
        },
    }), 200


# ─────────────────────────────────────────────────────────
# ── USER PREFERENCES ─────────────────────────────────────
# ─────────────────────────────────────────────────────────
@app.route("/api/user/profile", methods=["PATCH"])
@login_required
def update_profile():
    user_id = session["user_id"]
    data    = request.get_json(silent=True) or {}

    users = _read(USERS_PATH)
    user  = next((u for u in users if u["id"] == user_id), None)
    if not user:
        return jsonify({"error": "User not found."}), 404

    # Updateable fields (whitelist)
    allowed = {"name", "reading_goal"}
    for key in allowed:
        if key in data:
            val = data[key]
            if key == "name" and isinstance(val, str) and val.strip():
                user["name"] = val.strip()
            elif key == "reading_goal" and isinstance(val, int) and val > 0:
                user["reading_goal"] = val

    _write(USERS_PATH, users)
    safe = {k: v for k, v in user.items() if k != "password_hash"}
    return jsonify({"message": "Profile updated.", "user": safe}), 200


# ─────────────────────────────────────────────────────────
# ── SEARCH ───────────────────────────────────────────────
# ─────────────────────────────────────────────────────────
@app.route("/api/search", methods=["GET"])
def search():
    query = request.args.get("q", "").strip().lower()
    if len(query) < 2:
        return jsonify({"books": [], "authors": [], "total": 0}), 200

    books   = _read(BOOKS_PATH)
    authors = _read(AUTHORS_PATH)

    def book_matches(b):
        return any(query in str(b.get(f, "")).lower()
                   for f in ("title", "description", "category", "isbn")) or \
               any(query in tag.lower() for tag in b.get("tags", []))

    def author_matches(a):
        return query in a.get("name", "").lower() or query in a.get("genre", "").lower()

    matched_books   = [enrich_book(b, authors) for b in books if book_matches(b)][:12]
    matched_authors = [a for a in authors if author_matches(a)][:5]

    # Also search by author name across books
    author_name_hits = [enrich_book(b, authors) for b in books
                        if query in (next((a["name"] for a in authors if a["id"] == b["author_id"]), "")).lower()
                        and b not in matched_books][:6]

    all_books = matched_books + author_name_hits

    return jsonify({
        "books":   all_books[:12],
        "authors": matched_authors,
        "total":   len(all_books) + len(matched_authors),
    }), 200


# ─────────────────────────────────────────────────────────
# ── ADMIN ROUTES ─────────────────────────────────────────
# ─────────────────────────────────────────────────────────
def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user or user.get("role") != "admin":
            return jsonify({"error": "Admin access required."}), 403
        return f(*args, **kwargs)
    return decorated


@app.route("/api/admin/stats", methods=["GET"])
@login_required
@admin_required
def admin_stats():
    books        = _read(BOOKS_PATH)
    users        = _read(USERS_PATH)
    transactions = _read(TRANS_PATH)

    active_borrows = [t for t in transactions if t["status"] in ("borrowed", "overdue")]
    total_fines    = sum(calc_fine(t["due_date"]) for t in active_borrows)

    return jsonify({
        "total_books":      len(books),
        "total_users":      len(users),
        "active_borrows":   len(active_borrows),
        "overdue_borrows":  sum(1 for t in active_borrows if calc_fine(t["due_date"]) > 0),
        "total_fines":      round(total_fines, 2),
        "total_copies":     sum(b.get("total_copies", 0) for b in books),
        "available_copies": sum(b.get("available_copies", 0) for b in books),
    }), 200


# ─────────────────────────────────────────────────────────
# ── HEALTH CHECK ─────────────────────────────────────────
# ─────────────────────────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    books   = _read(BOOKS_PATH)
    authors = _read(AUTHORS_PATH)
    users   = _read(USERS_PATH)
    return jsonify({
        "status":      "ok",
        "timestamp":   now_iso(),
        "books":       len(books),
        "authors":     len(authors),
        "users":       len(users),
    }), 200


# ─────────────────────────────────────────────────────────
# ── ADMIN ROUTES ─────────────────────────────────────────
# ─────────────────────────────────────────────────────────
@app.route("/api/admin/dashboard", methods=["GET"])
@admin_required
def admin_dashboard():
    books = _read(BOOKS_PATH)
    users = _read(USERS_PATH)
    txns  = _read(TRANS_PATH)
    total_borrows = len([t for t in txns if t["status"] in ("borrowed", "returned", "overdue")])
    total_purchases = len([t for t in txns if t["status"] == "bought"])
    total_revenue = sum(t.get("price", 0) for t in txns if t["status"] == "bought") + sum(t.get("fine_amount", 0) for t in txns if t.get("fine_paid"))
    
    return jsonify({
        "metrics": {
            "total_users": len(users),
            "total_books": len(books),
            "total_borrows": total_borrows,
            "total_purchases": total_purchases,
            "total_revenue": round(total_revenue, 2),
        }
    }), 200

@app.route("/api/admin/users", methods=["GET"])
@admin_required
def admin_users():
    users = _read(USERS_PATH)
    safe_users = [{k: v for k, v in u.items() if k != "password_hash"} for u in users]
    return jsonify({"users": safe_users}), 200

@app.route("/api/admin/users/<user_id>", methods=["GET"])
@admin_required
def admin_user_detail(user_id):
    users = _read(USERS_PATH)
    user = next((u for u in users if u["id"] == user_id), None)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    txns = _read(TRANS_PATH)
    user_txns = [t for t in txns if t["user_id"] == user_id]
    user_txns.sort(key=lambda x: x.get("borrow_date") or x.get("purchase_date") or x.get("transaction_date") or "", reverse=True)
    
    safe_user = {k: v for k, v in user.items() if k != "password_hash"}
    return jsonify({"user": safe_user, "transactions": user_txns}), 200

@app.route("/api/admin/transactions", methods=["GET"])
@admin_required
def admin_transactions():
    txns = _read(TRANS_PATH)
    # Return newest first
    txns.sort(key=lambda x: x.get("borrow_date") or x.get("purchase_date") or x.get("transaction_date") or "", reverse=True)
    return jsonify({"transactions": txns}), 200

@app.route("/api/admin/books", methods=["POST"])
@admin_required
def admin_add_book():
    data = request.get_json(silent=True) or {}
    books = _read(BOOKS_PATH)
    new_book = {
        "id": f"book_{uuid.uuid4().hex[:8]}",
        "title": data.get("title", "New Book"),
        "author_name": data.get("author_name", "Unknown"),
        "category": data.get("category", "General"),
        "price": float(data.get("price", 0)),
        "total_copies": int(data.get("total_copies", 1)),
        "available_copies": int(data.get("available_copies", 1)),
        "cover_palette": int(data.get("cover_palette", 0)),
        "year": data.get("year", "2023"),
        "pages": data.get("pages", "300"),
    }
    books.append(new_book)
    _write(BOOKS_PATH, books)
    return jsonify({"message": "Book added", "book": new_book}), 201

@app.route("/api/admin/books/<book_id>", methods=["PUT", "DELETE"])
@admin_required
def admin_manage_book(book_id):
    books = _read(BOOKS_PATH)
    idx = next((i for i, b in enumerate(books) if b["id"] == book_id), None)
    if idx is None:
        return jsonify({"error": "Book not found"}), 404
        
    if request.method == "DELETE":
        deleted = books.pop(idx)
        _write(BOOKS_PATH, books)
        return jsonify({"message": "Book deleted", "book": deleted}), 200
        
    if request.method == "PUT":
        data = request.get_json(silent=True) or {}
        books[idx].update({
            "title": data.get("title", books[idx].get("title")),
            "author_name": data.get("author_name", books[idx].get("author_name")),
            "category": data.get("category", books[idx].get("category")),
            "price": float(data.get("price", books[idx].get("price", 0))),
            "total_copies": int(data.get("total_copies", books[idx].get("total_copies", 1))),
            "available_copies": int(data.get("available_copies", books[idx].get("available_copies", 1))),
        })
        _write(BOOKS_PATH, books)
        return jsonify({"message": "Book updated", "book": books[idx]}), 200

# ─────────────────────────────────────────────────────────
# ── SERVE FRONTEND ───────────────────────────────────────
# ─────────────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Route not found."}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error."}), 500


# ─────────────────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    if not os.path.exists(BOOKS_PATH):
        print("⚠  No data found. Run: python db_init.py")
    print("🚀  Librarium API starting on http://localhost:5000")
    app.run(debug=True, port=5000, host="0.0.0.0")
