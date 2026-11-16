export function EmptyState({ title, description, action }) {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--slate-300)',
        padding: '48px 24px',
        textAlign: 'center',
        margin: '24px 0',
      }}
    >
      <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--navy-900)', marginBottom: 6 }}>
        {title || 'No records found'}
      </h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', maxWidth: 440, margin: '0 auto 16px' }}>
        {description || 'There are no items to display matching the current criteria.'}
      </p>
      {action}
    </div>
  );
}

export default EmptyState;
