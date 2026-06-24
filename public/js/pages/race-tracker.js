window.Pages['race-tracker'] = {
  _state: {
    from: '',
    to: '',
    delegations: [],
    users: [],
    rows: [],
    loading: false,
  },

  async render() {
    const el = document.getElementById('main-content');
    if (!el) return;

    const s = this._state;

    // Default date range: last 2 days → today
    if (!s.from) s.from = this._daysAgo(2);
    if (!s.to)   s.to   = this._todayISO();

    el.innerHTML = this._skeleton();
    this._attachControls(el);

    // Load reference data once
    if (!s.delegations.length && !s.loading) {
      s.loading = true;
      await this._loadData();
      s.loading = false;
    }

    // Auto-run on first render
    this._runRace();
  },

  // ── helpers ─────────────────────────────────────────────────────────────────

  _todayISO() {
    return new Date().toISOString().split('T')[0];
  },

  _daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  },

  _initials(name) {
    return (name || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase() || '?';
  },

  // ── data fetching ────────────────────────────────────────────────────────────

  async _loadData() {
    try {
      const [delRes, usrRes] = await Promise.all([
        fetch('/api/delegations'),
        fetch('/api/users'),
      ]);
      if (delRes.ok) {
        const data = await delRes.json();
        this._state.delegations = Array.isArray(data) ? data
          : Array.isArray(data.delegations) ? data.delegations : [];
      }
      if (usrRes.ok) {
        const data = await usrRes.json();
        this._state.users = Array.isArray(data) ? data
          : Array.isArray(data.users) ? data.users : [];
      }
    } catch (e) {
      console.error('[race-tracker] data load error', e);
    }
  },

  // ── compute leaderboard ──────────────────────────────────────────────────────

  _compute(from, to, delegations, users) {
    const fromD = new Date(from); fromD.setHours(0, 0, 0, 0);
    const toD   = new Date(to);   toD.setHours(23, 59, 59, 999);

    const m = {};
    for (const d of delegations) {
      const created = new Date(d.createdAt || d.dueDate || 0);
      if (created < fromD || created > toD) continue;
      const key = d.doer || 'Unknown';
      if (!m[key]) m[key] = { doer: key, doerId: d.doerId, total: 0, done: 0, pending: 0, revised: 0 };
      m[key].total += 1;
      if (d.status === 'done')        { m[key].done += 1; }
      else if (d.status === 'revise') { m[key].pending += 1; m[key].revised += 1; }
      else                            { m[key].pending += 1; }
    }

    const userMap = Object.fromEntries(users.map((u) => [u.name, u]));

    const list = Object.values(m).map((r) => {
      const score    = r.done - r.pending - r.revised;
      const finished = r.pending === 0 && r.revised === 0 && r.total > 0;
      const trackPos = Math.max(-100, Math.min(0, score));
      const pct      = ((trackPos + 100) / 100) * 100;
      const behind   = finished ? 0 : Math.max(0, -score);
      return {
        ...r, score, finished, pct,
        behindLabel: finished ? 'Finished' : `${behind.toFixed(1)} behind`,
        pctLabel:    finished ? '0.0%' : `${(100 - pct).toFixed(1)}%`,
        department: userMap[r.doer]?.department || '',
      };
    });

    list.sort((a, b) => (b.score - a.score) || (b.done - a.done));
    return list;
  },

  // ── run / refresh ────────────────────────────────────────────────────────────

  _runRace() {
    const s = this._state;
    s.rows = this._compute(s.from, s.to, s.delegations, s.users);
    this._renderBoard();
  },

  // ── initial HTML skeleton ────────────────────────────────────────────────────

  _skeleton() {
    const s = this._state;
    return `
      <div id="rt-root" class="space-y-4">
        <div class="card p-5">
          <div class="flex items-end gap-3 flex-wrap">
            <div>
              <label class="label">Start Date</label>
              <input type="date" id="rt-from" class="input" value="${s.from}" />
            </div>
            <div>
              <label class="label">End Date</label>
              <input type="date" id="rt-to" class="input" value="${s.to}" />
            </div>
            <button id="rt-start" class="btn-primary">Start Race</button>
          </div>
        </div>
        <div id="rt-board"></div>
      </div>
    `;
  },

  _attachControls(el) {
    // Use event delegation on the root so re-renders don't break listeners
    el.addEventListener('click', (e) => {
      if (e.target.id === 'rt-start') {
        const fromEl = document.getElementById('rt-from');
        const toEl   = document.getElementById('rt-to');
        if (fromEl) this._state.from = fromEl.value;
        if (toEl)   this._state.to   = toEl.value;
        this._runRace();
      }
    });
    el.addEventListener('change', (e) => {
      if (e.target.id === 'rt-from') this._state.from = e.target.value;
      if (e.target.id === 'rt-to')   this._state.to   = e.target.value;
    });
  },

  // ── render leaderboard ───────────────────────────────────────────────────────

  _renderBoard() {
    const board = document.getElementById('rt-board');
    if (!board) return;

    const rows = this._state.rows;

    if (rows.length === 0) {
      board.innerHTML = `
        <div class="card p-8 text-center" style="font-size:13px;color:#94a3b8;">
          No data in selected date range.
        </div>`;
      return;
    }

    const MEDAL_BG = [
      'background:#fbbf24;color:#fff',
      'background:#cbd5e1;color:#334155',
      'background:#fb923c;color:#fff',
    ];

    const laneRows = rows.map((r, i) => {
      const medalStyle = i < 3 ? MEDAL_BG[i] : 'background:#f1f5f9;color:#475569';

      const pills = [
        `<span class="pill" style="background:#eff6ff;color:#1d4ed8;">${r.total} total</span>`,
        `<span class="pill" style="background:#f0fdf4;color:#16a34a;">${r.done} done</span>`,
        r.pending > 0 ? `<span class="pill" style="background:#fffbeb;color:#d97706;">${r.pending} pending</span>` : '',
        r.revised > 0 ? `<span class="pill" style="background:#fef2f2;color:#dc2626;">${r.revised} revised</span>` : '',
      ].filter(Boolean).join('');

      // car badge color
      const carBg = i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#fb923c' : '#22c55e';

      const finishedColor = r.finished ? '#16a34a' : '#334155';

      return `
        <div class="rt-lane" style="display:grid;grid-template-columns:auto minmax(160px,220px) 1fr auto;align-items:center;gap:12px;">
          <!-- rank badge -->
          <div style="width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:13px;flex-shrink:0;${medalStyle}">
            ${i + 1}
          </div>

          <!-- name + dept + pills -->
          <div style="min-width:0;">
            <div style="font-weight:600;font-size:13.5px;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${this._esc(r.doer)}</div>
            ${r.department ? `<div style="font-size:11px;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${this._esc(r.department)}</div>` : ''}
            <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px;">${pills}</div>
          </div>

          <!-- track lane -->
          <div style="position:relative;height:40px;background:#d1fae5;border-radius:8px;border:2px solid #6ee7b7;overflow:hidden;">
            <!-- road markings -->
            <div style="position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 22px,rgba(255,255,255,0.6) 22px 28px);pointer-events:none;"></div>
            <!-- finish line glow -->
            <div style="position:absolute;right:0;top:0;bottom:0;width:8px;background:linear-gradient(to right,transparent,#10b981);"></div>
            <!-- car -->
            <div class="rt-car" style="position:absolute;top:50%;transform:translateY(-50%) translateX(-26px);left:${r.pct}%;transition:left 0.7s ease;">
              <div style="display:flex;flex-direction:column;align-items:center;">
                <div style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;margin-bottom:2px;background:${carBg};color:#fff;">${this._initials(r.doer)}</div>
                <span style="font-size:18px;line-height:1;">&#x1F697;</span>
              </div>
            </div>
          </div>

          <!-- score -->
          <div style="text-align:right;min-width:88px;">
            <div style="font-size:15px;font-weight:700;color:${finishedColor};">${this._esc(r.pctLabel)}</div>
            <div style="font-size:10.5px;color:#64748b;">${r.finished ? 'Finished &#x1F3C1;' : this._esc(r.behindLabel)}</div>
          </div>
        </div>
      `;
    }).join('');

    board.innerHTML = `
      <div class="card p-5">
        <!-- track header -->
        <div style="display:flex;align-items:center;justify-content:space-between;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;color:#94a3b8;margin-bottom:16px;padding:0 8px;">
          <span style="color:#ef4444;">&#9654; START &middot; &minus;100</span>
          <span>Score: lower &rarr; behind &middot; higher &rarr; ahead</span>
          <span style="color:#059669;">0 &middot; FINISH &#x1F3C1;</span>
        </div>

        <!-- leaderboard rows -->
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${laneRows}
        </div>
      </div>
    `;
  },

  _esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },
};
