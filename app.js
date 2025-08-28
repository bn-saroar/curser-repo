const AppState = {
  rawTransactions: [],
  filteredTransactions: [],
  sort: { key: "date", direction: "desc" },
  pagination: { pageSize: 25, currentPage: 1 },
  filters: { search: "", from: "", to: "", status: "", method: "" },
  currency: { code: "USD", locale: navigator.language || "en-US" }
};

document.addEventListener("DOMContentLoaded", () => {
  initializeTheme();
  attachEventListeners();
  AppState.rawTransactions = generateSampleTransactions(250);
  applyFiltersAndRender();
});

function initializeTheme() {
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (prefersDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);
  const toggle = document.getElementById("theme-toggle");
  if (toggle) toggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
}

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute("data-theme") === "dark";
  const next = isDark ? "light" : "dark";
  html.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  const toggle = document.getElementById("theme-toggle");
  if (toggle) toggle.setAttribute("aria-pressed", next === "dark" ? "true" : "false");
}

function attachEventListeners() {
  const byId = (id) => document.getElementById(id);
  byId("theme-toggle").addEventListener("click", toggleTheme);
  byId("export-csv").addEventListener("click", onExportCsv);
  byId("search-input").addEventListener("input", debounce((e) => {
    AppState.filters.search = e.target.value.trim();
    AppState.pagination.currentPage = 1;
    applyFiltersAndRender();
  }, 200));
  byId("date-from").addEventListener("change", (e) => {
    AppState.filters.from = e.target.value;
    AppState.pagination.currentPage = 1;
    applyFiltersAndRender();
  });
  byId("date-to").addEventListener("change", (e) => {
    AppState.filters.to = e.target.value;
    AppState.pagination.currentPage = 1;
    applyFiltersAndRender();
  });
  byId("status-filter").addEventListener("change", (e) => {
    AppState.filters.status = e.target.value;
    AppState.pagination.currentPage = 1;
    applyFiltersAndRender();
  });
  byId("method-filter").addEventListener("change", (e) => {
    AppState.filters.method = e.target.value;
    AppState.pagination.currentPage = 1;
    applyFiltersAndRender();
  });
  byId("page-size").addEventListener("change", (e) => {
    AppState.pagination.pageSize = Number(e.target.value);
    AppState.pagination.currentPage = 1;
    applyFiltersAndRender();
  });

  for (const thBtn of document.querySelectorAll(".th-btn")) {
    thBtn.addEventListener("click", () => onSortRequest(thBtn.getAttribute("data-sort")));
    thBtn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSortRequest(thBtn.getAttribute("data-sort"));
      }
    });
  }

  document.getElementById("prev-page").addEventListener("click", () => {
    if (AppState.pagination.currentPage > 1) {
      AppState.pagination.currentPage -= 1;
      renderTableAndPagination();
    }
  });
  document.getElementById("next-page").addEventListener("click", () => {
    const { totalPages } = getPaginationMeta();
    if (AppState.pagination.currentPage < totalPages) {
      AppState.pagination.currentPage += 1;
      renderTableAndPagination();
    }
  });
}

function onSortRequest(key) {
  const current = AppState.sort;
  if (current.key === key) {
    current.direction = current.direction === "asc" ? "desc" : "asc";
  } else {
    current.key = key;
    current.direction = key === "amount" || key === "date" ? "desc" : "asc";
  }
  updateSortAria();
  renderTableAndPagination();
}

function updateSortAria() {
  for (const btn of document.querySelectorAll(".th-btn")) {
    const key = btn.getAttribute("data-sort");
    const isActive = AppState.sort.key === key;
    btn.setAttribute("aria-sort", isActive ? AppState.sort.direction : "none");
  }
}

function applyFiltersAndRender() {
  const search = AppState.filters.search.toLowerCase();
  const from = AppState.filters.from ? new Date(AppState.filters.from) : null;
  const to = AppState.filters.to ? new Date(AppState.filters.to) : null;
  const status = AppState.filters.status;
  const method = AppState.filters.method;
  AppState.filteredTransactions = AppState.rawTransactions.filter((t) => {
    if (search) {
      const match = `${t.id} ${t.description}`.toLowerCase().includes(search);
      if (!match) return false;
    }
    if (from && new Date(t.date) < from) return false;
    if (to && new Date(t.date) > endOfDay(to)) return false;
    if (status && t.status !== status) return false;
    if (method && t.method !== method) return false;
    return true;
  });
  updateSortAria();
  renderSummary();
  renderTableAndPagination();
}

function renderTableAndPagination() {
  const sorted = [...AppState.filteredTransactions].sort((a, b) => compareByKey(a, b, AppState.sort.key, AppState.sort.direction));
  const { pageSize, currentPage } = AppState.pagination;
  const start = (currentPage - 1) * pageSize;
  const pageItems = sorted.slice(start, start + pageSize);
  const tbody = document.getElementById("table-body");
  tbody.innerHTML = pageItems.map(renderRow).join("");
  renderPaginationControls(sorted.length);
}

function renderPaginationControls(total) {
  const { currentPage, pageSize } = AppState.pagination;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const indicator = document.getElementById("page-indicator");
  indicator.textContent = `Page ${Math.min(currentPage, totalPages)} of ${totalPages}`;
  document.getElementById("prev-page").disabled = currentPage <= 1;
  document.getElementById("next-page").disabled = currentPage >= totalPages;
}

function getPaginationMeta() {
  const { currentPage, pageSize } = AppState.pagination;
  const totalPages = Math.max(1, Math.ceil(AppState.filteredTransactions.length / pageSize));
  return { currentPage, pageSize, totalPages };
}

function renderRow(t) {
  const amount = formatCurrency(t.amount, AppState.currency.code, AppState.currency.locale);
  const statusClass = t.status.toLowerCase();
  return `
    <tr>
      <td>${t.id}</td>
      <td>${formatDate(t.date)}</td>
      <td>${escapeHtml(t.description)}</td>
      <td>${t.method}</td>
      <td><span class="badge ${statusClass}">${t.status}</span></td>
      <td class="numeric">${amount}</td>
    </tr>
  `;
}

function renderSummary() {
  const totals = AppState.filteredTransactions.reduce((acc, t) => {
    if (t.status === "Completed") acc.completed += t.amount;
    if (t.status === "Refunded") acc.refunded += Math.abs(t.amount);
    if (t.status === "Failed") acc.failed += Math.abs(t.amount);
    return acc;
  }, { completed: 0, refunded: 0, failed: 0 });

  document.getElementById("stat-count").textContent = String(AppState.filteredTransactions.length);
  document.getElementById("stat-completed").textContent = formatCurrency(totals.completed);
  document.getElementById("stat-refunded").textContent = formatCurrency(totals.refunded);
  document.getElementById("stat-failed").textContent = formatCurrency(totals.failed);
}

function onExportCsv() {
  const headers = ["ID", "Date", "Description", "Method", "Status", "Amount", "Currency"];
  const sorted = [...AppState.filteredTransactions].sort((a, b) => compareByKey(a, b, AppState.sort.key, AppState.sort.direction));
  const csvRows = [headers.join(",")];
  for (const t of sorted) {
    const row = [
      escapeCsv(String(t.id)),
      escapeCsv(new Date(t.date).toISOString()),
      escapeCsv(t.description),
      escapeCsv(t.method),
      escapeCsv(t.status),
      escapeCsv(t.amount.toFixed(2)),
      escapeCsv(AppState.currency.code)
    ];
    csvRows.push(row.join(","));
  }
  const csv = "\uFEFF" + csvRows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `payment-history-${Date.now()}.csv`;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function compareByKey(a, b, key, direction) {
  const dir = direction === "asc" ? 1 : -1;
  let av = a[key];
  let bv = b[key];
  if (key === "date") {
    av = new Date(a.date).getTime();
    bv = new Date(b.date).getTime();
  }
  if (typeof av === "string" && typeof bv === "string") {
    const res = av.localeCompare(bv);
    return res * dir;
  }
  if (av < bv) return -1 * dir;
  if (av > bv) return 1 * dir;
  return 0;
}

function endOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function formatCurrency(amount, code = AppState.currency.code, locale = AppState.currency.locale) {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: code }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function escapeHtml(s) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return s.replace(/[&<>"']/g, (m) => map[m]);
}

function escapeCsv(s) {
  const needsEscaping = /[",\n]/.test(s);
  let out = s.replace(/"/g, '""');
  if (needsEscaping) out = '"' + out + '"';
  return out;
}

function debounce(fn, ms) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSampleTransactions(count) {
  const methods = ["Card", "Bank Transfer", "PayPal", "Cash", "Crypto"];
  const statuses = ["Completed", "Pending", "Failed", "Refunded"];
  const descriptions = [
    "Subscription payment",
    "Invoice settlement",
    "Refund issued",
    "Point of sale",
    "Online checkout",
    "Wire transfer",
    "Chargeback",
    "Payout",
    "Wallet top-up",
    "Manual adjustment"
  ];

  const list = [];
  const now = Date.now();
  for (let i = 1; i <= count; i++) {
    const daysAgo = Math.floor(Math.random() * 365);
    const dt = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
    const status = randomChoice(statuses);
    const sign = status === "Refunded" || status === "Failed" ? -1 : 1;
    const amount = sign * (Math.random() * 500 + 5);
    list.push({
      id: 1000 + i,
      date: dt.toISOString(),
      description: randomChoice(descriptions),
      method: randomChoice(methods),
      status,
      amount: Number(amount.toFixed(2))
    });
  }
  return list;
}

const bodyElement = document.body;
const themeButton = document.getElementById('btn-theme');
const themeIcon = document.getElementById('themeIcon');
const menuButton = document.getElementById('btn-menu');
const menuDialog = document.getElementById('menuDialog');

function getStoredTheme() {
  try { return localStorage.getItem('theme-preference'); } catch (_) { return null; }
}
function storeTheme(theme) {
  try { localStorage.setItem('theme-preference', theme); } catch (_) {}
}

function applyTheme(theme) {
  if (theme === 'light') {
    bodyElement.classList.add('theme-light');
    themeIcon.classList.remove('ri-sun-line');
    themeIcon.classList.add('ri-moon-line');
  } else {
    bodyElement.classList.remove('theme-light');
    themeIcon.classList.remove('ri-moon-line');
    themeIcon.classList.add('ri-sun-line');
  }
}

function toggleTheme() {
  const isLight = bodyElement.classList.toggle('theme-light');
  applyTheme(isLight ? 'light' : 'dark');
  storeTheme(isLight ? 'light' : 'dark');
}

// Initialize theme from storage or prefers-color-scheme
(() => {
  const stored = getStoredTheme();
  if (stored) {
    applyTheme(stored);
  } else {
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    applyTheme(prefersLight ? 'light' : 'dark');
  }
})();

themeButton.addEventListener('click', toggleTheme);

// Menu dialog
menuButton.addEventListener('click', () => {
  if (typeof menuDialog.showModal === 'function') {
    menuDialog.showModal();
  } else {
    alert('Menu');
  }
});

menuDialog?.addEventListener('click', (e) => {
  const isBackdrop = e.target === menuDialog;
  const isClose = e.target.closest('[data-close]');
  if (isBackdrop || isClose) menuDialog.close();
});

// Simple keyboard navigation for accessibility
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menuDialog?.open) menuDialog.close();
});

// Demo: show which quick action was tapped
document.querySelectorAll('.card').forEach((card) => {
  card.addEventListener('click', (e) => {
    e.preventDefault();
    const action = card.getAttribute('data-action');
    const title = card.querySelector('h3')?.textContent ?? action;
    toast(`${title} coming soon`);
  });
});

// Lightweight toast
let toastTimeoutId = null;
function toast(message) {
  let bar = document.getElementById('toast');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'toast';
    bar.style.position = 'fixed';
    bar.style.left = '50%';
    bar.style.bottom = '20px';
    bar.style.transform = 'translateX(-50%)';
    bar.style.background = 'rgba(17, 17, 17, 0.9)';
    bar.style.color = '#fff';
    bar.style.padding = '10px 14px';
    bar.style.borderRadius = '12px';
    bar.style.boxShadow = '0 10px 24px rgba(0,0,0,.25)';
    bar.style.zIndex = '9999';
    document.body.appendChild(bar);
  }
  bar.textContent = message;
  bar.style.opacity = '1';
  clearTimeout(toastTimeoutId);
  toastTimeoutId = setTimeout(() => { bar.style.opacity = '0'; }, 1800);
}

