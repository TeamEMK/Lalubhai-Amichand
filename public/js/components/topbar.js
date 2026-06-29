/* Topbar component — vanilla JS equivalent of Topbar.jsx */
window.Topbar = {
  // Map hash-fragment routes to display titles (mirrors Topbar.jsx TITLES)
  _titles: {
    'dashboard':    'Dashboard',
    'all-tasks':    'All Tasks',
    'approvals':    'Approvals',
    'users':        'Users',
    'mis':          'MIS Report',
    'masters':      'Checklists',
    'fms':          'FMS Master',
    'profile':      'Profile',
    'leave-tracker':'Leave Tracker',
    'meetings':     'Meetings',
    'client-master':'',
    'daily-task':   'Daily Task',
    'race-tracker': 'Race Tracker',
    'compliance':   'Compliance',
  },

  _calendarIcon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;color:#cbd5e1;flex-shrink:0;">
    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>`,

  _getTitle() {
    const route = (window.location.hash || '').replace('#', '') || 'dashboard';
    return this._titles[route] || '';
  },

  _formatDate() {
    return new Date().toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  },

  _roleBadge(roles) {
    if (!roles || !roles.length) return '<span style="color:#94a3b8;">Member</span>';
    const role = roles.includes('Admin') ? 'Admin'
               : roles.includes('HOD')   ? 'HOD'
               : roles[0];
    const isElevated = role === 'Admin' || role === 'HOD';
    return `<span style="font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${isElevated ? '#C4714A' : '#94a3b8'};">${role}</span>`;
  },

  _buildHTML(user) {
    const title  = this._getTitle();
    const today  = this._formatDate();
    const roles  = user?.roles || [];
    const name   = user?.name || 'User';
    const initials = (name).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    return `
      <div style="padding:0 28px;height:56px;display:flex;align-items:center;gap:14px;">

        <!-- Page title -->
        <h1 style="
          font-size:16px;font-weight:700;letter-spacing:-0.025em;
          color:#0f172a;margin:0;
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex-shrink:0;
        " id="topbar-title">${title}</h1>

        <div style="flex:1;min-width:0;"></div>

        <!-- Date -->
        <div style="display:flex;align-items:center;gap:5px;font-size:12px;color:#94a3b8;white-space:nowrap;flex-shrink:0;">
          ${this._calendarIcon}
          <span>${today}</span>
        </div>

        <!-- Theme picker trigger -->
        <div style="position:relative;flex-shrink:0;" id="tb-theme-wrap">
          <button id="tb-theme-btn" onclick="window.Topbar._toggleThemePicker()" title="Change theme"
            style="display:flex;align-items:center;gap:6px;padding:5px 10px;border-radius:8px;background:transparent;border:1.5px solid #e8edf3;cursor:pointer;transition:all .15s;"
            onmouseenter="this.style.background='#f8fafc';this.style.borderColor='#d1d9e4';"
            onmouseleave="this.style.background='transparent';this.style.borderColor='#e8edf3';">
            <span id="tb-theme-dot" style="width:11px;height:11px;border-radius:50%;background:var(--color-primary);display:block;flex-shrink:0;"></span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="13.5" cy="6.5" r=".5" fill="#64748b"/><circle cx="17.5" cy="10.5" r=".5" fill="#64748b"/>
              <circle cx="8.5" cy="7.5" r=".5" fill="#64748b"/><circle cx="6.5" cy="12.5" r=".5" fill="#64748b"/>
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
            </svg>
          </button>
        </div>

        <!-- Divider -->
        <div style="width:1px;height:20px;background:#e8edf3;flex-shrink:0;margin:0 2px;"></div>

        <!-- Avatar + name + role -->
        <div style="display:flex;align-items:center;gap:9px;flex-shrink:0;">
          <div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--color-primary),var(--color-primary-dark));display:grid;place-items:center;color:#fff;font-size:11px;font-weight:700;flex-shrink:0;">${initials}</div>
          <div style="line-height:1.25;">
            <div style="font-size:13px;font-weight:600;color:#1e293b;white-space:nowrap;">${name}</div>
            <div style="font-size:10px;color:#94a3b8;white-space:nowrap;">${this._roleBadge(roles)}</div>
          </div>
        </div>

        <!-- Divider -->
        <div style="width:1px;height:20px;background:#e8edf3;flex-shrink:0;margin:0 2px;"></div>

        <!-- Sign out -->
        <button
          onclick="window.Topbar._logout()"
          title="Sign out"
          style="
            display:flex;align-items:center;gap:5px;
            padding:6px 12px;border-radius:8px;
            background:transparent;border:1.5px solid #e8edf3;
            font-size:12px;font-weight:600;color:#64748b;
            cursor:pointer;flex-shrink:0;
            transition:all 0.15s;
          "
          onmouseenter="this.style.background='#fff1f2';this.style.color='#e11d48';this.style.borderColor='#fecdd3';"
          onmouseleave="this.style.background='transparent';this.style.color='#64748b';this.style.borderColor='#e8edf3';"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>
          </svg>
          Sign out
        </button>

      </div>
    `;
  },

  _toggleThemePicker() {
    const existing = document.getElementById('tb-theme-dropdown');
    if (existing) { existing.remove(); return; }

    const wrap = document.getElementById('tb-theme-wrap');
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const cur  = window.Theme?.current() || 'orange';
    const list = window.Theme?.themes() || [];

    const dd = document.createElement('div');
    dd.id = 'tb-theme-dropdown';
    dd.style.cssText = [
      'position:fixed',
      `top:${rect.bottom + 8}px`,
      `right:${window.innerWidth - rect.right}px`,
      'background:#fff',
      'border:1.5px solid #e8edf3',
      'border-radius:14px',
      'box-shadow:0 12px 40px rgba(0,0,0,.12),0 2px 8px rgba(0,0,0,.06)',
      'padding:10px',
      'z-index:2000',
      'min-width:172px',
      'animation:pop-in 150ms cubic-bezier(.16,1,.3,1)',
    ].join(';');

    dd.innerHTML = `
      <div style="font-size:9.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#94a3b8;padding:2px 8px 8px;">Theme</div>
      <div style="display:flex;flex-direction:column;gap:1px;">
        ${list.map(t => `
          <button
            onclick="window.Theme.apply('${t.key}');document.getElementById('tb-theme-dropdown')?.remove();"
            style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:9px;border:none;background:${cur === t.key ? 'var(--color-primary-light)' : 'transparent'};cursor:pointer;width:100%;text-align:left;transition:background .1s;"
            onmouseenter="this.style.background='var(--color-primary-light)'"
            onmouseleave="this.style.background='${cur === t.key ? 'var(--color-primary-light)' : 'transparent'}'"
          >
            <span style="width:20px;height:20px;border-radius:50%;background:${t.color};flex-shrink:0;${cur === t.key ? 'box-shadow:0 0 0 2.5px #fff,0 0 0 4px ' + t.color : ''};"></span>
            <span style="font-size:13px;font-weight:${cur === t.key ? '600' : '400'};color:${cur === t.key ? '#1e293b' : '#64748b'};flex:1;">${t.name}</span>
            ${cur === t.key ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' : ''}
          </button>
        `).join('')}
      </div>`;

    document.body.appendChild(dd);

    setTimeout(() => {
      document.addEventListener('click', function close(e) {
        if (!dd.contains(e.target) && document.getElementById('tb-theme-btn') !== e.target && !document.getElementById('tb-theme-btn')?.contains(e.target)) {
          dd.remove();
          document.removeEventListener('click', close);
        }
      });
    }, 50);
  },

  async _logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    location.reload();
  },

  // Update the page-title span on hash navigation without re-rendering everything
  _syncTitle() {
    const titleEl = document.getElementById('topbar-title');
    if (titleEl) titleEl.textContent = this._getTitle();
  },

  render(user) {
    this._user = user;
    const el = document.getElementById('topbar');
    if (!el) return;
    el.innerHTML = this._buildHTML(user);
    window.addEventListener('hashchange', () => this._syncTitle());
  },
};
