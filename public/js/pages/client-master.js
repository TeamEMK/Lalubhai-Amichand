window.Pages = window.Pages || {};

window.Pages['client-master'] = (() => {
  let _list    = [];
  let _q       = '';
  let _status  = 'All';
  let _open    = false;
  let _editing = null;
  let _saving  = false;
  let _canEdit = false;
  let _form    = _blankForm();

  function _blankForm() {
    return {
      name: '', mobile: '', email: '', state: '', district: '', address: '', pin: '',
      bankName: '', accountHolder: '', accountNo: '', ifscCode: '', branchName: '',
      status: 'active',
    };
  }

  function _filtered() {
    const t = _q.toLowerCase();
    return _list.filter(c =>
      (_status === 'All' || c.status === _status.toLowerCase()) &&
      (!t || (c.name + (c.mobile||'') + (c.email||'') + (c.state||'') + (c.district||'')).toLowerCase().includes(t))
    );
  }

  function esc(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  async function _load() {
    try {
      const res  = await Utils.apiFetch('/api/clients');
      _list = Array.isArray(res) ? res : [];
    } catch { _list = []; }
    _render();
  }

  async function _save() {
    if (!_form.name.trim()) { Utils.showToast('Vendor name is required', 'error'); return; }
    _saving = true;
    _renderModal();
    try {
      const method = _editing !== null ? 'PATCH' : 'POST';
      const body   = _editing !== null ? { id: _editing, ..._form } : _form;
      await Utils.apiFetch('/api/clients', { method, body: JSON.stringify(body) });
      _open = false; _editing = null; _form = _blankForm();
      Utils.showToast(_editing !== null ? 'Vendor updated' : 'Vendor added');
    } catch(e) {
      Utils.showToast(e.message || 'Failed to save', 'error');
    } finally {
      _saving = false;
    }
    await _load();
  }

  async function _remove(id) {
    if (!confirm('Delete this vendor?')) return;
    await Utils.apiFetch(`/api/clients?id=${id}`, { method: 'DELETE' });
    Utils.showToast('Vendor deleted');
    await _load();
  }

  function _openAdd() { _editing = null; _form = _blankForm(); _open = true; _render(); }

  function _openEdit(c) {
    _editing = c.id;
    _form = {
      name:          c.name          || '',
      mobile:        c.mobile        || c.contact_number || '',
      email:         c.email         || '',
      state:         c.state         || '',
      district:      c.district      || '',
      address:       c.address       || '',
      pin:           c.pin           || '',
      bankName:      c.bank_name     || '',
      accountHolder: c.account_holder|| '',
      accountNo:     c.account_no    || '',
      ifscCode:      c.ifsc_code     || '',
      branchName:    c.branch_name   || '',
      status:        c.status        || 'active',
    };
    _open = true; _render();
  }

  function _closeModal() { _open = false; _editing = null; _form = _blankForm(); _render(); }

  function _field(id, label, value, type='text', placeholder='') {
    return `<div>
      <label style="display:block;font-size:10.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#64748b;margin-bottom:4px;">${label}</label>
      <input class="input" id="${id}" type="${type}" value="${esc(value)}" placeholder="${placeholder}" style="width:100%;box-sizing:border-box;" />
    </div>`;
  }

  function _renderModal() {
    const modal = document.getElementById('cm-modal');
    if (!modal) return;
    if (!_open) { modal.innerHTML = ''; return; }

    const title = _editing !== null ? 'Edit Vendor' : 'Add Vendor';

    modal.innerHTML = `
      <div style="position:fixed;inset:0;background:rgba(0,0,0,.45);display:grid;place-items:center;z-index:50;padding:16px;overflow-y:auto;" id="cm-backdrop">
        <div style="background:#fff;border-radius:16px;width:100%;max-width:600px;box-shadow:0 20px 60px rgba(0,0,0,.2);overflow:hidden;" onclick="event.stopPropagation()">

          <!-- Header -->
          <div style="padding:18px 22px 14px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;">
            <div>
              <div style="font-size:16px;font-weight:700;color:#1e293b;">${title}</div>
              <div style="font-size:12px;color:#94a3b8;margin-top:1px;">Fill in vendor information</div>
            </div>
            <button id="cm-modal-close" style="background:transparent;border:none;cursor:pointer;color:#94a3b8;font-size:20px;line-height:1;padding:4px;">✕</button>
          </div>

          <div style="padding:20px 22px;max-height:70vh;overflow-y:auto;">

            <!-- Section 1: Basic Details -->
            <div style="margin-bottom:20px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
                <div style="width:28px;height:28px;border-radius:8px;background:#eff6ff;display:grid;place-items:center;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <span style="font-size:13px;font-weight:700;color:#1e293b;">Basic Details</span>
              </div>
              <div style="display:grid;gap:12px;">
                ${_field('cm-name',     'Name *',      _form.name,     'text', 'Vendor / Company name')}
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                  ${_field('cm-mobile', 'Mobile No.',  _form.mobile,   'tel',  '10-digit mobile')}
                  ${_field('cm-email',  'Email',       _form.email,    'email','vendor@email.com')}
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                  ${_field('cm-state',    'State',    _form.state,    'text', 'e.g. Rajasthan')}
                  ${_field('cm-district', 'District', _form.district, 'text', 'e.g. Jaipur')}
                </div>
                <div style="display:grid;grid-template-columns:1fr auto;gap:12px;align-items:end;">
                  ${_field('cm-address', 'Address', _form.address, 'text', 'Street / Area')}
                  ${_field('cm-pin',     'Pin Code', _form.pin,    'text', '6-digit PIN')}
                </div>
                <div>
                  <label style="display:block;font-size:10.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#64748b;margin-bottom:4px;">Status</label>
                  <select class="input" id="cm-status" style="width:100%;box-sizing:border-box;">
                    <option value="active"   ${_form.status==='active'   ?'selected':''}>Active</option>
                    <option value="inactive" ${_form.status==='inactive' ?'selected':''}>Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Divider -->
            <div style="height:1px;background:#f1f5f9;margin:0 0 20px;"></div>

            <!-- Section 2: Bank Details -->
            <div>
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
                <div style="width:28px;height:28px;border-radius:8px;background:#f0fdf4;display:grid;place-items:center;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
                </div>
                <span style="font-size:13px;font-weight:700;color:#1e293b;">Bank Details</span>
              </div>
              <div style="display:grid;gap:12px;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                  ${_field('cm-bankName',      'Bank Name',           _form.bankName,      'text', 'e.g. SBI, HDFC')}
                  ${_field('cm-accountHolder', 'Account Holder Name', _form.accountHolder, 'text', 'As per bank records')}
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                  ${_field('cm-accountNo', 'Account No.',  _form.accountNo, 'text', 'Bank account number')}
                  ${_field('cm-ifscCode',  'IFSC Code',    _form.ifscCode,  'text', 'e.g. SBIN0001234')}
                </div>
                ${_field('cm-branchName', 'Branch Name', _form.branchName, 'text', 'Branch location')}
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding:14px 22px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:10px;background:#fafafa;">
            <button id="cm-modal-cancel" style="padding:8px 20px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;color:#475569;font-size:13px;font-weight:600;cursor:pointer;">Cancel</button>
            <button id="cm-modal-save" style="padding:8px 22px;border-radius:8px;background:#C4714A;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;" ${_saving?'disabled':''}>
              ${_saving ? 'Saving…' : (_editing!==null ? 'Update Vendor' : 'Add Vendor')}
            </button>
          </div>
        </div>
      </div>`;

    document.getElementById('cm-backdrop').addEventListener('click', _closeModal);
    document.getElementById('cm-modal-close').addEventListener('click', _closeModal);
    document.getElementById('cm-modal-cancel').addEventListener('click', _closeModal);
    document.getElementById('cm-modal-save').addEventListener('click', () => {
      _form.name          = document.getElementById('cm-name').value.trim();
      _form.mobile        = document.getElementById('cm-mobile').value.trim();
      _form.email         = document.getElementById('cm-email').value.trim();
      _form.state         = document.getElementById('cm-state').value.trim();
      _form.district      = document.getElementById('cm-district').value.trim();
      _form.address       = document.getElementById('cm-address').value.trim();
      _form.pin           = document.getElementById('cm-pin').value.trim();
      _form.status        = document.getElementById('cm-status').value;
      _form.bankName      = document.getElementById('cm-bankName').value.trim();
      _form.accountHolder = document.getElementById('cm-accountHolder').value.trim();
      _form.accountNo     = document.getElementById('cm-accountNo').value.trim();
      _form.ifscCode      = document.getElementById('cm-ifscCode').value.trim().toUpperCase();
      _form.branchName    = document.getElementById('cm-branchName').value.trim();
      _save();
    });
  }

  function _renderTable() {
    const rows = _filtered();
    if (rows.length === 0) return `<p style="text-align:center;color:#94a3b8;font-size:13px;padding:32px 0;">No vendors yet.</p>`;

    const actionTh = _canEdit ? `<th class="table-th text-right">Action</th>` : '';
    const bodyRows = rows.map(c => {
      const pill = c.status === 'active'
        ? `<span class="pill bg-emerald-50 text-emerald-600">Active</span>`
        : `<span class="pill bg-slate-100 text-slate-500">Inactive</span>`;
      const actionTd = _canEdit ? `
        <td class="table-td">
          <div style="display:flex;gap:6px;justify-content:flex-end;">
            <button class="btn-secondary js-edit" data-id="${c.id}" style="font-size:12px;padding:3px 10px;">Edit</button>
            <button class="btn-danger js-delete" data-id="${c.id}" style="font-size:12px;padding:3px 10px;">Delete</button>
          </div>
        </td>` : '';
      return `<tr class="table-row">
        <td class="table-td font-medium text-slate-800">${esc(c.name)}</td>
        <td class="table-td">${esc(c.mobile || c.contact_number || '—')}</td>
        <td class="table-td">${esc(c.email || '—')}</td>
        <td class="table-td">${esc(c.state || '—')}</td>
        <td class="table-td">${esc(c.district || '—')}</td>
        <td class="table-td">${esc(c.bank_name || c.bankName || '—')}</td>
        <td class="table-td">${pill}</td>
        ${actionTd}
      </tr>`;
    }).join('');

    return `<div class="overflow-x-auto">
      <table class="w-full">
        <thead><tr>
          <th class="table-th">Name</th>
          <th class="table-th">Mobile</th>
          <th class="table-th">Email</th>
          <th class="table-th">State</th>
          <th class="table-th">District</th>
          <th class="table-th">Bank</th>
          <th class="table-th">Status</th>
          ${actionTh}
        </tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>`;
  }

  function _render() {
    const el = document.getElementById('main-content');
    if (!el) return;
    const rows = _filtered();

    el.innerHTML = `
      <div style="padding:20px;max-width:1200px;margin:0 auto;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:10px;">
          <div>
            <h1 style="font-size:18px;font-weight:700;color:#1e293b;margin:0;">Vendor Master</h1>
            <p style="font-size:12px;color:#94a3b8;margin:2px 0 0;">Manage all vendors and their bank details</p>
          </div>
          ${_canEdit ? `<button id="cm-add-btn" style="padding:9px 20px;border-radius:9px;background:#C4714A;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            Add Vendor
          </button>` : ''}
        </div>

        <div style="background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
          <div style="padding:14px 16px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <input id="cm-search" placeholder="Search name / mobile / email…" value="${esc(_q)}"
              style="flex:1;min-width:180px;padding:7px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;outline:none;" />
            <select id="cm-status-filter"
              style="padding:7px 10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;outline:none;background:#fff;">
              <option ${_status==='All'      ?'selected':''}>All</option>
              <option ${_status==='Active'   ?'selected':''}>Active</option>
              <option ${_status==='Inactive' ?'selected':''}>Inactive</option>
            </select>
            <span style="font-size:11px;color:#94a3b8;white-space:nowrap;">${rows.length} of ${_list.length}</span>
          </div>
          <div id="cm-table">${_renderTable()}</div>
        </div>
        <div id="cm-modal"></div>
      </div>`;

    document.getElementById('cm-search').addEventListener('input', e => {
      _q = e.target.value;
      document.getElementById('cm-table').innerHTML = _renderTable();
      _bindTableButtons();
    });
    document.getElementById('cm-status-filter').addEventListener('change', e => {
      _status = e.target.value;
      document.getElementById('cm-table').innerHTML = _renderTable();
      _bindTableButtons();
    });
    const addBtn = document.getElementById('cm-add-btn');
    if (addBtn) addBtn.addEventListener('click', _openAdd);
    _bindTableButtons();
    _renderModal();
  }

  function _bindTableButtons() {
    document.querySelectorAll('.js-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const c = _list.find(x => String(x.id) === String(btn.dataset.id));
        if (c) _openEdit(c);
      });
    });
    document.querySelectorAll('.js-delete').forEach(btn => {
      btn.addEventListener('click', () => _remove(btn.dataset.id));
    });
  }

  return {
    async render() {
      _canEdit = (window.currentUser?.roles || []).some
        ? (window.currentUser?.roles || []).some(r => r==='Admin'||r==='HOD')
        : String(window.currentUser?.roles||'').includes('Admin');
      _q = ''; _status = 'All'; _open = false; _editing = null; _saving = false;
      _form = _blankForm(); _list = [];
      const el = document.getElementById('main-content');
      if (el) el.innerHTML = `<div style="padding:40px;text-align:center;color:#94a3b8;font-size:13px;">Loading vendors…</div>`;
      await _load();
    },
  };
})();
