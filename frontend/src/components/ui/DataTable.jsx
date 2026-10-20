import EmptyState from './EmptyState.jsx';
import Spinner from './Spinner.jsx';

const rowId = (row, i) => row?.id ?? row?._id ?? i;

/**
 * Dependency-free data table shared by the admin, employee and customer
 * portals.
 *
 * columns: [{ key, header, render?: (row) => node, align?, hideOnMobile? }]
 * Rows are clickable when `onRowClick` is supplied (keyboard accessible too).
 */
export default function DataTable({
  columns,
  rows,
  loading = false,
  emptyTitle = 'Nothing here yet',
  emptyBody,
  emptyAction,
  onRowClick,
  caption,
}) {
  if (loading) {
    return (
      <div className="table-loading" role="status" aria-live="polite">
        <Spinner label="Loading records" />
        <span>Loading records…</span>
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return <EmptyState title={emptyTitle} body={emptyBody} action={emptyAction} />;
  }

  return (
    <div className="table-wrap">
      <table className="table">
        {caption && <caption className="visually-hidden">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={c.align ? `is-${c.align}` : ''}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={rowId(row, i)}
              className={onRowClick ? 'is-clickable' : ''}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onRowClick(row);
                      }
                    }
                  : undefined
              }
            >
              {columns.map((c) => (
                <td key={c.key} className={c.align ? `is-${c.align}` : ''}>
                  {c.render ? c.render(row, i) : row?.[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
