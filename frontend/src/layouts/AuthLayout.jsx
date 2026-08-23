import { Outlet } from 'react-router-dom';

// Minimal layout for the Login page — no sidebar, no top header, since
// Login.html itself is a single full-page hero + form.
export default function AuthLayout() {
  return <Outlet />;
}
