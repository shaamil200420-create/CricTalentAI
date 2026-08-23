export default function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="state-block">
      <div className="spinner" />
      <p style={{ marginTop: 10 }}>{label}</p>
    </div>
  );
}
