// app/page.tsx (or app/page.js)

import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/login');
  return null; // Not rendered, the user is immediately redirected
}
