export default function ChartContainer({ title, sub, actions, children, height = 260 }) {
  return (
    <div className="chart-container">
      <div className="chart-container-head">
        <div>
          <div className="card-title" style={{ fontSize: 14 }}>{title}</div>
          {sub && <div className="text-faint" style={{ fontSize: 11.5 }}>{sub}</div>}
        </div>
        {actions}
      </div>
      <div style={{ width: '100%', height }}>{children}</div>
    </div>
  );
}
