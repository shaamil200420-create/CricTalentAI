// Coach Schedule Management renders the ONE shared Schedule Management page
// (pages/shared/ScheduleManagement.jsx) — the exact same component Admin
// Schedule Management uses. Same header, same Create Schedule button, same
// All/Match/Training filters, same table, same Match/Training Schedule
// forms, same actions. Do not fork this file; edit the shared component so
// Admin and Coach stay pixel-identical. Permissions are enforced by the
// backend (require_staff allows Admin or Coach; Player stays read-only via
// its own My Schedule page), not by anything in this file.
export { default } from '../shared/ScheduleManagement.jsx';
