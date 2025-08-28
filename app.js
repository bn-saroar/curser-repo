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

