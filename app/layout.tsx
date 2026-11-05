import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RELAT3 - Meeting & Action Planner',
  description: 'Meeting Notes & Action Items Planner for Everyday Chaos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="bg-[#F3E9E2] text-[#4A1E0D] antialiased">
        <main>{children}</main>
      </body>
    </html>
  );
}