import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: `Where to Buy — ${process.env.CLIENT_NAME?.trim() || 'Nature’s Variety'}`,
  description: 'Where-to-Buy campaign performance: landing page, widget, retailers.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700&family=Nunito+Sans:opsz,wght@6..12,400;6..12,500;6..12,600;6..12,700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
