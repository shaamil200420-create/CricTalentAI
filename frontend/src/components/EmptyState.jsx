import Icon from './Icon.jsx';

export default function EmptyState({ icon = 'inbox', title, hint }) {
  return (
    <div className="state-block">
      <Icon name={icon} size={30} />
      <h3>{title}</h3>
      {hint && <p>{hint}</p>}
    </div>
  );
}
