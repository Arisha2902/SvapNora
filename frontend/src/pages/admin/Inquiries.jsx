import { useState } from 'react';
import { Helmet } from 'react-helmet-async';

import PageHeader from '../../components/ui/PageHeader.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Modal from '../../components/ui/Modal.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import Button from '../../components/Button.jsx';
import FilterBar, { Field, Select } from '../../components/admin/FilterBar.jsx';
import { useApiList } from '../../hooks/useApiList.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { deleteInquiry, listInquiries, setInquiryNotes, setInquiryStatus } from '../../services/adminService.js';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'closed', label: 'Closed' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'contact', label: 'Contact form' },
  { value: 'briefing', label: 'Briefing request' },
];

const fmt = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function AdminInquiries() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const { rows, meta, loading, error, refresh } = useApiList(listInquiries, {
    q,
    page,
    limit: 10,
    ...(status ? { status } : {}),
    ...(type ? { type } : {}),
  });

  const [open, setOpen] = useState(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const changeStatus = async (row, next) => {
    try {
      await setInquiryStatus(row._id || row.id, next);
      toast.success(`Marked as ${next}.`);
      if (open && (open._id || open.id) === (row._id || row.id)) setOpen({ ...row, status: next });
      refresh();
    } catch (err) {
      toast.error(err?.message || 'Could not update status.');
    }
  };

  const openDetail = (row) => {
    setOpen(row);
    setNotes(row.notes || '');
  };

  const saveNotes = async () => {
    setBusy(true);
    try {
      await setInquiryNotes(open._id || open.id, notes);
      toast.success('Notes saved.');
      refresh();
    } catch (err) {
      toast.error(err?.message || 'Could not save notes.');
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await deleteInquiry(toDelete._id || toDelete.id);
      toast.success('Inquiry deleted.');
      setToDelete(null);
      setOpen(null);
      refresh();
    } catch (err) {
      toast.error(err?.message || 'Could not delete this inquiry.');
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'From',
      render: (row) => (
        <div className="cell-strong">
          <button type="button" className="linkish" onClick={() => openDetail(row)}>
            {row.name}
          </button>
          <span className="cell-sub">{row.email}</span>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (row) => <span className="mono">{row.type}</span> },
    { key: 'serviceInterest', header: 'Interest', render: (row) => row.serviceInterest || <span className="cell-sub">—</span> },
    { key: 'createdAt', header: 'Received', render: (row) => fmt(row.createdAt) },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <select
          className="inline-select"
          value={row.status}
          aria-label={`Status for ${row.name}`}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => changeStatus(row, e.target.value)}
        >
          {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="row-btn" onClick={() => openDetail(row)}>
            Open
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
        <title>Inquiries · Admin · SvapNora</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PageHeader
        eyebrow="Sales intake"
        title="Inquiries"
        description="Everything submitted through the public contact and briefing forms."
      />

      <FilterBar
        value={q}
        onChange={(v) => {
          setQ(v);
          setPage(1);
        }}
        placeholder="Search name or email…"
        onRefresh={refresh}
        busy={loading}
      >
        <select
          value={status}
          aria-label="Filter by status"
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={type}
          aria-label="Filter by type"
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </FilterBar>

      {error && <Alert tone="error">{error}</Alert>}

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        caption="Contact form inquiries"
        emptyTitle={q || status || type ? 'No inquiries match those filters' : 'No inquiries yet'}
        emptyBody="New submissions from the website contact form land here."
      />

      <Pagination page={meta?.page || 1} totalPages={meta?.totalPages || 1} total={meta?.total} limit={meta?.limit} onChange={setPage} />

      <Modal
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        title={open?.name || 'Inquiry'}
        subtitle={open ? `${open.email}${open.phone ? ` · ${open.phone}` : ''} · ${fmt(open.createdAt)}` : ''}
        footer={
          <>
            <Button variant="ghost" onClick={() => setToDelete(open)} disabled={busy}>
              Delete
            </Button>
            <Button variant="primary" onClick={saveNotes} disabled={busy}>
              {busy ? 'Saving…' : 'Save notes'}
            </Button>
          </>
        }
      >
        {open && (
          <div className="detail">
            <div className="detail__row">
              <StatusBadge value={open.status} />
              <span className="mono">{open.type}</span>
              {open.serviceInterest && <span className="cell-sub">{open.serviceInterest}</span>}
            </div>

            <blockquote className="detail__quote">{open.message}</blockquote>

            <div className="detail__status-row">
              <span className="detail__label">Move to</span>
              <Select
                value={open.status}
                onChange={(v) => changeStatus(open, v)}
                options={STATUS_OPTIONS.filter((o) => o.value)}
                ariaLabel="Inquiry status"
              />
            </div>

            <Field label="Internal notes" hint="Only visible to administrators.">
              <textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>

            <a className="btn btn--ghost" href={`mailto:${open.email}`}>
              <span className="btn__label">Reply by email</span>
              <span className="btn__arrow" aria-hidden="true">
                &gt;
              </span>
            </a>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete inquiry?"
        body={`${toDelete?.name || 'This inquiry'} and its message will be permanently removed.`}
        confirmLabel="Delete"
        busy={busy}
        onConfirm={doDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
