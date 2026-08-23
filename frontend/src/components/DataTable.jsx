import EmptyState from './EmptyState.jsx';

/**
 * columns: [{ key, header, render?(row) }]
 * rows: array of data objects
 */
export default function DataTable({ columns, rows, emptyTitle = 'Nothing here yet', emptyHint, rowKey = 'id' }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="table-wrap">
        <EmptyState title={emptyTitle} hint={emptyHint} />
      </div>
    );
  }
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row[rowKey] ?? i}>
              {columns.map((c) => (
                <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
