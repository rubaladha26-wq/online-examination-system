import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are no items to display right now.',
  action,
}) => {
  return (
    <div
      style={{
        padding: '3rem 1.5rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
          marginBottom: '0.5rem',
        }}
      >
        <Icon size={28} />
      </div>
      <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#334155' }}>{title}</h4>
      <p style={{ fontSize: '0.875rem', color: '#64748b', maxWidth: 420 }}>{description}</p>
      {action && <div style={{ marginTop: '0.5rem' }}>{action}</div>}
    </div>
  );
};

export default EmptyState;
