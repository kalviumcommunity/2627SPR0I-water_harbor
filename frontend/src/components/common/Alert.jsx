export function Alert({ type = 'info', children, onClose }) {
  const styles = {
    error: {
      bg: 'var(--danger-50)',
      color: 'var(--danger-800)',
      border: '1px solid var(--danger-100)',
    },
    warning: {
      bg: 'var(--warning-50)',
      color: 'var(--warning-700)',
      border: '1px solid var(--warning-100)',
    },
    success: {
      bg: 'var(--success-50)',
      color: 'var(--success-800)',
      border: '1px solid var(--success-100)',
    },
    info: {
      bg: 'var(--primary-50)',
      color: 'var(--primary-800)',
      border: '1px solid var(--primary-100)',
    },
  };

  const current = styles[type] || styles.info;

  return (
    <div
      style={{
        backgroundColor: current.bg,
        color: current.color,
        border: current.border,
        padding: '12px 16px',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.875rem',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 16,
      }}
      role="alert"
    >
      <div style={{ flex: 1 }}>{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            fontSize: '1rem',
            lineHeight: 1,
          }}
          aria-label="Dismiss alert"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default Alert;
