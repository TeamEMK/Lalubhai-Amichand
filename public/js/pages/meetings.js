window.Pages = window.Pages || {};

window.Pages.meetings = (() => {
  // ── Constants ────────────────────────────────────────────────────────────────
  const DOW    = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  // ── State ────────────────────────────────────────────────────────────────────
  let cursor   = new Date();          // any date in the currently-shown month
  let selected = isoDate(new Date()); // selected day (YYYY-MM-DD)
  let meetings = [];                  // meetings for the current month
  let holidays = [];                  // [{date, name}]
  let users    = [];                  // string names for datalist
  let modalOpen = false;
  let saving    = false;
  let form = { title: '', startTime: '', endTime: '', attendees: '', notes: '' };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function isoDate(d) {
    // Returns YYYY-MM-DD in local time (not UTC)
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function fmtDisplay(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}-${m}-${y}`;
  }

  // ── API ──────────────────────────────────────────────────────────────────────
  async function loadMonth() {
    const year  = cursor.getFullYear();
    const month = cursor.getMonth();
    const from  = isoDate(new Date(year, month, 1));
    const to    = isoDate(new Date(year, month + 1, 0));
    try {
      const data = await Utils.apiFetch(`/api/meetings?from=${from}&to=${to}`);
      meetings = Array.isArray(data) ? data : [];
    } catch {
      meetings = [];
    }
    renderCalendar();
    renderDayPanel();
  }

  async function loadHolidays() {
    try {
      const data = await Utils.apiFetch('/api/holidays');
      holidays = Array.isArray(data) ? data : [];
    } catch {
      holidays = [];
    }
  }

  async function loadUsers() {
    try {
      const data = await Utils.apiFetch('/api/users');
      users = Array.isArray(data)
        ? data.map((u) => (typeof u === 'string' ? u : u.name || '')).filter(Boolean)
        : [];
    } catch {
      users = [];
    }
  }

  async function scheduleNew() {
    if (!form.title.trim()) { Utils.showToast('Title is required', 'error'); return; }
    if (saving) return;
    saving = true;
    setSaving(true);
    try {
      await Utils.apiFetch('/api/meetings', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          date: selected,
          createdBy: window.currentUser?.name || window.currentUser?.email || '',
        }),
      });
      form = { title: '', startTime: '', endTime: '', attendees: '', notes: '' };
      closeModal();
      await loadMonth();
      Utils.showToast('Meeting scheduled');
    } catch (err) {
      Utils.showToast(err.message || 'Failed to schedule', 'error');
    } finally {
      saving = false;
      setSaving(false);
    }
  }

  async function removeMeeting(id) {
    if (!Utils.confirm('Delete this meeting?')) return;
    try {
      await Utils.apiFetch(`/api/meetings?id=${id}`, { method: 'DELETE' });
      await loadMonth();
      Utils.showToast('Meeting deleted');
    } catch (err) {
      Utils.showToast(err.message || 'Failed to delete', 'error');
    }
  }

  // ── Derived data ─────────────────────────────────────────────────────────────
  function buildHolidayMap() {
    const m = {};
    for (const h of holidays) m[(h.date || '').split('T')[0]] = h.name;
    return m;
  }

  function buildByDate() {
    const m = {};
    for (const mt of meetings) {
      const k = (mt.date || '').split('T')[0];
      (m[k] = m[k] || []).push(mt);
    }
    return m;
  }

  function buildCells() {
    const year  = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay()); // back to Sunday
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  function render() {
    const el = document.getElementById('main-content');
    if (!el) return;

    el.innerHTML = `
      <div class="space-y-4 animate-fade-in" id="meetings-root">
        <div style="display:grid;grid-template-columns:1fr 300px;gap:1rem;" id="meetings-grid">
          <div class="card p-4" id="meetings-calendar"></div>
          <div class="card p-4" id="meetings-day-panel"></div>
        </div>
      </div>

      <!-- Schedule Modal -->
      <div id="meetings-modal-backdrop" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:50;display:none;align-items:center;justify-content:center;padding:1rem;">
        <div class="card p-5 animate-pop-in" style="width:100%;max-width:28rem;" id="meetings-modal">
          <div style="font-size:15px;font-weight:600;margin-bottom:4px;">Schedule Meeting</div>
          <div id="meetings-modal-date" style="font-size:12px;color:#64748b;margin-bottom:1rem;"></div>
          <div style="display:flex;flex-direction:column;gap:0.75rem;">
            <div>
              <label class="label">Title</label>
              <input class="input" id="mtg-title" placeholder="Meeting title" />
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
              <div>
                <label class="label">Start</label>
                <input type="time" class="input" id="mtg-start" />
              </div>
              <div>
                <label class="label">End</label>
                <input type="time" class="input" id="mtg-end" />
              </div>
            </div>
            <div>
              <label class="label">Attendees</label>
              <input class="input" id="mtg-attendees" list="mtg-users-list" placeholder="Comma separated names" />
              <datalist id="mtg-users-list"></datalist>
            </div>
            <div>
              <label class="label">Notes</label>
              <textarea class="input" id="mtg-notes" rows="2" style="resize:vertical;"></textarea>
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:0.5rem;margin-top:1rem;">
            <button class="btn-secondary" id="mtg-cancel">Cancel</button>
            <button class="btn-primary" id="mtg-save">Schedule</button>
          </div>
        </div>
      </div>
    `;

    // Wire modal backdrop close
    const backdrop = el.querySelector('#meetings-modal-backdrop');
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });
    el.querySelector('#mtg-cancel').addEventListener('click', closeModal);
    el.querySelector('#mtg-save').addEventListener('click', () => {
      collectForm();
      scheduleNew();
    });

    // Responsive grid: collapse to single column on narrow screens
    const handleResize = () => {
      const grid = el.querySelector('#meetings-grid');
      if (!grid) return;
      grid.style.gridTemplateColumns = window.innerWidth < 900 ? '1fr' : '1fr 300px';
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Populate datalist once users are loaded
    populateDatalist();

    renderCalendar();
    renderDayPanel();
  }

  function populateDatalist() {
    const dl = document.getElementById('mtg-users-list');
    if (!dl) return;
    dl.innerHTML = users.map((u) => `<option value="${esc(u)}"></option>`).join('');
  }

  function renderCalendar() {
    const container = document.getElementById('meetings-calendar');
    if (!container) return;

    const year      = cursor.getFullYear();
    const month     = cursor.getMonth();
    const cells     = buildCells();
    const holidayMap = buildHolidayMap();
    const byDate    = buildByDate();
    const todayISO  = isoDate(new Date());

    container.innerHTML = `
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem;flex-wrap:wrap;gap:0.5rem;">
        <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
          <button class="btn-secondary" id="mtg-today">Today</button>
          <button class="btn-secondary" id="mtg-prev">&#8592;</button>
          <button class="btn-secondary" id="mtg-next">&#8594;</button>
          <span style="font-size:15px;font-weight:600;margin-left:0.5rem;">${MONTHS[month]} ${year}</span>
        </div>
        <button class="btn-primary" id="mtg-open-modal">+ Schedule</button>
      </div>

      <!-- Day-of-week labels -->
      <div style="display:grid;grid-template-columns:repeat(7,1fr);text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;color:#94a3b8;margin-bottom:0.25rem;">
        ${DOW.map((d) => `<div style="padding:4px 0;">${d}</div>`).join('')}
      </div>

      <!-- 6-week grid -->
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:1px;background:#f1f5f9;border-radius:0.5rem;overflow:hidden;">
        ${cells.map((d) => {
          const k       = isoDate(d);
          const inMonth = d.getMonth() === month;
          const isToday = k === todayISO;
          const isSel   = k === selected;
          const isSun   = d.getDay() === 0;
          const hol     = holidayMap[k];
          const cnt     = (byDate[k] || []).length;
          const opacity = inMonth ? '1' : '0.38';
          const ringStyle = isSel
            ? 'box-shadow:0 0 0 2px #3A87CC inset;'
            : '';

          return `
            <button
              data-date="${k}"
              class="mtg-cell"
              style="
                min-height:72px;background:#fff;padding:0.375rem;text-align:left;
                position:relative;transition:background 150ms;border:none;cursor:pointer;
                opacity:${opacity};${ringStyle}
              "
            >
              <span style="
                display:inline-grid;place-items:center;width:1.5rem;height:1.5rem;
                border-radius:9999px;font-size:12px;
                ${isToday ? 'background:#2E72B5;color:#fff;font-weight:600;' : 'color:#334155;'}
              ">${d.getDate()}</span>

              ${hol
                ? `<span style="position:absolute;top:5px;right:5px;font-size:9px;color:#ef4444;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60%;">Holiday</span>`
                : isSun
                  ? `<span style="position:absolute;top:5px;right:5px;font-size:9px;color:#f87171;font-weight:600;">Off</span>`
                  : ''}

              ${cnt > 0
                ? `<span style="margin-top:4px;display:block;" class="pill" style="background:#eff6ff;color:#2E72B5;">${cnt} mtg</span>`
                : ''}
            </button>
          `;
        }).join('')}
      </div>
    `;

    // Event delegation for cell clicks
    container.querySelectorAll('.mtg-cell').forEach((btn) => {
      btn.addEventListener('mouseenter', () => {
        if (btn.dataset.date !== selected) btn.style.background = '#f8fafc';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = '#fff';
      });
      btn.addEventListener('click', () => {
        selected = btn.dataset.date;
        renderCalendar();
        renderDayPanel();
      });
    });

    container.querySelector('#mtg-today').addEventListener('click', () => {
      cursor   = new Date();
      selected = isoDate(new Date());
      loadMonth();
    });
    container.querySelector('#mtg-prev').addEventListener('click', () => {
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
      loadMonth();
    });
    container.querySelector('#mtg-next').addEventListener('click', () => {
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      loadMonth();
    });
    container.querySelector('#mtg-open-modal').addEventListener('click', openModal);
  }

  function renderDayPanel() {
    const container = document.getElementById('meetings-day-panel');
    if (!container) return;

    const byDate      = buildByDate();
    const dayMeetings = (byDate[selected] || [])
      .slice()
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

    const mtgHTML = dayMeetings.length === 0
      ? `<p style="text-align:center;font-size:12.5px;color:#94a3b8;padding:2rem 0;">No meetings on this date</p>`
      : dayMeetings.map((m) => `
          <div style="border:1px solid #e2e8f0;border-radius:0.5rem;padding:0.625rem;margin-bottom:0.5rem;">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:0.5rem;">
              <div style="font-weight:500;font-size:13px;color:#1e293b;">${esc(m.title)}</div>
              <button class="mtg-del-btn" data-id="${esc(m.id)}" style="font-size:11px;color:#ef4444;background:none;border:none;cursor:pointer;flex-shrink:0;padding:0 2px;">Delete</button>
            </div>
            <div style="font-size:11.5px;color:#64748b;margin-top:2px;">
              ${esc(m.startTime || '—')}${m.endTime ? ` &ndash; ${esc(m.endTime)}` : ''}
            </div>
            ${m.attendees ? `<div style="font-size:11.5px;color:#64748b;margin-top:2px;">&#128101; ${esc(m.attendees)}</div>` : ''}
            ${m.notes     ? `<div style="font-size:11.5px;color:#475569;margin-top:4px;">${esc(m.notes)}</div>` : ''}
          </div>
        `).join('');

    container.innerHTML = `
      <div style="font-size:13px;font-weight:600;margin-bottom:0.75rem;">
        Day &middot; ${fmtDisplay(selected)}
      </div>
      <div id="mtg-day-list">${mtgHTML}</div>
    `;

    container.querySelectorAll('.mtg-del-btn').forEach((btn) => {
      btn.addEventListener('click', () => removeMeeting(btn.dataset.id));
    });
  }

  // ── Modal ─────────────────────────────────────────────────────────────────────
  function openModal() {
    modalOpen = true;
    const backdrop = document.getElementById('meetings-modal-backdrop');
    if (!backdrop) return;
    backdrop.style.display = 'flex';
    const dateLabel = document.getElementById('meetings-modal-date');
    if (dateLabel) dateLabel.textContent = `on ${fmtDisplay(selected)}`;
    // Reset form fields in DOM
    setInputVal('mtg-title',     form.title);
    setInputVal('mtg-start',     form.startTime);
    setInputVal('mtg-end',       form.endTime);
    setInputVal('mtg-attendees', form.attendees);
    setInputVal('mtg-notes',     form.notes);
    // Focus title
    setTimeout(() => {
      const t = document.getElementById('mtg-title');
      if (t) t.focus();
    }, 60);
  }

  function closeModal() {
    modalOpen = false;
    const backdrop = document.getElementById('meetings-modal-backdrop');
    if (backdrop) backdrop.style.display = 'none';
  }

  function collectForm() {
    form = {
      title:     getInputVal('mtg-title'),
      startTime: getInputVal('mtg-start'),
      endTime:   getInputVal('mtg-end'),
      attendees: getInputVal('mtg-attendees'),
      notes:     getInputVal('mtg-notes'),
    };
  }

  function setSaving(on) {
    const btn = document.getElementById('mtg-save');
    if (!btn) return;
    btn.disabled     = on;
    btn.textContent  = on ? 'Saving...' : 'Schedule';
  }

  // ── DOM helpers ───────────────────────────────────────────────────────────────
  function getInputVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function setInputVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  }

  function esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ── Public entry-point ────────────────────────────────────────────────────────
  return {
    async render() {
      // Reset state for fresh navigation
      cursor   = new Date();
      selected = isoDate(new Date());
      meetings = [];
      form     = { title: '', startTime: '', endTime: '', attendees: '', notes: '' };
      modalOpen = false;
      saving    = false;

      // Render skeleton immediately, then fetch data
      render();

      // Load holidays and users in parallel (non-blocking for calendar)
      await Promise.all([loadHolidays(), loadUsers()]);
      populateDatalist();

      // Load meetings for the current month (re-renders calendar + day panel)
      await loadMonth();
    },
  };
})();
