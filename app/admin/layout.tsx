import type { Metadata } from 'next';

// Staff-only page with a sign-in form: never index it (robots.txt's '/admin/' rule does not
// match '/admin' itself).
export const metadata: Metadata = {
  title: 'Admin — findme.hair',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
