/**
 * DetailList — simple read-only label/value rows, used by the "View" action
 * added to Admin/Coach/Player/User Management (old admin (4).html reference:
 * a compact profile detail view opened from the table's view icon). Reuses
 * current design tokens only.
 */
export default function DetailList({ rows }) {
  return (
    <div className="detail-list">
      {rows.map(([label, value]) => (
        <div className="detail-row" key={label}>
          <span className="detail-label">{label}</span>
          <span className="detail-value">{value ?? '—'}</span>
        </div>
      ))}
    </div>
  );
}
