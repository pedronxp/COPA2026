import Link from 'next/link';

type AdminTone = 'default' | 'ok' | 'warning' | 'danger' | 'neutral';

interface AdminPageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  children,
}: AdminPageHeaderProps) {
  return (
    <header className="admin-page-head">
      <div>
        <p>{eyebrow}</p>
        <h1>{title}</h1>
        {description && <span>{description}</span>}
      </div>
      {children && <div className="admin-page-actions">{children}</div>}
    </header>
  );
}

interface AdminPanelProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AdminPanel({
  title,
  description,
  action,
  children,
  className,
}: AdminPanelProps) {
  return (
    <section className={className ? `admin-panel ${className}` : 'admin-panel'}>
      {(title || description || action) && (
        <div className="admin-panel-head">
          <div>
            {title && <h2>{title}</h2>}
            {description && <p>{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

interface AdminMetricProps {
  href?: string;
  label: string;
  value: string | number;
  detail?: string;
  icon: string;
  tone?: AdminTone;
}

export function AdminMetric({
  href,
  label,
  value,
  detail,
  icon,
  tone = 'default',
}: AdminMetricProps) {
  const content = (
    <>
      <span className="admin-metric-icon">
        <i className={`bi ${icon}`} aria-hidden="true" />
      </span>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </>
  );
  const className = tone === 'default' ? 'admin-metric' : `admin-metric ${tone}`;

  if (href) {
    return (
      <Link className={className} href={href}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

interface AdminStatusBadgeProps {
  children: React.ReactNode;
  status?: string | null;
  tone?: AdminTone;
}

export function AdminStatusBadge({ children, status, tone }: AdminStatusBadgeProps) {
  const className = ['admin-badge', status, tone].filter(Boolean).join(' ');
  return <span className={className}>{children}</span>;
}

interface AdminEmptyStateProps {
  icon: string;
  title: string;
  description: string;
}

export function AdminEmptyState({ icon, title, description }: AdminEmptyStateProps) {
  return (
    <div className="admin-empty-state">
      <i className={`bi ${icon}`} aria-hidden="true" />
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}

interface AdminMetaListProps {
  items: Array<{
    label: string;
    value: React.ReactNode;
  }>;
}

export function AdminMetaList({ items }: AdminMetaListProps) {
  return (
    <dl className="admin-meta-list">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
