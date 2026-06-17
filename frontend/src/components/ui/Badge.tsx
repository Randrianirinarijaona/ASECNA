import './Badge.css';

interface BadgeProps {
  variant?: 'active' | 'inactive' | 'admin' | 'client';
  children: React.ReactNode;
}

export function Badge({ variant = 'active', children }: BadgeProps) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}