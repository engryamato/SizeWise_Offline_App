import './globals.css';
import Script from 'next/script';

export const metadata = { title: 'SizeWise', description: 'Offline HVAC Suite' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0f1216" />
        {/* Load SQLite WASM loader if present (place sqlite3.js under public/sqlite) */}
        <Script src="/sqlite/sqlite3.js" strategy="beforeInteractive" onError={() => { /* optional: ignore missing file in dev */ }} />
      </head>
      <body>
        {children}
        {/* SW registration */}
        <Script id="sw-reg" strategy="afterInteractive">{
          `if ('serviceWorker' in navigator) {             navigator.serviceWorker.register('/sw.js').catch(()=>{});           }`
        }</Script>
      </body>
    </html>
  );
}

