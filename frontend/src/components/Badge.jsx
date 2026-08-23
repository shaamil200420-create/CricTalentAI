import { classNames } from '../utils/format.js';

export function Badge({ tone = 'neutral', children, dot = false }) {
  return (
    <span className={classNames('badge', `badge-${tone}`)}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
}

const STATUS_TONE = {
  Active: 'primary',
  Inactive: 'neutral',
  'Left Academy': 'neutral',
  Pending: 'warn',
  PENDING: 'warn',
  Accepted: 'primary',
  ACCEPTED: 'primary',
  Rejected: 'error',
  REJECTED: 'error',
  Modified: 'info',
  MODIFIED: 'info',
  Win: 'primary',
  Loss: 'error',
  Tie: 'warn',
  'No Result': 'neutral',
  Ongoing: 'info',
  Upcoming: 'warn',
  Completed: 'neutral',
  'In Progress': 'info',
  Achieved: 'primary',
  Missed: 'error',
  'Not Started': 'neutral',
  Active_Plan: 'info',
  Ready: 'primary',
  High: 'error',
  Medium: 'warn',
  Low: 'info',
  Present: 'primary',
  Absent: 'error',
  Scheduled: 'info',
  Cancelled: 'error',
};

export function StatusBadge({ status }) {
  const tone = STATUS_TONE[status] || 'neutral';
  return <Badge tone={tone} dot>{status}</Badge>;
}
