import './Spinner.css';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  overlay?: boolean;
}

export function Spinner({ size = 'md', label, overlay = false }: SpinnerProps) {
  const el = (
    <div className={`spinner-wrapper spinner-wrapper--${size}`} role="status" aria-label={label || 'Loading…'}>
      <div className={`spinner spinner--${size}`} />
      {label && <span className="spinner-label">{label}</span>}
    </div>
  );

  if (overlay) {
    return <div className="spinner-overlay">{el}</div>;
  }
  return el;
}