import Link from 'next/link';
export default function ToolCard({ title, subtitle, href, badge = 'Available' }: { title: string; subtitle: string; href: string; badge?: string; }) {
  return (
    <Link href={href} className="card">
      <div className="badge">{badge}</div>
      <h3>{title}</h3>
      <div className="muted">{subtitle}</div>
    </Link>
  );
}

