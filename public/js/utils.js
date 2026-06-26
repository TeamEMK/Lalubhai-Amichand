window.Utils = {
  async apiFetch(url, opts={}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(url, { headers:{'Content-Type':'application/json'}, signal: controller.signal, ...opts });
      clearTimeout(timer);
      if (res.status===401) { window.location.hash='#login'; return null; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error||'Error');
      return data;
    } catch(e) {
      clearTimeout(timer);
      if (e.name === 'AbortError') throw new Error('Request timed out: ' + url);
      throw e;
    }
  },
  showToast(msg, type='success') {
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = [
      'position:fixed',
      'bottom:24px',
      'right:24px',
      'z-index:9999',
      'padding:12px 20px',
      'border-radius:6px',
      'font-size:14px',
      'font-weight:500',
      'color:#fff',
      'box-shadow:0 4px 12px rgba(0,0,0,0.2)',
      'transition:opacity 0.3s ease',
      'opacity:1'
    ].join(';');
    toast.style.background = type === 'error' ? '#e53e3e'
      : type === 'warning' ? '#dd6b20'
      : '#38a169';
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; }, 2700);
    setTimeout(() => { toast.remove(); }, 3000);
  },
  formatDate(d) {
    if (!d) return '';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
  },
  formatDateTime(d) {
    if (!d) return '';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
      + ' '
      + date.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true });
  },
  confirm(msg) { return window.confirm(msg); }
};
