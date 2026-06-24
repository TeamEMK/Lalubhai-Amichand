window.Pages = window.Pages || {};

window.Pages['client-master'] = (() => {
  /* ── state ─────────────────────────────────────────────────────────── */
  let _list    = [];
  let _q       = '';
  let _status  = 'All';
  let _open    = false;
  let _editing = null;   // id or null
  let _saving  = false;
  let _canEdit = false;
  let _form    = _blankForm();

  /* ── helpers ───────────────────────────────────────────────────────── */
  function _blankForm() {
    return { name: '', contactPerson: '', contactNumber: '', email: '', industry: '', status: 'active', notes: '' };
  }

  function _filtered() {
    const t = _q.toLowerCase();
    return _list.filter((c) =>
      (_status === 'All' || c.status === _status.toLowerCase()) &&
      (!t || (c.name + (c.contactPerson || '') + (c.email || '') + (c.industry || '')).toLowerCase().includes(t))
    );
  }

  function _esc(str) {
    return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ── API ────────────────────────────────────────────────────────────── */
  async function _load() {
    try {
      const res  = await fetch('/api/clients');
      const data = await res.json();
      _list = Array.isArray(data) ? data : [];
    } catch { _list = []; }
    _render();
  }

  async function _save() {
    if (!_form.name.trim()) return;
    _saving = true;
    _renderModal();
    try {
      if (_editing !== null) {
        await fetch('/api/clients', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: _editing, ..._form }),
        });
      } else {
        await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(_form),
        });
      }
    } finally {
      _saving  = false;
      _open    = false;
      _editing = null;
      _form    = _blankForm();
    }
    await _load();
  }

  async function _remove(id) {
    if (!confirm('Delete this client?')) return;
    await fetch(`/api/clients?id=${id}`, { method: 'DELETE' });
    await _load();
  }

  /* ── open helpers ───────────────────────────────────────────────────── */
  function _openAdd() {
    _editing = null;
    _form    = _blankForm();
    _open    = true;
    _render();
  }

  function _openEdit(c) {
    _editing = c.id;
    _form = {
      name:          c.name          || '',
      contactPerson: c.contactPerson || '',
      contactNumber: c.contactNumber || '',
      email:         c.email         || '',
      industry:      c.industry      || '',
      status:        c.status        || 'active',
      notes:         c.notes         || '',
    };
    _open = true;
    _render();
  }

  function _closeModal() {
    _open    = false;
    _editing = null;
    _form    = _blankForm();
    _render();
  }

  /* ── rendering ──────────────────────────────────────────────────────── */
  function _renderTable() {
    const rows = _filtered();
    const actionTh = _canEdit ? `<th class="table-th text-right pr-3">Action</th>` : '';

    if (rows.length === 0) {
      return `<p class="text-center text-[13px] text-slate-400 py-8">No clients yet.</p>`;
    }

    const bodyRows = rows.map((c) => {
      const statusPill = c.status === 'active'
        ? `<span class="pill bg-emerald-50 text-emerald-600">active</span>`
        : `<span class="pill bg-slate-100 text-slate-500">${_esc(c.status)}</span>`;

      const actionTd = _canEdit ? `
        <td class="table-td">
          <div class="flex gap-1 justify-end">
            <button class="btn-secondary js-edit" data-id="${c.id}">Edit</button>
            <button class="btn-danger js-delete" data-id="${c.id}">Delete</button>
          </div>
        </td>` : '';

      return `
        <tr class="table-row">
          <td class="table-td text-slate-400 font-mono text-[11px]">${_esc(c.id)}</td>
          <td class="table-td font-medium text-slate-800">${_esc(c.name)}</td>
          <td class="table-td">${_esc(c.contactPerson || '—')}</td>
          <td class="table-td">${_esc(c.contactNumber || '—')}</td>
          <td class="table-td">${_esc(c.email || '—')}</td>
          <td class="table-td">${_esc(c.industry || '—')}</td>
          <td class="table-td">${statusPill}</td>
          ${actionTd}
        </tr>`;
    }).join('');

    return `
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th class="table-th">ID</th>
              <th class="table-th">Name</th>
              <th class="table-th">Contact Person</th>
              <th class="table-th">Phone</th>
              <th class="table-th">Email</th>
              <th class="table-th">Industry</th>
              <th class="table-th">Status</th>
              ${actionTh}
            </tr>
          </thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </div>`;
  }

  function _renderModal() {
    const modal = document.getElementById('cm-modal');
    if (!modal) return;

    if (!_open) {
      modal.innerHTML = '';
      return;
    }

    const title   = _editing !== null ? 'Edit Client' : 'Add Client';
    const saveBtn = _saving ? 'Saving…' : (_editing !== null ? 'Save' : 'Add');

    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4" id="cm-modal-backdrop">
        <div class="card p-5 w-full max-w-lg" id="cm-modal-inner">
          <div class="text-[15px] font-semibold mb-4">${title}</div>
          <div class="space-y-3">
            <div>
              <label class="label">Name *</label>
              <input class="input" id="cm-f-name" value="${_esc(_form.name)}" placeholder="Client name" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Contact Person</label>
                <input class="input" id="cm-f-contactPerson" value="${_esc(_form.contactPerson)}" />
              </div>
              <div>
                <label class="label">Phone</label>
                <input class="input" id="cm-f-contactNumber" value="${_esc(_form.contactNumber)}" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Email</label>
                <input class="input" type="email" id="cm-f-email" value="${_esc(_form.email)}" />
              </div>
              <div>
                <label class="label">Industry</label>
                <input class="input" id="cm-f-industry" value="${_esc(_form.industry)}" />
              </div>
            </div>
            <div>
              <label class="label">Status</label>
              <select class="input" id="cm-f-status">
                <option value="active"   ${_form.status === 'active'   ? 'selected' : ''}>Active</option>
                <option value="inactive" ${_form.status === 'inactive' ? 'selected' : ''}>Inactive</option>
              </select>
            </div>
            <div>
              <label class="label">Notes</label>
              <textarea class="input" rows="2" id="cm-f-notes">${_esc(_form.notes)}</textarea>
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-4">
            <button class="btn-secondary" id="cm-modal-cancel">Cancel</button>
            <button class="btn-primary" id="cm-modal-save" ${_saving ? 'disabled' : ''}>${saveBtn}</button>
          </div>
        </div>
      </div>`;

    document.getElementById('cm-modal-backdrop').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) _closeModal();
    });
    document.getElementById('cm-modal-inner').addEventListener('click', (e) => e.stopPropagation());
    document.getElementById('cm-modal-cancel').addEventListener('click', _closeModal);
    document.getElementById('cm-modal-save').addEventListener('click', () => {
      _form.name          = document.getElementById('cm-f-name').value;
      _form.contactPerson = document.getElementById('cm-f-contactPerson').value;
      _form.contactNumber = document.getElementById('cm-f-contactNumber').value;
      _form.email         = document.getElementById('cm-f-email').value;
      _form.industry      = document.getElementById('cm-f-industry').value;
      _form.status        = document.getElementById('cm-f-status').value;
      _form.notes         = document.getElementById('cm-f-notes').value;
      _save();
    });
  }

  function _render() {
    const el = document.getElementById('main-content');
    if (!el) return;

    const addBtn = _canEdit
      ? `<button class="btn-primary" id="cm-add-btn">+ Add Client</button>`
      : '';

    const rows    = _filtered();
    const total   = _list.length;

    el.innerHTML = `
      <div class="space-y-4">
        <div class="card p-5">
          <div class="flex items-center gap-2 flex-wrap mb-4">
            <input class="input max-w-xs" id="cm-search" placeholder="Search name / contact / email…" value="${_esc(_q)}" />
            <select class="input w-auto" id="cm-status-filter">
              <option ${_status === 'All'      ? 'selected' : ''}>All</option>
              <option ${_status === 'Active'   ? 'selected' : ''}>Active</option>
              <option ${_status === 'Inactive' ? 'selected' : ''}>Inactive</option>
            </select>
            <div class="ml-auto text-[11px] text-slate-500">${rows.length} of ${total}</div>
            ${addBtn}
          </div>
          <div id="cm-table">${_renderTable()}</div>
        </div>
        <div id="cm-modal"></div>
      </div>`;

    /* search */
    document.getElementById('cm-search').addEventListener('input', (e) => {
      _q = e.target.value;
      document.getElementById('cm-table').innerHTML = _renderTable();
      _bindTableButtons();
      document.querySelector('.ml-auto.text-\\[11px\\]') &&
        (document.querySelector('.ml-auto.text-\\[11px\\]').textContent = `${_filtered().length} of ${_list.length}`);
    });

    /* status filter */
    document.getElementById('cm-status-filter').addEventListener('change', (e) => {
      _status = e.target.value;
      document.getElementById('cm-table').innerHTML = _renderTable();
      _bindTableButtons();
    });

    /* add button */
    const addBtnEl = document.getElementById('cm-add-btn');
    if (addBtnEl) addBtnEl.addEventListener('click', _openAdd);

    _bindTableButtons();
    _renderModal();
  }

  function _bindTableButtons() {
    document.querySelectorAll('.js-edit').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const c  = _list.find((x) => String(x.id) === String(id));
        if (c) _openEdit(c);
      });
    });
    document.querySelectorAll('.js-delete').forEach((btn) => {
      btn.addEventListener('click', () => _remove(btn.dataset.id));
    });
  }

  /* ── public API ─────────────────────────────────────────────────────── */
  return {
    async render(opts = {}) {
      _canEdit = opts.canEdit !== false && (
        (window.__session?.roles || []).some((r) => r === 'Admin' || r === 'HOD')
      );
      _q       = '';
      _status  = 'All';
      _open    = false;
      _editing = null;
      _saving  = false;
      _form    = _blankForm();
      _list    = [];

      /* paint skeleton immediately, then load data */
      const el = document.getElementById('main-content');
      if (el) el.innerHTML = `<div class="card p-10 text-center text-slate-400 text-sm">Loading clients…</div>`;
      await _load();
    },
  };
})();
