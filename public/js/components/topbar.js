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
    'daily-reports':'Daily Reports',
    'meetings':     'Meetings',
    'client-master':'Client Master',
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
    if (!roles || !roles.length) return '';
    // Pick the most prominent role for the badge
    const role = roles.includes('Admin') ? 'Admin'
               : roles.includes('HOD')   ? 'HOD'
               : roles[0];

    const color = (role === 'Admin' || role === 'HOD')
      ? { bg: 'rgba(46,114,181,0.15)', text: '#5B9ED7', border: 'rgba(46,114,181,0.3)' }
      : { bg: 'rgba(100,116,139,0.12)', text: '#94a3b8', border: 'rgba(100,116,139,0.25)' };

    return `<span style="
      font-size:10px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;
      padding:2px 8px;border-radius:9999px;
      background:${color.bg};color:${color.text};
      border:1px solid ${color.border};
      white-space:nowrap;
    ">${role}</span>`;
  },

  _buildHTML(user) {
    const title   = this._getTitle();
    const today   = this._formatDate();
    const roles   = user?.roles || [];
    const name    = user?.name || 'User';

    return `
      <div style="padding:0 24px;height:56px;display:flex;align-items:center;gap:16px;">

        <!-- Page title -->
        <h1 style="
          font-size:15px;font-weight:600;letter-spacing:-0.02em;
          color:#1e293b;margin:0;
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
          flex-shrink:0;
        " id="topbar-title">${title}</h1>

        <div style="flex:1;"></div>

        <!-- Date (hidden on narrow screens via inline check — always shown here) -->
        <div style="display:flex;align-items:center;font-size:12px;color:#94a3b8;white-space:nowrap;flex-shrink:0;">
          ${this._calendarIcon}
          ${today}
        </div>

        <!-- Divider -->
        <div style="width:1px;height:20px;background:#e2e8f0;flex-shrink:0;"></div>

        <!-- User info -->
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
          <span style="font-size:13px;font-weight:500;color:#374151;white-space:nowrap;">${name}</span>
          ${this._roleBadge(roles)}
        </div>

        <!-- Logout button -->
        <button
          onclick="window.Topbar._logout()"
          title="Sign out"
          style="
            display:flex;align-items:center;gap:6px;
            padding:6px 12px;border-radius:7px;
            background:transparent;border:1px solid #e2e8f0;
            font-size:12px;font-weight:500;color:#64748b;
            cursor:pointer;flex-shrink:0;
            transition:background 0.15s,color 0.15s,border-color 0.15s;
          "
          onmouseenter="this.style.background='rgba(239,68,68,0.06)';this.style.color='#ef4444';this.style.borderColor='rgba(239,68,68,0.3)';"
          onmouseleave="this.style.background='transparent';this.style.color='#64748b';this.style.borderColor='#e2e8f0';"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <path d="m16 17 5-5-5-5"/>
            <path d="M21 12H9"/>
          </svg>
          Sign out
        </button>

      </div>
    `;
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

    // Apply topbar shell styles
    el.style.cssText = `
      position:sticky;top:0;z-index:20;
      background:rgba(255,255,255,0.92);
      backdrop-filter:blur(8px);
      -webkit-backdrop-filter:blur(8px);
      border-bottom:1px solid #e2e8f0;
    `;

    el.innerHTML = this._buildHTML(user);

    // Keep the page title in sync when the user navigates
    window.addEventListener('hashchange', () => this._syncTitle());
  },
};
