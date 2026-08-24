export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function initials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function classNames(...parts) {
  return parts.filter(Boolean).join(' ');
}

// Returns a NEW array (does not mutate `items`) sorted ascending by the
// combined date + time fields — earliest first. Used to display schedule
// items chronologically instead of in raw array order.
export function sortByDateTime(items, dateKey = 'date', timeKey = 'time') {
  return [...items].sort((a, b) => {
    const aTime = new Date(`${a[dateKey]}T${a[timeKey] || '00:00'}`).getTime();
    const bTime = new Date(`${b[dateKey]}T${b[timeKey] || '00:00'}`).getTime();
    return aTime - bTime;
  });
}
