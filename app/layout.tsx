import './globals.css';
import Script from 'next/script';
import AuthGate from './auth/AuthGate';

export const metadata = { title: 'SizeWise', description: 'Offline HVAC Suite' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0f1216" />
        {/* Load SQLite WASM loader if present (place sqlite3.js under public/sqlite) */}
        <Script src="/sqlite/sqlite3.js" strategy="beforeInteractive" />
      </head>
      <body>
        {/* Auth route guard */}
        <AuthGate />
        {children}
        {/* SW registration - only in web, not Electron */}
        <Script id="sw-reg" strategy="afterInteractive">{
          `if ('serviceWorker' in navigator && !window.electronAPI) { navigator.serviceWorker.register('/sw.js').catch(()=>{}); }`
        }</Script>
      </body>
    </html>
  );
}

