import { initials } from '../utils/format.js';

/**
 * InitialAvatar — the circular initials-avatar used beside a person's name
 * in people tables/lists (old admin (4).html visual reference: circular
 * shape, subtle border, centered bold initials). Initials are always
 * DERIVED from the given name (first letter of first + last name) — never
 * hardcoded per-person — so this stays correct for any Admin/Coach/Player
 * record without extra data.
 *
 * Colours reuse the CURRENT CricTalentAI design tokens only (no palette
 * copied from the old HTML reference).
 */
export default function InitialAvatar({ name, size = 36 }) {
  return (
    <div
      className="person-avatar"
      style={{ width: size, height: size, fontSize: size <= 30 ? 11 : 12 }}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  );
}

/** PersonRow — avatar + name, spaced/aligned per the old reference (12px gap, center-aligned). */
export function PersonRow({ name, size = 36, className = '' }) {
  return (
    <div className={`person-row ${className}`.trim()}>
      <InitialAvatar name={name} size={size} />
      <span className="person-name">{name}</span>
    </div>
  );
}
