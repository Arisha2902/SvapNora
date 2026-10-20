import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import PageHeader from '../../components/ui/PageHeader.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Modal from '../../components/ui/Modal.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import Button from '../../components/Button.jsx';
import FilterBar, { Field } from '../../components/admin/FilterBar.jsx';
import { useApiList } from '../../hooks/useApiList.js';
import { useToast } from '../../components/ui/Toast.jsx';
import * as svc from '../../services/adminService.js';

const CONFIG = {
  employee: {
    title: 'Employees',
    eyebrow: 'Directory',
    description: 'Create, review and deactivate staff accounts. Employees never self-register.',
    base: '/admin/employees',
    empty: 'Create the first employee account to start assigning work.',
    search: 'Search name, email, ID, department…',
    list: svc.listEmployees,
    create: svc.createEmployee,
    update: svc.updateEmployee,
    remove: svc.deleteEmployee,
    toggle: svc.setEmployeeStatus,
    reset: svc.resetEmployeePassword,
    orgLabel: 'Department',
    orgSecond: 'Designation',
  },
  customer: {
    title: 'Customers',
    eyebrow: 'Directory',
    description: 'Client accounts created by your team, plus anyone who self-registers for the portal.',
    base: '/admin/customers',
    empty: 'Add a client account to assign projects and issue invoices.',
    search: 'Search name, email, company…',
    list: svc.listCustomers,
    create: svc.createCustomer,
    update: svc.updateCustomer,
    remove: svc.deleteCustomer,
    toggle: svc.setCustomerStatus,
    reset: svc.resetCustomerPassword,
    orgLabel: 'Company',
    orgSecond: '',
  },
};

export default function Directory({ kind = 'employee' }) {
  const cfg = CONFIG[kind] || CONFIG.employee;
  const toast = useToast();

  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { rows, meta, loading, error, refresh } = useApiList(cfg.list, {
    q,
    page,
    limit: 10,
    ...(status ? { isActive: status } : {}),
  });

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [resetFor, setResetFor] = useState(null);
  const [resetValue, setResetValue] = useState('');

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  const blank = () =>
    kind === 'employee'
      ? { name: '', email: '', phone: '', department: '', designation: '', joinDate: '', password: '' }
      : { name: '', email: '', phone: '', companyName: '', password: '' };

  const openCreate = () => {
    setForm(blank());
    setFormError('');
    setEditing('new');
  };

  const openEdit = (row) => {
    setForm({
      name: row.name || '',
      email: row.email || '',
      phone: row.phone || '',
      department: row.department || '',
      designation: row.designation || '',
      joinDate: row.joinDate ? String(row.joinDate).slice(0, 10) : '',
      companyName: row.companyName || '',
      password: '',
    });
    setFormError('');
    setEditing(row);
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormError('');
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: (form.phone || '').trim(),
        ...(kind === 'employee'
          ? {
              department: (form.department || '').trim(),
              designation: (form.designation || '').trim(),
              ...(form.joinDate ? { joinDate: form.joinDate } : {}),
            }
          : { companyName: (form.companyName || '').trim() }),
        ...(editing === 'new' && form.password ? { password: form.password } : {}),
      };

      if (editing === 'new') await cfg.create(payload);
      else await cfg.update(editing._id || editing.id, payload);

      toast.success(editing === 'new' ? `${cfg.title} record created.` : 'Record updated.');
      setEditing(null);
      refresh();
    } catch (err) {
      setFormError(err?.message || 'Could not save this record.');
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = async (row) => {
    try {
      await cfg.toggle(row._id || row.id, !row.isActive);
      toast.success(`${row.name} ${row.isActive ? 'deactivated' : 'activated'}.`);
      refresh();
    } catch (err) {
      toast.error(err?.message || 'Could not change status.');
    }
  };

  const doReset = async () => {
    setBusy(true);
    try {
      await cfg.reset(resetFor._id || resetFor.id, resetValue || undefined, true);
      toast.success('Temporary password set. It must be changed at next sign-in.');
      setResetFor(null);
      setResetValue('');
    } catch (err) {
      toast.error(err?.message || 'Could not reset the password.');
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await cfg.remove(toDelete._id || toDelete.id);
      toast.success('Record deleted.');
      setToDelete(null);
      refresh();
    } catch (err) {
      toast.error(err?.message || 'Could not delete this record.');
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: kind === 'employee' ? 'Employee' : 'Customer',
      render: (row) => (
        <div className="cell-strong">
          <Link to={`${cfg.base}/${row._id || row.id}`}>{row.name}</Link>
          <span className="cell-sub">{row.email}</span>
        </div>
      ),
    },
    kind === 'employee'
      ? { key: 'employeeId', header: 'ID', render: (row) => <span className="mono">{row.employeeId || '—'}</span> }
      : {
          key: 'companyName',
          header: 'Company',
          render: (row) => row.companyName || <span className="cell-sub">No company</span>,
        },
    {
      key: 'org',
      header: cfg.orgLabel,
      render: (row) =>
        kind === 'employee' ? (
          <div className="cell-strong">
            {row.designation || '—'}
            <span className="cell-sub">{row.department || 'No department'}</span>
          </div>
        ) : (
          <span className="mono">{row.phone || '—'}</span>
        ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => (
        <StatusBadge value={row.isActive ? 'active' : 'inactive'} label={row.isActive ? 'Active' : 'Disabled'} />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="row-btn" onClick={() => openEdit(row)}>
            Edit
          </button>
          <button type="button" className="row-btn" onClick={() => setResetFor(row)}>
            Reset password
          </button>
          <button type="button" className="row-btn" onClick={() => toggleStatus(row)}>
            {row.isActive ? 'Disable' : 'Enable'}
          </button>
          <button type="button" className="row-btn row-btn--danger" onClick={() => setToDelete(row)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Helmet>
        <title>{cfg.title} · Admin · SvapNora</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PageHeader
        eyebrow={cfg.eyebrow}
        title={cfg.title}
        description={cfg.description}
        actions={
          <Button variant="primary" onClick={openCreate}>
            New {kind === 'employee' ? 'employee' : 'customer'}
          </Button>
        }
      />

      <FilterBar
        value={q}
        onChange={(v) => {
          setQ(v);
          setPage(1);
        }}
        placeholder={cfg.search}
        onRefresh={refresh}
        busy={loading}
      >
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          aria-label="Account status"
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Disabled</option>
        </select>
      </FilterBar>

      {error && <Alert tone="error">{error}</Alert>}

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        caption={cfg.title}
        emptyTitle={q ? 'No matches for that search' : `No ${cfg.title.toLowerCase()} yet`}
        emptyBody={cfg.empty}
        emptyAction={
          !q && (
            <Button variant="primary" onClick={openCreate}>
              New {kind === 'employee' ? 'employee' : 'customer'}
            </Button>
          )
        }
      />

      <Pagination page={meta?.page || 1} totalPages={meta?.totalPages || 1} total={meta?.total} limit={meta?.limit} onChange={setPage} />

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? `New ${kind}` : `Edit ${kind}`}
        subtitle={editing === 'new' ? 'A temporary password can be generated if left blank.' : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save} disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      >
        <form className="form" onSubmit={save}>
          {formError && <Alert tone="error">{formError}</Alert>}
          <div className="form__row">
            <Field label="Full name" required>
              <input value={form.name || ''} onChange={set('name')} required minLength={2} />
            </Field>
            <Field label="Email" required>
              <input type="email" value={form.email || ''} onChange={set('email')} required />
            </Field>
          </div>

          {kind === 'employee' ? (
            <>
              <div className="form__row">
                <Field label="Department">
                  <input value={form.department || ''} onChange={set('department')} />
                </Field>
                <Field label="Designation">
                  <input value={form.designation || ''} onChange={set('designation')} />
                </Field>
              </div>
              <div className="form__row">
                <Field label="Phone">
                  <input value={form.phone || ''} onChange={set('phone')} />
                </Field>
                <Field label="Join date">
                  <input type="date" value={form.joinDate || ''} onChange={set('joinDate')} />
                </Field>
              </div>
            </>
          ) : (
            <div className="form__row">
              <Field label="Company">
                <input value={form.companyName || ''} onChange={set('companyName')} />
              </Field>
              <Field label="Phone">
                <input value={form.phone || ''} onChange={set('phone')} />
              </Field>
            </div>
          )}

          {editing === 'new' && (
            <Field
              label="Initial password"
              hint="Leave blank to auto-generate. Minimum 8 characters with a letter and a number."
            >
              <input type="text" value={form.password || ''} onChange={set('password')} autoComplete="new-password" />
            </Field>
          )}
        </form>
      </Modal>

      <Modal
        open={Boolean(resetFor)}
        onClose={() => setResetFor(null)}
        title="Reset password"
        subtitle={resetFor ? `Set a new temporary password for ${resetFor.name}.` : ''}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetFor(null)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="primary" onClick={doReset} disabled={busy}>
              {busy ? 'Setting…' : 'Set password'}
            </Button>
          </>
        }
      >
        <div className="form">
          <Field label="New temporary password" required hint="The account must change it at next sign-in.">
            <input value={resetValue} onChange={(e) => setResetValue(e.target.value)} placeholder="Auto-generated if blank" />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Delete ${kind}?`}
        body={`${toDelete?.name || 'This account'} will be permanently removed.`}
        confirmLabel="Delete"
        busy={busy}
        onConfirm={doDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
