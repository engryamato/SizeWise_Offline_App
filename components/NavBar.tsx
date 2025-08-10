'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LicenseBadge from './LicenseBadge';

export default function NavBar() {
  const pathname = usePathname();
  return (
    <div className="topbar">
      <div className="row">
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <Link className="link" href="/dashboard" aria-current={pathname?.startsWith('/dashboard')?'page':undefined}>Dashboard</Link>
          <span className="muted">/</span>
          <Link className="link" href="/tools/air-duct-sizer" aria-current={pathname?.startsWith('/tools')?'page':undefined}>Air Duct Sizer</Link>
          <span className="muted">/</span>
          <Link className="link" href="/settings" aria-current={pathname==='/settings'?'page':undefined}>Settings</Link>
          <span className="muted">/</span>
          <Link className="link" href="/license" aria-current={pathname==='/license'?'page':undefined}>License</Link>
        </div>
        <LicenseBadge />
      </div>
    </div>
  );
}

