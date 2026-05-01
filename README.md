# 📚 Librarium — The Modern Reading Universe

**Librarium** is a high-performance, full-stack management ecosystem designed to bridge the gap between digital lending and e-commerce. Built with a **"Vanilla-First"** philosophy, it provides a premium SaaS experience with zero framework overhead, achieving near-instantaneous load times and granular UI control[cite: 1, 9].

---

## 🚀 Key Features

### 🎭 Dual-Portal Ecosystem
*   **Member Universe:** A discovery-focused interface featuring horizontal carousels, glassmorphic book cards, and a native E-book reader[cite: 9].
*   **Admin SaaS Portal:** A high-density Obsidian-themed (`#0F111A`) environment for inventory management, user auditing, and real-time transaction monitoring[cite: 8, 9].

### 💳 Hybrid Transaction Logic
*   **Borrow Engine:** Implements a 7-day lending cycle with an automated backend **Fine Engine** that calculates penalties ($0.50/day) in real-time[cite: 1].
*   **Buy Engine:** Permanent digital acquisition model that adds titles to the user's personal collection and updates system-wide stock[cite: 1, 5].

### ⌨️ Command+K Global Palette
*   A keyboard-centric navigation center for rapid searching[cite: 7].
*   Supports **Administrative Shortcuts** (e.g., typing `/add` instantly triggers the management modal) to maximize workflow efficiency[cite: 7, 9].

### 📊 High-Density Data Viz
*   **SVG Sparklines:** Native SVG paths to visualize 7-day revenue and user trends without external libraries[cite: 9].
*   **Circular Gauges:** Visualizes reading goals and inventory capacity using dynamic SVG stroke-animations[cite: 8, 9].

---

## 🛠️ Technical Stack

*   **Backend:** Python **Flask** (RESTful API Design)[cite: 1].
*   **Database:** Atomic **JSON-based storage** logic ensuring data integrity during concurrent write operations[cite: 1, 2].
*   **Frontend:** Strictly Vanilla **HTML5, CSS3** (Custom Variables), and **ES6+ JavaScript**[cite: 7, 8, 9].
*   **Security:** Role-Based Access Control (RBAC) with **SHA-256** password hashing[cite: 1, 2].
*   **Performance:** Integrated **Skeleton Shimmer Loaders** for non-blocking asynchronous data fetching[cite: 8, 9].

---

## 📂 Project Structure

```text
├── app.py              # Flask Backend & REST API Routes
├── db_init.py          # Dataset Generator (100+ Books & Authors)
├── data/               # Persistent JSON Storage (Atomic Writes)
│   ├── books.json
│   ├── users.json
│   ├── authors.json
│   └── transactions.json
├── static/
│   ├── script.js       # Core UI Logic & API Handshake
│   └── style.css       # "Modern Universe" Design System
└── templates/
    └── index.html      # Main Single-Page Interface
```
[cite: 1, 2, 3, 4, 5, 6, 7, 8, 9]



## 📜 License
Developed by **Jainish Khatkar**. This project is a benchmark in Vanilla Full-Stack Engineering. All rights reserved.
