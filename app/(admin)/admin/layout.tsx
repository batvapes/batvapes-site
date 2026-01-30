import type { ReactNode } from "react";

export const runtime = "nodejs";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
