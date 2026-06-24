window.Pages = window.Pages || {};

window.Pages.dashboard = (function () {

  /* ── helpers ─────────────────────────────────────────────────────── */
  function fmt(iso) {
    if (!iso) return '—';
    return new Date(iso)
      .toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      .replace(/\//g, '-');
  }

  function fmtDateInput(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toISOString().split('T')[0];
  }

  function todayISO() {
    return new Date().toISOString().split('T')[0];
  }

  function isAdmin(user) {
    if (!user) return false;
    const roles = Array.isArray(user.roles) ? user.roles : (user.roles || '').split(',').map(r => r.trim());
    return roles.includes('Admin') || roles.includes('HOD');
  }

  function avatarHTML(name) {
    name = name || '';
    const ini = name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase() || '·';
    const palette = [
      'background:linear-gradient(135deg,#f43f5e,#db2777)',
      'background:linear-gradient(135deg,#f59e0b,#ea580c)',
      'background:linear-gradient(135deg,#10b981,#0d9488)',
      'background:linear-gradient(135deg,#C4714A,#D4895A)',
      'background:linear-gradient(135deg,#8b5cf6,#7c3aed)',
    ];
    const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const style = palette[hash % palette.length];
    return `<div style="${style};width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:9px;font-weight:700;flex-shrink:0;">${ini}</div>`;
  }

  function typePillHTML(type) {
    const map = {
      Delegation: 'background:#eff6ff;color:#1d4ed8;',
      FMS:        'background:#f5f3ff;color:#6d28d9;',
      Checklist:  'background:#ecfdf5;color:#065f46;',
    };
    const style = map[type] || 'background:#f1f5f9;color:#475569;';
    return `<span style="${style}display:inline-flex;align-items:center;padding:2px 8px;font-size:10.5px;font-weight:600;border-radius:9999px;">${type}</span>`;
  }

  function priorityHTML(type, priority) {
    if (type === 'Checklist') return '<span style="color:#94a3b8;font-size:12px;">—</span>';
    if (!priority || priority === 'Low') return '<span style="color:#94a3b8;font-size:12px;">Low</span>';
    const style = priority === 'High'
      ? 'background:#fef2f2;color:#dc2626;border:1px solid #fecaca;'
      : 'background:#fffbeb;color:#d97706;border:1px solid #fde68a;';
    return `<span style="${style}display:inline-flex;align-items:center;padding:2px 8px;font-size:10.5px;font-weight:600;border-radius:9999px;">${priority}</span>`;
  }

  /* ── performance computation ─────────────────────────────────────── */
  function computePerf(delegations, users) {
    const from = new Date(); from.setDate(from.getDate() - 30);
    const stats = {};
    (users || []).forEach(u => { stats[u.name] = { name: u.name, completed: 0, total: 0, pending: 0 }; });
    (delegations || []).forEach(d => {
      const date = new Date(d.createdAt || d.created_at);
      if (date >= from && stats[d.doer]) {
        stats[d.doer].total++;
        if (d.status === 'done') stats[d.doer].completed++;
        else stats[d.doer].pending++;
      }
    });
    const arr = Object.values(stats).filter(s => s.total > 0);
    arr.sort((a, b) => b.completed - a.completed);
    return {
      top5:       arr.slice(0, 5),
      bottom5:    [...arr].sort((a, b) => b.pending   - a.pending).slice(0, 5),
      mostActive: [...arr].sort((a, b) => b.total     - a.total  ).slice(0, 5),
    };
  }

  function barListHTML(title, items, valueKey, tone, icon) {
    const colors = {
      emerald: { bar: 'linear-gradient(90deg,#34d399,#059669)', icon: 'linear-gradient(135deg,#34d399,#059669)', text: '#065f46' },
      red:     { bar: 'linear-gradient(90deg,#f87171,#dc2626)', icon: 'linear-gradient(135deg,#f87171,#dc2626)', text: '#991b1b' },
      blue:    { bar: 'linear-gradient(90deg,#C4714A,#D4895A)', icon: 'linear-gradient(135deg,#C4714A,#D4895A)', text: '#7c2d12' },
    };
    const c = colors[tone] || colors.blue;
    const max = Math.max(...items.map(i => i[valueKey] || 0), 1);
    const rows = items.length === 0
      ? '<div style="color:#94a3b8;font-size:12px;padding:1.5rem;text-align:center;">No data in this range</div>'
      : items.map((i, idx) => `
          <li style="display:flex;align-items:center;gap:10px;font-size:12px;margin-bottom:8px;">
            <div style="width:20px;height:20px;border-radius:6px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;color:#64748b;flex-shrink:0;">${idx + 1}</div>
            <div style="width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500;color:#334155;" title="${i.name}">${i.name}</div>
            <div style="flex:1;background:#e2e8f0;border-radius:9999px;height:8px;overflow:hidden;">
              <div style="height:100%;border-radius:9999px;background:${c.bar};width:${Math.round((i[valueKey] / max) * 100)}%;transition:width .4s;"></div>
            </div>
            <div style="width:24px;text-align:right;font-weight:700;color:${c.text};font-variant-numeric:tabular-nums;">${i[valueKey]}</div>
          </li>`).join('');
    return `
      <div class="card" style="padding:1rem;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
          <div style="width:28px;height:28px;border-radius:8px;background:${c.icon};display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;">${icon}</div>
          <h3 style="font-size:13px;font-weight:600;color:#1e293b;margin:0;">${title}</h3>
        </div>
        <ul style="margin:0;padding:0;list-style:none;">${rows}</ul>
      </div>`;
  }

  /* ── modal helpers ───────────────────────────────────────────────── */
  function showModal(id) { document.getElementById(id) && (document.getElementById(id).style.display = 'flex'); }
  function hideModal(id) { document.getElementById(id) && (document.getElementById(id).style.display = 'none'); }

  /* ── state ───────────────────────────────────────────────────────── */
  let _state = {
    data: null,
    users: [],
    holidays: [],
    delegations: [],
    subTab: 'All',
    userFilter: 'All',
    reviseTask: null,
    reviseSaving: false,
    reviseNote: '',
    reviseDate: '',
  };

  /* ── render helpers for tasks table ─────────────────────────────── */
  function getFiltered() {
    const { data, subTab, userFilter } = _state;
    if (!data) return [];
    const STATUS_RANK = { revise: 0, revise_requested: 1, pending: 2, done: 3 };
    return data.pendingTasks
      .filter(t =>
        (subTab === 'All' || t.type === subTab) &&
        (userFilter === 'All' || t.doer === userFilter)
      )
      .slice()
      .sort((a, b) => (STATUS_RANK[a.status] ?? 2) - (STATUS_RANK[b.status] ?? 2));
  }

  /* ── full render ─────────────────────────────────────────────────── */
  async function render() {
    const el = document.getElementById('main-content');
    if (!el) return;

    el.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;padding:3rem;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:12px;color:#94a3b8;">
          <svg style="animation:spin .8s linear infinite;" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          <span style="font-size:13px;">Loading dashboard…</span>
        </div>
      </div>
      <style>@keyframes spin{to{transform:rotate(360deg)}}</style>`;

    const user = window.currentUser;
    const admin = isAdmin(user);

    /* parallel fetches */
    const [dashData, usersData, holidaysData, delegationsData] = await Promise.all([
      Utils.apiFetch('/api/dashboard'),
      Utils.apiFetch('/api/users'),
      Utils.apiFetch('/api/holidays'),
      admin ? Utils.apiFetch('/api/delegations') : Promise.resolve([]),
    ]);

    if (!dashData) return;

    _state.data        = dashData;
    _state.users       = usersData || [];
    _state.holidays    = holidaysData || [];
    _state.delegations = delegationsData || [];
    _state.subTab      = 'All';
    _state.userFilter  = 'All';

    _renderShell(el, admin);
  }

  function _renderShell(el, admin) {
    const { data, users, holidays } = _state;
    const allDoers = [...new Set((users || []).map(u => u.name))].sort();

    const perf = admin ? computePerf(_state.delegations, users) : null;

    el.innerHTML = `
      <style>
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        #db-wrap { animation: fadeIn .25s ease both; min-width: 900px; }
        .db-modal-overlay { position:fixed;inset:0;background:rgba(15,23,42,.5);backdrop-filter:blur(4px);z-index:100;display:none;align-items:center;justify-content:center;padding:1rem; }
        .db-modal-box { background:#fff;border-radius:1.25rem;box-shadow:0 20px 60px rgba(0,0,0,.18);width:100%;max-width:440px;overflow:hidden; }
        .db-modal-head { display:flex;align-items:center;gap:12px;padding:1rem 1.25rem;border-bottom:1px solid #e2e8f0; }
        .db-modal-body { padding:1.25rem;display:flex;flex-direction:column;gap:12px; }
        .db-modal-foot { display:flex;justify-content:flex-end;gap:8px;padding:.875rem 1.25rem;border-top:1px solid #e2e8f0; }
        .db-input { width:100%;box-sizing:border-box;padding:7px 10px;background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;font-size:12.5px;color:#1e293b;transition:border-color .15s; }
        .db-input:focus { outline:none;border-color:#C4714A;box-shadow:0 0 0 3px rgba(196,113,74,.12); }
        .db-label { display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:4px; }
        .db-btn-primary { display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:7px 14px;border-radius:8px;font-size:12.5px;font-weight:600;background:#C4714A;color:#fff;border:none;cursor:pointer;transition:background .15s; }
        .db-btn-primary:hover { background:#b36040; }
        .db-btn-secondary { display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:7px 14px;border-radius:8px;font-size:12.5px;font-weight:600;background:#fff;color:#374151;border:1.5px solid #e2e8f0;cursor:pointer;transition:background .15s; }
        .db-btn-secondary:hover { background:#f8fafc; }
        .db-btn-danger { display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:7px 14px;border-radius:8px;font-size:12.5px;font-weight:600;background:#dc2626;color:#fff;border:none;cursor:pointer;transition:background .15s; }
        .db-btn-danger:hover { background:#b91c1c; }
        .db-btn-success { display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:7px 14px;border-radius:8px;font-size:12.5px;font-weight:600;background:#059669;color:#fff;border:none;cursor:pointer;transition:background .15s; }
        .db-btn-success:hover { background:#047857; }
        .pill-act { display:inline-flex;align-items:center;padding:2px 8px;font-size:10.5px;font-weight:600;border-radius:9999px;cursor:pointer;border:none;transition:background .12s; }
        .pill-done { background:#ecfdf5;color:#065f46; } .pill-done:hover { background:#d1fae5; }
        .pill-revise { background:#fef2f2;color:#991b1b; } .pill-revise:hover { background:#fee2e2; }
        .pill-grant { background:#ecfdf5;color:#065f46; } .pill-grant:hover { background:#d1fae5; }
        .pill-deny  { background:#f1f5f9;color:#475569; } .pill-deny:hover  { background:#e2e8f0; }
        .pill-pending-wait { background:#fffbeb;color:#b45309;display:inline-flex;align-items:center;padding:2px 8px;font-size:10.5px;font-weight:600;border-radius:9999px; }
      </style>

      <div id="db-wrap">
        <!-- Top bar -->
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            ${admin ? `
            <select id="db-user-filter" style="padding:6px 10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:12.5px;background:#fff;color:#374151;">
              <option value="All">All Employees</option>
              ${allDoers.map(d => `<option value="${d}">${d}</option>`).join('')}
            </select>
            <button id="db-btn-holidays" style="display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border-radius:8px;font-size:12.5px;font-weight:600;background:#f59e0b;color:#fff;border:none;cursor:pointer;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              Holidays
            </button>` : ''}
            <button id="db-btn-checklist" style="display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border-radius:8px;font-size:12.5px;font-weight:600;background:#059669;color:#fff;border:none;cursor:pointer;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              Checklist
            </button>
            <button id="db-btn-delegate" style="display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border-radius:8px;font-size:12.5px;font-weight:700;background:#C4714A;color:#fff;border:none;cursor:pointer;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              Delegate
            </button>
          </div>
        </div>

        <!-- Stat cards -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;margin-bottom:20px;">
          <div class="card" style="padding:20px;">
            <div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:4px;">Total</div>
            <div style="font-size:2.5rem;font-weight:800;color:#C4714A;">${admin ? data.total : data.pendingTasks.length}</div>
          </div>
          <div class="card" style="padding:20px;">
            <div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:4px;">Completed</div>
            <div style="font-size:2.5rem;font-weight:800;color:#059669;">${data.completed}</div>
          </div>
          <div class="card" style="padding:20px;">
            <div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:4px;">Pending</div>
            <div style="font-size:2.5rem;font-weight:800;color:#dc2626;">${data.pendingTasks.length}</div>
            ${data.revised > 0 ? `<div style="font-size:11px;font-weight:600;color:#d97706;margin-top:4px;">${data.revised} revised</div>` : ''}
          </div>
        </div>

        <!-- Tasks + Pie -->
        <div style="display:grid;grid-template-columns:1fr 280px;gap:1rem;margin-bottom:20px;">

          <!-- Tasks card -->
          <div class="card" style="overflow:hidden;">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;padding:12px 20px;border-bottom:1px solid #f1f5f9;">
              <div>
                <h2 style="font-size:13.5px;font-weight:700;color:#0f172a;margin:0;">All Pending Tasks</h2>
                <p id="db-tasks-count" style="font-size:11.5px;color:#64748b;margin:2px 0 0;"></p>
              </div>
              <div style="display:flex;align-items:center;gap:4px;background:#f1f5f9;border-radius:8px;padding:3px;">
                ${['All','Delegation','Checklist','FMS'].map(t =>
                  `<button class="db-tab-btn" data-tab="${t}" style="padding:5px 11px;border-radius:6px;font-size:11.5px;font-weight:600;border:none;cursor:pointer;transition:all .12s;">${t}</button>`
                ).join('')}
              </div>
            </div>
            <div style="overflow-x:auto;max-height:420px;overflow-y:auto;">
              <table id="db-tasks-table" style="width:100%;border-collapse:collapse;font-size:12.5px;"></table>
            </div>
          </div>

          <!-- Pie chart card -->
          <div class="card" style="padding:1rem;display:flex;flex-direction:column;">
            <div>
              <h3 style="font-size:13px;font-weight:700;color:#0f172a;margin:0;">Task Overview</h3>
              <p style="font-size:11.5px;color:#64748b;margin:3px 0 0;">Overall distribution</p>
            </div>
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding-top:12px;">
              ${renderPieSVG(data.completed, data.pendingTasks.length, data.revised)}
            </div>
          </div>
        </div>

        <!-- Performance — admin only -->
        ${admin && perf ? `
        <div class="card" style="padding:1.25rem;margin-bottom:20px;">
          <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;margin-bottom:1rem;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:1.1rem;">📋</span>
              <div>
                <h2 style="font-size:13.5px;font-weight:700;color:#0f172a;margin:0;">Performance &amp; Activity</h2>
                <p style="font-size:11.5px;color:#64748b;margin:2px 0 0;">Team leaderboard</p>
              </div>
            </div>
            <span style="background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;display:inline-flex;align-items:center;padding:2px 10px;font-size:10.5px;font-weight:600;border-radius:9999px;">Last 30 days</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;">
            ${barListHTML('🏆 Top 5 Performers',   perf.top5,       'completed', 'emerald', '★')}
            ${barListHTML('📉 Bottom 5 Performers', perf.bottom5,    'pending',   'red',     '!')}
            ${barListHTML('⚡ Top 5 Most Active',   perf.mostActive, 'total',     'blue',    '⚡')}
          </div>
        </div>` : ''}
      </div>

      <!-- ── Add Delegate Modal ── -->
      <div id="modal-delegate" class="db-modal-overlay">
        <div class="db-modal-box" onclick="event.stopPropagation()">
          <div class="db-modal-head">
            <div style="width:36px;height:36px;border-radius:10px;background:#fff7ed;display:flex;align-items:center;justify-content:center;color:#C4714A;flex-shrink:0;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            </div>
            <div style="flex:1;">
              <h2 style="font-size:14px;font-weight:700;margin:0;">Delegate Task</h2>
              <p style="font-size:11.5px;color:#64748b;margin:2px 0 0;">Assign a task to a team member</p>
            </div>
            <button id="modal-delegate-close" style="background:none;border:none;cursor:pointer;color:#64748b;padding:4px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="db-modal-body">
            <div>
              <label class="db-label">Description <span style="color:#ef4444">*</span></label>
              <textarea id="del-desc" rows="2" class="db-input" style="resize:vertical;" placeholder="What needs to be done?"></textarea>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div>
                <label class="db-label">Doer <span style="color:#ef4444">*</span></label>
                <select id="del-doer" class="db-input">
                  <option value="">Select person…</option>
                  ${(users || []).map(u => `<option value="${u.id}" data-name="${u.name}">${u.name}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="db-label">Due Date <span style="color:#ef4444">*</span></label>
                <input type="date" id="del-due" class="db-input" min="${todayISO()}" />
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div>
                <label class="db-label">Priority</label>
                <select id="del-priority" class="db-input">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div>
                <label class="db-label">Client</label>
                <input type="text" id="del-client" class="db-input" placeholder="Client name (optional)" />
              </div>
            </div>
            <div>
              <label class="db-label">URL (optional)</label>
              <input type="url" id="del-url" class="db-input" placeholder="https://..." />
            </div>
            <div>
              <label class="db-label">Remarks (optional)</label>
              <input type="text" id="del-remarks" class="db-input" placeholder="Additional notes…" />
            </div>
            <p id="del-error" style="color:#dc2626;font-size:12px;display:none;margin:0;"></p>
          </div>
          <div class="db-modal-foot">
            <button id="modal-delegate-cancel" class="db-btn-secondary">Cancel</button>
            <button id="modal-delegate-submit" class="db-btn-primary">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              Add Task
            </button>
          </div>
        </div>
      </div>

      <!-- ── Add Checklist Master Modal ── -->
      <div id="modal-checklist" class="db-modal-overlay">
        <div class="db-modal-box" onclick="event.stopPropagation()">
          <div class="db-modal-head">
            <div style="width:36px;height:36px;border-radius:10px;background:#ecfdf5;display:flex;align-items:center;justify-content:center;color:#059669;flex-shrink:0;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            </div>
            <div style="flex:1;">
              <h2 style="font-size:14px;font-weight:700;margin:0;">Add Checklist Task</h2>
              <p style="font-size:11.5px;color:#64748b;margin:2px 0 0;">Create a recurring checklist master</p>
            </div>
            <button id="modal-checklist-close" style="background:none;border:none;cursor:pointer;color:#64748b;padding:4px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="db-modal-body">
            <div>
              <label class="db-label">Task <span style="color:#ef4444">*</span></label>
              <input type="text" id="chk-task" class="db-input" placeholder="Describe the recurring task…" />
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div>
                <label class="db-label">Assigned To</label>
                <input type="text" id="chk-assigned" class="db-input" placeholder="Person or team" />
              </div>
              <div>
                <label class="db-label">Frequency</label>
                <select id="chk-frequency" class="db-input">
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
            </div>
            <p id="chk-error" style="color:#dc2626;font-size:12px;display:none;margin:0;"></p>
          </div>
          <div class="db-modal-foot">
            <button id="modal-checklist-cancel" class="db-btn-secondary">Cancel</button>
            <button id="modal-checklist-submit" style="display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:7px 14px;border-radius:8px;font-size:12.5px;font-weight:600;background:#059669;color:#fff;border:none;cursor:pointer;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              Add Checklist
            </button>
          </div>
        </div>
      </div>

      <!-- ── Holidays Modal ── -->
      <div id="modal-holidays" class="db-modal-overlay">
        <div class="db-modal-box" style="max-width:520px;" onclick="event.stopPropagation()">
          <div class="db-modal-head">
            <div style="width:36px;height:36px;border-radius:10px;background:#fffbeb;display:flex;align-items:center;justify-content:center;color:#d97706;flex-shrink:0;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            </div>
            <div style="flex:1;">
              <h2 style="font-size:14px;font-weight:700;margin:0;">Holidays</h2>
              <p style="font-size:11.5px;color:#64748b;margin:2px 0 0;">Manage company holidays</p>
            </div>
            <button id="modal-holidays-close" style="background:none;border:none;cursor:pointer;color:#64748b;padding:4px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="db-modal-body" style="max-height:60vh;overflow-y:auto;">
            <!-- Add holiday form -->
            <div style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end;">
              <div>
                <label class="db-label">Date <span style="color:#ef4444">*</span></label>
                <input type="date" id="hol-date" class="db-input" />
              </div>
              <div>
                <label class="db-label">Name <span style="color:#ef4444">*</span></label>
                <input type="text" id="hol-name" class="db-input" placeholder="e.g. Holi" />
              </div>
              <button id="hol-add-btn" style="display:inline-flex;align-items:center;gap:5px;padding:7px 12px;border-radius:8px;font-size:12px;font-weight:600;background:#f59e0b;color:#fff;border:none;cursor:pointer;white-space:nowrap;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                Add
              </button>
            </div>
            <p id="hol-error" style="color:#dc2626;font-size:12px;display:none;margin:0;"></p>
            <div id="hol-list"></div>
          </div>
          <div class="db-modal-foot">
            <button id="modal-holidays-done" class="db-btn-primary">Done</button>
          </div>
        </div>
      </div>

      <!-- ── Revise Modal ── -->
      <div id="modal-revise" class="db-modal-overlay">
        <div class="db-modal-box" onclick="event.stopPropagation()">
          <div class="db-modal-head">
            <div id="revise-modal-icon" style="width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v6h6"/><path d="M3 8a9 9 0 1 0 2.6-5.6L3 8"/></svg>
            </div>
            <div style="flex:1;">
              <h2 id="revise-modal-title" style="font-size:14px;font-weight:700;margin:0;"></h2>
              <p id="revise-modal-desc"  style="font-size:11.5px;color:#64748b;margin:2px 0 0;"></p>
            </div>
            <button id="modal-revise-close" style="background:none;border:none;cursor:pointer;color:#64748b;padding:4px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="db-modal-body">
            <div id="revise-task-info" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;font-size:12.5px;"></div>
            <div id="revise-date-wrap">
              <label class="db-label">Revise until <span style="color:#ef4444">*</span></label>
              <input type="date" id="revise-date-input" class="db-input" />
            </div>
            <div id="revise-note-wrap">
              <label class="db-label" id="revise-note-label">Revise note</label>
              <textarea id="revise-note-input" rows="3" class="db-input" style="resize:none;" placeholder="What needs to be corrected?"></textarea>
            </div>
          </div>
          <div class="db-modal-foot">
            <button id="modal-revise-cancel" class="db-btn-secondary">Cancel</button>
            <button id="modal-revise-confirm" class="db-btn-danger">Confirm</button>
          </div>
        </div>
      </div>
    `;

    _updateTasksTable(admin);
    _attachEvents(el, admin);
  }

  /* ── pie chart svg ───────────────────────────────────────────────── */
  function renderPieSVG(completed, pending, revised) {
    const size = 200;
    const cx = size / 2, cy = size / 2, r = size / 2 - 6;
    const total = completed + pending + revised;
    const slices = [
      { value: completed, color: '#10b981', label: 'Completed' },
      { value: pending,   color: '#ef4444', label: 'Pending'   },
      { value: revised,   color: '#f59e0b', label: 'Revised'   },
    ].filter(s => s.value > 0);

    let paths = '';
    if (total === 0) {
      paths = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#e2e8f0"/>`;
    } else if (slices.length === 1) {
      paths = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${slices[0].color}" stroke="#fff" stroke-width="2"/>`;
    } else {
      let angle = -Math.PI / 2;
      slices.forEach(s => {
        const slice = (s.value / total) * Math.PI * 2;
        const x1 = cx + r * Math.cos(angle);
        const y1 = cy + r * Math.sin(angle);
        angle += slice;
        const x2 = cx + r * Math.cos(angle);
        const y2 = cy + r * Math.sin(angle);
        const largeArc = slice > Math.PI ? 1 : 0;
        paths += `<path d="M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z" fill="${s.color}" stroke="#fff" stroke-width="2"/>`;
      });
    }

    const legend = [
      { value: completed, color: '#10b981', label: 'Completed' },
      { value: pending,   color: '#ef4444', label: 'Pending'   },
      { value: revised,   color: '#f59e0b', label: 'Revised'   },
    ].map(s => `
      <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#475569;">
        <span style="width:10px;height:10px;border-radius:50%;background:${s.color};flex-shrink:0;"></span>${s.label}
      </div>`).join('');

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${paths}</svg>
      <div style="display:flex;align-items:center;justify-content:center;gap:20px;margin-top:12px;">${legend}</div>`;
  }

  /* ── tasks table update ──────────────────────────────────────────── */
  function _updateTasksTable(admin) {
    const filtered = getFiltered();
    const table = document.getElementById('db-tasks-table');
    const countEl = document.getElementById('db-tasks-count');
    if (!table) return;

    if (countEl) countEl.textContent = `${filtered.length} awaiting action`;

    /* update tab button styles */
    document.querySelectorAll('.db-tab-btn').forEach(btn => {
      const active = btn.dataset.tab === _state.subTab;
      btn.style.background = active ? '#fff' : 'transparent';
      btn.style.color       = active ? '#0f172a' : '#64748b';
      btn.style.boxShadow   = active ? '0 1px 4px rgba(0,0,0,.08)' : 'none';
    });

    if (filtered.length === 0) {
      table.innerHTML = `
        <tbody><tr><td colspan="6" style="padding:3rem;text-align:center;">
          <div style="width:44px;height:44px;border-radius:14px;background:#ecfdf5;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
          </div>
          <div style="font-size:13px;font-weight:600;color:#334155;">All caught up!</div>
          <div style="font-size:12px;color:#94a3b8;margin-top:3px;">No pending tasks.</div>
        </td></tr></tbody>`;
      return;
    }

    const thStyle = 'text-align:left;padding:10px 12px;font-size:10px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:#64748b;background:rgba(248,250,252,.97);position:sticky;top:0;';
    const tdStyle = 'padding:10px 12px;font-size:12.5px;color:#475569;border-top:1px solid #f1f5f9;';

    const rows = filtered.map(t => {
      const dateStyle = t.overdue ? 'color:#dc2626;font-weight:700;' : 'color:#475569;';
      const urlLink = t.url ? `<a href="${t.url}" target="_blank" rel="noopener noreferrer" title="${t.url}" style="color:#C4714A;flex-shrink:0;display:inline-flex;margin-left:4px;">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>` : '';
      const transferred = t.transferredFrom ? `<span style="display:inline-flex;align-items:center;gap:4px;font-size:10px;padding:2px 6px;border-radius:5px;background:#fffbeb;color:#b45309;border:1px solid #fde68a;font-weight:600;" title="${t.transferredBy ? 'Transferred by ' + t.transferredBy : ''}">🔄 from ${t.transferredFrom}</span>` : '';

      let actionHTML;
      if (t.type === 'Delegation' && t.status === 'revise_requested') {
        if (admin) {
          actionHTML = `
            <button class="pill-act pill-grant" data-action="grant" data-id="${t.id}">Grant</button>
            <button class="pill-act pill-deny"  data-action="deny"  data-id="${t.id}">Deny</button>`;
        } else {
          actionHTML = `<span class="pill-pending-wait">⏳ Pending</span>`;
        }
      } else {
        actionHTML = `<button class="pill-act pill-done" data-action="done" data-id="${t.id}">Done</button>`;
        if (t.type === 'Delegation') {
          actionHTML += ` <button class="pill-act pill-revise" data-action="revise" data-id="${t.id}">Revise</button>`;
        }
      }

      return `<tr style="transition:background .1s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
        <td style="${tdStyle}">${typePillHTML(t.type)}</td>
        <td style="${tdStyle}max-width:260px;">
          <div style="display:flex;align-items:flex-start;gap:4px;">
            <span style="font-weight:600;color:#0f172a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block;" title="${t.description}">${t.description}</span>
            ${urlLink}
          </div>
          ${transferred}
        </td>
        <td style="${tdStyle}">
          <div style="display:flex;align-items:center;gap:6px;">
            ${avatarHTML(t.doer)}
            <span style="color:#334155;">${t.doer || '—'}</span>
          </div>
        </td>
        <td style="${tdStyle}">${priorityHTML(t.type, t.priority)}</td>
        <td style="${tdStyle}white-space:nowrap;font-size:12px;${dateStyle}">${fmt(t.date)}</td>
        <td style="${tdStyle}">
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${actionHTML}
          </div>
        </td>
      </tr>`;
    }).join('');

    table.innerHTML = `
      <thead>
        <tr>
          <th style="${thStyle}">Type</th>
          <th style="${thStyle}">Description</th>
          <th style="${thStyle}">Doer</th>
          <th style="${thStyle}">Priority</th>
          <th style="${thStyle}">Date</th>
          <th style="${thStyle}">Action</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>`;

    /* attach action button events */
    table.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const task = _state.data.pendingTasks.find(t => t.id === id);
        if (!task) return;
        const action = btn.dataset.action;
        if (action === 'done')   markDone(task, admin);
        if (action === 'revise') openReviseModal(task, 'request', admin);
        if (action === 'grant')  openReviseModal(task, 'grant',   admin);
        if (action === 'deny')   denyRevise(task, admin);
      });
    });
  }

  /* ── holidays list render ────────────────────────────────────────── */
  function _renderHolidayList() {
    const listEl = document.getElementById('hol-list');
    if (!listEl) return;
    const holidays = _state.holidays || [];
    if (holidays.length === 0) {
      listEl.innerHTML = '<div style="color:#94a3b8;font-size:12px;text-align:center;padding:1rem;">No holidays added yet.</div>';
      return;
    }
    listEl.innerHTML = `
      <table style="width:100%;border-collapse:collapse;font-size:12.5px;margin-top:4px;">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;">Date</th>
            <th style="text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;">Name</th>
            <th style="padding:8px 10px;border-bottom:1px solid #e2e8f0;"></th>
          </tr>
        </thead>
        <tbody>
          ${holidays.map(h => `
            <tr>
              <td style="padding:8px 10px;border-top:1px solid #f1f5f9;color:#475569;">${fmt(h.date)}</td>
              <td style="padding:8px 10px;border-top:1px solid #f1f5f9;font-weight:600;color:#0f172a;">${h.name}</td>
              <td style="padding:8px 10px;border-top:1px solid #f1f5f9;text-align:right;">
                <button data-hol-del="${h.id}" style="background:none;border:none;cursor:pointer;color:#94a3b8;padding:2px 4px;" title="Delete">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6 18 20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>`;

    listEl.querySelectorAll('[data-hol-del]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.holDel;
        if (!confirm('Delete this holiday?')) return;
        await Utils.apiFetch(`/api/holidays?id=${id}`, { method: 'DELETE' });
        _state.holidays = _state.holidays.filter(h => h.id !== id);
        _renderHolidayList();
      });
    });
  }

  /* ── revise modal open ───────────────────────────────────────────── */
  function openReviseModal(task, mode, admin) {
    _state.reviseTask = { ...task, _mode: mode };
    _state.reviseNote = '';
    _state.reviseDate = '';

    const copy = {
      request: { title: 'Request Revision',    desc: 'This will be sent to admin for approval.',         btnClass: 'db-btn-danger',   btnText: 'Send Request'   },
      revise:  { title: 'Confirm Revise',       desc: 'Send this task back to the doer for revision?',    btnClass: 'db-btn-danger',   btnText: 'Confirm Revise' },
      grant:   { title: 'Grant Revise Request', desc: 'Approve this revision request and send task back?', btnClass: 'db-btn-success', btnText: 'Grant Revise'   },
    }[mode];

    const iconEl = document.getElementById('revise-modal-icon');
    if (iconEl) {
      iconEl.style.background = mode === 'grant' ? '#ecfdf5' : '#fef2f2';
      iconEl.style.color      = mode === 'grant' ? '#059669' : '#dc2626';
    }
    document.getElementById('revise-modal-title').textContent = copy.title;
    document.getElementById('revise-modal-desc').textContent  = copy.desc;

    const infoEl = document.getElementById('revise-task-info');
    if (infoEl) {
      let extra = '';
      if (mode === 'grant' && task.date)    extra += `<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#475569;padding-top:8px;border-top:1px solid #e2e8f0;"><span style="color:#94a3b8;">Revise Until:</span><b style="color:#C4714A;">${fmt(task.date)}</b></div>`;
      if (mode === 'grant' && task.remarks) extra += `<div style="font-size:12px;color:#475569;padding-top:6px;"><span style="color:#94a3b8;">Note:</span> <b>${task.remarks}</b></div>`;
      infoEl.innerHTML = `
        <div style="font-weight:700;color:#0f172a;margin-bottom:4px;">${task.description}</div>
        <div style="font-size:12px;color:#64748b;">Doer: <b style="color:#334155;">${task.doer}</b></div>
        ${extra}`;
    }

    const dateWrap = document.getElementById('revise-date-wrap');
    const noteWrap = document.getElementById('revise-note-wrap');
    const noteLabel = document.getElementById('revise-note-label');
    const dateInput = document.getElementById('revise-date-input');
    const noteInput = document.getElementById('revise-note-input');
    const confirmBtn = document.getElementById('modal-revise-confirm');

    if (dateWrap) dateWrap.style.display = (mode === 'request' || mode === 'revise') ? '' : 'none';
    if (noteWrap) noteWrap.style.display = mode !== 'grant' ? '' : 'none';
    if (noteLabel) {
      noteLabel.innerHTML = mode === 'request'
        ? 'Revise note <span style="color:#ef4444">*</span>'
        : 'Revise note <span style="color:#94a3b8;font-weight:400">(optional)</span>';
    }
    if (dateInput) { dateInput.min = todayISO(); dateInput.value = ''; }
    if (noteInput) { noteInput.value = ''; noteInput.placeholder = mode === 'request' ? 'Explain what needs to be revised (required)' : 'What needs to be corrected?'; }

    /* swap confirm button class */
    if (confirmBtn) {
      confirmBtn.className = copy.btnClass;
      confirmBtn.textContent = copy.btnText;
    }

    showModal('modal-revise');
  }

  /* ── event attachments ───────────────────────────────────────────── */
  function _attachEvents(el, admin) {

    /* ── tab buttons ── */
    el.querySelectorAll('.db-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        _state.subTab = btn.dataset.tab;
        _updateTasksTable(admin);
      });
    });

    /* ── user filter ── */
    const userFilter = el.querySelector('#db-user-filter');
    if (userFilter) {
      userFilter.addEventListener('change', () => {
        _state.userFilter = userFilter.value;
        _updateTasksTable(admin);
      });
    }

    /* ── delegate modal ── */
    const btnDelegate = el.querySelector('#db-btn-delegate');
    if (btnDelegate) btnDelegate.addEventListener('click', () => showModal('modal-delegate'));
    el.querySelector('#modal-delegate-close')?.addEventListener('click', () => hideModal('modal-delegate'));
    el.querySelector('#modal-delegate-cancel')?.addEventListener('click', () => hideModal('modal-delegate'));
    el.querySelector('#modal-delegate')?.addEventListener('click', () => hideModal('modal-delegate'));
    el.querySelector('#modal-delegate-submit')?.addEventListener('click', async () => {
      const desc     = el.querySelector('#del-desc')?.value.trim();
      const doerSel  = el.querySelector('#del-doer');
      const doerId   = doerSel?.value;
      const doerName = doerSel?.selectedOptions[0]?.dataset.name || '';
      const dueDate  = el.querySelector('#del-due')?.value;
      const priority = el.querySelector('#del-priority')?.value || 'Low';
      const client   = el.querySelector('#del-client')?.value.trim();
      const url      = el.querySelector('#del-url')?.value.trim();
      const remarks  = el.querySelector('#del-remarks')?.value.trim();
      const errEl    = el.querySelector('#del-error');

      if (!desc)    { if (errEl) { errEl.textContent = 'Description is required.'; errEl.style.display = 'block'; } return; }
      if (!doerId)  { if (errEl) { errEl.textContent = 'Please select a doer.';     errEl.style.display = 'block'; } return; }
      if (!dueDate) { if (errEl) { errEl.textContent = 'Due date is required.';     errEl.style.display = 'block'; } return; }
      if (errEl) errEl.style.display = 'none';

      const submitBtn = el.querySelector('#modal-delegate-submit');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Adding…'; }

      try {
        await Utils.apiFetch('/api/delegations', {
          method: 'POST',
          body: JSON.stringify({
            description: desc,
            doerId,
            doerName,
            delegatedBy: window.currentUser?.id,
            dueDate,
            priority,
            client: client || '',
            url:    url || '',
            remarks: remarks || '',
          }),
        });
        hideModal('modal-delegate');
        Utils.showToast('Task delegated successfully!');
        await _refresh(admin);
      } catch (err) {
        if (errEl) { errEl.textContent = err.message || 'Failed to add task.'; errEl.style.display = 'block'; }
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg> Add Task'; }
      }
    });

    /* ── checklist modal ── */
    const btnChecklist = el.querySelector('#db-btn-checklist');
    if (btnChecklist) btnChecklist.addEventListener('click', () => showModal('modal-checklist'));
    el.querySelector('#modal-checklist-close')?.addEventListener('click', () => hideModal('modal-checklist'));
    el.querySelector('#modal-checklist-cancel')?.addEventListener('click', () => hideModal('modal-checklist'));
    el.querySelector('#modal-checklist')?.addEventListener('click', () => hideModal('modal-checklist'));
    el.querySelector('#modal-checklist-submit')?.addEventListener('click', async () => {
      const task      = el.querySelector('#chk-task')?.value.trim();
      const assigned  = el.querySelector('#chk-assigned')?.value.trim();
      const frequency = el.querySelector('#chk-frequency')?.value || 'Daily';
      const errEl     = el.querySelector('#chk-error');

      if (!task) { if (errEl) { errEl.textContent = 'Task is required.'; errEl.style.display = 'block'; } return; }
      if (errEl) errEl.style.display = 'none';

      const submitBtn = el.querySelector('#modal-checklist-submit');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Adding…'; }

      try {
        await Utils.apiFetch('/api/masters', {
          method: 'POST',
          body: JSON.stringify({ task, assignedTo: assigned || '', frequency }),
        });
        hideModal('modal-checklist');
        Utils.showToast('Checklist task added!');
        await _refresh(admin);
      } catch (err) {
        if (errEl) { errEl.textContent = err.message || 'Failed to add checklist.'; errEl.style.display = 'block'; }
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg> Add Checklist'; }
      }
    });

    /* ── holidays modal ── */
    const btnHolidays = el.querySelector('#db-btn-holidays');
    if (btnHolidays) {
      btnHolidays.addEventListener('click', () => {
        _renderHolidayList();
        showModal('modal-holidays');
      });
    }
    el.querySelector('#modal-holidays-close')?.addEventListener('click', () => hideModal('modal-holidays'));
    el.querySelector('#modal-holidays-done')?.addEventListener('click',  () => hideModal('modal-holidays'));
    el.querySelector('#modal-holidays')?.addEventListener('click',       () => hideModal('modal-holidays'));
    el.querySelector('#hol-add-btn')?.addEventListener('click', async () => {
      const date   = el.querySelector('#hol-date')?.value;
      const name   = el.querySelector('#hol-name')?.value.trim();
      const errEl  = el.querySelector('#hol-error');

      if (!date || !name) { if (errEl) { errEl.textContent = 'Date and name are required.'; errEl.style.display = 'block'; } return; }
      if (errEl) errEl.style.display = 'none';

      const addBtn = el.querySelector('#hol-add-btn');
      if (addBtn) { addBtn.disabled = true; addBtn.textContent = '…'; }

      try {
        const result = await Utils.apiFetch('/api/holidays', {
          method: 'POST',
          body: JSON.stringify({ date, name }),
        });
        if (result?.id) _state.holidays.push({ id: result.id, date, name, type: 'Holiday' });
        if (el.querySelector('#hol-date'))  el.querySelector('#hol-date').value  = '';
        if (el.querySelector('#hol-name'))  el.querySelector('#hol-name').value  = '';
        _renderHolidayList();
      } catch (err) {
        if (errEl) { errEl.textContent = err.message || 'Failed to add holiday.'; errEl.style.display = 'block'; }
      } finally {
        if (addBtn) {
          addBtn.disabled = false;
          addBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg> Add';
        }
      }
    });

    /* ── revise modal close ── */
    el.querySelector('#modal-revise-close')?.addEventListener('click',  () => hideModal('modal-revise'));
    el.querySelector('#modal-revise-cancel')?.addEventListener('click', () => hideModal('modal-revise'));
    el.querySelector('#modal-revise')?.addEventListener('click',        () => hideModal('modal-revise'));

    el.querySelector('#modal-revise-confirm')?.addEventListener('click', async () => {
      const task = _state.reviseTask;
      if (!task) { hideModal('modal-revise'); return; }
      const mode     = task._mode || 'revise';
      const dateVal  = document.getElementById('revise-date-input')?.value;
      const noteVal  = document.getElementById('revise-note-input')?.value.trim();

      if (mode !== 'grant' && !dateVal) { alert('Please pick a "revise until" date.'); return; }
      if (mode === 'request' && !noteVal) { alert('Revise note is required — please explain what needs to be revised.'); return; }

      const confirmBtn = document.getElementById('modal-revise-confirm');
      if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.textContent = 'Saving…'; }

      try {
        await Utils.apiFetch('/api/delegations', {
          method: 'PATCH',
          body: JSON.stringify({
            id: task.id,
            status: 'revise',
            _grantRevise: mode === 'grant',
            remarks: noteVal || undefined,
            ...(mode !== 'grant' && dateVal ? { dueDate: dateVal } : {}),
          }),
        });
        hideModal('modal-revise');
        _state.reviseTask = null;
        Utils.showToast(mode === 'grant' ? 'Revise granted.' : 'Revise request sent.');
        await _refresh(admin);
      } catch (err) {
        alert(err.message || 'Failed to update task.');
      } finally {
        if (confirmBtn) { confirmBtn.disabled = false; }
      }
    });
  }

  /* ── actions ─────────────────────────────────────────────────────── */
  async function markDone(task, admin) {
    try {
      if (task.type === 'Delegation') {
        await Utils.apiFetch('/api/delegations', {
          method: 'PATCH',
          body: JSON.stringify({ id: task.id, status: 'done' }),
        });
      } else if (task.type === 'Checklist') {
        await Utils.apiFetch('/api/checklist-completions', {
          method: 'POST',
          body: JSON.stringify({ masterId: task.id, doer: window.currentUser?.name }),
        });
      } else if (task.type === 'FMS') {
        const parts = task.id.split('-');
        const stepIndex = parseInt(parts.pop());
        const fmsId = parts.join('-');
        await Utils.apiFetch('/api/fms/step', {
          method: 'POST',
          body: JSON.stringify({ fmsId, stepIndex }),
        });
      }
      Utils.showToast('Task marked as done!');
      await _refresh(admin);
    } catch (err) {
      Utils.showToast(err.message || 'Failed to mark done.', 'error');
    }
  }

  async function denyRevise(task, admin) {
    if (!confirm('Deny this revise request?')) return;
    try {
      await Utils.apiFetch('/api/delegations', {
        method: 'PATCH',
        body: JSON.stringify({ id: task.id, status: 'pending', _denyRevise: true }),
      });
      Utils.showToast('Revise request denied.');
      await _refresh(admin);
    } catch (err) {
      Utils.showToast(err.message || 'Failed.', 'error');
    }
  }

  /* ── refresh (re-fetch data, update table) ───────────────────────── */
  async function _refresh(admin) {
    const [dashData, delegationsData] = await Promise.all([
      Utils.apiFetch('/api/dashboard'),
      admin ? Utils.apiFetch('/api/delegations') : Promise.resolve(_state.delegations),
    ]);
    if (!dashData) return;
    _state.data = dashData;
    _state.delegations = delegationsData || _state.delegations;

    /* update stat cards */
    const wrap = document.getElementById('db-wrap');
    if (!wrap) return;

    const cards = wrap.querySelectorAll('.card');
    /* find the stat cards by their label text */
    cards.forEach(card => {
      const label = card.querySelector('div')?.textContent?.trim().toLowerCase();
      const valEl = card.querySelectorAll('div')[1];
      if (!valEl) return;
      if (label === 'total')     valEl.textContent = admin ? dashData.total : dashData.pendingTasks.length;
      if (label === 'completed') valEl.textContent = dashData.completed;
      if (label === 'pending')   valEl.textContent = dashData.pendingTasks.length;
    });

    _updateTasksTable(admin);
  }

  return { render };
})();
