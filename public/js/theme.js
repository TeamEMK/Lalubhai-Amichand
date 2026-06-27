window.Theme = (function () {
  /* ── Theme definitions ─────────────────────────────────────────── */
  const THEMES = [
    { key: 'orange', name: 'Orange', color: '#C4714A', dark: '#b05a38', light: 'rgba(196,113,74,.14)', ring: 'rgba(196,113,74,.15)', bg: '#f4f6f9' },
    { key: 'blue',   name: 'Blue',   color: '#2563eb', dark: '#1d4ed8', light: 'rgba(37,99,235,.14)',   ring: 'rgba(37,99,235,.15)',   bg: '#eef3ff' },
    { key: 'green',  name: 'Green',  color: '#059669', dark: '#047857', light: 'rgba(5,150,105,.14)',   ring: 'rgba(5,150,105,.15)',   bg: '#edfaf5' },
    { key: 'purple', name: 'Purple', color: '#7c3aed', dark: '#6d28d9', light: 'rgba(124,58,237,.14)',  ring: 'rgba(124,58,237,.15)',  bg: '#f3eeff' },
    { key: 'rose',   name: 'Rose',   color: '#e11d48', dark: '#be123c', light: 'rgba(225,29,72,.14)',   ring: 'rgba(225,29,72,.15)',   bg: '#fff0f3' },
    { key: 'teal',   name: 'Teal',   color: '#0d9488', dark: '#0f766e', light: 'rgba(13,148,136,.14)',  ring: 'rgba(13,148,136,.15)',  bg: '#edfafa' },
  ];

  function _find(key) { return THEMES.find(t => t.key === key) || THEMES[0]; }

  /* ── Apply theme ───────────────────────────────────────────────── */
  function apply(key) {
    const t   = _find(key);
    const r   = document.documentElement;
    r.style.setProperty('--color-primary',       t.color);
    r.style.setProperty('--color-primary-dark',   t.dark);
    r.style.setProperty('--color-primary-light',  t.light);
    r.style.setProperty('--color-primary-ring',   t.ring);
    r.style.setProperty('--app-bg',               t.bg);
    r.dataset.theme = key;

    // Shell body background
    const sb = document.getElementById('shell-body');
    if (sb) sb.style.background = t.bg;

    // Update sidebar active bar colour (inline styles need manual sync)
    if (window.Sidebar) window.Sidebar._syncActive();

    // Update topbar theme dot
    const dot = document.getElementById('tb-theme-dot');
    if (dot) dot.style.background = t.color;

    localStorage.setItem('erp-theme', key);
  }

  /* ── Read saved theme and apply (call once on load) ────────────── */
  function init() {
    apply(localStorage.getItem('erp-theme') || 'orange');
  }

  return {
    init,
    apply,
    themes:  () => THEMES,
    current: () => localStorage.getItem('erp-theme') || 'orange',
    color:   () => _find(localStorage.getItem('erp-theme') || 'orange').color,
  };
})();
