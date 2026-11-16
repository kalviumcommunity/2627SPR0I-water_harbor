export function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 16px',
        color: 'var(--slate-500)',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          border: '3px solid var(--slate-200)',
          borderTopColor: 'var(--primary-600)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <p style={{ fontSize: '0.875rem' }}>{message}</p>
    </div>
  );
}

export default LoadingSpinner;
